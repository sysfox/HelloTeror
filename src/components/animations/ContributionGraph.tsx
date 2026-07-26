"use client";

import { useEffect, useRef } from "react";
import { animate, EASE, prefersReducedMotion } from "@/lib/anime";
import { useLocale } from "@/contexts/LocaleContext";
import type { ContributionCalendar, ContributionDay } from "@/types";

/**
 * GitHub 贡献热图 + 对角波浪点亮。
 *
 * 动画：按 (week, day) 手算延迟 —— week * WAVE_COL_MS + day * WAVE_ROW_MS，
 * 形成一道自左上向右下倾斜扫过的波，比整块淡入有层次得多。
 * 这里刻意**不用** anime 的 grid stagger：grid stagger 假定 DOM 为行优先，
 * 而本组件为了让格子成为 .anime-init-children 的**直接子级**（FOUC 类只作用于
 * 直接子级），用 grid-auto-flow: column 排成列优先，两者顺序假设不一致。
 * 手算延迟同时也符合本仓库"动画靠手调毫秒数协调"的惯例。
 *
 * FOUC：网格挂 anime-init-children 置直接子级 opacity:0，
 * globals.css 的 reduced-motion 块已覆盖该类，减少动效时静态显示满图。
 *
 * 数据：weeks 每周恒为 7 项，窗口外为 null（服务端已补齐，见 lib/github.ts）。
 * start 用于等数据就绪后再播，避免空数据触发动画（与 StatsSection 的 count-up 同步）。
 */

/** 相邻周（列）之间的波前延迟（ms） */
const WAVE_COL_MS = 16;
/** 相邻天（行）之间的波前延迟（ms），大于列步长 → 波前向右下倾斜 */
const WAVE_ROW_MS = 26;

/** 各等级格子的填充色：0 用中性面板色，1~4 用强调色递进 */
const LEVEL_BG: Record<ContributionDay["level"], string> = {
  0: "var(--surface-strong)",
  1: "color-mix(in oklab, var(--accent) 28%, transparent)",
  2: "color-mix(in oklab, var(--accent) 50%, transparent)",
  3: "color-mix(in oklab, var(--accent) 74%, transparent)",
  4: "var(--accent)",
};

export function ContributionGraph({
  calendar,
  start,
  startDelay = 0,
}: {
  calendar: ContributionCalendar;
  /** 数据就绪后置 true 才播放波浪 */
  start: boolean;
  startDelay?: number;
}) {
  const { t, intlLocale } = useLocale();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion()) return;
    const grid = gridRef.current;
    if (!grid) return;

    const cells = grid.querySelectorAll<HTMLElement>("[data-contrib-cell]");
    if (!cells.length) return;

    // DOM 为列优先（grid-auto-flow: column）：i / 7 = 第几周，i % 7 = 星期几
    const anim = animate(cells, {
      opacity: [0, 1],
      scale: [0.35, 1],
      duration: 520,
      // anime 的 FunctionValue 形参**全为可选**，因此这里必须写成可选参数；
      // 写成必填参数会被 TS 拿去匹配单参的 EasingFunction 而报错
      delay: (_target?: unknown, i?: number) => {
        const idx = i ?? 0;
        return (
          startDelay +
          Math.floor(idx / 7) * WAVE_COL_MS +
          (idx % 7) * WAVE_ROW_MS
        );
      },
      ease: EASE.back,
    });

    return () => {
      anim.revert();
    };
  }, [start, startDelay, calendar]);

  const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const tooltip = (day: ContributionDay) => {
    const date = dateFormatter.format(new Date(`${day.date}T00:00:00Z`));
    return day.count === 0
      ? t.stats.graphTooltipEmpty(date)
      : t.stats.graphTooltip(day.count, date);
  };

  return (
    // 外层 overflow 容器负责窄屏横向滚动；内层 w-max 与网格同宽，
    // 使标题与图例正好对齐到网格左右边缘（年初周数少时不会飘到内容列两端）
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="w-max">
        {/* 标题行：标签 + 总数 */}
        <div className="flex items-baseline justify-between gap-6 mb-2.5">
          <span
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t.stats.graphLabel}
          </span>
          <span
            className="text-[11px] font-mono tabular-nums"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t.stats.graphTotal(calendar.total.toLocaleString(intlLocale))}
          </span>
        </div>

        {/* 网格：列优先铺排（每列一周） */}
        <div
          ref={gridRef}
          className="anime-init-children grid"
          style={{
            gridAutoFlow: "column",
            gridTemplateRows: "repeat(7, minmax(0, 1fr))",
            gap: "3px",
          }}
        >
          {calendar.weeks.flatMap((week, w) =>
            week.map((day, d) =>
              day === null ? (
                // 窗口外占位：保持网格对齐，但不可见、不参与动画
                <span
                  key={`${w}-${d}`}
                  aria-hidden
                  className="w-[11px] h-[11px]"
                />
              ) : (
                <span
                  key={`${w}-${d}`}
                  data-contrib-cell
                  title={tooltip(day)}
                  className="w-[11px] h-[11px] rounded-[2px]"
                  style={{
                    background: LEVEL_BG[day.level],
                    outline:
                      day.level === 0
                        ? "1px solid var(--border-subtle)"
                        : "1px solid var(--accent-border)",
                    outlineOffset: "-1px",
                  }}
                />
              )
            )
          )}
        </div>

        {/* 图例：少 → 多（对齐到网格右边缘） */}
        <div
          className="mt-2 flex items-center justify-end gap-1.5 text-[10px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span>{t.stats.graphLess}</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span
              key={level}
              aria-hidden
              className="w-[11px] h-[11px] rounded-[2px]"
              style={{
                background: LEVEL_BG[level],
                outline:
                  level === 0
                    ? "1px solid var(--border-subtle)"
                    : "1px solid var(--accent-border)",
                outlineOffset: "-1px",
              }}
            />
          ))}
          <span>{t.stats.graphMore}</span>
        </div>
      </div>
    </div>
  );
}
