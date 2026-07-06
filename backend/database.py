"""
database.py
-----------
Gestion de la base de données SQLite.
Crée les tables si elles n'existent pas encore.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "ids.db")


def get_connection() -> sqlite3.Connection:
    """Retourne une connexion SQLite avec les lignes sous forme de dict."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialise le schéma de la base de données."""
    conn = get_connection()
    cursor = conn.cursor()

    # Table qui stocke chaque paquet réseau analysé
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS traffic (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT    NOT NULL,
            src_ip      TEXT    NOT NULL,
            dst_ip      TEXT    NOT NULL,
            protocol    TEXT    NOT NULL,
            src_port    INTEGER NOT NULL,
            dst_port    INTEGER NOT NULL,
            bytes_sent  INTEGER NOT NULL,
            duration    REAL    NOT NULL,
            packets     INTEGER NOT NULL,
            is_anomaly  INTEGER NOT NULL DEFAULT 0,  -- 0 = normal, 1 = anomalie
            score       REAL    NOT NULL DEFAULT 0.0  -- score Isolation Forest
        )
    """)

    # Table des alertes générées par le modèle IA
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT    NOT NULL,
            traffic_id  INTEGER NOT NULL,
            src_ip      TEXT    NOT NULL,
            dst_ip      TEXT    NOT NULL,
            alert_type  TEXT    NOT NULL,   -- port_scan | brute_force | ddos | anomaly
            severity    TEXT    NOT NULL,   -- low | medium | high | critical
            description TEXT    NOT NULL,
            score       REAL    NOT NULL,
            FOREIGN KEY (traffic_id) REFERENCES traffic(id)
        )
    """)

    conn.commit()
    conn.close()
    print("[DB] Base de données initialisée.")
