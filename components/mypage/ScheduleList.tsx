import ScheduleItemCard from "@/components/mypage/ScheduleItemCard";
import type { UserScheduleListItem } from "@/lib/schedule/userScheduleItems";
import { typography } from "@/lib/typography";

type ScheduleListProps = {
  items: UserScheduleListItem[];
};

function formatPerformanceDate(date: string | null) {
  if (!date) return "날짜 미정";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00+09:00`));
}

export default function ScheduleList({ items }: ScheduleListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong px-5 py-10 text-center text-sm text-ink-tertiary">
        아직 선택한 공연 일정이 없습니다.
      </div>
    );
  }

  const itemsByDate = items.reduce<Map<string | null, UserScheduleListItem[]>>(
    (groups, item) => {
      const dateItems = groups.get(item.performanceDate) ?? [];
      dateItems.push(item);
      groups.set(item.performanceDate, dateItems);
      return groups;
    },
    new Map(),
  );

  return (
    <div className="space-y-6">
      {[...itemsByDate.entries()].map(([date, dateItems]) => (
        <section key={date}>
          <h3 className={`${typography.subsectionTitle} mb-3 text-ink`}>
            {formatPerformanceDate(date)}
          </h3>
          <div className="space-y-3">
            {dateItems.map((item) => (
              <ScheduleItemCard key={item.festivalArtistId} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
