"""
main.py
-------
API FastAPI pour le Système IA de Détection d'Intrusion (IDS-IA).

Endpoints disponibles :
  POST /api/analyze       - Génère du trafic simulé, l'analyse et stocke les résultats
  GET  /api/traffic       - Retourne la liste paginée du trafic analysé
  GET  /api/alerts        - Retourne la liste des alertes triées par sévérité
  GET  /api/statistics    - Retourne les statistiques globales du dashboard
  GET  /api/health        - Vérification de l'état de l'API

Lancer le serveur :
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional

from database import init_db, get_connection
from data_generator import generate_traffic
from ml_model import train_and_predict, classify_alert


# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------

app = FastAPI(
    title="IDS-IA API",
    description="API du Système IA de Détection d'Intrusion",
    version="1.0.0",
)

# Autorise les requêtes depuis le frontend React (localhost:5173 par défaut)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Création des tables SQLite au démarrage
init_db()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health_check():
    """Vérifie que l'API est opérationnelle."""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.post("/api/analyze")
def run_analysis(n_normal: int = 200, n_attacks: int = 3):
    """
    Lance une nouvelle session d'analyse :
      1. Génère du trafic réseau simulé
      2. Entraîne le modèle Isolation Forest et prédit les anomalies
      3. Génère les alertes correspondantes
      4. Stocke tout dans SQLite

    Paramètres query :
      n_normal  - nombre de paquets normaux (défaut 200)
      n_attacks - nombre de séquences d'attaque (défaut 3)
    """
    # 1. Génération du trafic simulé
    raw_traffic = generate_traffic(n_normal=n_normal, n_attacks=n_attacks)

    # 2. Détection d'anomalies par le modèle IA
    analyzed = train_and_predict(raw_traffic)

    # 3. Insertion en base de données
    conn = get_connection()
    cursor = conn.cursor()

    traffic_ids = []
    for entry in analyzed:
        cursor.execute("""
            INSERT INTO traffic
              (timestamp, src_ip, dst_ip, protocol, src_port, dst_port,
               bytes_sent, duration, packets, is_anomaly, score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            entry["timestamp"],
            entry["src_ip"],
            entry["dst_ip"],
            entry["protocol"],
            entry["src_port"],
            entry["dst_port"],
            entry["bytes_sent"],
            entry["duration"],
            entry["packets"],
            int(entry["is_anomaly"]),
            entry["score"],
        ))
        traffic_ids.append((cursor.lastrowid, entry))

    # 4. Génération et insertion des alertes
    alert_count = 0
    for tid, entry in traffic_ids:
        alert_info = classify_alert(entry)
        if alert_info:
            cursor.execute("""
                INSERT INTO alerts
                  (timestamp, traffic_id, src_ip, dst_ip, alert_type,
                   severity, description, score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                entry["timestamp"],
                tid,
                entry["src_ip"],
                entry["dst_ip"],
                alert_info["alert_type"],
                alert_info["severity"],
                alert_info["description"],
                alert_info["score"],
            ))
            alert_count += 1

    conn.commit()
    conn.close()

    anomaly_count = sum(1 for e in analyzed if e["is_anomaly"])

    return {
        "message":       "Analyse terminée avec succès",
        "total_traffic": len(analyzed),
        "anomalies":     anomaly_count,
        "alerts":        alert_count,
    }


@app.get("/api/traffic")
def get_traffic(
    limit:  int           = Query(default=100, ge=1, le=1000),
    offset: int           = Query(default=0,   ge=0),
    anomaly_only: bool    = Query(default=False),
):
    """
    Retourne la liste du trafic analysé.

    Paramètres query :
      limit        - nombre d'entrées à retourner (défaut 100)
      offset       - décalage pour la pagination (défaut 0)
      anomaly_only - si True, retourne uniquement les anomalies
    """
    conn = get_connection()
    cursor = conn.cursor()

    where = "WHERE is_anomaly = 1" if anomaly_only else ""
    cursor.execute(f"""
        SELECT * FROM traffic
        {where}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    """, (limit, offset))

    rows = [dict(row) for row in cursor.fetchall()]

    cursor.execute(f"SELECT COUNT(*) FROM traffic {where}")
    total = cursor.fetchone()[0]

    conn.close()
    return {"data": rows, "total": total, "limit": limit, "offset": offset}


