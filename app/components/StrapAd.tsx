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
    <section id={id} className="bg-white px-5 py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2">
        <div>
          <p className="text-[clamp(2.5rem,6vw,3.75rem)] font-black leading-none tracking-tight text-green-600">
            $WOOD
          </p>
          <h2 className="mt-1 text-[clamp(2.75rem,7vw,4.5rem)] font-black uppercase leading-[0.88] tracking-tight">
            Cat Tail
            <br />
            Strap
          </h2>

          <p className="mt-6 flex items-center gap-2 text-xl text-neutral-500 sm:text-2xl">
            The tail that wags the market.
            <TrendIcon className="h-6 w-6 shrink-0 text-green-600" />
          </p>

          <p className="mt-7 inline-block rounded-2xl bg-green-600 px-8 py-3 text-4xl font-black text-white sm:text-5xl">
            $9.99
          </p>

          <ul className="mt-9 space-y-4">
            {CLAIMS.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-4">
                <Icon className="h-6 w-6 shrink-0 text-green-600" />
                <span className="text-lg font-bold tracking-wide">{text}</span>
              </li>
            ))}
          </ul>

          <DyorSeal className="mt-10 h-28 w-28 text-green-800" />
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

      <p className="mx-auto mt-6 max-w-6xl text-xs text-neutral-400">
        Not a real cat tail. No cat was consulted, harmed, or compensated.
      </p>
    </section>
  )
}
