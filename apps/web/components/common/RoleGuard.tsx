'use client'

import { useAppSelector } from '@/lib/hooks'
import { UserRole } from '@hassad/shared'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  redirectTo?: string
}

/**
 * RoleGuard component protects client-side routes by checking the user's role.
 * It should be used within a layout or page that is already under the auth layout.
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard' 
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (user && !allowedRoles.includes(user.role)) {
        router.push(redirectTo)
      } else if (user && allowedRoles.includes(user.role)) {
        setHasAccess(true)
      }
    }
  }, [isAuthenticated, user, allowedRoles, router, mounted, redirectTo])

  if (!mounted || !hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
