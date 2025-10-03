import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { LoginPage } from '../pages/LoginPage'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?: 'admin' | 'agent' | 'user'
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!user || !profile) {
    return <LoginPage />
  }

  // Check role requirements
  if (requireRole) {
    const roleHierarchy = { admin: 3, agent: 2, user: 1 }
    const userLevel = roleHierarchy[profile.role]
    const requiredLevel = roleHierarchy[requireRole]

    if (userLevel < requiredLevel) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400">
              You need {requireRole} permissions to access this page.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Current role: {profile.role}
            </p>
          </div>
        </div>
      )
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>
}
