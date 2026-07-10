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
 * 开场动效时间线（替换 PageLoader）：
 *  黑屏（tiles 覆盖）→ accent 细线从中心展开 → "Teror Fox" 逐字浮现 →
 *  accent 光带横扫 → 内容淡出 → tiles 网格中心扩散翻面退出露出首页。约 1.8s。
 *
 * - sessionStorage 防同一会话刷新重复（在动画完成时写入，规避 React strict 双挂载误判）
 * - prefers-reduced-motion 直接跳过
 * - cleanup 调 timeline.revert()，避免 strict 双挂载残留 inline 样式
 */
export function KineticLoader() {
  const [visible, setVisible] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<HTMLDivElement>(null);

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
    if (!overlay || !line || !name || !band || !tiles) return;

    const chars = name.querySelectorAll<HTMLElement>("[data-char]");
    const cells = tiles.querySelectorAll<HTMLElement>("[data-tile]");

    const tl = createTimeline({ defaults: { ease: EASE.expo } });

    // 1. 中央细线展开（center origin）
    tl.add(
      line,
      { scaleX: [0, 1], duration: 500 },
      0
    );

    // 2. 名字逐字浮现（与线尾部重叠）
    tl.add(
      chars,
      {
        opacity: [0, 1],
        translateY: [40, 0],
        filter: ["blur(12px)", "blur(0px)"],
        delay: stagger(45, { from: "center" }),
        duration: 700,
      },
      "-=200"
    );

    // 3. accent 光带横扫
    tl.add(
      band,
      { translateX: ["-120%", "120%"], duration: 550 },
      "-=300"
    );

    // 4. 内容（线/光带/字符）淡出，留干净黑底
    tl.add(
      [line, band, ...Array.from(chars)],
      { opacity: [1, 0], duration: 280 },
      "-=80"
    );

    // 5. tiles 中心扩散翻面退出，露出首页
    tl.add(
      cells,
      {
        rotateX: [0, 90],
        opacity: [1, 0],
        delay: stagger(28, {
          from: "center",
          grid: [GRID_ROWS, GRID_COLS],
        }),
        duration: 520,
      },
      "-=40"
    );

    // 6. 收尾：标记已播放 + 卸载
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
    >
      {/* tiles 翻面层（覆盖屏幕，退出时翻走露出首页） */}
      <div
        ref={tilesRef}
        className="tiles-overlay absolute inset-0 grid-cols-8 grid-rows-6"
      >
        {Array.from({ length: TILE_COUNT }).map((_, i) => (
          <div key={i} data-tile className="tile-cell" />
        ))}
      </div>

      {/* 中央细线：anime-line 提供 scaleX:0 初始（FOUC 安全），inline 覆盖 origin 为 center */}
      <div
        ref={lineRef}
        className="anime-line absolute h-px w-[140px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, #2997ff 50%, transparent)",
          boxShadow: "0 0 10px rgba(41,151,255,0.7)",
          transformOrigin: "center center",
        }}
      />

      {/* 名字逐字 */}
      <div
        ref={nameRef}
        className="anime-init-children relative text-3xl sm:text-5xl font-semibold tracking-tight text-white"
        aria-label={NAME}
      >
        {Array.from(NAME).map((ch, i) => (
          <span
            key={i}
            data-char
            aria-hidden="true"
            className="inline-block whitespace-pre"
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </div>

      {/* accent 光带：inline 初始 translateX(-120%) 防 FOUC */}
      <div
        ref={bandRef}
        className="absolute left-0 top-1/2 h-40 w-1/3 -mt-20"
        style={{
          transform: "translateX(-120%)",
          background:
            "linear-gradient(90deg, transparent, rgba(41,151,255,0.35), rgba(175,82,222,0.25), transparent)",
          filter: "blur(8px)",
        }}
      />
    </div>
  );
}
