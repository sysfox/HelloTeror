"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  createAnimatable,
  springSoft,
  prefersReducedMotion,
} from "@/lib/anime";

/**
 * Hero 动效背景：取代静态网格+光晕。
 *  - 网格 opacity 呼吸（alternate loop）
 *  - 2~3 个 accent/紫光球漂浮 + 缩放（alternate loop，各自不同周期）
 *  - 桌面端光球轻微鼠标视差（spring 跟随）
 *
 * 视差与漂浮分层避免 transform 冲突：
 *   wrapper(定位 + 视差 x/y) → 内层光球(漂浮 translateX/translateY/scale)
 * 低强度不抢前景。reduced-motion 静态。
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
    pos: { left: "calc(50% - 300px)", top: "calc(30% - 300px)" },
    size: 600,
    bg: "radial-gradient(circle, rgba(41,151,255,0.20), transparent 70%)",
    blur: 120,
    float: { tx: [-40, 40], ty: [-30, 30], sc: [1, 1.15], dur: 12000 },
    parallax: 14,
  },
  {
    pos: { right: "20%", bottom: "18%" },
    size: 420,
    bg: "radial-gradient(circle, rgba(175,82,222,0.16), transparent 70%)",
    blur: 110,
    float: { tx: [30, -50], ty: [20, -40], sc: [1.1, 0.95], dur: 15000 },
    parallax: 22,
  },
  {
    pos: { left: "16%", top: "20%" },
    size: 360,
    bg: "radial-gradient(circle, rgba(41,151,255,0.12), transparent 70%)",
    blur: 100,
    float: { tx: [-20, 50], ty: [40, -20], sc: [0.95, 1.1], dur: 18000 },
    parallax: 30,
  },
];

export function AnimatedBackground({ className = "" }: { className?: string }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const wrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const cleanups: Array<() => void> = [];

    // 网格呼吸
    if (gridRef.current) {
      const a = animate(gridRef.current, {
        opacity: [0.1, 0.2],
        duration: 6000,
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
        className="absolute inset-0 opacity-[0.15]"
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
