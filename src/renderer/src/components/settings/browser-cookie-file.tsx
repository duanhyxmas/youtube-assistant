import React, { useState, useEffect, JSX } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BaseResult, SelectResult } from '@common/types/base'
import { ConfigEntity } from '@common/types/entity'
import { BROWSER_COOKIE_FILE } from '@common/constants/config-key'
import { setBrowserCookieFile } from '@renderer/store/settings'
import { RootState, AppDispatch } from '@renderer/store'
import { useNotify } from '@renderer/hooks/useNotify'
import Log from '@renderer/utils/log'
import './index.scss'

const SettingBrowserCookieFile: React.FC = (): JSX.Element => {
  const notify = useNotify()

  const dispatch: AppDispatch = useDispatch()

  const browserCookieFile = useSelector((state: RootState) => state.settings.browserCookieFile)

  const [value, setValue] = useState<ConfigEntity | null>(null)

  useEffect(() => {
    setValue(browserCookieFile)
  }, [browserCookieFile])

  const onSelectFile = async (): Promise<void> => {
    try {
      const result: BaseResult<SelectResult> = await window.api.selectFile()
      if (!result.success) {
        Log.error('select browser cookie file error:', result.message)
        notify.error(`Failed to save ${result.message}`)
        return
      }
      if (result.value!.canceled) {
        return
      }
      const value: ConfigEntity = {
        key: BROWSER_COOKIE_FILE,
        value: result.value!.path!
      }
      if (await window.api.saveConfig(value)) {
        dispatch(setBrowserCookieFile(value))
      }
      notify.success(`Saved successfully`)
    } catch (e) {
      Log.error('select browser cookie file error:', e)
      notify.error(`Failed to save ${e}`)
    }
  }

  /**
   * open cookie documentation
   */
  const openCookieDocumentation = (): void => {
    window.open('https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp')
  }

  return (
    <div className="setting-item">
      <div className="setting-item-title">
        Browser Cookie File
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            openCookieDocumentation()
          }}
          style={{ marginLeft: 8, fontSize: 12, color: '#1890ff' }}
        >
          (Learn more)
        </a>
      </div>
      <div className="setting-item-content">
        <div className="setting-item-path" title={value?.value || ''}>
          {value?.value || 'select browser cookie file'}
        </div>
        <button className="setting-item-button" onClick={onSelectFile}>
          select file
        </button>
      </div>
    </div>
  )
}

export default SettingBrowserCookieFile
