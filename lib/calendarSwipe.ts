export type CalendarGestureAxis = "horizontal" | "vertical";
export type CalendarSwipeDirection = "previous" | "next";

export const CALENDAR_GESTURE_DECISION_DISTANCE = 10;
export const CALENDAR_HORIZONTAL_AXIS_RATIO = 1.1;
export const CALENDAR_SWIPE_DISTANCE = 45;

export function getCalendarGestureAxis(
  deltaX: number,
  deltaY: number,
): CalendarGestureAxis | null {
  const horizontalDistance = Math.abs(deltaX);
  const verticalDistance = Math.abs(deltaY);

  if (
    Math.max(horizontalDistance, verticalDistance) <
    CALENDAR_GESTURE_DECISION_DISTANCE
  ) {
    return null;
  }

  if (
    horizontalDistance >=
    verticalDistance * CALENDAR_HORIZONTAL_AXIS_RATIO
  ) {
    return "horizontal";
  }

  if (
    verticalDistance >=
    horizontalDistance * CALENDAR_HORIZONTAL_AXIS_RATIO
  ) {
    return "vertical";
  }

  return null;
}

export function getCalendarSwipeDirection(
  deltaX: number,
  axis: CalendarGestureAxis | null,
): CalendarSwipeDirection | null {
  if (
    axis !== "horizontal" ||
    Math.abs(deltaX) < CALENDAR_SWIPE_DISTANCE
  ) {
    return null;
  }

  return deltaX < 0 ? "next" : "previous";
}
