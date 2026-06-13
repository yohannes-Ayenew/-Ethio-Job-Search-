import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'

export function useTelegramUser() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      if (WebApp.initDataUnsafe?.user) {
        setUser(WebApp.initDataUnsafe.user)
      }
    } catch (e) {
      console.warn('Failed to extract Telegram user data', e)
    }
  }, [])

  return user
}
