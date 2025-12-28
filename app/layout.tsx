import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TFT World Runes Solver',
  description: 'Visual solver for The World Runes augment in Teamfight Tactics Set 16',
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

