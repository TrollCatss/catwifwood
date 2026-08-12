'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import Nav from '../components/Nav'
import { SITE } from '../site'
import Socials from '../components/Socials'

type Product = {
  id: string
  name: string
  price: number
  /** The absurd claim. */
  blurb: string
  /** The asterisk that takes it back. */
  fine: string
  art: string
  status: string
  /** Sold now, or just displayed for the bit. */
  available: boolean
  /** Rendered larger, first in the grid. */
  hero?: boolean
}

const PRODUCTS: Product[] = [
  {
    id: 'wood-block',
    name: 'The Block',
    price: 89,
    blurb:
      'A solid billet of American black walnut, hand-finished, satin-oiled, weighted like something that matters. It does nothing. It is wood. You are buying wood, from a company called $WOOD, and we are both going to have to live with that.',
    fine: '*Brass plate ships unengraved. What you put on it is between you and the plate.',
    art: '/art/wood-block.png',
    status: 'FLAGSHIP',
    available: true,
    hero: true,
  },
  {
    id: 'tail-strap',
    name: 'Cat Tail Strap',
    price: 9.99,
    blurb:
      '100% REAL CAT TAIL.* Harvested ethically from a cat who is doing fine and is now, frankly, richer than you.',
    fine: '*Faux fur. The cat retains all rights to his tail and has counsel.',
    art: '/art/tail-strap.png',
    status: 'IN STOCK',
    available: true,
  },
  {
    id: 'pendant',
    name: 'Tail Up Pendant',
    price: 129,
    blurb:
      'Sterling silver, cast from a tail held at precisely the correct angle. Reads as abstract minimalist jewellery to anyone who has not been online, and as something else entirely to everyone who has.',
    fine: '*We will not be clarifying which. The deniability is the luxury.',
    art: '/art/pendant.png',
    status: 'ATELIER',
    available: true,
  },
  {
    id: 'whitepaper',
    name: 'The Whitepaper',
    price: 34,
    blurb:
      'Faithfully reproduced: cream linen hardcover, three hundred blank pages, and one permanent cat-shaped depression pressed into the front cover.',
    fine: '*Depression applied at the factory. He is no longer involved in production.',
    art: '/art/whitepaper.png',
    status: 'REPRINT',
    available: true,
  },
  {
    id: 'plaque',
    name: 'The Plaque',
    price: 69,
    blurb:
      'Walnut executive desk plaque with an unengraved brass face. Announces to the room that you hold a position, while sparing you the indignity of specifying which one.',
    fine: '*Engraving not included. Most customers report the ambiguity does the heavy lifting.',
    art: '/art/plaque.png',
    status: 'IN STOCK',
    available: true,
  },
  {
    id: 'coasters',
    name: 'Four Woods',
    price: 39,
    blurb:
      'Four walnut coasters. Four woods. We workshopped a great many names for this product and every single one of them was materially worse.',
    fine: '*Protects your desk from rings, which is more than the chart has managed.',
    art: '/art/coasters.png',
    status: 'SET OF FOUR',
    available: true,
  },
  {
    id: 'deskmat',
    name: 'The Sit',
    price: 45,
    blurb:
      'Charcoal wool felt, stitched edge, sized for a keyboard, a mouse, and one cat who will lie directly on top of both regardless of what you paid.',
    fine: '*Cat not included, will arrive anyway, is not ours.',
    art: '/art/deskmat.png',
    status: 'IN STOCK',
    available: true,
  },
  {
    id: 'beanie',
    name: 'Cat Ear Beanie',
    price: 24.99,
    blurb:
      'Grants +3 Charisma and immunity to the question "so what do you actually do." Ears do not swivel. We tried. We spent real money trying.',
    fine: '*Charisma bonus unverified. Two testers reported the opposite effect.',
    art: '/art/beanie.png',
    status: 'IN STOCK',
    available: true,
  },
  {
    id: 'keychain',
    name: 'Tiny Tail Keychain',
    price: 4.99,
    blurb:
      'Also a 100% real cat tail. It is simply from a considerably smaller cat. Do not think about this too hard.',
    fine: '*Please stop thinking about it. It is a keychain.',
    art: '/art/keychain.png',
    status: 'IN STOCK',
    available: true,
  },
  {
    id: 'gloves',
    name: 'Diamond Hands Gloves',
    price: 29.99,
    blurb:
      'Faceted palms make it physically impossible to tap the sell button. This is not a defect. This is the entire product.',
    fine: '*Also cannot tap buy, answer the phone, or unlock a door. Sold as-is.',
    art: '/art/gloves.png',
    status: 'PENDING FDA REVIEW',
    available: false,
  },
]

