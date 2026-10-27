import { useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const syllabusOptions = ['State', 'CBSE', 'ICSE']
const subjectOptions = ['Maths', 'Physics', 'Chemistry', 'Biology', 'Science', 'Social Science', 'English', 'Hindi', 'Malayalam', 'Mathematics', 'Computer Science', 'Accountancy', 'Business Studies', 'Economics']
const languageOptions = ['Any', 'English', 'Malayalam', 'Hindi', 'Tamil', 'Kannada', 'Telugu']
const MAX_PHOTO_SIZE = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const createImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image could not be read.'))
    image.src = src
  })

const getCroppedBlob = async (imageSrc, cropPixels) => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas is not supported in this browser.')
  }

  const x = cropPixels.x * (image.naturalWidth / image.width)
  const y = cropPixels.y * (image.naturalHeight / image.height)
  const width = cropPixels.width * (image.naturalWidth / image.width)
  const height = cropPixels.height * (image.naturalHeight / image.height)

  context.clearRect(0, 0, 256, 256)
  context.drawImage(image, x, y, width, height, 0, 0, 256, 256)

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.8)
  })
}

function ProfilePage() {
  const { user, updatePreferences, logout, refreshUser, updateUser } = useAuth()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    name: user?.name || '',
    classLevel: user?.preferences?.classLevel || 10,
    syllabus: user?.preferences?.syllabus || 'CBSE',
    subject: user?.preferences?.subject || 'Physics',
    language: user?.preferences?.language || 'Any',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('success')
  const [cropOpen, setCropOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      await updatePreferences({
        classLevel: Number(form.classLevel),
        syllabus: form.syllabus,
        subject: form.subject,
        language: form.language,
      })
      setStatus('success')
      setMessage('Preferences updated successfully.')
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Unable to update preferences.')
    } finally {
      setSaving(false)
    }
  }

  const handleClearHistory = async () => {
    const confirmed = window.confirm('Clear your full watch history?')
    if (!confirmed) return

    try {
      await fetch(`${API_URL}/api/history`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-Requested-With': 'StudyTube' },
      })
      setStatus('success')
      setMessage('Watch history cleared.')
    } catch (error) {
      setStatus('error')
      setMessage('Unable to clear history.')
    }
  }

  const openFilePicker = () => fileInputRef.current?.click()

  const handlePhotoSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setStatus('error')
      setMessage('Only JPEG, PNG, and WebP images are allowed.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setStatus('error')
      setMessage('Your photo must be 2 MB or smaller.')
      event.target.value = ''
      return
    }

    try {
      const result = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Unable to read the selected image.'))
        reader.readAsDataURL(file)
      })

      const image = await createImage(result)
      if (image.naturalWidth > 4000 || image.naturalHeight > 4000) {
        setStatus('error')
        setMessage('Images larger than 4000x4000 pixels are not supported.')
        event.target.value = ''
        return
      }

      setSelectedFile(file)
      setImageSrc(result)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCropOpen(true)
      setStatus('success')
      setMessage('Crop your photo and save it.')
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'The selected file is not a readable image.')
    } finally {
      event.target.value = ''
    }
  }

  const handleUploadPhoto = async () => {
    if (!selectedFile || !imageSrc || !croppedAreaPixels) {
      setStatus('error')
      setMessage('Please choose a valid photo and crop it before saving.')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      if (!blob) {
        throw new Error('Could not generate the cropped photo.')
      }

      const formData = new FormData()
      formData.append('photo', blob, 'profile.webp')

      const response = await fetch(`${API_URL}/api/user/photo`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'X-Requested-With': 'StudyTube' },
        body: formData,
      })

      const payload = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text()

      if (!response.ok) {
        throw new Error(typeof payload === 'string' ? payload : payload?.error?.message || 'Unable to upload the photo.')
      }

      if (payload?.avatarUrl) {
        updateUser({
          ...user,
          avatarUrl: payload.avatarUrl,
          avatar: { ...(user?.avatar || {}), photoId: payload.avatarUrl.split('/').pop() || null },
        })
      }

      await refreshUser()
      setCropOpen(false)
      setSelectedFile(null)
      setImageSrc('')
      setStatus('success')
      setMessage('Profile photo updated successfully.')
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Unable to upload the photo.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    const confirmed = window.confirm('Remove your profile photo?')
    if (!confirmed) return

    setUploading(true)
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/api/user/photo`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-Requested-With': 'StudyTube' },
      })

      if (!response.ok) {
        const payload = response.headers.get('content-type')?.includes('application/json')
          ? await response.json()
          : await response.text()
        throw new Error(typeof payload === 'string' ? payload : payload?.error?.message || 'Unable to remove the photo.')
      }

      updateUser({
        ...user,
        avatarUrl: null,
        avatar: { photoId: null, updatedAt: null },
      })

      await refreshUser()
      setStatus('success')
      setMessage('Profile photo removed.')
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Unable to remove the photo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Profile</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Your learning profile</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col items-start gap-4">
              <Avatar user={user} size="xl" className="shadow-md" />
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{user?.name}</h2>
                <p className="mt-1 text-slate-500 dark:text-slate-300">{user?.email}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoSelect}
                aria-label="Upload profile photo"
              />
              <button
                type="button"
                onClick={openFilePicker}
                disabled={uploading}
                className="w-full rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
              >
                {user?.avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>

              {user?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                  className="w-full rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                >
                  Remove photo
                </button>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-300">Your photo is stored with your account.</p>
            </div>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Class</span>
                <select
                  name="classLevel"
                  value={form.classLevel}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {[8, 9, 10, 11, 12].map((level) => (
                    <option key={level} value={level}>
                      Class {level}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Board</span>
                <select
                  name="syllabus"
                  value={form.syllabus}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {syllabusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Subject</span>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {subjectOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Language</span>
                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {languageOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            {message && (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-xl border px-3 py-2 text-sm ${
                  status === 'success'
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
              >
                {saving ? 'Saving...' : 'Save preferences'}
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              >
                Clear watch history
              </button>
            </div>
          </div>
        </div>
      </div>

      {cropOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Crop your photo</h2>
              <button
                type="button"
                onClick={() => setCropOpen(false)}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCropOpen(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadPhoto}
                disabled={uploading}
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
              >
                {uploading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default ProfilePage
