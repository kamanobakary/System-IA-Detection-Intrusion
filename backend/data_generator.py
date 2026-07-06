"""
data_generator.py
-----------------
Génère un trafic réseau simulé réaliste contenant :
  - du trafic normal (navigation web, DNS, mail…)
  - du trafic suspect (scans de ports, tentatives brute-force, DDoS)

Les données sont renvoyées sous forme de liste de dict, prêtes à être
insérées dans la base de données et analysées par le modèle IA.
"""

import random
import numpy as np
from datetime import datetime, timedelta


# --- Plages d'IPs fictives --------------------------------------------------

INTERNAL_IPS = [f"192.168.1.{i}" for i in range(1, 20)]
EXTERNAL_IPS = [
    "203.0.113.42", "198.51.100.7", "185.220.101.5",
    "91.108.4.11",  "45.33.32.156", "104.21.15.89",
    "172.67.68.200","8.8.8.8",      "1.1.1.1",
]
ATTACKER_IPS = [
    "10.0.0.99",    "172.16.0.200", "192.168.100.254",
    "203.0.113.100","198.51.100.200",
]


# --- Profils de trafic normal -----------------------------------------------

NORMAL_PROFILES = [
    # (nom, protocole, port_src_range, port_dst, bytes_range, duration_range, packets_range)
    ("HTTP",    "TCP",  (1024, 65535), 80,   (500, 50_000),  (0.1, 2.0),  (5, 50)),
    ("HTTPS",   "TCP",  (1024, 65535), 443,  (1000, 100_000),(0.1, 3.0),  (10, 100)),
    ("DNS",     "UDP",  (1024, 65535), 53,   (50, 300),      (0.01, 0.1), (1, 3)),
    ("SSH",     "TCP",  (1024, 65535), 22,   (200, 5_000),   (1.0, 60.0), (20, 200)),
    ("SMTP",    "TCP",  (1024, 65535), 25,   (300, 10_000),  (0.5, 5.0),  (10, 80)),
    ("FTP",     "TCP",  (1024, 65535), 21,   (100, 2_000),   (0.2, 10.0), (5, 40)),
    ("ICMP",    "ICMP", (0, 0),        0,    (28, 1500),     (0.001, 0.5),(1, 5)),
]


# --- Profils d'attaques simulées --------------------------------------------

def _generate_port_scan(attacker: str, target: str, ts: datetime) -> list[dict]:
    """Scan de ports : connexions rapides vers de nombreux ports différents."""
    entries = []
    for _ in range(random.randint(30, 80)):
        entries.append({
            "timestamp":  ts.isoformat(),
            "src_ip":     attacker,
            "dst_ip":     target,
            "protocol":   "TCP",
            "src_port":   random.randint(40000, 60000),
            "dst_port":   random.randint(1, 1024),
            "bytes_sent": random.randint(40, 80),     # paquets très petits
            "duration":   round(random.uniform(0.001, 0.01), 4),
            "packets":    random.randint(1, 2),
        })
    return entries


def _generate_brute_force(attacker: str, target: str, ts: datetime) -> list[dict]:
    """Brute-force SSH : nombreuses connexions vers le port 22."""
    entries = []
    for _ in range(random.randint(20, 50)):
        entries.append({
            "timestamp":  ts.isoformat(),
            "src_ip":     attacker,
            "dst_ip":     target,
            "protocol":   "TCP",
            "src_port":   random.randint(40000, 60000),
            "dst_port":   22,
            "bytes_sent": random.randint(200, 600),
            "duration":   round(random.uniform(0.05, 0.5), 4),
            "packets":    random.randint(5, 15),
        })
    return entries


def _generate_ddos(attacker: str, target: str, ts: datetime) -> list[dict]:
    """DDoS UDP : volume énorme de paquets UDP."""
    entries = []
    for _ in range(random.randint(50, 120)):
        entries.append({
            "timestamp":  ts.isoformat(),
            "src_ip":     attacker,
            "dst_ip":     target,
            "protocol":   "UDP",
            "src_port":   random.randint(1024, 65535),
            "dst_port":   random.choice([80, 443, 53]),
            "bytes_sent": random.randint(1000, 65000),  # gros paquets
            "duration":   round(random.uniform(0.001, 0.05), 4),
            "packets":    random.randint(100, 500),      # beaucoup de paquets
        })
    return entries


# --- Générateur principal ---------------------------------------------------

def generate_traffic(n_normal: int = 200, n_attacks: int = 3) -> list[dict]:
    """
    Génère un batch de trafic simulé.

    Args:
        n_normal:  nombre de paquets normaux à générer
        n_attacks: nombre de séquences d'attaques à injecter

    Returns:
        Liste de dicts représentant des entrées de trafic réseau.
    """
    entries: list[dict] = []
    base_time = datetime.now() - timedelta(minutes=30)

    # --- Trafic normal -------------------------------------------------------
    for i in range(n_normal):
        ts = base_time + timedelta(seconds=i * 9)
        profile = random.choice(NORMAL_PROFILES)
        name, proto, src_range, dst_port, bytes_range, dur_range, pkt_range = profile

        src_ip  = random.choice(INTERNAL_IPS)
        dst_ip  = random.choice(EXTERNAL_IPS + INTERNAL_IPS)
        src_port = random.randint(*src_range) if src_range != (0, 0) else 0

        entries.append({
            "timestamp":  ts.isoformat(),
            "src_ip":     src_ip,
            "dst_ip":     dst_ip,
            "protocol":   proto,
            "src_port":   src_port,
            "dst_port":   dst_port,
            "bytes_sent": int(np.random.uniform(*bytes_range)),
            "duration":   round(np.random.uniform(*dur_range), 4),
            "packets":    random.randint(*pkt_range),
        })

    # --- Injections d'attaques -----------------------------------------------
    attack_generators = [_generate_port_scan, _generate_brute_force, _generate_ddos]

    for _ in range(n_attacks):
        attacker = random.choice(ATTACKER_IPS)
        target   = random.choice(INTERNAL_IPS)
        ts       = base_time + timedelta(seconds=random.randint(60, 1600))
        gen_fn   = random.choice(attack_generators)
        entries.extend(gen_fn(attacker, target, ts))

    # Mélange pour un ordre chronologique réaliste
    random.shuffle(entries)
    return entries
