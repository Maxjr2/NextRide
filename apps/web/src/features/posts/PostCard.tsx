import type { PostWithAuthor, UserRole } from '@nextride/shared';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { fmtDate, fmtSlot } from '../../utils/format';
import { clsx } from '../../utils/clsx';

interface PostCardProps {
  post: PostWithAuthor;
  currentRole: UserRole;
  leicht: boolean;
  onAction: (post: PostWithAuthor) => void;
}

export function PostCard({ post, currentRole, leicht, onAction }: PostCardProps) {
  const isOffer = post.type === 'offer';

  const actionLabel = getActionLabel(post, currentRole, leicht);

  const dateStr = fmtDate(post.date);
  const slotStr = fmtSlot(post.timeSlot?.start, post.timeSlot?.end);

  const cardLabel = isOffer
    ? leicht ? 'Pilot:in kann fahren' : 'Pilot:in bietet Fahrt an'
    : leicht ? 'Jemand möchte mitfahren' : 'Fahrt-Wunsch';

  return (
    <article
      aria-label={`${cardLabel}: ${dateStr}`}
      className={clsx(
        'rounded-card p-5 mb-4 border-2 shadow-card',
        isOffer
          ? 'bg-offer-bg border-offer-border'
          : 'bg-request-bg border-request-border',
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-2xl" aria-hidden="true">
          {isOffer ? '🚲' : '💛'}
        </span>
        <span
          className={clsx(
            'text-xs font-bold uppercase tracking-widest',
            isOffer ? 'text-offer' : 'text-request',
          )}
        >
          {cardLabel}
        </span>
        {post.status !== 'open' && <StatusBadge status={post.status} />}
      </div>

      {/* Date + time */}
      <p className="text-lg font-bold text-gray-900 mb-1">
        {dateStr}
        {slotStr && (
          <span className="font-normal text-gray-600"> · {slotStr}</span>
        )}
      </p>

      {/* Neighborhood + vehicle + passengers */}
      <p className="text-base text-gray-600 mb-1.5">
        {post.neighborhood}
        {post.vehicle && ` · ${post.vehicle.name}`}
        {post.passengerCount > 1 && ` · ${post.passengerCount} Personen`}
      </p>

      {/* Route wish */}
      {post.routeWish && (
        <p className="text-sm text-gray-500 italic mb-1.5">„{post.routeWish}"</p>
      )}

      {/* Accessibility notes */}
      {post.accessibilityNotes && (
        <p className="text-sm font-semibold text-danger bg-danger-bg inline-block px-3 py-1 rounded-btn mt-1 mb-1.5">
          ♿ {post.accessibilityNotes}
        </p>
      )}

      {/* Author */}
      <p className="text-xs text-muted mt-2">
        {post.facility ? post.facility.name : post.author.displayName}
      </p>

      {/* Action button */}
      {actionLabel && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => onAction(post)}
          aria-label={`${actionLabel} — ${dateStr}`}
          className={clsx(
            'mt-4',
            isOffer ? 'bg-offer hover:bg-offer/90' : 'bg-request hover:bg-request/90',
          )}
        >
          {actionLabel}
        </Button>
      )}
    </article>
  );
}

function getActionLabel(
  post: PostWithAuthor,
  role: UserRole,
  leicht: boolean,
): string | null {
  if (post.status !== 'open') return null;
  const isOffer = post.type === 'offer';
  if (isOffer && (role === 'rider' || role === 'facility'))
    return leicht ? 'Ich möchte mitfahren' : 'Fahrt anfragen';
  if (!isOffer && role === 'pilot')
    return leicht ? 'Ich fahre' : 'Ich übernehme das';
  if (role === 'coordinator')
    return 'Zuweisen';
  return null;
}
