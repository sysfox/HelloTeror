"use client";

import type { CSSProperties } from "react";
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
 * FOUC / reduced-motion：AnimeText 自带 anime-init-children 隐态 + CSS 兜底
 *（reduced-motion 下 opacity:1）。副标题由各 section 自行渲染（内容/位置差异大）。
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
  return (
    <div className="mb-6">
      {/* 元数据条：// 0N + 描边线 + 标签 */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="text-xs font-mono"
          style={{ color: "var(--accent)" }}
        >
          {`// ${index}`}
        </span>
        <AnimeAccentLine delay={accentDelay} />
        <span
          className="text-xs uppercase tracking-[0.3em]"
          style={{ color: "var(--text-tertiary)" }}
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
