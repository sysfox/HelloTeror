"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X, Mail, Sun, Moon, Languages } from "lucide-react";
import { animate, EASE, prefersReducedMotion } from "@/lib/anime";
import { cn } from "@/lib/utils";
import { usePage, PAGE_ORDER, type PageId } from "@/contexts/PageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocale } from "@/contexts/LocaleContext";
import Image from "next/image";
import { SOCIAL_LINKS } from "@/config/site";

/** 导航显示顺序直接派生自 PAGE_ORDER（拷贝一份，避免意外改动全局顺序）。文案取 t.nav[id]。 */
const NAV_LINKS: PageId[] = [...PAGE_ORDER];

/** HUD 序号：01–06 */
const navIndex = (i: number) => String(i + 1).padStart(2, "0");

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

function BiliBiliIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.573 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.764-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.387-.947.258-.257.574-.386.946-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" />
    </svg>
  );
}

/** 按 SOCIAL_LINKS id 渲染对应社交图标 */
function SocialIcon({ id }: { id: string }) {
  if (id === "github") return <GithubIcon className="w-4 h-4" />;
  if (id === "bilibili") return <BiliBiliIcon className="w-4 h-4" />;
  if (id === "email") return <Mail size={14} />;
  return null;
}

/**
 * 顶部 HUD 导航：固定工业条 + 底部能量细线。
 * 逻辑保持原样：PAGE_ORDER 派生的 NAV_LINKS、t.nav / t.wordmark、主题/语言切换、
 * 移动端抽屉、社交链接、anime.js 滑动指示器（locale 变化必须重测距，
 * 因为中文标签更窄，否则指示器会错位）。
 */
