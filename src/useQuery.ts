import { useEffect, useState } from "react"

type State = "loading" | "ready" | "error"

export function useQuery<T>(url: string): {
  data: T | null
  state: State
  reload: () => void
} {
  const [data, setData] = useState<T | null>(null)
  const [state, setState] = useState<State>("loading")
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let gone = false
    setState("loading")
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<T>
      })
      .then((payload) => {
        if (gone) return
        setData(payload)
        setState("ready")
      })
      .catch(() => {
        if (!gone) setState("error")
      })
    return () => {
      gone = true
    }
  }, [url, tick])

  return { data, state, reload: () => setTick((value) => value + 1) }
}
