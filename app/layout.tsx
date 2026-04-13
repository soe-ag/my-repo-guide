import type { Metadata } from 'next'
import Link from 'next/link'
import { Cormorant_Garamond, Source_Serif_4, Space_Mono, Work_Sans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Providers } from '@/components/providers'

const displayFont = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
})

const bodyFont = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '600', '700'],
})

const uiFont = Work_Sans({
  subsets: ['latin'],
  variable: '--font-ui',
  weight: ['400', '500', '600', '700'],
})

const monoFont = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'RepoGuide — GitHub Repo Analyzer',
  description: 'Analyze any GitHub repository and generate a comprehensive learning guide with AI.',
  icons: {
    icon: '/favicon.svg',
  },
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
        displayFont.variable,
        bodyFont.variable,
        uiFont.variable,
        monoFont.variable
      )}
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          <div className="flex min-h-full flex-col">
            <div className="border-b-2 border-black bg-black text-white">
              <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-2 text-[11px] uppercase tracking-[0.28em] sm:px-6 lg:px-8">
                <span className="font-mono">RepoGuide</span>
                <span className="hidden font-mono sm:inline">
                  {/* Editorial intelligence for GitHub repositories */}
                </span>
              </div>
            </div>

            <header className="border-b border-black bg-background">
              <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
                <div className="space-y-2">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Printed logic for living codebases
                  </p>
                  <Link
                    href="/"
                    className="inline-block font-display text-4xl leading-none tracking-[-0.04em] text-foreground transition-colors hover:text-link sm:text-5xl"
                  >
                    RepoGuide
                  </Link>
                </div>

                <div className="max-w-xl space-y-2 text-left lg:text-right">
                  <p className="font-ui text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Analyze repositories, export readable briefings, and keep research in motion.
                  </p>
                </div>
              </div>
            </header>

            <div className="flex-1">{children}</div>

            <footer className="mt-16 border-t-2 border-black bg-[#1a1a1a] text-white">
              <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
                <div className="space-y-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/70">
                    Footer Ink
                  </p>
                  <p className="font-display text-3xl leading-none tracking-[-0.04em] sm:text-4xl">
                    Code reading with a newsroom spine.
                  </p>
                </div>

                <div className="grid gap-4 border-t border-white/20 pt-4 font-ui text-sm sm:grid-cols-2 lg:border-t-0 lg:pt-0">
                  <p className="text-white/80">
                    Public repository analysis, AI-assisted orientation, and exportable markdown
                    reports.
                  </p>
                  <div className="space-y-2">
                    <Link
                      href="/"
                      className="block text-white underline decoration-white/40 underline-offset-4 transition-colors hover:text-link"
                    >
                      Home
                    </Link>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/60">
                      Built with Next.js 16 and Convex
                    </p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
