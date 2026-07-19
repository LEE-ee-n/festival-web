import type { FestivalDraftJson } from "@/lib/types";

type Ticket = NonNullable<FestivalDraftJson["tickets"]>[number];

type Props = {
  tickets: Ticket[];
  onAdd: () => void;
  onChange: (index: number, field: keyof Ticket, value: string) => void;
  onDelete: (index: number) => void;
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm";

function toLocalDateTime(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  return date
    .toLocaleString("sv-SE", { timeZone: "Asia/Seoul" })
    .slice(0, 16)
    .replace(" ", "T");
}

function toIsoDateTime(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export default function CandidateTicketTab({
  tickets,
  onAdd,
  onChange,
  onDelete,
}: Props) {
  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">티켓 관리</h3>
          <p className="mt-1 text-sm text-slate-500">
            티켓 회차와 판매처별 가격·오픈 시간을 확인합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          티켓 추가
        </button>
      </div>

      {tickets.length === 0 ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          추출된 티켓이 없습니다. 빈 상태로도 축제를 승인할 수 있습니다.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {tickets.map((ticket, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={ticket.round_type ?? "other"}
                  onChange={(event) =>
                    onChange(index, "round_type", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="blind">블라인드</option>
                  <option value="early_bird">얼리버드</option>
                  <option value="first">1차</option>
                  <option value="second">2차</option>
                  <option value="regular">레귤러</option>
                  <option value="onsite">현장 판매</option>
                  <option value="other">기타</option>
                </select>
                <input
                  value={ticket.round_name ?? ""}
                  onChange={(event) =>
                    onChange(index, "round_name", event.target.value)
                  }
                  placeholder="티켓 이름"
                  className={inputClass}
                />
                <label className="text-xs font-semibold text-slate-600">
                  오픈 시간
                  <input
                    type="datetime-local"
                    value={toLocalDateTime(ticket.open_at)}
                    onChange={(event) =>
                      onChange(
                        index,
                        "open_at",
                        toIsoDateTime(event.target.value),
                      )
                    }
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  종료 시간
                  <input
                    type="datetime-local"
                    value={toLocalDateTime(ticket.close_at)}
                    onChange={(event) =>
                      onChange(
                        index,
                        "close_at",
                        toIsoDateTime(event.target.value),
                      )
                    }
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <input
                  value={ticket.ticket_platform ?? ""}
                  onChange={(event) =>
                    onChange(index, "ticket_platform", event.target.value)
                  }
                  placeholder="예매처"
                  className={inputClass}
                />
                <select
                  value={ticket.status ?? "scheduled"}
                  onChange={(event) =>
                    onChange(index, "status", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="scheduled">예정</option>
                  <option value="open">판매 중</option>
                  <option value="closed">판매 종료</option>
                  <option value="cancelled">취소</option>
                </select>
                <textarea
                  rows={3}
                  value={ticket.price_info ?? ""}
                  onChange={(event) =>
                    onChange(index, "price_info", event.target.value)
                  }
                  placeholder="가격 정보"
                  className={`${inputClass} sm:col-span-2`}
                />
                <input
                  type="url"
                  value={ticket.ticket_url ?? ""}
                  onChange={(event) =>
                    onChange(index, "ticket_url", event.target.value)
                  }
                  placeholder="예매 링크"
                  className={`${inputClass} sm:col-span-2`}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDelete(index)}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
