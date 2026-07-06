import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Activity, Wifi, AlertOctagon } from 'lucide-react';

interface TrafficPoint {
  time: string;
  normal: number;
  anomalies: number;
  total: number;
}

/* -------------------------------------------------------------------------
 * Génération des données simulées sur les 20 dernières minutes
 * ---------------------------------------------------------------------- */
function buildHistory(): TrafficPoint[] {
  const now = new Date();
  const points: TrafficPoint[] = [];

  for (let i = 19; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60_000);
    const label = t.toTimeString().slice(0, 5);

    // Pic de trafic simulé entre la 8e et la 12e minute pour rendre le graphe plus réaliste
    const base = 40 + Math.round(Math.random() * 30);
    const spike = i >= 8 && i <= 12 ? Math.round(Math.random() * 60) : 0;
    const anomalies = i >= 8 && i <= 12
      ? Math.round(Math.random() * 20) + 4
      : Math.round(Math.random() * 5);
    const normal = base + spike;
    points.push({ time: label, normal, anomalies, total: normal + anomalies });
  }
  return points;
}

/* -------------------------------------------------------------------------
 * Tooltip personnalisé
 * ---------------------------------------------------------------------- */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl px-4 py-3 shadow-2xl min-w-[180px]">
      <p className="text-xs font-mono text-cyber-textDim mb-2 border-b border-cyber-border pb-2">
        {label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-cyber-textDim">{entry.name}</span>
          </div>
          <span className="text-xs font-mono font-bold" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Légende personnalisée
 * ---------------------------------------------------------------------- */
function CustomLegend({ payload }: any) {
  return (
    <div className="flex items-center justify-center gap-6 mt-2">
      {payload?.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-cyber-textDim">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Mini indicateur de statut en temps réel
 * ---------------------------------------------------------------------- */
function LiveBadge({ total, anomalies }: { total: number; anomalies: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-900/30 border border-cyan-700/40 rounded-full">
        <Wifi size={10} className="text-cyber-cyan animate-pulse" />
        <span className="text-xs font-mono text-cyber-cyan">
          {total} pkt/min
        </span>
      </div>
      {anomalies > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-900/30 border border-red-700/40 rounded-full">
          <AlertOctagon size={10} className="text-red-400" />
          <span className="text-xs font-mono text-red-400">
            {anomalies} anomalie(s)
          </span>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Composant principal
 * ---------------------------------------------------------------------- */
export default function NetworkTrafficChart() {
  const [data, setData] = useState<TrafficPoint[]>(() => buildHistory());
  const [attackMarker, setAttackMarker] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simule l'arrivée d'un nouveau point toutes les 10 secondes
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const label = now.toTimeString().slice(0, 5);

      setData(prev => {
        const last = prev[prev.length - 1];
        const isAttack = Math.random() < 0.15; // 15 % de chance d'attaque
        const normal = Math.round(40 + Math.random() * 50);
        const anomalies = isAttack ? Math.round(Math.random() * 25) + 8 : Math.round(Math.random() * 4);

        if (isAttack) setAttackMarker(label);
        else setAttackMarker(null);

        // Evite les doublons si la minute n'a pas changé
        if (last?.time === label) {
          return [
            ...prev.slice(0, -1),
            { time: label, normal: normal, anomalies, total: normal + anomalies },
          ];
        }

        return [
          ...prev.slice(-19), // Garde les 19 derniers + le nouveau
          { time: label, normal, anomalies, total: normal + anomalies },
        ];
      });
    }, 10_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const lastPoint = data[data.length - 1];
  const maxValue = Math.max(...data.map(d => d.total)) + 10;

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">

      {/* En-tête */}
      <div className="px-6 py-4 border-b border-cyber-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
            <Activity size={16} className="text-cyber-cyan" />
            Trafic Réseau
          </h3>
          <p className="text-xs text-cyber-textDim mt-0.5">
            Evolution en temps réel sur les 20 dernières minutes
          </p>
        </div>
        <LiveBadge total={lastPoint?.total ?? 0} anomalies={lastPoint?.anomalies ?? 0} />
      </div>

      {/* Graphique */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 24, left: -16, bottom: 0 }}
          >
            {/* Dégradés */}
            <defs>
              <filter id="glow-cyan">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-red">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 6"
              stroke="#1e2d4a"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              tick={{ fill: '#6b82a0', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#1e2d4a' }}
              interval="preserveStartEnd"
            />

            <YAxis
              domain={[0, maxValue]}
              tick={{ fill: '#6b82a0', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}`}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#1e2d4a', strokeWidth: 1.5, strokeDasharray: '4 4' }}
            />

            <Legend content={<CustomLegend />} />

            {/* Ligne de référence si attaque détectée */}
            {attackMarker && (
              <ReferenceLine
                x={attackMarker}
                stroke="#ff4757"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{
                  value: 'Attaque',
                  fill: '#ff4757',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                  position: 'top',
                }}
              />
            )}

            {/* Courbe trafic total */}
            <Line
              type="monotone"
              dataKey="total"
              name="Trafic total"
              stroke="#00d4ff"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#00d4ff', stroke: '#0a0e1a', strokeWidth: 2 }}
              filter="url(#glow-cyan)"
            />

            {/* Courbe trafic normal */}
            <Line
              type="monotone"
              dataKey="normal"
              name="Normal"
              stroke="#00ff88"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 4, fill: '#00ff88', stroke: '#0a0e1a', strokeWidth: 2 }}
            />

            {/* Courbe anomalies */}
            <Line
              type="monotone"
              dataKey="anomalies"
              name="Anomalies"
              stroke="#ff4757"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#ff4757', stroke: '#0a0e1a', strokeWidth: 2 }}
              filter="url(#glow-red)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Métriques résumées sous le graphique */}
      <div className="px-6 pb-5 grid grid-cols-3 gap-4 border-t border-cyber-border pt-4">
        {[
          {
            label: 'Pic (total)',
            value: Math.max(...data.map(d => d.total)),
            color: 'text-cyber-cyan',
            unit: 'pkt/min',
          },
          {
            label: 'Moy. normale',
            value: Math.round(data.reduce((s, d) => s + d.normal, 0) / data.length),
            color: 'text-emerald-400',
            unit: 'pkt/min',
          },
          {
            label: 'Moy. anomalies',
            value: Math.round(data.reduce((s, d) => s + d.anomalies, 0) / data.length),
            color: 'text-red-400',
            unit: 'pkt/min',
          },
        ].map(m => (
          <div key={m.label} className="text-center">
            <p className={`text-lg font-bold font-mono ${m.color}`}>
              {m.value}
              <span className="text-xs ml-1 font-normal opacity-70">{m.unit}</span>
            </p>
            <p className="text-xs text-cyber-textDim mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
