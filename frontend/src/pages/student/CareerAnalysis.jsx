import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_URL = 'http://127.0.0.1:8000'

function CareerAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCareerAnalysis = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `${API_URL}/api/student/career-analysis?email=${encodeURIComponent(
          'student@careerpilot.ai'
        )}`
      )

      if (!response.ok) {
        throw new Error('Unable to load career analysis.')
      }

      const result = await response.json()

      setData(result)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCareerAnalysis()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-lg font-medium text-slate-900">
            Loading career analysis...
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Fetching your profile and career insights.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-red-200 p-8">
          <h1 className="text-2xl font-bold text-slate-950">
            Unable to load career analysis
          </h1>

          <p className="mt-3 text-slate-600">
            {error}
          </p>

          <button
            onClick={fetchCareerAnalysis}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Try Again
          </button>

          <div className="mt-4">
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

  if (!data) {
    return null
  }

  const student = data.student || {}
  const breakdown = data.readiness_breakdown || {}
  const skills = data.skills || []
  const projects = data.projects || []
  const recommendations = data.career_recommendations || []
  const skillGaps = data.skill_gaps || []

  const topCareer = recommendations.length > 0
    ? recommendations[0]
    : null

  return (
    <div className="min-h-screen bg-slate-100 px-4 sm:px-6 py-6 sm:py-8">

      <div className="max-w-7xl mx-auto">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-950">
              AI Career Analysis
            </h1>

            <p className="mt-2 text-base sm:text-lg text-slate-500">
              Understand your career readiness and find areas to improve.
            </p>
          </div>

          <button
            onClick={fetchCareerAnalysis}
            className="w-full lg:w-auto rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition"
          >
            Refresh Analysis
          </button>

        </div>


        {/* ==================================================
            STUDENT PROFILE
        ================================================== */}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Student Profile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Information used for your career analysis.
              </p>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {student.target_role || 'Target Role'}
            </span>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            <div>
              <p className="text-sm text-slate-500">
                Student
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {student.name || '—'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Degree
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {student.degree || '—'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Specialization
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {student.specialization || '—'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Graduation Year
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {student.graduation_year || '—'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                CGPA
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {student.cgpa ?? '—'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Location
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {student.location || '—'}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-slate-500">
                Career Interest
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {student.career_interest || '—'}
              </p>
            </div>

          </div>

        </section>


        {/* ==================================================
            READINESS SUMMARY
        ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

          {/* Overall */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

            <p className="text-sm text-slate-500">
              Overall Readiness
            </p>

            <div className="mt-2 flex items-end gap-1">
              <span className="text-4xl font-bold text-blue-600">
                {data.readiness_score ?? 0}
              </span>

              <span className="mb-1 text-lg text-slate-400">
                /100
              </span>
            </div>

            <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${Math.min(
                    Math.max(data.readiness_score || 0, 0),
                    100
                  )}%`,
                }}
              />
            </div>

          </div>


          {/* Technical */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

            <p className="text-sm text-slate-500">
              Technical Skills
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {breakdown.technical_skills ?? 0}%
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Based on your current skill profile.
            </p>

          </div>


          {/* Projects */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

            <p className="text-sm text-slate-500">
              Project Strength
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {breakdown.project_strength ?? 0}%
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Based on practical project experience.
            </p>

          </div>


          {/* Role */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

            <p className="text-sm text-slate-500">
              Role Alignment
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {breakdown.role_alignment ?? 0}%
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Alignment with your target role.
            </p>

          </div>

        </div>


        {/* ==================================================
            AI ASSESSMENT
        ================================================== */}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                AI Career Assessment
              </h2>

              <p className="mt-1 text-sm sm:text-base text-slate-500">
                Analysis based on your education, skills, projects and target role.
              </p>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              AI Generated
            </span>

          </div>

          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-5">

            <p className="text-slate-700 leading-7">
              {data.summary ||
                'Your career analysis is based on your current profile.'}
            </p>

          </div>

        </section>


        {/* ==================================================
            STRENGTHS + SKILL GAPS
        ================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Strengths */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">

            <h2 className="text-xl font-bold text-slate-900">
              Your Strengths
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Areas where your profile is already strong.
            </p>

            <div className="mt-5 space-y-3">

              {skills.length > 0 ? (
                skills
                  .filter((skill) =>
                    ['advanced', 'intermediate'].includes(
                      String(skill.proficiency || '').toLowerCase()
                    )
                  )
                  .slice(0, 5)
                  .map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3"
                    >
                      <span className="font-medium text-slate-900">
                        {skill.name}
                      </span>

                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 capitalize">
                        {skill.proficiency}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-slate-500">
                  No skill information available.
                </p>
              )}

            </div>

          </section>


          {/* Skill Gaps */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">

            <h2 className="text-xl font-bold text-slate-900">
              Areas to Improve
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Skills that can improve your placement readiness.
            </p>

            <div className="mt-5 space-y-3">

              {skillGaps.length > 0 ? (
                skillGaps.map((gap) => {

                  const priority = String(
                    gap.priority || ''
                  ).toLowerCase()

                  const isHigh = priority === 'high'

                  return (
                    <div
                      key={gap.id}
                      className="rounded-xl bg-slate-50 border border-slate-200 p-4"
                    >

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                        <p className="font-semibold text-slate-900">
                          {gap.skill}
                        </p>

                        <span
                          className={
                            isHigh
                              ? 'w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 capitalize'
                              : 'w-fit rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700 capitalize'
                          }
                        >
                          {gap.priority || 'Medium'} Priority
                        </span>

                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">

                        <span className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-600 capitalize">
                          Current: {gap.current_level || '—'}
                        </span>

                        <span className="text-slate-400">
                          →
                        </span>

                        <span className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-600 capitalize">
                          Required: {gap.required_level || '—'}
                        </span>

                      </div>

                    </div>
                  )
                })
              ) : (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-green-700">
                  No major skill gaps found.
                </div>
              )}

            </div>

          </section>

        </div>


        {/* ==================================================
            CURRENT SKILLS
        ================================================== */}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Current Skills
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Skills currently available in your profile.
              </p>
            </div>

            <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {skills.length} Skills
            </span>

          </div>

          <div className="mt-5 flex flex-wrap gap-3">

            {skills.length > 0 ? (
              skills.map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >

                  <p className="font-medium text-slate-900">
                    {skill.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500 capitalize">
                    {skill.proficiency}
                  </p>

                </div>
              ))
            ) : (
              <p className="text-slate-500">
                No skills found.
              </p>
            )}

          </div>

        </section>


        {/* ==================================================
            PROJECTS
        ================================================== */}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 mb-6">

          <h2 className="text-xl font-bold text-slate-900">
            Projects
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Projects considered during your career analysis.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">

            {projects.length > 0 ? (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-slate-200 p-5"
                >

                  <h3 className="font-semibold text-slate-900">
                    {project.title || 'Project'}
                  </h3>

                  {project.description && (
                    <p className="mt-2 text-sm text-slate-500 leading-6">
                      {project.description}
                    </p>
                  )}

                  {project.technologies && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Technologies
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {Array.isArray(project.technologies)
                          ? project.technologies.join(', ')
                          : project.technologies}
                      </p>
                    </div>
                  )}

                </div>
              ))
            ) : (
              <p className="text-slate-500">
                No projects found.
              </p>
            )}

          </div>

        </section>


        {/* ==================================================
            CAREER RECOMMENDATIONS
        ================================================== */}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 mb-6">

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Recommended Career Paths
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Career paths recommended from your current profile.
            </p>
          </div>

          <div className="mt-5 space-y-4">

            {recommendations.length > 0 ? (
              recommendations.map((career, index) => (
                <div
                  key={career.id}
                  className="rounded-xl border border-slate-200 p-5"
                >

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div className="flex items-start gap-4">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                        {index + 1}
                      </div>

                      <div>

                        <h3 className="text-lg font-bold text-slate-900">
                          {career.career}
                        </h3>

                        {career.reason && (
                          <p className="mt-1 text-sm text-slate-500">
                            {career.reason}
                          </p>
                        )}

                      </div>

                    </div>

                    <div className="shrink-0">

                      <p className="text-xs text-slate-500">
                        Match Score
                      </p>

                      <p className="mt-1 text-2xl font-bold text-blue-600">
                        {career.match_score ?? 0}%
                      </p>

                    </div>

                  </div>

                </div>
              ))
            ) : (
              <p className="text-slate-500">
                No career recommendations found.
              </p>
            )}

          </div>

        </section>


        {/* ==================================================
            NEXT ACTION
        ================================================== */}

        <section className="rounded-2xl bg-blue-600 p-6 sm:p-8 text-white mb-6">

          <p className="text-sm font-medium text-blue-100">
            Recommended Next Step
          </p>

          <h2 className="mt-2 text-2xl sm:text-3xl font-bold">
            Strengthen your backend development skills
          </h2>

          <p className="mt-3 max-w-3xl text-blue-100 leading-7">
            Focus on the high-priority skills identified in your analysis,
            especially Node.js and REST APIs. Building a practical project
            using these technologies can improve your placement readiness.
          </p>

          {topCareer && (
            <div className="mt-5 rounded-xl bg-white/10 border border-white/20 p-4">

              <p className="text-sm text-blue-100">
                Top Career Match
              </p>

              <p className="mt-1 text-lg font-semibold">
                {topCareer.career} · {topCareer.match_score}%
              </p>

            </div>
          )}

        </section>


        {/* ==================================================
            DISCLAIMER
        ================================================== */}

        <p className="pb-8 text-center text-xs text-slate-400">
          Career readiness scores are application-defined indicators
          based on the available student profile data and are not
          professional career assessments.
        </p>

      </div>
    </div>
  )
}

export default CareerAnalysis