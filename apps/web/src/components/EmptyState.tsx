interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export function EmptyState({ icon = '🚲', title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-8" role="status">
      <span className="text-5xl block mb-4" aria-hidden="true">{icon}</span>
      <p className="text-lg font-bold text-gray-700 mb-2">{title}</p>
      {description && (
        <p className="text-sm text-muted">{description}</p>
      )}
    </div>
  );
}
