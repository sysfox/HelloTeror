"use client";

import { ArrowUpRight } from "lucide-react";
import type { ProjectItem } from "@/types";
import { SectionHeading } from "@/components/animations/SectionHeading";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { useApiData } from "@/hooks/useApiData";
import { useT } from "@/contexts/LocaleContext";
import { ProjectList } from "@/components/sections/projects/ProjectList";
import { ProjectsSkeleton } from "@/components/sections/projects/ProjectsSkeleton";

/**
 * Projects — 简洁列表视图。
 *
 * 保留全部数据字段与外链行为（useApiData + /api/github/projects），
 * 去掉 3D 机库 / 扫描线 / 指针换焦，让版面更安静。
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

export function ProjectsSection() {
  const t = useT();
  const { data, loading } = useApiData<ProjectItem[]>("/api/github/projects");
  const projects = data ?? [];

  return (
    <section
      id="projects"
      className="relative isolate w-full h-full flex items-center justify-center px-5 sm:px-6"
    >
      <div className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
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
          <ProjectsSkeleton compact />
        ) : projects.length === 0 ? (
          <EmptySignal text={t.projects.empty} />
        ) : (
          <ProjectList
            projects={projects}
            contributorLabel={t.projects.contributor}
          />
        )}

        {/* See more */}
        <div
          className="mt-6 flex justify-center fade-up-soft"
          style={{ animationDelay: "0.85s" }}
        >
          <MagneticButton strength={0.2} tilt={0.02}>
            <a
              href="https://github.com/sysfox?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border px-3.5 py-2 text-xs transition-colors duration-200 active:scale-[0.97]"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-border)";
                e.currentTarget.style.color = "var(--text-primary)";
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
