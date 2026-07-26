"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  createAnimatable,
  springSoft,
  EASE,
  prefersReducedMotion,
} from "@/lib/anime";
import { usePage } from "@/contexts/PageContext";

/**
 * 全站极光背景：多色光晕缓慢流动融合。
 *
 * 位置：由 page.tsx 渲染在 SiteNav / main / SiteFooter 之下（-z-10），
 * 是**跨页持久层** —— 不随 PageShell 的 enter/exit 重挂载，因此可以连续地
 * 参与页面切换（见下方"转场脉冲"）。这也顺带绕开了
 * .transition-exit-snapshot 的 `filter: none !important`：
 * 若光球仍在 exit 层子树内，退出瞬间 blur 会被剥掉，光球变成硬边彩色圆盘。
 *
 * 视觉策略：
 *  - 4 个大型 radial-gradient 光球（blue / purple / teal / orange），重 blur 融合成极光
 *  - 各光球独立漂浮周期（18~25s alternate loop），周期错开避免同步
 *  - 桌面端鼠标视差（spring 跟随，分层避免 transform 冲突）
 *  - 超淡网格底纹（opacity 0.06 呼吸），保留科技感但不抢戏
 *
 * 强度分级：首页满强度，内容页降到 PAGE_INTENSITY，避免抢正文对比度。
 *
 * 转场脉冲：切换期间整层 opacity 冲到 SURGE_INTENSITY 且轻微膨胀，
 * 切换结束缓慢回落到目标页强度 —— 让背景参与转场而不是干看着。
 * 强度与脉冲共用同一层的同两个属性（opacity / scale），
 * 由单个 effect 独占写入，避免两条动画抢同一属性。
 *
 * 分层：
 *   surge(强度 + 脉冲: opacity/scale) → wrapper(视差 x/y) → 光球(漂浮 translate/scale)
 *
 * 主题安全：纯 DOM + CSS gradient，无 Canvas fillStyle 硬编码。
 * 光球颜色走 CSS 变量 var(--aurora-N)，light 模式由 globals.css 提高透明度确保可见；
 * 因 background-image (gradient) 无法 transition，主题切换时用 MutationObserver
 * 监听 data-theme 变化，给光球加 .aurora-crossfade 触发 opacity 淡出淡入，缓解颜色突变。
 * reduced-motion 静态（强度仍按页面生效，只是不做动画）。
 */

/** 首页强度 */
const HOME_INTENSITY = 1;
/** 内容页强度（降低以保正文对比度） */
const PAGE_INTENSITY = 0.4;
/** 转场瞬间的冲高强度 */
const SURGE_INTENSITY = 1;
/** 转场瞬间的膨胀倍率 */
const SURGE_SCALE = 1.07;
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
    bg: "radial-gradient(circle, var(--aurora-1), transparent 70%)",
    blur: 140,
    float: { tx: [-60, 60], ty: [-40, 40], sc: [1, 1.2], dur: 18000 },
    parallax: 16,
  },
  {
    pos: { right: "-6%", top: "8%" },
    size: 600,
    bg: "radial-gradient(circle, var(--aurora-2), transparent 70%)",
    blur: 130,
    float: { tx: [50, -70], ty: [30, -50], sc: [1.1, 0.9], dur: 22000 },
    parallax: 24,
  },
  {
    pos: { left: "12%", bottom: "-10%" },
    size: 550,
    bg: "radial-gradient(circle, var(--aurora-3), transparent 70%)",
    blur: 120,
    float: { tx: [-40, 60], ty: [50, -30], sc: [0.95, 1.15], dur: 20000 },
    parallax: 20,
  },
  {
    pos: { right: "18%", bottom: "0%" },
    size: 450,
    bg: "radial-gradient(circle, var(--aurora-4), transparent 70%)",
    blur: 110,
    float: { tx: [60, -40], ty: [-30, 50], sc: [1.05, 0.95], dur: 25000 },
    parallax: 28,
  },
];

export function AuroraBackground({ className = "" }: { className?: string }) {
  const { current, transitioning } = usePage();
  const surgeRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const wrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);

  /**
   * 强度 + 转场脉冲：transitioning 置起时冲高并膨胀，落下时回落到当前页强度。
   * 依赖里带 current，是为了让转场结束后落到**新页**的强度。
   * 不用 JSX inline style 写 opacity：React 重渲染会覆盖 anime 写入的 inline 值。
   */
  useEffect(() => {
    const el = surgeRef.current;
    if (!el) return;

    const target = current === "home" ? HOME_INTENSITY : PAGE_INTENSITY;

    if (prefersReducedMotion()) {
      el.style.opacity = String(target);
      el.style.transform = "";
      return;
    }

    const anim = transitioning
      ? animate(el, {
          opacity: SURGE_INTENSITY,
          scale: SURGE_SCALE,
          duration: 300,
          ease: "outQuad",
        })
      : animate(el, {
          opacity: target,
          scale: 1,
          duration: 900,
          ease: EASE.expo,
        });

    return () => {
      anim.pause();
    };
  }, [transitioning, current]);

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

    // 主题切换：监听 data-theme 变化，给光球加 .aurora-crossfade 触发 opacity 淡出淡入，
    // 缓解 gradient 颜色突变（background-image 无法 transition）。
    const orbElements = orbRefs.current.filter(Boolean) as HTMLDivElement[];
    if (orbElements.length) {
      const onThemeChange = () => {
        orbElements.forEach((el) => {
          el.classList.remove("aurora-crossfade");
          // 强制 reflow 以便重新触发 animation
          void el.offsetWidth;
          el.classList.add("aurora-crossfade");
        });
      };
      const themeObserver = new MutationObserver(onThemeChange);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme", "class"],
      });
      cleanups.push(() => themeObserver.disconnect());
    }

    cleanups.push(() => parallaxAnims.forEach((a) => a.revert()));
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div
      ref={surgeRef}
      aria-hidden
      className={`absolute inset-0 -z-10 overflow-hidden ${className}`}
      style={{ willChange: "opacity, transform" }}
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
