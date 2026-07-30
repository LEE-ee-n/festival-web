export default function FestivalDetailSkeleton() {
  return (
    <div className="p-6 sm:p-8">
      <div className="animate-pulse rounded-3xl bg-surface p-8 shadow-sm">
        <div className="h-8 w-2/3 rounded bg-surface-strong" />
        <div className="mt-6 h-5 w-1/2 rounded bg-surface-muted" />
        <div className="mt-10 h-32 rounded bg-surface-muted" />
      </div>
    </div>
  );
}