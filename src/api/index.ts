/**
 * api/index.ts
 * ------------
 * Couche d'accès à l'API FastAPI backend.
 * Si le backend n'est pas disponible, des données simulées sont retournées
 * pour permettre la démonstration du dashboard en mode standalone.
 */

import type { Alert, Statistics, TrafficEntry } from '../types';

const BASE_URL = 'http://localhost:8000/api';

// Timeout pour détecter si le backend est hors ligne
const FETCH_TIMEOUT = 3000;

async function fetchWithTimeout(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    clearTimeout(id);
    throw new Error('Backend unavailable');
  }
}

// ---------------------------------------------------------------------------
// Données de démo (utilisées quand le backend Python n'est pas lancé)
// ---------------------------------------------------------------------------

function generateMockIp(internal = false): string {
  if (internal) return `192.168.1.${Math.floor(Math.random() * 20) + 1}`;
  const pools = ['203.0.113', '198.51.100', '91.108.4', '45.33.32'];
  return `${pools[Math.floor(Math.random() * pools.length)]}.${Math.floor(Math.random() * 254) + 1}`;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMockTraffic(count = 80): TrafficEntry[] {
  const protocols = ['TCP', 'UDP', 'ICMP', 'TCP', 'TCP', 'UDP'];
  const normalPorts = [80, 443, 53, 22, 25, 8080, 3306];
  const entries: TrafficEntry[] = [];

  for (let i = 0; i < count; i++) {
    const isAnomaly = Math.random() < 0.12;
    const score = isAnomaly ? 0.55 + Math.random() * 0.45 : Math.random() * 0.4;
    const now = new Date(Date.now() - i * 9000);

    entries.push({
      id: i + 1,
      timestamp: now.toISOString(),
      src_ip: generateMockIp(true),
      dst_ip: isAnomaly ? `10.0.0.${Math.floor(Math.random() * 50) + 100}` : generateMockIp(),
      protocol: randomChoice(protocols),
      src_port: Math.floor(Math.random() * 55000) + 1024,
      dst_port: isAnomaly ? Math.floor(Math.random() * 1024) : randomChoice(normalPorts),
      bytes_sent: isAnomaly ? Math.floor(Math.random() * 200) + 40 : Math.floor(Math.random() * 50000) + 500,
      duration: isAnomaly ? Math.random() * 0.01 : Math.random() * 2 + 0.1,
      packets: isAnomaly ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 80) + 5,
      is_anomaly: isAnomaly ? 1 : 0,
      score: Math.round(score * 10000) / 10000,
    });
  }
  return entries;
}

export function generateMockAlerts(count = 25): Alert[] {
  const alertTypes = ['port_scan', 'brute_force', 'ddos', 'anomaly'] as const;
  const severities = ['low', 'medium', 'high', 'critical'] as const;
  const severityWeights = [4, 3, 2, 1]; // low plus fréquent
  const alerts: Alert[] = [];

  const weightedSeverity = () => {
    const total = severityWeights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < severities.length; i++) {
      r -= severityWeights[i];
      if (r <= 0) return severities[i];
    }
    return severities[0];
  };

  for (let i = 0; i < count; i++) {
    const type = randomChoice([...alertTypes]);
    const severity = weightedSeverity();
    const srcIp = generateMockIp(true);
    const dstIp = generateMockIp();
    const score = 0.5 + Math.random() * 0.5;

    const descriptions: Record<typeof type, string> = {
      port_scan:   `Scan de ports détecté depuis ${srcIp} vers ${dstIp}. Trafic minimal typique d'un scanner.`,
      brute_force: `Tentative de brute-force SSH depuis ${srcIp}. Connexions répétitives sur port 22.`,
      ddos:        `Potentielle attaque DDoS UDP depuis ${srcIp}. Volume anormalement élevé vers ${dstIp}.`,
      anomaly:     `Comportement réseau anormal détecté depuis ${srcIp}. Score IA : ${score.toFixed(2)}.`,
    };

    alerts.push({
      id: i + 1,
      timestamp: new Date(Date.now() - i * 72000).toISOString(),
      traffic_id: i + 1,
      src_ip: srcIp,
      dst_ip: dstIp,
      alert_type: type,
      severity,
      description: descriptions[type],
      score: Math.round(score * 10000) / 10000,
    });
  }

  return alerts;
}

export function generateMockStats(): Statistics {
  const now = new Date();
  const timeline = Array.from({ length: 30 }, (_, i) => {
    const t = new Date(now.getTime() - (29 - i) * 60000);
    const total = Math.floor(Math.random() * 15) + 5;
    return {
      time: t.toTimeString().slice(0, 5),
      total,
      anomalies: Math.floor(Math.random() * 4),
    };
  });

  return {
    total_traffic: 312,
    total_anomalies: 38,
    total_alerts: 25,
    critical_alerts: 4,
    anomaly_rate: 12.18,
    protocols: [
      { protocol: 'TCP',  count: 185 },
      { protocol: 'UDP',  count: 89 },
      { protocol: 'ICMP', count: 38 },
    ],
    alerts_by_severity: { low: 8, medium: 8, high: 5, critical: 4 },
    alerts_by_type: [
      { type: 'port_scan',   count: 10 },
      { type: 'brute_force', count: 7 },
      { type: 'anomaly',     count: 5 },
      { type: 'ddos',        count: 3 },
    ],
    timeline,
  };
}

// ---------------------------------------------------------------------------
// Appels API réels (avec fallback sur les données mock)
// ---------------------------------------------------------------------------

export async function fetchStatistics(): Promise<{ data: Statistics; isMock: boolean }> {
  try {
    const data = await fetchWithTimeout(`${BASE_URL}/statistics`);
    return { data, isMock: false };
  } catch {
    return { data: generateMockStats(), isMock: true };
  }
}

export async function fetchTraffic(limit = 100, anomalyOnly = false): Promise<{ data: TrafficEntry[]; total: number; isMock: boolean }> {
  try {
    const url = `${BASE_URL}/traffic?limit=${limit}&anomaly_only=${anomalyOnly}`;
    const res = await fetchWithTimeout(url);
    return { data: res.data, total: res.total, isMock: false };
  } catch {
    const mock = generateMockTraffic(80);
    const filtered = anomalyOnly ? mock.filter(t => t.is_anomaly === 1) : mock;
    return { data: filtered, total: filtered.length, isMock: true };
  }
}

export async function fetchAlerts(limit = 50): Promise<{ data: Alert[]; total: number; isMock: boolean }> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/alerts?limit=${limit}`);
    return { data: res.data, total: res.total, isMock: false };
  } catch {
    const mock = generateMockAlerts(25);
    return { data: mock, total: mock.length, isMock: true };
  }
}

export async function triggerAnalysis(nNormal = 200, nAttacks = 3) {
  const res = await fetchWithTimeout(`${BASE_URL}/analyze?n_normal=${nNormal}&n_attacks=${nAttacks}`, {
    method: 'POST',
  });
  return res;
}
