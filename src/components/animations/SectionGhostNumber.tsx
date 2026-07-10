"use client";

import type { CSSProperties } from "react";

/**
 * 巨型幽灵编号背景装置：每个 section 背景一个超大透明编号（01–05），
 * awwwards / animejs 式装置感。
 *
 * - pointer-events-none / select-none：不挡交互、不可选中
 * - -z-10：沉到内容之下；配合 section 内层容器加 `relative isolate`，
 *   让 -z-10 限定在 section 内部，不穿透到页面背景
 * - tabular-nums：编号等宽对齐
 * - 纯静态元素，无动画，reduced-motion 无需特殊处理
 */
type SectionGhostNumberProps = {
  index: string;
  className?: string;
  style?: CSSProperties;
};

export function SectionGhostNumber({
  index,
  className = "",
  style,
}: SectionGhostNumberProps) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none select-none absolute top-0 right-0 -z-10 font-semibold tabular-nums leading-none text-[clamp(10rem,30vw,22rem)] ${className}`}
      style={{
        color: "var(--text-primary)",
        opacity: 0.035,
        ...style,
      }}
    >
      {index}
    </span>
  );
}
