"use client";

import { ArrowUpRight, GitFork, Star } from "lucide-react";
import type { ProjectItem } from "@/types";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { formatCompactNumber, languageAccent } from "./projectMeta";

/**
 * 紧凑列表：窄屏与 reduced-motion 的退化视图。
 * 保留全部数据字段（名称、描述、语言、星标、fork、贡献标记），
 * 但去掉 3D、扫描线与指针聚焦，保证静态可读、360px 不溢出。
 */
type ProjectListProps = {
  projects: ProjectItem[];
  contributorLabel: string;
};

export function ProjectList({ projects, contributorLabel }: ProjectListProps) {
  return (
    <div role="list">
      <StaggerGroup
        className="flex flex-col gap-2"
        startDelay={480}
        staggerMs={75}
        from="first"
      >
        {projects.map((project, i) => (
          <div key={project.id} data-stagger-item role="listitem">
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-14 items-center gap-3 border px-3.5 py-2.5 active:scale-[0.99] theme-transition"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-border)";
                e.currentTarget.style.background = "var(--surface-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "var(--surface)";
              }}
            >
              <span
                className="shrink-0 font-mono text-[10px] tabular-nums tracking-[0.1em]"
                style={{ color: "var(--accent)" }}
              >
                {`P-${String(i + 1).padStart(2, "0")}`}
              </span>
              <span
                aria-hidden
                className="h-6 w-px shrink-0"
                style={{ background: "var(--border-strong)" }}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span
                    className="truncate text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {project.name}
                  </span>
                  <span
                    className="truncate font-mono text-[9px] uppercase tracking-[0.14em]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {project.owner}
                  </span>
                  {project.contribution && (
                    <span
                      className="hidden shrink-0 border px-1 py-px font-mono text-[8px] uppercase tracking-[0.16em] sm:inline"
                      style={{
                        borderColor: "var(--accent-2)",
                        color: "var(--accent-2)",
                      }}
                    >
                      {contributorLabel}
                    </span>
                  )}
                </div>
                <p
                  className="mt-0.5 hidden truncate text-xs md:block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {project.description}
                </p>
              </div>

              <div
                className="flex shrink-0 items-center gap-2.5 font-mono text-[10px] tabular-nums"
                style={{ color: "var(--text-tertiary)" }}
              >
                <span className="hidden items-center gap-1.5 sm:inline-flex">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5"
                    style={{ background: languageAccent(project.language) }}
                  />
                  {project.language}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star size={10} />
                  {formatCompactNumber(project.stars)}
                </span>
                {project.forks > 0 && (
                  <span className="hidden items-center gap-1 sm:inline-flex">
                    <GitFork size={10} />
                    {formatCompactNumber(project.forks)}
                  </span>
                )}
                <ArrowUpRight
                  size={13}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                />
              </div>
            </a>
          </div>
        ))}
      </StaggerGroup>
    </div>
  );
}
