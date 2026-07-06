"""
ml_model.py
-----------
Modèle IA de détection d'anomalies basé sur Isolation Forest.

Isolation Forest est un algorithme non supervisé particulièrement adapté
à la détection d'anomalies car :
  1. Il ne nécessite pas de données étiquetées (pas besoin de savoir
     a priori ce qu'est une attaque).
  2. Il est rapide même sur de grands datasets.
  3. Il fonctionne bien sur des données tabulaires comme le trafic réseau.

Principe : les anomalies sont des points faciles à "isoler" dans l'espace
des features — l'arbre les sépare en peu de divisions.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder


# Contamination = proportion d'anomalies supposée dans les données (5 %)
CONTAMINATION = 0.05

# Features utilisées pour l'entraînement du modèle
FEATURE_COLS = [
    "src_port",
    "dst_port",
    "bytes_sent",
    "duration",
    "packets",
    "protocol_enc",     # protocole encodé numériquement
    "bytes_per_packet", # feature dérivée : volume par paquet
    "port_ratio",       # feature dérivée : rapport src/dst port
]


def _engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Crée des features supplémentaires à partir des données brutes.
    Ces features aident le modèle à mieux discriminer les anomalies.
    """
    df = df.copy()

    # Encodage du protocole (TCP=0, UDP=1, ICMP=2, etc.)
    le = LabelEncoder()
    df["protocol_enc"] = le.fit_transform(df["protocol"].astype(str))

    # Trafic moyen par paquet
    df["bytes_per_packet"] = df["bytes_sent"] / df["packets"].clip(lower=1)

    # Rapport des ports (détecte les scans : src_port élevé, dst_port bas)
    df["port_ratio"] = df["src_port"] / (df["dst_port"].clip(lower=1))

    return df


def train_and_predict(records: list[dict]) -> list[dict]:
    """
    Entraîne un modèle Isolation Forest sur les données fournies,
    puis retourne les prédictions enrichies d'un score d'anomalie.

    Args:
        records: liste de dicts représentant des entrées de trafic réseau.

    Returns:
        La même liste enrichie de :
          - "is_anomaly" (bool)
          - "score"      (float, entre -1 et 0 ; plus négatif = plus anormal)
    """
    if not records:
        return []

    df = pd.DataFrame(records)
    df = _engineer_features(df)

    # Extraction de la matrice de features
    X = df[FEATURE_COLS].fillna(0).values

    # Entraînement du modèle
    model = IsolationForest(
        n_estimators=150,
        contamination=CONTAMINATION,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X)

    # Prédictions : -1 = anomalie, +1 = normal
    predictions = model.predict(X)

    # Score de décision : plus négatif = plus anormal
    raw_scores = model.decision_function(X)

    # Normalisation du score entre 0 et 1 (1 = très anormal)
    min_score = raw_scores.min()
    max_score = raw_scores.max()
    range_score = max_score - min_score if max_score != min_score else 1.0
    normalized_scores = 1.0 - (raw_scores - min_score) / range_score

    # Injection des résultats dans les records
    result = []
    for i, record in enumerate(records):
        enriched = dict(record)
        enriched["is_anomaly"] = bool(predictions[i] == -1)
        enriched["score"]      = round(float(normalized_scores[i]), 4)
        result.append(enriched)

    return result


def classify_alert(record: dict) -> dict | None:
    """
    Analyse un record marqué comme anomalie et détermine le type d'attaque
    et le niveau de sévérité.

    Règles heuristiques combinées au score IA :
      - Score élevé + petit paquet + port bas → scan de ports
      - Score élevé + port 22 + plusieurs connexions → brute-force
      - Score élevé + UDP + gros volume → DDoS
      - Sinon → anomalie générique

    Returns:
        Dict contenant alert_type, severity et description, ou None.
    """
    if not record.get("is_anomaly"):
        return None

    score      = record.get("score", 0)
    dst_port   = record.get("dst_port", 0)
    bytes_sent = record.get("bytes_sent", 0)
    packets    = record.get("packets", 0)
    protocol   = record.get("protocol", "TCP")

    # --- Détection du type d'attaque ----------------------------------------
    if bytes_sent < 200 and packets <= 2 and dst_port < 1024:
        alert_type  = "port_scan"
        description = (
            f"Scan de port détecté depuis {record['src_ip']} "
            f"vers le port {dst_port}/{protocol}. "
            f"Trafic minimal caractéristique d'un scanner (nmap, masscan…)."
        )
    elif dst_port == 22 and packets <= 20 and bytes_sent < 1000:
        alert_type  = "brute_force"
        description = (
            f"Tentative de brute-force SSH depuis {record['src_ip']} "
            f"vers {record['dst_ip']}:{dst_port}. "
            f"Connexions répétitives avec faible volume de données."
        )
    elif protocol == "UDP" and bytes_sent > 5000 and packets > 50:
        alert_type  = "ddos"
        description = (
            f"Potentielle attaque DDoS UDP depuis {record['src_ip']} "
            f"({bytes_sent} octets, {packets} paquets). "
            f"Volume anormalement élevé vers {record['dst_ip']}."
        )
    else:
        alert_type  = "anomaly"
        description = (
            f"Comportement réseau anormal détecté depuis {record['src_ip']}. "
            f"Score d'anomalie IA : {score:.2f}. "
            f"Protocole {protocol}, port destination {dst_port}."
        )

    # --- Niveau de sévérité basé sur le score IA ----------------------------
    if score >= 0.85:
        severity = "critical"
    elif score >= 0.70:
        severity = "high"
    elif score >= 0.55:
        severity = "medium"
    else:
        severity = "low"

    return {
        "alert_type":  alert_type,
        "severity":    severity,
        "description": description,
        "score":       score,
    }
