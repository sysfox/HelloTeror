"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import Image from "next/image";
import { usePage } from "@/contexts/PageContext";
import { useT } from "@/contexts/LocaleContext";
import { prefersReducedMotion } from "@/lib/anime";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { ScrambleText } from "@/components/animations/ScrambleText";
import { TerminalBlock } from "@/components/animations/TerminalBlock";
import { HeroField } from "@/components/sections/hero/HeroField";
import { HeroRail } from "@/components/sections/hero/HeroRail";
import { HeroStatus } from "@/components/sections/hero/HeroStatus";
import { HeroLinks } from "@/components/sections/hero/HeroLinks";

const AVATAR = "https://avatars.githubusercontent.com/u/99103591?v=4";

/** KineticLoader 完成时写入的 sessionStorage key，用于时序同步 */
const LOADER_KEY = "teror-fox-loader-played";

/** 巨型姓名：字号/字距集中在 wrapper 上，色差回响层与 ScrambleText 共同继承 */
const NAME_STYLE: CSSProperties = {
  fontSize: "clamp(2.55rem, 8.2vw, 7rem)",
  lineHeight: 0.92,
  fontWeight: 700,
  letterSpacing: "-0.045em",
  whiteSpace: "nowrap",
};

/**
 * Hero 首屏（非对称 HUD 构图）：
 *  - 背景：HeroField 坐标标尺装置（同心环 / 刻度 / 扫描带），随指针视差
 *  - 左栏：身份元数据条 → 巨型 ScrambleText 姓名（青/洋红色差回响）→
 *          标语 / 身份行 → bio → CTA 组
 *  - 右栏：实时状态读数（位置 / 可用性 / 时区）+ 终端启动会话
 *  - 底部：SITE_LINKS 站点网络条
 *  - 左侧：HeroRail 竖向滚动遥测轨道（xl 以上）
 *
 * 时序沿用既有 loader 交接：首次访问 startDelay=1900ms（等 KineticLoader 退场），
 * 再次进入 home 时 200ms。ready 门控确保子组件 mount 时拿到最终 delay。
 *
 * 指针视差在本组件统一驱动（写入 section 的 --hx/--hy），HeroField 只消费；
 * rAF 合并、离开归零、卸载清理。触屏与 reduced-motion 直接跳过。
 */
