import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { API_BASE } from '../utils/api'
import { useSavedJobs } from '../contexts/SavedJobsContext'

export default function JobDetail() {
  const { savedJobs, toggleSavedJob } = useSavedJobs()
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Show back button
    try {
      WebApp.BackButton.show()
      WebApp.BackButton.onClick(() => navigate(-1))
    } catch (e) {}

    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${id}`)
        const data = await res.json()
        setJob(data)
      } catch (err) {
        console.error('Failed to fetch job:', err)
        // Demo fallback
        setJob({
          id, title: 'Senior React Developer', company: 'Ethio Tech',
          location: 'Addis Ababa', job_type: 'Full-time', category: 'IT',
          salary: '80,000 - 120,000 ETB', deadline: '2026-07-01',
          description: 'We are looking for an experienced React developer to join our team.\n\nResponsibilities:\n• Build and maintain web applications\n• Collaborate with design and backend teams\n• Write clean, maintainable code\n• Participate in code reviews\n\nRequirements:\n• 3+ years of React experience\n• Strong JavaScript/TypeScript skills\n• Experience with REST APIs\n• Familiarity with Git and CI/CD',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchJob()

    return () => {
      try { WebApp.BackButton.hide() } catch (e) {}
    }
  }, [id, navigate])

  const handleShare = () => {
    try {
      const text = `Check out this job: ${job.title} at ${job.company}!`
      if (WebApp.shareMessage) {
        WebApp.shareMessage(text)
      } else if (navigator.share) {
        navigator.share({ title: job.title, text })
      }
    } catch (e) {
      console.error('Share failed:', e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-white/60">Job not found</p>
      </div>
    )
  }

  const daysLeft = job.deadline
    ? Math.max(0, Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-white/40 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>

        {/* Company logo placeholder */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center text-accent text-2xl font-bold shrink-0">
            {job.company?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white leading-tight">{job.title}</h1>
            <p className="text-white/60 text-sm mt-0.5">{job.company}</p>
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full">
            📍 {job.location}
          </span>
          <span className="inline-flex items-center gap-1 bg-accent/20 text-accent text-xs px-3 py-1.5 rounded-full">
            {job.job_type}
          </span>
          {job.category && (
            <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 text-xs px-3 py-1.5 rounded-full">
              🏷️ {job.category}
            </span>
          )}
        </div>

        {/* Salary */}
        {job.salary && (
          <div className="bg-gradient-to-r from-accent/15 to-transparent border border-accent/20 rounded-xl p-3 mb-4">
            <p className="text-white/40 text-xs mb-0.5">Salary Range</p>
            <p className="text-accent font-semibold">{job.salary}</p>
          </div>
        )}

        {/* Deadline */}
        {daysLeft !== null && (
          <div className={`rounded-xl p-3 mb-4 ${
            daysLeft <= 3
              ? 'bg-red-500/15 border border-red-500/20'
              : 'bg-white/5 border border-white/10'
          }`}>
            <p className="text-white/40 text-xs mb-0.5">Application Deadline</p>
            <p className={`font-semibold ${daysLeft <= 3 ? 'text-red-400' : 'text-white'}`}>
              {job.deadline}
              <span className="font-normal text-sm ml-2">
                ({daysLeft === 0 ? 'Today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`})
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="px-4">
        <h2 className="text-white font-semibold mb-2">Job Description</h2>
        <div className="bg-white/[0.04] border border-white/5 rounded-xl p-4">
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
            {job.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 mt-4 flex gap-2">
        <button
          onClick={() => toggleSavedJob(job.id)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            savedJobs.includes(job.id) 
              ? 'bg-accent/20 text-accent hover:bg-accent/30' 
              : 'bg-white/[0.06] text-white/60 hover:bg-white/10'
          }`}
        >
          {savedJobs.includes(job.id) ? '🔖 Saved' : '📑 Save Job'}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 py-2.5 bg-white/[0.06] text-white/60 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
        >
          📤 Share
        </button>
      </div>

      {/* Sticky bottom Apply bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-white/5">
        <button
          onClick={() => navigate(`/apply/${id}`)}
          className="w-full py-3.5 bg-accent text-background font-bold rounded-xl text-base transition-all hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98]"
        >
          Apply Now 🚀
        </button>
      </div>
    </div>
  )
}
