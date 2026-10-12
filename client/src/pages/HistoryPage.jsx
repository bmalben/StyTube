import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/history`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Unable to load history.')
      }

      const data = await response.json()
      setHistory(data.items || [])
      setError('')
    } catch (historyError) {
      setError(historyError.message || 'Unable to load watch history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Loading your watch history...
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">History</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Recently watched</h1>
          </div>
          <Link to="/select" className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            Browse videos
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-800">
            <p className="text-xl font-semibold text-slate-700 dark:text-slate-100">No watch history yet.</p>
            <p className="mt-2 text-slate-500 dark:text-slate-300">Watch a few videos to see them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Link
                key={item.id}
                to={`/watch/${item.videoId}?class=${item.classLevel || 10}&syllabus=${encodeURIComponent(item.syllabus || 'cbse')}&subject=${encodeURIComponent(item.subject || 'physics')}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500/60 dark:hover:bg-slate-800 sm:flex-row"
              >
                <img src={item.thumbnail} alt={item.title} className="h-24 w-40 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-2 text-lg font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{item.subject} • {item.chapter}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Last watched: {new Date(item.lastWatchedAt).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default HistoryPage
