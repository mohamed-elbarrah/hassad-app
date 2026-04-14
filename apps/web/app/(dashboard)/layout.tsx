'use client'

import { useAppSelector } from '@/lib/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { UserRole } from '@hassad/shared'

export default function DashboardLayout({
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
      } else if (user?.role === UserRole.CLIENT) {
        router.push('/portal')
      }
    }
  }, [isAuthenticated, user, router, mounted, isInitialized])

  if (!mounted || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground animate-pulse">Initializing Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role === UserRole.CLIENT) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        Dashboard Header (Role: {user?.role})
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
