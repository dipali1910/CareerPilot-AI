import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const API_URL = 'https://careerpilot-ai-backend-3kr1.onrender.com'

function CareerAnalysis() {
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchCareerAnalysis = async () => {
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
        `${API_URL}/api/student/career-analysis?email=${encodeURIComponent(
          user.email
        )}`
      )

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          result.detail ||
            result.message ||
            'Unable to load career analysis.'
        )
      }

      console.log('CAREER ANALYSIS DATA:', result)

      setData(result)
    } catch (err) {
      console.error('Career Analysis Error:', err)

      setError(
        err.message || 'Unable to load career analysis.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCareerAnalysis()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCareerAnalysis()
  }

  const formatLevel = (level) => {
    if (!level) return 'Not available'

    return (
      String(level).charAt(0).toUpperCase() +
      String(level).slice(1)
    )
  }

  const getScoreStyle = (score) => {
    const value = Number(score || 0)

    if (value >= 80) {
      return 'text-emerald-600 dark:text-emerald-300'
    }

    if (value >= 60) {
      return 'text-blue-600 dark:text-blue-400'
    }

    if (value >= 40) {
      return 'text-amber-600'
    }

    return 'text-red-600'
  }

  const getMatchBadge = (score) => {
    const value = Number(score || 0)

    if (value >= 80) {
      return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    }

    if (value >= 60) {
      return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200'
    }

    if (value >= 40) {
      return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    }

    return 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-color)]'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded-lg bg-[var(--surface-secondary)]" />

            <div className="h-28 rounded-2xl bg-[var(--surface)]" />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-32 rounded-2xl bg-[var(--surface)]" />
              <div className="h-32 rounded-2xl bg-[var(--surface)]" />
              <div className="h-32 rounded-2xl bg-[var(--surface)]" />
            </div>

            <div className="h-72 rounded-2xl bg-[var(--surface)]" />

            <div className="h-56 rounded-2xl bg-[var(--surface)]" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)]">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
          <div className="w-full rounded-3xl border border-red-200 dark:border-red-800 bg-[var(--surface)] p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30 text-xl font-bold text-red-600">
              !
            </div>

            <h1 className="mt-5 text-2xl font-bold text-[var(--text-primary)]">
              Unable to load Career Analysis
            </h1>

            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchCareerAnalysis}
              className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Try Again
            </button>

            <Link
              to="/dashboard"
              className="mt-4 block text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--page-bg)]">
        <p className="text-[var(--text-secondary)]">
          No career analysis data found.
        </p>
      </div>
    )
  }

  const student = data.student || {}
  const breakdown = data.readiness_breakdown || {}

  const skills = data.skills || []
  const projects = data.projects || []
  const recommendations = data.career_recommendations || []
  const skillGaps = data.skill_gaps || []

  const readinessScore = Number(
    data.readiness_score || 0
  )

  const topRecommendation =
    recommendations.length > 0
      ? recommendations[0]
      : null

  const topGap =
    skillGaps.length > 0
      ? skillGaps[0]
      : null

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">

      {/* Header */}
      <header className="border-b border-[var(--border-color)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="inline-flex rounded-full bg-blue-50 dark:bg-blue-950/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                Career Development
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Career Analysis
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                Understand your career readiness, strengths,
                skill gaps and recommended career paths.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing
                ? 'Refreshing...'
                : 'Refresh Analysis'}
            </button>
          </div>

          {/* Student summary */}
          <div className="mt-5 rounded-2xl border border-[var(--border-color)] bg-[var(--page-bg)] px-4 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Student
                </p>

                <p className="mt-1 font-bold text-[var(--text-primary)]">
                  {student.name || 'Student'}
                </p>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {student.degree || 'Degree'}{' '}
                  {student.specialization
                    ? `· ${student.specialization}`
                    : ''}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Target Role
                </p>

                <p className="mt-1 font-bold text-blue-700 dark:text-blue-300">
                  {student.target_role || 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Readiness Hero */}
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                AI Career Insights
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                Your Career Readiness
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                {data.summary ||
                  'Your profile has been analyzed against your target career and available career requirements.'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-5 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-sm">

              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30">
                <div className="text-center">
                  <p
                    className={`text-3xl font-bold ${getScoreStyle(
                      readinessScore
                    )}`}
                  >
                    {readinessScore}
                  </p>

                  <p className="text-xs font-medium text-[var(--text-muted)]">
                    / 100
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  Placement Readiness
                </p>

                <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                  {readinessScore >= 80
                    ? 'Strong foundation'
                    : readinessScore >= 60
                      ? 'Good foundation'
                      : 'Needs improvement'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Summary cards */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            label="Skills"
            value={skills.length}
            description="Skills in your profile"
            icon="✦"
            iconClass="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
          />

          <SummaryCard
            label="Career Matches"
            value={recommendations.length}
            description="Recommended career paths"
            icon="★"
            iconClass="bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400"
          />

          <SummaryCard
            label="Skill Gaps"
            value={skillGaps.length}
            description="Skills to improve"
            icon="!"
            iconClass="bg-amber-50 dark:bg-amber-950/30 text-amber-600"
          />

          <SummaryCard
            label="Projects"
            value={projects.length}
            description="Projects in your profile"
            icon="◆"
            iconClass="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-300"
          />
        </section>

        {/* Profile */}
        <section className="mt-6 rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm sm:p-7">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Student Profile
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Profile Overview
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <ProfileItem
              label="Full Name"
              value={student.name}
            />

            <ProfileItem
              label="Degree"
              value={student.degree}
            />

            <ProfileItem
              label="Specialization"
              value={student.specialization}
            />

            <ProfileItem
              label="Graduation Year"
              value={student.graduation_year}
            />

            <ProfileItem
              label="CGPA"
              value={
                student.cgpa !== null &&
                student.cgpa !== undefined
                  ? student.cgpa
                  : 'Not available'
              }
            />

            <ProfileItem
              label="Location"
              value={student.location}
            />

            <ProfileItem
              label="Target Role"
              value={student.target_role}
            />

            <ProfileItem
              label="Career Interest"
              value={student.career_interest}
            />
          </div>
        </section>

        {/* Readiness Breakdown */}
        <section className="mt-6 rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm sm:p-7">

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Readiness Analysis
            </p>

            <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
              Readiness Breakdown
            </h2>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Your readiness across the major placement factors.
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">

            <ProgressCard
              label="Technical Skills"
              value={breakdown.technical_skills}
            />

            <ProgressCard
              label="Project Strength"
              value={breakdown.project_strength}
            />

            <ProgressCard
              label="Role Alignment"
              value={breakdown.role_alignment}
            />

            <ProgressCard
              label="Interview Readiness"
              value={breakdown.interview_readiness}
            />
          </div>
        </section>

        {/* Strengths and Gaps */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* Strengths */}
          <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm sm:p-7">

            <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
              Your Strengths
            </p>

            <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
              Current Skills
            </h2>

            {skills.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-[var(--page-bg)] p-5 text-sm text-[var(--text-secondary)]">
                No skills are currently available in your profile.
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <div
                    key={skill.id || skill.name}
                    className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      {skill.name}
                    </p>

                    {skill.proficiency && (
                      <p className="mt-0.5 text-xs capitalize text-emerald-600 dark:text-emerald-300">
                        {formatLevel(skill.proficiency)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skill gaps */}
          <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm sm:p-7">

            <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
              Development Areas
            </p>

            <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
              Priority Skill Gaps
            </h2>

            {skillGaps.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-5 text-sm text-emerald-700 dark:text-emerald-300">
                No skill gaps found for the available career requirements.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {skillGaps.map((gap) => (
                  <div
                    key={
                      gap.id ||
                      gap.skill_id ||
                      gap.skill
                    }
                    className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] p-4"
                  >
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {gap.skill}
                      </p>

                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {formatLevel(gap.current_level)}{' '}
                        →{' '}
                        {formatLevel(gap.required_level)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${
                        gap.priority === 'high'
                          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                          : gap.priority === 'medium'
                            ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                            : 'border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {gap.priority || 'medium'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/skill-gap"
              className="mt-5 inline-flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300"
            >
              View Detailed Skill Gap Analysis →
            </Link>
          </div>
        </section>

        {/* Projects */}
        <section className="mt-6 rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm sm:p-7">

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
              Portfolio
            </p>

            <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
              Projects
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--page-bg)] p-6">
              <p className="font-semibold text-[var(--text-primary)]">
                No projects available
              </p>

              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                Add projects to your profile to improve your
                portfolio strength and placement readiness.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {projects.map((project, index) => (
                <div
                  key={project.id || index}
                  className="rounded-2xl border border-[var(--border-color)] p-5"
                >
                  <h3 className="font-bold text-[var(--text-primary)]">
                    {project.title ||
                      project.name ||
                      `Project ${index + 1}`}
                  </h3>

                  {project.description && (
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      {project.description}
                    </p>
                  )}

                  {project.technologies && (
                    <p className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400">
                      {Array.isArray(project.technologies)
                        ? project.technologies.join(', ')
                        : project.technologies}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Career Recommendations */}
        <section className="mt-6 rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm sm:p-7">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                AI Career Recommendations
              </p>

              <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                Recommended Career Paths
              </h2>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Career paths based on your current profile and skills.
              </p>
            </div>

            <Link
              to="/career-recommendations"
              className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300"
            >
              View All Recommendations →
            </Link>
          </div>

          {recommendations.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-[var(--page-bg)] p-6 text-sm text-[var(--text-secondary)]">
              No career recommendations are currently available.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {recommendations.map((recommendation, index) => (
                <div
                  key={
                    recommendation.id ||
                    recommendation.career_role_id ||
                    index
                  }
                  className={`rounded-2xl border p-5 ${
                    index === 0
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-[var(--border-color)] bg-[var(--surface)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {index === 0
                          ? 'Top Match'
                          : `Career Path ${index + 1}`}
                      </p>

                      <h3 className="mt-1 font-bold text-slate-900">
                        {recommendation.career}
                      </h3>
                    </div>

                    <span
                      className={`rounded-xl border px-3 py-2 text-sm font-bold ${getMatchBadge(
                        recommendation.match_score
                      )}`}
                    >
                      {Number(
                        recommendation.match_score || 0
                      ).toFixed(0)}
                      %
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {recommendation.reason ||
                      'This career path matches your available profile information.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recommended Next Action */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-violet-200 bg-violet-50">

          <div className="p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface)] text-lg shadow-sm">
                💡
              </div>

              <div className="flex-1">

                <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                  Recommended Next Action
                </p>

                <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                  {topGap
                    ? `Focus on ${topGap.skill}`
                    : topRecommendation
                      ? `Continue building toward ${topRecommendation.career}`
                      : 'Continue strengthening your career profile'}
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {topGap
                    ? `Improve ${topGap.skill} from ${formatLevel(
                        topGap.current_level
                      )} to ${formatLevel(
                        topGap.required_level
                      )} through guided learning and practical projects.`
                    : topRecommendation
                      ? `Your strongest current career match is ${topRecommendation.career} with a ${Number(
                          topRecommendation.match_score || 0
                        ).toFixed(0)}% profile match.`
                      : 'Continue improving your skills and profile to increase placement readiness.'}
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/skill-gap"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    View Skill Gaps
                    <span className="ml-2">→</span>
                  </Link>

                  <Link
                    to="/roadmap"
                    className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-[var(--surface)] px-5 py-3 text-sm font-bold text-blue-700 dark:text-blue-300 transition hover:bg-blue-50 dark:hover:bg-blue-950/40 dark:bg-blue-950/30"
                  >
                    View Learning Roadmap
                    <span className="ml-2">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <p className="py-8 text-center text-xs leading-5 text-[var(--text-muted)]">
          Career analysis is generated from the student's current
          profile, skills, career requirements and recommendation data.
        </p>
      </main>
    </div>
  )
}

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function SummaryCard({
  label,
  value,
  description,
  icon,
  iconClass,
}) {
  return (
    <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">

        <div>
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {description}
      </p>
    </div>
  )
}

function ProfileItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--page-bg)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold leading-6 text-[var(--text-primary)]">
        {value || 'Not available'}
      </p>
    </div>
  )
}

function ProgressCard({ label, value }) {
  const score = Number(value || 0)

  return (
    <div className="rounded-2xl border border-[var(--border-color)] p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="font-semibold text-[var(--text-primary)]">
          {label}
        </p>

        <p className="font-bold text-blue-600 dark:text-blue-400">
          {score}%
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
        <div
          className="h-full rounded-full bg-blue-600 transition-all dark:bg-blue-400"
          style={{
            width: `${Math.min(Math.max(score, 0), 100)}%`,
          }}
        />
      </div>
    </div>
  )
}

export default CareerAnalysis