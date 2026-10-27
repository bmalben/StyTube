import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import titleImage from '../assets/Logo.png'
import Avatar from './Avatar'
import { useAuth } from '../context/AuthContext'

const navItemClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800'
  }`

function Navbar({ theme, onToggleTheme }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-3" aria-label="StudyTube home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl ">
            <img src={titleImage} height={'40px'} alt=""  />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">StyTube</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <NavLink to="/" className={navItemClass} end>
            Home
          </NavLink>
          <NavLink to="/select" className={navItemClass}>
            Browse
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navItemClass}>
              Admin
            </NavLink>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-slate-200 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/60 dark:hover:bg-slate-800"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                aria-expanded={menuOpen}
              >
                <Avatar user={user} size="sm" />
                <span className="hidden sm:inline">{user.name}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                    Profile
                  </Link>
                  <Link to="/history" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                    History
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false)
                      await logout()
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                Login
              </Link>
              <Link to="/register" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
