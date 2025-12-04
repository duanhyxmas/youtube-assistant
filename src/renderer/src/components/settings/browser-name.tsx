import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BrowserPath } from 'get-installed-browsers'
import { Select } from 'antd'
import { BaseResult, OptionValue } from '@common/types/base'
import { ConfigEntity } from '@common/types/entity'
import { BROWSER_NAME } from '@common/constants/config-key'
import { setBrowserName } from '@renderer/store/settings'
import { RootState, AppDispatch } from '@renderer/store'
import { useNotify } from '@renderer/hooks/useNotify'
import './index.scss'

const SettingBrowserName: React.FC = () => {
  const notify = useNotify()
  const dispatch: AppDispatch = useDispatch()

  const browserName = useSelector((state: RootState) => state.settings.browserName)

  const [options, setOptions] = useState<OptionValue[]>([])

  const [value, setValue] = useState<string>('')

  useEffect(() => {
    setValue(browserName?.value || '')
  }, [browserName])

  useEffect(() => {
    getInstallBrowser()
  }, [])

  /**
   * get install browser
   */
  const getInstallBrowser = async (): Promise<void> => {
    const result: BaseResult<BrowserPath[]> = await window.api.getInstalledBrowsers()
    if (!result.success) {
      setOptions([])
      return
    }
    const options: OptionValue[] = []
    result.value!.forEach((browser: BrowserPath) => {
      options.push({
        label: browser.name,
        value: browser.name
      })
    })
    setOptions(options)
  }

  const onChange = async (value: string): Promise<void> => {
    setValue(value)

    const configValue: ConfigEntity = {
      key: BROWSER_NAME,
      value: value
    }

    if (await window.api.saveConfig(configValue)) {
      dispatch(setBrowserName(configValue))
      notify.success('Saved successfully')
    } else {
      notify.error('Failed to save')
    }
  }

  return (
    <div className="setting-item">
      <div className="setting-item-title">Browser Name</div>
      <div className="setting-item-content">
        <Select value={value} onChange={onChange} style={{ flex: 1 }}>
          {options.map((option: OptionValue) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
        <button className="setting-item-button" onClick={getInstallBrowser}>
          reload
        </button>
      </div>
    </div>
  )
}

export default SettingBrowserName
