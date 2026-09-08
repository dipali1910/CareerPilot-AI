import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function SkillGap() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSkillGaps()
  }, [])

  const fetchSkillGaps = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        'http://127.0.0.1:8000/api/student/skill-gaps?email=student%40careerpilot.ai'
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail || 'Unable to load skill gap analysis.'
        )
      }

      setData(result)
    } catch (err) {
      setError(
        err.message || 'Unable to load skill gap analysis.'
      )
    } finally {
      setLoading(false)
    }
  }

  const getPriorityClasses = (priority) => {
    switch (priority) {
      case 'high':
        return {
          badge:
            'border-red-200 bg-red-50 text-red-700',
          icon:
            'bg-red-50 text-red-600',
          bar:
            'bg-red-500',
        }

      case 'medium':
        return {
          badge:
            'border-amber-200 bg-amber-50 text-amber-700',
          icon:
            'bg-amber-50 text-amber-600',
          bar:
            'bg-amber-500',
        }

      default:
        return {
          badge:
            'border-slate-200 bg-slate-50 text-slate-600',
          icon:
            'bg-slate-50 text-slate-500',
          bar:
            'bg-slate-400',
        }
    }
  }

  const formatLevel = (level) => {
    if (!level) return 'Not specified'

    return level.charAt(0).toUpperCase() + level.slice(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <div className="animate-pulse space-y-6">

            <div className="h-8 w-64 rounded bg-slate-200" />

            <div className="h-20 w-full rounded-2xl bg-white" />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-28 rounded-2xl bg-white" />
              <div className="h-28 rounded-2xl bg-white" />
              <div className="h-28 rounded-2xl bg-white" />
            </div>

            <div className="h-48 rounded-2xl bg-white" />

            <div className="h-48 rounded-2xl bg-white" />

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

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-600">
              !
            </div>

            <h1 className="mt-4 text-xl font-semibold text-slate-900">
              Unable to load Skill Gap Analysis
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              onClick={fetchSkillGaps}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try Again
            </button>

            <Link
              to="/dashboard"
              className="mt-4 block text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </Link>

          </div>

        </div>
      </div>
    )
  }

  const summary = data?.summary || {}
  const gaps = data?.gaps || []
  const student = data?.student || {}

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

          <Link
            to="/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-blue-600"
          >
            ← Dashboard
          </Link>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <h1 className="text-2xl font-bold text-slate-900">
                Skill Gap Analysis
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Identify the skills you need to strengthen for your target career.
              </p>

            </div>

            <div className="text-left sm:text-right">

              <p className="text-sm font-semibold text-slate-700">
                {student.name}
              </p>

              <p className="text-xs text-slate-400">
                Target role: {student.target_role}
              </p>

            </div>

          </div>

        </div>

      </header>


      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ==================================================
            INTRODUCTION
        ================================================== */}

        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
              🎯
            </div>

            <div>

              <h2 className="text-lg font-semibold text-slate-900">
                Your Career Skill Gaps
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Based on your current profile and your target role of{' '}
                <span className="font-semibold text-slate-800">
                  {student.target_role}
                </span>
                , these are the skills you should focus on developing.
              </p>

            </div>

          </div>

        </section>


        {/* ==================================================
            SUMMARY CARDS
        ================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">

          {/* Total */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Skill Gaps
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {summary.total_gaps || 0}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                ✦
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Skills to strengthen
            </p>

          </div>


          {/* High */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  High Priority
                </p>

                <p className="mt-2 text-3xl font-bold text-red-600">
                  {summary.high_priority || 0}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                !
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Focus on these first
            </p>

          </div>


          {/* Medium */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Medium Priority
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {summary.medium_priority || 0}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                •
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Develop after high priority skills
            </p>

          </div>

        </section>


        {/* ==================================================
            SKILL GAP LIST
        ================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-lg font-semibold text-slate-900">
                Skills to Improve
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Prioritized based on your career requirements.
              </p>

            </div>

            <button
              onClick={fetchSkillGaps}
              className="self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Refresh
            </button>

          </div>


          {gaps.length === 0 ? (

            <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">

              <div className="text-2xl text-emerald-600">
                ✓
              </div>

              <h3 className="mt-2 font-semibold text-emerald-800">
                No Skill Gaps Found
              </h3>

              <p className="mt-1 text-sm text-emerald-700">
                Your current skills match your career requirements.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {gaps.map((gap) => {

                const styles = getPriorityClasses(
                  gap.priority
                )

                return (
                  <article
                    key={gap.id || gap.skill_id || gap.skill}
                    className="rounded-xl border border-slate-200 p-5 transition hover:border-slate-300"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                      {/* Skill */}
                      <div className="flex min-w-0 flex-1 items-start gap-4">

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${styles.icon}`}
                        >
                          ↑
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-semibold text-slate-900">
                              {gap.skill}
                            </h3>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles.badge}`}
                            >
                              {gap.priority} priority
                            </span>

                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            Improve from{' '}
                            <span className="font-medium text-slate-700">
                              {formatLevel(
                                gap.current_proficiency
                              )}
                            </span>{' '}
                            to{' '}
                            <span className="font-medium text-slate-700">
                              {formatLevel(
                                gap.required_proficiency
                              )}
                            </span>
                          </p>

                        </div>

                      </div>


                      {/* Current → Required */}
                      <div className="w-full lg:w-80">

                        <div className="flex items-center justify-between text-xs">

                          <span className="font-medium text-slate-500">
                            Current
                          </span>

                          <span className="font-medium text-slate-500">
                            Required
                          </span>

                        </div>

                        <div className="mt-2 flex items-center gap-3">

                          <span className="min-w-20 text-sm font-medium capitalize text-slate-700">
                            {formatLevel(
                              gap.current_proficiency
                            )}
                          </span>

                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className={`h-full rounded-full ${styles.bar}`}
                              style={{
                                width:
                                  gap.current_proficiency ===
                                  'beginner'
                                    ? '35%'
                                    : gap.current_proficiency ===
                                      'intermediate'
                                    ? '65%'
                                    : '90%',
                              }}
                            />

                          </div>

                          <span className="min-w-24 text-right text-sm font-semibold capitalize text-slate-700">
                            {formatLevel(
                              gap.required_proficiency
                            )}
                          </span>

                        </div>

                      </div>

                    </div>

                  </article>
                )
              })}

            </div>

          )}

        </section>


        {/* ==================================================
            RECOMMENDATION
        ================================================== */}

        {gaps.length > 0 && (

          <section className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                💡
              </div>

              <div>

                <h2 className="font-semibold text-slate-900">
                  Recommended Next Step
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Start with your{' '}
                  <span className="font-semibold text-slate-800">
                    high-priority
                  </span>{' '}
                  skill gaps first. Building these skills can improve
                  your readiness for your target role.
                </p>

                <Link
                  to="/roadmap"
                  className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  View Learning Roadmap →
                </Link>

              </div>

            </div>

          </section>

        )}

      </main>

    </div>
  )
}

export default SkillGap