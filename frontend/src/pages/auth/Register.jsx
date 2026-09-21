import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

function Register() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRegister = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      setLoading(true)

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'student',
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (data?.user && !data.session) {
        setSuccess(
          'Account created successfully. Please check your email to confirm your account.'
        )
        return
      }

      navigate('/resume-upload')
    } catch (err) {
      console.error('Registration error:', err)

      setError(
        err?.message ||
          'Unable to create your account. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)] px-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-8 shadow-lg">

        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          Create Your Account
        </h1>

        <p className="mt-2 text-[var(--text-muted)]">
          Start your CareerPilot AI journey.
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 px-4 py-3 text-sm text-green-700 dark:text-green-300">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-8 space-y-5">

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
              Full Name
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
              disabled={loading}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-primary)] px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 disabled:bg-[var(--surface-secondary)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-primary)] px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 disabled:bg-[var(--surface-secondary)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              disabled={loading}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-primary)] px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 disabled:bg-[var(--surface-secondary)]"
            />

            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Password must contain at least 6 characters.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="pt-2 text-center text-sm text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Sign In
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}

export default Register
