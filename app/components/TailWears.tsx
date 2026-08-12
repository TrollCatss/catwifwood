import Image from 'next/image'

/**
 * The meme format the community actually runs with: the pose stays fixed, the
 * scene changes, and the tail wears the hat. The clip carries the morph and
 * the grid holds the stills for anyone who scrolls past before it loops.
 */
const SCENES = [
  { src: '/art/scenes/snow.jpg', caption: 'Bobble hat', place: 'Alps' },
  { src: '/art/scenes/summit.jpg', caption: 'Santa hat', place: 'Summit' },
  { src: '/art/scenes/beach.jpg', caption: 'Santa hat, shades', place: 'Tropics' },
  { src: '/art/scenes/autumn.jpg', caption: 'Knit beanie', place: 'Fall' },
  { src: '/art/scenes/city.jpg', caption: 'Santa hat, chain', place: 'Downtown' },
  { src: '/art/scenes/pool.jpg', caption: 'Santa hat, chain', place: 'The club' },
  { src: '/art/scenes/villa.jpg', caption: 'Straw hat', place: 'The villa' },
  { src: '/art/scenes/kitchen.jpg', caption: 'Toque, 3D glasses', place: 'Service' },
  { src: '/art/scenes/western.jpg', caption: 'Stetson', place: 'High noon' },
]

export default function TailWears() {
  return (
    <section id="wardrobe" className="border-t border-line px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow">The wardrobe</p>
            <h2 className="mt-4 font-serif text-[clamp(2.75rem,7vw,5rem)] leading-[0.92] tracking-tight">
              The tail
              <br />
              <em className="italic text-wood">wears</em> the hat
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-muted">
            He does not wear the hat. He has never worn the hat. The hat goes on
            the tail, and the tail goes wherever it likes.
          </p>
        </div>

        {/* The clip is the whole joke in motion; the stills below are the
            archive. Muted + playsInline so it can autoplay on mobile. */}
        <div className="mt-14 overflow-hidden rounded-sm bg-panel">
          <video
            className="mx-auto w-full max-w-2xl"
            poster="/art/tail-wears-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="The catwifwood tail wearing a different hat in each scene"
          >
            {/* WebM first: some Chromium builds ship without the proprietary
                H.264 decoder and would otherwise show only the poster. */}
            <source src="/art/tail-wears.webm" type="video/webm" />
            <source src="/art/tail-wears.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SCENES.map((s) => (
            <figure key={s.src} className="group">
              <div className="relative aspect-square overflow-hidden rounded-sm bg-panel">
                <Image
                  src={s.src}
                  alt={`${s.caption} — ${s.place}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 240px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <figcaption className="mt-2.5">
                <p className="text-xs font-semibold">{s.caption}</p>
                <p className="eyebrow mt-0.5 text-[9px]">{s.place}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
