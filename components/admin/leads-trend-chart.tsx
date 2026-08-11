"use client";

/**
 * LeadsTrendChart — plain SVG stacked bar chart, no charting library.
 * The project has no chart dependency installed (recharts etc.), and this
 * is a small, single-purpose visualization, so a hand-rolled SVG avoids
 * adding one just for this. Each bar splits Trip 2.0 enquiries (sky) from
 * coupon-popup leads (amber), matching the badge colors used in the main
 * Leads table.
 */
import { useState } from "react";

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  trip2: number;
  promo: number;
  total: number;
}

export function LeadsTrendChart({ data }: { data: TrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.total));
  const width = 100; // percent-based viewBox, scales to container
  const height = 40;
  const barWidth = data.length ? width / data.length : 0;
  const gap = barWidth * 0.25;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height + 6}`} className="h-40 w-full" preserveAspectRatio="none">
        {data.map((d, i) => {
          const trip2H = (d.trip2 / max) * height;
          const promoH = (d.promo / max) * height;
          const x = i * barWidth + gap / 2;
          const w = barWidth - gap;
          return (
            <g
              key={d.date}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              className="cursor-pointer"
            >
              <rect x={x} y={0} width={w} height={height} fill="transparent" />
              <rect x={x} y={height - trip2H} width={w} height={trip2H} className="fill-sky-400" opacity={hover === null || hover === i ? 1 : 0.35} />
              <rect
                x={x}
                y={height - trip2H - promoH}
                width={w}
                height={promoH}
                className="fill-amber-400"
                opacity={hover === null || hover === i ? 1 : 0.35}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{data[0]?.date}</span>
        {hover !== null && data[hover] ? (
          <span className="font-medium text-foreground">
            {data[hover].date} — {data[hover].total} lead{data[hover].total === 1 ? "" : "s"}{" "}
            <span className="text-sky-600">({data[hover].trip2} trip)</span>{" "}
            <span className="text-amber-600">({data[hover].promo} coupon)</span>
          </span>
        ) : (
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-sm bg-sky-400" /> Trip enquiry
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-sm bg-amber-400" /> Coupon popup
            </span>
          </span>
        )}
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
