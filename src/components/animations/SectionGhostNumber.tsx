"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import {
  animate,
  createTimeline,
  createAnimatable,
  springSoft,
  EASE,
  prefersReducedMotion,
  type JSAnimation,
} from "@/lib/anime";

/**
 * 巨型幽灵编号背景装置（VOID PROTOCOL）：
 * 超大「描边 + 扫描线填充」编号，像 HUD 里未点亮的全息刻度。
 *
 * 视觉分层（避免 transform 互相覆盖）：
 *   scaffold(absolute inset-0 -z-10)
 *     └ parallax 层（createAnimatable x/y，指针视差）
 *         └ 编号 span（入场 timeline：scale/filter/opacity + clip 扫描揭示）
 *
 * 入场「materialize & ghost」：扫描揭示（clipPath 自下而上扫开）+ 亮峰再沉淀
 * + rack 进焦点（scale 1.6→1）+ 焦段拉准（blur 48px→0）。每次 section 挂载重播。
 *
 * 扫描线填充：background-clip:text + repeating-linear-gradient，用代理对象
 * 低速循环改 backgroundPositionY（6px 一个周期，首尾无缝）。不直接用 anime
 * 动 gradient 属性，避开字符串插值的不确定性。
 *
 * 位置一致性：本组件自带 scaffold（与 section 同款 px-5 sm:px-6 + max-w-5xl），
 * 把编号锚定到 section 顶部与内容列右沿；需作为 section 直接子级渲染，且 section
 * 加 `isolate` 容纳 -z-10。
 *
 * - pointer-events-none / select-none：不挡交互、不可选中
 * - transformOrigin 100% 0%：锚定右上角，缩放向左下，避免外溢
 * - FOUC：初始 inline opacity:0 + clipPath 收起；reduced-motion 直接置终态
 */
type SectionGhostNumberProps = {
  index: string;
  className?: string;
  style?: CSSProperties;
  /** 入场起始延迟（ms），默认 0（与 section 内其他入场并行起始） */
  delay?: number;
};

const FINAL_OPACITY = 0.8;
const PEAK_OPACITY = 1;
/** 扫描线周期（px）：背景位移一整个周期即无缝循环 */
const SCAN_PERIOD = 6;

export function SectionGhostNumber({
  index,
  className = "",
  style,
  delay = 0,
}: SectionGhostNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // reduced-motion：直接置终态，跳过显影与视差
    if (prefersReducedMotion()) {
      el.style.opacity = String(FINAL_OPACITY);
      el.style.clipPath = "inset(0 0 0 0)";
      el.style.transform = "";
      el.style.filter = "";
      return;
    }

    // clipPath inset 无法直接形变，用 proxy 驱动 onUpdate 写入
    const proxy = { p: 0 };
    const tl = createTimeline({ defaults: { ease: EASE.expo } });

    // 扫描揭示：底部 inset 100% → 0（自下而上扫开）
    tl.add(
      proxy,
      {
        p: [0, 1],
        duration: 560,
        delay,
        onUpdate: () => {
          el.style.clipPath = `inset(0 0 ${(1 - proxy.p) * 100}% 0)`;
        },
        onComplete: () => {
          // 揭示完成即撤掉裁切，避免永久裁掉描边外发光
          el.style.clipPath = "";
        },
      },
      0
    );

    // 亮峰再沉淀：0 → 亮峰 → 幽灵态
    tl.add(
      el,
      {
        opacity: [0, PEAK_OPACITY, FINAL_OPACITY],
        duration: 950,
        delay,
        ease: "linear",
      },
      0
    );

    // rack 进焦点：scale 1.6 → 1
    tl.add(el, { scale: [1.6, 1], duration: 850, delay, ease: EASE.expo }, 0);

    // 焦段拉准：blur 48px → 0
    tl.add(
      el,
      { filter: ["blur(48px)", "blur(0px)"], duration: 720, delay, ease: EASE.expo },
      0
    );

    // 扫描线填充循环（独立动画，避免被 timeline 的总时长截断）
    const scan = { p: 0 };
    const scanAnim: JSAnimation = animate(scan, {
      p: 1,
      duration: 5200,
      delay: delay + 600,
      loop: true,
      ease: "linear",
      onUpdate: () => {
        el.style.backgroundPositionY = `${scan.p * SCAN_PERIOD}px`;
      },
    });

    // 指针视差：只在精细指针设备启用，包在独立 wrapper 上，
    // 与编号自身的 scale/filter 入场互不抢占 transform
    let parallaxAnim: ReturnType<typeof createAnimatable> | null = null;
    let onMove: ((e: MouseEvent) => void) | null = null;
    const px = parallaxRef.current;
    if (
      px &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      parallaxAnim = createAnimatable(px, {
        x: { ease: springSoft() },
        y: { ease: springSoft() },
      });
      onMove = (e: MouseEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        parallaxAnim?.x(nx * -18);
        parallaxAnim?.y(ny * -12);
      };
      window.addEventListener("mousemove", onMove, { passive: true });
    }

    return () => {
      tl.revert();
      scanAnim.revert();
      if (onMove) window.removeEventListener("mousemove", onMove);
      parallaxAnim?.revert();
    };
  }, [delay]);

  return (
    <div
      aria-hidden
      className="pointer-events-none select-none absolute inset-0 -z-10 px-5 sm:px-6"
    >
      <div className="relative w-full max-w-5xl mx-auto h-full">
        <div ref={parallaxRef} className="absolute top-0 right-0">
          <span
            ref={ref}
            className={`block font-semibold tabular-nums leading-none text-[clamp(10rem,30vw,22rem)] ${className}`}
            style={{
              ...style,
              color: "transparent",
              WebkitTextStrokeWidth: "2px",
              WebkitTextStrokeColor: "var(--border-strong)",
              backgroundImage:
                "repeating-linear-gradient(180deg, var(--accent-soft) 0px, var(--accent-soft) 1px, transparent 1px, transparent 6px)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              backgroundPositionY: "0px",
              transformOrigin: "100% 0%",
              opacity: 0,
              clipPath: "inset(0 0 100% 0)",
            }}
          >
            {index}
          </span>
        </div>
      </div>
    </div>
  );
}
