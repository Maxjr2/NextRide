import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PostCard } from '../features/posts/PostCard';
import { PostFilters, type FilterState } from '../features/posts/PostFilters';
import { MatchConfirmModal } from '../features/matches/MatchConfirmModal';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../auth/AuthContext';
import { postsApi } from '../api/posts';
import type { PostWithAuthor } from '@nextride/shared';

interface RidesPageProps {
  leicht: boolean;
}

export function RidesPage({ leicht }: RidesPageProps) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({ type: '', neighborhood: '', date: '' });
  const [actionPost, setActionPost] = useState<PostWithAuthor | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['posts', filters],
    queryFn: () =>
      postsApi.list({
        type: filters.type || undefined,
        neighborhood: filters.neighborhood || undefined,
        date: filters.date || undefined,
        pageSize: 50,
      }),
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Filters */}
        <PostFilters filters={filters} onChange={setFilters} leicht={leicht} />

        {/* Content */}
        {isLoading && <Spinner label="Fahrten werden geladen…" />}

        {error && (
          <EmptyState
            icon="⚠️"
            title="Fehler beim Laden"
            description="Bitte Seite neu laden."
          />
        )}

        {!isLoading && !error && data?.data.length === 0 && (
          <EmptyState
            icon="🚲"
            title={leicht ? 'Keine Fahrten da' : 'Keine Fahrten gefunden'}
            description={
              leicht
                ? 'Versuche andere Filter.'
                : 'Keine passenden Einträge. Passe die Filter an oder füge selbst eine Fahrt hinzu.'
            }
          />
        )}

        {data?.data.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentRole={user.role}
            leicht={leicht}
            onAction={setActionPost}
          />
        ))}
      </div>

      {/* Action modal */}
      <MatchConfirmModal
        post={actionPost}
        onClose={() => setActionPost(null)}
        leicht={leicht}
      />
    </>
  );
}
