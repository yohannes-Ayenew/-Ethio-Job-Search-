import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { API_BASE } from '../utils/api'
import { useTelegramUser } from '../hooks/useTelegramUser'

const SavedJobsContext = createContext()

export function SavedJobsProvider({ children }) {
  const telegramUser = useTelegramUser()
  const [savedJobs, setSavedJobs] = useState([])
  const [userDbId, setUserDbId] = useState(null)

  const fetchSavedJobs = useCallback(async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/saved_jobs`)
      if (res.ok) {
        const data = await res.json()
        setSavedJobs(data.map(j => j.job_id))
      }
    } catch (e) {
      console.error('Failed to fetch saved jobs', e)
    }
  }, [])

  useEffect(() => {
    const initUser = async () => {
      try {
        const WebApp = window.Telegram?.WebApp
        const initData = WebApp?.initData
        if (initData) {
          const res = await fetch(`${API_BASE}/users/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData })
          })
          const data = await res.json()
          if (data.user) {
            setUserDbId(data.user.id)
            fetchSavedJobs(data.user.id)
          }
        }
      } catch (e) {
        // Fallback for demo
        setUserDbId(telegramUser?.id || 12345)
      }
    }
    initUser()
  }, [telegramUser, fetchSavedJobs])

  const toggleSavedJob = async (jobId) => {
    if (!userDbId) return

    const isSaved = savedJobs.includes(jobId)
    const method = isSaved ? 'DELETE' : 'POST'

    // Optimistic update
    setSavedJobs(prev => 
      isSaved ? prev.filter(id => id !== jobId) : [...prev, jobId]
    )

    try {
      const res = await fetch(`${API_BASE}/users/${userDbId}/saved_jobs/${jobId}`, {
        method
      })
      if (!res.ok) {
        throw new Error('Failed to toggle saved job')
      }
    } catch (e) {
      console.error(e)
      // Revert optimistic update
      setSavedJobs(prev => 
        isSaved ? [...prev, jobId] : prev.filter(id => id !== jobId)
      )
    }
  }

  return (
    <SavedJobsContext.Provider value={{ savedJobs, toggleSavedJob, userDbId }}>
      {children}
    </SavedJobsContext.Provider>
  )
}

export function useSavedJobs() {
  return useContext(SavedJobsContext)
}
