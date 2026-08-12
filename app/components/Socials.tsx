import { SOCIALS } from '../site'
import { TelegramIcon, XIcon } from './icons'

const GLYPH = {
  x: XIcon,
  telegram: TelegramIcon,
} as const

/**
 * Every social link on the site renders from SOCIALS, so adding one is a
 * single entry in site.ts rather than an edit in four components.
 */
export default function Socials({
  variant = 'icon',
  className = '',
}: {
  /** 'icon' for the nav, 'labelled' for footers. */
  variant?: 'icon' | 'labelled'
  className?: string
}) {
  return (
    <div
      className={`flex items-center ${
        variant === 'icon' ? 'gap-4' : 'flex-wrap justify-center gap-x-7 gap-y-2'
      } ${className}`}
    >
      {SOCIALS.map(({ key, label, handle, href }) => {
        const Glyph = GLYPH[key]
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`catwifwood on ${label}`}
            className="inline-flex items-center gap-2 text-muted transition hover:text-wood"
          >
            <Glyph className={variant === 'icon' ? 'h-[18px] w-[18px]' : 'h-4 w-4'} />
            {variant === 'labelled' && <span className="text-sm">{handle}</span>}
          </a>
        )
      })}
    </div>
  )
}
