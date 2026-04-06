import { clsx } from '../utils/clsx';

export interface Tab {
  id: string;
  label: string;
  icon: string;
  ariaLabel?: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

/**
 * Sticky bottom navigation bar.
 * Uses role="tablist" + role="tab" with aria-selected for screen readers.
 */
export function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <nav
      role="tablist"
      aria-label="Hauptnavigation"
      className="
        flex bg-surface border-t-2 border-gray-200
        sticky bottom-0 z-30
        shadow-[0_-2px_12px_rgba(0,0,0,0.06)]
      "
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.ariaLabel ?? tab.label}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-0.5',
              'min-h-touch py-2 px-1',
              'text-xs font-medium border-t-[3px]',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offer focus-visible:ring-inset',
              isActive
                ? 'border-offer text-offer font-bold'
                : 'border-transparent text-muted hover:text-gray-600',
            )}
          >
            <span className="text-xl leading-none" aria-hidden="true">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