export function HeroSection() {
  const { navigate } = usePage();
  const t = useT();
  const [ready, setReady] = useState(false);
  const [startDelay, setStartDelay] = useState(1900);
  const sectionRef = useRef<HTMLElement>(null);

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

  // 指针视差：仅精细指针；rAF 合并高频 pointermove，--hx/--hy 归一化到 -1..1
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = sectionRef.current;
    if (!el) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--hx", tx.toFixed(3));
      el.style.setProperty("--hy", ty.toFixed(3));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      schedule();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      schedule();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      el.style.removeProperty("--hx");
      el.style.removeProperty("--hy");
    };
  }, []);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative isolate w-full h-full overflow-hidden px-5 sm:px-6"
    >
      <HeroField />
      <HeroRail />

      <div className="no-scrollbar relative z-10 mx-auto h-full w-full max-w-6xl overflow-y-auto">
        <div className="flex min-h-full flex-col justify-center py-8 sm:py-10">
          {ready && (
            <>
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
                {/* ===== 左栏：身份主体 ===== */}
                <StaggerGroup
                  className="flex min-w-0 flex-col items-start lg:col-span-7"
                  startDelay={startDelay}
                  staggerMs={90}
                  y={32}
                  duration={900}
                >
                  {/* 元数据条：头像 + 署名 + 年月 + 在线 + 时区 */}
                  <div
                    data-stagger-item
                    className="inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 border px-3 py-2"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--surface)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <span className="relative inline-block shrink-0">
                      <Image
                        src={AVATAR}
                        alt=""
                        width={24}
                        height={24}
                        unoptimized
                        className="h-6 w-6 object-cover"
                        style={{ outline: "1px solid var(--border-strong)" }}
                      />
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full"
                        style={{
                          background: "var(--accent)",
                          boxShadow:
                            "0 0 8px var(--accent-glow, rgba(90,242,255,0.35))",
                        }}
                      />
                    </span>
                    <span
                      className="text-[11px] font-mono uppercase tracking-[0.18em]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Teror Fox
                    </span>
                    <span
                      className="h-3 w-px"
                      style={{ background: "var(--border-strong)" }}
                    />
                    <span
                      className="text-[10px] font-mono tabular-nums"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {stamp}
                    </span>
                    <span
                      className="h-3 w-px"
                      style={{ background: "var(--border-strong)" }}
                    />
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.16em]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: "var(--accent)" }}
                      />
                      {t.common.online}
                    </span>
                    <span
                      className="hidden h-3 w-px sm:block"
                      style={{ background: "var(--border-strong)" }}
                    />
                    <span
                      className="hidden text-[10px] font-mono tabular-nums sm:inline"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      UTC+8
                    </span>
                  </div>

                  {/* 巨型姓名：HUD 标尺行 + 色差回响 + 解码入场 */}
                  <div data-stagger-item className="mt-6 w-full min-w-0">
                    <div aria-hidden className="mb-2 flex items-center gap-2.5">
                      <span
                        className="text-[9px] font-mono tabular-nums"
                        style={{ color: "var(--accent)" }}
                      >
                        {"// 00"}
                      </span>
                      <span
                        className="h-px w-10"
                        style={{
                          background:
                            "var(--accent-border, rgba(90,242,255,0.42))",
                        }}
                      />
                      <span
                        className="text-[9px] font-mono uppercase tracking-[0.28em]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        IDENTITY.SIG
                      </span>
                      <span
                        className="h-px flex-1"
                        style={{
                          background:
                            "linear-gradient(90deg, var(--border-subtle), transparent)",
                        }}
                      />
                      <span
                        className="text-[9px] font-mono tabular-nums"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        TF-001
                      </span>
                    </div>

                    <div className="relative w-full" style={NAME_STYLE}>
                      {/* 色差回响层：装饰性重影，不参与朗读 */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 block select-none"
                        style={{
                          color: "var(--accent-2, #ff3ec9)",
                          opacity: 0.22,
                          transform: "translate3d(5px, 1px, 0)",
                        }}
                      >
                        Teror Fox
                      </span>
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 block select-none"
                        style={{
                          color: "var(--accent)",
                          opacity: 0.2,
                          transform: "translate3d(-4px, -1px, 0)",
                        }}
                      >
                        Teror Fox
                      </span>
                      <ScrambleText
                        as="h1"
                        text="Teror Fox"
                        delay={startDelay + 150}
                        duration={1000}
                        staggerMs={50}
                        from="first"
                        className="relative block"
                        style={{
                          color: "var(--text-primary)",
                          textShadow:
                            "0 0 80px var(--accent-glow, rgba(90,242,255,0.35))",
                        }}
                      />
                    </div>

                    <div aria-hidden className="mt-3 flex items-center gap-3">
                      <span
                        className="h-1.5 flex-1"
                        style={{
                          background:
                            "repeating-linear-gradient(90deg, var(--border-strong) 0 1px, transparent 1px 12px)",
                          opacity: 0.55,
                        }}
                      />
                      <span
                        className="shrink-0 font-mono text-[8px] tracking-[0.3em]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        RX/TX
                      </span>
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
                      className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] sm:text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t.hero.roleStudent}{" "}
                      <span style={{ color: "var(--accent)" }}>{"&&"}</span>{" "}
                      <span style={{ color: "var(--accent)" }}>
                        {t.hero.roleDeveloper}
                      </span>
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
                    <MagneticButton strength={0.4} tilt={0.08}>
                      <button
                        type="button"
                        onClick={() => navigate("projects")}
                        className="group inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold transition-transform duration-300 active:scale-[0.96]"
                        style={{
                          background: "var(--accent)",
                          color: "#03040a",
                          borderRadius: 2,
                          boxShadow:
                            "0 0 28px var(--accent-glow, rgba(90,242,255,0.35))",
                        }}
                      >
                        {t.hero.ctaProjects}
                        <ArrowUpRight
                          size={14}
                          className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </button>
                    </MagneticButton>

                    <MagneticButton strength={0.35} tilt={0.06}>
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

                    <MagneticButton strength={0.45} tilt={0.1} enableTilt>
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

                {/* ===== 右栏：状态读数 + 终端 ===== */}
                <StaggerGroup
                  className="flex min-w-0 flex-col gap-4 lg:col-span-5"
                  startDelay={startDelay + 550}
                  staggerMs={120}
                  y={28}
                  duration={900}
                >
                  <div data-stagger-item className="min-w-0">
                    <HeroStatus
                      locationLabel={t.about.factLocation}
                      locationValue={t.about.factLocationValue}
                      online={t.common.online}
                    />
                  </div>

                  <div data-stagger-item className="min-w-0">
                    <div aria-hidden className="mb-2 flex items-center gap-2">
                      <span
                        className="inline-block h-1.5 w-1.5"
                        style={{ background: "var(--accent)" }}
                      />
                      <span
                        className="text-[9px] font-mono uppercase tracking-[0.3em]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        BOOT.SEQ
                      </span>
                      <span
                        className="h-px flex-1"
                        style={{ background: "var(--border-subtle)" }}
                      />
                      <span
                        className="text-[9px] font-mono tabular-nums"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        SESSION.01
                      </span>
                    </div>
                    <TerminalBlock startDelay={startDelay + 1400} />
                  </div>
                </StaggerGroup>
              </div>

              {/* ===== 底部：站点网络条 ===== */}
              <StaggerGroup
                className="mt-6"
                startDelay={startDelay + 950}
                staggerMs={0}
                y={16}
                duration={800}
              >
                <div data-stagger-item className="min-w-0">
                  <HeroLinks />
                </div>
              </StaggerGroup>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
