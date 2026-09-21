import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      navigate('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl bg-[var(--surface)] rounded-3xl shadow-lg px-10 py-12">

        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">
            Welcome to CareerPilot AI
          </h1>

          <p className="mt-3 text-lg text-[var(--text-muted)]">
            Sign in to continue your career journey.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">

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

          {/* Password */}
          <div>
            <label className="block text-base font-medium text-[var(--text-primary)] mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-primary)] px-5 py-4 text-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
            />

            {/* Forgot Password */}
            <div className="flex justify-end mt-2">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Create Account */}
        <div className="mt-8 text-center text-base text-[var(--text-muted)]">
          Don't have an account?{' '}

          <Link
            to="/register"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Create Account
          </Link>
        </div>

      </div>
    </div>
  )
}

export default Login
