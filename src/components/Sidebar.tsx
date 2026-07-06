import { Shield, Activity, Bell, BarChart2, Cpu, Wifi, ChevronRight } from 'lucide-react';
import type { ActiveView } from '../types';

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  alertCount: number;
  criticalCount: number;
}

const navItems: { id: ActiveView; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard',        icon: BarChart2 },
  { id: 'traffic',   label: 'Trafic réseau',    icon: Activity   },
  { id: 'alerts',    label: 'Alertes',          icon: Bell       },
  { id: 'analysis',  label: 'Analyse IA',       icon: Cpu        },
];

export default function Sidebar({ activeView, onNavigate, alertCount, criticalCount }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 bg-cyber-surface border-r border-cyber-border flex flex-col">

      {/* Logo / En-tête */}
      <div className="px-6 py-5 border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-cyber-cyan" />
            </div>
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-cyber-surface animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold text-white font-mono tracking-wider">IDS-IA</h1>
            <p className="text-xs text-cyber-textDim">Détection d'Intrusion</p>
          </div>
        </div>
      </div>

      {/* Statut du système */}
      <div className="mx-4 my-3 px-3 py-2 bg-emerald-900/20 border border-emerald-700/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-400 font-mono">SYSTÈME ACTIF</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Wifi size={10} className="text-cyber-textDim" />
          <span className="text-xs text-cyber-textDim">Surveillance en cours</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-sm font-medium transition-all duration-200 group
                ${isActive
                  ? 'bg-cyan-500/10 text-cyber-cyan border border-cyan-500/20'
                  : 'text-cyber-textDim hover:text-cyber-text hover:bg-white/5'
                }
              `}
            >
              <Icon
                size={16}
                className={isActive ? 'text-cyber-cyan' : 'text-cyber-textDim group-hover:text-cyber-text'}
              />
              <span className="flex-1 text-left">{item.label}</span>

              {/* Badge alertes */}
              {item.id === 'alerts' && alertCount > 0 && (
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full font-mono font-bold
                  ${criticalCount > 0
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }
                `}>
                  {alertCount}
                </span>
              )}

              {isActive && <ChevronRight size={12} className="text-cyber-cyan" />}
            </button>
          );
        })}
      </nav>

      {/* Pied de page */}
      <div className="px-4 py-4 border-t border-cyber-border">
        <div className="text-xs text-cyber-textDim space-y-1">
          <div className="flex justify-between">
            <span>Modèle IA</span>
            <span className="text-cyber-cyan font-mono">Isolation Forest</span>
          </div>
          <div className="flex justify-between">
            <span>Version</span>
            <span className="text-cyber-textDim font-mono">v1.0.0</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-cyber-textDim text-center">
          Projet Master Cybersécurité
        </div>
      </div>
    </aside>
  );
}
