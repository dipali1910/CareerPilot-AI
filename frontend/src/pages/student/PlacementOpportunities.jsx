import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = 'http://127.0.0.1:8000'

function PlacementOpportunities() {
  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `${API_URL}/api/student/placement-opportunities?email=student%40careerpilot.ai`
      )

      if (!response.ok) {
        throw new Error('Unable to load placement opportunities.')
      }

      const result = await response.json()

      setJobs(result.jobs || [])
      setStudent(result.student || null)
    } catch (err) {
      console.error(err)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Loading Placement Opportunities...
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Finding suitable placement opportunities for you.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">

          <h1 className="text-2xl font-bold text-slate-900">
            Unable to load placement opportunities
          </h1>

          <p className="mt-3 text-red-600">
            {error}
          </p>

          <button
            onClick={fetchJobs}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Try Again
          </button>

          <div className="mt-5">
            <Link
              to="/dashboard"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </Link>
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-8">

      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-8">

          <Link
            to="/dashboard"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
                Placement Opportunities
              </h1>

              <p className="mt-2 text-base text-slate-500 sm:text-lg">
                Explore placement opportunities matched to your profile.
              </p>
            </div>

            <button
              onClick={fetchJobs}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 lg:w-auto"
            >
              Refresh Opportunities
            </button>

          </div>

        </div>


        {/* Student Summary */}

        {student && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Opportunities for
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {student.name}
                </h2>

                <p className="mt-1 text-slate-500">
                  {student.degree} · {student.specialization}
                </p>

              </div>

              <div className="rounded-xl bg-blue-50 px-5 py-4">

                <p className="text-xs font-medium text-blue-600">
                  Target Role
                </p>

                <p className="mt-1 font-bold text-blue-700">
                  {student.target_role || 'Not specified'}
                </p>

              </div>

            </div>

          </div>
        )}


        {/* Summary */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Available Opportunities
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {jobs.length}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Suitable Matches
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {jobs.filter(
                (job) => Number(job.match_score || 0) >= 70
              ).length}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Target Role
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              {student?.target_role || '—'}
            </p>

          </div>

        </div>


        {/* Job List */}

        <div className="mb-5">

          <h2 className="text-2xl font-bold text-slate-900">
            Available Placements
          </h2>

          <p className="mt-1 text-slate-500">
            Compare opportunities and check your profile match.
          </p>

        </div>


        {jobs.length === 0 ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <h3 className="text-xl font-bold text-slate-900">
              No placement opportunities found
            </h3>

            <p className="mt-2 text-slate-500">
              Check again after updating your profile.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {jobs.map((job) => (

              <article
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >

                {/* Company + Match */}

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-sm font-medium text-blue-600">
                      {job.company || 'Company'}
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-slate-900">
                      {job.role || job.title || 'Placement Opportunity'}
                    </h3>

                  </div>

                  <div className="shrink-0 rounded-xl bg-blue-50 px-4 py-3 text-center">

                    <p className="text-xs text-slate-500">
                      Match
                    </p>

                    <p className="mt-1 text-xl font-bold text-blue-600">
                      {job.match_score ?? 0}%
                    </p>

                  </div>

                </div>


                {/* Job Information */}

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="rounded-xl bg-slate-50 p-3">

                    <p className="text-xs text-slate-500">
                      Location
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {job.location || 'Not specified'}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">

                    <p className="text-xs text-slate-500">
                      Salary
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {job.salary || 'Not specified'}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">

                    <p className="text-xs text-slate-500">
                      Experience
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {job.experience || 'Fresher'}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">

                    <p className="text-xs text-slate-500">
                      Deadline
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {job.deadline || 'Not specified'}
                    </p>

                  </div>

                </div>


                {/* Required Skills */}

                {job.required_skills?.length > 0 && (

                  <div className="mt-5">

                    <p className="text-sm font-semibold text-slate-900">
                      Required Skills
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">

                      {job.required_skills.map((skill) => (

                        <span
                          key={skill}
                          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
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

                    <p className="text-sm font-semibold text-slate-900">
                      Eligibility
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {job.eligibility}
                    </p>

                  </div>

                )}


                {/* Actions */}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                  <button
                    onClick={() =>
                      navigate(
                        `/job-match/${job.id}`
                      )
                    }
                    className="flex-1 rounded-xl border border-blue-600 px-5 py-3 font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    View Match
                  </button>

                  <button
                    onClick={() =>
                      navigate(
                        `/job-match/${job.id}`
                      )
                    }
                    className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    View Opportunity
                  </button>

                </div>

              </article>

            ))}

          </div>

        )}


        {/* Footer */}

        <p className="py-8 text-center text-xs text-slate-400">
          Placement opportunities shown in this academic project
          are sample demonstration data.
        </p>

      </div>

    </div>
  )
}

export default PlacementOpportunities