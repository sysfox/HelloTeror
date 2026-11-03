"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, EASE, prefersReducedMotion } from "@/lib/anime";
import { useLocale } from "@/contexts/LocaleContext";
import type { ContributionCalendar, ContributionDay } from "@/types";
import styles from "@/components/sections/stats/graph.module.css";

/**
 * GitHub 贡献热图（VOID 版）+ 对角波浪点亮。
 *
 * 动画：按 (week, day) 手算延迟 —— week * WAVE_COL_MS + day * WAVE_ROW_MS，
 * 形成一道自左上向右下倾斜扫过的波。
 * 这里刻意**不用** anime 的 grid stagger：grid stagger 假定 DOM 为行优先，
 * 而本组件为了让格子成为 .anime-init-children 的**直接子级**（FOUC 类只作用于
 * 直接子级），用 grid-auto-flow: column 排成列优先，两者顺序假设不一致。
 *
 * 视觉：色阶用 color-mix 从 --accent 派生（随主题变化）；高等级格子带发光；
 * 覆盖层是与网格**同级**的扫描带（不能作为网格子级，否则会被 anime-init-children
 * 一起隐藏/缩放）；顶部有月份轴、左侧有星期轴，hover 时右上角给出读数。
 *
 * 数据：weeks 每周恒为 7 项，窗口外为 null（服务端已补齐，见 lib/github.ts）。
 * start 由 StatsSection 在数据就绪后置 true，动画永不读随机数。
 */

/** 相邻周（列）之间的波前延迟（ms） */
const WAVE_COL_MS = 16;
/** 相邻天（行）之间的波前延迟（ms），大于列步长 → 波前向右下倾斜 */
const WAVE_ROW_MS = 26;

/** 单元格边长 / 间距（px）：与 graph.module.css 中的轴标签定位假设一致 */
const CELL = 12;
const GAP = 3;
const STRIDE = CELL + GAP;
/** 月份轴高度（px）：星期列用同样的顶部偏移对齐网格 */
const MONTH_AXIS_H = 16;

/** 各等级格子的填充色：0 用中性面板色，1~4 用强调色递进 */
const LEVEL_BG: Record<ContributionDay["level"], string> = {
  0: "var(--surface-strong)",
  1: "color-mix(in oklab, var(--accent) 24%, transparent)",
  2: "color-mix(in oklab, var(--accent) 46%, transparent)",
  3: "color-mix(in oklab, var(--accent) 70%, transparent)",
  4: "var(--accent)",
};

/** 只标周一到周五中的奇数行，避免左侧标签过密（GitHub 同款做法） */
const WEEKDAY_ROWS = [1, 3, 5] as const;

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
  const [hover, setHover] = useState<ContributionDay | null>(null);

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

  // 格式化器按 locale 缓存，避免 hover 引发整图重渲染时反复构造 Intl 实例
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
    [intlLocale]
  );

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(intlLocale, { month: "short", timeZone: "UTC" }),
    [intlLocale]
  );

  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale, {
      weekday: "short",
      timeZone: "UTC",
    });
    // 2024-01-07 是周日，用它做基准推 0..6
    return Array.from({ length: 7 }, (_, d) =>
      fmt.format(new Date(Date.UTC(2024, 0, 7 + d)))
    );
  }, [intlLocale]);

  const weeks = calendar.weeks;
  const gridWidth =
    weeks.length > 0 ? weeks.length * CELL + (weeks.length - 1) * GAP : 0;

  // 月份轴：取每周第一个非 null 日期，月份变化时打标；相邻标签至少隔 2 列，
  // 避免跨年窗口开头出现 "DecJan" 叠字。
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    let lastCol = -99;
    weeks.forEach((week, col) => {
      const first = week.find((d): d is ContributionDay => d !== null);
      if (!first) return;
      const month = Number(first.date.slice(5, 7));
      if (month !== lastMonth && col - lastCol >= 2) {
        lastMonth = month;
        lastCol = col;
        labels.push({
          col,
          label: monthFormatter.format(new Date(`${first.date}T00:00:00Z`)),
        });
      }
    });
    return labels;
  }, [weeks, monthFormatter]);

  const tooltip = (day: ContributionDay) => {
    const date = dateFormatter.format(new Date(`${day.date}T00:00:00Z`));
    return day.count === 0
      ? t.stats.graphTooltipEmpty(date)
      : t.stats.graphTooltip(day.count, date);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <span className={styles.label}>{t.stats.graphLabel}</span>
          <span className={styles.total}>
            {t.stats.graphTotal(calendar.total.toLocaleString(intlLocale))}
          </span>
        </div>
        <div className={styles.readout}>
          {hover ? tooltip(hover) : " "}
        </div>
      </div>

      {/* 外层 overflow 容器负责窄屏横向滚动；内层 w-max 与网格同宽 */}
      <div className={`${styles.scroll} overflow-x-auto no-scrollbar`}>
        <div className="w-max">
          <div className="flex">
            {/* 星期轴：只显示 Mon / Wed / Fri，与 7 行网格对齐 */}
            <div
              className={styles.weekdays}
              style={{ marginTop: MONTH_AXIS_H, gap: GAP }}
              aria-hidden
            >
              {Array.from({ length: 7 }, (_, d) => (
                <span
                  key={d}
                  style={{ height: CELL, lineHeight: `${CELL}px` }}
                  className={styles.weekday}
                >
                  {WEEKDAY_ROWS.includes(d as 1 | 3 | 5)
                    ? weekdayLabels[d]
                    : ""}
                </span>
              ))}
            </div>

            <div>
              {/* 月份轴 */}
              <div
                className={styles.months}
                style={{ width: gridWidth, height: MONTH_AXIS_H }}
                aria-hidden
              >
                {monthLabels.map((m) => (
                  <span
                    key={`${m.col}-${m.label}`}
                    className={styles.month}
                    style={{ left: m.col * STRIDE }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>

              <div
                className={styles.plot}
                style={{ width: gridWidth, height: 7 * CELL + 6 * GAP }}
              >
                {/* 网格：列优先铺排（每列一周） */}
                <div
                  ref={gridRef}
                  className="anime-init-children grid"
                  style={{
                    gridAutoFlow: "column",
                    gridTemplateRows: `repeat(7, ${CELL}px)`,
                    gap: GAP,
                  }}
                >
                  {weeks.flatMap((week, w) =>
                    week.map((day, d) =>
                      day === null ? (
                        // 窗口外占位：保持网格对齐，但不可见、不参与动画
                        <span
                          key={`${w}-${d}`}
                          aria-hidden
                          style={{ width: CELL, height: CELL }}
                        />
                      ) : (
                        <span
                          key={`${w}-${d}`}
                          data-contrib-cell
                          data-level={day.level}
                          title={tooltip(day)}
                          onPointerEnter={() => setHover(day)}
                          onPointerLeave={() => setHover(null)}
                          className={styles.cell}
                          style={{
                            width: CELL,
                            height: CELL,
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
              </div>
            </div>
          </div>

          {/* 图例：少 → 多（对齐到网格右边缘） */}
          <div className={styles.legend}>
            <span>{t.stats.graphLess}</span>
            {([0, 1, 2, 3, 4] as const).map((level) => (
              <span
                key={level}
                aria-hidden
                className={styles.legendCell}
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
    </div>
  );
}
