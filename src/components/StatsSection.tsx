"use client";

import { useEffect, useState } from "react";
import {
  GitCommitHorizontal,
  GitPullRequest,
  CircleDot,
  Users,
} from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { useApiData } from "@/hooks/useApiData";
import type { GitHubStatsResponse } from "@/types";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { TiltCard } from "@/components/animations/TiltCard";
import { SectionHeading } from "@/components/animations/SectionHeading";
import { SectionGhostNumber } from "@/components/animations/SectionGhostNumber";
import { ContributionGraph } from "@/components/animations/ContributionGraph";
import { useLocale } from "@/contexts/LocaleContext";
import {
  GaugeCard,
  GaugeSkeleton,
  type GaugeStat,
} from "./sections/stats/GaugeCard";
import styles from "./sections/stats/stats.module.css";

/**
 * 尾部附加读数：沿用 useCountUp 的既有 API，仅换成 HUD 排版。
 * start 与主仪表同步，保证一屏内所有数字同一时刻起跑。
 */
function ExtraStat({
  value,
  label,
  start,
  intlLocale,
}: {
  value: number;
  label: string;
  start: boolean;
  intlLocale: string;
}) {
  const v = useCountUp(value, { duration: 1600, start, decimals: 0 });
  return (
    <span className={styles.extra}>
      <span aria-hidden className={styles.extraKey} />
      <span className={styles.extraValue}>{v.toLocaleString(intlLocale)}</span>
      <span className={styles.extraLabel}>{label}</span>
    </span>
  );
}

export function StatsSection() {
  const { t, intlLocale } = useLocale();
  const { data, loading } = useApiData<GitHubStatsResponse>("/api/github/stats");

  // count-up / 热图波浪的触发：仅在数据就绪后启动，避免空数据触发动画。
  //
  // 守卫条件用 start 这个 state 而**不是** ref：旧版用 startRef 会在 React
  // strict-mode 双挂载下永久卡死 —— 第一趟 effect 置位 ref 并挂定时器，
  // 它的 cleanup 清掉定时器，第二趟 effect 因 ref 已置位而提前返回，
  // 于是再没有人去 setStart(true)，数字永远停在 0、热图永远不显形。
  // 该路径只在挂载首帧就命中 useApiData 缓存时出现（重复访问本页 / 切换语言重挂载）。
  // 用 state 作守卫后，第二趟 effect 会重新挂上定时器；start 一旦为真便不再重播。
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (start) return;
    if (loading || !data) return;
    const timer = window.setTimeout(() => setStart(true), 80);
    return () => window.clearTimeout(timer);
  }, [loading, data, start]);

  // 主仪表：meterScale 只是仪表环的视觉满量程，不展示百分比文案，
  // 因此不同量纲的指标也能并排成一套读数。
  const STATS: GaugeStat[] = [
    {
      id: "commits",
      label: t.stats.commits,
      value: data?.commits ?? 0,
      suffix: "+",
      icon: GitCommitHorizontal,
      hud: "var(--accent)",
      scale: 3000,
    },
    {
      id: "prs",
      label: t.stats.prs,
      value: data?.prs ?? 0,
      icon: GitPullRequest,
      hud: "var(--accent-2, #ff3ec9)",
      scale: 300,
    },
    {
      id: "issues",
      label: t.stats.issues,
      value: data?.issues ?? 0,
      icon: CircleDot,
      hud: "var(--accent-3, #ffc46b)",
      scale: 300,
    },
    {
      id: "contrib",
      label: t.stats.contributedTo,
      value: data?.contributedTo ?? 0,
      icon: Users,
      hud: "var(--accent-4, #7c5cff)",
      scale: 200,
    },
  ];

  const EXTRA_STATS = [
    { id: "repos", label: t.stats.repos, value: data?.repos ?? 0 },
    { id: "followers", label: t.stats.followers, value: data?.followers ?? 0 },
    { id: "stars", label: t.stats.stars, value: data?.stars ?? 0 },
  ];

  return (
    <section
      id="stats"
      className="relative isolate w-full h-full flex items-center justify-center px-5 sm:px-6"
    >
      {/* 巨型幽灵编号装置（scaffold 锚定 section 顶部 + 内容列右沿，跨页同位） */}
      <SectionGhostNumber index="03" />

      <div className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
        <SectionHeading index="03" label={t.stats.label} title={t.stats.title} />
        <p
          className="fade-up-soft text-sm sm:text-base mb-6"
          style={{ animationDelay: "350ms", color: "var(--text-tertiary)" }}
        >
          {t.stats.subtitle}
        </p>

        {/* 遥测仪表：交错材质化入场 + 3D 倾斜 + count-up */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <GaugeSkeleton key={i} />
            ))}
          </div>
        ) : (
          <StaggerGroup
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
            startDelay={480}
            staggerMs={90}
            from="center"
          >
            {STATS.map((stat, i) => (
              <div key={stat.id} data-stagger-item>
                <TiltCard maxTilt={4} scale={1.02}>
                  <GaugeCard
                    stat={stat}
                    index={i}
                    start={start}
                    intlLocale={intlLocale}
                  />
                </TiltCard>
              </div>
            ))}
          </StaggerGroup>
        )}

        {/* 贡献热图：对角波浪点亮。等 count-up 起跑后再铺开 */}
        {!loading && data?.calendar && (
          <div className="mt-5">
            <ContributionGraph
              calendar={data.calendar}
              start={start}
              startDelay={620}
            />
          </div>
        )}

        {/* 尾部附加读数 */}
        {loading ? (
          <div className={styles.extraList} style={{ marginTop: 20 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={styles.skeletonBar}
                style={{ width: 108, height: 10 }}
              />
            ))}
          </div>
        ) : (
          <div
            className={`${styles.extraList} fade-up-soft`}
            style={{ marginTop: 20, animationDelay: "0.85s" }}
          >
            {EXTRA_STATS.map((s) => (
              <ExtraStat
                key={s.id}
                value={s.value}
                label={s.label}
                start={start}
                intlLocale={intlLocale}
              />
            ))}
            <a
              href="https://github.com/sysfox"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] transition-colors"
              style={{ color: "var(--accent)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--accent)";
              }}
            >
              {t.stats.profileLink}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
