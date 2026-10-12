import { useState } from 'react'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function VideoCard({ video, classLevel, syllabus, subject, language = 'Any' }) {
  const [reportSent, setReportSent] = useState(false)
  const watchUrl = `/watch/${video.id}?class=${classLevel}&syllabus=${encodeURIComponent(syllabus)}&subject=${encodeURIComponent(subject)}&language=${encodeURIComponent(language)}`

  const badgeMap = {
    'verified-adlight': {
      label: 'Verified ad-light channel',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
      tooltip: 'Ads are controlled by YouTube and the creator. Videos from non-commercial channels usually have none or very few.',
    },
    trusted: {
      label: 'Trusted educator',
      className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200',
      tooltip: 'Ads are controlled by YouTube and the creator. Videos from non-commercial channels usually have none or very few.',
    },
    general: {
      label: 'General source',
      className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
      tooltip: 'Ads are controlled by YouTube and the creator. Videos from non-commercial channels usually have none or very few.',
    },
  }

  const badge = badgeMap[video.badge] || badgeMap.general

  const handleReport = async (reason) => {
    try {
      await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          reason,
          details: 'User flagged content from the StudyTube video grid.',
        }),
      })
      setReportSent(true)
    } catch (error) {
      console.error('Unable to report video', error)
    }
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <Link to={watchUrl} className="block">
        <div className="relative">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-48 w-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
          />
          <span className="absolute bottom-3 right-3 rounded-md bg-slate-950/85 px-2 py-1 text-[11px] font-semibold text-white">
            {video.duration}
          </span>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
            <span>{video.chapter || 'General'}</span>
            <span className="text-slate-400">•</span>
            <span>{video.subject}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${badge.className}`}
              title={badge.tooltip}
            >
              {badge.label}
            </span>
          </div>

          <h3 className="line-clamp-2 text-base font-semibold text-slate-800 dark:text-slate-100">{video.title}</h3>

          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-300">
            <span>{video.channelTitle || video.channel}</span>
            <span>{video.views}</span>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
        <button
          type="button"
          onClick={() => handleReport('not_relevant')}
          className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
        >
          {reportSent ? 'Reported' : 'Not relevant'}
        </button>
        <button
          type="button"
          onClick={() => handleReport('wrong_subject')}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
        >
          Report this video
        </button>
      </div>
    </article>
  )
}

export default VideoCard
