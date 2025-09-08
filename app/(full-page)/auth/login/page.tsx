'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Card } from 'primereact/card'
import { Message } from 'primereact/message'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid email or password')
        toast.error('Invalid email or password')
      } else {
        const session = await getSession()
        if (session?.user?.role === 'SUPER_ADMIN') {
          router.push('/super-admin')
        } else if (session?.user?.role === 'HOTEL_ADMIN') {
          router.push('/hotel-dashboard')
        } else {
          router.push('/')
        }
        toast.success('Login successful!')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <Card className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">HotelFeedback Pro</h1>
            <h2 className="text-2xl font-semibold text-gray-900">Sign In</h2>
            <p className="text-gray-600 mt-2">Access your hotel dashboard</p>
          </div>

          {error && (
            <Message severity="error" text={error} className="mb-4" />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <InputText
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Password
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                placeholder="Enter your password"
                toggleMask
                feedback={false}
                required
              />
            </div>

            <Button
              type="submit"
              label="Sign In"
              className="w-full"
              loading={loading}
              disabled={loading}
            />
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign up for free
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
              Forgot your password?
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
