'use client'

import { useAppSelector } from '@/lib/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { UserRole } from '@hassad/shared'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isInitialized } = useAppSelector((state) => state.auth)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && isInitialized) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (user?.role !== UserRole.CLIENT) {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, user, router, mounted, isInitialized])

  if (!mounted || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground animate-pulse">Initializing Portal...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== UserRole.CLIENT) {
    return null
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        Client Portal Header
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
