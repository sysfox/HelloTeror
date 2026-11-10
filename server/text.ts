/** 把 MX-Space 的 markdown 收成一句话。中文标点留着。 */
export function plain(input: string | null | undefined, max = 96): string {
  if (!input) return ""
  const text = input
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>~|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

/** 日历日按上海时区取出，避免 UTC 跨日把「3 月 28 日」记成前一天。 */
export function shanghaiDay(iso: string | null | undefined): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}
