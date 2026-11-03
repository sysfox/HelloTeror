"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Dossier 玻璃面板：About 页面所有信息块的统一外壳。
 *
 *  - 顶部 HUD 头（序号 / 强调短线 / 标签 / 右侧三条刻度）
 *  - 四角括号（accent 描边）标示"被扫描的档案"
 *  - 半透明渐变表面 + 内高光 + 扫描线叠加
 *  - depth：在内层 translateZ 抬升，配合父级的 perspective 形成层叠纵深
 *  - hover：边框点亮 + 外发光（内联样式切换，跟随主题 token）
 *
 * depth 加在面板根节点而不是 inner panel：根节点是 StaggerGroup 子项的下一层，
 * 自身不被入场动画写 transform，translateZ 才能稳定保留。
 */
type DossierPanelProps = {
  children: ReactNode;
  /** HUD 序号，如 "01" */
  index: string;
  /** 头部标签；纯装饰标记可留空 */
  label?: string;
  /** Z 轴抬升（px），默认 0 */
  depth?: number;
  /** 强调色（序号 / 角标 / 刻度），默认 --accent */
  accent?: string;
  className?: string;
  bodyClassName?: string;
};

function CornerBrackets({ color }: { color: string }) {
  const base: CSSProperties = {
    position: "absolute",
    width: 9,
    height: 9,
    borderStyle: "solid",
    borderColor: color,
    opacity: 0.8,
    pointerEvents: "none",
  };
  return (
    <>
      <span
        aria-hidden
        style={{ ...base, top: 0, left: 0, borderWidth: "1px 0 0 1px" }}
      />
      <span
        aria-hidden
        style={{ ...base, top: 0, right: 0, borderWidth: "1px 1px 0 0" }}
      />
      <span
        aria-hidden
        style={{ ...base, bottom: 0, left: 0, borderWidth: "0 0 1px 1px" }}
      />
      <span
        aria-hidden
        style={{ ...base, bottom: 0, right: 0, borderWidth: "0 1px 1px 0" }}
      />
    </>
  );
}

const BASE_SHADOW =
  "0 18px 60px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)";
const HOVER_SHADOW =
  "0 22px 70px rgba(0,0,0,0.36), 0 0 28px var(--accent-glow, rgba(90,242,255,0.35)), inset 0 1px 0 rgba(255,255,255,0.08)";

export function DossierPanel({
  children,
  index,
  label,
  depth = 0,
  accent = "var(--accent)",
  className = "",
  bodyClassName = "relative p-4 sm:p-5",
}: DossierPanelProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        transform: depth ? `translateZ(${depth}px)` : undefined,
      }}
    >
      <div
        className="relative flex h-full flex-col overflow-hidden border transition-[border-color,box-shadow] duration-300"
        style={{
          borderColor: "var(--border-subtle)",
          background:
            "linear-gradient(155deg, var(--surface-strong, var(--surface)), var(--surface) 46%, transparent 82%)",
          boxShadow: BASE_SHADOW,
          backdropFilter: "blur(10px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor =
            "var(--accent-border, rgba(90,242,255,0.42))";
          e.currentTarget.style.boxShadow = HOVER_SHADOW;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.boxShadow = BASE_SHADOW;
        }}
      >
        <CornerBrackets color={accent} />

        {/* HUD 头：序号 / 短线 / 标签 / 右侧刻度 */}
        <div
          className="relative flex h-9 items-center gap-2.5 border-b px-4 sm:px-5"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface)",
          }}
        >
          <span
            aria-hidden
            className="font-mono text-[10px] tabular-nums"
            style={{ color: accent }}
          >
            {index}
          </span>
          <span
            aria-hidden
            className="h-px w-4"
            style={{ background: accent, opacity: 0.7 }}
          />
          {label ? (
            <span
              className="truncate font-mono text-[9px] uppercase tracking-[0.28em]"
              style={{ color: "var(--text-tertiary)" }}
            >
              {label}
            </span>
          ) : null}
          <span aria-hidden className="ml-auto flex items-center gap-[3px]">
            <span
              className="h-2 w-px"
              style={{ background: accent, opacity: 0.5 }}
            />
            <span
              className="h-2 w-px"
              style={{ background: accent, opacity: 0.32 }}
            />
            <span
              className="h-2 w-px"
              style={{ background: accent, opacity: 0.18 }}
            />
          </span>
        </div>

        <div className={bodyClassName}>{children}</div>

        {/* 扫描线：装饰性叠加，不拦截指针 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px)",
          }}
        />
      </div>
    </div>
  );
}
