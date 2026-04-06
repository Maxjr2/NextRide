import { PostForm } from '../features/posts/PostForm';

interface OfferPageProps {
  leicht: boolean;
  onSuccess?: () => void;
}

export function OfferPage({ leicht, onSuccess }: OfferPageProps) {
  return (
    <div className="p-4">
      <PostForm leicht={leicht} onSuccess={onSuccess} />
    </div>
  );
}
