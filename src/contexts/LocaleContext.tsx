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
import {
  HTML_LANG,
  INTL_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";

/**
 * 语言上下文。
 *
 * 与 ThemeContext 的关键差异：initialLocale 由 layout.tsx（Server Component）
 * 从 cookie / Accept-Language 解析后注入，**不在客户端 effect 里再校正**。
 * 因为文案参与 SSR 渲染，若像主题那样"先默认值、mount 后改"，
 * 会造成整页文案的 hydration mismatch + 一帧语言闪烁。
 *
 * 用户显式切换时写 cookie（一年），下次 SSR 即命中该 cookie；
 * 未写 cookie 前一直跟随 Accept-Language（即系统/浏览器语言）。
 */
interface LocaleContextValue {
  locale: Locale;
  /** 当前语言字典 */
  t: Dictionary;
  /** Intl API 用的 BCP 47 标签（如 "zh-CN"） */
  intlLocale: string;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** 写入语言 cookie。SameSite=Lax 足够（无跨站 POST 场景），非 HttpOnly 以便客户端切换。 */
function persistLocale(locale: Locale) {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
  } catch {
    /* cookie 可能被禁用，忽略：状态仍在内存中生效，仅不跨会话保留 */
  }
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // 同步 <html lang>：SSR 已经给出正确值，此处只负责客户端切换后的更新
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    setLocaleState(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === "en" ? "zh" : "en";
      persistLocale(next);
      return next;
    });
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: getDictionary(locale),
      intlLocale: INTL_LOCALE[locale],
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}

/** 只取字典的便捷 hook：`const t = useT()` → `t.about.title` */
export function useT(): Dictionary {
  return useLocale().t;
}
