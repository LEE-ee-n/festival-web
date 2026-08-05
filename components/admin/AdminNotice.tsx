import type { Ref } from "react";

export type AdminNoticeTone = "error" | "success" | "warning" | "info";

const toneClasses: Record<AdminNoticeTone, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

type Props = {
  message: string | null;
  tone?: AdminNoticeTone;
  className?: string;
  noticeRef?: Ref<HTMLDivElement>;
};

export default function AdminNotice({
  message,
  tone = "error",
  className = "",
  noticeRef,
}: Props) {
  if (!message) {
    return null;
  }

  return (
    <div
      ref={noticeRef}
      role="alert"
      tabIndex={-1}
      className={`rounded-xl border p-4 text-sm font-semibold outline-none ${toneClasses[tone]} ${className}`.trim()}
    >
      {message}
    </div>
  );
}
