import { createContext, useContext } from 'react'
import { message } from 'antd'
import { Notify } from '@common/types/base'

export const NotifyContext = createContext<Notify | null>(null)

export const useNotify = (): Notify => {
  const ctx = useContext(NotifyContext)
  if (!ctx) {
    // fallback to global message if provider is not mounted
    return {
      success: (t: string) => message.success(t),
      error: (t: string) => message.error(t),
      info: (t: string) => message.info(t),
      warning: (t: string) => message.warning(t)
    }
  }
  return ctx
}
