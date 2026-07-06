import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import StatCards from './components/StatCards';
import TrafficChart from './components/TrafficChart';
import AlertsTable from './components/AlertsTable';
import TrafficTable from './components/TrafficTable';
import AnalysisPanel from './components/AnalysisPanel';
import Header from './components/Header';
import RecentAlertsWidget from './components/RecentAlertsWidget';
import NetworkTrafficChart from './components/NetworkTrafficChart';
import TopSuspiciousIps from './components/TopSuspiciousIps';
import IncidentHistory from './components/IncidentHistory';
import { fetchStatistics, fetchTraffic, fetchAlerts, generateMockStats } from './api';
import type { Statistics, TrafficEntry, Alert, ActiveView } from './types';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [stats, setStats] = useState<Statistics>(generateMockStats());
  const [traffic, setTraffic] = useState<TrafficEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isMock, setIsMock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, trafficRes, alertsRes] = await Promise.all([
        fetchStatistics(),
        fetchTraffic(100),
        fetchAlerts(50),
      ]);

      setStats(statsRes.data);
      setTraffic(trafficRes.data);
      setAlerts(alertsRes.data);
      setIsMock(statsRes.isMock);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const criticalCount = stats.alerts_by_severity.critical;

  const VIEW_TITLES: Record<ActiveView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard de sécurité',
      subtitle: 'Vue d\'ensemble du trafic réseau et des menaces détectées',
    },
    traffic: {
      title: 'Trafic réseau',
      subtitle: 'Analyse détaillée de tous les paquets capturés',
    },
    alerts: {
      title: 'Alertes de sécurité',
      subtitle: 'Événements suspects détectés par le modèle Isolation Forest',
    },
    analysis: {
      title: 'Analyse IA',
      subtitle: 'Lancer une nouvelle session de détection d\'intrusion',
    },
  };

  const { title, subtitle } = VIEW_TITLES[activeView];

  return (
    <div className="flex h-screen bg-cyber-bg hex-bg overflow-hidden">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        alertCount={stats.total_alerts}
        criticalCount={criticalCount}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-screen-2xl mx-auto">
          <Header
            title={title}
            subtitle={subtitle}
            isMock={isMock}
            lastUpdate={lastUpdate}
            onRefresh={loadData}
            loading={loading}
          />

          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* 1 — Cartes statistiques */}
              <StatCards stats={stats} />

              {/* 2 — Tableau détaillé des alertes récentes */}
              <RecentAlertsWidget alerts={alerts} />

              {/* 3 — Graphique du trafic réseau en temps réel */}
              <NetworkTrafficChart />

              {/* 4 — Analyse IA : répartition protocoles + sévérité */}
              <TrafficChart stats={stats} />

              {/* 5 & 6 — Top IP suspectes + Historique des incidents */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <TopSuspiciousIps alerts={alerts} />
                <IncidentHistory alerts={alerts} />
              </div>
            </div>
          )}

          {activeView === 'traffic' && <TrafficTable entries={traffic} />}

          {activeView === 'alerts' && <AlertsTable alerts={alerts} />}

          {activeView === 'analysis' && (
            <AnalysisPanel onAnalysisComplete={loadData} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
