import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const API_URL = 'http://127.0.0.1:8000'

function PlacementOpportunities() {
  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [student, setStudent] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('All')
  const [matchFilter, setMatchFilter] = useState('all')
  const [sortBy, setSortBy] = useState('match')

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user?.email) {
        navigate('/login')
        return
      }

      const response = await fetch(
        `${API_URL}/api/student/placement-opportunities?email=${encodeURIComponent(
          user.email
        )}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        throw new Error(
          errorData.detail ||
            errorData.message ||
            'Unable to load placement opportunities.'
        )
      }

      const result = await response.json()

      setJobs(result.jobs || [])
      setStudent(result.student || null)
    } catch (err) {
      console.error('Placement opportunities error:', err)

      setError(
        err.message || 'Failed to load placement opportunities.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const locations = useMemo(() => {
    return [
      'All',
      ...Array.from(
        new Set(
          jobs
            .map((job) => job.location)
            .filter(Boolean)
        )
      ),
    ]
  }, [jobs])

  const filteredJobs = useMemo(() => {
    let result = [...jobs]

    const query = search.trim().toLowerCase()

    if (query) {
      result = result.filter((job) => {
        const searchableText = [
          job.company,
          job.role,
          job.title,
          job.location,
          ...(job.required_skills || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(query)
      })
    }

    if (locationFilter !== 'All') {
      result = result.filter(
        (job) => job.location === locationFilter
      )
    }

    if (matchFilter === '80') {
      result = result.filter(
        (job) => Number(job.match_score || 0) >= 80
      )
    }

    if (matchFilter === '70') {
      result = result.filter(
        (job) => Number(job.match_score || 0) >= 70
      )
    }

    if (matchFilter === '60') {
      result = result.filter(
        (job) => Number(job.match_score || 0) >= 60
      )
    }

    if (matchFilter === '50') {
      result = result.filter(
        (job) => Number(job.match_score || 0) >= 50
      )
    }

    if (sortBy === 'match') {
      result.sort(
        (a, b) =>
          Number(b.match_score || 0) -
          Number(a.match_score || 0)
      )
    }

    if (sortBy === 'deadline') {
      result.sort((a, b) =>
        String(a.deadline || '').localeCompare(
          String(b.deadline || '')
        )
      )
    }

    if (sortBy === 'company') {
      result.sort((a, b) =>
        String(a.company || '').localeCompare(
          String(b.company || '')
        )
      )
    }

    return result
  }, [
    jobs,
    search,
    locationFilter,
    matchFilter,
    sortBy,
  ])

  const suitableCount = jobs.filter(
    (job) => Number(job.match_score || 0) >= 70
  ).length

  const getMatchStyle = (score) => {
    const value = Number(score || 0)

    if (value >= 80) {
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        label: 'Strong Match',
      }
    }

    if (value >= 70) {
      return {
        badge: 'bg-blue-50 text-blue-700 dark:text-blue-300 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
        label: 'Good Match',
      }
    }

    if (value >= 50) {
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
        label: 'Partial Match',
      }
    }

    return {
      badge: 'bg-[var(--page-bg)] text-[var(--text-secondary)] border-[var(--border-color)]',
      label: 'Low Match',
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-6">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--border-color)] border-t-blue-600 dark:border-t-blue-400" />

          <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">
            Loading Placement Opportunities...
          </h2>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Finding suitable opportunities for your profile.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-[var(--surface)] p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xl">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-[var(--text-primary)]">
            Unable to load placement opportunities
          </h1>

          <p className="mt-3 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchJobs}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-400"
          >
            Try Again
          </button>

          <div className="mt-5">
            <Link
              to="/dashboard"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-7">
          <Link
            to="/dashboard"
            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Career & Placement
              </p>

              <h1 className="mt-1 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                Placement Opportunities
              </h1>

              <p className="mt-2 max-w-2xl text-base text-[var(--text-secondary)]">
                Explore opportunities matched with your skills,
                career interests, and target role.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchJobs}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-400 lg:w-auto"
            >
              Refresh Opportunities
            </button>
          </div>
        </div>

        {/* Student Profile Summary */}
        {student && (
          <div className="mb-6 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Personalized opportunities for
                </p>

                <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                  {student.name}
                </h2>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {student.degree} · {student.specialization}
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40 px-5 py-4 dark:bg-blue-950/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  Target Role
                </p>

                <p className="mt-1 font-bold text-blue-700 dark:text-blue-300">
                  {student.target_role || 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-sm">
            <p className="text-sm text-[var(--text-secondary)]">
              Available Opportunities
            </p>

            <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
              {jobs.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-sm">
            <p className="text-sm text-[var(--text-secondary)]">
              Strong Matches
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {suitableCount}
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Match score 70% or above
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-sm">
            <p className="text-sm text-[var(--text-secondary)]">
              Target Role
            </p>

            <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">
              {student?.target_role || '—'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-7 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

            {/* Search */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-[var(--text-secondary)]">
                Search Opportunities
              </label>

              <div className="relative mt-2">
                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search role, company or skill..."
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] text-[var(--text-primary)] px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-[var(--surface)] focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-secondary)]">
                Location
              </label>

              <select
                value={locationFilter}
                onChange={(event) =>
                  setLocationFilter(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-[var(--surface)]"
              >
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Match */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-secondary)]">
                Match Score
              </label>

              <select
                value={matchFilter}
                onChange={(event) =>
                  setMatchFilter(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-[var(--surface)]"
              >
                <option value="all">All Matches</option>
                <option value="80">80% and above</option>
                <option value="70">70% and above</option>
                <option value="60">60% and above</option>
                <option value="50">50% and above</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-color)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Showing{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {filteredJobs.length}
              </span>{' '}
              of {jobs.length} opportunities
            </p>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] outline-none focus:border-blue-500"
            >
              <option value="match">
                Sort: Highest Match
              </option>
              <option value="deadline">
                Sort: Closing Soon
              </option>
              <option value="company">
                Sort: Company
              </option>
            </select>
          </div>
        </div>

        {/* Section Heading */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Available Placements
          </h2>

          <p className="mt-1 text-[var(--text-secondary)]">
            See how well each opportunity matches your current profile.
          </p>
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--page-bg)] text-2xl">
              🔎
            </div>

            <h3 className="mt-4 text-xl font-bold text-[var(--text-primary)]">
              No matching opportunities found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-[var(--text-secondary)]">
              Try changing your search or filters to see more placement opportunities.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch('')
                setLocationFilter('All')
                setMatchFilter('all')
              }}
              className="mt-5 rounded-xl border border-blue-600 px-5 py-2.5 font-semibold text-blue-600 dark:border-blue-400 dark:text-blue-400 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

            {filteredJobs.map((job) => {
              const matchStyle = getMatchStyle(job.match_score)

              const requiredCount =
                job.required_skills?.length || 0

              const matchedCount =
                job.matched_skills?.length || 0

              return (
                <article
                  key={job.id}
                  className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800"
                >
                  <div className="p-6">

                    {/* Job Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {job.company || 'Company'}
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                          {job.role ||
                            job.title ||
                            'Placement Opportunity'}
                        </h3>
                      </div>

                      <div className="shrink-0 text-right">
                        <div
                          className={`rounded-xl border px-3 py-2 ${matchStyle.badge}`}
                        >
                          <p className="text-xs font-medium">
                            Match
                          </p>

                          <p className="text-xl font-bold">
                            {job.match_score ?? 0}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Match Label */}
                    <div className="mt-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${matchStyle.badge}`}
                      >
                        {matchStyle.label}
                      </span>
                    </div>

                    {/* Job Information */}
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
                        <p className="text-xs text-[var(--text-secondary)]">
                          Location
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                          {job.location || 'Not specified'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
                        <p className="text-xs text-[var(--text-secondary)]">
                          Salary
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                          {job.salary || 'Not specified'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
                        <p className="text-xs text-[var(--text-secondary)]">
                          Experience
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                          {job.experience || 'Fresher'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
                        <p className="text-xs text-[var(--text-secondary)]">
                          Apply By
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                          {job.deadline || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {job.description && (
                      <div className="mt-5">
                        <p className="text-sm leading-6 text-[var(--text-secondary)]">
                          {job.description}
                        </p>
                      </div>
                    )}

                    {/* Skill Match */}
                    <div className="mt-5 rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Your Skill Match
                        </p>

                        <p className="text-xs font-medium text-[var(--text-secondary)]">
                          {matchedCount} of {requiredCount} matched
                        </p>
                      </div>

                      {/* Matched Skills */}
                      {job.matched_skills?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                            You Have
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {job.matched_skills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                              >
                                ✓ {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills */}
                      {job.missing_skills?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                            Skills to Improve
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {job.missing_skills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 px-3 py-1.5 text-xs font-semibold text-amber-700"
                              >
                                + {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Required Skills */}
                    {job.required_skills?.length > 0 && (
                      <div className="mt-5">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Required Skills
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {job.required_skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-[var(--page-bg)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Eligibility */}
                    {job.eligibility && (
                      <div className="mt-5">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Eligibility
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                          {job.eligibility}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/job-match/${job.id}`)
                        }
                        className="flex-1 rounded-xl border border-blue-600 px-5 py-3 font-semibold text-blue-600 dark:border-blue-400 dark:text-blue-400 dark:text-blue-400 transition hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        View Match
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/job-match/${job.id}`)
                        }
                        className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-400"
                      >
                        View Opportunity
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <p className="py-8 text-center text-xs text-[var(--text-muted)]">
          Placement opportunities are sample records for academic
          demonstration. Match scores and skill gaps are personalized
          based on the student's profile.
        </p>
      </div>
    </div>
  )
}

export default PlacementOpportunities