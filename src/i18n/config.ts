/**
 * i18n 基础配置（服务端 / 客户端共用，禁止在此 import next/headers）。
 *
 * 语言解析优先级：cookie（用户显式选择，锁定）> Accept-Language（跟随系统）> DEFAULT_LOCALE。
 * 用 cookie 而非 localStorage 是因为 locale 必须在 SSR 时可知：
 * 页面文案参与 SSR 渲染，若首屏用默认语言、hydration 后才切换，会触发文案层面的
 * hydration mismatch（ThemeContext 只改属性不改文案，所以它可以用 localStorage）。
 */

export const LOCALES = ["en", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

/** Accept-Language 也无法判定时的兜底语言 */
export const DEFAULT_LOCALE: Locale = "en";

/** 持久化 cookie 名（与 localStorage["teror-fox-theme"] 命名风格保持一致） */
export const LOCALE_COOKIE = "teror-fox-locale";

/** cookie 有效期：一年 */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** <html lang> 取值（BCP 47） */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  zh: "zh-CN",
};

/** Intl.DateTimeFormat / toLocaleString 用的 BCP 47 标签 */
export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  zh: "zh-CN",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * 解析 Accept-Language 头，取权重最高且被支持的语言。
 * 形如 `zh-CN,zh;q=0.9,en-US;q=0.8` —— 按 q 降序遍历，命中 zh 或 en 前缀即返回。
 * 无法判定时返回 DEFAULT_LOCALE。
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("en")) return "en";
  }

  return DEFAULT_LOCALE;
}

/** cookie 优先、否则跟随 Accept-Language。服务端与客户端解析逻辑共用同一实现。 */
export function resolveLocale(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  return localeFromAcceptLanguage(acceptLanguage);
}
