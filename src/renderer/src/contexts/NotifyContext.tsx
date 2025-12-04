import React from 'react'
import { message } from 'antd'
import { NotifyContext } from '@renderer/hooks/useNotify'
import { Notify } from '@common/types/base'

export const NotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, contextHolder] = message.useMessage()

  const api: Notify = {
    success: (t: string) => toast.success(t),
    error: (t: string) => toast.error(t),
    info: (t: string) => toast.info(t),
    warning: (t: string) => toast.warning(t)
  }

  return (
    <NotifyContext.Provider value={api}>
      {contextHolder}
      {children}
    </NotifyContext.Provider>
  )
}
