"use client";

import { ArrowUpRight, PenLine } from "lucide-react";
import type { BlogPost } from "@/types";
import { AnimeAccentLine } from "@/components/animations/AnimeAccentLine";
import { StaggerGroup } from "@/components/animations/StaggerGroup";

const POSTS: BlogPost[] = [
  {
    id: "1",
    title: "Oh-My-Posh 调教全记录：从报错到完美配置",
    date: "Jun 23, 2026",
    category: "开发",
    url: "https://blog.trfox.top/posts/develope/struggle-installing-oh-my-posh",
  },
  {
    id: "2",
    title: "我是如何水到 Qexo 的一个高危漏洞的（9.3分）？",
    date: "May 02, 2026",
    category: "网络安全",
    url: "https://blog.trfox.top/posts/cybersecurity/how-i-found-qexo-high-risk-vulnerability",
  },
  {
    id: "3",
    title: "迷茫中的希望",
    date: "Mar 28, 2026",
    category: "笔记",
    url: "https://blog.trfox.top/notes/14",
  },
  {
    id: "4",
    title: "Tinder 开发笔记——随想象一路前进",
    date: "Feb 22, 2026",
    category: "开发笔记",
    url: "https://blog.trfox.top/posts/develope/tinder-development-notes-exploration",
  },
  {
    id: "5",
    title: "测试工程师的笑话中包含哪些你必须知道的内容？",
    date: "Feb 17, 2026",
    category: "开发笔记",
    url: "https://blog.trfox.top/posts/develope/essential-content-in-test-engineer-jokes",
  },
];

export function BlogSection() {
  return (
    <section
      id="blog"
      className="relative w-full h-full flex items-center justify-center px-5 sm:px-6"
    >
      <div className="w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
        {/* Heading：强调线绘制 */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>
            {"// 05"}
          </span>
          <AnimeAccentLine />
          <span
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Writing
          </span>
        </div>

        {/* 标题块交错入场 */}
        <StaggerGroup
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-end mb-6"
          startDelay={200}
          staggerMs={120}
        >
          <div data-stagger-item>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Recent writing.
            </h2>
            <p
              className="mt-1 text-xs sm:text-sm font-mono"
              style={{ color: "var(--text-tertiary)" }}
            >
              近期笔墨 — A Student &amp;&amp; &lt;Developer /&gt;
            </p>
          </div>
          <p
            data-stagger-item
            className="text-sm sm:text-base"
            style={{ color: "var(--text-secondary)" }}
          >
            Notes from the field — development logs, security write-ups, and
            occasional reflections.
          </p>
        </StaggerGroup>

        {/* 文章列表：逐项错峰入场（列表行无需 TiltCard，保持轻量）
            注意：data-stagger-item 必须是 StaggerGroup 的「直接子级」，
            否则 .anime-init-children > * 的 CSS 初始隐态只命中中间层容器，
            而非各列表项，导致列表永久不可见。故用 div 替代 ol/li 结构。 */}
        <StaggerGroup
          className="flex flex-col"
          startDelay={420}
          staggerMs={75}
          from="first"
        >
          {POSTS.map((post, i) => (
            <div key={post.id} data-stagger-item>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5 py-3 border-b theme-transition"
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

                {/* Date + arrow */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span
                    className="hidden sm:inline text-[10px] sm:text-xs font-mono"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {post.date}
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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
                </div>
              </a>
            </div>
          ))}
        </StaggerGroup>

        {/* See more */}
        <div className="mt-6 text-center">
          <a
            href="https://blog.trfox.top"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border theme-transition fade-up-soft"
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
