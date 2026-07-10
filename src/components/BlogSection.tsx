"use client";

import { ArrowUpRight, PenLine } from "lucide-react";
import type { BlogPost } from "@/types";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { SectionHeading } from "@/components/animations/SectionHeading";
import { SectionGhostNumber } from "@/components/animations/SectionGhostNumber";
import { useApiData } from "@/hooks/useApiData";

function BlogListSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5 py-3 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <span
            className="font-mono text-[11px] sm:text-xs w-6"
            style={{ color: "var(--text-tertiary)" }}
          >
            ··
          </span>
          <div className="flex flex-col gap-1.5">
            <span
              className="h-3.5 rounded animate-pulse"
              style={{
                background: "var(--surface-strong)",
                width: `${55 + ((i * 13) % 35)}%`,
              }}
            />
            <span
              className="h-2.5 w-16 rounded animate-pulse"
              style={{ background: "var(--surface-strong)" }}
            />
          </div>
          <span
            className="hidden sm:block h-3 w-12 rounded animate-pulse"
            style={{ background: "var(--surface-strong)" }}
          />
        </div>
      ))}
    </div>
  );
}

export function BlogSection() {
  const { data, loading } = useApiData<BlogPost[]>("/api/blog");
  const posts = data ?? [];

  return (
    <section
      id="blog"
      className="relative isolate w-full h-full flex items-center justify-center px-5 sm:px-6"
    >
      {/* 巨型幽灵编号装置（scaffold 锚定 section 顶部 + 内容列右沿，跨页同位） */}
      <SectionGhostNumber index="05" />

      <div className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
        {/* Section heading：元数据条 + 巨型 AnimeText 标题 */}
        <SectionHeading index="05" label="Writing" title="Recent writing." />
        <p
          className="fade-up-soft text-sm sm:text-base mb-6"
          style={{ animationDelay: "350ms", color: "var(--text-tertiary)" }}
        >
          Notes from the field — development logs, security write-ups, and
          occasional reflections.
        </p>

        {/* 文章列表：逐项错峰入场（列表行无需 TiltCard，保持轻量）
            注意：data-stagger-item 必须是 StaggerGroup 的「直接子级」，
            否则 .anime-init-children > * 的 CSS 初始隐态只命中中间层容器，
            而非各列表项，导致列表永久不可见。故用 div 替代 ol/li 结构。 */}
        {loading ? (
          <BlogListSkeleton />
        ) : (
          <StaggerGroup
            className="flex flex-col"
            startDelay={480}
            staggerMs={75}
            from="first"
          >
            {posts.map((post, i) => (
              <div key={post.id} data-stagger-item>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5 py-3 min-h-11 border-b theme-transition active:scale-[0.96]"
                  style={{ borderColor: "var(--border-subtle)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--accent-border)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--border-subtle)";
                  }}
                >
                  {/* Index */}
                  <span
                    className="font-mono text-[11px] sm:text-xs tabular-nums w-6"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Title + category */}
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <span
                      className="text-sm sm:text-base truncate theme-transition"
                      style={{ color: "var(--text-primary)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--text-primary)";
                      }}
                    >
                      {post.title}
                    </span>
                    {/* 绘制下划线：行 hover 时 scaleX 0→1 */}
                    <span
                      aria-hidden
                      className="h-px origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                      style={{ background: "var(--accent)" }}
                    />
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <PenLine size={10} />
                        {post.category}
                      </span>
                    </span>
                  </div>

                  {/* Date + magnetic arrow */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span
                      className="hidden sm:inline text-[10px] sm:text-xs font-mono"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {post.date}
                    </span>
                    <MagneticButton strength={0.5} tilt={0} enableTilt={false}>
                      <ArrowUpRight
                        size={14}
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as unknown as HTMLElement).style.color =
                            "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as unknown as HTMLElement).style.color =
                            "var(--text-tertiary)";
                        }}
                      />
                    </MagneticButton>
                  </div>
                </a>
              </div>
            ))}
          </StaggerGroup>
        )}

        {/* See more */}
        <div className="mt-6 text-center">
          <a
            href="https://blog.trfox.top"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border theme-transition fade-up-soft active:scale-[0.96]"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface)",
              color: "var(--text-primary)",
              animationDelay: "0.85s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--surface-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface)";
            }}
          >
            Visit blog.trfox.top
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
