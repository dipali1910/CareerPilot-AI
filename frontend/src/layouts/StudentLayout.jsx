import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

const THEME_KEY = 'careerpilot-theme'
const SIDEBAR_KEY = 'careerpilot-sidebar-collapsed'

function StudentLayout() {
  const navigate = useNavigate()

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_KEY)

    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme
    }

    return 'light'
  })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  })

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const root = document.documentElement

    root.setAttribute('data-theme', theme)

    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(
      SIDEBAR_KEY,
      String(sidebarCollapsed)
    )
  }, [sidebarCollapsed])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true)

      await supabase.auth.signOut()

      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: '⌂',
    },
    {
      label: 'Career Analysis',
      path: '/career-analysis',
      icon: '◈',
    },
    {
      label: 'Career Recommendations',
      path: '/career-recommendations',
      icon: '✦',
    },
    {
      label: 'Placement Opportunities',
      path: '/placement-opportunities',
      icon: '▣',
    },
    {
      label: 'My Applications',
      path: '/application-tracking',
      icon: '✓',
    },
    {
      label: 'My Resume',
      path: '/resume',
      icon: '▤',
    },
    {
      label: 'Skill Gap',
      path: '/skill-gap',
      icon: '◇',
    },
    {
      label: 'Roadmap',
      path: '/roadmap',
      icon: '➜',
    },
  ]

  const navLinkClasses = ({ isActive }) =>
    [
      'group flex items-center rounded-xl text-sm font-medium',
      'transition-all duration-200',
      sidebarCollapsed
        ? 'justify-center px-2.5 py-3'
        : 'gap-3 px-3 py-2.5',
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
    ].join(' ')

  const mobileNavLinkClasses = ({ isActive }) =>
    [
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
      'transition-all duration-200',
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
    ].join(' ')

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)] transition-colors duration-200">

      {/* =========================================================
          MOBILE HEADER
          ========================================================= */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--surface)] lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-left"
          >
            <p className="text-lg font-bold text-[var(--text-primary)]">
              CareerPilot AI
            </p>

            <p className="text-xs text-[var(--text-secondary)]">
              Career & Placement Platform
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen((previous) => !previous)
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--surface)] text-lg text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)]"
            aria-label={
              mobileMenuOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* =========================================================
          MOBILE DRAWER
          ========================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-950/45"
          />

          <aside
            className="absolute left-0 top-0 flex h-full w-[290px] flex-col border-r border-[var(--border-color)] bg-[var(--surface)] shadow-2xl"
            aria-label="Student navigation"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-color)] p-5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/dashboard')
                }}
                className="text-left"
              >
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  CareerPilot AI
                </h1>

                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Career & Placement Platform
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                aria-label="Close navigation menu"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <nav aria-label="Student navigation">
                <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Student
                </p>

                <div className="space-y-1">
                  {navigationItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={mobileNavLinkClasses}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center text-base"
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>

                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </nav>
            </div>

            <div className="shrink-0 border-t border-[var(--border-color)] p-4">
              <ThemeSwitcher
                theme={theme}
                onThemeChange={handleThemeChange}
              />

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-5 flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
              >
                {loggingOut
                  ? 'Logging out...'
                  : 'Logout'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* =========================================================
          DESKTOP APP SHELL
          Fixed sidebar + independently scrolling main content.
          ========================================================= */}
      <div className="min-h-screen lg:flex">

        {/* =======================================================
            FIXED DESKTOP SIDEBAR
            ======================================================= */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 hidden border-r border-[var(--border-color)] bg-[var(--surface)] lg:flex lg:flex-col',
            'transition-[width] duration-200 ease-in-out',
            sidebarCollapsed ? 'w-[76px]' : 'w-72',
          ].join(' ')}
          aria-label="Student navigation"
        >

          {/* Brand + collapse */}
          <div
            className={[
              'flex shrink-0 items-center border-b border-[var(--border-color)]',
              sidebarCollapsed
                ? 'justify-center p-4'
                : 'justify-between p-5',
            ].join(' ')}
          >
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="min-w-0 text-left"
              >
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  CareerPilot AI
                </h1>

                <p className="mt-1 whitespace-nowrap text-xs text-[var(--text-secondary)]">
                  Career & Placement Platform
                </p>
              </button>
            )}

            {sidebarCollapsed && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm"
                aria-label="Go to Dashboard"
                title="CareerPilot AI"
              >
                CP
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setSidebarCollapsed((previous) => !previous)
              }
              className={[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)]',
                'text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)]',
                sidebarCollapsed ? 'mt-2' : '',
              ].join(' ')}
              aria-label={
                sidebarCollapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
              }
              title={
                sidebarCollapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
              }
            >
              {sidebarCollapsed ? '›' : '‹'}
            </button>
          </div>

          {/* Scrollable navigation area */}
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
            <nav aria-label="Student navigation">
              {!sidebarCollapsed && (
                <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Student
                </p>
              )}

              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={navLinkClasses}
                    title={
                      sidebarCollapsed
                        ? item.label
                        : undefined
                    }
                    aria-label={item.label}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center text-base"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>

                    {!sidebarCollapsed && (
                      <span className="truncate whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </nav>
          </div>

          {/* Fixed bottom controls */}
          <div
            className={[
              'shrink-0 border-t border-[var(--border-color)]',
              sidebarCollapsed
                ? 'p-2'
                : 'p-4',
            ].join(' ')}
          >
            {!sidebarCollapsed ? (
              <>
                <ThemeSwitcher
                  theme={theme}
                  onThemeChange={handleThemeChange}
                />

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-3 flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
                >
                  {loggingOut
                    ? 'Logging out...'
                    : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleThemeChange(
                      theme === 'light'
                        ? 'dark'
                        : 'light'
                    )
                  }
                  className="flex h-11 w-full items-center justify-center rounded-xl text-base text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  title={
                    theme === 'light'
                      ? 'Switch to Dark Mode'
                      : 'Switch to Light Mode'
                  }
                  aria-label={
                    theme === 'light'
                      ? 'Switch to Dark Mode'
                      : 'Switch to Light Mode'
                  }
                >
                  {theme === 'light' ? '☀' : '🌙'}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-1 flex h-11 w-full items-center justify-center rounded-xl text-base text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
                  title={
                    loggingOut
                      ? 'Logging out...'
                      : 'Logout'
                  }
                  aria-label="Logout"
                >
                  {loggingOut ? '…' : '↪'}
                </button>
              </>
            )}
          </div>
        </aside>

        {/* =======================================================
            MAIN CONTENT
            Margin matches sidebar width.
            ======================================================= */}
        <div
          className={[
            'min-w-0 flex-1 transition-[margin] duration-200 ease-in-out',
            sidebarCollapsed
              ? 'lg:ml-[76px]'
              : 'lg:ml-72',
          ].join(' ')}
        >
          <main className="min-h-screen bg-[var(--page-bg)] transition-colors duration-200">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

function ThemeSwitcher({ theme, onThemeChange }) {
  return (
    <div>
      <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
        Appearance
      </p>

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-1">
        <button
          type="button"
          onClick={() => onThemeChange('light')}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
            theme === 'light'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span aria-hidden="true">☀</span>
          Light
        </button>

        <button
          type="button"
          onClick={() => onThemeChange('dark')}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
            theme === 'dark'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span aria-hidden="true">🌙</span>
          Dark
        </button>
      </div>
    </div>
  )
}

export default StudentLayout
