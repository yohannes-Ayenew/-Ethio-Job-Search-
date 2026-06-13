import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { API_BASE } from '../utils/api'
import { useTelegramUser } from '../hooks/useTelegramUser'

const STATUS_COLORS = {
  pending: 'bg-gray-500/20 text-gray-400',
  viewed: 'bg-blue-500/20 text-blue-400',
  shortlisted: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
}

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState({ phone: '', cv_url: '' })
  const telegramUser = useTelegramUser()

  useEffect(() => {
    try {
      WebApp.BackButton.show()
      WebApp.BackButton.onClick(() => navigate(-1))
    } catch (e) {}

    const init = async () => {
      try {
        // Auth with Telegram
        const initData = WebApp.initData
        const authRes = await fetch(`${API_BASE}/users/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        })
        const authData = await authRes.json()
        if (authData.user) {
          setUser(authData.user)
          setEditData({
            phone: authData.user.phone || '',
            cv_url: authData.user.cv_url || '',
          })

          // Fetch applications
          const appsRes = await fetch(`${API_BASE}/applications/user/${authData.user.id}`)
          const appsData = await appsRes.json()
          setApplications(Array.isArray(appsData) ? appsData : [])
        }
      } catch (err) {
        console.error('Profile init failed:', err)
        // Demo fallback
        setUser({
          id: telegramUser?.id || 12345,
          full_name: `${telegramUser?.first_name || 'Demo'} ${telegramUser?.last_name || 'User'}`,
          username: telegramUser?.username || 'demo_user',
          phone: '+251 912 345 678',
          cv_url: '',
        })
        setApplications([
          { id: '1', job_title: 'Senior React Developer', job_company: 'Ethio Tech', status: 'pending', applied_at: '2026-06-10T10:00:00Z' },
          { id: '2', job_title: 'Financial Analyst', job_company: 'CBE', status: 'viewed', applied_at: '2026-06-08T14:30:00Z' },
          { id: '3', job_title: 'Project Coordinator', job_company: 'UNICEF', status: 'shortlisted', applied_at: '2026-06-05T09:15:00Z' },
        ])
      } finally {
        setLoading(false)
      }
    }
    init()

    return () => {
      try { WebApp.BackButton.hide() } catch (e) {}
    }
  }, [navigate, telegramUser])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      setUser(prev => ({ ...prev, ...editData }))
      setEditing(false)
    } catch (err) {
      console.error('Save failed:', err)
      setUser(prev => ({ ...prev, ...editData }))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-white/40 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-yellow-600 flex items-center justify-center text-background text-2xl font-bold shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{user?.full_name}</h1>
            {user?.username && (
              <p className="text-white/40 text-sm">@{user.username}</p>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-6 space-y-3">
          <div>
            <p className="text-white/40 text-xs">Phone Number</p>
            {editing ? (
              <input
                type="tel"
                value={editData.phone}
                onChange={(e) => setEditData(p => ({ ...p, phone: e.target.value }))}
                className="mt-1 w-full bg-white/[0.06] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-accent/50"
                placeholder="+251 9XX XXX XXXX"
              />
            ) : (
              <p className="text-white text-sm">{user?.phone || 'Not set'}</p>
            )}
          </div>

          <div className="border-t border-white/5 pt-3">
            <p className="text-white/40 text-xs">CV / Resume Link</p>
            {editing ? (
              <input
                type="url"
                value={editData.cv_url}
                onChange={(e) => setEditData(p => ({ ...p, cv_url: e.target.value }))}
                className="mt-1 w-full bg-white/[0.06] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-accent/50"
                placeholder="Google Drive / LinkedIn URL"
              />
            ) : (
              <div>
                {user?.cv_url ? (
                  <a href={user.cv_url} target="_blank" rel="noreferrer" className="text-accent text-sm hover:underline truncate block">
                    {user.cv_url}
                  </a>
                ) : (
                  <p className="text-white/30 text-sm">Not set</p>
                )}
              </div>
            )}
          </div>

          {/* Edit / Save buttons */}
          <div className="pt-1">
            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 bg-accent text-background font-medium rounded-lg text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2 bg-white/10 text-white/60 font-medium rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full py-2 bg-white/[0.06] text-white/60 font-medium rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* My Applications */}
        <h2 className="text-white font-semibold mb-3">My Applications</h2>

        {applications.length === 0 ? (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-white/60 text-sm">No applications yet</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-accent/20 text-accent rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white/[0.04] border border-white/10 rounded-xl p-4 transition-colors hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{app.job_title}</p>
                    <p className="text-white/40 text-xs">{app.job_company}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[app.status] || STATUS_COLORS.pending}`}>
                    {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                  </span>
                </div>
                <p className="text-white/30 text-xs mt-2">
                  Applied {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
