"use client";

import { useEffect, useRef, useState } from "react";
import {
  GitCommitHorizontal,
  GitPullRequest,
  CircleDot,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import type { StatItem } from "@/types";
import { AnimeAccentLine } from "@/components/animations/AnimeAccentLine";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { TiltCard } from "@/components/animations/TiltCard";

const STATS: (StatItem & { icon: LucideIcon })[] = [
  {
    id: "commits",
    label: "Commits this year",
    value: 1886,
    suffix: "+",
    icon: GitCommitHorizontal,
  },
  {
    id: "prs",
    label: "Pull requests",
    value: 82,
    suffix: "",
    icon: GitPullRequest,
  },
  {
    id: "issues",
    label: "Issues opened",
    value: 84,
    suffix: "",
    icon: CircleDot,
  },
  {
    id: "contrib",
    label: "Contributed to",
    value: 32,
    suffix: "",
    icon: Users,
  },
];

const EXTRA_STATS = [
  { id: "repos", label: "Public repositories", value: 98 },
  { id: "followers", label: "GitHub followers", value: 71 },
  { id: "stars", label: "Stars earned", value: 12 },
] as const;

function StatCard({
  stat,
  start,
}: {
  stat: StatItem & { icon: LucideIcon };
  start: boolean;
}) {
  const value = useCountUp(stat.value, {
    duration: 1600,
    start,
    decimals: stat.decimals ?? 0,
  });
  const Icon = stat.icon;

  return (
    <div
      className="group relative rounded-2xl border p-5 sm:p-6 transition-colors duration-500 theme-transition"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "var(--accent-border)";
        (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "var(--border-subtle)";
        (e.currentTarget as HTMLElement).style.background = "var(--surface)";
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
      <div
        className="relative flex items-center gap-2 mb-3"
        style={{ color: "var(--accent)" }}
      >
        <Icon size={18} />
      </div>
      <div className="relative flex items-baseline gap-0.5">
        <span
          className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {value.toLocaleString()}
        </span>
        {stat.suffix && (
          <span
            className="text-xl sm:text-2xl font-semibold"
            style={{ color: "var(--accent)" }}
          >
            {stat.suffix}
          </span>
        )}
      </div>
      <p
        className="relative mt-1.5 text-xs sm:text-sm"
        style={{ color: "var(--text-tertiary)" }}
      >
        {stat.label}
      </p>
    </div>
  );
}

export function StatsSection() {
  // 在 mount 时立即触发一次 count-up，后续每次进入页面都会重新触发
  const startRef = useRef(false);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (startRef.current) return;
    startRef.current = true;
    const t = window.setTimeout(() => setStart(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section
      id="stats"
      className="relative w-full h-full flex items-center justify-center px-5 sm:px-6"
    >
      <div className="w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
        {/* Heading：强调线绘制 */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>
            {"// 03"}
          </span>
          <AnimeAccentLine />
          <span
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Activity
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
            By the numbers.
          </h2>
          <p
            data-stagger-item
            className="text-sm sm:text-base"
            style={{ color: "var(--text-tertiary)" }}
          >
            A year of shipping — measured in commits, pull requests, and the
            conversations they sparked.
          </p>
        </StaggerGroup>

        {/* 数字卡片：交错入场 + 3D 倾斜 + count-up */}
        <StaggerGroup
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
          startDelay={420}
          staggerMs={90}
          from="center"
        >
          {STATS.map((stat) => (
            <div key={stat.id} data-stagger-item>
              <TiltCard maxTilt={6} scale={1.03}>
                <StatCard stat={stat} start={start} />
              </TiltCard>
            </div>
          ))}
        </StaggerGroup>

        {/* Extra inline stats */}
        <div
          className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm fade-up-soft"
          style={{ animationDelay: "0.85s", color: "var(--text-tertiary)" }}
        >
          {EXTRA_STATS.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-2">
              <span
                className="font-mono"
                style={{ color: "var(--text-primary)" }}
              >
                {s.value}
              </span>
              <span>{s.label}</span>
            </span>
          ))}
          <a
            href="https://github.com/sysfox"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto transition-colors"
            style={{ color: "var(--accent)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--accent)";
            }}
          >
            View GitHub profile →
          </a>
        </div>
      </div>
    </section>
  );
}
