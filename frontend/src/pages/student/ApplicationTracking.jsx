import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const API_BASE_URL = 'https://careerpilot-ai-backend-3kr1.onrender.com'

function ApplicationTracking() {
  const navigate = useNavigate()

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
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
        `${API_BASE_URL}/api/student/applications?email=${encodeURIComponent(
          user.email
        )}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Unable to load applications.'
        )
      }

      setApplications(
        Array.isArray(data.applications)
          ? data.applications
          : []
      )
    } catch (err) {
      console.error('Application tracking error:', err)

      setError(
        err.message ||
          'Unable to load your applications.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // STATUS HELPERS
  // ============================================================

  const getStatusLabel = (status) => {
    const normalizedStatus =
      String(status || 'applied').toLowerCase()

    const labels = {
      applied: 'Applied',
      shortlisted: 'Shortlisted',
      interview: 'Interview',
      selected: 'Selected',
      rejected: 'Rejected',
    }

    return labels[normalizedStatus] || 'Applied'
  }

  const getStatusStep = (status) => {
    const normalizedStatus =
      String(status || 'applied').toLowerCase()

    const steps = {
      applied: 1,
      shortlisted: 2,
      interview: 3,
      selected: 4,
      rejected: 0,
    }

    return steps[normalizedStatus] ?? 1
  }

  const getStatusClasses = (status) => {
    const normalizedStatus =
      String(status || 'applied').toLowerCase()

    if (normalizedStatus === 'selected') {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    }

    if (normalizedStatus === 'rejected') {
      return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
    }

    if (normalizedStatus === 'interview') {
      return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    }

    if (normalizedStatus === 'shortlisted') {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    }

    return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200'
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return 'Not available'
    }

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
      return 'Not available'
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // ============================================================
  // SUMMARY COUNTS
  // ============================================================

  const counts = {
    applied: applications.filter(
      (application) =>
        String(application.status).toLowerCase() === 'applied'
    ).length,

    shortlisted: applications.filter(
      (application) =>
        String(application.status).toLowerCase() === 'shortlisted'
    ).length,

    interview: applications.filter(
      (application) =>
        String(application.status).toLowerCase() === 'interview'
    ).length,

    selected: applications.filter(
      (application) =>
        String(application.status).toLowerCase() === 'selected'
    ).length,

    rejected: applications.filter(
      (application) =>
        String(application.status).toLowerCase() === 'rejected'
    ).length,
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-[var(--surface-hover)]" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl bg-[var(--surface)]"
                />
              ))}
            </div>

            <div className="h-64 rounded-2xl bg-[var(--surface)]" />
            <div className="h-64 rounded-2xl bg-[var(--surface)]" />
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)]">
        <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-4">
          <div className="w-full rounded-2xl border border-red-200 dark:border-red-800 bg-[var(--surface)] p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 text-2xl">
              !
            </div>

            <h2 className="mb-2 text-xl font-bold text-[var(--text-primary)]">
              Unable to Load Applications
            </h2>

            <p className="mb-6 text-sm leading-6 text-[var(--text-secondary)]">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchApplications}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-[var(--border-color)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <Link
                to="/dashboard"
                className="mb-2 inline-flex items-center text-sm font-medium text-[var(--text-muted)] transition hover:text-blue-600 dark:text-blue-400"
              >
                ← Dashboard
              </Link>

              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                My Applications
              </h1>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Track the progress of your job applications.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchApplications}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--page-bg)]"
            >
              Refresh
            </button>

          </div>
        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <section className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <SummaryCard
              label="Applied"
              count={counts.applied}
            />

            <SummaryCard
              label="Shortlisted"
              count={counts.shortlisted}
            />

            <SummaryCard
              label="Interview"
              count={counts.interview}
            />

            <SummaryCard
              label="Selected"
              count={counts.selected}
            />

            <SummaryCard
              label="Rejected"
              count={counts.rejected}
            />

          </div>
        </section>

        {/* ====================================================
            EMPTY STATE
        ==================================================== */}

        {applications.length === 0 ? (

          <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-10 text-center shadow-sm">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-2xl">
              📄
            </div>

            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              No Applications Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
              You have not submitted any job applications yet.
              Explore placement opportunities and apply to jobs
              that match your profile.
            </p>

            <Link
              to="/placement-opportunities"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View Opportunities
            </Link>

          </section>

        ) : (

          /* ==================================================
             APPLICATION LIST
          ================================================== */

          <section className="space-y-6">

            {applications.map((application) => {

              const status =
                String(
                  application.status || 'applied'
                ).toLowerCase()

              const currentStep =
                getStatusStep(status)

              return (

                <article
                  key={application.id}
                  className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] shadow-sm"
                >

                  {/* =================================================
                      APPLICATION HEADER
                  ================================================= */}

                  <div className="border-b border-[var(--border-color)] p-5 sm:p-6">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      <div>

                        <div className="flex flex-wrap items-center gap-3">

                          <h2 className="text-xl font-bold text-[var(--text-primary)]">
                            {application.job_title || 'Job'}
                          </h2>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              status
                            )}`}
                          >
                            {getStatusLabel(status)}
                          </span>

                        </div>

                        <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">
                          {application.company || 'Company'}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--text-muted)]">

                          <span>
                            📍 {application.location || 'Not specified'}
                          </span>

                          <span>
                            💰 {application.salary || 'Not specified'}
                          </span>

                          <span>
                            Applied {formatDate(application.applied_at)}
                          </span>

                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/job-match/${application.job_id}`
                          )
                        }
                        className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/40 px-4 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 transition hover:bg-blue-100 dark:bg-blue-950/50"
                      >
                        View Match Details
                      </button>

                    </div>

                  </div>

                  {/* =================================================
                      STATUS TRACKER
                  ================================================= */}

                  <div className="p-5 sm:p-6">

                    <h3 className="mb-6 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
                      Application Progress
                    </h3>

                    {status === 'rejected' ? (

                      <div className="rounded-xl border border-red-100 bg-red-50 dark:bg-red-950/40 p-4">

                        <div className="flex items-start gap-3">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:text-red-300">
                            !
                          </div>

                          <div>

                            <p className="font-semibold text-red-800">
                              Application Rejected
                            </p>

                            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                              This application is no longer active.
                            </p>

                          </div>

                        </div>

                      </div>

                    ) : (

                      <div className="relative">

                        {/* Connector */}

                        <div className="absolute left-5 right-5 top-5 hidden h-0.5 bg-[var(--surface-hover)] sm:block" />

                        <div
                          className="absolute left-5 top-5 hidden h-0.5 bg-blue-600 transition-all sm:block"
                          style={{
                            width:
                              currentStep === 1
                                ? '0%'
                                : currentStep === 2
                                ? '33.33%'
                                : currentStep === 3
                                ? '66.66%'
                                : '100%',
                          }}
                        />

                        <div className="grid gap-5 sm:grid-cols-4">

                          <StatusStep
                            number="1"
                            label="Applied"
                            active={currentStep >= 1}
                          />

                          <StatusStep
                            number="2"
                            label="Shortlisted"
                            active={currentStep >= 2}
                          />

                          <StatusStep
                            number="3"
                            label="Interview"
                            active={currentStep >= 3}
                          />

                          <StatusStep
                            number="4"
                            label="Selected"
                            active={currentStep >= 4}
                          />

                        </div>

                      </div>

                    )}

                  </div>

                  {/* =================================================
                      FOOTER
                  ================================================= */}

                  <div className="flex flex-col gap-3 border-t border-[var(--border-color)] bg-[var(--page-bg)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

                    <p className="text-sm text-[var(--text-muted)]">
                      Application status:{' '}
                      <span className="font-semibold text-[var(--text-secondary)]">
                        {getStatusLabel(status)}
                      </span>
                    </p>

                    <Link
                      to="/placement-opportunities"
                      className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 dark:text-blue-300"
                    >
                      Find More Opportunities →
                    </Link>

                  </div>

                </article>

              )
            })}

          </section>

        )}

      </main>

    </div>
  )
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({ label, count }) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-sm">

      <p className="text-sm font-medium text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
        {count}
      </p>

    </div>
  )
}

// ============================================================
// STATUS STEP
// ============================================================

function StatusStep({
  number,
  label,
  active,
}) {
  return (
    <div className="relative z-10 flex items-center gap-3 sm:flex-col sm:gap-2 sm:text-center">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
          active
            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
            : 'border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-muted)]'
        }`}
      >
        {active ? '✓' : '○'}
      </div>

      <span
        className={`text-sm font-semibold transition-colors ${
          active
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-muted)]'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

export default ApplicationTracking