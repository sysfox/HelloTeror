import type { Metadata } from "next";
import "./globals.css";
import { KineticLoader } from "@/components/animations/KineticLoader";
import { EnhancedCursor } from "@/components/animations/EnhancedCursor";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { HTML_LANG } from "@/i18n/config";
import { getRequestDictionary, getRequestLocale } from "@/i18n/server";
import { OpenPanelComponent } from '@openpanel/nextjs';

/**
 * metadata 随请求语言变化，因此用 generateMetadata 而非静态 metadata 对象。
 * 与 <html lang> 取同一个 locale 解析结果（同请求内 cookies()/headers() 会被去重）。
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getRequestDictionary();
  return {
    title: t.meta.title,
    description: t.meta.description,
    keywords: t.meta.keywords,
    authors: [{ name: "Teror Fox" }],
    openGraph: {
      title: t.meta.ogTitle,
      description: t.meta.ogDescription,
      url: "https://www.trfox.top",
      siteName: "Teror Fox",
      type: "profile",
    },
    alternates: {
      canonical: "https://www.trfox.top",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 语言在服务端确定：文案参与 SSR，若留到客户端 effect 校正会造成 hydration mismatch
  const locale = await getRequestLocale();
  // 注入到 <head> 的极简脚本：用于在 React 接管前根据 localStorage / 系统偏好
  // 设置 data-theme，避免主题闪烁。SSR 安全（typeof window 守卫）。
  const themeBootstrap = `(() => {
    try {
      var k = "teror-fox-theme";
      var s = localStorage.getItem(k);
      var t = (s === "light" || s === "dark") ? s : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", t);
      if (t === "light") document.documentElement.classList.add("light-theme");
    } catch (e) {}
  })();`;

  return (
    <html
      lang={HTML_LANG[locale]}
      className="h-full antialiased"
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <OpenPanelComponent
        clientId="1df61cd0-b9ac-4be9-91e0-5200452771e5"
        trackScreenViews={true}
        trackAttributes={true}
        trackOutgoingLinks={true}
        sessionReplay={{
          enabled: true,
        }}
        scriptUrl="https://p.trfox.top/https://openpanel.dev/op1.js"
        apiUrl="https://op.trfox.top/api"
      />
      </head>
      <body className="h-full overflow-hidden">
        <LocaleProvider initialLocale={locale}>
          <ThemeProvider>
            <KineticLoader />
            <EnhancedCursor />
            {children}
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
