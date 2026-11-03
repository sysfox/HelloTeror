"use client";

import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import type { StatItem } from "@/types";
import styles from "./stats.module.css";

/**
 * 统计卡片（简化版）：图标 + 标签 + 大数字。
 * 去掉仪表环、角标、频谱条与扫描线，保留 count-up 与卡片网格布局。
 */
export type GaugeStat = StatItem & {
  icon: LucideIcon;
  /** 仪表满量程（保留字段，当前仅用于数据定义） */
  scale: number;
  /** 图标强调色 */
  hud: string;
};

export function GaugeCard({
  stat,
  start,
  intlLocale,
}: {
  stat: GaugeStat;
  start: boolean;
  intlLocale: string;
}) {
  const value = useCountUp(stat.value, {
    duration: 1600,
    start,
    decimals: stat.decimals ?? 0,
  });
  const Icon = stat.icon;

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <span className={styles.icon} style={{ color: stat.hud }}>
          <Icon size={15} />
        </span>
        <p className={styles.label}>{stat.label}</p>
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
    </div>
  );
}

/** 数据加载中的骨架：形状与真实卡片一致，避免加载完成时布局跳动 */
export function GaugeSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <span
          className={styles.skeletonBar}
          style={{ width: 16, height: 16 }}
        />
        <span
          className={styles.skeletonBar}
          style={{ width: 72, height: 10 }}
        />
      </div>
      <span
        className={styles.skeletonBar}
        style={{ width: 90, height: 30, marginTop: 8 }}
      />
    </div>
  );
}
