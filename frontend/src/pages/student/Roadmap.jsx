import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE_URL = 'http://127.0.0.1:8000'
const STUDENT_EMAIL = 'student@careerpilot.ai'


function Roadmap() {
  const [data, setData] = useState(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [completedItems, setCompletedItems] = useState([])

  const [updatingItem, setUpdatingItem] = useState(null)

  const [successMessage, setSuccessMessage] = useState('')

  const [saveError, setSaveError] = useState('')


  // ============================================================
  // LOAD ROADMAP
  // ============================================================

  useEffect(() => {
    fetchRoadmap()
  }, [])


  const fetchRoadmap = async () => {
    try {
      setLoading(true)
      setError('')

      const encodedEmail =
        encodeURIComponent(STUDENT_EMAIL)

      const response = await fetch(
        `${API_BASE_URL}/api/student/roadmap?email=${encodedEmail}`
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
          'Unable to load learning roadmap.'
        )
      }

      setData(result)


      // --------------------------------------------------------
      // Read completion status returned by the database
      // --------------------------------------------------------

      const roadmapItems =
        Array.isArray(result?.roadmap?.items)
          ? result.roadmap.items
          : []


      const completed = roadmapItems
        .filter(
          (item) =>
            item.completed === true
        )
        .map(
          (item) => item.id
        )
        .filter(Boolean)


      setCompletedItems(completed)

    } catch (err) {

      console.error(
        'Roadmap loading error:',
        err
      )

      setError(
        err?.message ||
        'Unable to load learning roadmap.'
      )

    } finally {

      setLoading(false)

    }
  }


  // ============================================================
  // MARK ROADMAP ITEM COMPLETED / INCOMPLETE
  // ============================================================

  const toggleComplete = async (itemId) => {

    if (!itemId) {
      setSaveError(
        'Roadmap item ID is missing.'
      )
      return
    }


    if (updatingItem) {
      return
    }


    const isCurrentlyCompleted =
      completedItems.includes(itemId)


    const newCompletedStatus =
      !isCurrentlyCompleted


    try {

      setUpdatingItem(itemId)

      setSuccessMessage('')

      setSaveError('')


      // --------------------------------------------------------
      // Save completion status through FastAPI
      // --------------------------------------------------------

      const response = await fetch(
        `${API_BASE_URL}/api/student/roadmap-item`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email: STUDENT_EMAIL,
            item_id: itemId,
            completed: newCompletedStatus,
          }),
        }
      )


      const result = await response.json()


      if (!response.ok) {

        throw new Error(
          result.detail ||
          'Unable to update roadmap progress.'
        )

      }


      console.log(
        'Roadmap item update response:',
        result
      )


      // --------------------------------------------------------
      // IMPORTANT:
      // Re-fetch roadmap from backend after PATCH.
      //
      // This verifies that the value was actually saved in
      // Supabase instead of only changing React state.
      // --------------------------------------------------------

      const verifyResponse = await fetch(
        `${API_BASE_URL}/api/student/roadmap?email=${encodeURIComponent(STUDENT_EMAIL)}`
      )


      const verifiedData =
        await verifyResponse.json()


      if (!verifyResponse.ok) {

        throw new Error(
          verifiedData.detail ||
          'The roadmap was updated, but the saved status could not be verified.'
        )

      }


      const verifiedItems =
        Array.isArray(
          verifiedData?.roadmap?.items
        )
          ? verifiedData.roadmap.items
          : []


      // --------------------------------------------------------
      // Read the saved value returned from the database
      // --------------------------------------------------------

      const verifiedCompletedItems =
        verifiedItems
          .filter(
            (item) =>
              item.completed === true
          )
          .map(
            (item) =>
              item.id
          )
          .filter(Boolean)


      const savedItem =
        verifiedItems.find(
          (item) =>
            item.id === itemId
        )


      const savedStatus =
        savedItem?.completed === true


      console.log(
        'Roadmap item saved status:',
        {
          itemId,
          requestedStatus:
            newCompletedStatus,
          databaseStatus:
            savedStatus,
        }
      )


      // --------------------------------------------------------
      // Verify database value
      // --------------------------------------------------------

      if (
        savedStatus !==
        newCompletedStatus
      ) {

        throw new Error(
          'The roadmap item could not be saved correctly. Please try again.'
        )

      }


      // --------------------------------------------------------
      // Database save confirmed
      // --------------------------------------------------------

      setData(
        verifiedData
      )


      setCompletedItems(
        verifiedCompletedItems
      )


      // --------------------------------------------------------
      // Success message
      // --------------------------------------------------------

      if (savedStatus) {

        setSuccessMessage(
          'Learning goal marked as completed.'
        )

      } else {

        setSuccessMessage(
          'Learning goal marked as incomplete.'
        )

      }


      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)


    } catch (err) {

      console.error(
        'Roadmap update error:',
        err
      )


      setSaveError(
        err?.message ||
        'Unable to update roadmap progress.'
      )

    } finally {

      setUpdatingItem(null)

    }
  }


  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-slate-600">
            Loading your learning roadmap...
          </p>

        </div>

      </div>
    )

  }


  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error) {

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">

        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-lg w-full text-center">

          <div className="text-4xl mb-4">
            ⚠️
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Unable to Load Roadmap
          </h2>

          <p className="text-slate-600 mb-6">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchRoadmap}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Try Again
          </button>

        </div>

      </div>
    )

  }


  // ============================================================
  // DATA
  // ============================================================

  const student =
    data?.student || {}


  const roadmap =
    data?.roadmap || {}


  const items =
    Array.isArray(roadmap?.items)
      ? roadmap.items
      : []


  // ============================================================
  // PROGRESS
  // ============================================================

  const completedCount =
    completedItems.length


  const progress =
    items.length > 0
      ? Math.round(
          (completedCount /
            items.length) *
            100
        )
      : 0


  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="bg-white border-b border-slate-200">

        <div className="max-w-6xl mx-auto px-6 py-5">

          <Link
            to="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Dashboard
          </Link>


          <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">

            <div>

              <h1 className="text-3xl font-bold text-slate-950">
                Personalized Learning Roadmap
              </h1>

              <p className="mt-2 text-slate-600 text-lg">
                A structured learning plan based on your career goals and skill gaps.
              </p>

            </div>


            <div className="text-left md:text-right">

              <p className="font-bold text-slate-900">
                {student.name}
              </p>

              <p className="text-slate-500">
                Target role: {student.target_role}
              </p>

            </div>

          </div>

        </div>

      </header>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="max-w-6xl mx-auto px-6 py-8">


        {/* ====================================================
            SUCCESS MESSAGE
        ==================================================== */}

        {successMessage && (

          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-5 py-4">

            <div className="flex items-center gap-3">

              <span className="text-xl">
                ✓
              </span>

              <p className="font-medium">
                {successMessage}
              </p>

            </div>

          </div>

        )}


        {/* ====================================================
            SAVE ERROR
        ==================================================== */}

        {saveError && (

          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4">

            <div className="flex items-start gap-3">

              <span className="text-xl">
                ⚠️
              </span>

              <div>

                <p className="font-semibold">
                  Unable to save progress
                </p>

                <p className="mt-1 text-sm">
                  {saveError}
                </p>

              </div>

            </div>

          </div>

        )}


        {/* ====================================================
            ROADMAP OVERVIEW
        ==================================================== */}

        <section className="bg-blue-50 border border-blue-100 rounded-2xl p-8">

          <div className="flex items-start gap-5">

            <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl flex-shrink-0">
              🧭
            </div>


            <div className="flex-1">

              <p className="text-blue-600 font-semibold uppercase text-sm tracking-wide">
                Personalized Roadmap
              </p>


              <h2 className="text-2xl font-bold text-slate-950 mt-2">
                {roadmap.title}
              </h2>


              <p className="text-slate-600 mt-3">
                Follow this roadmap to strengthen the skills needed for your target career.
              </p>

            </div>

          </div>


          {/* ==================================================
              PROGRESS
          ================================================== */}

          <div className="mt-8 bg-white border border-blue-100 rounded-2xl p-6">

            <div className="flex items-center justify-between mb-4">

              <span className="font-semibold text-slate-600">
                Overall Progress
              </span>


              <span className="text-2xl font-bold text-blue-600">
                {progress}%
              </span>

            </div>


            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>


            <p className="text-sm text-slate-500 mt-3">
              {completedCount} of {items.length} learning goals completed
            </p>

          </div>

        </section>


        {/* ====================================================
            STAT CARDS
        ==================================================== */}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-7">


          {/* Duration */}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <p className="text-slate-500 font-medium">
              Duration
            </p>

            <p className="text-4xl font-bold text-slate-950 mt-4">
              {roadmap.duration_days}
            </p>

            <p className="text-slate-400 mt-1">
              days
            </p>

          </div>


          {/* Learning Goals */}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <p className="text-slate-500 font-medium">
              Learning Goals
            </p>

            <p className="text-4xl font-bold text-slate-950 mt-4">
              {items.length}
            </p>

            <p className="text-slate-400 mt-1">
              roadmap items
            </p>

          </div>


          {/* Completed */}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <p className="text-slate-500 font-medium">
              Completed
            </p>

            <p className="text-4xl font-bold text-emerald-600 mt-4">
              {completedCount}
            </p>

            <p className="text-slate-400 mt-1">
              goals completed
            </p>

          </div>

        </section>


        {/* ====================================================
            LEARNING PLAN
        ==================================================== */}

        <section className="bg-white border border-slate-200 rounded-2xl p-8 mt-7">

          <h2 className="text-2xl font-bold text-slate-950">
            Your Learning Plan
          </h2>


          <p className="text-slate-500 mt-2">
            Complete each milestone in order to build your skills progressively.
          </p>


          {/* ==================================================
              LEARNING ITEMS
          ================================================== */}

          <div className="mt-8 space-y-5">

            {items.map((item, index) => {

              const isCompleted =
                completedItems.includes(item.id)


              const isUpdating =
                updatingItem === item.id


              return (

                <div
                  key={item.id || index}
                  className={`border rounded-2xl p-6 transition-all duration-300 ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >

                  <div className="flex flex-col md:flex-row md:items-center gap-5">


                    {/* ========================================
                        STEP NUMBER
                    ======================================== */}

                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >

                      {isCompleted
                        ? '✓'
                        : index + 1}

                    </div>


                    {/* ========================================
                        CONTENT
                    ======================================== */}

                    <div className="flex-1">

                      <p className="text-sm font-semibold text-blue-600">
                        Week {item.week || index + 1}
                      </p>


                      <h3 className="text-xl font-bold text-slate-950 mt-1">

                        {item.title ||
                          item.name ||
                          item.task ||
                          `Learning Task ${index + 1}`}

                      </h3>


                      {item.description && (

                        <p className="text-slate-600 mt-2">
                          {item.description}
                        </p>

                      )}


                      {item.skill && (

                        <p className="text-sm text-slate-500 mt-2">
                          Focus skill: {item.skill}
                        </p>

                      )}


                      {item.duration && (

                        <p className="text-sm text-slate-500 mt-1">
                          Estimated duration: {item.duration}
                        </p>

                      )}

                    </div>


                    {/* ========================================
                        COMPLETE BUTTON
                    ======================================== */}

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        toggleComplete(item.id)
                      }
                      className={`px-5 py-2.5 rounded-lg font-semibold transition-all min-w-[170px] ${
                        isUpdating
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : isCompleted
                            ? 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >

                      {isUpdating
                        ? 'Saving...'
                        : isCompleted
                          ? '✓ Completed'
                          : 'Mark as Completed'}

                    </button>

                  </div>

                </div>

              )

            })}


            {/* ==================================================
                NO ITEMS
            ================================================== */}

            {items.length === 0 && (

              <div className="text-center py-12">

                <div className="text-4xl mb-4">
                  📚
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  No Learning Goals Found
                </h3>

                <p className="text-slate-500 mt-2">
                  Your personalized roadmap does not have any learning goals yet.
                </p>

              </div>

            )}

          </div>

        </section>


        {/* ====================================================
            COMPLETION MESSAGE
        ==================================================== */}

        {progress === 100 &&
          items.length > 0 && (

            <div className="mt-7 bg-emerald-50 border border-emerald-200 rounded-2xl p-6">

              <div className="flex items-start gap-4">

                <div className="text-3xl">
                  🎉
                </div>


                <div>

                  <h3 className="text-xl font-bold text-emerald-800">
                    Roadmap Completed!
                  </h3>

                  <p className="text-emerald-700 mt-1">
                    Excellent work! You have completed all the learning goals in your personalized roadmap.
                  </p>

                </div>

              </div>

            </div>

          )}


        {/* ====================================================
            BOTTOM NAVIGATION
        ==================================================== */}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-7">

          <Link
            to="/skill-gap"
            className="text-blue-600 font-medium hover:text-blue-700"
          >
            ← Back to Skill Gap
          </Link>


          <Link
            to="/dashboard"
            className="text-slate-600 font-medium hover:text-slate-900"
          >
            Return to Dashboard
          </Link>

        </div>

      </main>

    </div>
  )
}


export default Roadmap