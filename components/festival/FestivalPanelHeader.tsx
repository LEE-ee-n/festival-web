import { typography } from "@/lib/typography";

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
        <p className={`${typography.label} text-slate-700`}>
          {title}
        </p>

        <button
          type="button"
          onClick={onClose}
          className={`${typography.button} rounded-xl px-6 py-2 text-slate-700`}
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
