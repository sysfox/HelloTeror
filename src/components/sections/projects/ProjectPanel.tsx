"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import type { ProjectItem } from "@/types";
import { animate, prefersReducedMotion } from "@/lib/anime";
import {
  formatCompactNumber,
  languageAccent,
  projectTopics,
} from "./projectMeta";

/**
 * 机库视图中的单块工程面板。
 *
 * 视觉：玻璃底 + 四角括号 + 扫描线纹理 + 顶部能量线；聚焦时边框点亮、
 * 一条扫描带持续自上而下掠过（anime.js loop）。
 *
 * 注意：扫描带动画只读父面板的 clientHeight，不参与布局；reduced-motion
 * 下机库视图本身不会渲染（见 useCompactMode），这里仍保留守卫以防未来复用。
 */
type ProjectPanelProps = {
  project: ProjectItem;
  index: number;
  active: boolean;
  contributorLabel: string;
  onActivate: () => void;
  /** 指针换焦（机库加了冷却，键盘 focus 走 onActivate 不受影响） */
  onPointerEnter?: (event: MouseEvent<HTMLAnchorElement>) => void;
  anchorRef?: (el: HTMLAnchorElement | null) => void;
  /** 被机库隐藏（深度 > 2）的面板移出 Tab 序 */
  tabIndex?: number;
};

