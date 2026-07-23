import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../utils/api'
import { useTelegramUser } from '../hooks/useTelegramUser'

const STATUS_COLORS = {
  pending:     'bg-amber-500/15 text-amber-400',
  viewed:      'bg-blue-500/15 text-blue-400',
  shortlisted: 'bg-green-500/15 text-green-400',
  rejected:    'bg-red-500/15 text-red-400',
}

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser]               = useState(null)
  const [applications, setApplications] = useState([])
  const [savedJobs, setSavedJobs]     = useState([])
  const [myJobs, setMyJobs]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [editing, setEditing]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [editData, setEditData]       = useState({ phone: '', cv_url: '' })
  const [activeTab, setActiveTab]     = useState('applications')
  const telegramUser = useTelegramUser()

  useEffect(() => {
    // Expand to full height inside Telegram
    try { window.Telegram?.WebApp?.expand() } catch (e) {}

    const init = async () => {
      try {
        const initData = window.Telegram?.WebApp?.initData || ''
        const authRes = await fetch(`${API_BASE}/users/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        })
        const authData = await authRes.json()

        if (authData.user) {
          const u = authData.user
          setUser(u)
          setEditData({ phone: u.phone || '', cv_url: u.cv_url || '' })

          // Fetch all 3 datasets in parallel
          const [appsRes, savedRes, jobsRes] = await Promise.allSettled([
            fetch(`${API_BASE}/applications/user/${u.id}`),
            fetch(`${API_BASE}/users/${u.id}/saved_jobs`),
            fetch(`${API_BASE}/jobs/user/${u.id}`),
          ])

          if (appsRes.status === 'fulfilled' && appsRes.value.ok)
            setApplications(await appsRes.value.json())
          if (savedRes.status === 'fulfilled' && savedRes.value.ok)
            setSavedJobs(await savedRes.value.json())
          if (jobsRes.status === 'fulfilled' && jobsRes.value.ok)
            setMyJobs(await jobsRes.value.json())
        }
      } catch (err) {
        console.error('Profile init failed:', err)
        // Demo fallback when not inside Telegram
        setUser({
          id: telegramUser?.id || 12345,
          full_name: `${telegramUser?.first_name || 'Demo'} ${telegramUser?.last_name || 'User'}`.trim(),
          username: telegramUser?.username || 'demo_user',
          phone: '+251 912 345 678',
          cv_url: '',
        })
        setApplications([
          { id: '1', job_title: 'Senior React Developer', job_company: 'Ethio Tech',  status: 'shortlisted', applied_at: '2026-06-10T10:00:00Z' },
          { id: '2', job_title: 'Financial Analyst',      job_company: 'CBE',         status: 'viewed',       applied_at: '2026-06-08T14:30:00Z' },
          { id: '3', job_title: 'Project Coordinator',    job_company: 'UNICEF',      status: 'pending',      applied_at: '2026-06-05T09:15:00Z' },
        ])
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [telegramUser])

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
    } catch {
      setUser(prev => ({ ...prev, ...editData }))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    )
  }

  const TABS = [
    { key: 'applications', label: 'Applied',    count: applications.length },
    { key: 'saved',        label: 'Saved',      count: savedJobs.length    },
    { key: 'posted',       label: 'Posted',     count: myJobs.length       },
  ]

  return (
    <div className="min-h-screen bg-background page-with-nav">

      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-yellow-500 flex items-center justify-center text-background text-2xl font-extrabold shrink-0 shadow-lg shadow-accent/30">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{user?.full_name}</h1>
            {user?.username && (
              <p className="text-white/40 text-sm">@{user.username}</p>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 space-y-3">
          <ProfileField
            label="Phone"
            value={user?.phone}
            editing={editing}
            inputType="tel"
            inputValue={editData.phone}
            placeholder="+251 9XX XXX XXXX"
            onChange={v => setEditData(p => ({ ...p, phone: v }))}
          />
          <div className="border-t border-white/[0.06]" />
          <ProfileField
            label="CV / Resume"
            value={user?.cv_url}
            isLink
            editing={editing}
            inputType="url"
            inputValue={editData.cv_url}
            placeholder="Google Drive or LinkedIn URL"
            onChange={v => setEditData(p => ({ ...p, cv_url: v }))}
          />

          <div className="pt-1 flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-accent text-background font-semibold rounded-xl text-sm disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving…' : '✓ Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 bg-white/[0.07] text-white/60 font-medium rounded-xl text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full py-2.5 bg-white/[0.07] text-white/60 font-medium rounded-xl text-sm hover:bg-white/10 transition-colors"
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl mb-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === t.key
                  ? 'bg-accent text-background shadow-sm'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === t.key ? 'bg-background/20' : 'bg-white/10'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Applications tab */}
        {activeTab === 'applications' && (
          applications.length === 0 ? (
            <EmptyState icon="📝" msg="No applications yet" action="Browse Jobs" onAction={() => navigate('/')} />
          ) : (
            <div className="space-y-2 pb-4">
              {applications.map(app => (
                <div key={app.id} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{app.job_title}</p>
                      <p className="text-white/40 text-xs mt-0.5">{app.job_company}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[app.status] || STATUS_COLORS.pending}`}>
                      {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                    </span>
                  </div>
                  <p className="text-white/25 text-xs mt-2">
                    Applied {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )
        )}

        {/* Saved tab */}
        {activeTab === 'saved' && (
          savedJobs.length === 0 ? (
            <EmptyState icon="🔖" msg="No saved jobs yet" action="Find Jobs" onAction={() => navigate('/')} />
          ) : (
            <div className="space-y-2 pb-4">
              {savedJobs.map(job => (
                <div
                  key={job.job_id}
                  onClick={() => navigate(`/job/${job.job_id}`)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 cursor-pointer hover:border-accent/30 transition-colors"
                >
                  <p className="text-white font-semibold text-sm truncate mb-1">{job.title}</p>
                  <p className="text-white/50 text-xs mb-2">{job.company}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Chip>📍 {job.location}</Chip>
                    <Chip accent>{job.job_type}</Chip>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Posted tab */}
        {activeTab === 'posted' && (
          myJobs.length === 0 ? (
            <EmptyState icon="📋" msg="No posted jobs yet" action="Post a Job" onAction={() => navigate('/post-job')} />
          ) : (
            <div className="space-y-2 pb-4">
              {myJobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/job/${job.id}`)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 cursor-pointer hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white font-semibold text-sm truncate flex-1">{job.title}</p>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      job.is_approved ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {job.is_approved ? '✓ Live' : '⏳ Pending'}
                    </span>
                  </div>
                  <p className="text-white/50 text-xs mb-2">{job.company}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Chip>📍 {job.location}</Chip>
                    <Chip accent>{job.category}</Chip>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

/* ── helpers ── */
function ProfileField({ label, value, isLink, editing, inputType, inputValue, placeholder, onChange }) {
  return (
    <div>
      <p className="text-white/40 text-xs mb-1">{label}</p>
      {editing ? (
        <input
          type={inputType}
          value={inputValue}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/[0.06] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-accent/50 transition-colors"
        />
      ) : isLink && value ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-accent text-sm hover:underline truncate block">
          {value}
        </a>
      ) : (
        <p className={`text-sm ${value ? 'text-white' : 'text-white/25 italic'}`}>{value || 'Not set'}</p>
      )}
    </div>
  )
}

function EmptyState({ icon, msg, action, onAction }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-10 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-white/50 text-sm mb-4">{msg}</p>
      <button
        onClick={onAction}
        className="px-6 py-2.5 bg-accent/20 text-accent rounded-xl text-sm font-semibold hover:bg-accent/30 transition-colors"
      >
        {action}
      </button>
    </div>
  )
}

function Chip({ children, accent }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full ${
      accent ? 'bg-accent/15 text-accent' : 'bg-white/[0.07] text-white/50'
    }`}>
      {children}
    </span>
  )
}
