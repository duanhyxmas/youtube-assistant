import { JSX } from 'react'

import SettingDownloadPath from '@renderer/components/settings/download-path'
import SettingDownloadMaxProcessCount from '@renderer/components/settings/download-max-process-count'
import SettingBrowCookieFile from '@renderer/components/settings/browser-cookie-file'
import SettingBrowserName from '@renderer/components/settings/browser-name'

import './index.scss'

const Settings: React.FC = (): JSX.Element => {
  return (
    <div className="ya-settings-page">
      <h1>Settings</h1>
      <div className="ya-settings-content">
        <SettingDownloadPath />
        <SettingDownloadMaxProcessCount />
        <SettingBrowCookieFile />
        <SettingBrowserName />
      </div>
    </div>
  )
}

export default Settings
