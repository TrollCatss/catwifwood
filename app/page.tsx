import Image from 'next/image'
import Link from 'next/link'
import Nav from './components/Nav'
import { SITE } from './site'
import { TelegramIcon } from './components/icons'
import StrapAd from './components/StrapAd'
import TailWears from './components/TailWears'

const TICKER = [
  'CAT WIF WOOD',
  'CHAIN 4663',
  'THE TAIL THAT WAGS THE MARKET',
  '100% REAL CAT TAIL',
  'DIAMOND HANDS ONLY',
  'AUDITED BY A CAT',
  'HE SAT ON THE WHITEPAPER',
  'NOT FINANCIAL ADVICE',
]

const STATS = [
  { label: 'Chain', value: '4663' },
  { label: 'Supply', value: '1B' },
  { label: 'Tax', value: '0%' },
  { label: 'Tail', value: 'UP' },
]

const FAQ = [
  {
    q: 'Why is the tail like that?',
    a: "A raised tail is a documented sign of a happy, confident cat. The veterinary literature is unanimous. Whatever you are currently thinking is a you problem, and we would ask that you keep it largely to yourself.",
  },
  {
    q: 'Who is the team?',
    a: "One cat. He does not attend meetings. He has never attended a meeting. Every attempt to schedule one has been met with precisely the behaviour you would expect.",
  },
  {
    q: 'Has the contract been audited?',
    a: "Yes. He looked directly at it for roughly four seconds, then walked away and lay down in a patch of sun. We have elected to interpret this as approval.",
  },
  {
    q: 'Is there a whitepaper?',
    a: "There was. He sat on it. It is now a bed, and it is his, and we are not in a position to ask for it back.",
  },
  {
    q: 'Is this a serious investment?',
    a: "It is a photograph of a cat on a blockchain. We have at no point misrepresented this. At no point has anyone here said the word fundamentals.",
  },
  {
    q: 'What is the utility?',
    a: "Merch that genuinely ships, and the quiet dignity of holding a coin your family will only ask you about once.",
  },
  {
    q: 'What if I lose money?',
    a: "Then you will own a cat tail keychain, which is materially more than you owned before. We consider this a floor.",
  },
  {
    q: 'Will the tail ever go down?',
    a: 'Charts go up. Charts go down. The tail abides.',
  },
]

export default function Home() {
  return (
    <div className="bg-paper text-ink">
      <Nav active="home" />

      {/* Hero */}
      <section className="px-6 pb-16 pt-32">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div className="anim-rise">
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-line bg-wood-light px-4 py-1.5 text-[10px] font-bold uppercase tracking-eyebrow text-wood-deep">
              <span className="relative flex h-2 w-2">
                <span className="anim-ring absolute inline-flex h-full w-full rounded-full bg-wood" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-wood" />
              </span>
              Launching on Robinhood Chain 4663
            </div>

            <h1 className="font-serif text-[clamp(3.5rem,10vw,7rem)] leading-[0.86] tracking-tight">
              cat wif
              <br />
              <em className="italic text-wood">wood</em>
            </h1>

            <p className="mt-8 max-w-md text-lg leading-relaxed text-muted">
              He sat down. He looked at the chart. Something happened. There is
              now a token, and it is far too late for any of us.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/merch"
                className="rounded-full bg-ink px-8 py-3.5 text-[11px] font-bold uppercase tracking-eyebrow text-paper transition hover:bg-wood"
              >
                Shop the collection
              </Link>
              <a
                href="#wardrobe"
                className="rounded-full border border-ink px-8 py-3.5 text-[11px] font-bold uppercase tracking-eyebrow transition hover:bg-ink hover:text-paper"
              >
                See the wardrobe
              </a>
            </div>

            <div className="mt-14 grid max-w-md grid-cols-4 gap-5">
              {STATS.map((s) => (
                <div key={s.label} className="border-t border-line pt-3">
                  <div className="font-serif text-3xl leading-none text-wood">{s.value}</div>
                  <div className="eyebrow mt-1.5 text-[10px]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-8 rounded-full bg-wood/10 blur-3xl" />
            <Image
              src="/art/logo.png"
              alt="catwifwood: a grey British Shorthair sitting with its legs splayed and its tail up"
              width={1002}
              height={985}
              priority
              className="anim-bob relative w-full"
            />
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="overflow-hidden border-y border-line bg-ink py-3.5 text-paper">
        <div className="anim-marquee flex w-max gap-12 whitespace-nowrap text-[11px] font-bold uppercase tracking-eyebrow">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      {/* Flagship product, laid out as the campaign ad. */}
      <StrapAd />

      <div className="px-6 py-16 text-center">
        <Link
          href="/merch"
          className="inline-block rounded-full border border-ink px-10 py-3.5 text-[11px] font-bold uppercase tracking-eyebrow transition hover:bg-ink hover:text-paper"
        >
          View the full collection
        </Link>
      </div>

      <TailWears />

      {/* FAQ */}
      <section id="faq" className="border-t border-line bg-panel/40 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow">On the record</p>
          <h2 className="mb-12 mt-4 font-serif text-[clamp(2.5rem,6vw,4rem)] leading-[0.95] tracking-tight">
            Questions we
            <br />
            <em className="italic">were</em> asked
          </h2>
          <div className="border-t border-line">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group border-b border-line py-5"
              >
                <summary className="flex cursor-pointer list-none items-baseline gap-3 font-serif text-2xl marker:hidden">
                  <span className="text-wood group-open:hidden">+</span>
                  <span className="hidden text-wood group-open:inline">−</span>
                  {item.q}
                </summary>
                <p className="mt-4 max-w-2xl pl-6 leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="border-t border-line px-6 py-24 text-center">
        <p className="eyebrow">The group chat</p>
        <h2 className="mx-auto mt-4 max-w-2xl font-serif text-[clamp(2.25rem,5vw,3.5rem)] leading-[0.98] tracking-tight">
          Everyone is already
          <br />
          <em className="italic text-wood">in there</em>
        </h2>
        <p className="mx-auto mt-6 max-w-md leading-relaxed text-muted">
          Posting the tail in hats. Arguing about the chart. It is going about as
          well as you would imagine.
        </p>
        <a
          href={SITE.links.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-9 inline-flex items-center gap-2.5 rounded-full bg-ink px-9 py-4 text-[11px] font-bold uppercase tracking-eyebrow text-paper transition hover:bg-wood"
        >
          <TelegramIcon className="h-4 w-4" />
          Join on Telegram
        </a>
      </section>

      <footer className="border-t border-line px-6 py-16 text-center">
        <p className="font-serif text-3xl">{SITE.name}</p>
        <p className="eyebrow mt-3">{SITE.chain}</p>
        <a
          href={SITE.links.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted transition hover:text-wood"
        >
          <TelegramIcon className="h-4 w-4" />
          t.me/catwifwood
        </a>
        <p className="mx-auto mt-6 max-w-md text-[11px] leading-relaxed text-muted/70">
          Not financial advice. This is a picture of a cat. Consult your own cat
          before investing, and respect his decision.
        </p>
      </footer>
    </div>
  )
}
