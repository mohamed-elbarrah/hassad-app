import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/globals.css'
import { Providers } from '@/providers/Providers'
import { AuthInitializer } from '@/components/auth/AuthInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hassad Platform',
  description: 'Full-stack SaaS platform for marketing agencies',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthInitializer>
            {children}
          </AuthInitializer>
        </Providers>
      </body>
    </html>
  )
}
