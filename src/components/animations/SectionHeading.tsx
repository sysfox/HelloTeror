"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { animate, EASE, prefersReducedMotion } from "@/lib/anime";
import { AnimeText } from "@/components/animations/AnimeText";

/**
 * 统一 section heading（简化版）：
 *  - 一行轻量元数据：编号 + 细线 + 标签
 *  - 标题只保留干净的逐字纵深入场，不做 HUD chip / 标尺 / 描边重影
 *
 * 入场仍靠毫秒时序协调：编号先落位 → 标签淡入 → 标题（startDelay）。
 * FOUC / reduced-motion：编号与标签初始 inline opacity:0；
 * AnimeText 自带 anime-init-children 隐态，CSS 兜底负责 reduced-motion。
 */
type SectionHeadingProps = {
  /** 编号，如 "01" */
  index: string;
  /** 标签，如 "About" / "Tech Stack" */
  label: string;
  /** 巨型标题文本，交由 AnimeText 逐字入场 */
  title: string;
  titleClassName?: string;
  titleStyle?: CSSProperties;
  /** 标题整体起始延迟（ms），默认 200，与现有 StaggerGroup 时序一致 */
  startDelay?: number;
};

export function SectionHeading({
  index,
  label,
  title,
  titleClassName = "",
  titleStyle,
  startDelay = 200,
}: SectionHeadingProps) {
  const indexRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const idx = indexRef.current;
    const lbl = labelRef.current;

    // reduced-motion：跳过动画，直接置终态
    if (prefersReducedMotion()) {
      if (idx) idx.style.opacity = "1";
      if (lbl) lbl.style.opacity = "1";
      return;
    }

    const a1 = idx
      ? animate(idx, {
          opacity: [0, 1],
          translateX: [-10, 0],
          duration: 420,
          ease: EASE.expo,
        })
      : null;
    const a2 = lbl
      ? animate(lbl, {
          opacity: [0, 1],
          translateY: [4, 0],
          duration: 380,
          delay: 120,
          ease: EASE.expo,
        })
      : null;

    return () => {
      a1?.revert();
      a2?.revert();
    };
  }, []);

  return (
    <div className="mb-7">
      {/* 轻量元数据行：编号 + 细线 + 标签 */}
      <div className="mb-4 flex items-center gap-3">
        <span
          ref={indexRef}
          className="font-mono text-[11px] tabular-nums"
          style={{ color: "var(--accent)", opacity: 0 }}
        >
          {index}
        </span>
        <span
          aria-hidden
          className="h-px flex-1"
          style={{ background: "var(--border-subtle)" }}
        />
        <span
          ref={labelRef}
          className="font-mono text-[10px] uppercase"
          style={{
            color: "var(--text-tertiary)",
            letterSpacing: "0.22em",
            opacity: 0,
          }}
        >
          {label}
        </span>
      </div>

      <AnimeText
        as="h2"
        text={title}
        delay={startDelay}
        staggerMs={24}
        from="first"
        duration={900}
        y={36}
        blur={12}
        depth={100}
        className={`relative text-[clamp(2.5rem,7vw,5rem)] font-semibold tracking-[-0.03em] leading-[1.05] ${titleClassName}`}
        style={{
          color: "var(--text-primary)",
          textWrap: "balance",
          ...titleStyle,
        }}
      />
    </div>
  );
}
