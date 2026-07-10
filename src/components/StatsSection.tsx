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
import { useApiData } from "@/hooks/useApiData";
import type { GitHubStatsResponse, StatItem } from "@/types";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { TiltCard } from "@/components/animations/TiltCard";
import { SectionHeading } from "@/components/animations/SectionHeading";
import { SectionGhostNumber } from "@/components/animations/SectionGhostNumber";

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
      className="group relative rounded-2xl border p-5 sm:p-6 transition-all duration-500 theme-transition active:scale-[0.96]"
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
          className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {value.toLocaleString()}
        </span>
        {stat.suffix && (
          <span
            className="text-2xl sm:text-3xl md:text-4xl font-semibold"
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

function StatCardSkeleton() {
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface)",
      }}
    >
      <span
        className="block h-[18px] w-[18px] rounded mb-3 animate-pulse"
        style={{ background: "var(--surface-strong)" }}
      />
      <span
        className="block h-8 w-20 rounded mb-2 animate-pulse"
        style={{ background: "var(--surface-strong)" }}
      />
      <span
        className="block h-3 w-24 rounded animate-pulse"
        style={{ background: "var(--surface-strong)" }}
      />
    </div>
  );
}

function ExtraStat({
  value,
  label,
  start,
}: {
  value: number;
  label: string;
  start: boolean;
}) {
  const v = useCountUp(value, { duration: 1600, start, decimals: 0 });
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono" style={{ color: "var(--text-primary)" }}>
        {v.toLocaleString()}
      </span>
      <span>{label}</span>
    </span>
  );
}

export function StatsSection() {
  const { data, loading } = useApiData<GitHubStatsResponse>("/api/github/stats");

  // count-up 触发：仅在数据就绪后启动，避免空数据触发动画
  const startRef = useRef(false);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (startRef.current) return;
    if (loading || !data) return;
    startRef.current = true;
    const t = window.setTimeout(() => setStart(true), 80);
    return () => window.clearTimeout(t);
  }, [loading, data]);

  const STATS: (StatItem & { icon: LucideIcon })[] = [
    {
      id: "commits",
      label: "Commits this year",
      value: data?.commits ?? 0,
      suffix: "+",
      icon: GitCommitHorizontal,
    },
    {
      id: "prs",
      label: "Pull requests",
      value: data?.prs ?? 0,
      suffix: "",
      icon: GitPullRequest,
    },
    {
      id: "issues",
      label: "Issues opened",
      value: data?.issues ?? 0,
      suffix: "",
      icon: CircleDot,
    },
    {
      id: "contrib",
      label: "Contributed to",
      value: data?.contributedTo ?? 0,
      suffix: "",
      icon: Users,
    },
  ];

  const EXTRA_STATS = [
    { id: "repos", label: "Public repositories", value: data?.repos ?? 0 },
    { id: "followers", label: "GitHub followers", value: data?.followers ?? 0 },
    { id: "stars", label: "Stars earned", value: data?.stars ?? 0 },
  ];

  return (
    <section
      id="stats"
      className="relative isolate w-full h-full flex items-center justify-center px-5 sm:px-6"
    >
      {/* 巨型幽灵编号装置（scaffold 锚定 section 顶部 + 内容列右沿，跨页同位） */}
      <SectionGhostNumber index="03" />

      <div className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
        {/* Section heading：元数据条 + 巨型 AnimeText 标题 */}
        <SectionHeading index="03" label="Activity" title="By the numbers." />
        <p
          className="fade-up-soft text-sm sm:text-base mb-6"
          style={{ animationDelay: "350ms", color: "var(--text-tertiary)" }}
        >
          A year of shipping — measured in commits, pull requests, and the
          conversations they sparked.
        </p>

        {/* 数字卡片：交错入场 + 3D 倾斜 + count-up */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <StaggerGroup
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
            startDelay={480}
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
        )}

        {/* Extra inline stats */}
        {loading ? (
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className="h-3 w-28 rounded animate-pulse"
                style={{ background: "var(--surface-strong)" }}
              />
            ))}
          </div>
        ) : (
          <div
            className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm fade-up-soft"
            style={{ animationDelay: "0.85s", color: "var(--text-tertiary)" }}
          >
            {EXTRA_STATS.map((s) => (
              <ExtraStat
                key={s.id}
                value={s.value}
                label={s.label}
                start={start}
              />
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
        )}
      </div>
    </section>
  );
}
