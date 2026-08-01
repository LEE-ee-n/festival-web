import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent } from "react";

import {
  getCalendarGestureAxis,
  getCalendarSwipeDirection,
  shouldCaptureCalendarGesture,
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
  const pointerTargetRef = useRef<HTMLDivElement | null>(null);

  const resetGesture = useCallback(() => {
    const pointerId = pointerIdRef.current;
    const pointerTarget = pointerTargetRef.current;

    pointerIdRef.current = null;
    pointerStartXRef.current = null;
    pointerStartYRef.current = null;
    gestureAxisRef.current = null;
    pointerTargetRef.current = null;

    if (
      pointerId !== null
      && pointerTarget?.hasPointerCapture(pointerId)
    ) {
      try {
        pointerTarget.releasePointerCapture(pointerId);
      } catch {
        // 브라우저가 이미 포인터 소유권을 회수한 경우에는 상태 초기화만 유지한다.
      }
    }
  }, []);

  const onPointerDown = useCallback((event: CalendarPointerEvent) => {
    if (!event.isPrimary) return;

    resetGesture();
    pointerIdRef.current = event.pointerId;
    pointerStartXRef.current = event.clientX;
    pointerStartYRef.current = event.clientY;
    gestureAxisRef.current = null;
    pointerTargetRef.current = event.currentTarget;
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

    const axis = getCalendarGestureAxis(
      event.clientX - pointerStartXRef.current,
      event.clientY - pointerStartYRef.current,
    );

    gestureAxisRef.current = axis;

    if (
      shouldCaptureCalendarGesture(axis)
      && !event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        resetGesture();
      }
    }
  }, [resetGesture]);

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
