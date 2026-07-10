"use client";

import { ArrowUpRight, Mail } from "lucide-react";
import Image from "next/image";
import { usePage } from "@/contexts/PageContext";
import { AnimatedBackground } from "@/components/animations/AnimatedBackground";
import { AnimeText } from "@/components/animations/AnimeText";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { MagneticButton } from "@/components/animations/MagneticButton";

const PAGE_IDS = ["home", "about", "tech", "stats", "projects", "blog"] as const;

export function HeroSection() {
  const { navigate } = usePage();

  return (
    <section
      id="home"
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden px-6"
    >
      {/* 动效背景：呼吸网格 + 漂浮光球 + 鼠标视差 */}
      <AnimatedBackground />

      <div className="relative flex flex-col items-center text-center max-w-3xl">
        {/* Avatar */}
        <div
          className="relative mb-5 fade-up-soft"
          style={{ animationDelay: "0.15s" }}
        >
          <div
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 transition-all duration-500 group"
            style={{
              borderColor: "var(--accent)",
              boxShadow: "0 0 20px var(--accent-glow)",
            }}
          >
            <Image
              src="https://avatars.githubusercontent.com/u/99103591?v=4"
              alt="Teror Fox"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#28c840] border-2 flex items-center justify-center"
            style={{ borderColor: "var(--surface)" }}
          />
        </div>

        {/* Eyebrow：CSS 淡入，先于名字出现 */}
        <p
          className="mb-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border theme-transition fade-up-soft"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface)",
            color: "var(--text-secondary)",
            backdropFilter: "blur(8px)",
            animationDelay: "0.25s",
          }}
        >
          <span className="font-mono">Hello World</span>
          <span
            className="w-px h-3"
            style={{ background: "var(--border-strong)" }}
          />
          <span>i@trfox.top</span>
        </p>

        {/* Name：逐字揭示（char-by-char + 模糊 + 旋转），核心视觉时刻。
            用纯色而非 background-clip:text —— 后者与 anime.js 所需的 inline-block
            字符 span 配合不可靠（可能整字不可见），纯色 + 微辉光更稳更酷。 */}
        <AnimeText
          as="h1"
          text="Teror Fox"
          className="text-[14vw] sm:text-[10vw] md:text-[7rem] lg:text-[8rem] leading-[0.95] font-semibold tracking-tight"
          staggerMs={45}
          delay={300}
          from="center"
          duration={1100}
          y={60}
          rotate={-10}
          blur={14}
          style={{
            color: "var(--text-primary)",
            textShadow: "0 0 60px rgba(41,151,255,0.18)",
          }}
        />

        {/* Tagline / Role / CTAs / Dots：名字揭示后交错入场 */}
        <StaggerGroup
          className="flex flex-col items-center"
          startDelay={950}
          staggerMs={110}
          y={30}
          duration={800}
        >
          {/* Tagline */}
          <p
            className="mt-4 text-xl sm:text-2xl md:text-3xl font-medium"
            data-stagger-item
            style={{ color: "var(--text-primary)" }}
          >
            Fighting for the AI age
          </p>

          {/* Role */}
          <p
            className="mt-2 text-sm sm:text-base font-mono"
            data-stagger-item
            style={{ color: "var(--text-tertiary)" }}
          >
            Student &amp;&amp;{" "}
            <span style={{ color: "var(--accent)" }}>&lt;Developer /&gt;</span>
          </p>

          {/* CTAs：磁吸 + 3D 倾斜 */}
          <div
            className="mt-8 flex flex-col sm:flex-row items-center gap-3"
            data-stagger-item
          >
            <MagneticButton strength={0.4} tilt={0.08}>
              <button
                type="button"
                onClick={() => navigate("projects")}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium transition-all duration-300"
                style={{
                  background: "var(--accent)",
                  boxShadow: "0 0 24px var(--accent-glow)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 32px var(--accent-glow)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 24px var(--accent-glow)";
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-300 theme-transition"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--surface-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--surface)";
                }}
              >
                Read Blog
              </button>
            </MagneticButton>

            <MagneticButton strength={0.45} tilt={0.1} enableTilt>
              <a
                href="mailto:i@trfox.top"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 theme-transition"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--surface-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--surface)";
                }}
                aria-label="Email Teror Fox"
              >
                <Mail size={16} />
              </a>
            </MagneticButton>
          </div>

          {/* Page indicator dots */}
          <div
            className="mt-10 flex items-center gap-1.5"
            data-stagger-item
            aria-hidden
          >
            {PAGE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: id === "home" ? "1.5rem" : "0.375rem",
                  background:
                    id === "home" ? "var(--accent)" : "var(--surface-strong)",
                }}
                onMouseEnter={(e) => {
                  if (id !== "home") {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--border-strong)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (id !== "home") {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--surface-strong)";
                  }
                }}
                aria-label={`Go to ${id}`}
              />
            ))}
          </div>
        </StaggerGroup>
      </div>
    </section>
  );
}
