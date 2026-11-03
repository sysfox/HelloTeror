"use client";

import { useEffect, useRef, useState } from "react";
import {
  stagger,
  createTimeline,
  EASE,
  prefersReducedMotion,
} from "@/lib/anime";

const NAME = "Teror Fox";
const GRID_COLS = 8;
const GRID_ROWS = 6;
const TILE_COUNT = GRID_COLS * GRID_ROWS;
const STORAGE_KEY = "teror-fox-loader-played";

/**
 * 开场「启动序列」（VOID PROTOCOL）：
 *  tiles 黑场覆盖 → 中央能量线展开 → "Teror Fox" 逐字从纵深浮现 →
 *  启动状态行点亮 → accent/plasma 光带横扫 → 内容与 HUD 网格淡出 →
 *  tiles 网格中心扩散翻面退出露出首页。约 1.94s。
 *
 * - sessionStorage 防同一会话刷新重复（**在动画完成时写入**，保持 Hero 读取
 *   `teror-fox-loader-played` 的时序语义：首访 Hero 用 1900ms 起始延迟，
 *   与本时间线收尾对齐；提前/延后写入都会改变首屏编排）
 * - prefers-reduced-motion 直接跳过
 * - cleanup 调 timeline.revert()，避免 strict 双挂载残留 inline 样式
 *
 * 层级：tiles 层沿用 globals 的 .tiles-overlay（z-70）；中央内容与 HUD 必须
 * 显式抬到 z-70 之上，否则会被不透明 tile 盖住（旧实现依赖的正是 DOM 顺序，
 * 这里显式写死更稳）。
 */
