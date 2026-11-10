import { useMemo, useState } from "react"
import { PLACES } from "../shared/site"
import type { NoteCard, RepoCard, ShelfPayload, WritingCard } from "../shared/types"
import { formatWhen, type Copy, type Locale } from "./copy"
import { useQuery } from "./useQuery"

type Filter = "all" | "writing" | "repos" | "notes" | "places"

type Card =
  | { kind: "writing"; item: WritingCard }
  | { kind: "note"; item: NoteCard }
  | { kind: "repo"; item: RepoCard }
  | { kind: "place"; item: (typeof PLACES)[number] }

const LANG: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#c7a227",
  Python: "#3572a5",
  Vue: "#41b883",
  Java: "#b07219",
  Shell: "#6f9e4a",
  Go: "#00add8",
  Rust: "#c47a4a",
}

export function Shelf({ copy, locale }: { copy: Copy; locale: Locale }) {
  const query = useQuery<ShelfPayload>("/api/shelf")
  const [filter, setFilter] = useState<Filter>("all")

  const cards = useMemo(() => {
    const writing = (query.data?.writing ?? []).map((item) => ({ kind: "writing" as const, item }))
    const notes = (query.data?.notes ?? []).map((item) => ({ kind: "note" as const, item }))
    const repos = (query.data?.repos ?? []).map((item) => ({ kind: "repo" as const, item }))
    const places = PLACES.map((item) => ({ kind: "place" as const, item }))
    if (filter === "writing") return writing
    if (filter === "notes") return notes
    if (filter === "repos") return repos
    if (filter === "places") return places
    return mix(writing, repos, notes, places)
  }, [query.data, filter])

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: copy.all },
    { id: "writing", label: copy.posts },
    { id: "repos", label: copy.repoWord },
    { id: "notes", label: copy.notes },
    { id: "places", label: copy.places },
  ]

  return (
    <div className="shelf">
      <div className="shelf-head">
        <h2 className="script">{copy.shelfTitle}</h2>
        <p>{copy.shelfLead}</p>
        <div className="filters" role="tablist" aria-label={copy.shelfTitle}>
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {query.state === "error" ? (
          <p className="miss">
            {copy.offline}{" "}
            <button type="button" onClick={query.reload}>
              {copy.retry}
            </button>
          </p>
        ) : null}
      </div>
      {query.state === "loading" && !query.data ? (
        <div className="shelf-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <article key={index} className="glass shelf-card">
              <div className="bones">
                <span />
                <span />
                <span />
              </div>
            </article>
          ))}
        </div>
      ) : null}
      {cards.length === 0 && query.state === "ready" ? <p className="miss">{copy.empty}</p> : null}
      <div className="shelf-grid">
        {cards.map((card) => (
          <ShelfCard key={keyOf(card)} card={card} copy={copy} locale={locale} />
        ))}
      </div>
    </div>
  )
}

function keyOf(card: Card): string {
  if (card.kind === "place") return `place-${card.item.id}`
  if (card.kind === "repo") return `repo-${card.item.name}`
  return `${card.kind}-${card.item.id}`
}

function mix(writing: Card[], repos: Card[], notes: Card[], places: Card[]): Card[] {
  const columns = [writing, repos, notes, places]
  const out: Card[] = []
  let index = 0
  while (columns.some((column) => column.length > 0)) {
    const column = columns[index % columns.length]
    const next = column?.shift()
    if (next) out.push(next)
    index += 1
  }
  return out
}

function ShelfCard({ card, copy, locale }: { card: Card; copy: Copy; locale: Locale }) {
  if (card.kind === "writing") {
    const item = card.item
    return (
      <article className="glass shelf-card">
        {item.cover ? <img src={item.cover} alt="" loading="lazy" /> : null}
        <p className="kicker">{item.category}</p>
        <h3>
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.title}
          </a>
        </h3>
        {item.excerpt ? <p className="excerpt">{item.excerpt}</p> : null}
        <time dateTime={item.date}>{formatWhen(item.date, locale)}</time>
      </article>
    )
  }

  if (card.kind === "note") {
    const item = card.item
    return (
      <article className="glass shelf-card">
        <p className="kicker">{copy.notes}</p>
        <h3>
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.title}
          </a>
        </h3>
        {item.excerpt ? <p className="excerpt">{item.excerpt}</p> : null}
        <p className="caption">
          {[item.weather, item.mood, formatWhen(item.date, locale)].filter(Boolean).join(" · ")}
        </p>
      </article>
    )
  }

  if (card.kind === "repo") {
    const item = card.item
    return (
      <article className="glass shelf-card">
        <p className="kicker">
          <i className="lang" style={{ background: LANG[item.language ?? ""] ?? "#d4763a" }} />
          {item.language ?? copy.repoWord}
        </p>
        <h3>
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.name}
          </a>
        </h3>
        {item.description ? <p className="excerpt">{item.description}</p> : null}
        {item.stars > 0 ? (
          <p className="caption">
            {copy.starCount(item.stars)}
          </p>
        ) : null}
      </article>
    )
  }

  const place = card.item
  const external = place.href.startsWith("http")
  return (
    <article className="glass shelf-card">
      <p className="kicker">{copy.places}</p>
      <h3>
        <a href={place.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
          {locale === "zh" ? place.zh : place.en}
        </a>
      </h3>
      <p className="excerpt">{place.host}</p>
    </article>
  )
}
