import React from 'react'

export default function JobCard({ job, onClick }) {
  const daysLeft = job.deadline
    ? Math.max(0, Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div
      onClick={() => onClick(job.id)}
      className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1 active:scale-[0.98]"
    >
      <h3 className="text-lg font-bold text-white mb-1 leading-tight">{job.title}</h3>
      <p className="text-white/60 text-sm mb-3">{job.company}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center gap-1 bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full">
          📍 {job.location || 'N/A'}
        </span>
        <span className="inline-flex items-center gap-1 bg-accent/20 text-accent text-xs px-3 py-1 rounded-full">
          {job.job_type || 'Full-time'}
        </span>
      </div>

      {job.salary && (
        <p className="text-accent font-semibold text-sm mb-2">💰 {job.salary}</p>
      )}

      {daysLeft !== null && (
        <p className={`text-xs mb-3 ${daysLeft <= 3 ? 'text-red-400' : 'text-white/50'}`}>
          ⏳ {daysLeft === 0 ? 'Deadline today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
        </p>
      )}

      <button className="w-full py-2.5 bg-accent/20 text-accent font-medium rounded-xl text-sm transition-colors hover:bg-accent/30">
        View Details →
      </button>
    </div>
  )
}
