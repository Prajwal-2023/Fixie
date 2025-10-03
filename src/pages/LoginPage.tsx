import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Loader2, LogIn, UserPlus, Mail, Lock, User, Shield, Users, Headphones } from 'lucide-react'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message || 'Failed to sign in')
        }
      } else {
        const { error } = await signUp(email, password, name)
        if (error) {
          setError(error.message || 'Failed to sign up')
        } else {
          // Auto-login after signup since email confirmation is disabled
          const { error: signInError } = await signIn(email, password)
          if (signInError) {
            setSuccess('Account created! You can now sign in.')
            setIsLogin(true)
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (role: 'admin' | 'agent' | 'user') => {
    setDemoLoading(true)
    setError('')
    setSuccess('')

    // Demo account credentials - simple and fixed
    const credentials = {
      admin: { email: 'admin@fixie.demo', password: 'admin123' },
      agent: { email: 'agent@fixie.demo', password: 'agent123' },
      user: { email: 'user@fixie.demo', password: 'user123' }
    }

    const { email, password } = credentials[role]

    try {
      // Just sign in - accounts should already exist
      const { error: signInError } = await signIn(email, password)
      
      if (signInError) {
        setError(`Demo account not ready. Please create it first: Email: ${email}, Password: ${password}`)
      }
    } catch (err) {
      setError('Failed to login with demo account')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fixie Pro</h1>
          <p className="text-gray-600 dark:text-gray-400">Enterprise Service Desk</p>
        </div>

        {/* Quick Login Demo Accounts */}
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-700 dark:text-blue-300">Demo Accounts</CardTitle>
            <CardDescription className="text-xs">Quick login for testing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin('admin')}
                disabled={demoLoading}
                className="text-xs flex flex-col h-auto py-2"
              >
                <Shield className="w-3 h-3 mb-1" />
                Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin('agent')}
                disabled={demoLoading}
                className="text-xs flex flex-col h-auto py-2"
              >
                <Headphones className="w-3 h-3 mb-1" />
                Agent
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin('user')}
                disabled={demoLoading}
                className="text-xs flex flex-col h-auto py-2"
              >
                <Users className="w-3 h-3 mb-1" />
                User
              </Button>
            </div>
            {demoLoading && (
              <p className="text-xs text-center text-gray-500">
                <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                Signing in...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Login/Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Welcome back to Fixie Pro' : 'Join Fixie Pro today'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                  setSuccess('')
                }}
                className="text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">What you'll get:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-700 dark:text-blue-300">
              <div>🎯 Advanced Ticketing</div>
              <div>🤖 AI Insights</div>
              <div>📚 Knowledge Base</div>
              <div>🔔 Real-time Alerts</div>
              <div>👥 Team Management</div>
              <div>📊 Analytics</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
