"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Mail,
  PenLine,
  Archive,
  HardDrive,
  Camera,
  Activity,
} from "lucide-react";
import Image from "next/image";
import { usePage } from "@/contexts/PageContext";
import { AuroraBackground } from "@/components/animations/AuroraBackground";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { ScrambleText } from "@/components/animations/ScrambleText";
import { TerminalBlock } from "@/components/animations/TerminalBlock";
import { SITE_LINKS } from "@/config/site";

const AVATAR = "https://avatars.githubusercontent.com/u/99103591?v=4";
const SKILLS = ["TypeScript", "Next.js", "anime.js", "Python", "Rust", "React"];

/** KineticLoader 完成时写入的 sessionStorage key，用于时序同步 */
const LOADER_KEY = "teror-fox-loader-played";

/** 站点链接图标映射（SITE_LINKS id → lucide 图标） */
function SiteLinkIcon({ id }: { id: string }) {
  if (id === "blog") return <PenLine size={13} />;
  if (id === "legacy") return <Archive size={13} />;
  if (id === "pan") return <HardDrive size={13} />;
  if (id === "plog") return <Camera size={13} />;
  if (id === "status") return <Activity size={13} />;
  return null;
}

/**
 * Hero 首屏（左右双栏 × 极光背景 × 终端会话）：
 *  - 背景：AuroraBackground 多色光晕极光（替换旧网格光球 + Canvas 粒子）
 *  - 左栏：元数据条 → 巨型 "Teror Fox"（ScrambleText）→ 副标题 → bio → CTA → 站点链接行 → 技能标签
 *  - 右栏：TerminalBlock 多行会话终端（语法高亮 + 逐行打字机）
 *  - 桌面 lg:grid-cols-2 双栏，移动端单列居中
 *
 * 时序：检测 sessionStorage[LOADER_KEY]（KineticLoader 完成时写入）。
 *  - 首次加载（无 key）：startDelay=1900ms，等 KineticLoader(~1.8s) 卸载后入场
 *  - 切回 home（有 key，Loader 不重播）：startDelay=200ms，立即入场
 *  ready 门控：startDelay 确定后才渲染内容，保证子组件 mount 时拿到正确 delay。
 */
