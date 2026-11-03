"use client";

import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import type { StatItem } from "@/types";
import { Brackets } from "./Brackets";
import { SparkBars } from "./SparkBars";
import styles from "./stats.module.css";

/**
 * 遥测仪表卡片。
 *
 * - 大数字用 useCountUp 从 0 计到目标值（API 不变）
 * - 右上角仪表环的进度直接由 count-up 的**当前值**推导，因此数字与弧线
 *   天然同步，不需要第二条动画；没有进度百分比文案，避免把满量程误读为
 *   真实比例（scale 只是视觉参考值）。
 * - 底部频谱条由 SparkBars 负责入场
 */
export type GaugeStat = StatItem & {
  icon: LucideIcon;
  /** 仪表满量程（仅视觉；不展示百分比） */
  scale: number;
  /** 主题色：var(--accent) / var(--accent-2, ...) 等 */
  hud: string;
};

const RING_R = 27;
const RING_C = 2 * Math.PI * RING_R;
/** 仪表环只画 270°，留出右下缺口 */
const RING_ARC = RING_C * 0.75;
const TICKS = 20;

function GaugeRing({
  Icon,
  hud,
  ratio,
}: {
  Icon: LucideIcon;
  hud: string;
  ratio: number;
}) {
  const ticks = Array.from({ length: TICKS }, (_, i) => {
    const angle = ((135 + (270 / (TICKS - 1)) * i) * Math.PI) / 180;
    return {
      x1: 32 + Math.cos(angle) * 30.5,
      y1: 32 + Math.sin(angle) * 30.5,
      x2: 32 + Math.cos(angle) * 33,
      y2: 32 + Math.sin(angle) * 33,
      // 刻度同时充当第二层进度读数
      on: i / (TICKS - 1) <= ratio,
    };
  });

  return (
    <div className={styles.gauge}>
      <svg viewBox="-2 -2 68 68" aria-hidden="true" focusable="false">
        <g transform="rotate(135 32 32)">
          <circle
            cx="32"
            cy="32"
            r={RING_R}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="1.5"
            strokeDasharray={`${RING_ARC} ${RING_C}`}
          />
          {/* 宽而淡的第二道描边代替 filter 发光：退出快照会剥离 filter，不依赖它 */}
          <circle
            cx="32"
            cy="32"
            r={RING_R}
            fill="none"
            stroke={hud}
            strokeWidth="5"
            strokeOpacity="0.16"
            strokeDasharray={`${RING_ARC * ratio} ${RING_C}`}
          />
          <circle
            cx="32"
            cy="32"
            r={RING_R}
            fill="none"
            stroke={hud}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray={`${RING_ARC * ratio} ${RING_C}`}
          />
        </g>
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.on ? hud : "var(--grid-line)"}
            strokeWidth="0.8"
            opacity={tick.on ? 0.85 : 0.5}
          />
        ))}
      </svg>
      <span className={styles.gaugeIcon} style={{ color: hud }}>
        <Icon size={14} />
      </span>
    </div>
  );
}

export function GaugeCard({
  stat,
  index,
  start,
  intlLocale,
}: {
  stat: GaugeStat;
  index: number;
  start: boolean;
  intlLocale: string;
}) {
  const value = useCountUp(stat.value, {
    duration: 1600,
    start,
    decimals: stat.decimals ?? 0,
  });
  const Icon = stat.icon;
  const ratio =
    stat.scale > 0 ? Math.min(1, Math.max(0, value / stat.scale)) : 0;

  return (
    <div
      className={styles.card}
      style={{ "--hud": stat.hud } as CSSProperties}
    >
      <Brackets
        color={`color-mix(in oklab, ${stat.hud} 48%, transparent)`}
        size={9}
        inset={6}
      />

      <div className={styles.topRow}>
        <span className={styles.index}>
          {`0x${String(index + 1).padStart(2, "0")}`}
        </span>
        <GaugeRing Icon={Icon} hud={stat.hud} ratio={ratio} />
      </div>

      <div className={styles.valueRow}>
        <span className={styles.value} style={{ color: "var(--text-primary)" }}>
          {value.toLocaleString(intlLocale)}
        </span>
        {stat.suffix && (
          <span className={styles.suffix} style={{ color: stat.hud }}>
            {stat.suffix}
          </span>
        )}
      </div>

      <p className={styles.label}>{stat.label}</p>

      <SparkBars seed={stat.id} hud={stat.hud} start={start} />
    </div>
  );
}

/** 数据加载中的 HUD 骨架：形状与真实卡片一致，避免加载完成时布局跳动 */
export function GaugeSkeleton() {
  return (
    <div className={styles.card}>
      {/* 骨架同样带角标，保持面板语汇连续 */}
      <Brackets size={9} inset={6} />

      <div className={styles.topRow}>
        <span
          className={styles.skeletonBar}
          style={{ width: 26, height: 8, marginTop: 6 }}
        />
        <span className={styles.skeletonRing} />
      </div>

      <span
        className={styles.skeletonBar}
        style={{ width: 92, height: 30, marginTop: 6 }}
      />
      <span
        className={styles.skeletonBar}
        style={{ width: 74, height: 8, marginTop: 14 }}
      />

      <div className={styles.sparkRow} style={{ marginTop: 16 }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className={styles.skeletonBar}
            style={{
              flex: "1 1 auto",
              height: `${20 + ((i * 37) % 62)}%`,
              animationDelay: `${(i % 6) * 0.12}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
