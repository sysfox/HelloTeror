"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { createTimeline, EASE, prefersReducedMotion } from "@/lib/anime";

/**
 * 巨型幽灵编号背景装置：每个 section 背景一个超大透明编号（01–05），
 * awwwards / animejs 式装置感。
 *
 * 入场「materialize & ghost」：每次 section 挂载重播一条 4 属性 timeline
 *（~900ms）——扫描揭示（clipPath inset 自下而上扫开）+ 亮峰再沉淀
 *（opacity 0→0.14→0.035）+ rack 进焦点（scale 1.6→1）+ 焦点拉准
 *（blur 48px→0）。编号像信号「显影」后沉回幽灵态，每次切页重播。
 *
 * 位置一致性：本组件自带 scaffold（absolute inset-0 -z-10 + 与 section 同款
 * px-5 sm:px-6 + 内层 max-w-5xl mx-auto h-full），把编号锚定到 section 顶部
 * 与内容列右沿——无论各页内容高低，编号都落在同一坐标。需作为 section 直接
 * 子级渲染，且 section 加 `isolate` 创建 stacking context 容纳 -z-10。
 *
 * - pointer-events-none / select-none：不挡交互、不可选中
 * - tabular-nums：编号等宽对齐
 * - transformOrigin 100% 0%：锚定右上角，scale 缩放向左下，避免外溢
 * - FOUC：初始 inline opacity:0 + clipPath 收起，anime.js 抬升；
 *   reduced-motion 直接置终态
 */
type SectionGhostNumberProps = {
  index: string;
  className?: string;
  style?: CSSProperties;
  /** 入场起始延迟（ms），默认 0（与 section 内其他入场并行起始） */
  delay?: number;
};

const FINAL_OPACITY = 0.035;
const PEAK_OPACITY = 0.14;

export function SectionGhostNumber({
  index,
  className = "",
  style,
  delay = 0,
}: SectionGhostNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // reduced-motion：直接置终态，跳过显影
    if (prefersReducedMotion()) {
      el.style.opacity = String(FINAL_OPACITY);
      el.style.clipPath = "inset(0 0 0 0)";
      el.style.transform = "";
      el.style.filter = "";
      return;
    }

    // clipPath inset 无法直接形变，用 proxy 驱动 onUpdate 写入（reveal case 同模式）
    const proxy = { p: 0 };
    const tl = createTimeline({ defaults: { ease: EASE.expo } });

    // 扫描揭示：底部 inset 100% → 0（自下而上扫开）
    tl.add(
      proxy,
      {
        p: [0, 1],
        duration: 500,
        delay,
        onUpdate: () => {
          el.style.clipPath = `inset(0 0 ${(1 - proxy.p) * 100}% 0)`;
        },
      },
      0
    );

    // 亮峰再沉淀：0 → 0.14 → 0.035（中点亮峰，缓慢沉回幽灵态）
    tl.add(
      el,
      { opacity: [0, PEAK_OPACITY, FINAL_OPACITY], duration: 900, delay, ease: "linear" },
      0
    );

    // rack 进焦点：scale 1.6 → 1
    tl.add(el, { scale: [1.6, 1], duration: 800, delay, ease: EASE.expo }, 0);

    // 焦点拉准：blur 48px → 0
    tl.add(
      el,
      { filter: ["blur(48px)", "blur(0px)"], duration: 700, delay, ease: EASE.expo },
      0
    );

    return () => {
      tl.revert();
    };
  }, [delay]);

  return (
    <div
      aria-hidden
      className="pointer-events-none select-none absolute inset-0 -z-10 px-5 sm:px-6"
    >
      <div className="relative w-full max-w-5xl mx-auto h-full">
        <span
          ref={ref}
          className={`absolute top-0 right-0 font-semibold tabular-nums leading-none text-[clamp(10rem,30vw,22rem)] ${className}`}
          style={{
            color: "var(--text-primary)",
            transformOrigin: "100% 0%",
            ...style,
            opacity: 0,
            clipPath: "inset(0 0 100% 0)",
          }}
        >
          {index}
        </span>
      </div>
    </div>
  );
}
