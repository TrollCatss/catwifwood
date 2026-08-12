type IconProps = { className?: string }

export function PawIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <ellipse cx="6.2" cy="9.6" rx="2.5" ry="3.2" transform="rotate(-18 6.2 9.6)" />
      <ellipse cx="10.6" cy="6.3" rx="2.4" ry="3.3" transform="rotate(-6 10.6 6.3)" />
      <ellipse cx="15.5" cy="6.5" rx="2.4" ry="3.3" transform="rotate(8 15.5 6.5)" />
      <ellipse cx="19.4" cy="10" rx="2.4" ry="3.1" transform="rotate(20 19.4 10)" />
      <path d="M12.6 12.2c3.3 0 6 2.3 6 5.1 0 2.3-1.9 3.6-4.2 3.6-1.1 0-1.4-.4-2.4-.4s-1.3.4-2.4.4c-2.3 0-4.2-1.3-4.2-3.6 0-2.8 2.7-5.1 6-5.1Z" />
    </svg>
  )
}

export function RocketIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Nose-up rocket: body, two fins, porthole, exhaust. */}
      <path d="M12 2.5c2.6 2.3 4 5.5 4 9v3.2H8V11.5c0-3.5 1.4-6.7 4-9Z" />
      <path d="M8 12.4 5.2 15a2 2 0 0 0-.6 1.4v2.3l3.4-2M16 12.4 18.8 15a2 2 0 0 1 .6 1.4v2.3l-3.4-2" />
      <circle cx="12" cy="9.4" r="1.7" />
      <path d="M10.4 18.2c.5 1.4 1 2.4 1.6 3.3.6-.9 1.1-1.9 1.6-3.3" />
    </svg>
  )
}

export function DiamondIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 3h12l4 6-10 12L2 9Z" />
      <path d="M2 9h20M9 3 6.5 9 12 21M15 3l2.5 6L12 21" />
    </svg>
  )
}

export function TrendIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 17 9.5 10.5l4 4L21 7" />
      <path d="M15 7h6v6" />
    </svg>
  )
}

/** The round "not financial advice / meow dyor" stamp from the ad. */
export function DyorSeal({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-label="Not financial advice. Meow, DYOR.">
      <defs>
        {/* Text rides just inside the outer ring. The arcs are drawn a little
            longer than a half turn so 20 characters fit without clipping. */}
        <path id="seal-top" d="M14 64 A46 46 0 0 1 106 64" fill="none" />
        <path id="seal-bottom" d="M22 58 A38 38 0 0 0 98 58" fill="none" />
      </defs>

      <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="1" />

      <text
        fill="currentColor"
        fontSize="9"
        fontWeight="700"
        letterSpacing="0.9"
        textAnchor="middle"
      >
        <textPath href="#seal-top" startOffset="50%">
          NOT FINANCIAL ADVICE
        </textPath>
      </text>
      <text
        fill="currentColor"
        fontSize="9"
        fontWeight="700"
        letterSpacing="0.9"
        textAnchor="middle"
      >
        <textPath href="#seal-bottom" startOffset="50%">
          MEOW DYOR
        </textPath>
      </text>

      <circle cx="60" cy="60" r="27" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Ethereum-style octahedron, as in the ad. */}
      <path d="M60 43 71 60 60 66 49 60Z" fill="currentColor" opacity="0.85" />
      <path d="M60 68.5 71 62.5 60 78 49 62.5Z" fill="currentColor" opacity="0.55" />
      <circle cx="34" cy="60" r="1.6" fill="currentColor" />
      <circle cx="86" cy="60" r="1.6" fill="currentColor" />
    </svg>
  )
}

export function TelegramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21.7 3.3a1.2 1.2 0 0 0-1.24-.2L2.9 9.86a1.2 1.2 0 0 0 .1 2.27l4.25 1.32 1.62 5.1a1.05 1.05 0 0 0 1.78.4l2.3-2.42 4.28 3.15a1.2 1.2 0 0 0 1.88-.71l3.02-14.4a1.2 1.2 0 0 0-.43-1.27ZM9.6 13.9l-.63 3.13-1.1-3.46 8.6-5.6-6.87 5.93Z" />
    </svg>
  )
}
