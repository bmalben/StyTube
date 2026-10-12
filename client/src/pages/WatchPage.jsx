import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { searchVideos } from '../services/youtubeService'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function WatchPage() {
  const { user } = useAuth()
  const { videoId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const classLevel = Number(searchParams.get('class') ?? 10)
  const syllabus = String(searchParams.get('syllabus') ?? 'cbse')
  const subject = String(searchParams.get('subject') ?? 'physics')
  const language = String(searchParams.get('language') ?? 'Any')

  const [video, setVideo] = useState(null)
  const [relatedVideos, setRelatedVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await searchVideos({ classLevel, syllabus, subject, language })
        const foundVideo = response.items.find((item) => item.id === videoId) || null

        setVideo(foundVideo ? { ...foundVideo, channel: foundVideo.channelTitle || foundVideo.channel || 'StudyTube' } : null)

        const moreVideos = (response.items || [])
          .filter((item) => item.id !== videoId && item.subject === (foundVideo?.subject || subject))
          .slice(0, 4)
          .map((item) => ({ ...item, channel: item.channelTitle || item.channel || 'StudyTube' }))

        setRelatedVideos(moreVideos)
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load the selected video.')
      } finally {
        setLoading(false)
      }
    }

    fetchVideo()
  }, [classLevel, language, subject, syllabus, videoId])

  useEffect(() => {
    if (!user || !video) {
      return
    }

    const saveHistory = async () => {
      try {
        await fetch(`${API_URL}/api/history`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: video.id,
            title: video.title,
            thumbnail: video.thumbnail,
            channelTitle: video.channel,
            classLevel,
            syllabus,
            subject,
            language,
            progressSeconds: 0,
          }),
        })
      } catch (historyError) {
        console.error('Unable to save history', historyError)
      }
    }

    saveHistory()
  }, [classLevel, language, subject, syllabus, user, video])

  const backUrl = useMemo(
    () => `/videos?class=${classLevel}&syllabus=${encodeURIComponent(syllabus)}&subject=${encodeURIComponent(subject)}&language=${encodeURIComponent(language)}`,
    [classLevel, language, subject, syllabus],
  )

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.7fr_0.8fr]">
          <div className="h-[360px] animate-pulse rounded-[1.5rem] bg-slate-200 dark:bg-slate-800" />
          <div className="h-[360px] animate-pulse rounded-[1.5rem] bg-slate-200 dark:bg-slate-800" />
        </div>
      </section>
    )
  }

  if (error || !video) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-lg font-semibold text-red-700 dark:text-red-200">This video could not be loaded.</p>
          <p className="mt-2 text-red-600 dark:text-red-300">{error || 'Please try another lesson.'}</p>
          <button
            type="button"
            onClick={() => navigate(backUrl)}
            className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Back to videos
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(backUrl)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          ← Back
        </button>
        <Link
          to={backUrl}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
        >
          Back to video list
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.8fr_0.9fr]">
        <div>
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 shadow-lg dark:border-slate-700">
            <div className="relative aspect-video w-full">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>

          {!user && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              Login to save this lesson in your watch history.
            </div>
          )}

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
              <span>{video.subject}</span>
              <span className="text-slate-400">•</span>
              <span>{video.chapter || 'General'}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{video.title}</h1>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300">By {video.channel}</p>
            <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">{video.description}</p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">More videos from this subject</h2>
            <div className="mt-4 space-y-4">
              {relatedVideos.length ? (
                relatedVideos.map((relatedVideo) => (
                  <Link
                    key={relatedVideo.id}
                    to={`/watch/${relatedVideo.id}?class=${classLevel}&syllabus=${encodeURIComponent(syllabus)}&subject=${encodeURIComponent(subject)}&language=${encodeURIComponent(language)}`}
                    className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2 hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500/60 dark:hover:bg-slate-800"
                  >
                    <img src={relatedVideo.thumbnail} alt={relatedVideo.title} className="h-20 w-28 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{relatedVideo.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{relatedVideo.channel}</p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{relatedVideo.duration}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-300">No related videos available right now.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default WatchPage
