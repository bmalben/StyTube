import { useEffect, useState } from 'react'

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
}

const getInitials = (user) => {
  if (!user) return 'U'
  const source = user.name || user.email || ''
  const parts = source.trim().split(/\s+/).filter(Boolean)

  if (!parts.length) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function Avatar({ user, size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [user?.avatarUrl])

  const src = user?.avatarUrl && !imageError ? user.avatarUrl : null
  const fallbackClass = 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-200 font-semibold tracking-wide shadow-sm dark:border-slate-700 dark:bg-slate-800 ${sizeMap[size] || sizeMap.md} ${className}`}
      aria-label={user?.name ? `${user.name} avatar` : 'User avatar'}
    >
      {src ? (
        <img
          key={src}
          src={src}
          alt={user?.name ? `${user.name} profile photo` : 'Profile photo'}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={`flex h-full w-full items-center justify-center ${fallbackClass}`}>
          {getInitials(user)}
        </span>
      )}
    </div>
  )
}

export default Avatar
