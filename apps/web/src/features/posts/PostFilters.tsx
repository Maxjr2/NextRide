import type { PostType } from '@nextride/shared';
import { clsx } from '../../utils/clsx';

export interface FilterState {
  type: PostType | '';
  neighborhood: string;
  date: string;
}

interface PostFiltersProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  leicht: boolean;
}

const NEIGHBORHOODS = ['', 'Wersten', 'Flingern', 'Bilk', 'Oberbilk', 'Unterbilk'];

export function PostFilters({ filters, onChange, leicht }: PostFiltersProps) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="Fahrten filtern">
      {/* Type filter */}
      <div className="flex rounded-btn border border-gray-200 overflow-hidden shrink-0">
        {(['', 'offer', 'request'] as const).map((t) => {
          const label = t === '' ? 'Alle' : t === 'offer' ? (leicht ? 'Fahrten' : 'Angebote') : (leicht ? 'Wünsche' : 'Anfragen');
          return (
            <button
              key={t}
              onClick={() => set('type', t)}
              aria-pressed={filters.type === t}
              className={clsx(
                'px-3 py-2 text-sm font-semibold min-h-touch transition-colors',
                filters.type === t
                  ? t === 'offer' ? 'bg-offer text-white' : t === 'request' ? 'bg-request text-white' : 'bg-gray-800 text-white'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Neighborhood filter */}
      <select
        value={filters.neighborhood}
        onChange={(e) => set('neighborhood', e.target.value)}
        aria-label="Stadtteil filtern"
        className="
          text-sm px-3 py-2 rounded-btn border border-gray-200 bg-surface text-gray-700
          min-h-touch focus:outline-none focus:ring-2 focus:ring-offer shrink-0
        "
      >
        <option value="">{leicht ? 'Alle Orte' : 'Alle Stadtteile'}</option>
        {NEIGHBORHOODS.filter(Boolean).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      {/* Date filter */}
      <input
        type="date"
        value={filters.date}
        onChange={(e) => set('date', e.target.value)}
        aria-label="Datum filtern"
        className="
          text-sm px-3 py-2 rounded-btn border border-gray-200 bg-surface text-gray-700
          min-h-touch focus:outline-none focus:ring-2 focus:ring-offer shrink-0
        "
      />

      {/* Clear */}
      {(filters.type || filters.neighborhood || filters.date) && (
        <button
          onClick={() => onChange({ type: '', neighborhood: '', date: '' })}
          className="text-sm text-muted underline px-2 shrink-0 min-h-touch"
          aria-label="Filter zurücksetzen"
        >
          ✕ Reset
        </button>
      )}
    </div>
  );
}
