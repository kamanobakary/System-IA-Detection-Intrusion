import { useState } from 'react';
import { AlertTriangle, Zap, Shield, Search, Filter, ChevronDown } from 'lucide-react';
import type { Alert, Severity, AlertType } from '../types';

interface AlertsTableProps {
  alerts: Alert[];
  compact?: boolean;
}

const SEVERITY_CONFIG: Record<Severity, {
  label: string;
  className: string;
  dotClass: string;
  icon: React.FC<{ size?: number; className?: string }>;
}> = {
  low:      { label: 'Faible',   className: 'badge-low',      dotClass: 'bg-emerald-400', icon: Shield       },
  medium:   { label: 'Moyen',    className: 'badge-medium',   dotClass: 'bg-yellow-400',  icon: AlertTriangle },
  high:     { label: 'Elevé',    className: 'badge-high',     dotClass: 'bg-orange-400',  icon: AlertTriangle },
  critical: { label: 'Critique', className: 'badge-critical', dotClass: 'bg-red-400',     icon: Zap           },
};

const TYPE_LABELS: Record<AlertType, string> = {
  port_scan:   'Scan de ports',
  brute_force: 'Brute Force',
  ddos:        'Attaque DDoS',
  anomaly:     'Anomalie IA',
};

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return ts;
  }
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 85 ? '#ff4757' : pct >= 70 ? '#ff6b35' : pct >= 55 ? '#ffd700' : '#00ff88';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-cyber-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function AlertsTable({ alerts, compact = false }: AlertsTableProps) {
  const [search, setSearch]           = useState('');
  const [filterSeverity, setFilter]   = useState<Severity | 'all'>('all');
  const [expanded, setExpanded]       = useState<number | null>(null);

  const filtered = alerts.filter(a => {
    const matchSeverity = filterSeverity === 'all' || a.severity === filterSeverity;
    const matchSearch   = !search
      || a.src_ip.includes(search)
      || a.dst_ip.includes(search)
      || a.alert_type.includes(search.toLowerCase())
      || a.description.toLowerCase().includes(search.toLowerCase());
    return matchSeverity && matchSearch;
  });

  const displayedAlerts = compact ? filtered.slice(0, 8) : filtered;

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">

      {/* En-tête du tableau */}
      <div className="px-5 py-4 border-b border-cyber-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-cyber-text">Alertes de sécurité</h3>
            <p className="text-xs text-cyber-textDim mt-0.5">{filtered.length} alerte(s) affichée(s)</p>
          </div>
        </div>

        {!compact && (
          <div className="flex gap-3">
            {/* Barre de recherche */}
            <div className="flex-1 relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-textDim" />
              <input
                type="text"
                placeholder="Rechercher par IP, type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-cyber-surface border border-cyber-border rounded-lg
                           pl-8 pr-3 py-1.5 text-xs text-cyber-text placeholder-cyber-textDim
                           focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>

            {/* Filtre sévérité */}
            <div className="relative">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-textDim pointer-events-none" />
              <select
                value={filterSeverity}
                onChange={e => setFilter(e.target.value as Severity | 'all')}
                className="bg-cyber-surface border border-cyber-border rounded-lg
                           pl-8 pr-8 py-1.5 text-xs text-cyber-text
                           focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
              >
                <option value="all">Toutes sévérités</option>
                <option value="critical">Critique</option>
                <option value="high">Elevé</option>
                <option value="medium">Moyen</option>
                <option value="low">Faible</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyber-border">
              {['Sévérité', 'Type', 'IP Source', 'IP Destination', 'Score IA', 'Horodatage'].map(h => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-xs font-medium text-cyber-textDim uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
              {!compact && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {displayedAlerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-cyber-textDim text-sm">
                  Aucune alerte trouvée
                </td>
              </tr>
            ) : (
              displayedAlerts.map(alert => {
                const cfg  = SEVERITY_CONFIG[alert.severity];
                const Icon = cfg.icon;
                const isOpen = expanded === alert.id;

                return (
                  <>
                    <tr
                      key={alert.id}
                      className={`
                        border-b border-cyber-border/50
                        hover:bg-white/[0.02] transition-colors cursor-pointer
                        ${alert.severity === 'critical' ? 'alert-critical-pulse' : ''}
                      `}
                      onClick={() => !compact && setExpanded(isOpen ? null : alert.id)}
                    >
                      {/* Sévérité */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${cfg.className}`}>
                          <Icon size={10} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-cyber-text font-mono">
                          {TYPE_LABELS[alert.alert_type] ?? alert.alert_type}
                        </span>
                      </td>

                      {/* IP Source */}
                      <td className="px-4 py-3">
                        <span className="font-code text-cyber-cyan">{alert.src_ip}</span>
                      </td>

                      {/* IP Destination */}
                      <td className="px-4 py-3">
                        <span className="font-code text-cyber-textDim">{alert.dst_ip}</span>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3">
                        <ScoreBar score={alert.score} />
                      </td>

                      {/* Horodatage */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-cyber-textDim">
                          {formatTimestamp(alert.timestamp)}
                        </span>
                      </td>

                      {/* Expand */}
                      {!compact && (
                        <td className="px-4 py-3">
                          <ChevronDown
                            size={14}
                            className={`text-cyber-textDim transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </td>
                      )}
                    </tr>

                    {/* Ligne de description dépliable */}
                    {!compact && isOpen && (
                      <tr key={`${alert.id}-desc`} className="bg-cyber-surface/50">
                        <td colSpan={7} className="px-6 py-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dotClass}`} />
                            <p className="text-xs text-cyber-textDim leading-relaxed">
                              {alert.description}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
