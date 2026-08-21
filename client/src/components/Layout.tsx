import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Clock, Compass, Plus, User, Sparkles } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const currentPath = router.pathname

  const navItems = [
    { label: 'Timeline', path: '/timeline', icon: Clock },
    { label: 'Explore', path: '/map', icon: Compass },
    { label: 'Create', path: '/create', icon: Plus, isFab: true },
    { label: 'Profile', path: '/profile', icon: User },
  ]

  return (
    <div className="layout-container">
      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar">
        <div className="sidebar-logo">
          <Sparkles className="logo-sparkle" />
          <span>Hangout</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path
            if (item.isFab) {
              return (
                <Link key={item.label} href={item.path} className="sidebar-fab">
                  <Icon size={24} />
                  <span>New Hangout</span>
                </Link>
              )
            }
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="page-wrapper">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div className="bottom-nav-items">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path

            if (item.isFab) {
              return (
                <Link key={item.label} href={item.path} className="mobile-fab">
                  <Icon size={24} />
                </Link>
              )
            }

            return (
              <Link
                key={item.label}
                href={item.path}
                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span className="mobile-nav-label">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <style jsx>{`
        .layout-container {
          display: flex;
          min-height: 100vh;
          width: 100vw;
          background-color: var(--color-background);
        }

        .desktop-sidebar {
          width: 260px;
          background-color: var(--color-surface-container-lowest);
          border-right: 1px solid var(--color-surface-container-high);
          display: flex;
          flex-direction: column;
          padding: 24px;
          position: fixed;
          height: 100vh;
          z-index: 100;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: var(--color-blush);
          margin-bottom: 40px;
        }

        .logo-sparkle {
          color: var(--color-tangerine);
          animation: float 3s ease-in-out infinite;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 20px;
          border-radius: 9999px;
          color: var(--color-text-muted);
          font-family: var(--font-display);
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .sidebar-nav-item:hover {
          background-color: var(--color-surface-container-low);
          color: var(--color-text);
        }

        .sidebar-nav-item.active {
          background-color: var(--color-surface-container);
          color: var(--color-blush);
        }

        .sidebar-fab {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background-color: var(--color-tangerine);
          color: white;
          padding: 14px 20px;
          border-radius: 9999px;
          font-family: var(--font-display);
          font-weight: 700;
          margin-top: 16px;
          box-shadow: 0 8px 16px rgba(240, 140, 33, 0.25);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .sidebar-fab:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px rgba(240, 140, 33, 0.35);
        }

        .main-content {
          flex: 1;
          margin-left: 260px;
          min-height: 100vh;
          width: calc(100% - 260px);
          padding-bottom: 0;
        }

        .page-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        .mobile-bottom-nav {
          display: none;
        }

        /* Responsive Breakpoint for Mobile/Tablets */
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none;
          }

          .main-content {
            margin-left: 0;
            width: 100%;
            padding-bottom: 90px; /* Space for bottom nav */
          }

          .page-wrapper {
            padding: 24px 16px;
          }

          .mobile-bottom-nav {
            display: block;
            position: fixed;
            bottom: 16px;
            left: 16px;
            right: 16px;
            height: 72px;
            background-color: rgba(255, 248, 245, 0.9);
            backdrop-filter: blur(12px);
            border-radius: 9999px;
            box-shadow: 0 15px 30px rgba(46, 42, 40, 0.12);
            border: 1px solid var(--color-surface-container-high);
            z-index: 1000;
          }

          .bottom-nav-items {
            display: flex;
            justify-content: space-around;
            align-items: center;
            height: 100%;
            padding: 0 12px;
            position: relative;
          }

          .mobile-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            color: var(--color-text-muted);
            transition: color 0.2s;
            font-size: 11px;
            font-weight: 700;
            font-family: var(--font-display);
            width: 60px;
          }

          .mobile-nav-item.active {
            color: var(--color-blush);
          }

          .mobile-nav-label {
            font-size: 10px;
          }

          .mobile-fab {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background-color: var(--color-tangerine);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 16px rgba(240, 140, 33, 0.3);
            margin-top: -24px;
            z-index: 1001;
            transition: transform 0.2s;
          }

          .mobile-fab:active {
            transform: scale(0.9);
          }
        }
      `}</style>
    </div>
  )
}
