import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { API_BASE } from '../utils/api'
import JobCard from '../components/JobCard'
import SkeletonCard from '../components/SkeletonCard'

const CATEGORIES = ['All', 'IT', 'Finance', 'NGO', 'Health', 'Education', 'Engineering', 'Marketing']

export default function Home() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchJobs = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      const params = new URLSearchParams({ page: pageNum, limit: 10 })
      if (activeCategory !== 'All') params.append('category', activeCategory)
      if (search.trim()) params.append('search', search.trim())

      const res = await fetch(`${API_BASE}/jobs?${params}`)
      const data = await res.json()

      if (append) {
        setJobs(prev => [...prev, ...data.jobs])
      } else {
        setJobs(data.jobs || [])
      }
      setTotalPages(data.pages || 0)
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
      // Use demo data if API is not available
      if (!append) {
        setJobs([
          { id: '1', title: 'Senior React Developer', company: 'Ethio Tech', location: 'Addis Ababa', job_type: 'Full-time', category: 'IT', salary: '80,000 - 120,000 ETB', deadline: '2026-07-01' },
          { id: '2', title: 'Financial Analyst', company: 'CBE', location: 'Addis Ababa', job_type: 'Full-time', category: 'Finance', salary: '60,000 - 90,000 ETB', deadline: '2026-06-28' },
          { id: '3', title: 'Project Coordinator', company: 'UNICEF Ethiopia', location: 'Remote', job_type: 'Contract', category: 'NGO', salary: 'Competitive', deadline: '2026-06-25' },
          { id: '4', title: 'Nurse Practitioner', company: 'Black Lion Hospital', location: 'Addis Ababa', job_type: 'Full-time', category: 'Health', salary: '45,000 - 65,000 ETB', deadline: '2026-07-10' },
          { id: '5', title: 'Marketing Manager', company: 'Ride Ethiopia', location: 'Addis Ababa', job_type: 'Full-time', category: 'Marketing', salary: '70,000 - 100,000 ETB', deadline: '2026-07-05' },
          { id: '6', title: 'Civil Engineer', company: 'EFFORT Construction', location: 'Hawassa', job_type: 'Full-time', category: 'Engineering', salary: '55,000 - 85,000 ETB', deadline: '2026-07-15' },
        ])
        setTotalPages(1)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [activeCategory, search])

  useEffect(() => {
    setPage(1)
    fetchJobs(1)
  }, [fetchJobs])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchJobs(nextPage, true)
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-white">
              Ethio<span className="text-accent">Jobs</span>
            </h1>
            <p className="text-white/40 text-xs">Find your dream job in Ethiopia 🇪🇹</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent transition-transform hover:scale-110"
          >
            👤
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
          <input
            type="text"
            placeholder="Search jobs, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-accent text-background shadow-lg shadow-accent/30'
                  : 'bg-white/[0.06] text-white/60 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Job List */}
      <div className="px-4 space-y-3 mt-1">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-white/60 text-lg font-medium mb-1">No jobs found</p>
            <p className="text-white/30 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={(id) => navigate(`/job/${id}`)} />
          ))
        )}
      </div>

      {/* Load More */}
      {!loading && page < totalPages && (
        <div className="px-4 mt-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-3 bg-white/[0.06] text-white/60 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </span>
            ) : (
              'Load More Jobs'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
