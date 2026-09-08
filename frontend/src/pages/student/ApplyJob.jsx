import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

const API_BASE_URL = 'http://127.0.0.1:8000'
const STUDENT_EMAIL = 'student@careerpilot.ai'

function ApplyJob() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [student, setStudent] = useState(null)

  const [coverLetter, setCoverLetter] = useState('')
  const [confirmProfile, setConfirmProfile] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')

  const [success, setSuccess] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [existingApplication, setExistingApplication] = useState(null)

  useEffect(() => {
    fetchApplicationData()
  }, [jobId])

  const fetchApplicationData = async () => {
    try {
      setLoading(true)
      setError('')
      setSubmitError('')

      // ----------------------------------------------------
      // Get job details
      // ----------------------------------------------------

      const jobResponse = await fetch(
        `${API_BASE_URL}/api/student/job-match/${jobId}?email=${encodeURIComponent(
          STUDENT_EMAIL
        )}`
      )

      const jobData = await jobResponse.json()

      if (!jobResponse.ok) {
        throw new Error(
          jobData.detail || 'Unable to load job details.'
        )
      }

      setJob(jobData.job)
      setStudent(jobData.student)

      // ----------------------------------------------------
      // Check existing applications
      // ----------------------------------------------------

      const applicationResponse = await fetch(
        `${API_BASE_URL}/api/student/applications?email=${encodeURIComponent(
          STUDENT_EMAIL
        )}`
      )

      const applicationData = await applicationResponse.json()

      if (!applicationResponse.ok) {
        throw new Error(
          applicationData.detail ||
            'Unable to check application status.'
        )
      }

      const applications = applicationData.applications || []

      const currentApplication = applications.find(
        (application) =>
          String(application.job_id) === String(jobId)
      )

      if (currentApplication) {
        setAlreadyApplied(true)
        setExistingApplication(currentApplication)
      } else {
        setAlreadyApplied(false)
        setExistingApplication(null)
      }
    } catch (err) {
      setError(
        err.message || 'Unable to load application information.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSubmitError('')

    // ----------------------------------------------------
    // Prevent duplicate submission
    // ----------------------------------------------------

    if (alreadyApplied) {
      setSubmitError(
        'You have already applied for this job.'
      )
      return
    }

    // ----------------------------------------------------
    // Profile confirmation validation
    // ----------------------------------------------------

    if (!confirmProfile) {
      setSubmitError(
        'Please confirm that your profile information is accurate.'
      )
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(
        `${API_BASE_URL}/api/student/applications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: STUDENT_EMAIL,
            job_id: jobId,
            cover_letter: coverLetter.trim(),
          }),
        }
      )

      const data = await response.json()

      // ----------------------------------------------------
      // Handle duplicate application
      // ----------------------------------------------------

      if (response.status === 409) {
        setAlreadyApplied(true)

        setExistingApplication(
          data.application || null
        )

        setSubmitError(
          data.detail ||
            'You have already applied for this job.'
        )

        return
      }

      // ----------------------------------------------------
      // Handle other errors
      // ----------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Unable to submit application.'
        )
      }

      // ----------------------------------------------------
      // Successful application
      // ----------------------------------------------------

      setSuccess(true)

      setAlreadyApplied(true)

      setExistingApplication(
        data.application || {
          job_id: jobId,
          status: 'applied',
        }
      )
    } catch (err) {
      setSubmitError(
        err.message ||
          'Unable to submit application. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-7 w-48 rounded bg-slate-200" />
            <div className="h-40 rounded-2xl bg-white" />
            <div className="h-96 rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // PAGE ERROR
  // ============================================================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
          <div className="w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              !
            </div>

            <h1 className="mt-4 text-xl font-semibold text-slate-900">
              Unable to load application
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <Link
              to={`/job-match/${jobId}`}
              className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              ← Back to Job Details
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // ALREADY APPLIED
  // ============================================================

  if (alreadyApplied && !success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
          <div className="w-full rounded-2xl border border-blue-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <span className="text-3xl text-blue-600">
                ✓
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Already Applied
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              You have already submitted an application for{' '}
              <span className="font-semibold text-slate-700">
                {job?.role}
              </span>{' '}
              at{' '}
              <span className="font-semibold text-slate-700">
                {job?.company}
              </span>.
            </p>

            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Application Status
              </p>

              <p className="mt-1 text-sm font-semibold capitalize text-blue-600">
                {existingApplication?.status || 'Applied'}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

              <button
                onClick={() =>
                  navigate('/application-tracking')
                }
                className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Track Application
              </button>

              <button
                onClick={() =>
                  navigate('/placement-opportunities')
                }
                className="flex-1 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View Opportunities
              </button>

            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Go to Dashboard
            </button>

          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // SUCCESS
  // ============================================================

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
          <div className="w-full rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <span className="text-3xl text-emerald-600">
                ✓
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Application Submitted
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Your application for{' '}
              <span className="font-semibold text-slate-700">
                {job?.role}
              </span>{' '}
              at{' '}
              <span className="font-semibold text-slate-700">
                {job?.company}
              </span>{' '}
              has been submitted successfully.
            </p>

            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Application Status
              </p>

              <p className="mt-1 text-sm font-semibold capitalize text-blue-600">
                {existingApplication?.status || 'Applied'}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

              <button
                onClick={() =>
                  navigate('/application-tracking')
                }
                className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Track Application
              </button>

              <button
                onClick={() =>
                  navigate('/placement-opportunities')
                }
                className="flex-1 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View Opportunities
              </button>

            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Go to Dashboard
            </button>

          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // MAIN APPLICATION FORM
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">

          <Link
            to={`/job-match/${jobId}`}
            className="text-sm font-medium text-slate-500 hover:text-blue-600"
          >
            ← Back to Job Details
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Apply for Job
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Complete your application before submitting.
          </p>

        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Job Summary */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

            <div>

              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Placement Opportunity
              </span>

              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                {job?.role}
              </h2>

              <p className="mt-1 text-base font-medium text-slate-600">
                {job?.company}
              </p>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                <span>📍 {job?.location}</span>
                <span>💰 {job?.salary}</span>
                <span>⏱ {job?.experience}</span>
              </div>

            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">

              <p className="text-xs font-medium text-emerald-600">
                Your Match
              </p>

              <p className="mt-1 text-3xl font-bold text-emerald-700">
                {job?.match_score}%
              </p>

            </div>

          </div>

        </section>

        {/* Application Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6"
        >

          {/* Applicant Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Applicant Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              This information comes from your student profile.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Full Name
                </label>

                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {student?.name}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Email
                </label>

                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {student?.email}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Education
                </label>

                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {student?.degree} · {student?.specialization}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Target Role
                </label>

                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {student?.target_role}
                </div>
              </div>

            </div>

          </section>

          {/* Cover Letter */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div>

              <h2 className="text-lg font-semibold text-slate-900">
                Application Message
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add a short message explaining why you are interested in this opportunity.
              </p>

            </div>

            <textarea
              value={coverLetter}
              onChange={(event) =>
                setCoverLetter(event.target.value)
              }
              rows={7}
              maxLength={1000}
              placeholder="Example: I am interested in this opportunity because..."
              className="mt-5 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-2 flex justify-end">
              <span className="text-xs text-slate-400">
                {coverLetter.length}/1000
              </span>
            </div>

          </section>

          {/* Confirmation */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <label className="flex cursor-pointer items-start gap-3">

              <input
                type="checkbox"
                checked={confirmProfile}
                onChange={(event) =>
                  setConfirmProfile(event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              <span className="text-sm leading-6 text-slate-600">
                I confirm that the information in my student profile is accurate and I want to submit this application.
              </span>

            </label>

            {submitError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

          </section>

          {/* Submit */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="font-semibold text-slate-900">
                  Ready to submit?
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Your application will be saved with the status “Applied”.
                </p>

              </div>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Submitting...'
                  : 'Submit Application →'}
              </button>

            </div>

          </section>

        </form>

      </main>

    </div>
  )
}

export default ApplyJob