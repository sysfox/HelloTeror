"use client";

import {
  Building2,
  GraduationCap,
  MapPin,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { TiltCard } from "@/components/animations/TiltCard";
import { SectionHeading } from "@/components/animations/SectionHeading";
import { useT } from "@/contexts/LocaleContext";
import { DossierPanel } from "@/components/sections/about/DossierPanel";
import { FactRow } from "@/components/sections/about/FactRow";
import { IdentityBlock } from "@/components/sections/about/IdentityBlock";

/** 工作室名：专有名词，不进字典 */
const AFFILIATION = "TF Studio";

/** GitHub 成就徽章名为专有名词，不翻译；仅 count 里的 "Member" 走字典 */
const ACHIEVEMENTS: { title: string; count: string | null }[] = [
  { title: "Pair Extraordinaire", count: "x2" },
  { title: "Pull Shark", count: "x2" },
  { title: "Developer Program", count: null },
  { title: "GitHub Pro", count: "" },
];

/** 面板的层叠深度：轻微前后关系，不再承担装饰性 HUD 效果 */
const DEPTH = {
  identity: 18,
  bio: 8,
  data: 0,
  achievements: 4,
  log: 2,
  signal: 10,
} as const;

/**
 * About「档案」布局（简化版）：
 *  - 左：身份档案（肖像 + 身份/所属/位置），TiltCard 只保留轻微倾斜
 *  - 右：bio、数据行、成就、简介与引言
 *  - 去掉竖排索引轨、HUD 头、角标、扫描线、终端提示符
 *  - 入场仍是 StaggerGroup 的交错淡入，reduced-motion 由其 CSS 兜底
 */
export function AboutSection() {
  const t = useT();

  const FACTS: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: MapPin, label: t.about.factLocation, value: t.about.factLocationValue },
    { icon: Building2, label: t.about.factAffiliation, value: AFFILIATION },
    { icon: GraduationCap, label: t.about.factRole, value: t.about.factRoleValue },
    { icon: Sparkles, label: t.about.factFocus, value: t.about.factFocusValue },
  ];

  return (
    <section
      id="about"
      className="relative isolate w-full h-full flex items-center justify-center px-5 sm:px-6"
    >
      <div className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
        <SectionHeading index="01" label={t.about.label} title={t.about.title} />

        <p
          className="mb-6 text-sm leading-relaxed"
          style={{ color: "var(--text-tertiary)" }}
        >
          {t.about.subtitle}
        </p>

        <StaggerGroup
          className="grid grid-cols-1 gap-4 [perspective:1400px] lg:grid-cols-12 lg:gap-5"
          startDelay={480}
          staggerMs={90}
          y={30}
          duration={900}
        >
          {/* ===== 01 身份档案 ===== */}
          <div
            data-stagger-item
            className="min-w-0 lg:col-span-4"
            style={{ transformStyle: "preserve-3d" }}
          >
            <TiltCard
              maxTilt={4}
              scale={1.01}
              className="h-full [&>div]:h-full"
            >
              <DossierPanel
                depth={DEPTH.identity}
                className="h-full"
                bodyClassName="relative flex min-h-0 flex-1 flex-col p-0"
              >
                <IdentityBlock affiliation={AFFILIATION} />
              </DossierPanel>
            </TiltCard>
          </div>

          {/* ===== 02 Bio ===== */}
          <div
            data-stagger-item
            className="min-w-0 lg:col-span-8"
            style={{ transformStyle: "preserve-3d" }}
          >
            <DossierPanel depth={DEPTH.bio} className="h-full">
              <p
                className="text-sm leading-relaxed sm:text-[15px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {t.about.bioBefore}
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 600,
                  }}
                >
                  Teror Fox
                </span>
                {t.about.bioAfter}
              </p>
            </DossierPanel>
          </div>

          {/* ===== 03 数据行 ===== */}
          <div
            data-stagger-item
            className="min-w-0 lg:col-span-7"
            style={{ transformStyle: "preserve-3d" }}
          >
            <DossierPanel depth={DEPTH.data} className="h-full">
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                {FACTS.map((fact) => (
                  <FactRow
                    key={fact.label}
                    icon={fact.icon}
                    label={fact.label}
                    value={fact.value}
                  />
                ))}
              </div>
            </DossierPanel>
          </div>

          {/* ===== 04 成就 ===== */}
          <div
            data-stagger-item
            className="min-w-0 lg:col-span-5"
            style={{ transformStyle: "preserve-3d" }}
          >
            <DossierPanel depth={DEPTH.achievements} className="h-full">
              <ul>
                {ACHIEVEMENTS.map((a, i) => (
                  <li
                    key={a.title}
                    className="flex items-center gap-2.5 py-2"
                    style={{
                      borderTop:
                        i > 0 ? "1px solid var(--border-subtle)" : undefined,
                    }}
                  >
                    <span
                      className="min-w-0 flex-1 truncate text-[11px] sm:text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {a.title}
                    </span>
                    <span
                      className="shrink-0 font-mono text-[10px] tabular-nums"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {a.count ?? t.about.achievementMember}
                    </span>
                  </li>
                ))}
              </ul>
            </DossierPanel>
          </div>

          {/* ===== 05 简介 ===== */}
          <div
            data-stagger-item
            className="min-w-0 lg:col-span-7"
            style={{ transformStyle: "preserve-3d" }}
          >
            <DossierPanel depth={DEPTH.log} className="h-full">
              <div
                className="space-y-3 text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                <p>{t.about.shellWhoami}</p>
                <p>
                  {t.about.shellBioLine1}
                  <br />
                  {t.about.shellBioLine2}
                </p>
                <p>
                  {t.about.shellStatus1}
                  <br />
                  {t.about.shellStatus2}
                </p>
              </div>
            </DossierPanel>
          </div>

          {/* ===== 06 引言 ===== */}
          <div
            data-stagger-item
            className="min-w-0 lg:col-span-5"
            style={{ transformStyle: "preserve-3d" }}
          >
            <DossierPanel
              depth={DEPTH.signal}
              className="h-full"
              bodyClassName="relative flex flex-1 flex-col justify-center p-5"
            >
              <blockquote>
                <p
                  style={{
                    fontSize: "clamp(1.05rem, 2.1vw, 1.65rem)",
                    lineHeight: 1.45,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: "var(--text-primary)",
                  }}
                >
                  {t.about.quote}
                </p>
                <footer
                  className="mt-3 text-[11px]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  — trfox.top
                </footer>
              </blockquote>
            </DossierPanel>
          </div>
        </StaggerGroup>
      </div>
    </section>
  );
}
