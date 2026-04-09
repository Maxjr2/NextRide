import { useQuery } from '@tanstack/react-query';
import { PostCard } from '../features/posts/PostCard';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../auth/AuthContext';
import { postsApi } from '../api/posts';
import { matchesApi } from '../api/matches';
import { fmtDate, fmtSlot } from '../utils/format';
interface MyRidesPageProps {
  leicht: boolean;
}

export function MyRidesPage({ leicht }: MyRidesPageProps) {
  const { user } = useAuth();

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'mine', user?.id],
    queryFn: () => postsApi.list({ authorId: user!.id, pageSize: 50 }),
    enabled: !!user,
  });

  // TODO: Replace the `as any` cast with a properly typed ListMatchesQuery once
  // the shared schema exposes a participantId filter, so this query fetches
  // only matches where the current user is a pilot or rider.
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches', 'mine'],
    queryFn: () => matchesApi.list({ pageSize: 50 } as any),
    enabled: !!user,
  });

  const isLoading = postsLoading || matchesLoading;

  if (!user) return null;

  const myPosts = postsData?.data ?? [];
  const myMatches = matchesData?.data ?? [];

  return (
    <div className="p-4 space-y-6">
      {isLoading && <Spinner label="Meine Fahrten werden geladen…" />}

      {/* My posts */}
      {!isLoading && (
        <>
          <section aria-labelledby="my-posts-heading">
            <h2 id="my-posts-heading" className="text-base font-bold text-gray-700 mb-3 uppercase tracking-wide text-xs">
              {leicht ? 'Meine Angebote und Wünsche' : 'Meine Einträge'}
            </h2>
            {myPosts.length === 0 ? (
              <EmptyState
                icon="📋"
                title={leicht ? 'Noch nichts hier' : 'Keine eigenen Einträge'}
                description={leicht ? 'Gehe zu „Anbieten" um etwas zu erstellen.' : 'Erstelle ein Angebot oder einen Wunsch im Tab „Anbieten".'}
              />
            ) : (
              myPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentRole={user.role}
                  leicht={leicht}
                  onAction={() => {}} // no action on own posts in this view
                />
              ))
            )}
          </section>

          {/* TODO: Add a "Completed rides" section below the active matches
              that shows historical RideLog entries (distance, date, partner).
              The IRideLogRepository and MockRideLogRepository are already in
              place on the backend; a GET /api/v1/rides/log endpoint and a
              corresponding frontend API call are needed. */}

          {/* Matches */}
          {myMatches.length > 0 && (
            <section aria-labelledby="matches-heading">
              <h2 id="matches-heading" className="text-base font-bold text-gray-700 mb-3 uppercase tracking-wide text-xs">
                {leicht ? 'Zugeordnete Fahrten' : 'Zugewiesene Fahrten'}
              </h2>
              <div className="space-y-3">
                {myMatches.map((match) => {
                  const relevantPost = user.role === 'pilot' ? match.offer : match.request;
                  const partnerPost = user.role === 'pilot' ? match.request : match.offer;
                  return (
                    <div
                      key={match.id}
                      className="bg-accent-bg border border-accent/30 rounded-card p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-accent">
                          {leicht ? 'Fahrt geplant' : 'Vermittelte Fahrt'}
                        </span>
                        <StatusBadge status={match.status as any} />
                      </div>
                      <p className="font-bold text-gray-900">
                        {fmtDate(relevantPost.date)}
                        {relevantPost.timeSlot && (
                          <span className="font-normal text-gray-600"> · {fmtSlot(relevantPost.timeSlot.start, relevantPost.timeSlot.end)}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">{relevantPost.neighborhood}</p>
                      <p className="text-xs text-muted mt-1.5">
                        {leicht ? 'Mit: ' : 'Gegenüber: '}{partnerPost.author.displayName}
                        {partnerPost.facility && ` (${partnerPost.facility.name})`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
