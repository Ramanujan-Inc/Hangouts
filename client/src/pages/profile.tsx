import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { Camera, Sparkles, User, Settings, Bell, LogOut, ChevronRight, Check } from 'lucide-react'

const avatars = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=mika',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=bunny',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=adventurer-1',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=happy-cat'
]

export default function ProfileSettings() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [avatarIndex, setAvatarIndex] = useState(0)
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const displayName = user?.display_name || 'User'
  const displayEmail = user?.email || ''

  useEffect(() => {
    if (user?.display_name) {
      setTempName(user.display_name)
    }
  }, [user])

  const handleCycleAvatar = () => {
    const nextIdx = (avatarIndex + 1) % avatars.length
    setAvatarIndex(nextIdx)
    showToast('Avatar updated!')
  }

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempName.trim()) return
    setIsEditingName(false)
    showToast('Profile name updated!')
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>My Profile | Hangout</title>
        </Head>

        <div className="profile-page-container">
          {toastMessage && (
            <div className="toast-notification">
              <Check size={16} />
              <span>{toastMessage}</span>
            </div>
          )}

          <h2 className="page-heading">Settings</h2>

          {/* Profile Card Header */}
          <div className="profile-header-card">
            {/* Sparkle Decorative Flourishes */}
            <Sparkles className="sparkle-flourish pos-left" size={20} />
            <Sparkles className="sparkle-flourish pos-right" size={24} />

            <div className="avatar-edit-wrapper" onClick={handleCycleAvatar}>
              <img src={avatars[avatarIndex]} alt="Profile Avatar" className="profile-avatar-img" />
              <div className="camera-badge">
                <Camera size={14} />
              </div>
            </div>

            {isEditingName ? (
              <form onSubmit={handleSaveName} className="name-edit-form">
                <input 
                  type="text" 
                  className="pill-input compact" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  required
                />
                <div className="edit-btn-row">
                  <button type="submit" className="pill-button pill-button-primary compact-btn">Save</button>
                  <button type="button" className="pill-button pill-button-outline compact-btn" onClick={() => setIsEditingName(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="profile-name-block">
                <h3>{displayName}</h3>
                <p>{displayEmail}</p>
                <button className="edit-name-link" onClick={() => { setTempName(displayName); setIsEditingName(true); }}>
                  Edit Name
                </button>
              </div>
            )}
          </div>

        {/* Settings Rows */}
        <div className="settings-list-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-icon-box note-butter">
                <User size={18} />
              </div>
              <div className="settings-text-box">
                <div className="settings-title">My Groups</div>
                <div className="settings-desc">College Barkada, Weekend Warriors</div>
              </div>
            </div>
            <ChevronRight size={18} className="chevron-icon" />
          </div>

          <div className="settings-divider" />

          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-icon-box note-blush">
                <Bell size={18} />
              </div>
              <div className="settings-text-box">
                <div className="settings-title">Notification Preferences</div>
                <div className="settings-desc">Mute chats and emails</div>
              </div>
            </div>
            <span className="coming-soon-pill">Coming Soon</span>
          </div>

          <div className="settings-divider" />

          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-icon-box note-sea">
                <Settings size={18} />
              </div>
              <div className="settings-text-box">
                <div className="settings-title">App Theme</div>
                <div className="settings-desc">Nostalgic Scrapbook (Default)</div>
              </div>
            </div>
            <ChevronRight size={18} className="chevron-icon" />
          </div>
        </div>

        {/* Log Out Row */}
        <button className="logout-btn-row" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Log Out of Hangout</span>
        </button>
      </div>

      <style jsx>{`
        .profile-page-container {
          max-width: 600px;
          margin: 0 auto;
          position: relative;
        }

        .page-heading {
          font-size: 28px;
          margin-bottom: 24px;
          font-family: var(--font-display);
        }

        .toast-notification {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          background-color: var(--color-matcha);
          color: white;
          padding: 12px 24px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          font-weight: 700;
          font-size: 14px;
          z-index: 5000;
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Profile Header Card */
        .profile-header-card {
          background-color: var(--color-surface-container-lowest);
          border-radius: 28px;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          box-shadow: var(--shadow-ambient);
          border: 1px solid var(--color-surface-container-high);
          margin-bottom: 28px;
          overflow: hidden;
        }

        .sparkle-flourish {
          position: absolute;
          color: var(--color-tangerine);
          opacity: 0.7;
        }

        .sparkle-flourish.pos-left {
          top: 24px;
          left: 24px;
          animation: spinSlow 8s linear infinite;
        }

        .sparkle-flourish.pos-right {
          bottom: 24px;
          right: 24px;
          animation: float 4s ease-in-out infinite;
        }

        .avatar-edit-wrapper {
          position: relative;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background-color: var(--color-surface-container);
          border: 3px solid var(--color-outline-variant);
          cursor: pointer;
          margin-bottom: 16px;
          transition: transform 0.2s;
        }

        .avatar-edit-wrapper:hover {
          transform: scale(1.04);
        }

        .profile-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }

        .camera-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          background-color: var(--color-blush);
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        .profile-name-block {
          text-align: center;
        }

        .profile-name-block h3 {
          font-size: 24px;
          font-family: var(--font-display);
        }

        .profile-name-block p {
          font-size: 14px;
          color: var(--color-text-muted);
          margin-top: 2px;
          margin-bottom: 8px;
        }

        .edit-name-link {
          background: none;
          border: none;
          color: var(--color-sea);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
        }

        .name-edit-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100%;
          max-width: 280px;
        }

        .pill-input.compact {
          padding: 8px 16px;
          text-align: center;
        }

        .edit-btn-row {
          display: flex;
          gap: 8px;
        }

        .compact-btn {
          padding: 6px 16px;
          font-size: 13px;
        }

        /* Settings list */
        .settings-list-card {
          background-color: var(--color-surface-container-lowest);
          border-radius: 24px;
          padding: 8px 20px;
          box-shadow: var(--shadow-ambient);
          border: 1px solid var(--color-surface-container-high);
          margin-bottom: 40px;
        }

        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
        }

        .settings-row-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .settings-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text);
        }

        .settings-icon-box.note-butter { background-color: #fcf1d3; color: var(--color-tangerine); }
        .settings-icon-box.note-blush { background-color: #fbe6eb; color: var(--color-blush); }
        .settings-icon-box.note-sea { background-color: #e6f0fa; color: var(--color-sea); }

        .settings-title {
          font-weight: 700;
          font-size: 15px;
          color: var(--color-text);
        }

        .settings-desc {
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 1px;
        }

        .chevron-icon {
          color: var(--color-outline);
        }

        .coming-soon-pill {
          background-color: var(--color-surface-container-high);
          color: var(--color-text-muted);
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
        }

        .settings-divider {
          height: 1px;
          background-color: var(--color-surface-container);
        }

        /* Logout button */
        .logout-btn-row {
          width: 100%;
          background-color: transparent;
          border: 2px solid #ffb1c1;
          color: var(--color-blush);
          padding: 14px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 16px;
          transition: background 0.2s;
        }

        .logout-btn-row:hover {
          background-color: #fbe6eb;
        }

        @keyframes slideDown {
          from { transform: translate(-50%, -40px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
      </Layout>
    </ProtectedRoute>
  )
}
