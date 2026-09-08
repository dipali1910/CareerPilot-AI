import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

function JobMatchDetails() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchJobDetails()
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `http://127.0.0.1:8000/api/student/job-match/${jobId}?email=student%40careerpilot.ai`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Unable to load job details.'
        )
      }

      setJob(data.job)
      setStudent(data.student)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }

    if (score >= 60) {
      return 'bg-amber-50 text-amber-700 border-amber-200'
    }

    return 'bg-red-50 text-red-700 border-red-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-slate-200" />

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="h-7 w-72 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-48 rounded bg-slate-200" />
              <div className="mt-8 h-24 rounded bg-slate-100" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="h-64 rounded-2xl bg-white" />
              <div className="h-64 rounded-2xl bg-white lg:col-span-2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
          <div className="w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              !
            </div>

            <h1 className="mt-4 text-xl font-semibold text-slate-900">
              Unable to load job details
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              onClick={fetchJobDetails}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Try Again
            </button>

            <Link
              to="/placement-opportunities"
              className="mt-4 block text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to Placement Opportunities
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return null
  }

  const matchScore = job.match_score || 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link
              to="/placement-opportunities"
              className="text-sm font-medium text-slate-500 hover:text-blue-600"
            >
              ← Placement Opportunities
            </Link>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Job Match Details
            </h1>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-xs text-slate-400">
              CareerPilot AI
            </p>

            <p className="text-sm font-medium text-slate-700">
              {student?.name}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Job Hero */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Placement Opportunity
                </span>

                {job.experience && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {job.experience}
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-3xl font-bold text-slate-900">
                {job.role || job.title}
              </h2>

              <p className="mt-2 text-lg font-medium text-slate-600">
                {job.company}
              </p>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
                <span>📍 {job.location}</span>
                <span>💰 {job.salary}</span>
                <span>⏱ {job.experience}</span>
              </div>
            </div>

            {/* Match Score */}
            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:w-64">
              <p className="text-sm font-medium text-slate-500">
                Your Match Score
              </p>

              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  {matchScore}
                </span>

                <span className="mb-1 text-lg text-slate-500">
                  %
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${matchScore}%`,
                  }}
                />
              </div>

              <div
                className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getScoreColor(
                  matchScore
                )}`}
              >
                {matchScore >= 80
                  ? 'Excellent Match'
                  : matchScore >= 60
                  ? 'Good Match'
                  : 'Develop Your Skills'}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Quick Information */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Job Information
              </h3>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Location
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {job.location || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Salary
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {job.salary || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Experience
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {job.experience || 'Fresher'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Application Deadline
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {job.deadline || 'Not specified'}
                  </p>
                </div>
              </div>
            </section>

            {/* Student Profile */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Your Profile
              </h3>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Target Role
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {student?.target_role || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Education
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {student?.degree} · {student?.specialization}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Graduation Year
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {student?.graduation_year}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    CGPA
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {student?.cgpa}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Why You Match */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Why You Match
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your match score is calculated using your skills,
                target career role, and education profile.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-medium text-blue-600">
                    Skill Match
                  </p>

                  <p className="mt-1 text-2xl font-bold text-blue-700">
                    {job.matched_skills?.length || 0}
                  </p>

                  <p className="mt-1 text-xs text-blue-600">
                    skills matched
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-600">
                    Profile Fit
                  </p>

                  <p className="mt-1 text-2xl font-bold text-emerald-700">
                    {matchScore}%
                  </p>

                  <p className="mt-1 text-xs text-emerald-600">
                    overall compatibility
                  </p>
                </div>

                <div className="rounded-xl bg-violet-50 p-4">
                  <p className="text-xs font-medium text-violet-600">
                    Target Role
                  </p>

                  <p className="mt-1 text-sm font-bold text-violet-700">
                    {student?.target_role || 'Not specified'}
                  </p>

                  <p className="mt-1 text-xs text-violet-600">
                    career preference
                  </p>
                </div>
              </div>
            </section>

            {/* Matched Skills */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Skills You Match
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Skills from your profile that match this job.
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {job.matched_skills?.length || 0} matched
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {job.matched_skills?.length > 0 ? (
                  job.matched_skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
                    >
                      ✓ {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No matching skills found.
                  </p>
                )}
              </div>
            </section>

            {/* Missing Skills */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Skills to Improve
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Developing these skills can improve your job match.
                  </p>
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {job.missing_skills?.length || 0} to improve
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {job.missing_skills?.length > 0 ? (
                  job.missing_skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700"
                    >
                      + {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-emerald-600">
                    Excellent! You currently match all required skills.
                  </p>
                )}
              </div>
            </section>

            {/* Description */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                About This Opportunity
              </h3>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                {job.description ||
                  'No additional job description is available.'}
              </p>
            </section>

            {/* Eligibility */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Eligibility
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {job.eligibility ||
                  'Eligible candidates can apply.'}
              </p>
            </section>
          </div>
        </div>

        {/* Bottom Action */}
        <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">
                Ready to apply?
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Review your match details before submitting your application.
              </p>
            </div>

            <button
              onClick={() => {
                navigate(`/apply-job/${job.id}`)
              }}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Apply Now →
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default JobMatchDetails