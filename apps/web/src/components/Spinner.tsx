export function Spinner({ label = 'Lädt…' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex justify-center py-12">
      <div className="w-10 h-10 border-4 border-offer/20 border-t-offer rounded-full animate-spin" />
    </div>
  );
}
