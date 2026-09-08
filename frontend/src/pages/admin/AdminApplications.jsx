import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE_URL = 'http://127.0.0.1:8000'

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'selected', label: 'Selected' },
  { value: 'rejected', label: 'Rejected' },
]

function AdminApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `${API_BASE_URL}/api/admin/applications`
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
      console.error('Admin applications error:', err)
      setError(
        err.message || 'Unable to load applications.'
      )
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (applicationId, status) => {
    try {
      setUpdatingId(applicationId)
      setError('')
      setSuccessMessage('')

      const response = await fetch(
        `${API_BASE_URL}/api/admin/applications/${applicationId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Unable to update application status.'
        )
      }

      setApplications((previous) =>
        previous.map((application) =>
          String(application.id) === String(applicationId)
            ? { ...application, status }
            : application
        )
      )

      setSuccessMessage(
        'Application status updated successfully.'
      )

      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (err) {
      console.error('Status update error:', err)
      setError(
        err.message || 'Unable to update application status.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const counts = useMemo(() => {
    return {
      total: applications.length,
      applied: applications.filter(
        (item) => String(item.status).toLowerCase() === 'applied'
      ).length,
      shortlisted: applications.filter(
        (item) => String(item.status).toLowerCase() === 'shortlisted'
      ).length,
      interview: applications.filter(
        (item) => String(item.status).toLowerCase() === 'interview'
      ).length,
      selected: applications.filter(
        (item) => String(item.status).toLowerCase() === 'selected'
      ).length,
      rejected: applications.filter(
        (item) => String(item.status).toLowerCase() === 'rejected'
      ).length,
    }
  }, [applications])

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase()

    return applications.filter((application) => {
      const statusMatches =
        filter === 'all' ||
        String(application.status).toLowerCase() === filter

      if (!statusMatches) return false

      if (!query) return true

      return [
        application.student_name,
        application.student_email,
        application.job_title,
        application.company,
        application.location,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    })
  }, [applications, filter, search])

  const formatDate = (value) => {
    if (!value) return 'Not available'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return 'Not available'
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const statusClasses = (status) => {
    switch (String(status).toLowerCase()) {
      case 'selected':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'interview':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'shortlisted':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-slate-500 hover:text-blue-600"
              >
                ← Dashboard
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                Application Management
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Review student applications and update their placement status.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchApplications}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <SummaryCard label="Total" count={counts.total} />
          <SummaryCard label="Applied" count={counts.applied} />
          <SummaryCard label="Shortlisted" count={counts.shortlisted} />
          <SummaryCard label="Interview" count={counts.interview} />
          <SummaryCard label="Selected" count={counts.selected} />
          <SummaryCard label="Rejected" count={counts.rejected} />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <label className="sr-only" htmlFor="application-search">
                Search applications
              </label>
              <input
                id="application-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, job, company or email..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={filter === 'all'}
                onClick={() => setFilter('all')}
                label="All"
              />
              <FilterButton
                active={filter === 'applied'}
                onClick={() => setFilter('applied')}
                label="Applied"
              />
              <FilterButton
                active={filter === 'shortlisted'}
                onClick={() => setFilter('shortlisted')}
                label="Shortlisted"
              />
              <FilterButton
                active={filter === 'interview'}
                onClick={() => setFilter('interview')}
                label="Interview"
              />
              <FilterButton
                active={filter === 'selected'}
                onClick={() => setFilter('selected')}
                label="Selected"
              />
              <FilterButton
                active={filter === 'rejected'}
                onClick={() => setFilter('rejected')}
                label="Rejected"
              />
            </div>
          </div>
        </section>

        <section className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Loading applications...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <h2 className="text-lg font-bold text-slate-900">
                No applications found
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Try changing the status filter or search term.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredApplications.map((application) => {
                const currentStatus =
                  String(application.status || 'applied').toLowerCase()

                return (
                  <article
                    key={application.id}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-900">
                              {application.job_title || 'Job'}
                            </h2>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                                currentStatus
                              )}`}
                            >
                              {currentStatus.charAt(0).toUpperCase() +
                                currentStatus.slice(1)}
                            </span>
                          </div>

                          <p className="mt-2 font-medium text-slate-700">
                            {application.company || 'Company'}
                          </p>

                          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                            <Info label="Student" value={application.student_name} />
                            <Info label="Email" value={application.student_email} />
                            <Info label="Education" value={application.degree} />
                            <Info label="Target Role" value={application.target_role} />
                            <Info label="Location" value={application.location} />
                            <Info label="Applied" value={formatDate(application.applied_at)} />
                          </div>

                          {application.cover_letter && (
                            <div className="mt-5 rounded-xl bg-slate-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Application Message
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {application.cover_letter}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="w-full shrink-0 xl:w-64">
                          <label
                            htmlFor={`status-${application.id}`}
                            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            Update Status
                          </label>

                          <select
                            id={`status-${application.id}`}
                            value={currentStatus}
                            disabled={updatingId === application.id}
                            onChange={(event) =>
                              updateStatus(
                                application.id,
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>

                          {updatingId === application.id && (
                            <p className="mt-2 text-xs text-blue-600">
                              Updating status...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function SummaryCard({ label, count }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{count}</p>
    </div>
  )
}

function FilterButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate font-medium text-slate-700">
        {value || 'Not available'}
      </p>
    </div>
  )
}

export default AdminApplications
