"use client";

import { useEffect, useState } from "react";

/**
 * useApiData — 模块级缓存的客户端数据获取 hook。
 *
 * 为什么需要它：站点是 SPA（PageShell 按 key 重挂载 section），每次导航离开再回来
 * 组件都会重新挂载。若直接用 useEffect + fetch，会反复请求并出现 loading 闪烁。
 * 本 hook 用模块级 Map 缓存响应 + 在途 promise 去重，使重挂载时命中缓存即时渲染。
 *
 * 行为：
 * - 缓存新鲜（< ttl，默认 5min）→ 立即返回 { data, loading: false }，无闪烁
 * - 缓存过期/不存在 → fetch，期间 loading=true；成功后写缓存
 * - fetch 失败但有陈旧缓存 → 继续展示陈旧数据（loading=false，不报错）
 * - fetch 失败且无缓存 → 返回 error
 */

interface CacheEntry<T> {
  data: T;
  ts: number;
}

// 模块级，跨组件实例与重挂载共享
const cache = new Map<string, CacheEntry<unknown>>();
// 在途请求去重：同一 path 并发只发一次
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 分钟

function fetchJson<T>(path: string): Promise<T> {
  const existing = inflight.get(path) as Promise<T> | undefined;
  if (existing) return existing;
  const promise = fetch(path)
    .then((res) => {
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json() as Promise<T>;
    })
    .finally(() => {
      inflight.delete(path);
    });
  inflight.set(path, promise);
  return promise;
}

function readCache<T>(path: string, ttl: number): T | null {
  const entry = cache.get(path) as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.ts < ttl) return entry.data;
  return null;
}

export function useApiData<T>(
  path: string,
  options?: { ttl?: number }
): { data: T | null; loading: boolean; error: Error | null } {
  const ttl = options?.ttl ?? DEFAULT_TTL;

  const [data, setData] = useState<T | null>(() => readCache<T>(path, ttl));
  const [loading, setLoading] = useState(() => readCache<T>(path, ttl) === null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fresh = readCache<T>(path, ttl);
    if (fresh !== null) {
      setData(fresh);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    let cancelled = false;
    fetchJson<T>(path)
      .then((result) => {
        if (cancelled) return;
        cache.set(path, { data: result, ts: Date.now() });
        setData(result);
        setLoading(false);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        // 陈旧缓存兜底：宁可展示旧数据也不报错
        const stale = cache.get(path) as CacheEntry<T> | undefined;
        if (stale) {
          setData(stale.data);
          setError(null);
        } else {
          setError(err);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, ttl]);

  return { data, loading, error };
}
