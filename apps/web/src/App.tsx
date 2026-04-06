import { useState, useEffect } from 'react';
import { SkipLink } from './components/SkipLink';
import { TabBar, type Tab } from './components/TabBar';
import { Spinner } from './components/Spinner';
import { Button } from './components/Button';
import { RidesPage } from './pages/RidesPage';
import { OfferPage } from './pages/OfferPage';
import { MyRidesPage } from './pages/MyRidesPage';
import { MorePage } from './pages/MorePage';
import { useAuth } from './auth/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';

const TABS: Tab[] = [
  { id: 'rides',   label: 'Fahrten',       icon: '🚲', ariaLabel: 'Alle Fahrten' },
  { id: 'offer',   label: 'Anbieten',      icon: '＋',  ariaLabel: 'Fahrt anbieten oder anfragen' },
  { id: 'mine',    label: 'Meine Fahrten', icon: '📋', ariaLabel: 'Meine Fahrten' },
  { id: 'more',    label: 'Mehr',          icon: '⚙️',  ariaLabel: 'Einstellungen und Profil' },
];

const PAGE_TITLES: Record<string, string> = {
  rides: 'Fahrten',
  offer: 'Anbieten',
  mine: 'Meine Fahrten',
  more: 'Mehr',
};

export default function App() {
  const { user, loading, login, isMock } = useAuth();
  useWebSocket(!!user);
  const [activeTab, setActiveTab] = useState('rides');
  const [leicht, setLeicht] = useState(() => localStorage.getItem('nextride:leicht') === 'true');
  const [highContrast, setHighContrast] = useState(
    () => localStorage.getItem('nextride:hc') === 'true',
  );

  // Apply high-contrast class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('hc', highContrast);
    localStorage.setItem('nextride:hc', String(highContrast));
  }, [highContrast]);

  const toggleLeicht = () => {
    setLeicht((v) => {
      localStorage.setItem('nextride:leicht', String(!v));
      return !v;
    });
  };

  const toggleHighContrast = () => setHighContrast((v) => !v);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <Spinner label="App wird geladen…" />
      </div>
    );
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-app px-6 text-center gap-6">
        <span className="text-6xl" aria-hidden="true">🚲</span>
        <h1 className="text-3xl font-bold text-gray-900">NextRide</h1>
        <p className="text-base text-gray-600 max-w-xs">
          {leicht
            ? 'Mit Rikscha draußen sein — für Senioren und Menschen, die Hilfe brauchen.'
            : 'Rikscha-Fahrvermittlung für Radeln ohne Alter — barrierefrei, gemeinschaftlich, kostenlos.'}
        </p>
        {isMock && (
          <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-btn px-3 py-2">
            Mock-Modus aktiv — kein Login erforderlich.
          </p>
        )}
        <Button variant="primary" size="lg" onClick={login} className="w-full max-w-xs">
          {isMock ? 'Als Mock-Nutzer starten' : 'Anmelden'}
        </Button>
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-app max-w-lg mx-auto">
      <SkipLink />

      {/* App header */}
      <header className="bg-surface border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🚲</span>
          <h1 className="text-lg font-bold text-gray-900">
            NextRide
            <span className="sr-only"> — {PAGE_TITLES[activeTab]}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isMock && (
            <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded-full font-medium">
              Mock
            </span>
          )}
          {/* Quick leicht toggle in header */}
          <button
            onClick={toggleLeicht}
            aria-pressed={leicht}
            aria-label={leicht ? 'Leichte Sprache deaktivieren' : 'Leichte Sprache aktivieren'}
            className="text-xs text-muted border border-gray-200 px-2 py-1 rounded-btn min-h-[36px] hover:bg-gray-50"
          >
            {leicht ? 'LS ✓' : 'LS'}
          </button>
        </div>
      </header>

      {/* Page content */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 overflow-y-auto focus:outline-none"
        aria-label={PAGE_TITLES[activeTab]}
      >
        {activeTab === 'rides' && <RidesPage leicht={leicht} />}
        {activeTab === 'offer' && (
          <OfferPage leicht={leicht} onSuccess={() => setActiveTab('rides')} />
        )}
        {activeTab === 'mine' && <MyRidesPage leicht={leicht} />}
        {activeTab === 'more' && (
          <MorePage
            leicht={leicht}
            onToggleLeicht={toggleLeicht}
            highContrast={highContrast}
            onToggleHighContrast={toggleHighContrast}
          />
        )}
      </main>

      {/* Bottom tab bar */}
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
