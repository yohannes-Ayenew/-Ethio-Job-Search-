import { useMemo } from 'react'

export function useTelegramUser() {
  const user = useMemo(() => {
    try {
      const WebApp = window.Telegram?.WebApp
      return WebApp?.initDataUnsafe?.user ?? null
    } catch {
      return null
    }
  }, [])

  return user
}
