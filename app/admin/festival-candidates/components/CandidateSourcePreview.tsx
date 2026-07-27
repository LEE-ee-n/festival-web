import type { CandidateSourceAsset } from "@/lib/types";

type Props = {
  sourceUrl?: string | null;
  sourceType?: string | null;
  rawText?: string | null;
  sourceAssets?: CandidateSourceAsset[];
  className?: string;
};

export default function CandidateSourcePreview({
  sourceUrl,
  sourceType,
  rawText,
  sourceAssets = [],
  className,
}: Props) {
  const linkedAssets = sourceAssets.filter((asset) => asset.url);
  const showSourceLink = Boolean(sourceUrl && sourceType !== "manual");

  if (!showSourceLink && !rawText && linkedAssets.length === 0) {
    return null;
  }

  return (
    <section className={[className, "space-y-4"].filter(Boolean).join(" ")}>
      {showSourceLink && (
        <a
          href={sourceUrl ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="inline-block break-all text-sm font-medium text-blue-600 hover:underline"
        >
          원본 출처 열기
        </a>
      )}

      {rawText && (
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-bold text-slate-700">
            수집 원문 보기
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {rawText}
          </p>
        </details>
      )}

      {linkedAssets.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700">첨부 자료</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {linkedAssets.map((asset, index) => (
              <a
                key={`${asset.url}-${index}`}
                href={asset.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-blue-600"
              >
                {asset.name || `자료 ${index + 1}`}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
