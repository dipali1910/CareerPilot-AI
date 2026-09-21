import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const API_URL = 'https://careerpilot-ai-backend-3kr1.onrender.com'

function CareerRecommendations() {
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRecommendations = async () => {
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

      const encodedEmail = encodeURIComponent(user.email)

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
      <div className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--border-color)] border-t-blue-600" />

          <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">
            Loading Career Recommendations...
          </h2>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] p-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-[var(--surface)] p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xl">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-[var(--text-primary)]">
            Unable to load career recommendations
          </h1>

          <p className="mt-3 leading-6 text-red-600">
            {error}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={fetchRecommendations}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Try Again
            </button>

            <Link
              to="/dashboard"
              className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-6 py-3 text-center font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)]"
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
    <div className="min-h-screen bg-[var(--page-bg)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-8">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 transition hover:text-blue-700 dark:text-blue-300"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Career Recommendations
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                Discover career paths that match your skills, education and
                career interests.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchRecommendations}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 lg:w-auto"
            >
              Refresh Recommendations
            </button>
          </div>
        </div>

        {/* =====================================================
            STUDENT SUMMARY
        ====================================================== */}

        <section className="mb-6 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                Career analysis for
              </p>

              <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                {student.name || 'Student'}
              </h2>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {student.degree || '—'} ·{' '}
                {student.specialization || '—'}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Target Role
              </p>

              <p className="mt-1 font-bold text-blue-700 dark:text-blue-300">
                {student.target_role || 'Not specified'}
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            BEST CAREER MATCH
        ====================================================== */}

        {topRecommendation && (
          <section className="mb-6 rounded-2xl bg-blue-600 p-6 text-white dark:bg-blue-700 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-100 dark:text-blue-200">
              Best Career Match
            </p>

            <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  {topRecommendation.career || 'Career Role'}
                </h2>

                <p className="mt-3 leading-7 text-blue-100 dark:text-blue-200">
                  {topRecommendation.reason ||
                    'This career matches your current profile, skills and career interests.'}
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-[var(--surface)] px-7 py-5 text-center">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Match Score
                </p>

                <p className="mt-1 text-4xl font-bold text-blue-600 dark:text-blue-400">
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
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Recommended Career Paths
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {recommendations.length} career path
            {recommendations.length === 1 ? '' : 's'} matched to your profile.
          </p>
        </div>

        {recommendations.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-8 text-center shadow-sm">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              No recommendations found
            </h3>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
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
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm transition hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800"
                >

                  {/* Card Header */}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 font-bold text-blue-700 dark:text-blue-300">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">
                          {career?.career || 'Career Role'}
                        </h3>

                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          Career path
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-[var(--text-secondary)]">
                        Match
                      </p>

                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {matchScore}%
                      </p>
                    </div>
                  </div>

                  {/* Progress */}

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--page-bg)]">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-400"
                      style={{
                        width: `${Math.min(Math.max(matchScore, 0), 100)}%`,
                      }}
                    />
                  </div>

                  {/* Reason */}

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                      Why this career?
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      {career?.reason ||
                        'This career is aligned with your current profile and interests.'}
                    </p>
                  </div>

                  {/* Strengths */}

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                      Your Strengths
                    </h4>

                    {strengths.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {strengths.map((skill, skillIndex) => (
                          <span
                            key={`${skill}-${skillIndex}`}
                            className="rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        No strength data available.
                      </p>
                    )}
                  </div>

                  {/* Missing Skills */}

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                      Skills to Improve
                    </h4>

                    {missingSkills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {missingSkills.map((skill, skillIndex) => (
                          <span
                            key={`${skill}-${skillIndex}`}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        No major skill gaps identified.
                      </p>
                    )}
                  </div>

                  {/* Recommended Next Action */}

                  <div className="mt-6 rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                      Recommended Next Action
                    </p>

                    <p className="mt-2 text-sm font-medium leading-6 text-[var(--text-primary)]">
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

        <section className="mt-6 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Next Step
              </p>

              <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                Find placement opportunities
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
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
          <section className="mt-6 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Your Recommended Focus
            </h2>

            <p className="mt-2 leading-7 text-[var(--text-secondary)]">
              Based on your highest career match, focus on strengthening
              your missing skills and building practical projects related
              to{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {topRecommendation.career || 'your recommended career'}
              </span>.
            </p>
          </section>
        )}

        {/* =====================================================
            FOOTER NOTE
        ====================================================== */}

        <p className="py-8 text-center text-xs text-[var(--text-muted)]">
          Career match scores are application-defined indicators based on
          available student profile and recommendation data.
        </p>

      </div>
    </div>
  )
}

export default CareerRecommendations