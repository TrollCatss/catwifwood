import Image from 'next/image'
import Link from 'next/link'
import { SITE } from '../site'
import { TelegramIcon } from './icons'

export default function Nav({ active }: { active?: 'home' | 'merch' }) {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative h-9 w-9 overflow-hidden rounded-full bg-panel">
            <Image
              src="/art/avatar.png"
              alt=""
              fill
              sizes="36px"
              className="object-cover"
            />
          </span>
          <span className="font-serif text-2xl leading-none">{SITE.name}</span>
        </Link>

        <div className="flex items-center gap-8">
          <Link
            href="/"
            className={`eyebrow transition hover:text-ink ${
              active === 'home' ? 'text-ink' : ''
            }`}
          >
            Home
          </Link>
          <Link
            href="/merch"
            className={`eyebrow transition hover:text-ink ${
              active === 'merch' ? 'text-ink' : ''
            }`}
          >
            Shop
          </Link>
          <a
            href={SITE.links.telegram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="catwifwood on Telegram"
            className="text-muted transition hover:text-wood"
          >
            <TelegramIcon className="h-5 w-5" />
          </a>
          <Link
            href="/merch"
            className="rounded-full bg-ink px-6 py-2.5 text-[11px] font-bold uppercase tracking-eyebrow text-paper transition hover:bg-wood"
          >
            {SITE.ticker}
          </Link>
        </div>
      </div>
    </nav>
  )
}
