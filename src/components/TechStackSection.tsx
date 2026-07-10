"use client";

import {
  Code2,
  Layers,
  Server,
  Database,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { TechCategory } from "@/types";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { TiltCard } from "@/components/animations/TiltCard";
import { SectionHeading } from "@/components/animations/SectionHeading";
import { SectionGhostNumber } from "@/components/animations/SectionGhostNumber";

const TECH: TechCategory[] = [
  {
    id: "langs",
    label: "Languages",
    icon: "code",
    items: [
      { name: "TypeScript", note: "Primary" },
      { name: "Python", note: "Primary" },
    ],
  },
  {
    id: "frontend",
    label: "Frontend",
    icon: "layers",
    items: [{ name: "React" }, { name: "Next.js" }],
  },
  {
    id: "backend",
    label: "Backend",
    icon: "server",
    items: [
      { name: "NestJS" },
      { name: "Node.js" },
      { name: "FastAPI" },
    ],
  },
  {
    id: "infra",
    label: "Infrastructure",
    icon: "database",
    items: [
      { name: "Docker" },
      { name: "Redis" },
      { name: "PostgreSQL" },
      { name: "MongoDB" },
      { name: "MariaDB" },
    ],
  },
  {
    id: "tools",
    label: "Tools & OS",
    icon: "wrench",
    items: [
      { name: "VS Code" },
      { name: "Cursor" },
      { name: "macOS" },
      { name: "Ubuntu" },
    ],
  },
];

const ICONS: Record<string, LucideIcon> = {
  code: Code2,
  layers: Layers,
  server: Server,
  database: Database,
  wrench: Wrench,
};

export function TechStackSection() {
  return (
    <section
      id="tech"
      className="relative w-full h-full flex items-center justify-center px-5 sm:px-6"
    >
      <div className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
        {/* 巨型幽灵编号装置 */}
        <SectionGhostNumber index="02" />

        {/* Section heading：元数据条 + 巨型 AnimeText 标题 */}
        <SectionHeading
          index="02"
          label="Tech Stack"
          title="Tools of the trade."
        />
        <p
          className="fade-up-soft text-sm sm:text-base mb-6"
          style={{ animationDelay: "350ms", color: "var(--text-tertiary)" }}
        >
          A pragmatic stack honed across open-source work, side-projects, and
          the occasional all-nighter.
        </p>

        {/* 分类卡片：交错入场 + 3D 倾斜 */}
        <StaggerGroup
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"
          startDelay={480}
          staggerMs={90}
          from="center"
        >
          {TECH.map((cat) => {
            const Icon = ICONS[cat.icon] ?? Code2;
            return (
              <div key={cat.id} data-stagger-item>
                <TiltCard maxTilt={7} scale={1.03}>
                  <div
                    className="group relative rounded-2xl border p-4 transition-colors duration-500 theme-transition"
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
                    <div
                      aria-hidden
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 0%, var(--accent-soft), transparent 70%)",
                      }}
                    />

                    <div className="relative flex items-center gap-2.5 mb-3">
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--accent-soft), var(--surface))",
                          borderColor: "var(--accent-border)",
                          color: "var(--accent)",
                        }}
                      >
                        <Icon size={16} />
                      </span>
                      <h3
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {cat.label}
                      </h3>
                    </div>

                    <ul className="relative flex flex-wrap gap-1.5">
                      {cat.items.map((item) => (
                        <li
                          key={item.name}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-all duration-200 theme-transition active:scale-[0.96]"
                          style={{
                            borderColor: "var(--border-subtle)",
                            background: "var(--surface-strong)",
                            color: "var(--text-secondary)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              "var(--accent-border)";
                            (e.currentTarget as HTMLElement).style.color =
                              "var(--text-primary)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              "var(--border-subtle)";
                            (e.currentTarget as HTMLElement).style.color =
                              "var(--text-secondary)";
                          }}
                        >
                          {item.name}
                          {item.note && (
                            <span
                              className="text-[9px] font-mono"
                              style={{ color: "var(--accent)" }}
                            >
                              {item.note}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TiltCard>
              </div>
            );
          })}

          {/* Decorative "more" card */}
          <div data-stagger-item>
            <div
              className="rounded-2xl border border-dashed p-4 flex flex-col items-center justify-center text-center min-h-[140px]"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <p
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Always learning
                <br />
                the next thing.
              </p>
              <span className="mt-2 text-xl spin-slow inline-block">✦</span>
            </div>
          </div>
        </StaggerGroup>
      </div>
    </section>
  );
}
