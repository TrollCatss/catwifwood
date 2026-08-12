import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
