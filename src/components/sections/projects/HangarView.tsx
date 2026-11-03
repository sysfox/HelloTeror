"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectItem } from "@/types";
import {
  animate,
  EASE,
  prefersReducedMotion,
  stagger,
} from "@/lib/anime";
import { ProjectPanel } from "./ProjectPanel";

/**
 * 「机库」视图：一排带纵深的工程面板，中间的聚焦面板正对镜头，
 * 两侧面板向后退（负 Z + rotateY + 模糊），指针悬停即换焦，
 * ←/→ 换焦并把 DOM 焦点移到对应链接，Enter 由原生链接接管。
 *
 * 三层 transform 互不冲突：
 *   slot（定位 + rotateY + scale，CSS transition 负责焦点运镜）
 *   → panel-shell（anime 负责入场 translateZ/模糊，结束后不再改动）
 *   → ProjectPanel（内容与 hover 反馈）
 * 入场必须落在第三层之外的壳上，否则会覆盖 slot 的定位变换。
 */

/**
 * 每级深度的水平位移（px）。0 级即聚焦位。
 *
 * 位移必须 ≥ 半张卡宽：旧值 175 会让侧卡与主卡在屏幕上重叠，
 * 而 3D 合成层（rotateY + filter + opacity）的绘制顺序不受 z-index 控制，
 * 侧卡正文会"透"到不透明的主卡上面。拉开到 345 后两卡之间留出空隙，
 * 纵深由 translateZ/rotateY/scale 表达，不靠重叠。
 */
const OFFSET_X = [0, 345, 590, 780] as const;
const OFFSET_Z = 165;
const OFFSET_ROT = 16;
/** 超过两级的面板完全隐去，仍保留在 DOM 中以便平滑运镜 */
const VISIBLE_DEPTH = 2;

type HangarViewProps = {
  projects: ProjectItem[];
  /** t.projects.label，用于 region 的可访问名称 */
  label: string;
  contributorLabel: string;
};

function slotLayout(offset: number) {
  const abs = Math.abs(offset);
  const depth = Math.min(abs, 3);
  const dir = offset === 0 ? 0 : Math.sign(offset);
  return {
    x: dir * OFFSET_X[depth],
    y: depth * 6,
    z: -depth * OFFSET_Z,
    rotateY: Math.max(-46, Math.min(46, -offset * OFFSET_ROT)),
    scale: 1 - depth * 0.04,
    opacity: abs > VISIBLE_DEPTH ? 0 : 1 - abs * 0.3,
    blur: abs * 1.1,
    hidden: abs > VISIBLE_DEPTH,
  };
}

export function HangarView({
  projects,
  label,
  contributorLabel,
}: HangarViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  // 数据长度变化时把焦点夹回合法范围（不 setState，避免 effect 里回填）
  const active = Math.min(activeIndex, Math.max(0, projects.length - 1));

  // 入场：从深空 Z 负值拉回 + 去焦模糊，逐块错峰
  useEffect(() => {
    const root = stageRef.current;
    if (!root || projects.length === 0) return;
    const shells = root.querySelectorAll<HTMLElement>("[data-panel-shell]");
    if (!shells.length) return;

    if (prefersReducedMotion()) {
      shells.forEach((el) => {
        el.style.opacity = "1";
      });
      return;
    }

    const anim = animate(shells, {
      opacity: [0, 1],
      translateZ: [-260, 0],
      rotateX: [14, 0],
      filter: ["blur(18px)", "blur(0px)"],
      delay: stagger(90, { from: "center", start: 420 }),
      duration: 1200,
      ease: EASE.expo,
      // 与 StaggerGroup 同样的收尾：anime 会留下 filter: blur(0px)，
      // 它仍会建立 backdrop root，使面板内部的 backdrop-filter 失效。
      onComplete: () => {
        shells.forEach((el) => {
          el.style.filter = "";
        });
      },
    });
    return () => {
      anim.revert();
    };
  }, [projects.length]);

  const focusPanel = useCallback((index: number) => {
    setActiveIndex(index);
    // 把真实焦点移到对应链接：键盘用户按 Enter 即打开仓库
    requestAnimationFrame(() => {
      linkRefs.current[index]?.focus({ preventScroll: true });
    });
  }, []);

  const step = useCallback(
    (delta: 1 | -1) => {
      const next = Math.max(0, Math.min(projects.length - 1, active + delta));
      if (next === active) return;
      focusPanel(next);
    },
    [active, projects.length, focusPanel]
  );

  // ←/→ 挂在 window：useFullPageScroll 只占用 ↑/↓，左右键在本页专供机库。
  // 用 window 而不是容器 onKeyDown，用户无需先 Tab 进区域即可换焦。
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  // 指针换焦的防抖：面板移动后光标可能已落在相邻卡片上，
  // 若不设冷却会在一次划过中连锁跳到最末一张。
  // 用事件自带的 timeStamp 而不是 performance.now()：后者在渲染期调用会违反
  // React 的 purity 规则（函数虽由事件触发，但 eslint 静态检查仍判为渲染期代码）。
  const lastPointerFocusAt = useRef(0);
  const activateByPointer = (index: number, timeStamp: number) => {
    if (index === active || Math.abs(index - active) > VISIBLE_DEPTH) return;
    if (timeStamp - lastPointerFocusAt.current < 450) return;
    lastPointerFocusAt.current = timeStamp;
    setActiveIndex(index);
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div
        ref={stageRef}
        className="relative isolate overflow-hidden"
        style={{
          height: "clamp(250px, 34vh, 350px)",
          perspective: "1400px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        {projects.map((project, i) => {
          const offset = i - active;
          const layout = slotLayout(offset);
          return (
            <div
              key={project.id}
              className="absolute left-1/2 top-1/2"
              style={{
                width: "clamp(240px, 30vw, 330px)",
                height: "100%",
                zIndex: 10 - Math.min(Math.abs(offset), 9),
                transform: `translate(-50%, -50%) translate3d(${layout.x}px, ${layout.y}px, ${layout.z}px) rotateY(${layout.rotateY}deg) scale(${layout.scale})`,
                transformStyle: "preserve-3d",
                opacity: layout.opacity,
                filter: layout.blur > 0 ? `blur(${layout.blur}px)` : "none",
                pointerEvents: layout.hidden ? "none" : "auto",
                transition:
                  "transform 750ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms ease, filter 500ms ease",
                willChange: "transform, opacity",
              }}
              aria-hidden={layout.hidden || undefined}
            >
              <div
                data-panel-shell
                className="h-full w-full"
                style={{ opacity: 0 }}
              >
                <ProjectPanel
                  project={project}
                  index={i}
                  active={i === active}
                  contributorLabel={contributorLabel}
                  tabIndex={layout.hidden ? -1 : 0}
                  onActivate={() => setActiveIndex(i)}
                  onPointerEnter={(e) => activateByPointer(i, e.timeStamp)}
                  anchorRef={(el) => {
                    linkRefs.current[i] = el;
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 焦点刻度尺 */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {projects.map((project, i) => {
          const isActive = i === active;
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => focusPanel(i)}
              aria-label={`${project.name} (${i + 1}/${projects.length})`}
              className="h-1.5 transition-all"
              style={{
                width: isActive ? "22px" : "8px",
                background: isActive ? "var(--accent)" : "var(--border-strong)",
                boxShadow: isActive ? "0 0 10px var(--accent-glow)" : "none",
                transitionDuration: "400ms",
              }}
            />
          );
        })}
        <span
          className="ml-2 font-mono text-[9px] uppercase tracking-[0.22em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {"← / →"}
        </span>
      </div>
    </div>
  );
}
