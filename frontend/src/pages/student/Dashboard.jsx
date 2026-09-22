import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const API_BASE_URL = 'https://careerpilot-ai-backend-docker.onrender.com'

/*
 * Fetch JSON safely.
 *
 * The Dashboard depends on several APIs. Some secondary APIs
 * can temporarily return 500 errors, so we retry them instead
 * of allowing one failed request to break the entire Dashboard.
 */
async function fetchJson(path, fallback = null, retries = 2) {
  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`)

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}`
        )
      }

      return await response.json()
    } catch (error) {
      lastError = error

      if (attempt < retries) {
        await new Promise((resolve) => {
          setTimeout(resolve, 500)
        })
      }
    }
  }

  console.warn(
    `Dashboard API request failed after ${retries + 1} attempts: ${path}`,
    lastError
  )

  return fallback
}


function Dashboard() {
  const navigate = useNavigate()

  const [dashboard, setDashboard] = useState(null)

  const [careerRecommendations, setCareerRecommendations] =
    useState([])

  const [skillGaps, setSkillGaps] = useState([])

  const [placementMatches, setPlacementMatches] =
    useState([])

  const [roadmapItems, setRoadmapItems] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')


  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
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


        /*
         * ----------------------------------------------------
         * 1. Dashboard summary
         * ----------------------------------------------------
         *
         * This is the only API that is required for the
         * Dashboard itself to load.
         */
        const dashboardData = await fetchJson(
          `/api/student/dashboard?email=${encodedEmail}`,
          null,
          3
        )


        if (!dashboardData) {
          throw new Error(
            'Unable to connect to the CareerPilot AI backend.'
          )
        }


        if (!isMounted) {
          return
        }


        setDashboard(dashboardData)


        /*
         * ----------------------------------------------------
         * 2. Load detailed dashboard sections
         * ----------------------------------------------------
         *
         * These requests are independent.
         *
         * If one temporarily fails, the Dashboard still loads
         * and that particular section safely shows empty data.
         */
        const [
          careerData,
          skillGapData,
          placementData,
          roadmapData,
        ] = await Promise.all([

          fetchJson(
            `/api/student/career-recommendations?email=${encodedEmail}`,
            {},
            3
          ),

          fetchJson(
            `/api/student/skill-gaps?email=${encodedEmail}`,
            {},
            3
          ),

          fetchJson(
            `/api/student/placement-opportunities?email=${encodedEmail}`,
            {},
            3
          ),

          fetchJson(
            `/api/student/roadmap?email=${encodedEmail}`,
            {},
            3
          ),

        ])


        if (!isMounted) {
          return
        }


        /*
         * ----------------------------------------------------
         * Career recommendations
         * ----------------------------------------------------
         *
         * Backend response:
         *
         * {
         *   recommendations: [...]
         * }
         */
        const recommendations =
          careerData?.recommendations ??
          careerData?.career_recommendations ??
          careerData?.data ??
          []


        setCareerRecommendations(
          Array.isArray(recommendations)
            ? recommendations
            : []
        )


        /*
         * ----------------------------------------------------
         * Skill gaps
         * ----------------------------------------------------
         *
         * Backend response:
         *
         * {
         *   summary: {...},
         *   gaps: [...]
         * }
         */
        const gaps =
          skillGapData?.gaps ??
          skillGapData?.skill_gaps ??
          skillGapData?.data ??
          []


        setSkillGaps(
          Array.isArray(gaps)
            ? gaps
            : []
        )


        /*
         * ----------------------------------------------------
         * Placement opportunities
         * ----------------------------------------------------
         *
         * Backend response:
         *
         * {
         *   jobs: [...]
         * }
         */
        const placements =
          placementData?.jobs ??
          placementData?.placement_matches ??
          placementData?.opportunities ??
          placementData?.data ??
          []


        setPlacementMatches(
          Array.isArray(placements)
            ? placements
            : []
        )


        /*
         * ----------------------------------------------------
         * Roadmap
         * ----------------------------------------------------
         *
         * Backend response:
         *
         * {
         *   roadmap: {
         *     items: [...]
         *   }
         * }
         */
        const items = [...(roadmapData.roadmap?.items ?? [])].sort(
  (a, b) => Number(a.week) - Number(b.week)
)


        setRoadmapItems(
          Array.isArray(items)
            ? items
            : []
        )

      } catch (err) {
        console.error(
          'Dashboard loading error:',
          err
        )

        if (isMounted) {
          setError(
            err?.message ||
              'Unable to load Dashboard data.'
          )
        }

      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }


    loadDashboard()  


    return () => {
      isMounted = false
    }

  }, [])


  /*
   * --------------------------------------------------------
   * Loading state
   * --------------------------------------------------------
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)]">

        <div className="rounded-2xl bg-[var(--surface)] px-8 py-6 shadow-sm border">

          <div className="text-lg font-semibold text-[var(--text-secondary)]">
            Loading CareerPilot AI...
          </div>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Preparing your career and placement overview.
          </p>

        </div>

      </div>
    )
  }


  /*
   * --------------------------------------------------------
   * Complete Dashboard failure
   * --------------------------------------------------------
   */
  if (error || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)] px-6">

        <div className="max-w-lg rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30 px-6 py-5 text-center">

          <p className="text-lg font-semibold text-red-700 dark:text-red-300">
            Unable to load Dashboard
          </p>

          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error ||
              'Dashboard data is unavailable.'}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 dark:hover:bg-slate-300"
          >
            Try Again
          </button>

        </div>

      </div>
    )
  }


  /*
   * --------------------------------------------------------
   * Student data
   * --------------------------------------------------------
   */
  const student =
    dashboard.student ?? {}


  /*
   * --------------------------------------------------------
   * Placement readiness
   * --------------------------------------------------------
   */
  const readinessScore = Number(
    dashboard.readiness_score ?? 0
  )


  /*
   * --------------------------------------------------------
   * Skill count
   * --------------------------------------------------------
   */
  const skillCount = Number(
    dashboard.skill_count ??
      (
        Array.isArray(dashboard.skills)
          ? dashboard.skills.length
          : 0
      )
  )


  /*
   * --------------------------------------------------------
   * Career match count
   * --------------------------------------------------------
   */
  const careerMatchCount = Number(
    dashboard.career_matches ??
      careerRecommendations.length ??
      0
  )


  /*
   * --------------------------------------------------------
   * Skill gap count
   * --------------------------------------------------------
   */
  const skillGapCount =
    getSkillGapCount(
      dashboard,
      skillGaps
    )


  /*
   * --------------------------------------------------------
   * Render Dashboard
   * --------------------------------------------------------
   */
  return (
    <div className="min-h-screen bg-[var(--page-bg)]">


      {/* ==================================================
          Header
          ================================================== */}
      <header className="border-b bg-[var(--surface)]">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div>

            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              CareerPilot AI
            </h1>

            <p className="text-sm text-[var(--text-secondary)]">
              AI-Powered Career Guidance & Placement System
            </p>

          </div>


          <div className="text-right">

            <p className="font-semibold text-[var(--text-primary)]">
              {student.name ?? 'Student'}
            </p>

            <p className="text-sm text-[var(--text-secondary)]">
              {student.target_role ??
                'Career Guidance'}
            </p>

          </div>

        </div>

      </header>



      {/* ==================================================
          Main
          ================================================== */}
      <main className="mx-auto max-w-7xl px-6 py-8">


        {/* ==================================================
            Welcome
            ================================================== */}
        <section className="mb-8">

          <h2 className="text-3xl font-bold text-[var(--text-primary)]">
            Welcome back, {student.name ?? 'Student'}
          </h2>

          <p className="mt-2 text-[var(--text-secondary)]">
            Here is your current career and placement
            readiness overview.
          </p>

        </section>



        {/* ==================================================
            Summary Cards
            ================================================== */}
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">


          {/* Placement Readiness */}
          <div className="rounded-2xl border bg-[var(--surface)] p-6 shadow-sm">

            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Placement Readiness
            </p>

            <div className="mt-3 flex items-end gap-2">

              <span className="text-4xl font-bold text-[var(--text-primary)]">
                {readinessScore}
              </span>

              <span className="mb-1 text-[var(--text-secondary)]">
                / 100
              </span>

            </div>


            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">

              <div
                className="h-2 rounded-full bg-indigo-600 transition-all dark:bg-indigo-400"
                style={{
                  width: `${Math.min(
                    Math.max(
                      readinessScore,
                      0
                    ),
                    100
                  )}%`,
                }}
              />

            </div>

          </div>



          {/* Skills */}
          <div className="rounded-2xl border bg-[var(--surface)] p-6 shadow-sm">

            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Skills
            </p>

            <p className="mt-3 text-4xl font-bold text-[var(--text-primary)]">
              {skillCount}
            </p>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Skills in your profile
            </p>

          </div>



          {/* Career Matches */}
          <div className="rounded-2xl border bg-[var(--surface)] p-6 shadow-sm">

            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Career Matches
            </p>

            <p className="mt-3 text-4xl font-bold text-[var(--text-primary)]">
              {careerMatchCount}
            </p>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Recommended career paths
            </p>

          </div>



          {/* Skill Gaps */}
          <div className="rounded-2xl border bg-[var(--surface)] p-6 shadow-sm">

            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Skill Gaps
            </p>

            <p className="mt-3 text-4xl font-bold text-[var(--text-primary)]">
              {skillGapCount}
            </p>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Skills to improve
            </p>

          </div>

        </section>



        {/* ==================================================
            Career Recommendations + Skill Gaps
            ================================================== */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">


          {/* ==================================================
              Career Recommendations
              ================================================== */}
          <div className="rounded-2xl border bg-[var(--surface)] p-6 shadow-sm">

            <div>

              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                AI Career Recommendations
              </h3>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Career paths based on your profile
              </p>

            </div>


            <div className="mt-6 space-y-4">

              {careerRecommendations
  .slice(0, 3)
  .map((career, index) => {
    const careerName =
      career.career ??
      career.role ??
      career.career_role ??
      'Recommended Career'

    const matchScore =
      career.match_score ??
      career.score ??
      career.match ??
      0

    const reason =
      career.reason ??
      career.description ??
      'Recommended based on your profile, skills, and career interests.'

    return (
      <Link
        key={
          career.id ??
          career.career_role_id ??
          index
        }
        to="/career-recommendations"
        className="block rounded-xl border bg-[var(--page-bg)] p-4 transition hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-semibold text-[var(--text-primary)]">
            {careerName}
          </h4>

          <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            {matchScore}%
          </span>
        </div>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {reason}
        </p>
      </Link>
    )
  })}


              {careerRecommendations.length === 0 && (
                <div className="rounded-xl border border-dashed p-5 text-center">

                  <p className="text-sm text-[var(--text-secondary)]">
                    No career recommendations
                    available yet.
                  </p>

                </div>
              )}

            </div>

          </div>



          {/* ==================================================
              Skill Gaps
              ================================================== */}
          <div className="rounded-2xl border bg-[var(--surface)] p-6 shadow-sm">

            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Priority Skill Gaps
            </h3>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Focus on these skills to improve your
              placement readiness.
            </p>


            <div className="mt-6 space-y-4">

              {skillGaps
                .slice(0, 5)
                .map((gap, index) => {

                  const priority =
                    String(
                      gap.priority ??
                        gap.priority_level ??
                        'medium'
                    ).toLowerCase()


                  const skillName =
                    gap.skill ??
                    gap.skill_name ??
                    gap.name ??
                    'Skill'


                  const currentLevel =
                    gap.current_level ??
                    gap.current_proficiency ??
                    gap.current_proficiency_level ??
                    'Beginner'


                  const requiredLevel =
                    gap.required_level ??
                    gap.required_proficiency ??
                    gap.required_proficiency_level ??
                    'Intermediate'


                  return (
                    <div
                      key={
                        gap.id ??
                        gap.skill_id ??
                        index
                      }
                      className="flex items-center justify-between gap-4 rounded-xl border p-4"
                    >

                      <div>

                        <h4 className="font-semibold text-[var(--text-primary)]">
                          {skillName}
                        </h4>

                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {currentLevel}
                          {' '}
                          →
                          {' '}
                          {requiredLevel}
                        </p>

                      </div>


                      <span
                        className={
                          priority === 'high'
                            ? 'shrink-0 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 dark:text-red-300 dark:bg-red-950/60 dark:text-red-300'
                            : priority === 'low'
                              ? 'shrink-0 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-950/60 dark:text-green-300'
                              : 'shrink-0 rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300'
                        }
                      >
                        {priority}
                      </span>

                    </div>
                  )
                })}


              {skillGaps.length === 0 && (
                <div className="rounded-xl border border-dashed p-5 text-center">

                  <p className="text-sm text-[var(--text-secondary)]">
                    No priority skill gaps available.
                  </p>

                </div>
              )}

            </div>

          </div>

        </section>



        {/* ==================================================
            Placement Opportunities
            ================================================== */}
        <section className="mt-8 rounded-2xl border bg-[var(--surface)] p-6 shadow-sm">

          <div>

            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Recommended Placement Opportunities
            </h3>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Jobs ranked according to your current skills.
            </p>

          </div>


          <div className="mt-6 overflow-x-auto">

            {placementMatches.length > 0 ? (

              <table className="w-full text-left">

                <thead>

                  <tr className="border-b text-sm text-[var(--text-secondary)]">

                    <th className="px-4 py-3">
                      Company
                    </th>

                    <th className="px-4 py-3">
                      Role
                    </th>

                    <th className="px-4 py-3">
                      Location
                    </th>

                    <th className="px-4 py-3">
                      Match
                    </th>

                    <th className="px-4 py-3">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {placementMatches
                    .slice(0, 5)
                    .map((job, index) => (

                      <tr
                        key={
                          job.job_id ??
                          job.id ??
                          index
                        }
                        className="border-b border-[var(--border-color)] last:border-0"
                      >

                        <td className="px-4 py-4 font-medium text-[var(--text-primary)]">
                          {job.company ??
                            job.company_name ??
                            'Company'}
                        </td>


                        <td className="px-4 py-4 text-[var(--text-secondary)]">
                          {job.role ??
                            job.job ??
                            job.title ??
                            'Placement Opportunity'}
                        </td>


                        <td className="px-4 py-4 text-[var(--text-secondary)]">
                          {job.location ?? '—'}
                        </td>


                        <td className="px-4 py-4">

                          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-950/60 dark:text-green-300">
                            {job.match_score ??
                              job.match ??
                              0}
                            %
                          </span>

                        </td>


                        <td className="px-4 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/job-match/${job.job_id ?? job.id}`
                              )
                            }
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:hover:bg-slate-300"
                          >
                            View Job
                          </button>

                        </td>

                      </tr>

                    ))}

                </tbody>

              </table>

            ) : (

              <div className="rounded-xl border border-dashed p-8 text-center">

                <p className="font-medium text-[var(--text-secondary)]">
                  No placement opportunities available.
                </p>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Check the Placement Opportunities
                  page for available jobs.
                </p>

              </div>

            )}

          </div>

        </section>



        {/* ==================================================
            Learning Roadmap
            ================================================== */}
        <section className="mt-8 rounded-2xl border bg-[var(--surface)] p-6 shadow-sm">

          <div>

            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Your 30-Day Learning Roadmap
            </h3>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Personalized learning plan based on your
              skill gaps.
            </p>

          </div>


          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            {roadmapItems
              .slice(0, 4)
              .map((item, index) => (

                <div
                  key={
                    item.id ??
                    index
                  }
                  className="rounded-xl border p-5"
                >

                  <p className="text-sm font-semibold text-indigo-600">
                    Week{' '}
                    {item.week ??
                      item.week_number ??
                      index + 1}
                  </p>


                  <h4 className="mt-2 font-bold text-[var(--text-primary)]">
                    {item.title ??
                      'Learning Goal'}
                  </h4>


                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {item.description ??
                      'Personalized learning activity.'}
                  </p>


                  {item.skill && (
                    <p className="mt-3 text-xs font-medium text-[var(--text-secondary)]">
                      Skill: {item.skill}
                    </p>
                  )}


                  <span
                    className={
                      item.completed
                        ? 'mt-4 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/60 dark:text-green-300'
                        : 'mt-4 inline-block rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]'
                    }
                  >
                    {item.completed
                      ? 'Completed'
                      : 'Not Started'}
                  </span>

                </div>

              ))}


            {roadmapItems.length === 0 && (
              <div className="md:col-span-2 lg:col-span-4 rounded-xl border border-dashed p-8 text-center">

                <p className="font-medium text-[var(--text-secondary)]">
                  No roadmap items available.
                </p>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Open the Roadmap page to view your
                  personalized learning plan.
                </p>

              </div>
            )}

          </div>

        </section>

      </main>

    </div>
  )
}


/*
 * ============================================================
 * Skill Gap Count
 * ============================================================
 */
function getSkillGapCount(
  dashboard,
  skillGaps
) {

  if (
    typeof dashboard.skill_gap_count ===
    'number'
  ) {
    return dashboard.skill_gap_count
  }


  if (
    typeof dashboard.skill_gaps_count ===
    'number'
  ) {
    return dashboard.skill_gaps_count
  }


  if (
    typeof dashboard.skill_gaps_total ===
    'number'
  ) {
    return dashboard.skill_gaps_total
  }


  return skillGaps.length
}


export default Dashboard