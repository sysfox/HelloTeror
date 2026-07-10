"use client";

import { Star, GitFork, ArrowUpRight, Terminal } from "lucide-react";
import type { ProjectItem } from "@/types";
import { AnimeAccentLine } from "@/components/animations/AnimeAccentLine";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { TiltCard } from "@/components/animations/TiltCard";

const PROJECTS: ProjectItem[] = [
  {
    id: "qexo",
    name: "Qexo",
    owner: "Qexo",
    description:
      "A fast, powerful and beautiful online manager for all static blog frameworks.",
    language: "Python",
    stars: 1900,
    forks: 409,
    url: "https://github.com/Qexo/Qexo",
    contribution: true,
  },
  {
    id: "mx-core",
    name: "core",
    owner: "mx-space",
    description:
      "AI-powered CMS core for personal blogs and creator websites, with AI summaries and translation.",
    language: "TypeScript",
    stars: 538,
    forks: 150,
    url: "https://github.com/mx-space/core",
    contribution: true,
  },
  {
    id: "koishi-imx",
    name: "koishi-plugin-imx",
    owner: "sysfox",
    description:
      "Mix-Space Bot for Koishi — 集成多种功能的聊天机器人插件。",
    language: "TypeScript",
    stars: 2,
    forks: 0,
    url: "https://github.com/sysfox/koishi-plugin-imx",
  },
];

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const LANGUAGE_COLORS: Record<string, string> = {
  Python: "#3572A5",
  TypeScript: "#3178c6",
};

export function ProjectsSection() {
  return (
    <section
      id="projects"
      className="relative w-full h-full flex items-center justify-center px-5 sm:px-6"
    >
      <div className="w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
        {/* Heading：强调线绘制 */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>
            {"// 04"}
          </span>
          <AnimeAccentLine />
          <span
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Projects
          </span>
        </div>

        {/* 标题块交错入场 */}
        <StaggerGroup
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-end mb-6"
          startDelay={200}
          staggerMs={120}
        >
          <h2
            data-stagger-item
            className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Things I&apos;ve built.
          </h2>
          <p
            data-stagger-item
            className="text-sm sm:text-base"
            style={{ color: "var(--text-tertiary)" }}
          >
            A selection of pinned repositories — from a 1.9k-star blog manager
            to an AI-powered CMS core.
          </p>
        </StaggerGroup>

        {/* 卡片网格：交错入场 + 3D 倾斜 */}
        <StaggerGroup
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"
          startDelay={420}
          staggerMs={90}
          from="center"
        >
          {PROJECTS.map((project) => (
            <div key={project.id} data-stagger-item>
              <TiltCard maxTilt={7} scale={1.03}>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col h-full rounded-2xl border p-5 transition-colors duration-300 theme-transition"
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
                        className="text-[11px] font-mono truncate"
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
                    className="relative text-xs sm:text-sm leading-relaxed flex-1 mb-4"
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

        {/* See more */}
        <div
          className="mt-6 text-center fade-up-soft"
          style={{ animationDelay: "0.8s" }}
        >
          <a
            href="https://github.com/sysfox?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs sm:text-sm transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-secondary)";
            }}
          >
            See all 98 repositories on GitHub
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
