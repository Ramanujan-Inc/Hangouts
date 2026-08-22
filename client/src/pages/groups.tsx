import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Users, Plus, ArrowLeft } from 'lucide-react'
import { Button, EmptyState, Toast, Spinner } from '../components/ui'
import {
  Group,
  GroupMember,
  GroupInvite,
  GroupCard,
  GroupInvitesSection,
  GroupDetailModal,
  CreateGroupModal,
  InviteMemberModal,
} from '../components/groups'

export default function GroupsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [invites, setInvites] = useState<GroupInvite[]>([])
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState('')

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [inviting, setInviting] = useState(false)

  const [activeGroupDetail, setActiveGroupDetail] = useState<Group | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
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

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleRespondInvite = async (
    groupId: string,
    action: 'accept' | 'decline',
    groupName?: string
  ) => {
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

  const handleCreateGroup = async (name: string, coverImageUrl: string) => {
    try {
      setCreating(true)
      const newGroup = await api.post<Group>('/groups', {
        name,
        cover_image_url: coverImageUrl,
      })
      setGroups((prev) => [newGroup, ...prev])
      setIsCreateOpen(false)
      showToast(`Group "${newGroup.name}" created!`)
      fetchGroups()
    } catch (err: any) {
      showToast(err.message || 'Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  const handleInviteMember = async (username: string) => {
    if (!selectedGroup) return

    try {
      setInviting(true)
      const member = await api.post<GroupMember>(`/groups/${selectedGroup.id}/members`, {
        username,
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
      showToast(`Invited ${username}!`)
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
          <Toast
            message={toastMessage}
            isOpen={Boolean(toastMessage)}
            onClose={() => setToastMessage('')}
          />

          {/* Header */}
          <div className="groups-header">
            <div className="header-left">
              <button
                className="back-btn"
                onClick={() => router.push('/profile')}
                aria-label="Back to profile"
              >
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
          {!loading && (
            <GroupInvitesSection
              invites={invites}
              respondingInviteId={respondingInviteId}
              onRespond={handleRespondInvite}
            />
          )}

          {/* Content */}
          {loading ? (
            <Spinner centered label="Loading your groups..." />
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <Button size="small" onClick={fetchGroups}>
                Try Again
              </Button>
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
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onClick={() => setActiveGroupDetail(group)}
                />
              ))}
            </div>
          )}

          {/* Group Details Modal */}
          <GroupDetailModal
            group={activeGroupDetail}
            currentUserId={user?.id}
            onClose={() => setActiveGroupDetail(null)}
            onOpenInvite={(group) => {
              setActiveGroupDetail(null)
              setSelectedGroup(group)
              setIsInviteOpen(true)
            }}
            onLeaveGroup={(groupId, groupName) => {
              setActiveGroupDetail(null)
              handleLeaveGroup(groupId, groupName)
            }}
          />

          {/* Create Group Modal */}
          <CreateGroupModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onCreate={handleCreateGroup}
            onNotify={showToast}
            creating={creating}
          />

          {/* Invite Member Modal */}
          <InviteMemberModal
            group={selectedGroup}
            isOpen={isInviteOpen}
            onClose={() => {
              setIsInviteOpen(false)
              setSelectedGroup(null)
            }}
            onInvite={handleInviteMember}
            inviting={inviting}
          />
        </div>

        <style jsx>{`
          .groups-page-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 32px 20px 80px 20px;
          }

          .groups-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
            gap: 16px;
            flex-wrap: wrap;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .back-btn {
            background: none;
            border: none;
            color: var(--color-text-muted);
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
          }

          .back-btn:hover {
            background-color: var(--color-surface-container);
            color: var(--color-text);
          }

          .page-heading {
            font-size: 28px;
            color: var(--color-text);
            margin: 0;
          }

          .page-subtitle {
            font-size: 14px;
            color: var(--color-text-muted);
            margin-top: 4px;
            margin-bottom: 0;
          }

          .groups-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 24px;
          }

          .empty-groups-wrapper {
            margin-top: 24px;
          }

          .error-state {
            text-align: center;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            color: var(--color-blush);
          }
        `}</style>
      </Layout>
    </ProtectedRoute>
  )
}
