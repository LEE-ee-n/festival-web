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
        className="flex w-full items-center justify-center rounded-xl bg-slate-800 px-3 py-3 text-center text-sm font-semibold text-white hover:bg-slate-700"
      >
        공식 홈페이지
      </a>
    </section>
  );
}