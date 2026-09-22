import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const API_BASE_URL = 'https://careerpilot-ai-backend-docker.onrender.com'

function SkillGap() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const loadSkillGaps = async () => {
    try {
      setLoading(true)
      setError('')

      // Get the ACTUAL currently logged-in Supabase user.
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        throw new Error(authError.message)
      }

      const user = authData?.user

      if (!user?.email) {
        throw new Error('No logged-in student account found.')
      }

      console.log('SKILL GAP LOGGED-IN USER:', user.email)

      // IMPORTANT:
      // The email comes directly from the current Supabase session.
      // There is NO demo email and NO hardcoded student.
      const response = await fetch(
        `${API_BASE_URL}/api/student/skill-gaps?email=${encodeURIComponent(
          user.email
        )}`
      )

      if (!response.ok) {
        throw new Error(
          `Skill Gap API failed with status ${response.status}`
        )
      }

      const result = await response.json()

      console.log('SKILL GAP API RESPONSE:', result)

      if (result.status !== 'success') {
        throw new Error(
          result.detail || 'Unable to load skill gap information.'
        )
      }

      setData(result)
    } catch (err) {
      console.error('SKILL GAP ERROR:', err)
      setError(err.message || 'Unable to load skill gap information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSkillGaps()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="h-4 w-32 animate-pulse rounded bg-[var(--border-color)]" />
            <div className="mt-4 h-9 w-72 animate-pulse rounded bg-[var(--border-color)]" />
            <div className="mt-3 h-5 w-[500px] max-w-full animate-pulse rounded bg-[var(--border-color)]" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-[var(--surface)] shadow-sm"
              />
            ))}
          </div>

          <div className="mt-8 h-96 animate-pulse rounded-2xl bg-[var(--surface)] shadow-sm" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-6">
            <h1 className="text-xl font-bold text-red-800 dark:text-red-200">
              Unable to load Skill Gap Analysis
            </h1>

            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>

            <button
              onClick={loadSkillGaps}
              className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  // Everything below comes directly from the API response.
  const student = data.student || {}
  const summary = data.summary || {}
  const gaps = Array.isArray(data.gaps) ? data.gaps : []

  const studentName = student.name || 'Student'
  const targetRole = student.target_role || 'Target career role'

  return (
    <div className="min-h-screen bg-[var(--page-bg)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* Back */}
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm font-medium text-[var(--text-secondary)] transition hover:text-blue-600 dark:text-blue-400"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Career Development
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
            Skill Gap Analysis
          </h1>

          <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">
            Identify the skills you need to strengthen for your target career.
          </p>
        </div>

        {/* Student Context */}
        <div className="mt-6 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Student
              </p>

              <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                {studentName}
              </h2>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {student.email || ''}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-950/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                Target Role
              </p>

              <p className="mt-1 font-semibold text-blue-900 dark:text-blue-200">
                {targetRole}
              </p>
            </div>

          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <SummaryCard
            label="Total Skill Gaps"
            value={summary.total_gaps ?? gaps.length}
            description="Skills requiring improvement"
          />

          <SummaryCard
            label="High Priority"
            value={summary.high_priority ?? 0}
            description="Focus on these first"
            highlight
          />

          <SummaryCard
            label="Medium Priority"
            value={summary.medium_priority ?? 0}
            description="Improve after high-priority skills"
          />

        </div>

        {/* Main Section */}
        <div className="mt-8">

          <div className="mb-5">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Skills to Improve
            </h2>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              These gaps are calculated from your current profile and your
              selected target role.
            </p>
          </div>

          {gaps.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-2xl">
                ✓
              </div>

              <h3 className="mt-4 text-lg font-bold text-emerald-900 dark:text-emerald-200">
                No Skill Gaps Found
              </h3>

              <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                Your current skills match the requirements for your target
                career role.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {gaps.map((gap) => {
                const currentLevel =
                  gap.current_level ||
                  gap.current_proficiency ||
                  'Not specified'

                const requiredLevel =
                  gap.required_level ||
                  gap.required_proficiency ||
                  'Not specified'

                const priority =
                  gap.priority ||
                  'medium'

                const normalizedPriority =
                  String(priority).toLowerCase()

                const isHigh =
                  normalizedPriority === 'high'

                const isMedium =
                  normalizedPriority === 'medium'

                return (
                  <div
                    key={gap.id || gap.skill}
                    className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800"
                  >

                    {/* Top */}
                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Skill Gap
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                          {gap.skill}
                        </h3>
                      </div>

                      <PriorityBadge
                        priority={normalizedPriority}
                      />

                    </div>

                    {/* Progress */}
                    <div className="mt-6">

                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-[var(--text-secondary)]">
                          Current Level
                        </span>

                        <span className="font-semibold capitalize text-[var(--text-primary)]">
                          {currentLevel}
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                        <div
                          className={`h-full rounded-full ${
                            isHigh
                              ? 'w-1/3 bg-red-500 dark:bg-red-400'
                              : isMedium
                              ? 'w-1/2 bg-amber-500 dark:bg-amber-400'
                              : 'w-2/3 bg-blue-500 dark:bg-blue-400'
                          }`}
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="font-medium text-[var(--text-secondary)]">
                          Required Level
                        </span>

                        <span className="font-semibold capitalize text-blue-700 dark:text-blue-300">
                          {requiredLevel}
                        </span>
                      </div>

                    </div>

                    {/* Improvement */}
                    <div className="mt-5 rounded-xl bg-[var(--page-bg)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Recommended Improvement
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                        Improve from{' '}
                        <span className="capitalize">
                          {currentLevel}
                        </span>{' '}
                        to{' '}
                        <span className="capitalize">
                          {requiredLevel}
                        </span>
                      </p>
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recommended Next Step */}
        <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 p-6 text-white shadow-lg md:p-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div className="max-w-2xl">

              <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
                Recommended Next Step
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Build your skills through a personalized roadmap
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Your learning roadmap is based on your identified skill gaps
                and target career role.
              </p>

            </div>

            <Link
              to="/roadmap"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] px-5 py-3 text-sm font-bold text-blue-700 dark:text-blue-300 shadow-sm transition hover:bg-blue-50"
            >
              View Learning Roadmap →
            </Link>

          </div>

        </div>

      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  description,
  highlight = false,
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-sm">
      <p className="text-sm font-medium text-[var(--text-secondary)]">
        {label}
      </p>

      <div className="mt-2 flex items-end gap-2">
        <span
          className={`text-3xl font-bold ${
            highlight
              ? 'text-red-600 dark:text-red-400'
              : 'text-[var(--text-primary)]'
          }`}
        >
          {value}
        </span>
      </div>

      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {description}
      </p>
    </div>
  )
}

function PriorityBadge({ priority }) {
  const styles = {
    high: 'bg-red-50 text-red-700 dark:text-red-300 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
    medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    low: 'bg-emerald-50 text-emerald-700 dark:text-emerald-300 border-emerald-200',
  }

  const style =
    styles[priority] ||
    'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-color)]'

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${style}`}
    >
      {priority} priority
    </span>
  )
}

export default SkillGap