export function SiteNav() {
  const { current, navigate } = usePage();
  const { theme, toggleTheme } = useTheme();
  const { t, locale, toggleLocale } = useLocale();
  const [open, setOpen] = useState(false);

  const ulRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 滑动指示器：current 变化时 anime.js 把扫描线滑到激活 tab 中心；
  // 首次定位 / reduced-motion 直接 snap。translateX(-50%) 让扫描线居中于 left 锚点。
  // locale 也是依赖：切换语言后 tab 宽度变化，需重新测距，否则扫描线错位。
  useEffect(() => {
    const ul = ulRef.current;
    const ind = indicatorRef.current;
    if (!ul || !ind) return;
    const activeIdx = NAV_LINKS.indexOf(current);
    const btn = tabRefs.current[activeIdx];
    if (!btn) return;
    const ulRect = ul.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const targetLeft = `${btnRect.left - ulRect.left + btnRect.width / 2}px`;

    ind.style.opacity = "1";

    if (prefersReducedMotion()) {
      ind.style.left = targetLeft;
      return;
    }

    const fromLeft = ind.style.left; // 首次为 "" → from=to，无位移仅定位
    if (!fromLeft) {
      ind.style.left = targetLeft;
      return;
    }

    const anim = animate(ind, {
      left: [fromLeft, targetLeft],
      duration: 420,
      ease: EASE.expo,
    });
    return () => {
      anim.pause();
    };
  }, [current, locale]);

  // resize 重测距 snap（避免 tab 宽度变化后指示器错位）
  useEffect(() => {
    const reposition = () => {
      const ul = ulRef.current;
      const ind = indicatorRef.current;
      if (!ul || !ind) return;
      const activeIdx = NAV_LINKS.indexOf(current);
      const btn = tabRefs.current[activeIdx];
      if (!btn) return;
      const ulRect = ul.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      ind.style.left = `${btnRect.left - ulRect.left + btnRect.width / 2}px`;
    };
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [current]);

  // 抽屉打开时支持 Esc 关闭（键盘可达性）
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const socialLink = (link: (typeof SOCIAL_LINKS)[number], compact: boolean) => {
    const isExternal = !link.href.startsWith("mailto:");
    return (
      <a
        key={link.id}
        href={link.href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={cn("hud-icon-btn", compact ? "w-[30px] px-0" : "gap-2 px-2.5")}
        aria-label={t.links[link.id]}
        title={t.links[link.id]}
      >
        <SocialIcon id={link.id} />
        {!compact && <span className="text-[10px]">{t.links[link.id]}</span>}
      </a>
    );
  };

  return (
    <header className="site-nav fixed top-0 left-0 right-0 z-50 theme-transition">
      <nav className="content-max-width flex items-center justify-between h-12 md:h-14 gap-3">
        {/* 品牌：切角头像 + 站名 + 当前扇区词标（t.wordmark 随页面变化） */}
        <button
          type="button"
          onClick={() => navigate("home")}
          className="group flex items-center gap-2.5 theme-transition"
          style={{ color: "var(--text-primary)" }}
          aria-label={t.a11y.homeLink}
        >
          <span className="nav-mark">
            <Image
              src="https://avatars.githubusercontent.com/u/99103591?v=4"
              alt=""
              width={32}
              height={32}
              loading="lazy"
              unoptimized
            />
          </span>

          <span className="hidden sm:flex flex-col items-start gap-1 leading-none">
            <span className="text-[13px] font-semibold tracking-[0.16em]">
              TEROR FOX
            </span>
            <span className="hud-label flex items-center gap-1.5 text-[9px]">
              <span style={{ color: "var(--accent)" }}>VOID</span>
              <span aria-hidden style={{ opacity: 0.5 }}>
                {"//"}
              </span>
              <span>{t.wordmark[current]}</span>
            </span>
          </span>
        </button>

        {/* 桌面导航：mono 序号 + 标签，单一滑动扫描指示器 */}
        <ul ref={ulRef} className="relative hidden md:flex items-center gap-0.5">
          <span
            ref={indicatorRef}
            aria-hidden
            className="nav-indicator"
            style={{ left: 0, bottom: -9, opacity: 0 }}
          />
          {NAV_LINKS.map((id, i) => {
            const active = current === id;
            return (
              <li key={id}>
                <button
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => navigate(id)}
                  className="nav-tab"
                  aria-current={active ? "page" : undefined}
                >
                  <span className="nav-tab__index" aria-hidden>
                    {navIndex(i)}
                  </span>
                  {t.nav[id]}
                </button>
              </li>
            );
          })}
        </ul>

        {/* 桌面操作区：主题 / 语言 / 社交 */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle hud-icon-btn w-[30px] px-0"
            aria-label={theme === "dark" ? t.a11y.toLight : t.a11y.toDark}
            title={theme === "dark" ? t.a11y.themeLight : t.a11y.themeDark}
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          {/* 语言切换：label 用目标语言自身书写（中文 / EN），无需图标即可辨识 */}
          <button
            type="button"
            onClick={toggleLocale}
            className="hud-icon-btn"
            aria-label={t.language.aria}
            title={t.language.aria}
          >
            {t.language.label}
          </button>
          {/* 社交图标只在 lg 显示：md 宽度下导航 + 品牌 + 操作区会挤爆 */}
          <div className="hidden lg:flex items-center gap-1.5">
            <span
              aria-hidden
              className="mx-1 h-4 w-px"
              style={{ background: "var(--border-subtle)" }}
            />
            {SOCIAL_LINKS.map((link) => socialLink(link, true))}
          </div>
        </div>

        {/* 移动端开关 */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="hud-icon-btn md:hidden px-0"
          style={{ height: 36, width: 36 }}
          aria-label={open ? t.a11y.closeMenu : t.a11y.openMenu}
          aria-expanded={open}
          aria-controls="site-nav-drawer"
        >
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </nav>

      {/* 底部能量细线：持续缓慢流动 */}
      <span aria-hidden className="nav-rule" />

      {/* 移动端抽屉：3D 翻落 + 逐项 stagger；关闭时 inert 防止键盘聚焦到隐藏按钮 */}
      <div
        id="site-nav-drawer"
        className={cn("nav-drawer md:hidden border-t", open && "is-open")}
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--header-bg)",
          backdropFilter: "blur(14px)",
        }}
        inert={!open}
      >
        <ul className="content-max-width flex flex-col py-4 gap-1">
          {NAV_LINKS.map((id, i) => {
            const active = current === id;
            return (
              <li key={id} className="nav-drawer__item">
                <button
                  type="button"
                  onClick={() => {
                    navigate(id);
                    setOpen(false);
                  }}
                  className="nav-tab w-full justify-start gap-3"
                  aria-current={active ? "page" : undefined}
                >
                  <span className="nav-tab__index" aria-hidden>
                    {navIndex(i)}
                  </span>
                  <span>{t.nav[id]}</span>
                  {active && (
                    <span
                      aria-hidden
                      className="ml-auto h-1.5 w-1.5"
                      style={{
                        background: "var(--accent)",
                        boxShadow: "0 0 10px var(--accent-glow)",
                      }}
                    />
                  )}
                </button>
              </li>
            );
          })}
          <li
            className="nav-drawer__item mt-3 flex flex-wrap items-center gap-1.5 pt-3"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <button
              type="button"
              onClick={toggleTheme}
              className="hud-icon-btn gap-2 px-2.5"
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
              <span className="text-[10px]">
                {theme === "dark" ? t.a11y.themeLight : t.a11y.themeDark}
              </span>
            </button>
            <button
              type="button"
              onClick={toggleLocale}
              className="hud-icon-btn gap-2 px-2.5"
              aria-label={t.language.aria}
            >
              <Languages size={13} />
              <span className="text-[10px]">{t.language.label}</span>
            </button>
            {SOCIAL_LINKS.map((link) => socialLink(link, false))}
          </li>
        </ul>
      </div>
    </header>
  );
}
