"use client";

import { ArrowUpRight } from "lucide-react";
import type { BlogPost } from "@/types";
import { SectionHeading } from "@/components/animations/SectionHeading";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { useApiData } from "@/hooks/useApiData";
import { useLocale } from "@/contexts/LocaleContext";
import { BlogArchive } from "@/components/sections/blog/BlogArchive";
import { BlogSkeleton } from "@/components/sections/blog/BlogSkeleton";
import { useReducedMotion } from "@/components/sections/blog/useReducedMotion";

/**
 * Blog — 简洁归档列表。
 *
 * 数据层、fallback、空态与外链行为保持原样（useApiData + /api/blog）。
 * 日期仍以 ISO 串存储，客户端用 Intl + UTC 渲染（见 formatPostDate）。
 */
function EmptySignal({ text }: { text: string }) {
  return (
    <div
      className="border px-4 py-10 text-center text-sm"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface)",
        color: "var(--text-tertiary)",
      }}
    >
      {text}
    </div>
  );
}

export function BlogSection() {
  const { t, intlLocale } = useLocale();
  const { data, loading } = useApiData<BlogPost[]>("/api/blog");
  const posts = data ?? [];
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="blog"
      className="relative isolate w-full h-full flex items-center justify-center px-5 sm:px-6"
    >

      <div
        className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12"
        // 归档行的 rotateY 会在右缘轻微外溢，clip 掉横向滚动条
        style={{ overflowX: "clip" }}
      >
        <SectionHeading
          index="05"
          label={t.blog.label}
          title={t.blog.title}
        />
        <p
          className="fade-up-soft text-sm sm:text-base mb-6"
          style={{ animationDelay: "350ms", color: "var(--text-tertiary)" }}
        >
          {t.blog.subtitle}
        </p>

        {loading ? (
          <BlogSkeleton />
        ) : posts.length === 0 ? (
          <EmptySignal text={t.blog.empty} />
        ) : (
          <BlogArchive
            posts={posts}
            intlLocale={intlLocale}
            reducedMotion={reducedMotion}
          />
        )}

        {/* See more */}
        <div
          className="mt-6 flex justify-center fade-up-soft"
          style={{ animationDelay: "0.85s" }}
        >
          <MagneticButton strength={0.2} tilt={0.02}>
            <a
              href="https://blog.trfox.top"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border px-3.5 py-2 text-xs transition-colors duration-200 active:scale-[0.97]"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface)",
                color: "var(--text-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-border)";
                e.currentTarget.style.background = "var(--surface-hover)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "var(--surface)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
            >
              {t.blog.visit}
              <ArrowUpRight size={12} />
            </a>
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
