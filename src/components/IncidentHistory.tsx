import { useMemo } from 'react';
import { History, Zap, AlertTriangle, Shield, GitMerge } from 'lucide-react';
import type { Alert, Severity } from '../types';

interface IncidentHistoryProps {
  alerts: Alert[];
}

const SEVERITY_ICON: Record<Severity, React.FC<{ size?: number; className?: string }>> = {
  critical: Zap,
  high:     AlertTriangle,
  medium:   AlertTriangle,
  low:      Shield,
};

const SEVERITY_STYLES: Record<Severity, { line: string; dot: string; icon: string; label: string }> = {
  critical: { line: 'border-red-700/40',    dot: 'bg-red-500 shadow-red-500/50',     icon: 'text-red-400',    label: 'Critique' },
  high:     { line: 'border-orange-700/40', dot: 'bg-orange-500 shadow-orange-500/50',icon: 'text-orange-400', label: 'Élevé'    },
  medium:   { line: 'border-yellow-700/40', dot: 'bg-yellow-500 shadow-yellow-500/50',icon: 'text-yellow-400', label: 'Moyen'    },
  low:      { line: 'border-emerald-700/40',dot: 'bg-emerald-500',                    icon: 'text-emerald-400',label: 'Faible'   },
};

const TYPE_LABELS: Record<string, string> = {
  port_scan:   'Scan de ports détecté',
  brute_force: 'Tentative brute-force',
  ddos:        'Attaque DDoS',
  anomaly:     'Anomalie comportementale',
};

/* Données de démo si aucune alerte */
const DEMO_INCIDENTS = [
  { id: 1, timestamp: new Date(Date.now() - 2  * 60000).toISOString(), src_ip: '10.0.0.99',       dst_ip: '192.168.1.5',  alert_type: 'port_scan',   severity: 'critical' as Severity, description: 'Scan intensif de 78 ports détecté en moins de 5 secondes.', score: 0.94 },
  { id: 2, timestamp: new Date(Date.now() - 7  * 60000).toISOString(), src_ip: '172.16.0.200',    dst_ip: '192.168.1.12', alert_type: 'ddos',        severity: 'high'     as Severity, description: 'Flood UDP avec 380 paquets/s vers le port 443.', score: 0.81 },
  { id: 3, timestamp: new Date(Date.now() - 15 * 60000).toISOString(), src_ip: '192.168.100.254', dst_ip: '192.168.1.8',  alert_type: 'brute_force', severity: 'high'     as Severity, description: '42 tentatives de connexion SSH échouées consécutives.', score: 0.76 },
  { id: 4, timestamp: new Date(Date.now() - 23 * 60000).toISOString(), src_ip: '203.0.113.100',   dst_ip: '192.168.1.3',  alert_type: 'anomaly',     severity: 'medium'   as Severity, description: 'Exfiltration de données suspectée, volume inhabituel sortant.', score: 0.62 },
  { id: 5, timestamp: new Date(Date.now() - 31 * 60000).toISOString(), src_ip: '198.51.100.200',  dst_ip: '192.168.1.14', alert_type: 'port_scan',   severity: 'low'      as Severity, description: 'Sondage discret sur ports connus (80, 443, 22, 3306).', score: 0.51 },
];

function formatTimestamp(ts: string): { date: string; time: string; relative: string } {
  try {
    const d = new Date(ts);
    const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
    const relative = diffMins < 1 ? 'À l\'instant'
      : diffMins < 60 ? `Il y a ${diffMins}m`
      : `Il y a ${Math.floor(diffMins / 60)}h`;

    return {
      date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      relative,
    };
  } catch {
    return { date: '', time: ts, relative: '' };
  }
}

export default function IncidentHistory({ alerts }: IncidentHistoryProps) {
  const incidents = useMemo(() => {
    const source = alerts.length >= 5 ? alerts : DEMO_INCIDENTS;
    return source.slice(0, 8);
  }, [alerts]);

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
      {/* En-tête */}
      <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
            <History size={16} className="text-cyber-cyan" />
            Historique des Incidents
          </h3>
          <p className="text-xs text-cyber-textDim mt-0.5">
            Chronologie des événements de sécurité détectés
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-cyber-textDim">
          <GitMerge size={12} />
          {incidents.length} événement(s)
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 py-5">
        <div className="relative">
          {/* Ligne verticale de la timeline */}
          <div className="absolute left-[13px] top-2 bottom-2 w-px bg-cyber-border" />

          <div className="space-y-6">
            {incidents.map((incident, idx) => {
              const sev    = SEVERITY_STYLES[incident.severity];
              const Icon   = SEVERITY_ICON[incident.severity];
              const ts     = formatTimestamp(incident.timestamp);
              const isLast = idx === incidents.length - 1;

              return (
                <div key={incident.id} className="relative flex gap-4">
                  {/* Point de timeline */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`
                        w-7 h-7 rounded-full flex items-center justify-center
                        border-2 ${sev.line} shadow-lg
                        ${sev.dot}
                        ${idx === 0 ? 'animate-pulse' : ''}
                      `}
                    >
                      <Icon size={12} className="text-white" />
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className={`flex-1 min-w-0 pb-1 ${!isLast ? '' : ''}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-cyber-text">
                          {TYPE_LABELS[incident.alert_type] ?? incident.alert_type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${sev.line} ${sev.icon} font-medium`}>
                          {sev.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-cyber-cyan">{ts.time}</p>
                        <p className="text-xs text-cyber-textDim">{ts.relative}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-cyber-textDim leading-relaxed mb-2">
                      {incident.description}
                    </p>

                    {/* Métadonnées */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-cyber-textDim">Src :</span>
                        <span className="font-code text-cyber-cyan">{incident.src_ip}</span>
                      </div>
                      <span className="text-cyber-border">→</span>
                      <div className="flex items-center gap-1">
                        <span className="text-cyber-textDim">Dst :</span>
                        <span className="font-code text-cyber-textDim">{incident.dst_ip}</span>
                      </div>
                      <div className="ml-auto flex items-center gap-1.5">
                        <div className="w-8 h-1 bg-cyber-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round(incident.score * 100)}%`,
                              backgroundColor: incident.score >= 0.85 ? '#ff4757'
                                : incident.score >= 0.70 ? '#ff6b35'
                                : incident.score >= 0.55 ? '#ffd700' : '#00ff88',
                            }}
                          />
                        </div>
                        <span className="font-mono text-cyber-textDim">
                          {Math.round(incident.score * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pied */}
      <div className="px-6 py-3 bg-cyber-surface/20 border-t border-cyber-border">
        <span className="text-xs text-cyber-textDim">
          Incidents classés par ordre chronologique décroissant
        </span>
      </div>
    </div>
  );
}
