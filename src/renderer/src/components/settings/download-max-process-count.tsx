import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { InputNumber, Space } from 'antd'
import { ConfigEntity } from '@common/types/entity'
import { DEFAULT_DOWNLOAD_MAX_PROCESS, DEFAULT_DOWNLOAD_MIN_PROCESS } from '@common/constants'
import { DOWNLOAD_MAX_PROCESS_COUNT } from '@common/constants/config-key'
import { setDownloadMaxProcessCount } from '@renderer/store/settings'
import { RootState, AppDispatch } from '@renderer/store'
import { useNotify } from '@renderer/hooks/useNotify'
import './index.scss'
const SettingDownloadMaxProcessCount: React.FC = () => {
  const notify = useNotify()

  const dispatch: AppDispatch = useDispatch()

  const downloadMaxProcessCount = useSelector(
    (state: RootState) => state.settings.downloadMaxProcessCount
  )

  const [value, setValue] = useState<number>(DEFAULT_DOWNLOAD_MIN_PROCESS)

  const valueRef = useRef<number>(DEFAULT_DOWNLOAD_MIN_PROCESS)

  const oldValueRef = useRef<number>(DEFAULT_DOWNLOAD_MIN_PROCESS)

  useEffect(() => {
    let value = downloadMaxProcessCount?.value
      ? parseInt(downloadMaxProcessCount.value, 10)
      : DEFAULT_DOWNLOAD_MIN_PROCESS
    value = Math.min(Math.max(value, DEFAULT_DOWNLOAD_MIN_PROCESS), DEFAULT_DOWNLOAD_MAX_PROCESS)
    valueRef.current = value
    oldValueRef.current = value
    setValue(value)
  }, [downloadMaxProcessCount])

  const onChange = (value: number | null): void => {
    if (value === null || isNaN(value)) {
      value = 3
    }
    value = Math.min(Math.max(value, 3), 100)
    valueRef.current = value
    setValue(value)
  }

  const onBlur = async (): Promise<void> => {
    if (valueRef.current === oldValueRef.current) {
      return
    }
    setValue(valueRef.current)

    const configValue: ConfigEntity = {
      key: DOWNLOAD_MAX_PROCESS_COUNT,
      value: valueRef.current.toString()
    }

    if (await window.api.saveConfig(configValue)) {
      dispatch(setDownloadMaxProcessCount(configValue))
      notify.success('Saved successfully')
    } else {
      notify.error('Failed to save')
    }
  }

  return (
    <div className="setting-item">
      <div className="setting-item-title">Download Max Process Count</div>
      <div className="setting-item-content">
        <Space.Compact>
          <InputNumber
            className="setting-item-input-number"
            min={DEFAULT_DOWNLOAD_MIN_PROCESS}
            max={DEFAULT_DOWNLOAD_MAX_PROCESS}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
          />
        </Space.Compact>
        <span style={{ marginLeft: 8, color: '#6c6969ff' }}>Range: 3-100</span>
      </div>
    </div>
  )
}

export default SettingDownloadMaxProcessCount
