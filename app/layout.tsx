import type { Metadata } from 'next'
import { Instrument_Serif, Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// Used for the editorial headings; the heavy sans stays for the loud stuff.
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://catwifwood.vercel.app',
  ),
  title: 'catwifwood — $WOOD',
  description:
    'The tail that wags the market. $WOOD, launching on Robinhood Chain 4663.',
  openGraph: {
    title: 'catwifwood — $WOOD',
    description: 'The tail that wags the market. Robinhood Chain 4663.',
    images: ['/art/logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  )
}
