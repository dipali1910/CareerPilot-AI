import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const API_BASE_URL = 'https://careerpilot-ai-backend-docker.onrender.com'

export default function ResumeUpload() {
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = (selectedFile) => {
    setError('')

    if (!selectedFile) return

    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file only.')
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be 5 MB or less.')
      return
    }

    setFile(selectedFile)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)

    const droppedFile = event.dataTransfer.files?.[0]
    handleFile(droppedFile)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!file) {
      setError('Please select your resume first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('Your session has expired. Please sign in again.')
      }

      const email = user.email

      if (!email) {
        throw new Error('Email was not found for your account.')
      }

      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        ''

      const formData = new FormData()

      formData.append('file', file)
      formData.append('email', email)
      formData.append('name', fullName)
      formData.append('auth_user_id', user.id)

      const response = await fetch(
        `${API_BASE_URL}/api/student/resume-upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result?.detail || 'Resume processing failed.'
        )
      }

      navigate('/dashboard')
    } catch (err) {
      console.error('Resume upload error:', err)
      setError(
        err.message ||
          'Something went wrong while processing your resume.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] px-6 py-10">
      <div className="mx-auto max-w-3xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Complete Your Profile
          </h1>

          <p className="mt-2 text-[var(--text-secondary)]">
            Upload your resume and CareerPilot AI will create your
            student profile automatically.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-8 shadow-sm">

          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-12 text-center transition ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                : 'border-[var(--border-color)] bg-[var(--surface-secondary)]'
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50 text-3xl">
              📄
            </div>

            <h2 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
              Upload your resume
            </h2>

            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Drag and drop your PDF here, or choose a file from your
              computer.
            </p>

            <label className="mt-6 inline-flex cursor-pointer rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700">
              Choose Resume
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(event) =>
                  handleFile(event.target.files?.[0])
                }
              />
            </label>

            <p className="mt-4 text-xs text-[var(--text-muted)]">
              PDF only • Maximum 5 MB
            </p>
          </div>

          {file && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4">
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || loading}
            className="mt-8 w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-[var(--surface-hover)]"
          >
            {loading
              ? 'Analyzing Resume...'
              : 'Analyze Resume & Create Profile'}
          </button>

          <div className="mt-6 rounded-xl bg-blue-50 dark:bg-blue-950/40 p-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              What happens next?
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-800 dark:text-blue-200">
              CareerPilot AI will extract your education, skills,
              experience and career information from your resume and
              use it to create your student profile.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}