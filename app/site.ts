/** Single place to add or change off-site links. */
export const SITE = {
  name: 'catwifwood',
  ticker: '$WOOD',
  chain: 'Robinhood Chain 4663',
  links: {
    telegram: 'https://t.me/catwifwood',
    x: 'https://x.com/catwifwood',
  },
} as const

/** Rendered in order wherever the socials appear. */
export const SOCIALS = [
  { key: 'x' as const, label: 'X', handle: '@catwifwood', href: SITE.links.x },
  {
    key: 'telegram' as const,
    label: 'Telegram',
    handle: 't.me/catwifwood',
    href: SITE.links.telegram,
  },
]
