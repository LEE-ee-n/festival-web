export default function FestivalDetailSkeleton() {
  return (
    <div className="p-6 sm:p-8">
      <div className="animate-pulse rounded-3xl bg-white p-8 shadow-sm">
        <div className="h-8 w-2/3 rounded bg-slate-200" />
        <div className="mt-6 h-5 w-1/2 rounded bg-slate-100" />
        <div className="mt-10 h-32 rounded bg-slate-100" />
      </div>
    </div>
  );
}