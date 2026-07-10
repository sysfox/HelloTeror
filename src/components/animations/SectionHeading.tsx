"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { animate, EASE, prefersReducedMotion } from "@/lib/anime";
import { AnimeAccentLine } from "@/components/animations/AnimeAccentLine";
import { AnimeText } from "@/components/animations/AnimeText";

/**
 * 统一 section heading：元数据条（// 0N + 描边线 + 标签）+ 巨型 AnimeText 标题。
 *
 * 替代 5 个 section 里重复的 heading + 小字 h2 范式，统一为 animejs.com 式
 * 巨型字时刻。标题用 AnimeText（逐字位移 + 模糊入场），与 Hero 的 ScrambleText
 *（洗牌解码）形成明确层级区分：Hero = 解码、Section = 逐字浮现，避免整页
 * 都是解码造成视觉重复。
 *
 * 元数据条「装配式」入场：// 0N 编号落位（0ms）→ 描边线绘制（AnimeAccentLine
 * 自驱 accentDelay）→ 标签淡入（260ms）。三者靠时序协调，不共享 timeline，
 * 避免与 AnimeAccentLine 双重控制（见 SectionReveal 注释的同款约束）。
 *
 * FOUC / reduced-motion：AnimeText 自带 anime-init-children 隐态 + CSS 兜底
 *（reduced-motion 下 opacity:1）。编号/标签初始 inline opacity:0，anime.js
 * 抬升；reduced-motion 由 effect 直接置 opacity:1。副标题由各 section 自行渲染。
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
  /** 描边线延迟（ms），默认 120 */
  accentDelay?: number;
};

export function SectionHeading({
  index,
  label,
  title,
  titleClassName = "",
  titleStyle,
  startDelay = 200,
  accentDelay = 120,
}: SectionHeadingProps) {
  const indexRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const idx = indexRef.current;
    const lbl = labelRef.current;
    if (prefersReducedMotion()) {
      if (idx) idx.style.opacity = "1";
      if (lbl) lbl.style.opacity = "1";
      return;
    }
    const a1 = idx
      ? animate(idx, {
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 480,
          ease: EASE.expo,
        })
      : null;
    const a2 = lbl
      ? animate(lbl, {
          opacity: [0, 1],
          translateY: [6, 0],
          duration: 480,
          delay: 260,
          ease: EASE.expo,
        })
      : null;
    return () => {
      a1?.revert();
      a2?.revert();
    };
  }, []);

  return (
    <div className="mb-6">
      {/* 元数据条：// 0N + 描边线 + 标签（三者左→右装配入场） */}
      <div className="flex items-center gap-3 mb-4">
        <span
          ref={indexRef}
          className="text-xs font-mono"
          style={{ color: "var(--accent)", opacity: 0 }}
        >
          {`// ${index}`}
        </span>
        <AnimeAccentLine delay={accentDelay} />
        <span
          ref={labelRef}
          className="text-xs uppercase tracking-[0.3em]"
          style={{ color: "var(--text-tertiary)", opacity: 0 }}
        >
          {label}
        </span>
      </div>

      {/* 巨型标题：AnimeText 逐字浮现 */}
      <AnimeText
        as="h2"
        text={title}
        delay={startDelay}
        staggerMs={28}
        from="first"
        duration={900}
        className={`text-[clamp(2.5rem,7vw,5rem)] font-semibold tracking-tight leading-[1.05] ${titleClassName}`}
        style={{
          color: "var(--text-primary)",
          textWrap: "balance",
          ...titleStyle,
        }}
      />
    </div>
  );
}
