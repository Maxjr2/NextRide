import { STATUS_LABEL } from '../utils/format';
import { clsx } from '../utils/clsx';
import type { PostStatus } from '@nextride/shared';

const colorMap: Record<PostStatus, string> = {
  open: 'bg-accent text-white',
  matched: 'bg-yellow-600 text-white',
  confirmed: 'bg-offer text-white',
  completed: 'bg-gray-500 text-white',
  cancelled: 'bg-red-700 text-white',
};

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span
      className={clsx(
        'ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full',
        colorMap[status],
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
