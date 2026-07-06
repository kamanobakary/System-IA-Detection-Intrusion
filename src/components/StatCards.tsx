import { Activity, AlertTriangle, Bell, Zap, TrendingUp, Shield } from 'lucide-react';
import type { Statistics } from '../types';

interface StatCardsProps {
  stats: Statistics;
}

interface CardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.FC<{ size?: number; className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  trend?: string;
  delay?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, colorClass, bgClass, borderClass, trend, delay }: CardProps) {
  return (
    <div
      className={`
        ${bgClass} border ${borderClass} rounded-xl p-5
        hover:scale-[1.02] transition-all duration-300
        animate-fade-in-up opacity-0 ${delay}
      `}
      style={{ animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${bgClass} border ${borderClass} rounded-lg flex items-center justify-center`}>
          <Icon size={18} className={colorClass} />
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className={colorClass} />
            <span className={`text-xs font-mono ${colorClass}`}>{trend}</span>
          </div>
        )}
      </div>

      <div className={`text-3xl font-bold font-mono ${colorClass} mb-1`}>
        {value}
      </div>
      <div className="text-sm font-medium text-cyber-text">{title}</div>
      <div className="text-xs text-cyber-textDim mt-1">{subtitle}</div>
    </div>
  );
}

export default function StatCards({ stats }: StatCardsProps) {
  const cards: CardProps[] = [
    {
      title:       'Paquets analysés',
      value:       stats.total_traffic.toLocaleString(),
      subtitle:    'Total du trafic réseau capturé',
      icon:        Activity,
      colorClass:  'text-cyber-cyan',
      bgClass:     'bg-cyan-950/30',
      borderClass: 'border-cyan-800/30',
      trend:       '+12%',
      delay:       'delay-100',
    },
    {
      title:       'Anomalies détectées',
      value:       stats.total_anomalies.toLocaleString(),
      subtitle:    `Taux d'anomalie : ${stats.anomaly_rate}%`,
      icon:        AlertTriangle,
      colorClass:  'text-yellow-400',
      bgClass:     'bg-yellow-950/30',
      borderClass: 'border-yellow-800/30',
      trend:       `${stats.anomaly_rate}%`,
      delay:       'delay-200',
    },
    {
      title:       'Alertes générées',
      value:       stats.total_alerts.toLocaleString(),
      subtitle:    'Événements de sécurité signalés',
      icon:        Bell,
      colorClass:  'text-orange-400',
      bgClass:     'bg-orange-950/30',
      borderClass: 'border-orange-800/30',
      delay:       'delay-300',
    },
    {
      title:       'Alertes critiques',
      value:       stats.critical_alerts.toLocaleString(),
      subtitle:    'Nécessitent une intervention immédiate',
      icon:        Zap,
      colorClass:  stats.critical_alerts > 0 ? 'text-red-400' : 'text-emerald-400',
      bgClass:     stats.critical_alerts > 0 ? 'bg-red-950/30' : 'bg-emerald-950/20',
      borderClass: stats.critical_alerts > 0 ? 'border-red-800/40' : 'border-emerald-800/30',
      delay:       'delay-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(card => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
