import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE } from '../utils/api'
import { useTelegramUser } from '../hooks/useTelegramUser'

export default function Apply() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const telegramUser = useTelegramUser()

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    cover_note: '',
    cv_url: '',
  })

  // Pre-fill name from Telegram
  useEffect(() => {
    if (telegramUser) {
      setFormData(prev => ({
        ...prev,
        full_name: `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim(),
      }))
    }
  }, [telegramUser])

  // Show Telegram back button
  useEffect(() => {
    try {
      const WebApp = window.Telegram?.WebApp
      if (WebApp) {
        WebApp.BackButton.show()
        WebApp.BackButton.onClick(() => navigate(-1))
      }
    } catch (e) {}
    return () => {
      try { window.Telegram?.WebApp?.BackButton.hide() } catch (e) {}
    }
  }, [navigate])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting || submitted) return

    const userId = telegramUser?.id
    if (!userId) {
      setError('Could not detect your Telegram user ID. Please open this app inside Telegram.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const initData = window.Telegram?.WebApp?.initData || ''
      const res = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(initData ? { 'X-Telegram-Init-Data': initData } : {}),
        },
        body: JSON.stringify({
          job_id: id,
          user_id: userId,
          cover_note: formData.cover_note || null,
          cv_url: formData.cv_url || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Error ${res.status}`)
      }

      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="text-8xl mb-6 animate-bounce-once">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">Application Sent!</h1>
        <p className="text-white/50 text-sm mb-8">Good luck! We'll notify you of any updates.</p>
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs py-4 bg-accent text-background font-bold rounded-2xl text-base transition-all hover:shadow-lg hover:shadow-accent/30 active:scale-[0.97]"
        >
          Browse More Jobs
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="px-5 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>

        <h1 className="text-xl font-bold text-white mb-1">Apply for this Job</h1>
        <p className="text-white/40 text-sm mb-6">Fill in your details to submit your application</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5">Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl py-3 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50 transition-colors"
              placeholder="Your full name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl py-3 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50 transition-colors"
              placeholder="+251 9XX XXX XXXX"
            />
          </div>

          {/* Cover Note */}
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5">Cover Note <span className="text-white/30">(optional)</span></label>
            <textarea
              name="cover_note"
              value={formData.cover_note}
              onChange={handleChange}
              rows={4}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl py-3 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50 transition-colors resize-none"
              placeholder="Why are you a great fit for this role?"
            />
          </div>

          {/* CV Link */}
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5">CV / Resume Link <span className="text-white/30">(optional)</span></label>
            <input
              type="url"
              name="cv_url"
              value={formData.cv_url}
              onChange={handleChange}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl py-3 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50 transition-colors"
              placeholder="Google Drive, LinkedIn, or Dropbox link"
            />
            <p className="text-white/25 text-xs mt-1">Paste a link to your CV or LinkedIn profile</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-accent text-background font-bold rounded-2xl text-base transition-all hover:shadow-lg hover:shadow-accent/30 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting…
              </>
            ) : 'Submit Application 🚀'}
          </button>
        </form>
      </div>
    </div>
  )
}
