"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  animate,
  stagger,
  createScope,
  EASE,
  prefersReducedMotion,
  type JSAnimation,
} from "@/lib/anime";

/**
 * 交错「材质化」入场容器（VOID PROTOCOL）：
 * 子项同时做 opacity / translateY / translateZ(-depth) / scale / blur /
 * clip-path 揭幕 —— 从纵深里被镜头推出，而不是简单 fade-up。
 *
 * FOUC 策略：根挂 anime-init-children，CSS 把直接子级置 opacity:0。
 * 因此子项应为根的「直接子级」，并在其上标注 data-stagger-item（或自定义 selector）。
 * 命中 prefers-reduced-motion 时跳过，CSS 兜底显示。
 *
 * clip-path：anime.js 对 inset() 的形状插值不可靠，改用代理对象在 onUpdate 里
 * 逐帧写入；每个子项一个代理，延迟按 from/grid 手工排序（与主 stagger 同参数，
 * 网格 center 用曼哈顿距离近似）。动画完成后撤掉 clipPath，避免永久裁掉卡片
 * 外发光/阴影。cleanup 顺序必须是「先 revert 再清 clipPath」：revert 会恢复
 * 动画开始时捕获的 inline clipPath（即收起的初态）。
 *
 * 用法：
 * <StaggerGroup>
 *   <div data-stagger-item><Card/></div>
 *   <div data-stagger-item><Card/></div>
 * </StaggerGroup>
 */
type StaggerGroupProps = {
  children: ReactNode;
  className?: string;
  /** 子项选择器（相对根），默认 [data-stagger-item] */
  selector?: string;
  /** 子项间错峰（ms） */
  staggerMs?: number;
  /** 错峰起点 */
  from?: "first" | "center" | "last" | "random";
  /** 网格交错 [rows, cols]；非网格留空 */
  grid?: [number, number];
  /** 整体起始延迟（ms） */
  startDelay?: number;
  /** 入场位移起始（px） */
  y?: number;
  /** 入场缩放起始 */
  scale?: number;
  /** 单项时长（ms） */
  duration?: number;
  /** 触发时机 */
  trigger?: "mount" | "viewport";
  /** viewport 触发阈值 0~1 */
  threshold?: number;
};

export function StaggerGroup({
  children,
  className = "",
  selector = "[data-stagger-item]",
  staggerMs = 80,
  from = "first",
  grid,
  startDelay = 0,
  y = 40,
  scale = 0.96,
  duration = 900,
  trigger = "mount",
  threshold = 0.2,
}: StaggerGroupProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = rootRef.current;
    if (!root) return;

    const scope = createScope({ root });
    const items = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const clipAnims: JSAnimation[] = [];

    /** 与 anime stagger 同参数的排序序号（0 = 最先），仅用于 clip 代理延迟 */
    const orderIndex = (i: number): number => {
      const n = items.length;
      if (grid && from === "center") {
        const [rows, cols] = grid;
        const r = Math.floor(i / cols);
        const c = i % cols;
        return (
          Math.abs(r - (rows - 1) / 2) + Math.abs(c - (cols - 1) / 2)
        );
      }
      if (from === "last") return n - 1 - i;
      if (from === "center") return Math.abs(i - (n - 1) / 2);
      return i; // first / random 按 first 处理（保持确定性）
    };

    const play = () => {
      if (!items.length) return;

      // 块体返回 void：scope.add 期望 ScopeConstructorCallback。
      scope.add(() => {
        // 主轴：纵深 + 位移 + 缩放 + 对焦
        animate(items, {
          opacity: [0, 1],
          translateY: [y, 0],
          translateZ: [-90, 0],
          scale: [scale, 1],
          filter: ["blur(10px)", "blur(0px)"],
          delay: stagger(staggerMs, { from, grid, start: startDelay }),
          duration,
          ease: EASE.expo,
          // anime 会留下 filter: blur(0px)：它仍会建立 backdrop root /
          // 固定定位包含块，可能破坏卡片内部 backdrop-filter 或 fixed 装饰。
          // 终态撤掉 inline filter，恢复干净渲染。
          onComplete: () => {
            items.forEach((item) => {
              item.style.filter = "";
            });
          },
        });

        // 揭幕：clip-path 自下而上扫开（代理驱动，形状插值不可靠）
        items.forEach((item, i) => {
          const proxy = { p: 0 };
          item.style.clipPath = "inset(0 0 100% 0)";
          clipAnims.push(
            animate(proxy, {
              p: 1,
              delay: startDelay + orderIndex(i) * staggerMs,
              duration,
              ease: EASE.expo,
              onUpdate: () => {
                item.style.clipPath = `inset(0 0 ${(1 - proxy.p) * 100}% 0)`;
              },
              onComplete: () => {
                item.style.clipPath = "";
              },
            })
          );
        });
      });
    };

    const cleanupClips = () => {
      clipAnims.forEach((a) => a.revert());
      items.forEach((item) => {
        item.style.clipPath = "";
      });
    };

    if (trigger === "mount") {
      const raf = requestAnimationFrame(play);
      return () => {
        cancelAnimationFrame(raf);
        scope.revert();
        cleanupClips();
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          play();
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      scope.revert();
      cleanupClips();
    };
  }, [trigger, threshold, selector, staggerMs, from, startDelay, y, scale, duration, grid]);

  return (
    <div
      ref={rootRef}
      className={`anime-init-children ${className}`}
      style={{ perspective: "1400px" }}
    >
      {children}
    </div>
  );
}
