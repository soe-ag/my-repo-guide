import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { cn } from '@/lib/utils'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: 'RepoGuide — GitHub Repo Analyzer',
  description: 'Analyze any GitHub repository and generate a comprehensive learning guide with AI.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-full',
        'antialiased',
        GeistSans.variable,
        GeistMono.variable,
        'font-sans'
      )}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
