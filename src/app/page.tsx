import { PageProvider } from "@/contexts/PageContext";
import { PageShell } from "@/components/PageShell";
import { SiteNav } from "@/components/SiteNav";

export default function Home() {
  return (
    <PageProvider>
      {/* 全屏锁定容器：禁止页面级滚动，所有 page 居中显示 */}
      <div className="fixed inset-0 flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <SiteNav />
        <main className="relative flex-1 pt-12 md:pt-14 overflow-hidden">
          <PageShell />
        </main>
      </div>
    </PageProvider>
  );
}
