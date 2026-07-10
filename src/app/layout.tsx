import type { Metadata } from "next";
import "./globals.css";
import { KineticLoader } from "@/components/animations/KineticLoader";
import { EnhancedCursor } from "@/components/animations/EnhancedCursor";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OpenPanelComponent } from '@openpanel/nextjs';

export const metadata: Metadata = {
  title: "Teror Fox — Fighting for the AI age",
  description:
    "Teror Fox — a creative developer passionate about open source and building beautiful things. Student && Developer. Based in China.",
  keywords: [
    "Teror Fox",
    "sysfox",
    "developer",
    "open source",
    "TypeScript",
    "Python",
    "Next.js",
    "AI",
  ],
  authors: [{ name: "Teror Fox" }],
  openGraph: {
    title: "Teror Fox — Fighting for the AI age",
    description:
      "Creative developer, open source enthusiast. Student && Developer.",
    url: "https://www.trfox.top",
    siteName: "Teror Fox",
    type: "profile",
  },
  alternates: {
    canonical: "https://www.trfox.top",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    <html lang="zh-CN" className="h-full antialiased" data-theme="dark" suppressHydrationWarning>
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
        apiUrl="https://op.trfox.top"
      />
      </head>
      <body className="h-full overflow-hidden">
        <ThemeProvider>
          <KineticLoader />
          <EnhancedCursor />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
