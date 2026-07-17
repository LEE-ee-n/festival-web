import type { FestivalTicketRound } from "@/lib/types";

type TicketTabProps = {
  newRoundType: string;
  setNewRoundType: (value: string) => void;

  newRoundName: string;
  setNewRoundName: (value: string) => void;

  newOpenAt: string;
  setNewOpenAt: (value: string) => void;

  newTicketPlatform: string;
  setNewTicketPlatform: (value: string) => void;

  newPriceInfo: string;
  setNewPriceInfo: (value: string) => void;

  newTicketUrl: string;
  setNewTicketUrl: (value: string) => void;

  handleAddTicket: () => void;
  isAddingTicket: boolean;

  ticketRounds: FestivalTicketRound[];

  updateTicketRound: (
    ticketId: number,
    field:
      | "round_type"
      | "round_name"
      | "open_at"
      | "price_info"
      | "ticket_url"
      | "ticket_platform",
    value: string,
  ) => void;

  saveTicketRound: (
    round: FestivalTicketRound,
  ) => void;

  deleteTicketRound: (
    round: FestivalTicketRound,
  ) => void;

  savingTicketId: number | null;
};

export default function TicketTab({
  newRoundType,
  setNewRoundType,
  newRoundName,
  setNewRoundName,
  newOpenAt,
  setNewOpenAt,
  newTicketPlatform,
  setNewTicketPlatform,
  newPriceInfo,
  setNewPriceInfo,
  newTicketUrl,
  setNewTicketUrl,
  handleAddTicket,
  isAddingTicket,
  ticketRounds,
  updateTicketRound,
  saveTicketRound,
  deleteTicketRound,
  savingTicketId,
}: TicketTabProps) {

  return <><section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              티켓 관리
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              티켓 회차와 예매처 링크를 등록하고 수정합니다.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-bold text-slate-900">
                티켓 추가
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <select
                  value={newRoundType}
                  onChange={(event) =>
                    setNewRoundType(event.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="blind">블라인드</option>
                  <option value="early_bird">얼리버드</option>
                  <option value="first">1차</option>
                  <option value="second">2차</option>
                  <option value="regular">레귤러</option>
                  <option value="other">기타</option>
                </select>

                <input
                  type="text"
                  value={newRoundName}
                  onChange={(event) =>
                    setNewRoundName(event.target.value)
                  }
                  placeholder="표시 이름 예: 레귤러 티켓"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />

                <input
                  type="datetime-local"
                  value={newOpenAt}
                  onChange={(event) =>
                    setNewOpenAt(event.target.value)
                  }
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />

                <input
                  type="text"
                  value={newTicketPlatform}
                  onChange={(event) =>
                    setNewTicketPlatform(event.target.value)
                  }
                  placeholder="예매처 예: NOL 티켓"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />

                <textarea
                  value={newPriceInfo}
                  onChange={(event) =>
                    setNewPriceInfo(event.target.value)
                  }
                  placeholder="가격 정보"
                  rows={3}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm sm:col-span-2"
                />

                <input
                  type="url"
                  value={newTicketUrl}
                  onChange={(event) =>
                    setNewTicketUrl(event.target.value)
                  }
                  placeholder="예매 링크"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm sm:col-span-2"
                />
              </div>

              <button
                type="button"
                onClick={handleAddTicket}
                disabled={isAddingTicket}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isAddingTicket ? "추가 중..." : "티켓 추가"}
              </button>
            </div>

            {ticketRounds.length === 0 ? (
              <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                등록된 티켓 정보가 없습니다.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {ticketRounds.map((round) => (
                  <div
                    key={round.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select
                        value={round.round_type ?? "other"}
                        onChange={(event) =>
                          updateTicketRound(
                            round.id,
                            "round_type",
                            event.target.value,
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                      >
                        <option value="blind">블라인드</option>
                        <option value="early_bird">얼리버드</option>
                        <option value="first">1차</option>
                        <option value="second">2차</option>
                        <option value="regular">레귤러</option>
                        <option value="other">기타</option>
                      </select>

                      <input
                        type="text"
                        value={round.round_name}
                        onChange={(event) =>
                          updateTicketRound(
                            round.id,
                            "round_name",
                            event.target.value,
                          )
                        }
                        placeholder="표시 이름"
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                      />

                      <input
                        type="datetime-local"
                        value={
                          round.open_at
                            ? new Date(round.open_at)
                                .toLocaleString("sv-SE", {
                                  timeZone: "Asia/Seoul",
                                })
                                .slice(0, 16)
                                .replace(" ", "T")
                            : ""
                        }
                        onChange={(event) =>
                          updateTicketRound(
                            round.id,
                            "open_at",
                            event.target.value
                              ? new Date(event.target.value).toISOString()
                              : "",
                          )
                        }
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                      />

                      <input
                        type="text"
                        value={round.ticket_platform ?? ""}
                        onChange={(event) =>
                          updateTicketRound(
                            round.id,
                            "ticket_platform",
                            event.target.value,
                          )
                        }
                        placeholder="예매처"
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                      />

                      <textarea
                        value={round.price_info ?? ""}
                        onChange={(event) =>
                          updateTicketRound(
                            round.id,
                            "price_info",
                            event.target.value,
                          )
                        }
                        placeholder="가격 정보"
                        rows={3}
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm sm:col-span-2"
                      />

                      <input
                        type="url"
                        value={round.ticket_url ?? ""}
                        onChange={(event) =>
                          updateTicketRound(
                            round.id,
                            "ticket_url",
                            event.target.value,
                          )
                        }
                        placeholder="예매 링크"
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm sm:col-span-2"
                      />
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => saveTicketRound(round)}
                        disabled={savingTicketId === round.id}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {savingTicketId === round.id
                          ? "처리 중..."
                          : "저장"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteTicketRound(round)}
                        disabled={savingTicketId === round.id}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>;
}
