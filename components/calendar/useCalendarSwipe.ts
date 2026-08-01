import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent } from "react";

import {
  getCalendarGestureAxis,
  getCalendarSwipeDirection,
  type CalendarGestureAxis,
  type CalendarSwipeDirection,
} from "@/lib/calendarSwipe";

type CalendarPointerEvent = PointerEvent<HTMLDivElement>;

export type CalendarSwipeHandlers = {
  onPointerDown: (event: CalendarPointerEvent) => void;
  onPointerMove: (event: CalendarPointerEvent) => void;
  onPointerUp: (event: CalendarPointerEvent) => void;
  onPointerCancel: (event: CalendarPointerEvent) => void;
  onLostPointerCapture: (event: CalendarPointerEvent) => void;
};

export function useCalendarSwipe(
  onSwipe: (direction: CalendarSwipeDirection) => void,
): CalendarSwipeHandlers {
  const pointerIdRef = useRef<number | null>(null);
  const pointerStartXRef = useRef<number | null>(null);
  const pointerStartYRef = useRef<number | null>(null);
  const gestureAxisRef = useRef<CalendarGestureAxis | null>(null);

  const resetGesture = useCallback(() => {
    pointerIdRef.current = null;
    pointerStartXRef.current = null;
    pointerStartYRef.current = null;
    gestureAxisRef.current = null;
  }, []);

  const onPointerDown = useCallback((event: CalendarPointerEvent) => {
    if (!event.isPrimary) return;

    resetGesture();
    pointerIdRef.current = event.pointerId;
    pointerStartXRef.current = event.clientX;
    pointerStartYRef.current = event.clientY;
    gestureAxisRef.current = null;
  }, [resetGesture]);

  const onPointerMove = useCallback((event: CalendarPointerEvent) => {
    if (
      event.pointerId !== pointerIdRef.current ||
      pointerStartXRef.current === null ||
      pointerStartYRef.current === null ||
      gestureAxisRef.current !== null
    ) {
      return;
    }

    gestureAxisRef.current = getCalendarGestureAxis(
      event.clientX - pointerStartXRef.current,
      event.clientY - pointerStartYRef.current,
    );
  }, []);

  const onPointerUp = useCallback(
    (event: CalendarPointerEvent) => {
      if (
        event.pointerId !== pointerIdRef.current ||
        pointerStartXRef.current === null ||
        pointerStartYRef.current === null
      ) {
        return;
      }

      const deltaX = event.clientX - pointerStartXRef.current;
      const deltaY = event.clientY - pointerStartYRef.current;
      const axis =
        gestureAxisRef.current ??
        getCalendarGestureAxis(deltaX, deltaY);
      const direction = getCalendarSwipeDirection(deltaX, axis);

      resetGesture();

      if (direction) {
        onSwipe(direction);
      }
    },
    [onSwipe, resetGesture],
  );

  const onPointerCancel = useCallback(
    (event: CalendarPointerEvent) => {
      if (event.pointerId === pointerIdRef.current) {
        resetGesture();
      }
    },
    [resetGesture],
  );

  const onLostPointerCapture = useCallback(
    (event: CalendarPointerEvent) => {
      if (event.pointerId === pointerIdRef.current) {
        resetGesture();
      }
    },
    [resetGesture],
  );

  useEffect(() => {
    const resetOnPageLifecycle = () => resetGesture();

    window.addEventListener("pageshow", resetOnPageLifecycle);
    document.addEventListener(
      "visibilitychange",
      resetOnPageLifecycle,
    );

    return () => {
      window.removeEventListener("pageshow", resetOnPageLifecycle);
      document.removeEventListener(
        "visibilitychange",
        resetOnPageLifecycle,
      );
      resetGesture();
    };
  }, [resetGesture]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
  };
}
