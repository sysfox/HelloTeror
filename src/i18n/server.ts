/**
 * 服务端语言解析 —— 仅可在 Server Component / Route Handler 中 import
 *（引用了 next/headers，客户端组件 import 会构建失败）。
 *
 * 代价说明：读 cookies() / headers() 会让 `/` 转为动态渲染。
 * 这是为 i18n 正确性付的必要代价：locale 必须在首字节就确定，
 * 否则 <html lang>、metadata 与 SSR 文案都会与用户实际语言不一致。
 * 页面本身只有一条路由、数据全部走 client fetch + 各自的 ISR，
 * 因此动态渲染的额外成本可以忽略。
 */
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";

/** 解析当前请求的语言：cookie 优先，否则跟随 Accept-Language。 */
export async function getRequestLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get("accept-language")
  );
}

/** 解析当前请求的语言并返回对应字典（generateMetadata 用）。 */
export async function getRequestDictionary(): Promise<Dictionary> {
  return getDictionary(await getRequestLocale());
}