const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`)

export default function MerchPage() {
  const [cart, setCart] = useState<Record<string, number>>({})

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id)!, qty }))
        .filter((l) => l.product),
    [cart],
  )
  const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0)
  const count = lines.reduce((s, l) => s + l.qty, 0)

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }))
  const drop = (id: string) =>
    setCart((c) => {
      const next = { ...c }
      if ((next[id] ?? 0) <= 1) delete next[id]
      else next[id] -= 1
      return next
    })

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Nav active="merch" />

      <section className="border-b border-line px-6 pb-14 pt-32">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">Catwifwood — Collection 01</p>
          <h1 className="mt-4 font-serif text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-tight">
            Objects of
            <br />
            <em className="italic">questionable</em> necessity
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
            Every item here is real, is made properly, and ships. Every claim made
            about it is not. Telling the two apart is left as an exercise for the
            buyer.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2">
          {PRODUCTS.map((p) => (
            <article
              key={p.id}
              className={`group flex flex-col ${p.hero ? 'sm:col-span-2' : ''}`}
            >
              <div
                className={`relative overflow-hidden rounded-sm bg-panel ${
                  p.hero ? 'aspect-[16/10]' : 'aspect-[4/5]'
                }`}
              >
                <Image
                  src={p.art}
                  alt={p.name}
                  fill
                  sizes={p.hero ? '(max-width: 640px) 100vw, 900px' : '(max-width: 640px) 100vw, 440px'}
                  className="object-contain p-10 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <span className="eyebrow absolute left-5 top-5 text-[10px] text-ink/60">
                  {p.status}
                </span>
              </div>

              <div className="mt-6 flex flex-1 flex-col">
                <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                  <h2 className="font-serif text-3xl leading-none">{p.name}</h2>
                  <span className="font-serif text-2xl text-wood">
                    {money(p.price)}
                  </span>
                </div>

                <p
                  className={`mt-4 leading-relaxed text-muted ${
                    p.hero ? 'max-w-2xl text-base' : 'text-sm'
                  }`}
                >
                  {p.blurb}
                </p>
                <p className="mt-3 text-[11px] leading-snug text-muted/60">
                  {p.fine}
                </p>

                <div className="mt-auto pt-6">
                  <button
                    onClick={() => add(p.id)}
                    disabled={!p.available}
                    className={
                      p.available
                        ? 'w-full rounded-full border border-ink bg-ink py-3 text-xs font-bold uppercase tracking-eyebrow text-paper transition hover:bg-wood hover:border-wood sm:w-auto sm:px-10'
                        : 'w-full cursor-not-allowed rounded-full border border-line py-3 text-xs font-bold uppercase tracking-eyebrow text-muted/50 sm:w-auto sm:px-10'
                    }
                  >
                    {p.available ? 'Add to bag' : 'Withheld'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit lg:sticky lg:top-28">
          <div className="border border-line bg-white/60 p-6">
            <p className="eyebrow">Your bag {count > 0 && `(${count})`}</p>

            {lines.length === 0 ? (
              <p className="mt-5 text-sm leading-relaxed text-muted">
                Empty. Statistically your best-performing position to date.
              </p>
            ) : (
              <>
                <ul className="mt-5 space-y-4">
                  {lines.map(({ product, qty }) => (
                    <li key={product.id} className="flex items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0 bg-panel">
                        <Image
                          src={product.art}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-contain p-1.5"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-lg leading-tight">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted">
                          {money(product.price)} × {qty}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => drop(product.id)}
                          aria-label={`Remove one ${product.name}`}
                          className="h-7 w-7 border border-line text-sm leading-none hover:bg-panel"
                        >
                          −
                        </button>
                        <button
                          onClick={() => add(product.id)}
                          aria-label={`Add one ${product.name}`}
                          className="h-7 w-7 border border-line text-sm leading-none hover:bg-panel"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-baseline justify-between border-t border-line pt-4">
                  <span className="eyebrow">Total</span>
                  <span className="font-serif text-3xl text-wood">
                    {money(Number(total.toFixed(2)))}
                  </span>
                </div>

                <button className="mt-5 w-full rounded-full bg-ink py-3 text-xs font-bold uppercase tracking-eyebrow text-paper transition hover:bg-wood">
                  Checkout
                </button>
                <p className="mt-4 text-[11px] leading-snug text-muted/60">
                  Checkout is not wired up. Your bag is a work of fiction, much
                  like the product descriptions beside it.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>

      <footer className="border-t border-line px-6 py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center">
          <p className="font-serif text-2xl">{SITE.name}</p>
          <p className="eyebrow">{SITE.chain}</p>
          <Socials variant="labelled" className="mt-2" />
        </div>
      </footer>
    </div>
  )
}
