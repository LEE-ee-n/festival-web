import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  tone?: "muted" | "tertiary";
};

const TONE_CLASS = {
  muted: "text-ink-muted",
  tertiary: "text-ink-tertiary",
} as const;

export default function MobileTableLabel({ children, tone = "tertiary" }: Props) {
  return (
    <span className={`mb-1 block text-[11px] font-bold lg:hidden ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}
