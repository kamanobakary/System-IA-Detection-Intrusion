// Types TypeScript partagés dans toute l'application

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'port_scan' | 'brute_force' | 'ddos' | 'anomaly';
export type Protocol = 'TCP' | 'UDP' | 'ICMP' | string;

export interface TrafficEntry {
  id: number;
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  protocol: Protocol;
  src_port: number;
  dst_port: number;
  bytes_sent: number;
  duration: number;
  packets: number;
  is_anomaly: number; // 0 ou 1 (SQLite)
  score: number;
}

export interface Alert {
  id: number;
  timestamp: string;
  traffic_id: number;
  src_ip: string;
  dst_ip: string;
  alert_type: AlertType;
  severity: Severity;
  description: string;
  score: number;
}

export interface Statistics {
  total_traffic: number;
  total_anomalies: number;
  total_alerts: number;
  critical_alerts: number;
  anomaly_rate: number;
  protocols: { protocol: string; count: number }[];
  alerts_by_severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  alerts_by_type: { type: string; count: number }[];
  timeline: { time: string; total: number; anomalies: number }[];
}

export interface ApiResponse<T> {
  data: T;
  total: number;
  limit?: number;
  offset?: number;
}

export type ActiveView = 'dashboard' | 'traffic' | 'alerts' | 'analysis';
