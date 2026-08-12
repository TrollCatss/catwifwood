import Image from 'next/image'
import Link from 'next/link'
import Nav from './components/Nav'
import StrapAd from './components/StrapAd'

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
    <div className="bg-white text-black">
      <Nav active="home" />

      {/* Hero */}
      <section className="px-5 pb-14 pt-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div className="anim-rise">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-600/30 bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="anim-ring absolute inline-flex h-full w-full rounded-full bg-green-500" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
              </span>
              Launching on Robinhood Chain 4663
            </div>

            <h1 className="text-[clamp(2.75rem,8vw,5rem)] font-black leading-[0.92] tracking-tighter">
              CAT
              <br />
              WIF
              <br />
              <span className="text-green-600">WOOD</span>
            </h1>

            <p className="mt-5 max-w-md text-lg leading-relaxed text-neutral-600">
              He sat down. He looked at the chart. Something happened. There is
              now a token, and it is far too late for any of us.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/merch"
                className="rounded-xl bg-green-600 px-7 py-3.5 font-bold text-white transition hover:bg-green-700"
              >
                Shop the merch
              </Link>
              <a
                href="#faq"
                className="rounded-xl border-2 border-black px-7 py-3.5 font-bold transition hover:bg-black hover:text-white"
              >
                Explain yourself
              </a>
            </div>

            <div className="mt-10 grid max-w-md grid-cols-4 gap-3">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-xl bg-neutral-100 p-3">
                  <div className="text-xl font-black text-green-600">{s.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-6 rounded-full bg-green-400/20 blur-3xl" />
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
      <div className="overflow-hidden border-y-2 border-black bg-green-600 py-3 text-white">
        <div className="anim-marquee flex w-max gap-8 whitespace-nowrap text-sm font-black uppercase tracking-widest">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      {/* Flagship product, laid out as the campaign ad. */}
      <StrapAd />

      <div className="px-5 pb-4 text-center">
        <Link
          href="/merch"
          className="inline-block rounded-xl border-2 border-black px-7 py-3.5 font-bold transition hover:bg-black hover:text-white"
        >
          See all merch
        </Link>
      </div>

      {/* FAQ */}
      <section id="faq" className="bg-neutral-50 px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-5xl font-black tracking-tight">
            Questions we
            <br />
            were asked
          </h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-black/10 bg-white p-5"
              >
                <summary className="cursor-pointer list-none text-lg font-bold marker:hidden">
                  <span className="text-green-600 group-open:hidden">+ </span>
                  <span className="hidden text-green-600 group-open:inline">− </span>
                  {item.q}
                </summary>
                <p className="mt-3 leading-relaxed text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 px-5 py-12 text-center text-sm text-neutral-500">
        <p className="font-bold text-black">CATWIFWOOD — $WOOD</p>
        <p className="mt-2">Robinhood Chain 4663</p>
        <p className="mt-4 text-xs">
          Not financial advice. This is a picture of a cat. Consult your own cat
          before investing, and respect his decision.
        </p>
      </footer>
    </div>
  )
}
