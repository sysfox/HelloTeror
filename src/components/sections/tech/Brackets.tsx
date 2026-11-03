import type { CSSProperties } from "react";

/**
 * HUD 四角括号。纯装饰（aria-hidden）：四个 span 各自只画两条边。
 *
 * color 默认取 --accent-border；传 color-mix 字符串即可随仪表主题色变化。
 * inset 允许向内收，避免被父级 overflow: hidden 裁掉。
 */
export function Brackets({
  color = "var(--accent-border)",
  size = 10,
  inset = 0,
}: {
  color?: string;
  size?: number;
  inset?: number;
}) {
  const base: CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    pointerEvents: "none",
    opacity: 0.9,
  };

  return (
    <>
      <span
        aria-hidden
        style={{
          ...base,
          top: inset,
          left: inset,
          borderTop: `1px solid ${color}`,
          borderLeft: `1px solid ${color}`,
        }}
      />
      <span
        aria-hidden
        style={{
          ...base,
          top: inset,
          right: inset,
          borderTop: `1px solid ${color}`,
          borderRight: `1px solid ${color}`,
        }}
      />
      <span
        aria-hidden
        style={{
          ...base,
          bottom: inset,
          left: inset,
          borderBottom: `1px solid ${color}`,
          borderLeft: `1px solid ${color}`,
        }}
      />
      <span
        aria-hidden
        style={{
          ...base,
          bottom: inset,
          right: inset,
          borderBottom: `1px solid ${color}`,
          borderRight: `1px solid ${color}`,
        }}
      />
    </>
  );
}
