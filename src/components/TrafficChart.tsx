import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { Statistics } from '../types';

interface TrafficChartProps {
  stats: Statistics;
}

// Couleurs cohérentes avec la palette cybersécurité
const COLORS = {
  cyan:   '#00d4ff',
  red:    '#ff4757',
  green:  '#00ff88',
  yellow: '#ffd700',
  orange: '#ff6b35',
  muted:  '#4a6080',
};

const PIE_COLORS = [COLORS.cyan, COLORS.green, COLORS.muted, COLORS.yellow];

// Tooltip personnalisé (fond sombre)
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-cyber-card border border-cyber-border rounded-lg px-3 py-2 shadow-xl">
      {label && <p className="text-xs text-cyber-textDim mb-1 font-mono">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs font-mono" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

// Composant réutilisable pour les en-têtes de graphique
function ChartHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-cyber-text">{title}</h3>
      {subtitle && <p className="text-xs text-cyber-textDim mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function TrafficChart({ stats }: TrafficChartProps) {
  // Données pour le graphique en secteurs (protocoles)
  const protocolData = stats.protocols.map((p, i) => ({
    name: p.protocol,
    value: p.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // Données pour le graphique de sévérité
  const severityData = [
    { name: 'Faible',    value: stats.alerts_by_severity.low,      fill: COLORS.green  },
    { name: 'Moyen',     value: stats.alerts_by_severity.medium,   fill: COLORS.yellow },
    { name: 'Élevé',     value: stats.alerts_by_severity.high,     fill: COLORS.orange },
    { name: 'Critique',  value: stats.alerts_by_severity.critical, fill: COLORS.red    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

      {/* Graphique temporel du trafic */}
      <div className="xl:col-span-2 bg-cyber-card border border-cyber-border rounded-xl p-5">
        <ChartHeader
          title="Evolution du trafic reseau"
          subtitle="Trafic total vs anomalies détectées (30 dernières minutes)"
        />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stats.timeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.cyan} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gradAnomalies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.red} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.red} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#6b82a0', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#1e2d4a' }}
            />
            <YAxis
              tick={{ fill: '#6b82a0', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#6b82a0', paddingTop: '8px' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              name="Total"
              stroke={COLORS.cyan}
              strokeWidth={2}
              fill="url(#gradTotal)"
            />
            <Area
              type="monotone"
              dataKey="anomalies"
              name="Anomalies"
              stroke={COLORS.red}
              strokeWidth={2}
              fill="url(#gradAnomalies)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Répartition des protocoles */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
        <ChartHeader
          title="Repartition des protocoles"
          subtitle="Distribution du trafic par protocole"
        />
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={160}>
            <PieChart>
              <Pie
                data={protocolData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {protocolData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Légende manuelle */}
          <div className="flex-1 space-y-2">
            {protocolData.map(entry => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-cyber-textDim">{entry.name}</span>
                </div>
                <span className="text-xs font-mono text-cyber-text">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertes par sévérité */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
        <ChartHeader
          title="Alertes par severite"
          subtitle="Nombre d'alertes selon leur niveau de danger"
        />
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={severityData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b82a0', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1e2d4a' }}
            />
            <YAxis
              tick={{ fill: '#6b82a0', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Alertes" radius={[4, 4, 0, 0]}>
              {severityData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
