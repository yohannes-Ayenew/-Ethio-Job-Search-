import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../utils/api'

const CATEGORIES = ['IT', 'Finance', 'NGO', 'Health', 'Education', 'Engineering', 'Marketing', 'Other']
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship']
const LOCATIONS = ['Addis Ababa', 'Hawassa', 'Mekelle', 'Bahir Dar', 'Dire Dawa', 'Adama', 'Remote']

const STEPS = ['Details', 'Category', 'Description', 'Review']

export default function PostJob() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    job_type: '',
    salary: '',
    deadline: '',
    category: '',
    description: '',
  })

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
  const initData = window.Telegram?.WebApp?.initData || ''

  useEffect(() => {
    try {
      const WebApp = window.Telegram?.WebApp
      if (WebApp) {
        WebApp.BackButton.show()
        WebApp.BackButton.onClick(() => {
          if (step > 0) setStep(s => s - 1)
          else navigate('/')
        })
        WebApp.expand()
      }
    } catch (e) {}
    return () => {
      try { window.Telegram?.WebApp?.BackButton.hide() } catch (e) {}
    }
  }, [navigate, step])

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: typeof e === 'string' ? e : e.target.value }))
    setError(null)
  }

  const canNext = () => {
    if (step === 0) return form.title && form.company && form.location && form.job_type
    if (step === 1) return form.category
    if (step === 2) return form.description.trim().length >= 30
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(initData
            ? { 'X-Telegram-Init-Data': initData }
            : tgUser
            ? { 'X-Bot-Token': import.meta.env.VITE_BOT_TOKEN || '', 'telegram-user-id': String(tgUser.id) }
            : {}),
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || `Error ${res.status}`)
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
        <h1 className="text-2xl font-bold text-white mb-2">Job Posted!</h1>
        <p className="text-white/50 text-sm mb-2">
          Your listing is now <span className="text-amber-400 font-semibold">pending admin review</span>.
        </p>
        <p className="text-white/30 text-xs mb-8">You'll be notified once it's approved.</p>
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs py-3.5 bg-accent text-background font-bold rounded-2xl transition-all hover:shadow-lg hover:shadow-accent/30 active:scale-[0.97]"
        >
          Back to Jobs
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => (step > 0 ? setStep(s => s - 1) : navigate('/'))}
            className="w-8 h-8 rounded-xl bg-white/[0.07] flex items-center justify-center text-white/60 hover:text-white transition-colors">
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Post a Job</h1>
            <p className="text-white/40 text-xs">Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col gap-1 items-center">
              <div className={`h-1 w-full rounded-full transition-all duration-500 ${i <= step ? 'bg-accent' : 'bg-white/10'}`} />
              <span className={`text-[9px] font-medium ${i === step ? 'text-accent' : 'text-white/20'}`}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

        {/* STEP 0: Basic Details */}
        {step === 0 && (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
            <Field label="Job Title *" value={form.title} onChange={set('title')} placeholder="e.g. Senior Software Engineer" />
            <Field label="Company Name *" value={form.company} onChange={set('company')} placeholder="e.g. Ethio Telecom" />
            <Field label="Salary (optional)" value={form.salary} onChange={set('salary')} placeholder="e.g. 80,000 - 120,000 ETB" />
            <Field label="Application Deadline (optional)" value={form.deadline} onChange={set('deadline')} type="date" />
            <div>
              <label className="block text-white/60 text-xs font-medium mb-2">Location *</label>
              <div className="grid grid-cols-2 gap-2">
                {LOCATIONS.map(loc => (
                  <Chip key={loc} label={loc} active={form.location === loc} onSelect={() => set('location')(loc)} />
                ))}
                <input
                  value={LOCATIONS.includes(form.location) ? '' : form.location}
                  onChange={set('location')}
                  placeholder="Other city..."
                  className="col-span-2 bg-white/[0.06] border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/60 text-xs font-medium mb-2">Job Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {JOB_TYPES.map(t => (
                  <Chip key={t} label={t} active={form.job_type === t} onSelect={() => set('job_type')(t)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Category */}
        {step === 1 && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <p className="text-white/40 text-sm mb-4">Pick the best category for your listing:</p>
            <div className="grid grid-cols-2 gap-2.5">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => set('category')(cat)}
                  className={`py-4 rounded-2xl font-semibold text-sm transition-all duration-200 border ${form.category === cat
                    ? 'bg-accent text-background border-accent shadow-lg shadow-accent/30 scale-[1.02]'
                    : 'bg-white/[0.06] text-white/70 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                  {CAT_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Description */}
        {step === 2 && (
          <div className="animate-[fadeIn_0.3s_ease-out] space-y-2">
            <label className="block text-white/60 text-xs font-medium">Job Description *</label>
            <p className="text-white/30 text-xs">Minimum 30 characters. Include responsibilities, qualifications, and how to apply.</p>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={12}
              placeholder="Describe the role, responsibilities, required qualifications, and any other relevant information..."
              className="w-full bg-white/[0.06] border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50 transition-colors resize-none"
            />
            <p className={`text-xs text-right ${form.description.length >= 30 ? 'text-accent' : 'text-white/30'}`}>
              {form.description.length} chars
            </p>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="animate-[fadeIn_0.3s_ease-out] space-y-3">
            <p className="text-white/40 text-sm mb-2">Review your listing before posting:</p>
            <ReviewCard label="Title" value={form.title} />
            <ReviewCard label="Company" value={form.company} />
            <ReviewCard label="Category" value={form.category} />
            <ReviewCard label="Location" value={form.location} />
            <ReviewCard label="Job Type" value={form.job_type} />
            {form.salary && <ReviewCard label="Salary" value={form.salary} />}
            {form.deadline && <ReviewCard label="Deadline" value={form.deadline} />}
            <div className="bg-white/[0.04] rounded-2xl p-4 border border-white/[0.08]">
              <p className="text-white/40 text-xs font-medium mb-1.5">Description</p>
              <p className="text-white/70 text-sm leading-relaxed line-clamp-4">{form.description}</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-amber-400 text-xs">
              ⏳ Your job will be reviewed by our admin team and published within a few hours.
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-4 border-t border-white/5">
        <button
          onClick={step < STEPS.length - 1 ? () => setStep(s => s + 1) : handleSubmit}
          disabled={!canNext() || submitting}
          className="w-full py-4 bg-accent text-background font-bold rounded-2xl text-base transition-all hover:shadow-lg hover:shadow-accent/30 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </>
          ) : step < STEPS.length - 1 ? (
            'Continue →'
          ) : (
            '🚀 Post Job'
          )}
        </button>
      </div>
    </div>
  )
}

/* ─── helpers ─── */
function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-white/60 text-xs font-medium mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-white/[0.06] border border-white/10 rounded-xl py-3 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50 transition-colors"
      />
    </div>
  )
}

function Chip({ label, active, onSelect }) {
  return (
    <button onClick={onSelect}
      className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${active
        ? 'bg-accent text-background border-accent shadow-md shadow-accent/20'
        : 'bg-white/[0.06] text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}>
      {label}
    </button>
  )
}

function ReviewCard({ label, value }) {
  return (
    <div className="flex items-center justify-between bg-white/[0.04] rounded-xl px-4 py-3 border border-white/[0.08]">
      <span className="text-white/40 text-xs">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  )
}

const CAT_ICONS = {
  IT: '💻', Finance: '💰', NGO: '🌍', Health: '🏥',
  Education: '📚', Engineering: '⚙️', Marketing: '📣', Other: '📋',
}
