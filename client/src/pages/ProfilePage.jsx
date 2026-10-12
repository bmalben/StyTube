import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const syllabusOptions = ['State', 'CBSE', 'ICSE']
const subjectOptions = ['Maths', 'Physics', 'Chemistry', 'Biology', 'Science', 'Social Science', 'English', 'Hindi', 'Malayalam', 'Mathematics', 'Computer Science', 'Accountancy', 'Business Studies', 'Economics']
const languageOptions = ['Any', 'English', 'Malayalam', 'Hindi', 'Tamil', 'Kannada', 'Telugu']

function ProfilePage() {
  const { user, updatePreferences, logout } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    classLevel: user?.preferences?.classLevel || 10,
    syllabus: user?.preferences?.syllabus || 'CBSE',
    subject: user?.preferences?.subject || 'Physics',
    language: user?.preferences?.language || 'Any',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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
      setMessage('Preferences updated successfully.')
    } catch (error) {
      setMessage(error.message || 'Unable to update preferences.')
    } finally {
      setSaving(false)
    }
  }

  const handleClearHistory = async () => {
    const confirmed = window.confirm('Clear your full watch history?')
    if (!confirmed) return

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/history`, {
        method: 'DELETE',
        credentials: 'include',
      })
      setMessage('Watch history cleared.')
    } catch (error) {
      setMessage('Unable to clear history.')
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">{user?.name}</h2>
            <p className="mt-1 text-slate-500 dark:text-slate-300">{user?.email}</p>
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
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
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
    </section>
  )
}

export default ProfilePage
