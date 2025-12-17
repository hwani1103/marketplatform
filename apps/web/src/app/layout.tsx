import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Market Regime Platform',
  description: '거시 시장 상태 요약 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
