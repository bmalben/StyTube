import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function AdminPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState([])
  const [channels, setChannels] = useState([])
  const [users, setUsers] = useState([])

  const fetchAdminData = async () => {
    const [videosResponse, channelsResponse, usersResponse] = await Promise.all([
      fetch(`${API_URL}/api/admin/videos`, { credentials: 'include' }),
      fetch(`${API_URL}/api/admin/channels`, { credentials: 'include' }),
      fetch(`${API_URL}/api/admin/users`, { credentials: 'include' }),
    ])

    if (!videosResponse.ok || !channelsResponse.ok || !usersResponse.ok) {
      throw new Error('Unable to load admin data.')
    }

    const videoPayload = await videosResponse.json()
    const channelPayload = await channelsResponse.json()
    const userPayload = await usersResponse.json()
    setVideos(videoPayload.videos || [])
    setChannels(channelPayload.channels || [])
    setUsers(userPayload.users || [])
  }

  useEffect(() => {
    fetchAdminData().catch((error) => {
      console.error(error)
    })
  }, [])

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const toggleVideo = async (id, patch) => {
    const response = await fetch(`${API_URL}/api/admin/videos/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })

    if (response.ok) {
      setVideos((current) => current.map((video) => (video._id === id ? { ...video, ...patch } : video)))
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Control Panel</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Users</h2>
          <div className="space-y-3">
            {users.map((entry) => (
              <div key={entry._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{entry.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{entry.email}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {entry.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Channels</h2>
          <div className="space-y-3">
            {channels.map((channel) => (
              <div key={channel._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{channel.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{channel.trustTier}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {channel.active ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Curated videos</h2>
          <div className="space-y-3">
            {videos.map((video) => (
              <div key={video._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{video.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{video.subject} • {video.language} • {video.syllabus}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleVideo(video._id, { pinned: !video.pinned })}
                      className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white"
                    >
                      {video.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleVideo(video._id, { hidden: !video.hidden })}
                      className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white"
                    >
                      {video.hidden ? 'Show' : 'Hide'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminPage
