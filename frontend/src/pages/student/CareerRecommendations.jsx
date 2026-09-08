import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = 'http://127.0.0.1:8000'
const STUDENT_EMAIL = 'student@careerpilot.ai'

function CareerRecommendations() {
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      setError('')

      const encodedEmail = encodeURIComponent(STUDENT_EMAIL)

      const response = await fetch(
        `${API_URL}/api/student/career-recommendations?email=${encodedEmail}`
      )

      if (!response.ok) {
        let message = 'Unable to load career recommendations.'

        try {
          const errorData = await response.json()

          if (errorData?.detail) {
            message = errorData.detail
          }
        } catch {
          // Keep default error message
        }

        throw new Error(message)
      }

      const result = await response.json()

      setData(result)
    } catch (err) {
      console.error('Career recommendations error:', err)

      setError(
        err?.message ||
          'Failed to fetch career recommendations. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Loading Career Recommendations...
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Getting your personalized career matches.
          </p>
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------
  // Error
  // ------------------------------------------------------------

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xl">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Unable to load career recommendations
          </h1>

          <p className="mt-3 leading-6 text-red-600">
            {error}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={fetchRecommendations}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Try Again
            </button>

            <Link
              to="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------
  // Normalize API response
  // ------------------------------------------------------------

  const student = data?.student || {}

  const recommendations = Array.isArray(data?.recommendations)
    ? data.recommendations
    : Array.isArray(data?.career_recommendations)
      ? data.career_recommendations
      : []

  const topRecommendation = recommendations[0] || null

  // ------------------------------------------------------------
  // Main UI
  // ------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-8">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Career Recommendations
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                Discover career paths that match your skills, education and
                career interests.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchRecommendations}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 lg:w-auto"
            >
              Refresh Recommendations
            </button>
          </div>
        </div>

        {/* =====================================================
            STUDENT SUMMARY
        ====================================================== */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Career analysis for
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {student.name || 'Student'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {student.degree || '—'} ·{' '}
                {student.specialization || '—'}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                Target Role
              </p>

              <p className="mt-1 font-bold text-blue-700">
                {student.target_role || 'Not specified'}
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            BEST CAREER MATCH
        ====================================================== */}

        {topRecommendation && (
          <section className="mb-6 rounded-2xl bg-blue-600 p-6 text-white shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
              Best Career Match
            </p>

            <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  {topRecommendation.career || 'Career Role'}
                </h2>

                <p className="mt-3 leading-7 text-blue-100">
                  {topRecommendation.reason ||
                    'This career matches your current profile, skills and career interests.'}
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-white px-7 py-5 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Match Score
                </p>

                <p className="mt-1 text-4xl font-bold text-blue-600">
                  {topRecommendation.match_score ?? 0}%
                </p>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            RECOMMENDED CAREER PATHS
        ====================================================== */}

        <div className="mb-5">
          <h2 className="text-2xl font-bold text-slate-900">
            Recommended Career Paths
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {recommendations.length} career path
            {recommendations.length === 1 ? '' : 's'} matched to your profile.
          </p>
        </div>

        {recommendations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">
              No recommendations found
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add more skills to your profile to receive career
              recommendations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {recommendations.map((career, index) => {
              const matchScore = Number(career?.match_score) || 0

              const strengths = Array.isArray(career?.strengths)
                ? career.strengths
                : []

              const missingSkills = Array.isArray(career?.missing_skills)
                ? career.missing_skills
                : []

              return (
                <article
                  key={
                    career?.id ||
                    career?.career_role_id ||
                    `${career?.career || 'career'}-${index}`
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >

                  {/* Card Header */}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xl font-bold text-slate-900">
                          {career?.career || 'Career Role'}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Career path
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-slate-500">
                        Match
                      </p>

                      <p className="text-2xl font-bold text-blue-600">
                        {matchScore}%
                      </p>
                    </div>
                  </div>

                  {/* Progress */}

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{
                        width: `${Math.min(Math.max(matchScore, 0), 100)}%`,
                      }}
                    />
                  </div>

                  {/* Reason */}

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Why this career?
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {career?.reason ||
                        'This career is aligned with your current profile and interests.'}
                    </p>
                  </div>

                  {/* Strengths */}

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Your Strengths
                    </h4>

                    {strengths.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {strengths.map((skill, skillIndex) => (
                          <span
                            key={`${skill}-${skillIndex}`}
                            className="rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        No strength data available.
                      </p>
                    )}
                  </div>

                  {/* Missing Skills */}

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Skills to Improve
                    </h4>

                    {missingSkills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {missingSkills.map((skill, skillIndex) => (
                          <span
                            key={`${skill}-${skillIndex}`}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        No major skill gaps identified.
                      </p>
                    )}
                  </div>

                  {/* Recommended Next Action */}

                  <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Recommended Next Action
                    </p>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
                      {career?.recommended_action ||
                        'Continue improving your technical skills and practical project experience.'}
                    </p>
                  </div>

                </article>
              )
            })}

          </div>
        )}

        {/* =====================================================
            NEXT STEP - VIEW MATCHING JOBS
        ====================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Next Step
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Find placement opportunities
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Explore jobs ranked according to your current skills,
                education and target career role.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/placement-opportunities')}
              className="w-full shrink-0 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 lg:w-auto"
            >
              View Matching Jobs
            </button>

          </div>
        </section>

        {/* =====================================================
            BOTTOM GUIDANCE
        ====================================================== */}

        {topRecommendation && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Your Recommended Focus
            </h2>

            <p className="mt-2 leading-7 text-slate-600">
              Based on your highest career match, focus on strengthening
              your missing skills and building practical projects related
              to{' '}
              <span className="font-semibold text-slate-900">
                {topRecommendation.career || 'your recommended career'}
              </span>.
            </p>
          </section>
        )}

        {/* =====================================================
            FOOTER NOTE
        ====================================================== */}

        <p className="py-8 text-center text-xs text-slate-400">
          Career match scores are application-defined indicators based on
          available student profile and recommendation data.
        </p>

      </div>
    </div>
  )
}

export default CareerRecommendations