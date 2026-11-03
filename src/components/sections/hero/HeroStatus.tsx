"use client";

import type { CSSProperties } from "react";
import { Activity, Clock3, MapPin } from "lucide-react";

/**
 * Hero 右侧实时状态条：位置 / 可用性 / 时区三格 HUD 读数。
 * 文案来自字典（locationLabel、online 由父级传入），保证语言切换即时生效。
 * 在线点用本地 keyframes 呼吸；reduced-motion 下停用。
 */
const STATUS_CSS = `
@keyframes hero-live-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 var(--accent-glow, rgba(90,242,255,0.35)); }
  50% { opacity: 0.7; box-shadow: 0 0 0 4px transparent; }
}
.hero-live-dot { animation: hero-live-pulse 2.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .hero-live-dot { animation: none !important; }
}
`;

type HeroStatusProps = {
  locationLabel: string;
  locationValue: string;
  online: string;
};

/** 四角括号：HUD 面板的角标语言，颜色跟随强调色 */
function CornerBrackets({ color }: { color: string }) {
  const base: CSSProperties = {
    position: "absolute",
    width: 9,
    height: 9,
    borderStyle: "solid",
    borderColor: color,
    opacity: 0.85,
    pointerEvents: "none",
  };
  return (
    <>
      <span
        aria-hidden
        style={{ ...base, top: 0, left: 0, borderWidth: "1px 0 0 1px" }}
      />
      <span
        aria-hidden
        style={{ ...base, top: 0, right: 0, borderWidth: "1px 1px 0 0" }}
      />
      <span
        aria-hidden
        style={{ ...base, bottom: 0, left: 0, borderWidth: "0 0 1px 1px" }}
      />
      <span
        aria-hidden
        style={{ ...base, bottom: 0, right: 0, borderWidth: "0 1px 1px 0" }}
      />
    </>
  );
}

export function HeroStatus({
  locationLabel,
  locationValue,
  online,
}: HeroStatusProps) {
  const cells = [
    {
      key: "loc",
      label: locationLabel,
      value: locationValue,
      icon: <MapPin size={12} />,
      accent: "var(--accent)",
      live: false,
    },
    {
      key: "live",
      label: "LINK",
      value: online,
      icon: <Activity size={12} />,
      accent: "var(--accent)",
      live: true,
    },
    {
      key: "clock",
      label: "CLOCK",
      value: "UTC+8",
      icon: <Clock3 size={12} />,
      accent: "var(--accent-3, #ffc46b)",
      live: false,
    },
  ] as const;

  return (
    <div
      className="relative overflow-hidden border"
      style={{
        borderColor: "var(--border-subtle)",
        background:
          "linear-gradient(150deg, var(--surface-strong, var(--surface)), var(--surface) 55%, transparent)",
        backdropFilter: "blur(10px)",
      }}
    >
      <style>{STATUS_CSS}</style>
      <CornerBrackets color={"var(--accent-border, rgba(90,242,255,0.42))"} />

      <div className="relative grid grid-cols-3">
        {cells.map((cell, i) => (
          <div
            key={cell.key}
            className="flex min-w-0 flex-col gap-1.5 px-3 py-2.5"
            style={{
              borderLeft:
                i > 0 ? "1px solid var(--border-subtle)" : undefined,
            }}
          >
            <span
              className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.22em]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <span style={{ color: cell.accent }}>{cell.icon}</span>
              <span className="truncate">{cell.label}</span>
            </span>
            <span
              className="flex items-center gap-1.5 truncate text-[11px] font-mono tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {cell.live && (
                <span
                  className="hero-live-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <span className="truncate">{cell.value}</span>
            </span>
          </div>
        ))}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)",
        }}
      />
    </div>
  );
}
