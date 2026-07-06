import { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Filter } from 'lucide-react';
import type { TrafficEntry } from '../types';

interface TrafficTableProps {
  entries: TrafficEntry[];
}

const PROTOCOL_COLORS: Record<string, string> = {
  TCP:  'text-cyan-400  bg-cyan-900/30  border-cyan-700/40',
  UDP:  'text-blue-400  bg-blue-900/30  border-blue-700/40',
  ICMP: 'text-green-400 bg-green-900/30 border-green-700/40',
};

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000)     return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return ts;
  }
}

export default function TrafficTable({ entries }: TrafficTableProps) {
  const [search, setSearch]     = useState('');
  const [showAnomaly, setAnomaly] = useState(false);
  const [page, setPage]         = useState(0);
  const PAGE_SIZE = 20;

  const filtered = entries.filter(e => {
    const matchAnomaly = !showAnomaly || e.is_anomaly === 1;
    const matchSearch  = !search
      || e.src_ip.includes(search)
      || e.dst_ip.includes(search)
      || e.protocol.toLowerCase().includes(search.toLowerCase());
    return matchAnomaly && matchSearch;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
      {/* En-tête */}
      <div className="px-5 py-4 border-b border-cyber-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-cyber-text">Trafic réseau analysé</h3>
            <p className="text-xs text-cyber-textDim mt-0.5">{filtered.length} entrées</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-textDim" />
            <input
              type="text"
              placeholder="Filtrer par IP, protocole..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full bg-cyber-surface border border-cyber-border rounded-lg
                         pl-8 pr-3 py-1.5 text-xs text-cyber-text placeholder-cyber-textDim
                         focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          <button
            onClick={() => { setAnomaly(!showAnomaly); setPage(0); }}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
              border transition-colors
              ${showAnomaly
                ? 'bg-red-900/30 border-red-700/50 text-red-400'
                : 'bg-cyber-surface border-cyber-border text-cyber-textDim hover:text-cyber-text'
              }
            `}
          >
            <Filter size={12} />
            Anomalies seulement
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyber-border">
              {['Statut', 'Horodatage', 'IP Source', 'IP Destination', 'Proto', 'Port dst', 'Volume', 'Paquets', 'Score IA'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-cyber-textDim uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map(entry => (
              <tr
                key={entry.id}
                className={`
                  border-b border-cyber-border/40 hover:bg-white/[0.02] transition-colors
                  ${entry.is_anomaly === 1 ? 'bg-red-950/10' : ''}
                `}
              >
                <td className="px-4 py-2.5">
                  {entry.is_anomaly === 1
                    ? <AlertCircle size={14} className="text-red-400" />
                    : <CheckCircle size={14} className="text-emerald-500/60" />
                  }
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs font-mono text-cyber-textDim">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-code text-cyber-cyan">{entry.src_ip}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-code text-cyber-textDim">{entry.dst_ip}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-mono border
                    ${PROTOCOL_COLORS[entry.protocol] ?? 'text-cyber-textDim bg-cyber-surface border-cyber-border'}`}>
                    {entry.protocol}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-code text-cyber-text">{entry.dst_port}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs font-mono text-cyber-textDim">{formatBytes(entry.bytes_sent)}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs font-mono text-cyber-textDim">{entry.packets}</span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-10 h-1 bg-cyber-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${entry.score * 100}%`,
                          backgroundColor: entry.score > 0.7 ? '#ff4757' : entry.score > 0.5 ? '#ffd700' : '#00ff88',
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-cyber-textDim">
                      {(entry.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-cyber-border flex items-center justify-between">
          <span className="text-xs text-cyber-textDim font-mono">
            Page {page + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded bg-cyber-surface border border-cyber-border
                         text-xs text-cyber-textDim disabled:opacity-40 hover:text-cyber-text transition-colors"
            >
              Préc.
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded bg-cyber-surface border border-cyber-border
                         text-xs text-cyber-textDim disabled:opacity-40 hover:text-cyber-text transition-colors"
            >
              Suiv.
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
