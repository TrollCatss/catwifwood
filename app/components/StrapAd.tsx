import Image from 'next/image'
import {
  DiamondIcon,
  DyorSeal,
  PawIcon,
  RocketIcon,
  TrendIcon,
} from './icons'

const CLAIMS = [
  { Icon: PawIcon, text: '100% REAL CAT TAIL' },
  { Icon: RocketIcon, text: 'BOOSTS YOUR BAG' },
  { Icon: DiamondIcon, text: 'DIAMOND HANDS ONLY' },
]

/**
 * The campaign ad, rebuilt as markup so the type stays sharp at any size and
 * the copy/price can be edited without regenerating artwork.
 */
export default function StrapAd({ id }: { id?: string }) {
  return (
    <section id={id} className="border-y border-line bg-panel/50 px-6 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          <p className="eyebrow">The flagship</p>
          <h2 className="mt-4 font-serif text-[clamp(3rem,7vw,5rem)] leading-[0.92] tracking-tight">
            The Cat Tail
            <br />
            Strap
          </h2>

          <p className="mt-6 flex items-center gap-2 text-xl text-muted">
            The tail that wags the market.
            <TrendIcon className="h-5 w-5 shrink-0 text-wood" />
          </p>

          <p className="mt-8 font-serif text-5xl text-wood">$9.99</p>

          <ul className="mt-9 space-y-3 border-t border-line pt-7">
            {CLAIMS.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-4">
                <Icon className="h-5 w-5 shrink-0 text-wood" />
                <span className="text-xs font-bold uppercase tracking-eyebrow">{text}</span>
              </li>
            ))}
          </ul>

          <DyorSeal className="mt-10 h-24 w-24 text-wood-deep/70" />
        </div>

        <div className="relative">
          <Image
            src="/art/tail-strap.png"
            alt="The $WOOD cat tail phone strap"
            width={1024}
            height={1024}
            className="anim-wag w-full"
          />
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-6xl text-[11px] text-muted/60">
        Not a real cat tail. No cat was consulted, harmed, or compensated.
      </p>
    </section>
  )
}
