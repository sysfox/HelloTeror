import type { CSSProperties } from "react";

/**
 * HUD 四角括号（stats 版）。纯装饰 aria-hidden。
 * color 可传 color-mix(...) 字符串，让角标跟随每张仪表卡的 --hud 主题色。
 */
export function Brackets({
  color = "var(--accent-border)",
  size = 9,
  inset = 6,
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
    zIndex: 1,
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
