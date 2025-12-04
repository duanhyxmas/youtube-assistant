import React, { useState, useEffect, JSX } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BaseResult, SelectResult } from '@common/types/base'
import { ConfigEntity } from '@common/types/entity'
import { DOWNLOAD_PATH } from '@common/constants/config-key'
import { setDownloadPath } from '@renderer/store/settings'
import { useNotify } from '@renderer/hooks/useNotify'
import { RootState, AppDispatch } from '@renderer/store'
import Log from '@renderer/utils/log'
import './index.scss'

const SettingDownloadPath: React.FC = (): JSX.Element => {
  const notify = useNotify()

  const dispatch: AppDispatch = useDispatch()

  const downloadPath = useSelector((state: RootState) => state.settings.downloadPath)

  const [value, setValue] = useState<ConfigEntity | null>(null)

  useEffect(() => {
    setValue(downloadPath)
  }, [downloadPath])

  const onSelectDirectory = async (): Promise<void> => {
    try {
      const result: BaseResult<SelectResult> = await window.api.selectDirectory()
      if (!result.success) {
        Log.error('select download path error:', result.message)
        notify.error(`Failed to save ${result.message}`)
        return
      }
      if (result.value!.canceled) {
        return
      }
      const value: ConfigEntity = {
        key: DOWNLOAD_PATH,
        value: result.value!.path!
      }
      if (await window.api.saveConfig(value)) {
        dispatch(setDownloadPath(value))
      }
      notify.success(`Saved successfully`)
    } catch (e) {
      Log.error('select download path error:', e)
      notify.error(`Failed to save ${e}`)
    }
  }

  return (
    <div className="setting-item">
      <div className="setting-item-title">Download Directory</div>
      <div className="setting-item-content">
        <div className="setting-item-path" title={value?.value || ''}>
          {value?.value || 'select dwonload directory'}
        </div>
        <button className="setting-item-button" onClick={onSelectDirectory}>
          select directory
        </button>
      </div>
    </div>
  )
}

export default SettingDownloadPath
