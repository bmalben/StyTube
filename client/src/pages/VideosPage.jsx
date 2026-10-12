import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import SkeletonGrid from '../components/Skeleton'
import VideoGrid from '../components/VideoGrid'
import { searchVideos } from '../services/youtubeService'

function VideosPage() {
  const [searchParams] = useSearchParams()
  const classLevel = Number(searchParams.get('class') ?? 10)
  const syllabus = String(searchParams.get('syllabus') ?? 'cbse')
  const subject = String(searchParams.get('subject') ?? 'physics')
  const language = String(searchParams.get('language') ?? 'Any')

  const [videos, setVideos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChapter, setSelectedChapter] = useState('')
  const [sortBy, setSortBy] = useState('best')
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [nextPageToken, setNextPageToken] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [adLightOnly, setAdLightOnly] = useState(false)
  const [fallbackLevel, setFallbackLevel] = useState('exact')
  const [fallbackNote, setFallbackNote] = useState('')

  const chapterOptions = useMemo(
    () => [...new Set(videos.map((video) => video.chapter).filter(Boolean))].sort(),
    [videos],
  )

  const loadVideos = useCallback(
    async (append = false, pageTokenOverride = null) => {
      try {
        if (append) {
          setLoadingMore(true)
        } else {
          setStatus('loading')
        }

        const response = await searchVideos({
          classLevel,
          syllabus,
          subject,
          pageToken: pageTokenOverride ?? nextPageToken,
          chapter: selectedChapter,
          language,
        })

        setNextPageToken(response.nextPageToken)
        setFallbackLevel(response.fallbackLevel || 'exact')
        setFallbackNote(response.note || '')

        if (append) {
          setVideos((current) => [...current, ...response.items])
        } else {
          setVideos(response.items)
        }

        setStatus(response.items.length ? 'success' : 'empty')
      } catch (error) {
        setStatus('error')
        setErrorMessage(error.message || 'Unable to load videos right now.')
      } finally {
        setLoadingMore(false)
      }
    },
    [classLevel, language, nextPageToken, selectedChapter, subject, syllabus],
  )

  useEffect(() => {
    setSearchTerm('')
    setSelectedChapter('')
    setSortBy('best')
    setAdLightOnly(false)
    setVideos([])
    setNextPageToken(null)
    loadVideos(false, null)
  }, [classLevel, language, subject, syllabus, loadVideos])

  const filteredVideos = useMemo(() => {
    const nextVideos = [...videos].filter((video) => {
      const titleMatch = video.title.toLowerCase().includes(searchTerm.toLowerCase())
      const chapterMatch = !selectedChapter || video.chapter === selectedChapter
      const adLightMatch = !adLightOnly || video.badge === 'verified-adlight' || video.badge === 'trusted'
      return titleMatch && chapterMatch && adLightMatch
    })

    if (sortBy === 'newest') {
      return nextVideos.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )
    }

    if (sortBy === 'best') {
      return nextVideos.sort((a, b) => Number(b.qualityScore || 0) - Number(a.qualityScore || 0))
    }

    return nextVideos
  }, [adLightOnly, searchTerm, selectedChapter, sortBy, videos])

  const normalizedLanguage = String(language || 'Any').trim()
  const selectionLabel = `Class ${classLevel} · ${syllabus.toUpperCase()} · ${subject}${normalizedLanguage && normalizedLanguage.toLowerCase() !== 'any' ? ` · ${normalizedLanguage}` : ''}`

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Videos</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{selectionLabel}</h1>
          </div>
          <Link
            to="/select"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:border-indigo-200 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Change selection
          </Link>
        </div>

        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          chapterOptions={chapterOptions}
          selectedChapter={selectedChapter}
          onChapterChange={setSelectedChapter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={adLightOnly}
              onChange={(event) => setAdLightOnly(event.target.checked)}
            />
            Ad-light channels only
          </label>

          {fallbackLevel !== 'exact' && fallbackNote && (
            <p className="text-sm text-amber-700 dark:text-amber-300">{fallbackNote}</p>
          )}
        </div>
      </header>

      {status === 'loading' && <SkeletonGrid />}

      {status === 'error' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/40 dark:bg-red-500/10">
          <p className="text-lg font-semibold text-red-700 dark:text-red-200">We could not load those videos.</p>
          <p className="mt-2 text-red-600 dark:text-red-300">{errorMessage}</p>
          <button
            type="button"
            onClick={() => loadVideos(false, null)}
            className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Retry
          </button>
        </div>
      )}

      {status === 'empty' && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-900">
          <p className="text-xl font-semibold text-slate-700 dark:text-slate-100">No videos match this selection yet.</p>
          <p className="mt-2 text-slate-500 dark:text-slate-300">Try another subject, chapter, or keyword.</p>
        </div>
      )}

      {status === 'success' && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-300">
              {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {filteredVideos.length > 0 ? (
            <>
              <VideoGrid videos={filteredVideos} classLevel={classLevel} syllabus={syllabus} subject={subject} language={language} />

              {nextPageToken && (
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => loadVideos(true, nextPageToken)}
                    disabled={loadingMore}
                    className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-900">
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-100">No results for your filter.</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default VideosPage
