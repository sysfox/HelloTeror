"use client";

import type { LucideIcon } from "lucide-react";

/**
 * 数据行（简化版）：图标 + 标签 + 值。
 * 去掉序号与点线引导，保留一条轻量分隔线。
 */
type FactRowProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export function FactRow({ icon: Icon, label, value }: FactRowProps) {
  return (
    <div
      className="flex items-center gap-2.5 py-2.5"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <Icon
        size={13}
        className="shrink-0"
        style={{ color: "var(--text-tertiary)" }}
      />
      <span
        className="shrink-0 text-[10px]"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <span
        className="min-w-0 flex-1 truncate text-right text-[11px] font-medium sm:text-xs"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}
