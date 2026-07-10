"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import Image from "next/image";
import { usePage } from "@/contexts/PageContext";
import { AnimatedBackground } from "@/components/animations/AnimatedBackground";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { ScrambleText } from "@/components/animations/ScrambleText";
import { HeroVisual } from "@/components/animations/HeroVisual";
import { TerminalBlock } from "@/components/animations/TerminalBlock";

const AVATAR = "https://avatars.githubusercontent.com/u/99103591?v=4";
const SKILLS = ["TypeScript", "Next.js", "anime.js", "Python", "Rust", "React"];

/** KineticLoader 完成时写入的 sessionStorage key，用于时序同步 */
const LOADER_KEY = "teror-fox-loader-played";

/**
 * Hero 首屏（animejs.com 风格重构 × kinetic-tech 动感）：
 *  - 元数据条：avatar 角标 + 版本号 + 在线状态 + 时区（mono / tabular-nums）
 *  - 巨型 "Teror Fox"：ScrambleText 字符洗牌入场（区别于 KineticLoader 的逐字）
 *  - 副标题 + 终端命令块（打字机）+ CTA（描边矩形）+ 技能标签条
 *  - Canvas 粒子流场装置（HeroVisual）叠加在 AnimatedBackground 网格之上
 *
 * 时序：检测 sessionStorage[LOADER_KEY]（KineticLoader 完成时写入）。
 *  - 首次加载（无 key）：startDelay=1900ms，等 KineticLoader(~1.8s) 卸载后入场
 *  - 切回 home（有 key，Loader 不重播）：startDelay=200ms，立即入场
 *  解决旧版「Hero 入场动画在 Loader 遮挡期间跑完、用户看不到」的问题。
 *  ready 门控：startDelay 确定后才渲染内容，保证子组件 mount 时拿到正确 delay。
 */
export function HeroSection() {
  const { navigate } = usePage();
  const [ready, setReady] = useState(false);
  const [startDelay, setStartDelay] = useState(1900);

  useEffect(() => {
    const played = sessionStorage.getItem(LOADER_KEY);
    setStartDelay(played ? 200 : 1900);
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      id="home"
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden px-6"
    >
      {/* 背景层：网格+光球（AnimatedBackground）+ Canvas 粒子流场（HeroVisual） */}
      <AnimatedBackground />
      <HeroVisual />

      {ready && (
        <div className="relative flex flex-col items-center text-center w-full max-w-3xl">
          {/* 元数据条：avatar 角标 + 署名 + 版本号 + 在线状态 + 时区 */}
          <div
            className="fade-up-soft inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border theme-transition mb-7"
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

          {/* 主标题：巨型 "Teror Fox" ScrambleText 洗牌入场 */}
          <ScrambleText
            as="h1"
            text="Teror Fox"
            delay={startDelay + 150}
            duration={1000}
            staggerMs={50}
            from="first"
            className="text-[clamp(3.5rem,13vw,10rem)] leading-[0.95] font-semibold tracking-tighter"
            style={{
              color: "var(--text-primary)",
              textShadow: "0 0 60px rgba(41,151,255,0.18)",
              textWrap: "balance",
            }}
          />

          {/* 副标题 + 终端 + CTA + 技能标签：StaggerGroup 交错入场 */}
          <StaggerGroup
            className="flex flex-col items-center w-full mt-5"
            startDelay={startDelay + 1100}
            staggerMs={110}
            y={28}
            duration={800}
          >
            <p
              className="text-xl sm:text-2xl md:text-3xl font-medium"
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

            {/* 终端命令块：打字机输出 whoami / role */}
            <div className="mt-6 w-full max-w-md" data-stagger-item>
              <TerminalBlock startDelay={startDelay + 1400} />
            </div>

            {/* CTAs：磁吸 + 描边矩形（animejs 风）+ scale on press */}
            <div
              className="mt-6 flex flex-col sm:flex-row items-center gap-3"
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
                  href="mailto:i@trfox.top"
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

            {/* 技能标签条：横向排列，hover 高亮 */}
            <div
              className="mt-7 flex flex-wrap items-center justify-center gap-2"
              data-stagger-item
            >
              {SKILLS.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-2.5 h-7 rounded-md text-[11px] font-mono border theme-transition transition-colors hover:text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:bg-[var(--surface-hover)]"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-tertiary)",
                    background: "var(--surface)",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </StaggerGroup>
        </div>
      )}
    </section>
  );
}
