import { AlertTriangle, Zap, Shield, TrendingUp, Clock } from 'lucide-react';
import type { Alert, Severity } from '../types';

interface RecentAlertsWidgetProps {
  alerts: Alert[];
}

const SEVERITY_CONFIG: Record<Severity, {
  label: string;
  badge: string;
  icon: React.FC<{ size?: number; className?: string }>;
  dotColor: string;
}> = {
  critical: {
    label: 'Critique',
    badge: 'bg-red-900/40 text-red-300 border border-red-700/50',
    icon: Zap,
    dotColor: 'bg-red-500',
  },
  high: {
    label: 'Élevée',
    badge: 'bg-orange-900/40 text-orange-300 border border-orange-700/50',
    icon: AlertTriangle,
    dotColor: 'bg-orange-500',
  },
  medium: {
    label: 'Moyenne',
    badge: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50',
    icon: Shield,
    dotColor: 'bg-yellow-500',
  },
  low: {
    label: 'Faible',
    badge: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50',
    icon: Shield,
    dotColor: 'bg-emerald-500',
  },
};

const TYPE_LABELS: Record<string, string> = {
  port_scan: 'Scan de ports',
  brute_force: 'Brute Force',
  ddos: 'Attaque DDoS',
  anomaly: 'Anomalie IA',
};

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
}

export default function RecentAlertsWidget({ alerts }: RecentAlertsWidgetProps) {
  const recent = alerts.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-cyber-text mb-4">Alertes Récentes</h3>
        <div className="text-center py-8">
          <Shield size={24} className="mx-auto text-emerald-400/30 mb-2" />
          <p className="text-sm text-cyber-textDim">Aucune alerte pour le moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
      {/* En-tête */}
      <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
            <TrendingUp size={16} className="text-cyber-cyan" />
            Alertes Récentes
          </h3>
          <p className="text-xs text-cyber-textDim mt-0.5">
            {recent.length} alerte(s) détectée(s) récemment
          </p>
        </div>
        <div className="text-xs text-cyber-textDim flex items-center gap-1">
          <Clock size={12} />
          Temps réel
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyber-border bg-cyber-surface/30">
              <th className="px-6 py-3 text-left text-xs font-semibold text-cyber-textDim uppercase tracking-wider">
                Heure
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-cyber-textDim uppercase tracking-wider">
                IP Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-cyber-textDim uppercase tracking-wider">
                IP Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-cyber-textDim uppercase tracking-wider">
                Type d'attaque
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-cyber-textDim uppercase tracking-wider">
                Gravité
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-cyber-textDim uppercase tracking-wider">
                Score IA
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-border">
            {recent.map((alert, idx) => {
              const cfg = SEVERITY_CONFIG[alert.severity];
              const Icon = cfg.icon;
              const score = Math.round(alert.score * 100);

              return (
                <tr
                  key={alert.id}
                  className={`
                    hover:bg-white/[0.02] transition-colors
                    ${alert.severity === 'critical' ? 'bg-red-950/5' : ''}
                    ${idx === 0 ? 'border-t-2 border-cyber-cyan/20' : ''}
                  `}
                >
                  {/* Heure */}
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-cyber-textDim font-mono flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} animate-pulse`} />
                      {formatTime(alert.timestamp)}
                    </span>
                  </td>

                  {/* IP Source */}
                  <td className="px-6 py-3.5">
                    <span className="font-code text-cyber-cyan text-xs">{alert.src_ip}</span>
                  </td>

                  {/* IP Destination */}
                  <td className="px-6 py-3.5">
                    <span className="font-code text-cyber-textDim text-xs">{alert.dst_ip}</span>
                  </td>

                  {/* Type d'attaque */}
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-cyber-text">
                      {TYPE_LABELS[alert.alert_type] ?? alert.alert_type}
                    </span>
                  </td>

                  {/* Gravité */}
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}
                    >
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                  </td>

                  {/* Score IA */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-12 h-1 bg-cyber-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${score}%`,
                            backgroundColor:
                              score >= 85 ? '#ff4757' :
                              score >= 70 ? '#ff6b35' :
                              score >= 55 ? '#ffd700' : '#00ff88',
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-cyber-textDim w-8 text-right">
                        {score}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pied de page */}
      <div className="px-6 py-3 bg-cyber-surface/20 border-t border-cyber-border">
        <a
          href="#alerts"
          className="text-xs text-cyber-cyan hover:text-cyan-300 transition-colors font-medium"
        >
          Voir toutes les alertes →
        </a>
      </div>
    </div>
  );
}
