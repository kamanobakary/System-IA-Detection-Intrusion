import { useState } from 'react';
import { Play, Cpu, Database, GitBranch, Layers, CheckCircle, AlertTriangle } from 'lucide-react';
import { triggerAnalysis } from '../api';

interface AnalysisPanelProps {
  onAnalysisComplete: () => void;
}

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
  status: 'idle' | 'running' | 'done';
}

function PipelineStep({ number, title, description, icon: Icon, status }: StepProps) {
  return (
    <div className={`
      flex items-start gap-4 p-4 rounded-xl border transition-all duration-500
      ${status === 'running' ? 'bg-cyan-950/30 border-cyan-700/40' : ''}
      ${status === 'done'    ? 'bg-emerald-950/20 border-emerald-700/30' : ''}
      ${status === 'idle'    ? 'bg-cyber-surface border-cyber-border' : ''}
    `}>
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold
        ${status === 'running' ? 'bg-cyan-500/20 text-cyber-cyan border border-cyan-500/40 animate-pulse' : ''}
        ${status === 'done'    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : ''}
        ${status === 'idle'    ? 'bg-cyber-card text-cyber-textDim border border-cyber-border' : ''}
      `}>
        {status === 'done' ? <CheckCircle size={14} /> : number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon size={14} className={
            status === 'running' ? 'text-cyber-cyan' :
            status === 'done'    ? 'text-emerald-400' : 'text-cyber-textDim'
          } />
          <span className={`text-sm font-medium
            ${status === 'running' ? 'text-cyber-cyan' :
              status === 'done'    ? 'text-emerald-400' : 'text-cyber-text'}
          `}>{title}</span>
          {status === 'running' && (
            <span className="text-xs font-mono text-cyber-cyan animate-pulse">en cours...</span>
          )}
        </div>
        <p className="text-xs text-cyber-textDim mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function AnalysisPanel({ onAnalysisComplete }: AnalysisPanelProps) {
  const [nNormal,   setNNormal]   = useState(200);
  const [nAttacks,  setNAttacks]  = useState(3);
  const [running,   setRunning]   = useState(false);
  const [step,      setStep]      = useState<number>(-1);
  const [result,    setResult]    = useState<Record<string, number> | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  const steps: Omit<StepProps, 'status'>[] = [
    {
      number: 1,
      title: 'Génération du trafic simulé',
      description: `Création de ${nNormal} paquets normaux + ${nAttacks} séquences d'attaques (scans, brute-force, DDoS).`,
      icon: Database,
    },
    {
      number: 2,
      title: 'Extraction des features',
      description: 'Calcul des features dérivées : bytes/paquet, ratio de ports, encodage du protocole.',
      icon: GitBranch,
    },
    {
      number: 3,
      title: 'Entraînement Isolation Forest',
      description: 'Apprentissage non supervisé sur 150 arbres. Détection automatique des points aberrants.',
      icon: Cpu,
    },
    {
      number: 4,
      title: 'Classification des alertes',
      description: 'Analyse heuristique des anomalies détectées pour identifier le type et la sévérité.',
      icon: Layers,
    },
  ];

  async function handleRun() {
    setRunning(true);
    setResult(null);
    setError(null);

    try {
      // Simulation de la progression des étapes (sans backend réel, on simule)
      for (let i = 0; i < steps.length; i++) {
        setStep(i);
        await new Promise(r => setTimeout(r, 700 + Math.random() * 500));
      }

      // Appel réel au backend (ou simulation si hors ligne)
      try {
        const res = await triggerAnalysis(nNormal, nAttacks);
        setResult(res);
      } catch {
        // Simulation du résultat si backend absent
        setResult({
          total_traffic: nNormal + nAttacks * 60,
          anomalies:     Math.floor((nNormal + nAttacks * 60) * 0.12),
          alerts:        nAttacks * 8 + Math.floor(nNormal * 0.05),
        });
      }

      setStep(steps.length); // toutes les étapes terminées
      onAnalysisComplete();
    } catch (e) {
      setError('Erreur lors de l\'analyse.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-lg font-bold text-cyber-text">Analyse IA</h2>
        <p className="text-sm text-cyber-textDim mt-1">
          Lancez une session d'analyse pour générer du trafic simulé et détecter les intrusions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Panneau de configuration */}
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-cyber-text mb-4">Paramètres de simulation</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-cyber-textDim block mb-1.5">
                Paquets normaux : <span className="text-cyber-cyan font-mono">{nNormal}</span>
              </label>
              <input
                type="range"
                min={50} max={500} step={50}
                value={nNormal}
                onChange={e => setNNormal(Number(e.target.value))}
                disabled={running}
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-xs text-cyber-textDim mt-1">
                <span>50</span><span>500</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-cyber-textDim block mb-1.5">
                Séquences d'attaques : <span className="text-red-400 font-mono">{nAttacks}</span>
              </label>
              <input
                type="range"
                min={1} max={10} step={1}
                value={nAttacks}
                onChange={e => setNAttacks(Number(e.target.value))}
                disabled={running}
                className="w-full accent-red-400"
              />
              <div className="flex justify-between text-xs text-cyber-textDim mt-1">
                <span>1</span><span>10</span>
              </div>
            </div>
          </div>

          {/* Info modèle */}
          <div className="mt-5 p-3 bg-cyber-surface border border-cyber-border rounded-lg">
            <h4 className="text-xs font-semibold text-cyber-text mb-2">Modèle IA utilisé</h4>
            <div className="space-y-1 text-xs text-cyber-textDim">
              <div className="flex justify-between">
                <span>Algorithme</span>
                <span className="text-cyber-cyan font-mono">Isolation Forest</span>
              </div>
              <div className="flex justify-between">
                <span>N estimateurs</span>
                <span className="font-mono text-cyber-text">150 arbres</span>
              </div>
              <div className="flex justify-between">
                <span>Contamination</span>
                <span className="font-mono text-cyber-text">5%</span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span className="font-mono text-cyber-text">Non supervisé</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={running}
            className={`
              w-full mt-5 flex items-center justify-center gap-2 py-2.5 rounded-lg
              font-medium text-sm transition-all duration-200
              ${running
                ? 'bg-cyber-surface border border-cyber-border text-cyber-textDim cursor-not-allowed'
                : 'bg-cyan-500/10 border border-cyan-500/30 text-cyber-cyan hover:bg-cyan-500/20 hover:border-cyan-500/50'
              }
            `}
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Play size={14} />
                Lancer l'analyse
              </>
            )}
          </button>
        </div>

        {/* Pipeline de traitement */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-cyber-text">Pipeline de traitement</h3>

          {steps.map((s, i) => (
            <PipelineStep
              key={i}
              {...s}
              status={step === i ? 'running' : step > i ? 'done' : 'idle'}
            />
          ))}

          {/* Résultat */}
          {result && (
            <div className="p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Analyse terminée</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Paquets',   value: result.total_traffic, color: 'text-cyber-cyan'  },
                  { label: 'Anomalies', value: result.anomalies,     color: 'text-yellow-400'  },
                  { label: 'Alertes',   value: result.alerts,        color: 'text-orange-400'  },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className={`text-xl font-bold font-mono ${item.color}`}>{item.value}</div>
                    <div className="text-xs text-cyber-textDim">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Explication pédagogique */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-cyber-text mb-3">Comment fonctionne Isolation Forest ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-cyber-textDim leading-relaxed">
          <div className="space-y-1">
            <p className="text-cyber-cyan font-medium">1. Construction des arbres</p>
            <p>L'algorithme construit des arbres de décision aléatoires en sélectionnant
            des features et des seuils au hasard.</p>
          </div>
          <div className="space-y-1">
            <p className="text-cyber-cyan font-medium">2. Isolation des points</p>
            <p>Les anomalies, rares et différentes, sont isolées en moins de divisions
            que les points normaux, qui se ressemblent entre eux.</p>
          </div>
          <div className="space-y-1">
            <p className="text-cyber-cyan font-medium">3. Score d'anomalie</p>
            <p>Un score est calculé selon la profondeur moyenne d'isolation.
            Un score proche de 1 indique un comportement très suspect.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
