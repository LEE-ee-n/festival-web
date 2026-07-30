export type ArtistCandidate = {
  id: number;
  name: string;
  normalized_name: string;
  similarity_score: number;
};

type ArtistCandidateTableProps = {
  candidates: ArtistCandidate[];
  onSelect: (candidate: ArtistCandidate) => void;
};

export default function ArtistCandidateTable({
  candidates,
  onSelect,
}: ArtistCandidateTableProps) {
  return (
    <>
      <div className="mt-5 hidden md:block">
        <table className="w-full table-fixed text-center text-sm">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[30%]" />
            <col className="w-[30%]" />
            <col className="w-[12%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead className="border-b border-line-strong text-ink-secondary">
            <tr>
              <th className="px-3 py-3 font-semibold">ID</th>
              <th className="px-3 py-3 font-semibold">표시 이름</th>
              <th className="px-3 py-3 font-semibold">normalized_name</th>
              <th className="px-3 py-3 font-semibold">유사도</th>
              <th className="px-3 py-3 font-semibold">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {candidates.map((candidate) => (
              <tr key={candidate.id}>
                <td className="px-3 py-3 text-ink-tertiary">{candidate.id}</td>
                <td className="px-3 py-3 font-semibold text-ink">{candidate.name}</td>
                <td className="break-all px-3 py-3 font-mono text-ink-secondary">
                  {candidate.normalized_name}
                </td>
                <td className="px-3 py-3 text-ink-secondary">
                  {Math.round(candidate.similarity_score * 100)}%
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => onSelect(candidate)}
                    className="whitespace-nowrap rounded-lg border border-line-strong bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-secondary"
                  >
                    목록에서 수정
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-3 md:hidden">
        {candidates.map((candidate) => (
          <article
            key={candidate.id}
            className="rounded-2xl border border-line-strong bg-surface p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-ink">{candidate.name}</p>
                <p className="mt-1 break-all font-mono text-xs text-ink-secondary">
                  {candidate.normalized_name}
                </p>
                <p className="mt-2 text-xs text-ink-tertiary">
                  ID {candidate.id} · 유사도 {Math.round(candidate.similarity_score * 100)}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelect(candidate)}
                className="shrink-0 rounded-lg border border-line-strong bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-secondary"
              >
                수정
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