export function HeroSection() {
  const { navigate } = usePage();
  const [ready, setReady] = useState(false);
  const [startDelay, setStartDelay] = useState(1900);

  useEffect(() => {
    const played = sessionStorage.getItem(LOADER_KEY);
    // mount 时根据 loader 是否播放过决定入场延迟（首次访问长延迟，已访问过短延迟）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStartDelay(played ? 200 : 1900);
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      id="home"
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden px-6"
    >
      {/* 背景层：极光多色光晕 */}
      <AuroraBackground />

      {ready && (
        <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-12 w-full max-w-6xl items-center">
          {/* ===== 左栏：信息 + CTA + 站点链接 + 技能 ===== */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* 元数据条：avatar 角标 + 署名 + 版本号 + 在线状态 + 时区 */}
            <div
              className="fade-up-soft inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border theme-transition mb-6"
              style={{
                animationDelay: `${startDelay}ms`,
                borderColor: "var(--border-subtle)",
                background: "var(--surface)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="relative inline-block">
                <Image
                  src={AVATAR}
                  alt="Teror Fox"
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full object-cover"
                  style={{ outline: "1px solid var(--border-subtle)" }}
                />
                <span
                  className="status-pulse absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#28c840]"
                  style={{ border: "1.5px solid var(--surface)" }}
                />
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Teror Fox
              </span>
              <span
                className="w-px h-3"
                style={{ background: "var(--border-strong)" }}
              />
              <span
                className="text-[11px] font-mono tabular-nums"
                style={{ color: "var(--text-tertiary)" }}
              >
                v2026.07
              </span>
              <span
                className="w-px h-3"
                style={{ background: "var(--border-strong)" }}
              />
              <span
                className="inline-flex items-center gap-1 text-[11px] font-mono"
                style={{ color: "var(--text-tertiary)" }}
              >
                <span className="status-pulse w-1.5 h-1.5 rounded-full bg-[#28c840]" />
                online
              </span>
              <span
                className="w-px h-3"
                style={{ background: "var(--border-strong)" }}
              />
              <span
                className="text-[11px] font-mono tabular-nums"
                style={{ color: "var(--text-tertiary)" }}
              >
                UTC+8
              </span>
            </div>

            {/* 主标题：巨型 "Teror Fox" ScrambleText 洗牌入场（双栏缩小字号） */}
            <ScrambleText
              as="h1"
              text="Teror Fox"
              delay={startDelay + 150}
              duration={1000}
              staggerMs={50}
              from="first"
              className="text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] font-semibold tracking-tighter"
              style={{
                color: "var(--text-primary)",
                textShadow: "0 0 60px rgba(41,151,255,0.18)",
                textWrap: "balance",
              }}
            />

            {/* 副标题 + bio + CTA + 站点链接 + 技能：StaggerGroup 交错入场 */}
            <StaggerGroup
              className="flex flex-col items-center lg:items-start w-full mt-4"
              startDelay={startDelay + 1100}
              staggerMs={110}
              y={28}
              duration={800}
            >
              <p
                className="text-xl sm:text-2xl font-medium"
                data-stagger-item
                style={{ color: "var(--text-primary)", textWrap: "balance" }}
              >
                Fighting for the AI age
              </p>
              <p
                className="mt-2 text-sm sm:text-base font-mono"
                data-stagger-item
                style={{ color: "var(--text-tertiary)" }}
              >
                Student &amp;&amp;{" "}
                <span style={{ color: "var(--accent)" }}>&lt;Developer /&gt;</span>
              </p>

              {/* bio 段落：平衡双栏视觉 */}
              <p
                className="mt-4 max-w-md text-sm leading-relaxed"
                data-stagger-item
                style={{ color: "var(--text-secondary)", textWrap: "balance" }}
              >
                Crafting expressive, performant interfaces for the AI age.
                Student by day, developer by night — exploring systems, design,
                and everything between.
              </p>

              {/* CTAs：磁吸 + 描边矩形 + scale on press */}
              <div
                className="mt-5 flex flex-col sm:flex-row items-center lg:items-start gap-3"
                data-stagger-item
              >
                <MagneticButton strength={0.4} tilt={0.08}>
                  <button
                    type="button"
                    onClick={() => navigate("projects")}
                    className="group inline-flex items-center gap-2 px-5 h-11 rounded-lg text-white text-sm font-medium transition-transform duration-300 active:scale-[0.96]"
                    style={{
                      background: "var(--accent)",
                      boxShadow: "0 0 24px var(--accent-glow)",
                    }}
                  >
                    View Projects
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
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-lg border text-sm font-medium transition-transform duration-300 active:scale-[0.96] theme-transition"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--surface)",
                      color: "var(--text-primary)",
                    }}
                  >
                    Read Blog
                  </button>
                </MagneticButton>

                <MagneticButton strength={0.45} tilt={0.1} enableTilt>
                  <a
                    href="mailto:i@trfx.top"
                    className="inline-flex items-center justify-center w-11 h-11 rounded-lg border transition-transform duration-300 active:scale-[0.96] theme-transition"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--surface)",
                      color: "var(--text-primary)",
                    }}
                    aria-label="Email Teror Fox"
                  >
                    <Mail size={16} />
                  </a>
                </MagneticButton>
              </div>

              {/* 站点链接行：带图标的 pill chips（比 Footer 文字链接更明显） */}
              <div
                className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-2"
                data-stagger-item
              >
                {SITE_LINKS.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full border text-xs font-mono theme-transition transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] active:scale-[0.96]"
                    style={{
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-tertiary)",
                      background: "var(--surface)",
                    }}
                  >
                    <SiteLinkIcon id={link.id} />
                    {link.label}
                  </a>
                ))}
              </div>

            
            </StaggerGroup>
          </div>

          {/* ===== 右栏：终端会话 ===== */}
          <div
            className="fade-up-soft w-full"
            style={{ animationDelay: `${startDelay + 800}ms` }}
          >
            <TerminalBlock startDelay={startDelay + 1400} />
          </div>
        </div>
      )}
    </section>
  );
}