function Readout({
  label,
  value,
  color,
  divider,
}: {
  label: string;
  value: string;
  color?: string;
  divider?: boolean;
}) {
  return (
    <div
      className="min-w-0 px-2.5 first:pl-0 last:pr-0"
      style={{
        borderLeft: divider ? "1px solid var(--border-subtle)" : undefined,
      }}
    >
      <span
        className="block font-mono text-[9px] uppercase tracking-[0.22em]"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <span
        className="mt-0.5 block truncate font-mono text-[11px] tabular-nums"
        style={{ color: color ?? "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

function CornerBrackets({ active }: { active: boolean }) {
  const color = active ? "var(--accent)" : "var(--border-strong)";
  const base = "pointer-events-none absolute h-3 w-3";
  return (
    <>
      <span
        aria-hidden
        className={`${base} left-0 top-0 border-l border-t`}
        style={{ borderColor: color }}
      />
      <span
        aria-hidden
        className={`${base} right-0 top-0 border-r border-t`}
        style={{ borderColor: color }}
      />
      <span
        aria-hidden
        className={`${base} bottom-0 left-0 border-b border-l`}
        style={{ borderColor: color }}
      />
      <span
        aria-hidden
        className={`${base} bottom-0 right-0 border-b border-r`}
        style={{ borderColor: color }}
      />
    </>
  );
}

export function ProjectPanel({
  project,
  index,
  active,
  contributorLabel,
  onActivate,
  onPointerEnter,
  anchorRef,
  tabIndex,
}: ProjectPanelProps) {
  const scanRef = useRef<HTMLSpanElement>(null);
  const accent = languageAccent(project.language);
  const topics = projectTopics(project);

  // 聚焦扫描带：只让当前面板跑 loop，离开即停，避免 N 条动画同时耗帧
  useEffect(() => {
    const el = scanRef.current;
    if (!el) return;

    if (!active || prefersReducedMotion()) {
      el.style.opacity = "0";
      el.style.transform = "translateY(-8px)";
      return;
    }

    el.style.opacity = "1";
    const proxy = { p: -0.08 };
    const anim = animate(proxy, {
      p: 1.08,
      duration: 3200,
      loop: true,
      ease: "linear",
      onUpdate: () => {
        // 扫描带高度为 2px，百分比位移没有意义，按父面板实际高度换算像素
        const h = el.parentElement?.clientHeight ?? 320;
        el.style.transform = `translateY(${proxy.p * h}px)`;
      },
    });

    return () => {
      anim.revert();
      el.style.opacity = "0";
      el.style.transform = "translateY(-8px)";
    };
  }, [active]);

  return (
    <a
      ref={anchorRef}
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabIndex}
      onMouseEnter={onPointerEnter ?? onActivate}
      onFocus={onActivate}
      className="group relative flex h-full w-full flex-col overflow-hidden border px-4 py-3.5 outline-none theme-transition active:scale-[0.985] sm:px-5"
      style={{
        borderColor: active ? "var(--accent-border)" : "var(--border-subtle)",
        // 面板必须比场景更"实"：VOID 场景的发光核心正好落在机库后方，
        // 纯粹的 surface token 透明度太高，正文会被 shader 洗掉。
        // 用 --card 做 72–92% 不透明底，再叠一层玻璃高光，兼顾纵深与可读性。
        // 聚焦面板必须完全不透明：机库的侧卡会投影到同一屏幕区域，
        // 任何 alpha 都会让侧卡正文"透"进主卡。非聚焦卡保留透明以形成纵深。
        background: active
          ? "linear-gradient(155deg, var(--card) 0%, color-mix(in srgb, var(--card) 94%, var(--accent)) 52%, var(--card) 100%)"
          : "linear-gradient(155deg, color-mix(in srgb, var(--card) 88%, transparent), color-mix(in srgb, var(--card) 70%, transparent) 78%)",
        boxShadow: active
          ? "inset 0 0 42px var(--accent-soft), inset 0 1px 0 var(--accent-border)"
          : "inset 0 1px 0 var(--border-subtle)",
        backdropFilter: "blur(18px) saturate(1.08)",
        transitionProperty: "border-color, background, box-shadow",
        transitionDuration: "500ms",
      }}
    >
      {/* 扫描线纹理：低透明度，避免压过正文 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 3px, var(--grid-line) 3px 4px)",
        }}
      />

      {/* 聚焦时顶部能量线展开 */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-px"
        style={{
          width: active ? "100%" : "32%",
          background:
            "linear-gradient(90deg, var(--accent), var(--accent-border) 55%, transparent)",
          transition: "width 650ms cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: active ? 1 : 0.5,
        }}
      />

      {/* 聚焦扫描带：自上而下循环 */}
      <span
        ref={scanRef}
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--accent-glow) 30%, var(--accent) 50%, var(--accent-glow) 70%, transparent)",
          opacity: 0,
          transform: "translateY(-8px)",
        }}
      />

      <CornerBrackets active={active} />

      {/* 顶栏：编号 + 状态 */}
      <div className="relative flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
        <span style={{ color: "var(--accent)" }}>
          {`// P-${String(index + 1).padStart(2, "0")}`}
        </span>
        <span
          className="inline-flex items-center gap-1.5"
          style={{
            color: active ? "var(--accent-3)" : "var(--text-tertiary)",
            transition: "color 400ms",
          }}
        >
          <span
            aria-hidden
            className="inline-block h-1 w-1"
            style={{
              background: active ? "var(--accent-3)" : "var(--border-strong)",
            }}
          />
          {active ? "FOCUS" : "STANDBY"}
          <ArrowUpRight size={11} />
        </span>
      </div>

      {/* 仓库名 */}
      <div className="relative mt-3 min-w-0">
        <span
          className="block truncate font-mono text-[10px] uppercase tracking-[0.16em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {project.owner}/
        </span>
        <h3
          className="mt-0.5 truncate text-xl font-semibold tracking-tight sm:text-2xl"
          style={{
            color: "var(--text-primary)",
            textShadow: active ? "0 0 24px var(--accent-glow)" : "none",
            transition: "text-shadow 500ms",
          }}
        >
          {project.name}
        </h3>
      </div>

      {/* 描述：固定两行，保证不同仓库高度一致 */}
      <p
        className="relative mt-2 text-[11px] leading-relaxed sm:text-xs"
        style={{
          color: "var(--text-secondary)",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
        }}
      >
        {project.description}
      </p>

      {/* 派生话题条 + 贡献标记 */}
      <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
        {topics.map((topic, i) => (
          <span
            key={topic}
            className="inline-flex items-center gap-1 border px-1.5 py-[1px] font-mono text-[9px] tracking-[0.08em]"
            style={{
              borderColor: i === 0 ? accent : "var(--border-subtle)",
              color: i === 0 ? accent : "var(--text-tertiary)",
            }}
          >
            {i === 0 && (
              <span
                aria-hidden
                className="h-1 w-1 shrink-0"
                style={{ background: accent }}
              />
            )}
            {topic}
          </span>
        ))}
        {project.contribution && (
          <span
            className="ml-auto border px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.16em]"
            style={{
              borderColor: "var(--accent-2)",
              color: "var(--accent-2)",
            }}
          >
            {contributorLabel}
          </span>
        )}
      </div>

      {/* HUD 读数：推到底部 */}
      <div className="relative mt-auto pt-3">
        <div
          className="grid grid-cols-3 border-t pt-2"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <Readout label="STARS" value={formatCompactNumber(project.stars)} />
          <Readout
            label="FORKS"
            value={formatCompactNumber(project.forks)}
            divider
          />
          <Readout label="LANG" value={project.language} color={accent} divider />
        </div>
      </div>
    </a>
  );
}
