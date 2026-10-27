import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const request = async (url, options = {}) => {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

    const response = await fetch(`${API_URL}${url}`, {
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.method && options.method !== 'GET' ? { 'X-Requested-With': 'StudyTube' } : {}),
        ...(options.headers || {}),
      },
      ...options,
    })

    const contentType = response.headers.get('content-type') || ''
    const payload = contentType.includes('application/json') ? await response.json() : await response.text()

    if (!response.ok) {
      const message = typeof payload === 'string'
        ? payload
        : payload?.error?.message || payload?.message || 'Request failed.'
      throw new Error(message)
    }

    return payload
  }

  const refreshUser = async () => {
    try {
      const data = await request('/api/auth/me')
      setUser(data.user || null)
      return data.user || null
    } catch (error) {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const updateUser = (updatedUser) => {
    setUser((current) => {
      if (!current) return updatedUser
      return { ...current, ...updatedUser }
    })
  }

  const login = async (formData) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    await request('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const updatePreferences = async (preferences) => {
    const data = await request('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    })

    setUser((current) => {
      if (!current) return current
      return { ...current, preferences: data.preferences }
    })

    return data.preferences
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      updateUser,
      updatePreferences,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
