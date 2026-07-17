import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { addFestivalTicket } from "@/lib/festivals/addFestivalTicket";
import { deleteFestivalTicket } from "@/lib/festivals/deleteFestivalTicket";
import { updateFestivalTicket } from "@/lib/festivals/updateFestivalTicket";
import type { FestivalTicketRound } from "@/lib/types";

type SetErrorMessage = Dispatch<SetStateAction<string | null>>;
type TicketField =
  | "round_type"
  | "round_name"
  | "open_at"
  | "price_info"
  | "ticket_url"
  | "ticket_platform";

function getSupabaseErrorMessage(error: unknown, fallback: string) {
  const supabaseError = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };

  return (
    [
      supabaseError.message,
      supabaseError.details,
      supabaseError.hint,
      supabaseError.code,
    ]
      .filter(Boolean)
      .join(" / ") || fallback
  );
}

export function useFestivalTickets(
  festivalId: string,
  setErrorMessage: SetErrorMessage,
) {
  const [ticketRounds, setTicketRounds] = useState<
    FestivalTicketRound[]
  >([]);
  const [newRoundType, setNewRoundType] = useState("regular");
  const [newRoundName, setNewRoundName] = useState("");
  const [newOpenAt, setNewOpenAt] = useState("");
  const [newPriceInfo, setNewPriceInfo] = useState("");
  const [newTicketPlatform, setNewTicketPlatform] = useState("");
  const [newTicketUrl, setNewTicketUrl] = useState("");
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [savingTicketId, setSavingTicketId] = useState<
    number | null
  >(null);

  const initializeTickets = useCallback(
    (rounds: FestivalTicketRound[]) => setTicketRounds(rounds),
    [],
  );

  async function handleAddTicket() {
    if (!newRoundName.trim()) {
      setErrorMessage("티켓 표시 이름을 입력하세요.");
      return;
    }

    if (!newOpenAt) {
      setErrorMessage("티켓 오픈 날짜와 시간을 입력하세요.");
      return;
    }

    if (
      !window.confirm(
        `${newRoundName.trim()} 티켓 정보를 추가하시겠습니까?`,
      )
    ) {
      return;
    }

    try {
      setIsAddingTicket(true);
      setErrorMessage(null);
      const data = await addFestivalTicket(festivalId, {
        roundType: newRoundType,
        roundName: newRoundName,
        openAt: newOpenAt,
        priceInfo: newPriceInfo,
        ticketPlatform: newTicketPlatform,
        ticketUrl: newTicketUrl,
      });

      setTicketRounds((currentRounds) =>
        [data as FestivalTicketRound, ...currentRounds].sort(
          (a, b) =>
            new Date(b.open_at ?? 0).getTime() -
            new Date(a.open_at ?? 0).getTime(),
        ),
      );
      setNewRoundType("regular");
      setNewRoundName("");
      setNewOpenAt("");
      setNewPriceInfo("");
      setNewTicketPlatform("");
      setNewTicketUrl("");
      window.alert("티켓 정보가 정상적으로 추가되었습니다.");
    } catch (error) {
      const errorWithCode = error as { code?: string };
      setErrorMessage(
        errorWithCode.code === "23505"
          ? "동일한 회차, 오픈 시간, 판매처, URL의 티켓이 이미 있습니다."
          : getSupabaseErrorMessage(
              error,
              "티켓 추가에 실패했습니다.",
            ),
      );
    } finally {
      setIsAddingTicket(false);
    }
  }

  function updateTicketRound(
    ticketId: number,
    field: TicketField,
    value: string,
  ) {
    setTicketRounds((currentRounds) =>
      currentRounds.map((round) =>
        round.id === ticketId
          ? { ...round, [field]: value || null }
          : round,
      ),
    );
  }

  async function saveTicketRound(round: FestivalTicketRound) {
    if (
      !window.confirm(
        `${round.round_name} 티켓 정보를 저장하시겠습니까?`,
      )
    ) {
      return;
    }

    try {
      setSavingTicketId(round.id);
      setErrorMessage(null);
      await updateFestivalTicket(festivalId, round);
      window.alert("티켓 정보가 저장되었습니다.");
    } catch (error) {
      setErrorMessage(
        getSupabaseErrorMessage(error, "티켓 저장에 실패했습니다."),
      );
    } finally {
      setSavingTicketId(null);
    }
  }

  async function deleteTicketRound(round: FestivalTicketRound) {
    if (
      !window.confirm(
        `${round.round_name} 티켓 정보를 삭제하시겠습니까?`,
      )
    ) {
      return;
    }

    try {
      setSavingTicketId(round.id);
      setErrorMessage(null);
      await deleteFestivalTicket(festivalId, round.id);
      setTicketRounds((currentRounds) =>
        currentRounds.filter((item) => item.id !== round.id),
      );
      window.alert("티켓 정보가 삭제되었습니다.");
    } catch (error) {
      setErrorMessage(
        getSupabaseErrorMessage(error, "티켓 삭제에 실패했습니다."),
      );
    } finally {
      setSavingTicketId(null);
    }
  }

  return {
    initializeTickets,
    tabProps: {
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
    },
  };
}
