import { typography } from "@/lib/typography";

type FestivalOfficialLinkProps = {
  officialUrl: string | null;
};

export default function FestivalOfficialLink({
  officialUrl,
}: FestivalOfficialLinkProps) {
  if (!officialUrl) {
    return null;
  }

  return (
    <section className="pt-3">
      <a
        href={officialUrl}
        target="_blank"
        rel="noreferrer"
        className={`${typography.button} flex w-full items-center justify-center rounded-xl bg-surface-dark px-3 py-3 text-center text-white hover:bg-surface-dark/90`}
      >
        공식 홈페이지
      </a>
    </section>
  );
}
