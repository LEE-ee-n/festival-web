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
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface pt-3">
        <p className={`${typography.label} text-ink-secondary`}>
          {title}
        </p>

        <button
          type="button"
          onClick={onClose}
          className={`${typography.button} rounded-xl px-6 py-2 text-ink-secondary`}
        >
          닫기
        </button>
      </div>

      <div className="pt-3">
        <div className="border-b border-line" />
      </div>
    </>
  );
}
