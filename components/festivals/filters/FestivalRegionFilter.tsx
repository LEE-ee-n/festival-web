"use client";

import FestivalFilterMenu from "@/components/festivals/filters/FestivalFilterMenu";
import type {
  PublicFestivalRegion,
  PublicFestivalRegionFilter,
} from "@/lib/festivals/publicFestivalOverview";

type FestivalRegionFilterProps = {
  regions: PublicFestivalRegion[];
  value: PublicFestivalRegionFilter;
  onChange: (value: PublicFestivalRegionFilter) => void;
  desktopAlign?: "left" | "right";
};

export default function FestivalRegionFilter({
  regions,
  value,
  onChange,
  desktopAlign = "left",
}: FestivalRegionFilterProps) {
  const options = [
    { value: "all" as const, label: "전체 지역" },
    ...regions.map((region) => ({ value: region, label: region })),
  ];

  return (
    <FestivalFilterMenu<PublicFestivalRegionFilter>
      title="지역"
      options={options}
      value={value}
      onChange={onChange}
      isActive={value !== "all"}
      desktopAlign={desktopAlign}
      renderTriggerLabel={(region) =>
        region === "all" ? "지역 필터" : `지역 필터: ${region}`
      }
    />
  );
}
