const PREFERENCE_KEY = 'studytube-preferences'

export const getGuestPreferences = () => {
  try {
    const raw = localStorage.getItem(PREFERENCE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    return {}
  }
}

export const saveGuestPreferences = (preferences) => {
  localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences))
}