@app.get("/api/alerts")
def get_alerts(
    limit:    int           = Query(default=50, ge=1, le=500),
    offset:   int           = Query(default=0,  ge=0),
    severity: Optional[str] = Query(default=None),
):
    """
    Retourne la liste des alertes, triées par sévérité décroissante.

    Paramètres query :
      severity - filtre optionnel : low | medium | high | critical
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Ordre de sévérité pour le tri
    severity_order = "CASE severity WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END"

    if severity:
        cursor.execute(f"""
            SELECT * FROM alerts
            WHERE severity = ?
            ORDER BY {severity_order} DESC, timestamp DESC
            LIMIT ? OFFSET ?
        """, (severity, limit, offset))
        cursor.execute("SELECT COUNT(*) FROM alerts WHERE severity = ?", (severity,))
    else:
        cursor.execute(f"""
            SELECT * FROM alerts
            ORDER BY {severity_order} DESC, timestamp DESC
            LIMIT ? OFFSET ?
        """, (limit, offset))
        cursor.execute("SELECT COUNT(*) FROM alerts")

    rows  = [dict(row) for row in cursor.fetchall()]
    total = cursor.fetchone()[0]

    conn.close()
    return {"data": rows, "total": total}


@app.get("/api/statistics")
def get_statistics():
    """
    Retourne les statistiques globales pour le dashboard :
      - totaux (trafic, anomalies, alertes)
      - répartition par protocole
      - répartition des alertes par sévérité et par type
      - évolution du trafic sur les 30 dernières minutes (par tranche de 5 min)
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Totaux globaux
    cursor.execute("SELECT COUNT(*) FROM traffic")
    total_traffic = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM traffic WHERE is_anomaly = 1")
    total_anomalies = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM alerts")
    total_alerts = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM alerts WHERE severity = 'critical'")
    critical_alerts = cursor.fetchone()[0]

    # Répartition des protocoles
    cursor.execute("""
        SELECT protocol, COUNT(*) as count
        FROM traffic
        GROUP BY protocol
        ORDER BY count DESC
    """)
    protocols = [{"protocol": r["protocol"], "count": r["count"]} for r in cursor.fetchall()]

    # Répartition des alertes par sévérité
    cursor.execute("""
        SELECT severity, COUNT(*) as count
        FROM alerts
        GROUP BY severity
    """)
    by_severity = {r["severity"]: r["count"] for r in cursor.fetchall()}

    # Répartition des alertes par type
    cursor.execute("""
        SELECT alert_type, COUNT(*) as count
        FROM alerts
        GROUP BY alert_type
        ORDER BY count DESC
    """)
    by_type = [{"type": r["alert_type"], "count": r["count"]} for r in cursor.fetchall()]

    # Trafic récent (dernières 30 min, regroupé par minute)
    cursor.execute("""
        SELECT
            strftime('%H:%M', timestamp) as minute,
            COUNT(*) as total,
            SUM(CASE WHEN is_anomaly = 1 THEN 1 ELSE 0 END) as anomalies
        FROM traffic
        WHERE timestamp >= datetime('now', '-30 minutes')
        GROUP BY minute
        ORDER BY minute ASC
        LIMIT 30
    """)
    timeline = [
        {"time": r["minute"], "total": r["total"], "anomalies": r["anomalies"]}
        for r in cursor.fetchall()
    ]

    conn.close()

    return {
        "total_traffic":   total_traffic,
        "total_anomalies": total_anomalies,
        "total_alerts":    total_alerts,
        "critical_alerts": critical_alerts,
        "anomaly_rate":    round(total_anomalies / max(total_traffic, 1) * 100, 2),
        "protocols":       protocols,
        "alerts_by_severity": {
            "low":      by_severity.get("low",      0),
            "medium":   by_severity.get("medium",   0),
            "high":     by_severity.get("high",     0),
            "critical": by_severity.get("critical", 0),
        },
        "alerts_by_type": by_type,
        "timeline":       timeline,
    }
