import {
  isFestivalCalendarColor,
} from "@/lib/festivalColor";
import { supabase } from "@/lib/supabase/client";
import type { FestivalCalendarColor } from "@/lib/types";

export async function updateFestivalCalendarColor(
  festivalId: number,
  calendarColor: FestivalCalendarColor | null,
) {
  const { data, error } = await supabase.rpc(
    "update_festival_calendar_color_with_audit",
    {
      p_festival_id: festivalId,
      p_calendar_color: calendarColor,
    },
  );

  if (error) {
    throw error;
  }

  if (data === null) {
    return null;
  }

  if (!isFestivalCalendarColor(data)) {
    throw new Error("저장된 캘린더 색상을 확인할 수 없습니다.");
  }

  return data;
}
