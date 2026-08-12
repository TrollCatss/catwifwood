'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import Nav from '../components/Nav'

type Product = {
  id: string
  name: string
  price: number
  blurb: string
  art: string
  status: 'IN STOCK' | 'PRE-ORDER' | 'COMING SOON'
}

const PRODUCTS: Product[] = [
  {
    id: 'tail-strap',
    name: 'Cat Tail Strap',
    price: 9.99,
    blurb: 'The tail that wags the market. Hangs off your phone.',
    art: '/art/tail-strap.png',
    status: 'IN STOCK',
  },
  {
    id: 'hoodie',
    name: '$WOOD Hoodie',
    price: 49.99,
    blurb: 'Heavyweight black fleece. Quietly says everything.',
    art: '/art/hoodie.png',
    status: 'PRE-ORDER',
  },
  {
    id: 'tshirt',
    name: '$WOOD Tee',
    price: 19.99,
    blurb: 'Heavy cotton. Boxy cut. Ships in a plain bag.',
    art: '/art/tshirt.png',
    status: 'IN STOCK',
  },
  {
    id: 'beanie',
    name: 'Cat Ear Beanie',
    price: 24.99,
    blurb: 'Chunky ribbed knit with ears. Warm. Committed.',
    art: '/art/beanie.png',
    status: 'IN STOCK',
  },
  {
    id: 'keychain',
    name: 'Tiny Tail Keychain',
    price: 4.99,
    blurb: 'A smaller tail, for the understated holder.',
    art: '/art/keychain.png',
    status: 'IN STOCK',
  },
  {
    id: 'gloves',
    name: 'Diamond Hands Gloves',
    price: 29.99,
    blurb: 'Faceted palms. Structurally incapable of selling.',
    art: '/art/gloves.png',
    status: 'COMING SOON',
  },
]

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
    <div className="min-h-screen bg-white text-black">
      <Nav active="merch" />

      <section className="px-5 pb-10 pt-28">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-black leading-none tracking-tighter">
            THE <span className="text-green-600">MERCH</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-neutral-600">
            Real products. Real shipping. Explaining them to people is your
            problem.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {PRODUCTS.map((p) => {
            const soon = p.status === 'COMING SOON'
            return (
              <article
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-black/10 transition hover:border-green-600 hover:shadow-lg"
              >
                <div className="relative aspect-square bg-neutral-50">
                  <Image
                    src={p.art}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-contain p-4 transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-700 ring-1 ring-black/10">
                    {p.status}
                  </span>
                </div>

                <div className="p-5">
                  <h2 className="text-lg font-black">{p.name}</h2>
                  <p className="mt-1 min-h-[40px] text-sm text-neutral-600">
                    {p.blurb}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-black text-green-600">
                      ${p.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => add(p.id)}
                      disabled={soon}
                      className={
                        soon
                          ? 'rounded-lg bg-neutral-200 px-4 py-2 text-sm font-bold text-neutral-500'
                          : 'rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700'
                      }
                    >
                      {soon ? 'Soon' : 'Add'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <aside className="h-fit rounded-2xl border border-black/10 p-5 lg:sticky lg:top-24">
          <h2 className="text-xl font-black">
            Your bag{count > 0 && <span className="text-green-600"> ({count})</span>}
          </h2>

          {lines.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">
              Empty. Like the chart on a Sunday.
            </p>
          ) : (
            <>
              <ul className="mt-4 space-y-3">
                {lines.map(({ product, qty }) => (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 rounded-xl bg-neutral-50 p-2.5"
                  >
                    <Image
                      src={product.art}
                      alt=""
                      width={44}
                      height={44}
                      className="rounded-lg object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{product.name}</p>
                      <p className="text-xs text-neutral-500">
                        ${product.price.toFixed(2)} × {qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => drop(product.id)}
                        aria-label={`Remove one ${product.name}`}
                        className="h-6 w-6 rounded-md bg-white text-sm font-black ring-1 ring-black/10"
                      >
                        −
                      </button>
                      <button
                        onClick={() => add(product.id)}
                        aria-label={`Add one ${product.name}`}
                        className="h-6 w-6 rounded-md bg-white text-sm font-black ring-1 ring-black/10"
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-black text-green-600">
                  ${total.toFixed(2)}
                </span>
              </div>

              <button className="mt-4 w-full rounded-xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-700">
                Checkout
              </button>
              <p className="mt-3 text-center text-[11px] text-neutral-400">
                Checkout isn&apos;t wired to a payment provider yet.
              </p>
            </>
          )}
        </aside>
      </div>

      <footer className="border-t border-black/10 px-5 py-12 text-center text-sm text-neutral-500">
        <p className="font-bold text-black">CATWIFWOOD — $WOOD</p>
        <p className="mt-2">Robinhood Chain 4663</p>
      </footer>
    </div>
  )
}
