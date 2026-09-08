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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-lg px-10 py-12">

        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-950">
            Forgot Password?
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            Enter your email address and we will send you a password
            reset link.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">

          {/* Email */}
          <div>
            <label className="block text-base font-medium text-slate-900 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Success Message */}
          {message && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700">
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700">
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
        <div className="mt-8 text-center text-base text-slate-500">
          Remember your password?{' '}

          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  )
}

export default ForgotPassword