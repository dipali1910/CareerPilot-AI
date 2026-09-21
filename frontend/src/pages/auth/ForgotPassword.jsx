import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleResetPassword = async (e) => {
    e.preventDefault()

    setLoading(true)
    setMessage('')
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: 'http://localhost:5173/update-password',
      }
    )

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage(
      'Password reset instructions have been sent to your email.'
    )

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl bg-[var(--surface)] rounded-3xl shadow-lg px-10 py-12">

        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">
            Forgot Password?
          </h1>

          <p className="mt-3 text-lg text-[var(--text-muted)]">
            Enter your email address and we will send you a password
            reset link.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">

          {/* Email */}
          <div>
            <label className="block text-base font-medium text-[var(--text-primary)] mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-primary)] px-5 py-4 text-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
            />
          </div>

          {/* Success Message */}
          {message && (
            <div className="rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-4 py-3 text-green-700 dark:text-green-300">
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Reset Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center text-base text-[var(--text-muted)]">
          Remember your password?{' '}

          <Link
            to="/login"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  )
}

export default ForgotPassword
