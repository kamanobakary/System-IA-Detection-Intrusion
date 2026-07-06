import { RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  isMock: boolean;
  lastUpdate: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

export default function Header({ title, subtitle, isMock, lastUpdate, onRefresh, loading }: HeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-cyber-textDim mt-0.5">{subtitle}</p>}

        {/* Indicateur de connexion backend */}
        <div className="flex items-center gap-2 mt-2">
          {isMock ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-900/30 border border-yellow-700/40 rounded-full">
              <WifiOff size={10} className="text-yellow-400" />
              <span className="text-xs text-yellow-400 font-mono">Mode démo — backend non connecté</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-900/30 border border-emerald-700/40 rounded-full">
              <Wifi size={10} className="text-emerald-400" />
              <span className="text-xs text-emerald-400 font-mono">Connecté au backend Python</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lastUpdate && (
          <div className="flex items-center gap-1.5 text-xs text-cyber-textDim font-mono">
            <Clock size={11} />
            {lastUpdate.toLocaleTimeString('fr-FR')}
          </div>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-cyber-surface border border-cyber-border
                     rounded-lg text-xs text-cyber-textDim hover:text-cyber-text
                     hover:border-cyan-500/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>
    </div>
  );
}
