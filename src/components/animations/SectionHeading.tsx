"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { animate, EASE, prefersReducedMotion } from "@/lib/anime";
import { AnimeAccentLine } from "@/components/animations/AnimeAccentLine";
import { AnimeText } from "@/components/animations/AnimeText";

/**
 * 统一 section heading（VOID PROTOCOL HUD 版）：
 *  - 编号 chip：切角面板 + 呼吸指示点，工业仪表编号
 *  - 扫描强调线：AnimeAccentLine 自驱绘制（能量束带辉光）
 *  - mono 标签：大写、超宽字距，HUD 元数据
 *  - 巨型标题：AnimeText 逐字纵深入场（Z/模糊），不再叠加色差重影或描边重影；
 *    文字保持干净，视觉纵深交给背景 3D 场景
 *
 * 「装配式」入场：编号落位（0ms）→ 能量线绘制（AnimeAccentLine 自驱 accentDelay）
 * → 标签淡入（260ms）→ 深度层与标题（startDelay）。三者靠时序协调，不共享
 * timeline，避免与 AnimeAccentLine 双重控制（同 SectionReveal 注释的约束）。
 *
 * FOUC / reduced-motion：AnimeText 自带 anime-init-children 隐态 + CSS 兜底；
 * 编号/标签/深度层初始 inline opacity:0，由 effect 抬升，reduced-motion 直接置终态。
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

    // reduced-motion：跳过动画，直接置终态
    if (prefersReducedMotion()) {
      if (idx) idx.style.opacity = "1";
      if (lbl) lbl.style.opacity = "1";
      return;
    }

    const a1 = idx
      ? animate(idx, {
          opacity: [0, 1],
          translateX: [-18, 0],
          filter: ["blur(6px)", "blur(0px)"],
          duration: 520,
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
  }, [startDelay]);

  const titleStyles: CSSProperties = {
    color: "var(--text-primary)",
    textShadow: "0 0 42px var(--accent-glow)",
    textWrap: "balance",
    ...titleStyle,
  };

  return (
    <div className="mb-7">
      {/* 元数据条：编号 chip + 能量线 + mono 标签 + 右侧 HUD 标尺 */}
      <div className="flex items-center gap-3 mb-5">
        <span
          ref={indexRef}
          className="inline-flex items-center gap-2 px-2 py-1 font-mono text-[11px] tabular-nums"
          style={{
            color: "var(--accent, #5af2ff)",
            border: "1px solid var(--border-subtle)",
            background: "var(--surface)",
            letterSpacing: "0.18em",
            clipPath:
              "polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px))",
            opacity: 0,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 5,
              height: 5,
              background: "var(--accent, #5af2ff)",
              boxShadow: "0 0 8px var(--accent-glow)",
            }}
          />
          {index}
        </span>

        <AnimeAccentLine delay={accentDelay} />

        <span
          ref={labelRef}
          className="font-mono text-[11px] uppercase"
          style={{
            color: "var(--text-tertiary)",
            letterSpacing: "0.28em",
            opacity: 0,
          }}
        >
          {label}
        </span>

        {/* HUD 标尺：细密刻度 + 末端方块，纯装饰（窄屏隐藏防挤行） */}
        <span
          aria-hidden
          className="hidden sm:block flex-1 ml-auto h-[7px]"
          style={{
            background:
              "repeating-linear-gradient(90deg, var(--grid-line) 0 1px, transparent 1px 7px)",
            opacity: 0.7,
          }}
        />
        <span
          aria-hidden
          className="hidden sm:block w-1.5 h-1.5"
          style={{
            background: "var(--accent, #5af2ff)",
            boxShadow: "0 0 8px var(--accent-glow)",
          }}
        />
      </div>

      {/* 标题：干净的逐字纵深入场，不叠加描边 / 色差重影 */}
      <AnimeText
        as="h2"
        text={title}
        delay={startDelay}
        staggerMs={26}
        from="first"
        duration={900}
        y={46}
        blur={14}
        depth={140}
        className={`relative text-[clamp(2.5rem,7vw,5rem)] font-semibold tracking-[-0.03em] leading-[1.05] ${titleClassName}`}
        style={titleStyles}
      />
    </div>
  );
}
