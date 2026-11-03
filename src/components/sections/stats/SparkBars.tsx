"use client";

import { useEffect, useMemo, useRef } from "react";
import { animate, stagger, EASE, prefersReducedMotion } from "@/lib/anime";
import styles from "./stats.module.css";

/**
 * 迷你频谱条（装饰性 sparkline）。
 *
 * 高度来自 id 的**确定性哈希**而非 Math.random：同一指标每次挂载/重渲染
 * 得到完全相同的形状，否则 useApiData 命中缓存重挂载时条形会突然变脸。
 *
 * 入场只在 start 为真时播放（与数字 count-up 同步）；CSS 里 bar 初始
 * scaleY(0.12)，reduced-motion 媒体查询直接恢复 1，因此无 JS 也不会空白。
 */
const BAR_COUNT = 16;

function barHeights(seed: string, count: number): number[] {
  // FNV-1a 播种 + xorshift32 展开：稳定、无随机源
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    out.push(18 + (Math.abs(h) % 82));
  }
  return out;
}

export function SparkBars({
  seed,
  hud,
  start,
}: {
  seed: string;
  hud: string;
  start: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const heights = useMemo(() => barHeights(seed, BAR_COUNT), [seed]);

  useEffect(() => {
    if (!start) return;
    const row = rowRef.current;
    if (!row) return;
    const bars = row.querySelectorAll<HTMLElement>("[data-spark-bar]");
    if (!bars.length) return;

    if (prefersReducedMotion()) {
      bars.forEach((bar) => {
        bar.style.transform = "none";
      });
      return;
    }

    const anim = animate(bars, {
      scaleY: [0.12, 1],
      opacity: [0.35, 1],
      duration: 760,
      delay: stagger(24, { start: 240 }),
      ease: EASE.expo,
    });

    return () => {
      anim.revert();
    };
  }, [start, seed]);

  return (
    <>
      <div ref={rowRef} className={styles.sparkRow} aria-hidden>
        {heights.map((h, i) => (
          <span
            key={i}
            data-spark-bar
            className={styles.bar}
            style={{
              height: `${h}%`,
              background: `color-mix(in oklab, ${hud} ${
                i % 4 === 0 ? 78 : 30 + (i % 5) * 9
              }%, transparent)`,
            }}
          />
        ))}
      </div>
      <div aria-hidden className={styles.sparkAxis}>
        <span>00</span>
        <span>{String(BAR_COUNT).padStart(2, "0")}</span>
      </div>
    </>
  );
}
