'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ensureProfile } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types/database'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type AuthFormProps = {
  mode: 'sign-in' | 'sign-up'
}

export function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === 'sign-up'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('operator')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setError('')
    setSuccessMessage('')

    try {
      const supabase = createClient()

      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() } },
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        if (!data.session) {
          setSuccessMessage(
            'Account created! Check your email to confirm your address, then sign in.'
          )
          return
        }

        // Auto-confirmed — create profile and redirect.
        const profileResult = await ensureProfile(fullName.trim(), role)
        if (profileResult?.error) {
          setError(profileResult.error)
          return
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError.message)
          return
        }

        // Ensure profile exists (creates one automatically for new users).
        await ensureProfile()
      }

      window.location.assign('/')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unexpected error during ${isSignUp ? 'sign up' : 'sign in'}.`
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        {isSignUp ? 'Create your account' : 'Welcome back'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {isSignUp
          ? 'Start managing your logistics operations'
          : 'Sign in to access your CRM dashboard'}
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="full-name"
              type="text"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isPending}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition"
            />
          </div>
        )}

        {isSignUp && (
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)} disabled={isPending}>
              <SelectTrigger
                id="role"
                className="w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20"
              >
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-gray-500">Admin role is only assigned by an existing admin.</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isPending}
            minLength={6}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending
            ? isSignUp
              ? 'Creating account…'
              : 'Signing in…'
            : isSignUp
              ? 'Create Account'
              : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <Link
          href={isSignUp ? '/login' : '/signup'}
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          {isSignUp ? 'Sign in' : 'Create one'}
        </Link>
      </p>
    </div>
  )
}