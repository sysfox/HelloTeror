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
import { SectionGhostNumber } from "@/components/animations/SectionGhostNumber";
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

/** 档案面板的层叠深度：不同 Z 让面板在透视里形成前后关系 */
const DEPTH = {
  identity: 26,
  bio: 14,
  data: 0,
  achievements: 10,
  log: 6,
  signal: 18,
} as const;

/**
 * About「档案卷宗」布局：
 *  - 保留 SectionHeading / SectionGhostNumber / StaggerGroup / TiltCard 既有 API
 *  - 左：身份档案（竖排索引轨 + 肖像 + 读数），TiltCard 提供 3D 倾斜
 *  - 右：bio 面板、key/value 数据行、成就、profile.sh 日志、描边巨型引言
 *  - 各面板通过 translateZ 分处不同 Z 层；父级 perspective + item preserve-3d
 *  - 入场仍是 StaggerGroup 的交错 materialize，reduced-motion 由其 CSS 兜底
 *
 * 所有文案键与 AFFILIATION / ACHIEVEMENTS 常量与改造前一致。
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
      {/* 巨型幽灵编号装置（scaffold 锚定 section 顶部 + 内容列右沿，跨页同位） */}
      <SectionGhostNumber index="01" />

      <div className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
        <SectionHeading index="01" label={t.about.label} title={t.about.title} />

        {/* 副标题：HUD 读音，静态呈现（主入场交给下方 StaggerGroup） */}
        <div className="mb-6 -mt-2 flex items-center gap-3">
          <span
            aria-hidden
            className="h-px w-6 shrink-0"
            style={{
              background: "var(--accent-border, rgba(90,242,255,0.42))",
            }}
          />
          <p
            className="font-mono text-[11px] uppercase tracking-[0.24em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t.about.subtitle}
          </p>
        </div>

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
              maxTilt={6}
              scale={1.02}
              className="h-full [&>div]:h-full"
            >
              <DossierPanel
                index="00"
                label="IDENTITY"
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
            <DossierPanel
              index="01"
              label="BIO"
              depth={DEPTH.bio}
              className="h-full"
            >
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

              <div
                aria-hidden
                className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3 font-mono text-[9px] uppercase tracking-[0.22em]"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-tertiary)",
                }}
              >
                <span style={{ color: "var(--accent)" }}>{"// SIG"}</span>
                <span className="tabular-nums">0x7F02</span>
                <span className="h-1 w-1 rotate-45" style={{ background: "var(--accent-2, #ff3ec9)" }} />
                <span className="tabular-nums">032.041</span>
                <span className="h-1 w-1 rotate-45" style={{ background: "var(--accent-3, #ffc46b)" }} />
                <span className="tabular-nums">STABLE</span>
                <span className="ml-auto tabular-nums">01 / 04</span>
              </div>
            </DossierPanel>
          </div>

          {/* ===== 03 数据行 ===== */}
          <div
            data-stagger-item
            className="min-w-0 lg:col-span-7"
            style={{ transformStyle: "preserve-3d" }}
          >
            <DossierPanel
              index="02"
              label="DATA"
              depth={DEPTH.data}
              className="h-full"
            >
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                {FACTS.map((fact, i) => (
                  <FactRow
                    key={fact.label}
                    index={String(i + 1).padStart(2, "0")}
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
            <DossierPanel
              index="03"
              label={t.about.achievements}
              depth={DEPTH.achievements}
              accent="var(--accent-3, #ffc46b)"
              className="h-full"
            >
              <ul>
                {ACHIEVEMENTS.map((a, i) => (
                  <li
                    key={a.title}
                    className="flex items-center gap-2.5 py-2"
                    style={{
                      borderTop:
                        i > 0
                          ? "1px solid var(--border-subtle)"
                          : undefined,
                    }}
                  >
                    <span
                      className="shrink-0 font-mono text-[9px] tabular-nums"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      aria-hidden
                      className="h-1 w-1 shrink-0 rotate-45"
                      style={{ background: "var(--accent-3, #ffc46b)" }}
                    />
                    <span
                      className="min-w-0 flex-1 truncate text-[11px] sm:text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {a.title}
                    </span>
                    <span
                      className="shrink-0 font-mono text-[10px] tabular-nums"
                      style={{ color: "var(--accent-3, #ffc46b)" }}
                    >
                      {a.count ?? t.about.achievementMember}
                    </span>
                  </li>
                ))}
              </ul>
            </DossierPanel>
          </div>

          {/* ===== 05 profile.sh 日志 ===== */}
          <div
            data-stagger-item
            className="min-w-0 lg:col-span-7"
            style={{ transformStyle: "preserve-3d" }}
          >
            <DossierPanel
              index="04"
              label="LOG"
              depth={DEPTH.log}
              className="h-full"
            >
              <div
                className="mb-2 flex items-center justify-between gap-3 font-mono text-[9px] tabular-nums"
                style={{ color: "var(--text-tertiary)" }}
              >
                <span className="truncate">~/teror-fox/profile.sh</span>
                <span className="shrink-0">UTF-8</span>
              </div>
              <div
                className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words sm:text-[12px]"
                style={{ color: "var(--text-secondary)" }}
              >
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>$</span>{" "}
                  <span style={{ color: "var(--accent)" }}>whoami</span>
                </div>
                <div>{t.about.shellWhoami}</div>
                <div className="h-3" />
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>$</span>{" "}
                  <span style={{ color: "var(--accent)" }}>cat</span> bio.txt
                </div>
                <div>{t.about.shellBioLine1}</div>
                <div>{t.about.shellBioLine2}</div>
                <div className="h-3" />
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>$</span>{" "}
                  <span style={{ color: "var(--accent)" }}>status</span> --now
                </div>
                <div>
                  <span style={{ color: "var(--accent)" }}>●</span>{" "}
                  {t.about.shellStatus1}
                </div>
                <div>
                  <span style={{ color: "var(--accent-3, #ffc46b)" }}>●</span>{" "}
                  {t.about.shellStatus2}
                </div>
              </div>
            </DossierPanel>
          </div>

          {/* ===== 06 描边引言 ===== */}
          <div
            data-stagger-item
            className="min-w-0 lg:col-span-5"
            style={{ transformStyle: "preserve-3d" }}
          >
            <DossierPanel
              index="05"
              label="SIGNAL"
              depth={DEPTH.signal}
              accent="var(--accent-2, #ff3ec9)"
              className="h-full"
              bodyClassName="relative flex flex-1 flex-col justify-center p-5"
            >
              <span
                aria-hidden
                className="absolute left-4 top-1 select-none text-[88px] leading-none"
                style={{
                  color: "var(--accent)",
                  opacity: 0.12,
                  fontFamily: "Georgia, 'Times New Roman', serif",
                }}
              >
                “
              </span>
              <blockquote className="relative">
                <p
                  style={{
                    fontSize: "clamp(1.05rem, 2.1vw, 1.65rem)",
                    lineHeight: 1.45,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color:
                      "color-mix(in srgb, var(--text-primary) 16%, transparent)",
                    WebkitTextStroke:
                      "1px var(--text-secondary)",
                  }}
                >
                  {t.about.quote}
                </p>
                <footer
                  className="mt-3 font-mono text-[9px] uppercase tracking-[0.32em]"
                  style={{ color: "var(--accent)" }}
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
