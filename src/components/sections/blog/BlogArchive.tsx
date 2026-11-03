"use client";

import { useState } from "react";
import type { BlogPost } from "@/types";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { BlogEntry } from "./BlogEntry";
import { formatPostDate } from "./formatPostDate";

/**
 * 「归档隧道」：左侧一条时间轴脊线，每条记录挂在轴上并按索引向后退，
 * hover/focus 时该条回到镜头前、轴上的节点点亮、底部扫描线亮起。
 *
 * 颜色按索引在三色系统（青 / 洋红 / 琥珀）里轮转，保证同一条记录
 * 的节点、编号、分类 chip 与扫描线始终同色。
 */
const ACCENTS = ["var(--accent)", "var(--accent-2)", "var(--accent-3)"] as const;

type BlogArchiveProps = {
  posts: BlogPost[];
  intlLocale: string;
  reducedMotion: boolean;
};

export function BlogArchive({
  posts,
  intlLocale,
  reducedMotion,
}: BlogArchiveProps) {
  // 同一时刻只展开一条；用 id 而非索引，数据刷新后不会串行
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="relative" role="list">
      {/* 时间轴脊线 */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2 left-[12px] top-2 w-px sm:left-[16px]"
        style={{
          background:
            "linear-gradient(180deg, var(--accent-border), var(--border-subtle) 28%, var(--border-subtle) 70%, transparent)",
        }}
      />

      <StaggerGroup
        className="flex flex-col gap-2.5"
        startDelay={480}
        staggerMs={70}
        from="first"
      >
        {posts.map((post, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          const active = activeId === post.id;
          return (
            <div
              key={post.id}
              data-stagger-item
              role="listitem"
              className="relative pl-8 sm:pl-10"
            >
              {/* 轴上节点：实心遮住脊线，激活时来电 */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-[8px] top-[18px] h-[9px] w-[9px] rotate-45 border sm:left-[12px]"
                style={{
                  borderColor: active ? accent : "var(--border-strong)",
                  background: active ? accent : "var(--background)",
                  boxShadow: active ? `0 0 12px ${accent}` : "none",
                  transition: reducedMotion
                    ? "none"
                    : "background 260ms ease, border-color 260ms ease, box-shadow 260ms ease",
                }}
              />
              <BlogEntry
                post={post}
                index={i}
                accent={accent}
                formattedDate={formatPostDate(post.date, intlLocale)}
                active={active}
                reducedMotion={reducedMotion}
                onActivate={() => setActiveId(post.id)}
                onDeactivate={() =>
                  // 只清除自己：A 的 mouseleave 可能晚于 B 的 mouseenter
                  setActiveId((current) => (current === post.id ? null : current))
                }
              />
            </div>
          );
        })}
      </StaggerGroup>
    </div>
  );
}
