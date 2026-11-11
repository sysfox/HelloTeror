/** 线框导航和品牌色快捷入口。路径是自绘的简形，不引用外部图标字体。 */

type Props = { className?: string }

export function HomeMark({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ShelfMark({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export function TimelineMark({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 8.2v2.2M7 13.6v2.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="7" cy="6.2" r="1.7" fill="currentColor" />
      <circle cx="7" cy="12" r="1.7" fill="currentColor" />
      <circle cx="7" cy="17.8" r="1.7" fill="currentColor" />
      <path
        d="M10.6 6.2H17.6M10.6 12H15.2M10.6 17.8H16.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ConsoleMark({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.2 8.4h9.6c1.8 0 2.8 1.5 2.2 3.1l-.5 1.3c-.4.9-1.2 1-1.8.4l-1.2-1.2H9.5l-1.2 1.2c-.6.6-1.4.5-1.8-.4l-.5-1.3c-.6-1.6.4-3.1 2.2-3.1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M8.3 11.6h2.5M9.55 10.35v2.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="15.15" cy="10.85" r="0.85" fill="currentColor" />
      <circle cx="16.85" cy="12.45" r="0.85" fill="currentColor" />
    </svg>
  )
}

export function SunMark({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MoonMark({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15.5 3.8A7.8 7.8 0 1 0 20.2 14 6.2 6.2 0 0 1 15.5 3.8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CloudMark({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.5 17.5h9.2a3.6 3.6 0 0 0 .4-7.2 5 5 0 0 0-9.6-1.2A3.4 3.4 0 0 0 7.5 17.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function RainMark({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.2 14.2h9.2a3.3 3.3 0 0 0 .3-6.6 4.6 4.6 0 0 0-8.8-1A3.1 3.1 0 0 0 7.2 14.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 16.8 8.2 19M12.4 16.8 11.6 19M15.6 16.8 14.8 19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function DropMark({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.5s5.2 5.6 5.2 9.1a5.2 5.2 0 0 1-10.4 0C6.8 9.1 12 3.5 12 3.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WindMark({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 9h11.2a2.3 2.3 0 1 0-2.2-3M4 13h14.2a2.3 2.3 0 1 1-2.2 3M4 17h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function PlaceMark({ id, className }: { id: string; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", "aria-hidden": true as const }
  if (id === "github") {
    return (
      <svg {...common}>
        <path
          fill="currentColor"
          d="M12 2.2A9.8 9.8 0 0 0 8.6 21.3c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.6s.8-.3 2.8 1a9.7 9.7 0 0 1 5 0c2-1.3 2.8-1 2.8-1a3.6 3.6 0 0 1 .1 2.6 3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A9.8 9.8 0 0 0 12 2.2z"
        />
      </svg>
    )
  }
  if (id === "bilibili") {
    return (
      <svg {...common}>
        <rect x="3.2" y="6.2" width="17.6" height="12.2" rx="2.4" fill="currentColor" />
        <path d="M8.2 4.2 10 6.4M15.8 4.2 14 6.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="9" cy="12" r="1" fill="#fff" />
        <circle cx="15" cy="12" r="1" fill="#fff" />
      </svg>
    )
  }
  if (id === "email") {
    return (
      <svg {...common}>
        <rect x="3.2" y="5.2" width="17.6" height="13.6" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="m4.2 7 7.8 6.2L19.8 7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    )
  }
  if (id === "legacy") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 8.2V12l2.8 1.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }
  if (id === "pan") {
    return (
      <svg {...common}>
        <path d="M4 8.2 12 4.5l8 3.7-8 3.7z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M4 8.2V16l8 3.7 8-3.7V8.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M12 12v7.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }
  if (id === "lens") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M9.2 5.2h5.6l1.2 2.1h2.2A1.8 1.8 0 0 1 20 9.1v8a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 17.1v-8a1.8 1.8 0 0 1 1.8-1.8h2.2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (id === "status") {
    return (
      <svg {...common}>
        <path d="M3.5 12h3.2l2-4.5 3.2 9 2.1-4.5H20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path
        d="M7 4.5h7.2L18 8.2V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V6a1.5 1.5 0 0 1 1-1.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M14 4.6V8h3.4M8.5 12.2h7M8.5 15.4h5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
