import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { matchesApi } from '../../api/matches';
import { postsApi } from '../../api/posts';
import { fmtDate, fmtSlot } from '../../utils/format';
import { useAuth } from '../../auth/AuthContext';
import type { PostWithAuthor } from '@nextride/shared';
import { clsx } from '../../utils/clsx';

interface MatchConfirmModalProps {
  post: PostWithAuthor | null;
  onClose: () => void;
  leicht: boolean;
}

/**
 * Coordinator: proposes a match (must select the pairing partner).
 * Pilot / Rider: confirms their side of a proposed match.
 * Rider / Facility looking at an offer: creates a quick "request" and match.
 *
 * In the simple case (rider clicking on an offer):
 * - create a request post
 * - coordinator proposes match (auto-flow for now: coordinator must do it manually)
 * - For v1, this modal just shows the intent and tells user a coordinator will follow up.
 */
export function MatchConfirmModal({ post, onClose, leicht }: MatchConfirmModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const isOffer = post?.type === 'offer';
  const isPilot = user?.role === 'pilot';

  // Create a request post then inform the user a coordinator will match it
  const createRequest = useMutation({
    mutationFn: () =>
      postsApi.create({
        type: 'request',
        neighborhood: post!.neighborhood,
        date: post!.date?.toISOString(),
        timeSlot: post!.timeSlot,
        routeWish: post!.routeWish,
        passengerCount: 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      showToast(
        leicht
          ? 'Anfrage gesendet! Die Koordination meldet sich.'
          : 'Wunsch gespeichert — ein:e Koordinator:in wird die Fahrt zuordnen.',
      );
      onClose();
    },
    onError: () => showToast('Fehler. Bitte erneut versuchen.', 'error'),
  });

  if (!post) return null;

  const title = isOffer
    ? leicht ? 'Diese Fahrt anfragen?' : 'Möchtest du diese Fahrt anfragen?'
    : leicht ? 'Diese Fahrt übernehmen?' : 'Möchtest du diese Fahrt übernehmen?';

  const confirmLabel = isOffer
    ? leicht ? 'Ja, anfragen!' : 'Ja, Fahrt anfragen'
    : leicht ? 'Ja, übernehmen!' : 'Ja, Fahrt übernehmen';

  const infoText = isOffer
    ? leicht
      ? 'Die Pilot:in bekommt eine Nachricht.'
      : 'Deine Anfrage wird gespeichert. Ein:e Koordinator:in ordnet die Fahrt zu und benachrichtigt alle Beteiligten.'
    : leicht
      ? 'Die Einrichtung bekommt eine Nachricht.'
      : 'Du erklärst dich bereit, diese Anfrage zu übernehmen. Ein:e Koordinator:in bestätigt die Fahrt.';

  const dateStr = fmtDate(post.date);
  const slotStr = fmtSlot(post.timeSlot?.start, post.timeSlot?.end);

  return (
    <Modal title={title} open={!!post} onClose={onClose}>
      {/* Post summary */}
      <div
        className={clsx(
          'rounded-btn p-4 mb-5 border-2',
          isOffer ? 'bg-offer-bg border-offer-border' : 'bg-request-bg border-request-border',
        )}
      >
        <p className="font-bold text-base text-gray-900">
          {dateStr}
          {slotStr && <span className="font-normal text-gray-600"> · {slotStr}</span>}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {post.neighborhood}
          {post.vehicle && ` · ${post.vehicle.name}`}
        </p>
        {post.routeWish && (
          <p className="text-sm text-muted italic mt-1">„{post.routeWish}"</p>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-6">{infoText}</p>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onClose} className="flex-1">
          {leicht ? 'Zurück' : 'Abbrechen'}
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            if (isOffer && !isPilot) {
              createRequest.mutate();
            } else {
              // Pilot acknowledging a request — same flow
              createRequest.mutate();
            }
          }}
          disabled={createRequest.isPending}
          className={clsx('flex-[2]', isOffer ? 'bg-offer' : 'bg-request')}
        >
          {createRequest.isPending ? 'Wird gesendet…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
