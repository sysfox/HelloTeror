"use client";

import { useState } from "react";
import { Menu, X, Mail, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePage, type PageId } from "@/contexts/PageContext";
import { useTheme } from "@/contexts/ThemeContext";
import Image from "next/image";

const NAV_LINKS: { id: PageId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "tech", label: "Tech" },
  { id: "stats", label: "Stats" },
  { id: "projects", label: "Projects" },
  { id: "blog", label: "Blog" },
];

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

export function SiteNav() {
  const { current, navigate } = usePage();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-nav fixed top-0 left-0 right-0 z-50 theme-transition">
      <nav className="content-max-width flex items-center justify-between h-12 md:h-14">
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate("home")}
          className="flex items-center gap-2 font-medium tracking-tight group theme-transition"
          style={{ color: "var(--text-primary)" }}
          aria-label="Teror Fox home"
        >
          <Image
            src="https://avatars.githubusercontent.com/u/99103591?v=4"
            alt="Teror Fox"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"            
          />

          <span className="hidden sm:inline text-sm">Teror Fox</span>
        </button>

        {/* Desktop tabs */}
        <ul className="hidden md:flex items-center gap-1 text-sm">
          {NAV_LINKS.map((link) => {
            const active = current === link.id;
            return (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => navigate(link.id)}
                  className={cn(
                    "relative px-3 py-1.5 rounded-full transition-all duration-300 theme-transition",
                    active
                      ? "text-[var(--text-primary)] bg-[var(--surface-strong)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                  {active && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 w-1 h-1 rounded-full bg-[var(--accent)]"
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Desktop actions: theme + socials */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle inline-flex items-center justify-center w-9 h-9 rounded-full border theme-transition"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface)",
              color: "var(--text-tertiary)",
            }}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light" : "Dark"}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <a
            href="https://github.com/sysfox"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border theme-transition"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface)",
              color: "var(--text-tertiary)",
            }}
            aria-label="GitHub"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
          <a
            href="mailto:i@trfox.top"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border theme-transition"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface)",
              color: "var(--text-tertiary)",
            }}
            aria-label="Email"
          >
            <Mail size={15} />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-9 h-9 -mr-2 theme-transition"
          style={{ color: "var(--text-primary)" }}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-[max-height,opacity] duration-400 ease-out theme-transition",
          open
            ? "max-h-[32rem] opacity-100 border-t border-[var(--border-subtle)]"
            : "max-h-0 opacity-0"
        )}
        style={{
          background: "var(--header-bg)",
          backdropFilter: "blur(12px)",
        }}
      >
        <ul className="content-max-width flex flex-col py-3 gap-1">
          {NAV_LINKS.map((link) => {
            const active = current === link.id;
            return (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(link.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-base transition-colors theme-transition",
                    active
                      ? "bg-[var(--surface-strong)]"
                      : "hover:bg-[var(--surface-hover)]"
                  )}
                  style={{
                    color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    {active && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
                        aria-hidden
                      />
                    )}
                    {link.label}
                  </span>
                </button>
              </li>
            );
          })}
          <li className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center gap-2 px-1 flex-wrap">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm theme-transition"
              style={{ color: "var(--text-tertiary)" }}
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <a
              href="https://github.com/sysfox"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm theme-transition"
              style={{ color: "var(--text-tertiary)" }}
            >
              <GithubIcon className="w-4 h-4" />
              GitHub
            </a>
            <a
              href="mailto:i@trfox.top"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm theme-transition"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Mail size={14} />
              Email
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
