"use client";

import { ArrowUpRight } from "lucide-react";
import type { BlogPost } from "@/types";

/**
 * 归档隧道中的单条记录。
 *
 * 纵深：每一条按索引在 X 轴左缘为原点做 rotateY + 负 Z，越往下越向后退，
 * 形成走廊感；hover/focus 时回到镜头前（translateZ 正值）并展开摘要。
 *
 * 布局盒不参与 transform，故悬停不会推动相邻行；扫描线与左侧能量柱
 * 只在激活时点亮。reduced-motion 下关闭全部位移与过渡，仅保留颜色反馈。
 */
type BlogEntryProps = {
  post: BlogPost;
  index: number;
  accent: string;
  formattedDate: string;
  active: boolean;
  reducedMotion: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
};

export function BlogEntry({
  post,
  index,
  accent,
  formattedDate,
  active,
  reducedMotion,
  onActivate,
  onDeactivate,
}: BlogEntryProps) {
  const depth = Math.min(index, 6);
  const transform = reducedMotion
    ? undefined
    : active
      ? "perspective(900px) rotateY(0deg) translateZ(14px)"
      : `perspective(900px) rotateY(${(-depth * 0.9).toFixed(2)}deg) translateZ(${-depth * 5}px)`;

  const motionTransition = reducedMotion
    ? "none"
    : "transform 520ms cubic-bezier(0.16, 1, 0.3, 1), border-color 300ms ease, background 300ms ease, box-shadow 300ms ease";

  const showExcerpt = Boolean(post.excerpt);

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={onActivate}
      onMouseLeave={(e) => {
        // 焦点仍在本行时不要收起（键盘用户按 Tab 后移动鼠标不应丢失展开态）
        if (document.activeElement !== e.currentTarget) onDeactivate();
      }}
      onFocus={onActivate}
      onBlur={onDeactivate}
      className="group relative block border outline-none theme-transition"
      style={{
        transform,
        transformOrigin: "left center",
        transition: motionTransition,
        borderColor: active ? "var(--accent-border)" : "var(--border-subtle)",
        background: active ? "var(--surface-hover)" : "var(--surface)",
        boxShadow: active ? "0 0 28px var(--accent-glow)" : "none",
      }}
    >
      {/* 扫描线纹理 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 3px, var(--grid-line) 3px 4px)",
        }}
      />

      {/* 左侧能量柱：激活时长满整行 */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 top-0 w-px"
        style={{
          height: active ? "100%" : "30%",
          background: accent,
          opacity: active ? 1 : 0.35,
          transition: reducedMotion ? "none" : "height 420ms ease, opacity 300ms ease",
        }}
      />

      <div className="relative flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="min-w-0 flex-1">
          {/* 元数据条：编号 · 日期 · 分类 */}
          <div
            className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <span style={{ color: accent }}>
              {`A-${String(index + 1).padStart(2, "0")}`}
            </span>
            <span aria-hidden style={{ color: "var(--border-strong)" }}>
              {"//"}
            </span>
            {formattedDate && (
              <span className="tabular-nums">{formattedDate}</span>
            )}
            {post.category && (
              <span
                className="border px-1.5 py-px text-[9px] normal-case tracking-[0.08em]"
                style={{ borderColor: accent, color: accent }}
              >
                {post.category}
              </span>
            )}
          </div>

          <h3
            className="mt-1.5 text-sm font-medium leading-snug sm:text-[15px]"
            style={{
              color: "var(--text-primary)",
              textWrap: "pretty",
              // 长标题限两行：移动端保证 5 条记录仍能在视口内读完
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
            }}
          >
            {post.title}
          </h3>

          {/* 摘要：0fr → 1fr 展开，只在存在 excerpt 时参与 */}
          {showExcerpt && (
            <div
              className="grid"
              style={{
                gridTemplateRows: active ? "1fr" : "0fr",
                opacity: active ? 1 : 0,
                transition: reducedMotion
                  ? "none"
                  : "grid-template-rows 420ms cubic-bezier(0.16, 1, 0.3, 1), opacity 260ms ease",
              }}
            >
              <div className="overflow-hidden">
                <p
                  className="pt-2 text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {post.excerpt}
                </p>
              </div>
            </div>
          )}
        </div>

        <ArrowUpRight
          size={14}
          className="mt-0.5 shrink-0"
          style={{
            color: active ? accent : "var(--text-tertiary)",
            transform: active ? "translate(2px, -2px)" : "none",
            transition: reducedMotion
              ? "none"
              : "color 300ms ease, transform 300ms ease",
          }}
        />
      </div>

      {/* 底部扫描线：激活时自左向右点亮 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 block h-px overflow-hidden"
      >
        <span
          className="block h-full w-full origin-left"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent} 45%, ${accent} 55%, transparent)`,
            transform: active ? "scaleX(1)" : "scaleX(0)",
            transition: reducedMotion
              ? "none"
              : "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </span>
    </a>
  );
}
