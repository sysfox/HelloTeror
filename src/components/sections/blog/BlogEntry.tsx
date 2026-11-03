"use client";

import { ArrowUpRight } from "lucide-react";
import type { BlogPost } from "@/types";

/**
 * 归档中的单条记录（简化版）：日期 / 分类 / 标题 / 摘要。
 * 去掉 3D 走廊、扫描线与能量柱，仅保留 hover 时的边框与摘要展开。
 */
type BlogEntryProps = {
  post: BlogPost;
  formattedDate: string;
  active: boolean;
  reducedMotion: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
};

export function BlogEntry({
  post,
  formattedDate,
  active,
  reducedMotion,
  onActivate,
  onDeactivate,
}: BlogEntryProps) {
  const showExcerpt = Boolean(post.excerpt);
  const transition = reducedMotion
    ? "none"
    : "border-color 220ms ease, background 220ms ease, opacity 220ms ease";

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
      className="group relative block border outline-none"
      style={{
        transition,
        borderColor: active ? "var(--accent-border)" : "var(--border-subtle)",
        background: active ? "var(--surface-hover)" : "var(--surface)",
      }}
    >
      <div className="flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="min-w-0 flex-1">
          {/* 元数据条：日期 · 分类 */}
          <div
            className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {formattedDate && (
              <span className="tabular-nums">{formattedDate}</span>
            )}
            {post.category && (
              <span style={{ color: "var(--text-tertiary)" }}>
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
                  : "grid-template-rows 360ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease",
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
            color: active ? "var(--text-primary)" : "var(--text-tertiary)",
            transition: reducedMotion ? "none" : "color 220ms ease",
          }}
        />
      </div>
    </a>
  );
}
