import './globals.css'

export const metadata = {
  title: '$WOOD - The Cat Tail That Wags the Market',
  description: 'The most elite cat-themed merchandise and ecosystem on Robinhood Chain 4663',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-black text-black dark:text-white">
        {children}
      </body>
    </html>
  )
}
