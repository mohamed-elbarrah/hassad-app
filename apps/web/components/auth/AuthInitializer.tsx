'use client'

import { useEffect } from 'react'
import { useGetProfileQuery } from '@/features/auth/authApi'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { setCredentials, setInitialized } from '@/features/auth/authSlice'

/**
 * AuthInitializer component hydrates the Redux auth state from the HttpOnly 
 * session cookies on the first load.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const { isInitialized } = useAppSelector((state) => state.auth)
  
  // Skip if already initialized (e.g. after login)
  const { data: user, isSuccess, isError, isLoading } = useGetProfileQuery(undefined, {
    skip: isInitialized,
  })

  useEffect(() => {
    if (isSuccess && user) {
      // Hydrate state from the successful profile fetch (uses cookies)
      dispatch(setCredentials({ user }))
    } else if (isError) {
      dispatch(setInitialized(true))
    }
  }, [isSuccess, user, isError, dispatch])

  // Optional: You could return a global loader here if isLoading is true
  // but usually it's better to let layouts handle it.

  return <>{children}</>
}
