"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  createAnimatable,
  springSoft,
  prefersReducedMotion,
} from "@/lib/anime";

/**
 * Hero 极光背景：多色光晕缓慢流动融合，取代旧 AnimatedBackground 网格光球 + HeroVisual Canvas。
 *
 * 视觉策略：
 *  - 4 个大型 radial-gradient 光球（blue / purple / teal / orange），重 blur 融合成极光
 *  - 各光球独立漂浮周期（18~25s alternate loop），周期错开避免同步
 *  - 桌面端鼠标视差（spring 跟随，分层避免 transform 冲突）
 *  - 超淡网格底纹（opacity 0.06 呼吸），保留科技感但不抢戏
 *
 * 分层（与 AnimatedBackground 一致）：
 *   wrapper(定位 + 视差 x/y) → 内层光球(漂浮 translateX/translateY/scale)
 *
 * 主题安全：纯 DOM + CSS gradient，无 Canvas fillStyle 硬编码。
 * rgba 透明色在 light 模式下自然减弱，无需 MutationObserver。
 * reduced-motion 静态。
 */
type OrbConfig = {
  pos: React.CSSProperties;
  size: number;
  bg: string;
  blur: number;
  float: { tx: [number, number]; ty: [number, number]; sc: [number, number]; dur: number };
  parallax: number;
};

const ORBS: OrbConfig[] = [
  {
    pos: { left: "-8%", top: "-12%" },
    size: 700,
    bg: "radial-gradient(circle, rgba(41,151,255,0.28), transparent 70%)",
    blur: 140,
    float: { tx: [-60, 60], ty: [-40, 40], sc: [1, 1.2], dur: 18000 },
    parallax: 16,
  },
  {
    pos: { right: "-6%", top: "8%" },
    size: 600,
    bg: "radial-gradient(circle, rgba(175,82,222,0.24), transparent 70%)",
    blur: 130,
    float: { tx: [50, -70], ty: [30, -50], sc: [1.1, 0.9], dur: 22000 },
    parallax: 24,
  },
  {
    pos: { left: "12%", bottom: "-10%" },
    size: 550,
    bg: "radial-gradient(circle, rgba(52,199,89,0.20), transparent 70%)",
    blur: 120,
    float: { tx: [-40, 60], ty: [50, -30], sc: [0.95, 1.15], dur: 20000 },
    parallax: 20,
  },
  {
    pos: { right: "18%", bottom: "0%" },
    size: 450,
    bg: "radial-gradient(circle, rgba(255,149,0,0.16), transparent 70%)",
    blur: 110,
    float: { tx: [60, -40], ty: [-30, 50], sc: [1.05, 0.95], dur: 25000 },
    parallax: 28,
  },
];

export function AuroraBackground({ className = "" }: { className?: string }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const wrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const cleanups: Array<() => void> = [];

    // 网格呼吸（极淡，慢节奏）
    if (gridRef.current) {
      const a = animate(gridRef.current, {
        opacity: [0.05, 0.1],
        duration: 9000,
        loop: true,
        alternate: true,
        ease: "inOutSine",
      });
      cleanups.push(() => a.pause());
    }

    // 光球漂浮（内层）
    const parallaxAnims: ReturnType<typeof createAnimatable>[] = [];
    ORBS.forEach((orb, i) => {
      const el = orbRefs.current[i];
      if (!el) return;
      const a = animate(el, {
        translateX: orb.float.tx,
        translateY: orb.float.ty,
        scale: orb.float.sc,
        duration: orb.float.dur,
        loop: true,
        alternate: true,
        ease: "inOutSine",
      });
      cleanups.push(() => a.pause());

      // 视差（wrapper 层）
      const wrap = wrapRefs.current[i];
      if (wrap) {
        const pa = createAnimatable(wrap, {
          x: { ease: springSoft() },
          y: { ease: springSoft() },
        });
        parallaxAnims.push(pa);
      }
    });

    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    if (finePointer && parallaxAnims.length) {
      const onMove = (e: MouseEvent) => {
        const dx = (e.clientX - window.innerWidth / 2) / window.innerWidth;
        const dy = (e.clientY - window.innerHeight / 2) / window.innerHeight;
        ORBS.forEach((orb, i) => {
          parallaxAnims[i]?.x(dx * orb.parallax * 6);
          parallaxAnims[i]?.y(dy * orb.parallax * 6);
        });
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      cleanups.push(() => window.removeEventListener("mousemove", onMove));
    }

    cleanups.push(() => parallaxAnims.forEach((a) => a.revert()));
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div
      aria-hidden
      className={`absolute inset-0 -z-10 overflow-hidden ${className}`}
    >
      <div
        ref={gridRef}
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 80%)",
        }}
      />
      {ORBS.map((orb, i) => (
        <div
          key={i}
          ref={(el) => {
            wrapRefs.current[i] = el;
          }}
          className="absolute"
          style={orb.pos}
        >
          <div
            ref={(el) => {
              orbRefs.current[i] = el;
            }}
            className="rounded-full"
            style={{
              width: orb.size,
              height: orb.size,
              background: orb.bg,
              filter: `blur(${orb.blur}px)`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
