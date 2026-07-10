"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "teror-fox-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * 解析系统偏好 / localStorage 缓存，决定初始主题。
 * SSR 安全：返回 null 表示"尚未确定"，由 provider 异步落定。
 */
function resolveInitialTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* localStorage 可能被禁用，忽略 */
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR/首屏先用 dark，避免 hydration flash；客户端 mount 后再校正
  const [theme, setThemeState] = useState<Theme>("dark");

  // 挂载时根据系统 / 缓存恢复真实主题
  useEffect(() => {
    const resolved = resolveInitialTheme();
    if (resolved && resolved !== theme) {
      setThemeState(resolved);
    }
    // 仅在 mount 时跑一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 主题变化时同步到 <html> data-theme 与 localStorage
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    // 保留 .light-theme 类名以兼容旧 CSS 引用
    root.classList.toggle("light-theme", theme === "light");
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* 忽略 */
    }
  }, [theme]);

  // 监听系统主题变化（仅在用户未显式设置时跟随）
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark") return; // 用户已锁定
      } catch {
        /* ignore */
      }
      setThemeState(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
