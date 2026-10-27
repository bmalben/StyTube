import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/AuthContext'
import { adminApi } from '../services/adminApi'

const emptyChannelForm = {
  channelId: '',
  handle: '',
  name: '',
  trustTier: 'general',
  classLevels: '8,10,12',
  syllabi: 'CBSE',
  subjects: 'Physics',
  languages: 'English',
  notes: '',
  active: true,
}

const emptyVideoForm = {
  videoId: '',
  title: '',
  channelId: '',
  classLevel: 10,
  syllabus: 'CBSE',
  subject: 'Physics',
  language: 'English',
  chapter: '',
  pinned: false,
  hidden: false,
}

const normalizeList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

function AdminPage() {
  const { user, loading } = useAuth()
  const [videos, setVideos] = useState([])
  const [channels, setChannels] = useState([])
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [channelForm, setChannelForm] = useState(emptyChannelForm)
  const [videoForm, setVideoForm] = useState(emptyVideoForm)
  const [error, setError] = useState('')
  const [loadingData, setLoadingData] = useState(false)

  const fetchAdminData = async () => {
    if (!user || user.role !== 'admin') return
    setLoadingData(true)
    try {
      const [videoPayload, channelPayload, userPayload] = await Promise.all([
        adminApi('/api/admin/videos'),
        adminApi('/api/admin/channels'),
        adminApi('/api/admin/users'),
      ])
      setVideos(videoPayload.videos || [])
      setChannels(channelPayload.channels || [])
      setUsers(userPayload.users || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [user?.role])

  const tabs = useMemo(
    () => ['Dashboard', 'Channels', 'Videos', 'Users'],
    [],
  )

  if (loading) {
    return <div className="p-8 text-slate-700 dark:text-slate-200">Loading admin…</div>
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const toggleVideo = async (id, patch) => {
    const previous = videos
    setVideos((current) => current.map((video) => (video._id === id ? { ...video, ...patch } : video)))
    try {
      await adminApi(`/api/admin/videos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      setError('')
    } catch (err) {
      setVideos(previous)
      setError(err.message)
    }
  }

  const handleChannelSubmit = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        channelId: channelForm.channelId || undefined,
        handle: channelForm.handle || undefined,
        name: channelForm.name,
        trustTier: channelForm.trustTier,
        classLevels: normalizeList(channelForm.classLevels).map(Number),
        syllabi: normalizeList(channelForm.syllabi),
        subjects: normalizeList(channelForm.subjects),
        languages: normalizeList(channelForm.languages),
        notes: channelForm.notes,
        active: channelForm.active,
      }
      await adminApi('/api/admin/channels', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setChannelForm(emptyChannelForm)
      await fetchAdminData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleVideoSubmit = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        videoId: videoForm.videoId,
        title: videoForm.title || videoForm.videoId,
        channelId: videoForm.channelId || undefined,
        classLevel: Number(videoForm.classLevel),
        syllabus: videoForm.syllabus,
        subject: videoForm.subject,
        language: videoForm.language,
        chapter: videoForm.chapter,
        pinned: Boolean(videoForm.pinned),
        hidden: Boolean(videoForm.hidden),
      }
      await adminApi('/api/admin/videos', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setVideoForm(emptyVideoForm)
      await fetchAdminData()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteVideo = async (id) => {
    try {
      await adminApi(`/api/admin/videos/${id}`, { method: 'DELETE' })
      setVideos((current) => current.filter((video) => video._id !== id))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteChannel = async (id) => {
    try {
      await adminApi(`/api/admin/channels/${id}`, { method: 'DELETE' })
      setChannels((current) => current.filter((channel) => channel._id !== id))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Control Panel</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      {activeTab === 'Dashboard' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-300">Channels</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{channels.length}</h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-300">Videos</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{videos.length}</h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-300">Users</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{users.length}</h2>
          </div>
        </div>
      )}

      {activeTab === 'Channels' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Channels</h2>
            <div className="space-y-3">
              {channels.map((channel) => (
                <div key={channel._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{channel.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{channel.channelId || channel.handle} • {channel.trustTier}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {channel.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setChannelForm({
                        channelId: channel.channelId || '',
                        handle: channel.handle || '',
                        name: channel.name || '',
                        trustTier: channel.trustTier || 'general',
                        classLevels: (channel.classLevels || []).join(', '),
                        syllabi: (channel.syllabi || []).join(', '),
                        subjects: (channel.subjects || []).join(', '),
                        languages: (channel.languages || []).join(', '),
                        notes: channel.notes || '',
                        active: channel.active ?? true,
                      })}
                      className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteChannel(channel._id)}
                      className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleChannelSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Add or update channel</h2>
            <div className="space-y-3 text-sm">
              <input value={channelForm.channelId} onChange={(event) => setChannelForm({ ...channelForm, channelId: event.target.value })} placeholder="channelId" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={channelForm.handle} onChange={(event) => setChannelForm({ ...channelForm, handle: event.target.value })} placeholder="handle" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={channelForm.name} onChange={(event) => setChannelForm({ ...channelForm, name: event.target.value })} placeholder="name" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <select value={channelForm.trustTier} onChange={(event) => setChannelForm({ ...channelForm, trustTier: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="general">general</option>
                <option value="trusted">trusted</option>
                <option value="verified-adlight">verified-adlight</option>
              </select>
              <input value={channelForm.classLevels} onChange={(event) => setChannelForm({ ...channelForm, classLevels: event.target.value })} placeholder="classLevels (comma separated)" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={channelForm.syllabi} onChange={(event) => setChannelForm({ ...channelForm, syllabi: event.target.value })} placeholder="syllabi (comma separated)" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={channelForm.subjects} onChange={(event) => setChannelForm({ ...channelForm, subjects: event.target.value })} placeholder="subjects (comma separated)" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={channelForm.languages} onChange={(event) => setChannelForm({ ...channelForm, languages: event.target.value })} placeholder="languages (comma separated)" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <textarea value={channelForm.notes} onChange={(event) => setChannelForm({ ...channelForm, notes: event.target.value })} placeholder="notes" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" rows="3" />
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={channelForm.active} onChange={(event) => setChannelForm({ ...channelForm, active: event.target.checked })} />
                Active
              </label>
            </div>
            <button type="submit" className="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Save channel</button>
          </form>
        </div>
      )}

      {activeTab === 'Videos' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Videos</h2>
            <div className="space-y-3">
              {videos.map((video) => (
                <div key={video._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{video.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{video.subject} • {video.language} • {video.syllabus}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {video.source || 'manual'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {video.hidden ? 'Hidden' : 'Visible'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => toggleVideo(video._id, { pinned: !video.pinned })} className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">{video.pinned ? 'Unpin' : 'Pin'}</button>
                    <button type="button" onClick={() => toggleVideo(video._id, { hidden: !video.hidden })} className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white">{video.hidden ? 'Show' : 'Hide'}</button>
                    <button type="button" onClick={() => setVideoForm({
                      videoId: video.videoId || '',
                      title: video.title || '',
                      channelId: video.channelId || '',
                      classLevel: video.classLevel || 10,
                      syllabus: video.syllabus || 'CBSE',
                      subject: video.subject || 'Physics',
                      language: video.language || 'English',
                      chapter: video.chapter || '',
                      pinned: !!video.pinned,
                      hidden: !!video.hidden,
                    })} className="rounded-full bg-slate-600 px-3 py-1 text-xs font-medium text-white">Edit</button>
                    <button type="button" onClick={() => deleteVideo(video._id)} className="rounded-full bg-red-700 px-3 py-1 text-xs font-medium text-white">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleVideoSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Add or update video</h2>
            <div className="space-y-3 text-sm">
              <input value={videoForm.videoId} onChange={(event) => setVideoForm({ ...videoForm, videoId: event.target.value })} placeholder="videoId" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={videoForm.title} onChange={(event) => setVideoForm({ ...videoForm, title: event.target.value })} placeholder="title" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={videoForm.channelId} onChange={(event) => setVideoForm({ ...videoForm, channelId: event.target.value })} placeholder="channelId" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={videoForm.classLevel} type="number" min="8" max="12" onChange={(event) => setVideoForm({ ...videoForm, classLevel: Number(event.target.value) || 10 })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={videoForm.syllabus} onChange={(event) => setVideoForm({ ...videoForm, syllabus: event.target.value })} placeholder="syllabus" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={videoForm.subject} onChange={(event) => setVideoForm({ ...videoForm, subject: event.target.value })} placeholder="subject" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={videoForm.language} onChange={(event) => setVideoForm({ ...videoForm, language: event.target.value })} placeholder="language" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <input value={videoForm.chapter} onChange={(event) => setVideoForm({ ...videoForm, chapter: event.target.value })} placeholder="chapter" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><input type="checkbox" checked={videoForm.pinned} onChange={(event) => setVideoForm({ ...videoForm, pinned: event.target.checked })} /> Pinned</label>
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><input type="checkbox" checked={videoForm.hidden} onChange={(event) => setVideoForm({ ...videoForm, hidden: event.target.checked })} /> Hidden</label>
            </div>
            <button type="submit" className="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Save video</button>
          </form>
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Users</h2>
          <div className="space-y-3">
            {users.map((entry) => (
              <div key={entry._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar user={entry} size="sm" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{entry.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{entry.email}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">{entry.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loadingData && (
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">Refreshing admin data…</div>
      )}
    </section>
  )
}

export default AdminPage
