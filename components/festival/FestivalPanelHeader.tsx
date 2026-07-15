type FestivalPanelHeaderProps = {
  title: string;
  onClose: () => void;
};

export default function FestivalPanelHeader({
  title,
  onClose,
}: FestivalPanelHeaderProps) {
  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white pt-3">
        <p className="text-sm font-semibold text-slate-700">
          {title}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          닫기
        </button>
      </div>

      <div className="pt-3">
        <div className="border-b border-slate-200" />
      </div>
    </>
  );
}