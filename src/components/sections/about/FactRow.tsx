"use client";

import type { LucideIcon } from "lucide-react";

/**
 * Dossier 数据行：序号 + 图标 + 标签 + 点线引导 + 值。
 * 用点线（border-dotted）代替卡片，读起来像终端里的 key/value 读数。
 * hover 只切换背景与底边，避免整块面板跳动。
 */
type FactRowProps = {
  index: string;
  icon: LucideIcon;
  label: string;
  value: string;
};

export function FactRow({ index, icon: Icon, label, value }: FactRowProps) {
  return (
    <div
      className="group relative -mx-2 flex items-center gap-2.5 border-b px-2 py-2.5 transition-colors duration-200"
      style={{ borderColor: "var(--border-subtle)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface-hover)";
        e.currentTarget.style.borderColor =
          "var(--accent-border, rgba(90,242,255,0.42))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
      }}
    >
      <span
        aria-hidden
        className="shrink-0 font-mono text-[9px] tabular-nums"
        style={{ color: "var(--text-tertiary)" }}
      >
        {index}
      </span>
      <Icon
        size={13}
        className="shrink-0"
        style={{ color: "var(--accent)" }}
      />
      <span
        className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em]"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <span
        aria-hidden
        className="mx-1 hidden min-w-3 flex-1 border-b border-dotted sm:block"
        style={{ borderColor: "var(--border-strong)", opacity: 0.5 }}
      />
      <span
        className="min-w-0 flex-1 text-right text-[11px] font-medium sm:flex-none sm:text-xs"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}
