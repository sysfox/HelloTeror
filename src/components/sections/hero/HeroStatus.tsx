"use client";

import { Activity, Clock3, MapPin } from "lucide-react";

/**
 * Hero 右侧状态条（简化版）：位置 / 可用性 / 时区。
 * 只保留图标与值，不显示 HUD 标签、角标或扫描线。
 */
type HeroStatusProps = {
  locationValue: string;
  online: string;
};

export function HeroStatus({ locationValue, online }: HeroStatusProps) {
  const cells = [
    {
      key: "loc",
      value: locationValue,
      icon: <MapPin size={12} />,
      live: false,
    },
    {
      key: "live",
      value: online,
      icon: <Activity size={12} />,
      live: true,
    },
    {
      key: "clock",
      value: "UTC+8",
      icon: <Clock3 size={12} />,
      live: false,
    },
  ] as const;

  return (
    <div
      className="grid grid-cols-3 border"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface)",
      }}
    >
      {cells.map((cell, i) => (
        <div
          key={cell.key}
          className="flex min-w-0 items-center gap-1.5 px-3 py-3"
          style={{
            borderLeft: i > 0 ? "1px solid var(--border-subtle)" : undefined,
            color: "var(--text-primary)",
          }}
        >
          <span
            className="shrink-0"
            style={{ color: "var(--text-tertiary)" }}
          >
            {cell.icon}
          </span>
          {cell.live && (
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: "var(--accent)" }}
            />
          )}
          <span className="truncate text-[11px] font-medium">{cell.value}</span>
        </div>
      ))}
    </div>
  );
}
