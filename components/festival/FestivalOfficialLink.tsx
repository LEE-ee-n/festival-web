import { typography } from "@/lib/typography";

type FestivalOfficialLinkProps = {
  officialUrl: string | null;
  instagramUrl?: string | null;
};

export default function FestivalOfficialLink({
  officialUrl,
  instagramUrl,
}: FestivalOfficialLinkProps) {
  if (!officialUrl && !instagramUrl) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2 pt-3">
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
          className={`${typography.button} flex flex-1 items-center justify-center rounded-xl bg-surface-dark px-3 py-3 text-center text-white hover:bg-surface-dark/90`}
        >
          인스타그램
        </a>
      )}
      {officialUrl && (
        <a
          href={officialUrl}
          target="_blank"
          rel="noreferrer"
          className={`${typography.button} flex flex-1 items-center justify-center rounded-xl bg-surface-dark px-3 py-3 text-center text-white hover:bg-surface-dark/90`}
        >
          공식 홈페이지
        </a>
      )}
    </section>
  );
}
