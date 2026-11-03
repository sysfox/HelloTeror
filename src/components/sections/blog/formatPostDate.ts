/**
 * ISO 日期 → 本地化短日期（"Jun 23, 2026" / "2026年6月23日"）。
 * 固定 timeZone: "UTC"，与 mxspace.ts 的 toIsoDate 口径一致，避免跨时区差一天。
 *
 * 数据层只输出与语言无关的 ISO 串，显示格式化必须留在客户端（locale 是客户端状态）。
 */
export function formatPostDate(iso: string, intlLocale: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}
