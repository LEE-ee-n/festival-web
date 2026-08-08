type LineupScheduleInput = {
  performanceDate: string | null;
  performanceTime: string | null;
  performanceEndTime: string | null;
  festivalStartDate: string | null;
  festivalEndDate: string | null;
};

export function validateLineupSchedule({
  performanceDate,
  performanceTime,
  performanceEndTime,
  festivalStartDate,
  festivalEndDate,
}: LineupScheduleInput): string | null {
  const hasStartTime = Boolean(performanceTime);
  const hasEndTime = Boolean(performanceEndTime);

  if (!performanceDate && (hasStartTime || hasEndTime)) {
    return "시간을 입력하려면 공연 날짜를 먼저 입력해 주세요.";
  }

  if (
    performanceDate &&
    festivalStartDate &&
    festivalEndDate &&
    (performanceDate < festivalStartDate || performanceDate > festivalEndDate)
  ) {
    return `공연 날짜는 페스티벌 기간(${festivalStartDate} ~ ${festivalEndDate}) 안에서 입력해 주세요.`;
  }

  if (hasEndTime && !hasStartTime) {
    return "종료 시간을 입력하려면 시작 시간을 먼저 입력해 주세요.";
  }

  if (
    performanceTime &&
    performanceEndTime &&
    performanceEndTime <= performanceTime
  ) {
    return "종료 시간은 시작 시간보다 늦어야 합니다.";
  }

  return null;
}
