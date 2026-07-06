import { useMemo } from 'react';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';
import type { Alert } from '../types';

interface TopSuspiciousIpsProps {
  alerts: Alert[];
}

interface IpStat {
  ip: string;
  count: number;
  maxSeverity: string;
  types: string[];
  lastSeen: string;
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const SEVERITY_STYLE: Record<string, { bar: string; text: string; bg: string }> = {
  critical: { bar: 'bg-red-500',    text: 'text-red-400',    bg: 'bg-red-900/30 border-red-700/40' },
  high:     { bar: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-700/40' },
  medium:   { bar: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-700/40' },
  low:      { bar: 'bg-emerald-500',text: 'text-emerald-400',bg: 'bg-emerald-900/30 border-emerald-700/40' },
};

const TYPE_SHORT: Record<string, string> = {
  port_scan:   'Scan',
  brute_force: 'BF',
  ddos:        'DDoS',
  anomaly:     'Anomalie',
};

/* Données de démo utilisées si la liste d'alertes est vide */
const DEMO_IPS: IpStat[] = [
  { ip: '10.0.0.99',       count: 47, maxSeverity: 'critical', types: ['Scan', 'BF'],    lastSeen: 'Il y a 2m'  },
  { ip: '172.16.0.200',    count: 31, maxSeverity: 'high',     types: ['DDoS'],          lastSeen: 'Il y a 5m'  },
  { ip: '192.168.100.254', count: 24, maxSeverity: 'high',     types: ['BF', 'Anomalie'],lastSeen: 'Il y a 9m'  },
  { ip: '203.0.113.100',   count: 18, maxSeverity: 'medium',   types: ['Scan'],          lastSeen: 'Il y a 15m' },
  { ip: '198.51.100.200',  count: 9,  maxSeverity: 'low',      types: ['Anomalie'],      lastSeen: 'Il y a 28m' },
];

export default function TopSuspiciousIps({ alerts }: TopSuspiciousIpsProps) {
  // Agrège les alertes par IP source
  const topIps: IpStat[] = useMemo(() => {
    if (alerts.length === 0) return DEMO_IPS;

    const map = new Map<string, IpStat>();

    for (const a of alerts) {
      const existing = map.get(a.src_ip);
      const typShort = TYPE_SHORT[a.alert_type] ?? a.alert_type;

      if (existing) {
        existing.count++;
        if ((SEVERITY_ORDER[a.severity] ?? 0) > (SEVERITY_ORDER[existing.maxSeverity] ?? 0)) {
          existing.maxSeverity = a.severity;
        }
        if (!existing.types.includes(typShort)) existing.types.push(typShort);
        existing.lastSeen = a.timestamp;
      } else {
        map.set(a.src_ip, {
          ip:          a.src_ip,
          count:       1,
          maxSeverity: a.severity,
          types:       [typShort],
          lastSeen:    a.timestamp,
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [alerts]);

  const maxCount = topIps[0]?.count ?? 1;

  function formatSeen(ts: string): string {
    if (ts.startsWith('Il y a')) return ts;
    try {
      const d = new Date(ts);
      const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins}m`;
      return `Il y a ${Math.floor(diffMins / 60)}h`;
    } catch {
      return ts;
    }
  }

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
      {/* En-tête */}
      <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
            <Target size={16} className="text-red-400" />
            Top IP Suspectes
          </h3>
          <p className="text-xs text-cyber-textDim mt-0.5">
            Sources les plus actives détectées par le modèle IA
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-cyber-textDim">
          <TrendingUp size={12} />
          Top 5
        </div>
      </div>

      {/* Liste */}
      <div className="divide-y divide-cyber-border">
        {topIps.map((item, idx) => {
          const style = SEVERITY_STYLE[item.maxSeverity] ?? SEVERITY_STYLE.low;
          const pct = Math.round((item.count / maxCount) * 100);

          return (
            <div
              key={item.ip}
              className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
            >
              {/* Rang */}
              <div className={`
                w-7 h-7 rounded-lg flex items-center justify-center
                text-xs font-bold font-mono flex-shrink-0
                ${idx === 0 ? 'bg-red-900/50 text-red-400 border border-red-700/50' : 'bg-cyber-surface text-cyber-textDim border border-cyber-border'}
              `}>
                {idx + 1}
              </div>

              {/* IP + types */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-code text-cyber-cyan text-xs">{item.ip}</span>
                  {item.types.map(t => (
                    <span
                      key={t}
                      className="text-xs px-1.5 py-0.5 bg-cyber-surface border border-cyber-border rounded text-cyber-textDim font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Barre de progression */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 bg-cyber-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-cyber-textDim w-12 text-right">
                    {item.count} alert.
                  </span>
                </div>
              </div>

              {/* Sévérité + dernière vue */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${style.bg} ${style.text}`}>
                  {item.maxSeverity.charAt(0).toUpperCase() + item.maxSeverity.slice(1)}
                </span>
                <span className="text-xs text-cyber-textDim font-mono">
                  {formatSeen(item.lastSeen)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pied */}
      <div className="px-6 py-3 bg-cyber-surface/20 border-t border-cyber-border flex items-center gap-2">
        <AlertTriangle size={11} className="text-yellow-400" />
        <span className="text-xs text-cyber-textDim">
          Données calculées sur la période d'analyse en cours
        </span>
      </div>
    </div>
  );
}