export function KineticLoader() {
  const [visible, setVisible] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const bootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 刷新不重复：用 rAF 延迟 setState，避免 effect 内同步触发级联渲染
    if (sessionStorage.getItem(STORAGE_KEY)) {
      const raf = requestAnimationFrame(() => setVisible(false));
      return () => cancelAnimationFrame(raf);
    }

    if (prefersReducedMotion()) {
      const raf = requestAnimationFrame(() => setVisible(false));
      return () => cancelAnimationFrame(raf);
    }

    const overlay = overlayRef.current;
    const line = lineRef.current;
    const name = nameRef.current;
    const band = bandRef.current;
    const tiles = tilesRef.current;
    const hud = hudRef.current;
    const boot = bootRef.current;
    if (!overlay || !line || !name || !band || !tiles || !hud || !boot) return;

    const chars = name.querySelectorAll<HTMLElement>("[data-char]");
    const cells = tiles.querySelectorAll<HTMLElement>("[data-tile]");

    const tl = createTimeline({ defaults: { ease: EASE.expo } });

    // 1. 中央能量线展开（center origin），青→洋红
    tl.add(line, { scaleX: [0, 1], duration: 500 }, 0);

    // 2. 名字逐字从纵深浮现（与线尾部重叠）
    tl.add(
      chars,
      {
        opacity: [0, 1],
        translateY: [34, 0],
        translateZ: [-120, 0],
        filter: ["blur(12px)", "blur(0px)"],
        delay: stagger(40, { from: "center" }),
        duration: 720,
      },
      240
    );

    // 3. 启动状态行点亮（HUD 元数据）
    tl.add(boot, { opacity: [0, 0.9], duration: 420 }, 480);

    // 4. accent / plasma 光带横扫
    tl.add(
      band,
      { translateX: ["-140%", "140%"], opacity: [0, 0.9, 0], duration: 600 },
      700
    );

    // 5. 内容 / HUD / 网格 / 角标淡出，留干净黑底给 tiles 翻走。
    //    光带已在自己的关键帧里收尾到 opacity:0，若再叠一段 [1,0] 会在
    //    1200ms 处被强行闪回 1；因此只淡出线/状态行/HUD/字符。
    tl.add(
      [line, boot, hud, ...Array.from(chars)],
      { opacity: [1, 0], duration: 260 },
      1320
    );

    // 6. tiles 中心扩散翻面退出，露出首页
    tl.add(
      cells,
      {
        rotateX: [0, 90],
        opacity: [1, 0],
        delay: stagger(26, {
          from: "center",
          grid: [GRID_ROWS, GRID_COLS],
        }),
        duration: 500,
      },
      1450
    );

    // 7. 收尾：标记已播放 + 卸载（写入时机 = 序列结束，Hero 依赖这一点）
    tl.call(() => {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setVisible(false);
    });

    return () => {
      tl.revert();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="fixed inset-0 z-[10000] flex items-center justify-center [perspective:1200px]"
      style={{ background: "transparent" }}
    >
      {/* tiles 翻面层：覆盖屏幕的 8×6 网格，退出时翻走露出首页。
          布局与肤色全部 inline：即使 globals.css 的 .tiles-overlay/.tile-cell
          在新设计系统里被改写，启动序列也不会塌成一条竖列。 */}
      <div
        ref={tilesRef}
        className="tiles-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 70,
          display: "grid",
          gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
          gridTemplateRows: "repeat(6, minmax(0, 1fr))",
          perspective: "1200px",
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: TILE_COUNT }).map((_, i) => (
          <div
            key={i}
            data-tile
            className="tile-cell"
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              willChange: "transform, opacity",
              background: "var(--background, #03040a)",
              boxShadow: "inset 0 0 0 1px var(--grid-line)",
            }}
          />
        ))}
      </div>

      {/* HUD：网格 + 四角框 + 上下元数据（z 必须在 tiles 之上） */}
      <div ref={hudRef} className="pointer-events-none absolute inset-0 z-[75]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.22,
            maskImage:
              "radial-gradient(circle at center, black 10%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(circle at center, black 10%, transparent 72%)",
          }}
        />
        {[
          "left-6 top-6 border-l border-t",
          "right-6 top-6 border-r border-t",
          "left-6 bottom-6 border-l border-b",
          "right-6 bottom-6 border-r border-b",
        ].map((pos) => (
          <span
            key={pos}
            className={`absolute w-8 h-8 ${pos}`}
            style={{ borderColor: "var(--accent-border)" }}
          />
        ))}
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase"
          style={{
            color: "var(--text-tertiary)",
            letterSpacing: "0.4em",
            writingMode: "vertical-rl",
          }}
        >
          VOID PROTOCOL
        </div>
        <div
          className="absolute right-6 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase"
          style={{
            color: "var(--text-tertiary)",
            letterSpacing: "0.4em",
            writingMode: "vertical-rl",
          }}
        >
          SYS.0x7F
        </div>
      </div>

      {/* 中央细线：anime-line 提供 scaleX:0 初始（FOUC 安全），inline 覆盖 origin 为 center */}
      <div
        ref={lineRef}
        className="anime-line absolute z-[80] h-px w-[180px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--accent, #5af2ff) 35%, var(--accent-2, #ff3ec9) 65%, transparent)",
          boxShadow: "0 0 14px var(--accent-glow)",
          transformOrigin: "center center",
        }}
      />

      {/* 名字逐字 + 启动状态行 */}
      <div className="relative z-[80] flex flex-col items-center gap-4">
        <div
          ref={nameRef}
          className="anime-init-children text-3xl sm:text-5xl font-semibold tracking-[-0.02em]"
          style={{
            color: "var(--text-primary, #e6f7ff)",
            textShadow: "0 0 40px var(--accent-glow)",
            perspective: "1000px",
          }}
          aria-label={NAME}
        >
          {Array.from(NAME).map((ch, i) => (
            <span
              key={i}
              data-char
              aria-hidden="true"
              className="inline-block whitespace-pre"
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </div>
        <div
          ref={bootRef}
          className="font-mono text-[9px] uppercase tabular-nums"
          style={{
            color: "var(--accent, #5af2ff)",
            letterSpacing: "0.42em",
            opacity: 0,
            textShadow: "0 0 12px var(--accent-glow)",
          }}
        >
          SYS.BOOT // LINK ESTABLISHED
        </div>
      </div>

      {/* accent / plasma 光带：inline 初始 translateX(-140%) 防 FOUC */}
      <div
        ref={bandRef}
        className="absolute left-0 top-1/2 z-[78] h-40 w-1/3 -mt-20"
        style={{
          transform: "translateX(-140%)",
          opacity: 0,
          background:
            "linear-gradient(90deg, transparent, rgba(90,242,255,0.4), rgba(255,62,201,0.3), transparent)",
          filter: "blur(10px)",
        }}
      />
    </div>
  );
}
