import { Link } from 'react-router-dom'

function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <h1 className="text-3xl font-bold text-slate-900">
          Create Your Account
        </h1>

        <p className="mt-2 text-slate-500">
          Start your CareerPilot AI journey.
        </p>

        <form className="mt-8 space-y-5">

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              type="password"
              placeholder="Create a password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Create Account
          </button>

          <div className="pt-2 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
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