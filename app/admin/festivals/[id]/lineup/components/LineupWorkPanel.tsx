import type { LineupRound, LineupWorkType } from "@/lib/audit/lineupWork";

type Props = {
  workType: LineupWorkType;
  setWorkType: (value: LineupWorkType) => void;
  lineupRound: LineupRound;
  setLineupRound: (value: LineupRound) => void;
  announcementDate: string;
  setAnnouncementDate: (value: string) => void;
  sourceUrl: string;
  setSourceUrl: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  pendingCount: number;
  saveLineupWork: () => void;
  isSavingWork: boolean;
};

export default function LineupWorkPanel(props: Props) {
  return (
    <section className="mt-8 rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">라인업 작업 기록</h2>
          <p className="mt-1 text-sm text-slate-500">아래에서 여러 명을 추가·수정·삭제한 뒤 한 번에 저장합니다.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
          저장 대기 {props.pendingCount}건
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-slate-700">
          기록 종류
          <select value={props.workType} onChange={(event) => props.setWorkType(event.target.value as LineupWorkType)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm">
            <option value="announcement">발표</option>
            <option value="correction">정정</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          라인업 차수
          <select value={props.lineupRound} onChange={(event) => props.setLineupRound(event.target.value as LineupRound)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm">
            <option value="unspecified">차수 미지정</option>
            <option value="first">1차</option>
            <option value="second">2차</option>
            <option value="third">3차</option>
            <option value="final">최종</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          공식 발표일 {props.workType === "announcement" ? "(필수)" : "(선택)"}
          <input type="date" value={props.announcementDate} onChange={(event) => props.setAnnouncementDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          출처 {props.workType === "announcement" ? "(필수)" : ""}
          <input type="url" value={props.sourceUrl} onChange={(event) => props.setSourceUrl(event.target.value)} placeholder="https://..." className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" />
        </label>
      </div>

      {props.workType === "correction" && (
        <label className="mt-4 block text-xs font-semibold text-slate-700">
          정정 사유 (출처가 없으면 필수)
          <input value={props.reason} onChange={(event) => props.setReason(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" />
        </label>
      )}

    </section>
  );
}
