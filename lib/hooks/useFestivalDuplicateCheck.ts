"use client";

import { useEffect, useState } from "react";

import { isValidNormalizedName } from "@/lib/normalizedName";
import { supabase } from "@/lib/supabase/client";

type DuplicateFestival = {
  id: number;
  name: string;
};

type DuplicateCheckState =
  | { status: "idle"; festival: null }
  | { status: "checking"; festival: null }
  | { status: "available"; festival: null }
  | { status: "duplicate"; festival: DuplicateFestival }
  | { status: "error"; festival: null };

export function useFestivalDuplicateCheck({
  normalizedName,
  startDate,
  endDate,
  excludeFestivalId,
}: {
  normalizedName: string;
  startDate: string;
  endDate: string;
  excludeFestivalId?: number | string | null;
}) {
  const [state, setState] = useState<DuplicateCheckState>({
    status: "idle",
    festival: null,
  });

  useEffect(() => {
    if (
      !isValidNormalizedName(normalizedName)
      || !startDate
      || !endDate
      || endDate < startDate
    ) {
      const idleTimer = window.setTimeout(() => {
        setState({ status: "idle", festival: null });
      }, 0);
      return () => window.clearTimeout(idleTimer);
    }

    let isCancelled = false;
    const timer = window.setTimeout(async () => {
      setState({ status: "checking", festival: null });

      let query = supabase
        .from("festivals")
        .select("id, name")
        .eq("normalized_name", normalizedName)
        .eq("start_date", startDate)
        .eq("end_date", endDate)
        .limit(1);

      if (excludeFestivalId !== null && excludeFestivalId !== undefined) {
        query = query.neq("id", excludeFestivalId);
      }

      const { data, error } = await query.maybeSingle();
      if (isCancelled) return;

      if (error) {
        setState({ status: "error", festival: null });
      } else if (data) {
        setState({
          status: "duplicate",
          festival: data as DuplicateFestival,
        });
      } else {
        setState({ status: "available", festival: null });
      }
    }, 400);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [endDate, excludeFestivalId, normalizedName, startDate]);

  return state;
}
