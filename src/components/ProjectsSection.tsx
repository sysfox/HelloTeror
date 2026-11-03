"use client";

import { ArrowUpRight } from "lucide-react";
import type { ProjectItem } from "@/types";
import { SectionHeading } from "@/components/animations/SectionHeading";
import { SectionGhostNumber } from "@/components/animations/SectionGhostNumber";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { useApiData } from "@/hooks/useApiData";
import { useT } from "@/contexts/LocaleContext";
import { HangarView } from "@/components/sections/projects/HangarView";
import { ProjectList } from "@/components/sections/projects/ProjectList";
import { ProjectsSkeleton } from "@/components/sections/projects/ProjectsSkeleton";
import { useCompactMode } from "@/components/sections/projects/useCompactMode";

/**
 * Projects — 「机库」视图。
 *
 * 宽屏 + 允许动效：一排带纵深的 3D 面板，指针悬停 / ←→ 换焦；
 * 窄屏或 reduced-motion：切成紧凑列表（useCompactMode）。
 * 数据层、fallback、加载态与外链行为保持原样（useApiData + /api/github/projects）。
 */
function EmptySignal() {
  return (
    <div
      className="border px-4 py-10 text-center font-mono text-[11px] uppercase tracking-[0.24em]"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface)",
        color: "var(--text-tertiary)",
      }}
    >
      <span style={{ color: "var(--accent-2)" }}>{"// NO SIGNAL"}</span>
      <span className="mx-2" style={{ color: "var(--border-strong)" }}>
        ·
      </span>
      SECTOR EMPTY
    </div>
  );
}

export function ProjectsSection() {
  const t = useT();
  const { data, loading } = useApiData<ProjectItem[]>("/api/github/projects");
  const projects = data ?? [];
  const compact = useCompactMode();

  return (
    <section
      id="projects"
      className="relative isolate w-full h-full flex items-center justify-center px-5 sm:px-6"
    >
      {/* 巨型幽灵编号装置（scaffold 锚定 section 顶部 + 内容列右沿，跨页同位） */}
      <SectionGhostNumber index="04" />

      <div
        className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12"
        // 3D 面板会向两侧溢出；overflow-x: clip 阻止滚动条，同时保留纵向滚动
        style={{ overflowX: "clip" }}
      >
        <SectionHeading
          index="04"
          label={t.projects.label}
          title={t.projects.title}
        />
        <p
          className="fade-up-soft text-sm sm:text-base mb-6"
          style={{ animationDelay: "350ms", color: "var(--text-tertiary)" }}
        >
          {t.projects.subtitle}
        </p>

        {loading ? (
          <ProjectsSkeleton compact={compact} />
        ) : projects.length === 0 ? (
          <EmptySignal />
        ) : (
          <>
            {/* 机库：窄屏由 CSS 先行隐藏（hydration 前也不闪 3D），
                compact（窄屏或 reduced-motion）后直接卸载，避免隐藏状态下跑动画 */}
            {!compact && (
              <div className="hidden md:block">
                <HangarView
                  projects={projects}
                  label={t.projects.label}
                  contributorLabel={t.projects.contributor}
                />
              </div>
            )}
            <div className={compact ? "block" : "md:hidden"}>
              <ProjectList
                projects={projects}
                contributorLabel={t.projects.contributor}
              />
            </div>
          </>
        )}

        {/* See more */}
        <div
          className="mt-6 flex justify-center fade-up-soft"
          style={{ animationDelay: "0.85s" }}
        >
          <MagneticButton strength={0.3} tilt={0.03}>
            <a
              href="https://github.com/sysfox?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] active:scale-[0.97] theme-transition"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-border)";
                e.currentTarget.style.color = "var(--accent)";
                e.currentTarget.style.background = "var(--surface-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.background = "var(--surface)";
              }}
            >
              {t.projects.seeAll}
              <ArrowUpRight size={12} />
            </a>
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
