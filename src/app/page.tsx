import { PageProvider } from "@/contexts/PageContext";
import { PageShell } from "@/components/PageShell";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { AuroraBackground } from "@/components/animations/AuroraBackground";

export default function Home() {
  return (
    <PageProvider>
      {/* 全屏锁定容器：禁止页面级滚动，所有 page 居中显示。
          isolate 让极光层的 -z-10 被限制在本容器内（不至于沉到 body 背景之下）。 */}
      <div className="fixed inset-0 isolate flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {/* 全站持久极光背景：不随 PageShell 重挂载，故可连续参与页面切换。
            必须放在 PageProvider 内 —— 它消费 usePage() 的 current / transitioning。 */}
        <AuroraBackground />
        <SiteNav />
        <main className="relative flex-1 pt-12 md:pt-14 overflow-hidden">
          <PageShell />
        </main>
        <SiteFooter />
      </div>
    </PageProvider>
  );
}
