import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'
import { Users, Plus, UserPlus, LogOut, Check, Sparkles, ArrowLeft, Upload, Camera, Mail, X } from 'lucide-react'
import { Button, Modal, EmptyState, AvatarStack, TextField } from '../components/ui'

interface MemberProfile {
  id: string
  username: string
  email: string
  avatar_url?: string
}

interface GroupMember {
  id: string
  group_id: string
  user_id: string
  status: string
  joined_at: string
  profile?: MemberProfile
}

interface Group {
  id: string
  name: string
  cover_image_url?: string
  created_by: string
  created_at: string
  members?: GroupMember[]
}

interface GroupInvite {
  id: string
  group_id: string
  status: string
  joined_at: string
  group?: Group
  inviter?: MemberProfile
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
]

export default function GroupsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [invites, setInvites] = useState<GroupInvite[]>([])
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState('')

  // Create Group Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedCover, setSelectedCover] = useState(PRESET_COVERS[0])
  const [customCoverPreview, setCustomCoverPreview] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [creating, setCreating] = useState(false)

  // Invite Member Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviting, setInviting] = useState(false)

  // Group Details Modal State
  const [activeGroupDetail, setActiveGroupDetail] = useState<Group | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setCustomCoverPreview(previewUrl)
    setSelectedCover(previewUrl)

    try {
      setUploadingCover(true)
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.upload<{ url: string }>('/groups/cover', formData)
      if (res?.url) {
        setSelectedCover(res.url)
        showToast('Cover photo uploaded!')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo')
    } finally {
      setUploadingCover(false)
    }
  }

  const fetchGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const groupsData = await api.get<Group[]>('/groups').catch((err) => {
        console.error('Failed to load groups:', err)
        return []
      })
      const invitesData = await api.get<GroupInvite[]>('/groups/invites').catch((err) => {
        console.error('Failed to load invites:', err)
        return []
      })
      setGroups(groupsData || [])
      setInvites(invitesData || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const handleRespondInvite = async (groupId: string, action: 'accept' | 'decline', groupName?: string) => {
    try {
      setRespondingInviteId(groupId)
      await api.post(`/groups/${groupId}/invites/respond`, { action })
      showToast(action === 'accept' ? `Joined "${groupName || 'group'}"!` : 'Invitation declined')
      await fetchGroups()
    } catch (err: any) {
      showToast(err.message || `Failed to ${action} invite`)
    } finally {
      setRespondingInviteId(null)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    try {
      setCreating(true)
      const newGroup = await api.post<Group>('/groups', {
        name: newGroupName.trim(),
        cover_image_url: selectedCover,
      })
      setGroups((prev) => [newGroup, ...prev])
      setIsCreateOpen(false)
      setNewGroupName('')
      showToast(`Group "${newGroup.name}" created!`)
      fetchGroups()
    } catch (err: any) {
      showToast(err.message || 'Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup || !inviteUsername.trim()) return

    try {
      setInviting(true)
      const member = await api.post<GroupMember>(`/groups/${selectedGroup.id}/members`, {
        username: inviteUsername.trim(),
      })
      
      // Update local group members
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === selectedGroup.id) {
            const currentMembers = g.members || []
            return {
              ...g,
              members: [...currentMembers, member],
            }
          }
          return g
        })
      )

      // Update active modal group details if currently open
      setActiveGroupDetail((prev) => {
        if (!prev || prev.id !== selectedGroup.id) return prev
        const currentMembers = prev.members || []
        return {
          ...prev,
          members: [...currentMembers, member],
        }
      })

      setIsInviteOpen(false)
      setInviteUsername('')
      showToast(`Invited ${inviteUsername.trim()}!`)
      fetchGroups()
    } catch (err: any) {
      showToast(err.message || 'Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!user) return
    if (!confirm(`Are you sure you want to leave "${groupName}"?`)) return

    try {
      await api.delete(`/groups/${groupId}/members/${user.id}`)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
      showToast(`Left "${groupName}"`)
    } catch (err: any) {
      showToast(err.message || 'Failed to leave group')
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>My Groups | Hangout</title>
        </Head>

        <div className="groups-page-container">
          {toastMessage && (
            <div className="toast-notification">
              <Check size={16} />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Header */}
          <div className="groups-header">
            <div className="header-left">
              <button className="back-btn" onClick={() => router.push('/profile')}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="page-heading">My Groups</h2>
                <p className="page-subtitle">Organize hangouts with your friend circles</p>
              </div>
            </div>
            <Button size="default" onClick={() => setIsCreateOpen(true)}>
              <Plus size={18} />
              <span>Create Group</span>
            </Button>
          </div>

          {/* Pending Invitations Section */}
          {!loading && invites.length > 0 && (
            <div className="pending-invites-section">
              <div className="invites-title-row">
                <Mail size={16} className="invite-icon" />
                <h3>Invitations ({invites.length})</h3>
              </div>

              <div className="invites-grid">
                {invites.map((invite) => {
                  const group = invite.group
                  const inviterName = invite.inviter?.username || 'A friend'
                  const isResponding = respondingInviteId === invite.group_id

                  return (
                    <div key={invite.id} className="invite-card">
                      <div
                        className="invite-cover-thumbnail"
                        style={{
                          backgroundImage: group?.cover_image_url
                            ? `url(${group.cover_image_url})`
                            : 'linear-gradient(135deg, var(--color-surface-container), var(--tint-butter))',
                        }}
                      />
                      <div className="invite-content">
                        <div className="invite-info">
                          <h4 className="invite-group-name">{group?.name || 'Hangout Group'}</h4>
                          <p className="invite-from">
                            Invited by <strong>@{inviterName}</strong>
                          </p>
                        </div>

                        <div className="invite-actions">
                          <Button
                            variant="primary"
                            size="small"
                            disabled={isResponding}
                            onClick={() => handleRespondInvite(invite.group_id, 'accept', group?.name)}
                          >
                            <Check size={14} />
                            <span>{isResponding ? 'Joining...' : 'Accept'}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="small"
                            disabled={isResponding}
                            onClick={() => handleRespondInvite(invite.group_id, 'decline', group?.name)}
                          >
                            <X size={14} />
                            <span>Decline</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading your groups...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <Button size="small" onClick={fetchGroups}>Try Again</Button>
            </div>
          ) : groups.length === 0 ? (
            <div className="empty-groups-wrapper">
              <EmptyState
                icon={<Users size={48} color="var(--color-tangerine)" />}
                title="No Groups Yet"
                description="Create a group to organize hangouts with your friend circle, share notes, and plan memories together."
                variant="card"
              />
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button onClick={() => setIsCreateOpen(true)}>Create a Group</Button>
              </div>
            </div>
          ) : (
            <div className="groups-grid">
              {groups.map((group) => {
                const members = group.members || []
                const avatars = members.map((m) => ({
                  src: m.profile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.profile?.username || m.user_id}`,
                  alt: m.profile?.username || 'Member',
                  title: m.profile?.username || 'Member',
                }))

                return (
                  <div
                    key={group.id}
                    className="group-card"
                    onClick={() => setActiveGroupDetail(group)}
                  >
                    {/* Cover Banner */}
                    <div
                      className="group-cover"
                      style={{
                        backgroundImage: group.cover_image_url
                          ? `url(${group.cover_image_url})`
                          : 'linear-gradient(135deg, var(--color-surface-container), var(--tint-butter))',
                      }}
                    />

                    {/* Card Body */}
                    <div className="group-body">
                      <div className="group-info">
                        <h3 className="group-name">{group.name}</h3>
                      </div>

                      {avatars.length > 0 && (
                        <div className="members-row">
                          <AvatarStack avatars={avatars} size={32} overlap={10} />
                          <span className="member-names">
                            {members.slice(0, 3).map((m) => m.profile?.username || 'User').join(', ')}
                            {members.length > 3 && ` +${members.length - 3} more`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Group Details Modal */}
          {activeGroupDetail && (
            <Modal
              title={activeGroupDetail.name}
              onClose={() => setActiveGroupDetail(null)}
            >
              <div className="group-detail-modal">
                <div
                  className="detail-cover-banner"
                  style={{
                    backgroundImage: activeGroupDetail.cover_image_url
                      ? `url(${activeGroupDetail.cover_image_url})`
                      : 'linear-gradient(135deg, var(--color-surface-container), var(--tint-butter))',
                  }}
                >
                  <div className="cover-badge">
                    <Users size={14} />
                    <span>
                      {(activeGroupDetail.members || []).length}{' '}
                      {(activeGroupDetail.members || []).length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>

                <div className="detail-meta-section">
                  <p className="detail-created">
                    Created on{' '}
                    {new Date(activeGroupDetail.created_at).toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    })}
                  </p>
                </div>

                <div className="detail-members-section">
                  <div className="section-title-row">
                    <h4>Members ({(activeGroupDetail.members || []).length})</h4>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        const target = activeGroupDetail
                        setActiveGroupDetail(null)
                        setSelectedGroup(target)
                        setIsInviteOpen(true)
                      }}
                    >
                      <UserPlus size={14} />
                      <span>Invite</span>
                    </Button>
                  </div>

                  <div className="members-list">
                    {(activeGroupDetail.members || []).length === 0 ? (
                      <p className="no-members">No active members found.</p>
                    ) : (
                      (activeGroupDetail.members || []).map((m) => {
                        const isOwner = m.user_id === activeGroupDetail.created_by
                        const avatarUrl =
                          m.profile?.avatar_url ||
                          `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.profile?.username || m.user_id}`
                        return (
                          <div key={m.id} className="member-item">
                            <img src={avatarUrl} alt={m.profile?.username || 'Member'} className="member-avatar" />
                            <div className="member-info">
                              <span className="member-name">{m.profile?.username || 'User'}</span>
                            </div>
                            {isOwner && <span className="owner-badge">Creator</span>}
                            {m.status === 'pending' && <span className="pending-badge">Pending</span>}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="detail-modal-footer">
                  <button
                    className="leave-btn-modal"
                    onClick={() => {
                      const id = activeGroupDetail.id
                      const name = activeGroupDetail.name
                      setActiveGroupDetail(null)
                      handleLeaveGroup(id, name)
                    }}
                  >
                    <LogOut size={16} />
                    <span>Leave Group</span>
                  </button>
                  <Button size="default" onClick={() => setActiveGroupDetail(null)}>
                    Done
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {/* Create Group Modal */}
          {isCreateOpen && (
            <Modal title="Create New Group" onClose={() => setIsCreateOpen(false)}>
              <form onSubmit={handleCreateGroup} className="modal-form">
                <TextField
                  label="Group Name"
                  placeholder="e.g. Weekend Warriors, College Barkada"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />

                <div className="cover-picker-section">
                  <label className="picker-label">Group Cover Photo</label>

                  {/* Upload custom file option */}
                  <label className="upload-cover-box">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileUpload}
                      style={{ display: 'none' }}
                    />
                    {customCoverPreview ? (
                      <div
                        className="custom-preview-cover"
                        style={{ backgroundImage: `url(${customCoverPreview})` }}
                      >
                        <div className="change-photo-badge">
                          <Camera size={14} />
                          <span>{uploadingCover ? 'Uploading...' : 'Change Photo'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <Upload size={18} className="upload-icon" />
                        <span>{uploadingCover ? 'Uploading photo...' : 'Upload photo from device'}</span>
                      </div>
                    )}
                  </label>

                  <div className="divider-label">
                    <span>or choose a preset theme</span>
                  </div>

                  <div className="cover-options">
                    {PRESET_COVERS.map((cover, idx) => (
                      <div
                        key={idx}
                        className={`cover-option ${selectedCover === cover && !customCoverPreview ? 'selected' : ''}`}
                        style={{ backgroundImage: `url(${cover})` }}
                        onClick={() => {
                          setCustomCoverPreview(null)
                          setSelectedCover(cover)
                        }}
                      >
                        {selectedCover === cover && !customCoverPreview && (
                          <div className="check-overlay">
                            <Check size={16} color="white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-actions">
                  <Button variant="outline" size="default" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="default" disabled={creating || !newGroupName.trim()}>
                    {creating ? 'Creating...' : 'Create Group'}
                  </Button>
                </div>
              </form>
            </Modal>
          )}

          {/* Invite Member Modal */}
          {isInviteOpen && selectedGroup && (
            <Modal
              title={`Invite to "${selectedGroup.name}"`}
              onClose={() => {
                setIsInviteOpen(false)
                setSelectedGroup(null)
              }}
            >
              <form onSubmit={handleInviteMember} className="modal-form">
                <p className="modal-desc">
                  Enter the username of the friend you want to invite to this group.
                </p>
                <TextField
                  label="Username"
                  placeholder="e.g. jam, dave, chloe"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  required
                />
                <div className="modal-actions">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      setIsInviteOpen(false)
                      setSelectedGroup(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="default" disabled={inviting || !inviteUsername.trim()}>
                    {inviting ? 'Inviting...' : 'Send Invite'}
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </div>

        <style jsx>{`
          .groups-page-container {
            max-width: 900px;
            margin: 0 auto;
            position: relative;
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
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            font-weight: 700;
            font-size: 14px;
            z-index: 5000;
            animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .groups-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 32px;
            flex-wrap: wrap;
            gap: 16px;
          }

          /* Pending Invitations Section */
          .pending-invites-section {
            margin-bottom: 28px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .invites-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--color-tangerine);
          }

          .invites-title-row h3 {
            font-size: 15px;
            font-family: var(--font-display);
            font-weight: 700;
            color: var(--color-text);
          }

          .invites-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
          }

          .invite-card {
            display: flex;
            gap: 16px;
            align-items: center;
            padding: 6px 0;
          }

          .invite-cover-thumbnail {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            background-size: cover;
            background-position: center;
            flex-shrink: 0;
          }

          .invite-content {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: 1;
            min-width: 0;
          }

          .invite-group-name {
            font-size: 15px;
            font-family: var(--font-display);
            font-weight: 700;
            color: var(--color-text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .invite-from {
            font-size: 12px;
            color: var(--color-text-muted);
          }

          .invite-from strong {
            color: var(--color-text);
          }

          .invite-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 2px;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .back-btn {
            background-color: var(--color-surface-container-lowest);
            border: 1px solid var(--color-surface-container-high);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--color-text);
            transition: all 0.2s ease;
          }

          .back-btn:hover {
            background-color: var(--color-surface-container);
            transform: translateX(-2px);
          }

          .page-heading {
            font-size: 28px;
            font-family: var(--font-display);
            font-weight: 700;
            color: var(--color-text);
          }

          .page-subtitle {
            font-size: 14px;
            color: var(--color-text-muted);
            margin-top: 2px;
          }

          .loading-state,
          .error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 0;
            gap: 16px;
            color: var(--color-text-muted);
          }

          .spinner {
            width: 36px;
            height: 36px;
            border: 3px solid var(--color-surface-container);
            border-top-color: var(--color-tangerine);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .groups-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 24px;
          }

          .group-card {
            background-color: var(--color-surface-container-lowest);
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid var(--color-surface-container-high);
            box-shadow: var(--shadow-ambient);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            display: flex;
            flex-direction: column;
            cursor: pointer;
          }

          .group-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 32px rgba(46, 42, 40, 0.08);
          }

          .group-cover {
            height: 120px;
            background-size: cover;
            background-position: center;
            position: relative;
            padding: 12px;
          }

          .cover-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background-color: rgba(46, 42, 40, 0.7);
            backdrop-filter: blur(8px);
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 9999px;
          }

          .group-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            flex: 1;
            gap: 16px;
          }

          .group-name {
            font-size: 18px;
            font-family: var(--font-display);
            font-weight: 700;
            color: var(--color-text);
          }

          .group-created {
            font-size: 12px;
            color: var(--color-text-muted);
            margin-top: 2px;
          }

          .members-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: auto;
          }

          .member-names {
            font-size: 12px;
            color: var(--color-text-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .group-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding-top: 12px;
            border-top: 1px solid var(--color-surface-container);
          }

          .leave-btn {
            background: none;
            border: none;
            color: var(--color-text-muted);
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            padding: 6px 10px;
            border-radius: 8px;
            transition: all 0.2s ease;
          }

          .leave-btn:hover {
            color: var(--color-blush);
            background-color: var(--tint-blush);
          }

          /* Modal styles */
          .modal-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .modal-desc {
            font-size: 13px;
            color: var(--color-text-muted);
            line-height: 1.5;
          }

          .cover-picker-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .picker-label {
            font-size: 13px;
            font-weight: 700;
            color: var(--color-text);
          }

          .upload-cover-box {
            display: block;
            cursor: pointer;
            width: 100%;
          }

          .upload-placeholder {
            border: 2px dashed var(--color-outline);
            background-color: var(--color-surface-container);
            border-radius: 14px;
            padding: 18px 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            color: var(--color-text-muted);
            font-size: 13px;
            font-weight: 700;
            transition: all 0.2s ease;
          }

          .upload-placeholder:hover {
            border-color: var(--color-tangerine);
            background-color: var(--tint-butter);
            color: var(--color-tangerine);
          }

          .custom-preview-cover {
            height: 90px;
            border-radius: 14px;
            background-size: cover;
            background-position: center;
            position: relative;
            border: 2px solid var(--color-tangerine);
            box-shadow: 0 4px 12px rgba(240, 140, 33, 0.2);
          }

          .change-photo-badge {
            position: absolute;
            bottom: 8px;
            right: 8px;
            background-color: rgba(46, 42, 40, 0.75);
            backdrop-filter: blur(6px);
            color: white;
            padding: 4px 10px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 700;
          }

          .divider-label {
            text-align: center;
            position: relative;
            margin: 4px 0;
          }

          .divider-label span {
            font-size: 12px;
            color: var(--color-text-muted);
            background-color: var(--color-surface-container-lowest);
            padding: 0 8px;
          }

          .cover-options {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }

          .cover-option {
            height: 60px;
            border-radius: 12px;
            background-size: cover;
            background-position: center;
            cursor: pointer;
            position: relative;
            border: 2px solid transparent;
            transition: transform 0.2s, border-color 0.2s;
          }

          .cover-option:hover {
            transform: scale(1.05);
          }

          .cover-option.selected {
            border-color: var(--color-tangerine);
          }

          .check-overlay {
            position: absolute;
            inset: 0;
            background: rgba(240, 140, 33, 0.4);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 8px;
          }

          /* Group Details Modal Styles */
          .group-detail-modal {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .detail-cover-banner {
            height: 140px;
            border-radius: 16px;
            background-size: cover;
            background-position: center;
            position: relative;
            padding: 12px;
          }

          .detail-meta-section {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .detail-created {
            font-size: 13px;
            color: var(--color-text-muted);
          }

          .detail-members-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .section-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .section-title-row h4 {
            font-size: 15px;
            font-family: var(--font-display);
            font-weight: 700;
            color: var(--color-text);
          }

          .members-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 220px;
            overflow-y: auto;
            padding-right: 4px;
          }

          .no-members {
            font-size: 13px;
            color: var(--color-text-muted);
            font-style: italic;
          }

          .member-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            background-color: var(--color-surface-container);
            border-radius: 12px;
          }

          .member-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
            background-color: var(--color-surface-container-high);
          }

          .member-info {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
          }

          .member-name {
            font-size: 14px;
            font-weight: 700;
            color: var(--color-text);
          }

          .member-email {
            font-size: 11px;
            color: var(--color-text-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .owner-badge {
            font-size: 10px;
            font-weight: 700;
            background-color: var(--tint-blush);
            color: var(--color-blush);
            padding: 3px 8px;
            border-radius: 9999px;
          }

          .pending-badge {
            font-size: 10px;
            font-weight: 700;
            background-color: var(--tint-butter);
            color: var(--color-tangerine);
            padding: 3px 8px;
            border-radius: 9999px;
            border: 1px solid rgba(240, 140, 33, 0.3);
          }

          .detail-modal-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding-top: 16px;
            border-top: 1px solid var(--color-surface-container);
            margin-top: 4px;
          }

          .leave-btn-modal {
            background: none;
            border: none;
            color: var(--color-blush);
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 8px;
            transition: all 0.2s ease;
          }

          .leave-btn-modal:hover {
            background-color: var(--tint-blush);
          }
        `}</style>
      </Layout>
    </ProtectedRoute>
  )
}
