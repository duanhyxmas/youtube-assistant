import { ReactNode, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { addDownload, deleteDownload, updateDownload } from '@renderer/store/downloads'
import { Button, Dropdown, List, Popconfirm, Progress, Tooltip } from 'antd'
import { DeleteOutlined, PauseOutlined, RedoOutlined } from '@ant-design/icons'
import { ItemType } from 'antd/es/menu/interface'
import { DownloadStatus, LabelType } from '@common/enum'
import { BaseResult, Notify } from '@common/types/base'
import { DownloadEntity } from '@common/types/entity'
import { useNotify } from '@renderer/hooks/useNotify'
import Log from '@renderer/utils/log'

import './index.scss'

// download card props
// value: download entity
interface DownloadCardProps {
  value: DownloadEntity
}

/**
 * download card
 */
const DownloadCard: React.FC<DownloadCardProps> = ({ value }: DownloadCardProps) => {
  // notify
  const notify: Notify = useNotify()

  // dispatch
  const dispatch = useDispatch()

  // the card menus
  const [menus, setMenus] = useState<ItemType[]>([])

  // the card actions when right click
  const [actions, setActions] = useState<React.ReactNode[]>([])

  // file exists
  const [exist, setExist] = useState<boolean>(true)

  useEffect(() => {
    console.log(value)
    computed(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // computed
  const computed = async (value: DownloadEntity): Promise<void> => {
    // menu items
    const menus: ItemType[] = []

    // actions
    const actions: ReactNode[] = []

    // file exists
    let exist: boolean = false

    // if completed
    // if file exists, add show file and play video menu
    if (value.filePath) {
      if (value.status === DownloadStatus.COMPLETED) {
        exist = await window.api.fileExists(value.filePath)
        if (exist) {
          menus.push({
            key: LabelType.SHOW_FILE,
            label: 'Open Folder',
            onClick: () => openFile()
          })
          menus.push({
            key: LabelType.PLAY_VIDEO,
            label: 'Play Video',
            onClick: () => playVideo()
          })
        } else {
          menus.push({
            key: LabelType.OPEN_DIRECTORY,
            label: 'Open Folder',
            onClick: () => openDirectory()
          })
          menus.push({
            key: LabelType.RE_DOWNLOAD,
            label: 'Retry Download',
            onClick: () => onReDownload()
          })
        }
      } else {
        menus.push({
          key: LabelType.OPEN_DIRECTORY,
          label: 'Open Folder',
          onClick: () => openDirectory()
        })
      }
    }
    // if downloading or pending
    // add pause download menu
    // add pause download action
    if (value.status === DownloadStatus.DOWNLOADING || value.status === DownloadStatus.PENDING) {
      menus.push({
        key: LabelType.PAUSE_DOWNLOAD,
        label: 'Pause Download',
        onClick: () => onPauseDownload()
      })

      actions.push(
        <Tooltip key="pause" title="Pause Download">
          <Button type="text" size="small" icon={<PauseOutlined />} onClick={onPauseDownload} />
        </Tooltip>
      )
    }

    // if paused
    // add continue download menu
    // add continue download action
    if (value.status === DownloadStatus.PAUSED) {
      menus.push({
        key: LabelType.RESUME_DOWNLOAD,
        label: 'Resume Download',
        onClick: () => onResumeDownload()
      })

      actions.push(
        <Tooltip key="resume" title="Resume Download">
          <Button type="text" size="small" icon={<RedoOutlined />} onClick={onResumeDownload} />
        </Tooltip>
      )
    }

    // if failed
    // add resume download menu
    if (value.status === DownloadStatus.FAILED) {
      menus.push({
        key: LabelType.RESUME_DOWNLOAD,
        label: 'Retry Download',
        onClick: () => onResumeDownload()
      })
    }

    // add delete action
    actions.push(
      <Popconfirm
        key="delete"
        title="Confirm delete this download record?"
        onConfirm={onDeleteDownload}
        okText="Confirm"
        cancelText="Cancel"
      >
        <Tooltip title="Delete">
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Tooltip>
      </Popconfirm>
    )

    // set state menus
    setMenus(menus)

    // set state actions
    setActions(actions)

    // set state exist
    setExist(exist)
  }

  /**
   * delete download
   */
  const onDeleteDownload = async (): Promise<void> => {
    if (await window.api.deleteDownload(value.id!)) {
      notify.success('Download record deleted successfully')
      dispatch(deleteDownload(value))
    } else {
      notify.error('Failed to delete download record')
    }
  }

  /**
   * pause download
   */
  const onPauseDownload = async (): Promise<void> => {
    const download = await window.api.pauseDownload(value)
    if (download) {
      dispatch(updateDownload(download))
      notify.success('Download paused successfully')
    } else {
      notify.error('Failed to pause download')
    }
  }

  /**
   * resume download
   */
  const onResumeDownload = async (): Promise<void> => {
    const download = await window.api.resumeDownload(value)
    if (download) {
      dispatch(updateDownload(download))
      notify.success('Download resumed successfully')
    } else {
      notify.error('Failed to resume download')
    }
  }

  /**
   * re download
   */
  const onReDownload = async (): Promise<void> => {
    const download = await window.api.addDownload(value)
    if (download) {
      dispatch(addDownload(download))
      notify.success('Download restarted successfully')
    } else {
      notify.error('Failed to restart download')
    }
  }

  // open directory
  const openDirectory = async (): Promise<void> => {
    try {
      const data: BaseResult = await window.api.openDirectory(value.filePath)
      if (data.success) {
        notify.success('Folder opened successfully')
      } else {
        notify.error(data?.message ?? 'Failed to open folder')
      }
    } catch (e) {
      Log.error(e)
      notify.error('Error opening folder')
    }
  }

  // open file
  const openFile = async (): Promise<void> => {
    try {
      const data: BaseResult = await window.api.openFile(value.filePath)
      if (data.success) {
        notify.success('File opened successfully')
      } else {
        notify.error(data?.message ?? 'Failed to open file')
      }
    } catch (e) {
      Log.error(e)
      notify.error('Error opening file')
    }
  }

  // play video
  const playVideo = async (): Promise<void> => {
    try {
      const data: BaseResult = await window.api.playVideo(value.filePath)
      if (data.success) {
        notify.success('Video opened successfully')
      } else {
        notify.error(data?.message ?? 'Failed to open video')
      }
    } catch (e) {
      Log.error(e)
      notify.error('Error opening video')
    }
  }

  return (
    <Dropdown menu={{ items: menus }} trigger={['contextMenu']}>
      <List.Item actions={actions} className="download-card">
        <List.Item.Meta
          title={value.videoName}
          description={
            <>
              <div>
                <span>{value.videoChannelName} • </span>
                <span>{value.status} </span>
                {value.status === 'completed' && !exist && (
                  <span style={{ color: 'red' }}>Deleted</span>
                )}
              </div>
              {['downloading', 'pending', 'paused'].includes(value.status) && (
                <Progress
                  percent={Number(value.progressText)}
                  size="small"
                  strokeColor="#1890ff"
                  strokeWidth={4}
                  className="download-process"
                />
              )}
              {value.status === DownloadStatus.FAILED && value.errorText && (
                <div className="download-error">Error: {value.errorText}</div>
              )}
            </>
          }
        />
      </List.Item>
    </Dropdown>
  )
}

export default DownloadCard
