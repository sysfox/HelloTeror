type Entry<T> = { at: number; value: T }

const box = new Map<string, Entry<unknown>>()

/** 成功结果进缓存。刷新失败时把上一次的结果再交出去，页面不要跟着上游抖。 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<T> {
  const hit = box.get(key) as Entry<T> | undefined
  if (hit && Date.now() - hit.at < ttlMs) return hit.value
  try {
    const value = await load()
    box.set(key, { at: Date.now(), value })
    return value
  } catch (error) {
    if (hit) return hit.value
    throw error
  }
}
