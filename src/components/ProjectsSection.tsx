"use client";

import { Star, GitFork, ArrowUpRight, Terminal } from "lucide-react";
import type { ProjectItem } from "@/types";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { TiltCard } from "@/components/animations/TiltCard";
import { SectionHeading } from "@/components/animations/SectionHeading";
import { SectionGhostNumber } from "@/components/animations/SectionGhostNumber";
import { useApiData } from "@/hooks/useApiData";

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const LANGUAGE_COLORS: Record<string, string> = {
  Python: "#3572A5",
  TypeScript: "#3178c6",
};

function ProjectCardSkeleton() {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="h-3 w-28 rounded animate-pulse"
          style={{ background: "var(--surface-strong)" }}
        />
        <span
          className="h-3 w-3 rounded animate-pulse"
          style={{ background: "var(--surface-strong)" }}
        />
      </div>
      <div className="flex flex-col gap-1.5 mb-4">
        <span
          className="h-3 w-full rounded animate-pulse"
          style={{ background: "var(--surface-strong)" }}
        />
        <span
          className="h-3 w-2/3 rounded animate-pulse"
          style={{ background: "var(--surface-strong)" }}
        />
      </div>
      <div className="flex items-center gap-3">
        <span
          className="h-2.5 w-16 rounded animate-pulse"
          style={{ background: "var(--surface-strong)" }}
        />
        <span
          className="h-2.5 w-10 rounded animate-pulse"
          style={{ background: "var(--surface-strong)" }}
        />
      </div>
    </div>
  );
}

export function ProjectsSection() {
  const { data, loading } = useApiData<ProjectItem[]>("/api/github/projects");
  const projects = data ?? [];

  return (
    <section
      id="projects"
      className="relative w-full h-full flex items-center justify-center px-5 sm:px-6"
    >
      <div className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
        {/* 巨型幽灵编号装置 */}
        <SectionGhostNumber index="04" />

        {/* Section heading：元数据条 + 巨型 AnimeText 标题 */}
        <SectionHeading index="04" label="Projects" title="Things I've built." />
        <p
          className="fade-up-soft text-sm sm:text-base mb-6"
          style={{ animationDelay: "350ms", color: "var(--text-tertiary)" }}
        >
          A selection of pinned repositories — from a 1.9k-star blog manager
          to an AI-powered CMS core.
        </p>

        {/* 卡片网格：交错入场 + 3D 倾斜 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <StaggerGroup
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"
            startDelay={480}
            staggerMs={90}
            from="center"
          >
            {projects.map((project, i) => (
              <div
                key={project.id}
                data-stagger-item
                className={i === 0 ? "lg:col-span-2" : ""}
              >
                <TiltCard maxTilt={7} scale={1.03}>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col h-full rounded-2xl border p-5 transition-all duration-300 theme-transition active:scale-[0.96]"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--surface)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "var(--accent-border)";
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--accent-soft)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "var(--border-subtle)";
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--surface)";
                    }}
                  >
                    {/* Hover glow */}
                    <div
                      aria-hidden
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 0%, var(--accent-soft), transparent 70%)",
                      }}
                    />

                    {/* Header: owner/name + arrow */}
                    <div className="relative flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Terminal
                          size={12}
                          className="shrink-0"
                          style={{ color: "var(--text-tertiary)" }}
                        />
                        <span
                          className={`font-mono truncate ${i === 0 ? "text-xs" : "text-[11px]"}`}
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {project.owner}/
                          <span
                            style={{
                              color: "var(--text-primary)",
                              fontWeight: 500,
                            }}
                          >
                            {project.name}
                          </span>
                        </span>
                      </div>
                      <ArrowUpRight
                        size={14}
                        className="shrink-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        style={{ color: "var(--text-tertiary)" }}
                      />
                    </div>

                    {/* Description */}
                    <p
                      className={`relative leading-relaxed flex-1 mb-4 ${i === 0 ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {project.description}
                    </p>

                    {/* Footer: language + stars + forks */}
                    <div
                      className="relative flex items-center gap-3 text-[11px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            background:
                              LANGUAGE_COLORS[project.language] ??
                              "var(--text-tertiary)",
                          }}
                        />
                        {project.language}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star size={11} />
                        {formatNumber(project.stars)}
                      </span>
                      {project.forks > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <GitFork size={11} />
                          {project.forks}
                        </span>
                      )}
                      {project.contribution && (
                        <span
                          className="ml-auto text-[9px] font-mono"
                          style={{ color: "var(--accent)" }}
                        >
                          contributor
                        </span>
                      )}
                    </div>
                  </a>
                </TiltCard>
              </div>
            ))}
          </StaggerGroup>
        )}

        {/* See more */}
        <div
          className="mt-6 text-center fade-up-soft"
          style={{ animationDelay: "0.8s" }}
        >
          <a
            href="https://github.com/sysfox?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs sm:text-sm transition-all active:scale-[0.96]"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-secondary)";
            }}
          >
            See all on GitHub
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
