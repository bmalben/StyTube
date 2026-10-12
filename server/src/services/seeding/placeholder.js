const placeholderPatterns = ['xxxx', 'todo', 'placeholder']

const hasPlaceholderValue = (value) => {
  const text = String(value || '').trim().toLowerCase()
  if (!text) return false
  return placeholderPatterns.some((pattern) => text.includes(pattern))
}

const isPlaceholderEntry = (entry = {}) => {
  if (entry._example === true) return true

  const candidateFields = [
    entry.channelId,
    entry.videoId,
    entry.handle,
    entry.name,
    entry.uploadsPlaylistId,
    entry.notes,
  ]

  return candidateFields.some((value) => hasPlaceholderValue(value))
}

module.exports = {
  hasPlaceholderValue,
  isPlaceholderEntry,
}
