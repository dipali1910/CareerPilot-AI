import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const API_BASE_URL = 'https://careerpilot-ai-backend-docker.onrender.com'

export default function ApplyJob() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [applicant, setApplicant] = useState(null)
  const [applications, setApplications] = useState([])

  const [coverLetter, setCoverLetter] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadPageData()
  }, [jobId])

  const loadPageData = async () => {
    try {
      setLoading(true)
      setError('')

      // ---------------------------------------------------------
      // 1. Get the CURRENTLY LOGGED-IN Supabase user
      // ---------------------------------------------------------
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error('Supabase auth error:', authError)
        navigate('/login')
        return
      }

      if (!user?.email) {
        navigate('/login')
        return
      }

      const email = user.email

      console.log('CURRENT LOGGED-IN USER:', email)

      // ---------------------------------------------------------
      // 2. Get the student's actual profile from backend
      // ---------------------------------------------------------
      const profileResponse = await fetch(
        `${API_BASE_URL}/api/student/dashboard?email=${encodeURIComponent(
          email
        )}`
      )

      const profileData = await profileResponse.json()

      console.log('STUDENT PROFILE:', profileData)

      if (!profileResponse.ok) {
        throw new Error(
          profileData.detail ||
            profileData.message ||
            'Unable to load your student profile.'
        )
      }

      if (
        profileData.status !== 'success' ||
        !profileData.student
      ) {
        throw new Error('Student profile not found.')
      }

      const student = profileData.student

      // ---------------------------------------------------------
      // 3. Build applicant information from the database
      // ---------------------------------------------------------
      setApplicant({
        name: student.name || '',
        email: student.email || email,
        degree: student.degree || '',
        specialization: student.specialization || '',
        graduationYear: student.graduation_year || '',
        location: student.location || '',
        targetRole: student.target_role || '',
      })

      // ---------------------------------------------------------
      // 4. Get job details
      // ---------------------------------------------------------
      const jobResponse = await fetch(
        `${API_BASE_URL}/api/student/job-match/${jobId}?email=${encodeURIComponent(
          email
        )}`
      )

      const jobData = await jobResponse.json()

      console.log('JOB DATA:', jobData)

      if (!jobResponse.ok) {
        throw new Error(
          jobData.detail ||
            jobData.message ||
            'Unable to load job details.'
        )
      }

      if (jobData.status === 'success') {
        setJob(
          jobData.job ||
            jobData.data ||
            jobData
        )
      } else {
        setJob(
          jobData.job ||
            jobData.data ||
            jobData
        )
      }

      // ---------------------------------------------------------
      // 5. Get CURRENT student's applications
      // ---------------------------------------------------------
      const applicationsResponse = await fetch(
        `${API_BASE_URL}/api/student/applications?email=${encodeURIComponent(
          email
        )}`
      )

      if (applicationsResponse.ok) {
        const applicationsData =
          await applicationsResponse.json()

        console.log(
          'CURRENT STUDENT APPLICATIONS:',
          applicationsData
        )

        if (applicationsData.status === 'success') {
          setApplications(
            applicationsData.applications ||
              applicationsData.data ||
              []
          )
        } else {
          setApplications(
            applicationsData.applications ||
              applicationsData.data ||
              []
          )
        }
      }
    } catch (err) {
      console.error('Apply Job page error:', err)

      setError(
        err.message ||
          'Something went wrong while loading the application page.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------
  // Helper for reading job values safely
  // ---------------------------------------------------------
  const getJobValue = (keys, fallback = '') => {
    if (!job) {
      return fallback
    }

    for (const key of keys) {
      if (
        job[key] !== undefined &&
        job[key] !== null &&
        job[key] !== ''
      ) {
        return job[key]
      }
    }

    return fallback
  }

  // ---------------------------------------------------------
  // Check whether CURRENT student already applied
  // ---------------------------------------------------------
  const hasAlreadyApplied = applications.some(
    (application) =>
      String(
        application.job_id ??
          application.jobId ??
          application.job?.id
      ) === String(jobId)
  )

  // ---------------------------------------------------------
  // Submit application
  // ---------------------------------------------------------
  const handleSubmit = async (event) => {
    event.preventDefault()

    if (hasAlreadyApplied) {
      setError(
        'You have already applied for this job.'
      )
      return
    }

    try {
      setSubmitting(true)
      setError('')

      // Get CURRENT logged-in user again
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user?.email) {
        navigate('/login')
        return
      }

      const email = user.email

      console.log(
        'SUBMITTING APPLICATION FOR:',
        email
      )

      // -------------------------------------------------------
      // Submit application
      // -------------------------------------------------------
      const response = await fetch(
        `${API_BASE_URL}/api/student/applications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            job_id: jobId,
            cover_letter: coverLetter.trim(),
          }),
        }
      )

      const data = await response.json()

      console.log(
        'APPLICATION RESPONSE:',
        data
      )

      if (!response.ok) {
        if (response.status === 409) {
          setError(
            'You have already applied for this job.'
          )
          return
        }

        throw new Error(
          data.detail ||
            data.message ||
            'Unable to submit your application.'
        )
      }

      setSuccess(true)

      // Go to Application Tracking after successful submission
      setTimeout(() => {
        navigate('/application-tracking')
      }, 1200)
    } catch (err) {
      console.error(
        'Application submission error:',
        err
      )

      setError(
        err.message ||
          'Something went wrong while submitting your application.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-[var(--text-secondary)]">
            Loading application details...
          </p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------
  // Error when page could not load
  // ---------------------------------------------------------
  if (error && (!job || !applicant)) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-6">
        <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border-color)] p-8 max-w-lg w-full text-center">
          <div className="text-red-500 text-4xl mb-4">
            !
          </div>

          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Unable to Load Application
          </h2>

          <p className="text-[var(--text-secondary)] mb-6">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/placement-opportunities')
            }
            className="px-5 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Back to Opportunities
          </button>
        </div>
      </div>
    )
  }

  if (!job || !applicant) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">
          Application information is not available.
        </p>
      </div>
    )
  }

  // ---------------------------------------------------------
  // Job fields
  // ---------------------------------------------------------
  const company = getJobValue(
    [
      'company_name',
      'company',
      'companyName',
    ],
    'Company'
  )

  const title = getJobValue(
    [
      'job_title',
      'title',
      'role',
      'job_role',
      'position',
    ],
    'Job Opportunity'
  )

  const location = getJobValue(
    [
      'location',
      'job_location',
    ],
    'Location not specified'
  )

  const salary = getJobValue(
    [
      'salary_range',
      'salary',
      'package',
      'ctc',
    ],
    'Salary not specified'
  )

  const experience = getJobValue(
    [
      'experience',
      'experience_required',
    ],
    'Fresher'
  )

  const matchScore = getJobValue(
    [
      'match_score',
      'matchScore',
      'score',
    ],
    null
  )

  // ---------------------------------------------------------
  // Education display
  // ---------------------------------------------------------
  let education = applicant.degree || ''

  if (applicant.specialization) {
    education = education
      ? `${education} · ${applicant.specialization}`
      : applicant.specialization
  }

  if (!education) {
    education = 'Not provided'
  }

  // ---------------------------------------------------------
  // Page UI
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6"
        >
          <span className="text-xl">
            ←
          </span>

          <span>
            Back
          </span>
        </button>

        {/* ------------------------------------------------ */}
        {/* Job Information */}
        {/* ------------------------------------------------ */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] shadow-sm p-7 mb-7">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                {company}
              </p>

              <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-4">
                {title}
              </h1>

              <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                <span>
                  📍 {location}
                </span>

                <span>
                  💰 {salary}
                </span>

                <span>
                  ⏱️ {experience}
                </span>
              </div>
            </div>

            {matchScore !== null && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-6 py-5 min-w-[150px]">
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">
                  Your Match
                </p>

                <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">
                  {matchScore}%
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------ */}
        {/* Applicant Information */}
        {/* ------------------------------------------------ */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] shadow-sm p-7 mb-7">

          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Applicant Information
          </h2>

          <p className="text-[var(--text-muted)] mb-7">
            This information comes from your student profile.
          </p>

          <div className="space-y-6">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
                Full Name
              </label>

              <div className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] px-5 py-4 text-[var(--text-primary)]">
                {applicant.name}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
                Email
              </label>

              <div className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] px-5 py-4 text-[var(--text-primary)]">
                {applicant.email}
              </div>
            </div>

            {/* Education */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
                Education
              </label>

              <div className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] px-5 py-4 text-[var(--text-primary)]">
                {education}
              </div>
            </div>

            {/* Target Role */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
                Target Role
              </label>

              <div className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] px-5 py-4 text-[var(--text-primary)]">
                {applicant.targetRole || 'Not provided'}
              </div>
            </div>

          </div>
        </div>

        {/* ------------------------------------------------ */}
        {/* Application */}
        {/* ------------------------------------------------ */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] shadow-sm p-7">

          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Application
          </h2>

          <p className="text-[var(--text-muted)] mb-6">
            Add an optional cover letter before submitting your application.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Already Applied */}
          {hasAlreadyApplied ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5">

              <h3 className="font-semibold text-amber-900 mb-1">
                Already Applied
              </h3>

              <p className="text-amber-800 mb-4">
                You have already submitted an application for this position.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate('/application-tracking')
                }
                className="px-5 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                Track Application
              </button>

            </div>
          ) : success ? (
            /* Success */
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-6 text-center">

              <div className="text-4xl mb-3">
                ✓
              </div>

              <h3 className="text-xl font-semibold text-emerald-900 mb-2">
                Application Submitted
              </h3>

              <p className="text-emerald-800">
                Your application was submitted successfully.
              </p>

            </div>
          ) : (
            /* Application Form */
            <form onSubmit={handleSubmit}>

              <div className="mb-6">

                <label
                  htmlFor="coverLetter"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                >
                  Cover Letter
                </label>

                <textarea
                  id="coverLetter"
                  value={coverLetter}
                  onChange={(event) =>
                    setCoverLetter(event.target.value)
                  }
                  rows={7}
                  placeholder="Write a short message explaining why you are a good fit for this position..."
                  className="w-full rounded-xl border border-[var(--border-color)] px-4 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />

              </div>

              <div className="flex flex-col sm:flex-row gap-3">

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-blue-600 px-6 py-4 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? 'Submitting Application...'
                    : 'Submit Application'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/placement-opportunities')
                  }
                  className="px-6 py-4 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-medium hover:bg-[var(--page-bg)]"
                >
                  Cancel
                </button>

              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  )
}