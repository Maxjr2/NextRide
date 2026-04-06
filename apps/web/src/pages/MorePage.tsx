import { useAuth, MOCK_USERS } from '../auth/AuthContext';
import { Button } from '../components/Button';

interface MorePageProps {
  leicht: boolean;
  onToggleLeicht: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
}

export function MorePage({
  leicht,
  onToggleLeicht,
  highContrast,
  onToggleHighContrast,
}: MorePageProps) {
  const { user, isMock, logout, switchMockUser } = useAuth();

  return (
    <div className="p-4 space-y-6">
      {/* Profile summary */}
      {user && (
        <section aria-labelledby="profile-heading" className="bg-surface rounded-card p-4 shadow-card">
          <h2 id="profile-heading" className="text-sm font-bold uppercase tracking-wide text-muted mb-3">
            {leicht ? 'Dein Profil' : 'Profil'}
          </h2>
          <p className="font-bold text-gray-900 text-lg">{user.displayName}</p>
          <p className="text-sm text-gray-500 capitalize">
            {roleLabel(user.role)}
            {user.certificationLevel && ` · ${user.certificationLevel}`}
          </p>
          <p className="text-sm text-muted mt-0.5">{user.email}</p>
        </section>
      )}

      {/* Accessibility */}
      <section aria-labelledby="a11y-heading" className="bg-surface rounded-card p-4 shadow-card space-y-4">
        <h2 id="a11y-heading" className="text-sm font-bold uppercase tracking-wide text-muted">
          {leicht ? 'Einstellungen' : 'Barrierefreiheit'}
        </h2>

        <ToggleRow
          id="leicht-toggle"
          label={leicht ? 'Einfache Sprache' : 'Leichte Sprache'}
          description={leicht ? 'Kurze, einfache Wörter' : 'Kurze Sätze, einfache Wörter'}
          checked={leicht}
          onChange={onToggleLeicht}
        />

        <ToggleRow
          id="hc-toggle"
          label={leicht ? 'Kontrast-Modus' : 'Hoher Kontrast'}
          description={leicht ? 'Schwarz und Gelb' : 'Schwarz-gelbes Farbschema'}
          checked={highContrast}
          onChange={onToggleHighContrast}
        />
      </section>

      {/* Mock mode user switcher */}
      {isMock && (
        <section aria-labelledby="mock-heading" className="bg-yellow-50 border border-yellow-200 rounded-card p-4 space-y-3">
          <h2 id="mock-heading" className="text-sm font-bold text-yellow-800">
            ⚙️ Mock-Modus aktiv
          </h2>
          <p className="text-xs text-yellow-700">
            Kein echter Login — wechsle einfach die Rolle:
          </p>
          <div className="space-y-2">
            {MOCK_USERS.map((u) => (
              <button
                key={u.externalId}
                onClick={() => switchMockUser(u.externalId)}
                aria-pressed={user?.externalId === u.externalId}
                className={`
                  w-full text-left px-3 py-2.5 rounded-btn text-sm font-medium
                  min-h-touch transition-colors
                  ${user?.externalId === u.externalId
                    ? 'bg-yellow-400 text-yellow-900 font-bold'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}
                `}
              >
                {u.label}
                {user?.externalId === u.externalId && (
                  <span className="ml-2 text-xs">(aktiv)</span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      <section aria-labelledby="about-heading" className="bg-surface rounded-card p-4 shadow-card">
        <h2 id="about-heading" className="text-sm font-bold uppercase tracking-wide text-muted mb-3">
          {leicht ? 'Über uns' : 'Über NextRide'}
        </h2>
        <p className="text-sm text-gray-600 mb-2">
          {leicht
            ? 'NextRide hilft beim Rikscha-Fahren. Senioren können draußen sein. Freiwillige helfen dabei.'
            : 'NextRide verbindet freiwillige Rikscha-Pilot:innen mit Senioren und Menschen mit eingeschränkter Mobilität im Rahmen von Radeln ohne Alter.'}
        </p>
        <a
          href="https://www.radelnohnealter.de"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-offer underline"
        >
          radelnohnealter.de
        </a>
      </section>

      {/* Logout */}
      <Button variant="secondary" size="md" fullWidth onClick={logout}>
        {leicht ? 'Abmelden' : 'Abmelden'}
      </Button>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="flex-1 cursor-pointer">
        <span className="block font-semibold text-gray-800 text-sm">{label}</span>
        <span className="block text-xs text-muted">{description}</span>
      </label>
      <button
        role="switch"
        id={id}
        aria-checked={checked}
        onClick={onChange}
        className={`
          relative inline-flex h-7 w-12 items-center rounded-full transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offer focus-visible:ring-offset-2
          ${checked ? 'bg-accent' : 'bg-gray-300'}
        `}
      >
        <span className="sr-only">{label}</span>
        <span
          className={`
            inline-block h-5 w-5 rounded-full bg-white shadow transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    pilot: 'Pilot:in',
    rider: 'Fahrgast',
    facility: 'Einrichtung',
    coordinator: 'Koordinator:in',
  };
  return map[role] ?? role;
}
