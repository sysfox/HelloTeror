"use client";

import {
  MapPin,
  Building2,
  GraduationCap,
  Sparkles,
  Award,
  type LucideIcon,
} from "lucide-react";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { TiltCard } from "@/components/animations/TiltCard";
import { SectionHeading } from "@/components/animations/SectionHeading";
import { SectionGhostNumber } from "@/components/animations/SectionGhostNumber";
import { useT } from "@/contexts/LocaleContext";

/** 工作室名：专有名词，不进字典 */
const AFFILIATION = "TF Studio";

/** GitHub 成就徽章名为专有名词，不翻译；仅 count 里的 "Member" 走字典 */
const ACHIEVEMENTS: { title: string; count: string | null }[] = [
  { title: "Pair Extraordinaire", count: "x2" },
  { title: "Pull Shark", count: "x2" },
  { title: "Developer Program", count: null },
  { title: "GitHub Pro", count: "" },
];

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
      {/* 巨型幽灵编号装置（scaffold 锚定 section 顶部 + 内容列右沿，跨页同位） */}
      <SectionGhostNumber index="01" />

      <div className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
        {/* Section heading：元数据条 + 巨型 AnimeText 标题 */}
        <SectionHeading index="01" label={t.about.label} title={t.about.title} />
        <p
          className="fade-up-soft text-base sm:text-lg font-mono mb-8"
          style={{ animationDelay: "350ms", color: "var(--text-tertiary)" }}
        >
          {t.about.subtitle}
        </p>

        {/* 内容网格：左右两列各块作为 data-stagger-item 直接子级交错入场 */}
        <StaggerGroup
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start"
          startDelay={480}
          staggerMs={110}
        >
          {/* Left: Bio */}
          <div data-stagger-item className="lg:col-span-7 space-y-4">
            <p
              className="text-sm sm:text-base leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {t.about.bioBefore}
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                Teror Fox
              </span>
              {t.about.bioAfter}
            </p>

            {/* Code-style identity card */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--terminal-bg)",
                boxShadow: "var(--shadow-card)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 border-b"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--surface)",
                }}
              >
                <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
                <span className="w-2 h-2 rounded-full bg-[#28c840]" />
                <span
                  className="ml-2 text-[10px] font-mono truncate"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  ~/teror-fox/profile.sh
                </span>
              </div>
              <pre
                className="px-3 py-3 text-[11px] sm:text-[12.5px] leading-relaxed font-mono overflow-x-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                <code>
                  <span style={{ color: "var(--text-tertiary)" }}>$</span>{" "}
                  <span style={{ color: "var(--accent)" }}>whoami</span>
                  {"\n"}
                  {t.about.shellWhoami}
                  {"\n\n"}
                  <span style={{ color: "var(--text-tertiary)" }}>$</span>{" "}
                  <span style={{ color: "var(--accent)" }}>cat</span> bio.txt
                  {"\n"}
                  {t.about.shellBioLine1}
                  {"\n"}
                  {t.about.shellBioLine2}
                  {"\n\n"}
                  <span style={{ color: "var(--text-tertiary)" }}>$</span>{" "}
                  <span style={{ color: "var(--accent)" }}>status</span> --now
                  {"\n"}
                  <span style={{ color: "#28c840" }}>●</span> {t.about.shellStatus1}
                  {"\n"}
                  <span style={{ color: "#febc2e" }}>●</span> {t.about.shellStatus2}
                </code>
              </pre>
            </div>
          </div>

          {/* Right: Facts + Achievements + Quote，整体作为一个交错项 */}
          <div data-stagger-item className="lg:col-span-5 space-y-3">
            {/* Facts grid：每张 fact 卡片用 TiltCard 包裹，3D 倾斜 */}
            <div className="grid grid-cols-2 gap-2.5">
              {FACTS.map((fact) => {
                const Icon = fact.icon;
                return (
                  <TiltCard key={fact.label} maxTilt={6} scale={1.04}>
                    <div
                      className="group relative rounded-xl border p-3 transition-all duration-500 theme-transition h-full active:scale-[0.96]"
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
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                        <span
                          className="text-[10px] uppercase tracking-wider"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {fact.label}
                        </span>
                      </div>
                      <p
                        className="text-xs sm:text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {fact.value}
                      </p>
                    </div>
                  </TiltCard>
                );
              })}
            </div>

            {/* Achievements */}
            <div
              className="rounded-xl border p-3.5"
              style={{
                borderColor: "var(--border-subtle)",
                background:
                  "linear-gradient(135deg, var(--surface-strong), transparent)",
              }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <Award className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                <span
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {t.about.achievements}
                </span>
              </div>
              <ul className="space-y-1.5">
                {ACHIEVEMENTS.map((a) => (
                  <li
                    key={a.title}
                    className="flex items-center justify-between text-xs sm:text-sm"
                  >
                    <span style={{ color: "var(--text-secondary)" }}>{a.title}</span>
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: "var(--accent)" }}
                    >
                      {a.count ?? t.about.achievementMember}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quote card */}
            <div
              className="rounded-xl border p-3.5"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface)",
              }}
            >
              <p
                className="text-xs sm:text-sm italic leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {t.about.quote}
              </p>
              <p
                className="mt-1.5 text-[10px] font-mono"
                style={{ color: "var(--text-tertiary)" }}
              >
                — trfox.top
              </p>
            </div>
          </div>
        </StaggerGroup>
      </div>
    </section>
  );
}
