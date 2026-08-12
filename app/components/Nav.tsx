import Image from 'next/image'
import Link from 'next/link'

export default function Nav({ active }: { active?: 'home' | 'merch' }) {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-black/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-green-600">
            <Image
              src="/art/logo.png"
              alt="catwifwood"
              fill
              sizes="36px"
              className="scale-[2.1] object-cover"
              style={{ objectPosition: '36% 12%' }}
            />
          </span>
          <span className="text-xl font-black tracking-tight">
            <span className="text-green-600">$WOOD</span>
          </span>
        </Link>

        <div className="flex items-center gap-6 text-sm font-semibold">
          <Link
            href="/"
            className={active === 'home' ? 'text-green-600' : 'hover:text-green-600'}
          >
            Home
          </Link>
          <Link
            href="/merch"
            className={active === 'merch' ? 'text-green-600' : 'hover:text-green-600'}
          >
            Merch
          </Link>
          <Link
            href="/merch"
            className="rounded-full bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
          >
            Buy
          </Link>
        </div>
      </div>
    </nav>
  )
}
