"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import Image from "next/image";
import { usePage } from "@/contexts/PageContext";
import { useT } from "@/contexts/LocaleContext";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { AnimeText } from "@/components/animations/AnimeText";
import { HeroStatus } from "@/components/sections/hero/HeroStatus";
import { HeroLinks } from "@/components/sections/hero/HeroLinks";

const AVATAR = "https://avatars.githubusercontent.com/u/99103591?v=4";

/** KineticLoader 完成时写入的 sessionStorage key，用于时序同步 */
const LOADER_KEY = "teror-fox-loader-played";

/** 巨型姓名：字号/字距集中在 wrapper 上，AnimeText 直接继承 */
const NAME_STYLE: CSSProperties = {
  fontSize: "clamp(2.55rem, 8.2vw, 7rem)",
  lineHeight: 0.92,
  fontWeight: 700,
  letterSpacing: "-0.045em",
  whiteSpace: "nowrap",
};

/**
 * Hero 首屏（简化版）：
 *  - 背景只保留持久 3D 场景，不再叠加同心环 / 网格 / 扫描带 HUD 装置
 *  - 左栏：身份条 → 巨型姓名（干净纵深入场）→ 标语 / 身份行 / bio / CTA
 *  - 右栏：位置与状态 + 站点链接
 *
 * 时序沿用 loader 交接：首次访问 startDelay=1900ms，再次进入 home 为 200ms。
 * ready 门控确保子组件 mount 时拿到最终 delay。
 */
export function HeroSection() {
  const { navigate } = usePage();
  const t = useT();
  const [ready, setReady] = useState(false);
  const [startDelay, setStartDelay] = useState(1900);

  const stamp = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    const played = sessionStorage.getItem(LOADER_KEY);
    // 根据 loader 是否播放过决定入场延迟（首次访问长延迟，已访问过短延迟）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStartDelay(played ? 200 : 1900);
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      id="home"
      className="relative isolate w-full h-full overflow-hidden px-5 sm:px-6"
    >
      <div className="no-scrollbar relative z-10 mx-auto h-full w-full max-w-6xl overflow-y-auto">
        <div className="flex min-h-full flex-col justify-center py-8 sm:py-10">
          {ready && (
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
              {/* ===== 左栏：身份主体 ===== */}
              <StaggerGroup
                className="flex min-w-0 flex-col items-start lg:col-span-7"
                startDelay={startDelay}
                staggerMs={90}
                y={32}
                duration={900}
              >
                {/* 身份条：头像 + 署名 + 年月 */}
                <div
                  data-stagger-item
                  className="inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-2"
                >
                  <Image
                    src={AVATAR}
                    alt=""
                    width={28}
                    height={28}
                    unoptimized
                    className="h-7 w-7 shrink-0 object-cover"
                    style={{
                      outline: "1px solid var(--border-subtle)",
                      borderRadius: 2,
                    }}
                  />
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Teror Fox
                  </span>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {stamp}
                  </span>
                </div>

                {/* 巨型姓名 */}
                <div data-stagger-item className="mt-5 w-full min-w-0">
                  <div className="relative w-full" style={NAME_STYLE}>
                    <AnimeText
                      as="h1"
                      text="Teror Fox"
                      delay={startDelay + 150}
                      duration={1000}
                      staggerMs={50}
                      from="first"
                      y={24}
                      rotate={0}
                      blur={10}
                      depth={90}
                      className="relative block"
                      style={{ color: "var(--text-primary)" }}
                    />
                  </div>
                </div>

                {/* 标语 + 身份行 */}
                <div data-stagger-item className="mt-4 w-full min-w-0">
                  <p
                    className="text-lg font-semibold sm:text-2xl"
                    style={{
                      color: "var(--text-primary)",
                      textWrap: "balance",
                    }}
                  >
                    {t.hero.tagline}
                  </p>
                  <p
                    className="mt-2 text-[12px] sm:text-sm"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {t.hero.roleStudent} & {t.hero.roleDeveloper}
                  </p>
                </div>

                {/* bio */}
                <p
                  data-stagger-item
                  className="mt-4 max-w-lg text-sm leading-relaxed sm:text-[15px]"
                  style={{
                    color: "var(--text-secondary)",
                    textWrap: "balance",
                  }}
                >
                  {t.hero.bio}
                </p>

                {/* CTA 组 */}
                <div
                  data-stagger-item
                  className="mt-5 flex flex-wrap items-center gap-3"
                >
                  <MagneticButton strength={0.3} tilt={0.05}>
                    <button
                      type="button"
                      onClick={() => navigate("projects")}
                      className="group inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold transition-transform duration-300 active:scale-[0.96]"
                      style={{
                        background: "var(--accent)",
                        color: "#03040a",
                        borderRadius: 2,
                      }}
                    >
                      {t.hero.ctaProjects}
                      <ArrowUpRight
                        size={14}
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </button>
                  </MagneticButton>

                  <MagneticButton strength={0.25} tilt={0.04}>
                    <button
                      type="button"
                      onClick={() => navigate("blog")}
                      className="inline-flex h-11 items-center gap-2 border px-5 text-sm font-medium transition-[transform,border-color,background] duration-300 active:scale-[0.96]"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "var(--surface)",
                        color: "var(--text-primary)",
                        borderRadius: 2,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--accent-border, rgba(90,242,255,0.42))";
                        e.currentTarget.style.background =
                          "var(--surface-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--border-subtle)";
                        e.currentTarget.style.background = "var(--surface)";
                      }}
                    >
                      {t.hero.ctaBlog}
                    </button>
                  </MagneticButton>

                  <MagneticButton strength={0.35} tilt={0.07} enableTilt>
                    <a
                      href="mailto:i@trfx.top"
                      aria-label={t.a11y.emailMe}
                      className="inline-flex h-11 w-11 items-center justify-center border transition-[transform,border-color,background] duration-300 active:scale-[0.96]"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "var(--surface)",
                        color: "var(--text-primary)",
                        borderRadius: 2,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--accent-border, rgba(90,242,255,0.42))";
                        e.currentTarget.style.color = "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--border-subtle)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                    >
                      <Mail size={16} />
                    </a>
                  </MagneticButton>
                </div>
              </StaggerGroup>

              {/* ===== 右栏：位置/状态 + 站点链接 ===== */}
              <StaggerGroup
                className="flex min-w-0 flex-col gap-4 lg:col-span-5"
                startDelay={startDelay + 450}
                staggerMs={100}
                y={24}
                duration={900}
              >
                <div data-stagger-item className="min-w-0">
                  <HeroStatus
                    locationValue={t.about.factLocationValue}
                    online={t.common.online}
                  />
                </div>

                <div data-stagger-item className="min-w-0">
                  <HeroLinks />
                </div>
              </StaggerGroup>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
