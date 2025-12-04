import React, { useEffect, useRef, useState, JSX } from 'react'
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube'
import { useDispatch, useSelector } from 'react-redux'
import {
  Card,
  Image,
  Typography,
  Space,
  Divider,
  Button,
  Popconfirm,
  Progress,
  Tooltip
} from 'antd'
import {
  LinkOutlined,
  CopyOutlined,
  HeartOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  PauseOutlined,
  FolderOpenOutlined,
  RedoOutlined
} from '@ant-design/icons'
import { BaseResult } from '@common/types/base'
import { DownloadStatus } from '@common/enum'
import { DownloadEntity, FavoriteVideoEntity } from '@common/types/entity'
import { useNotify } from '@renderer/hooks/useNotify'
import { RootState } from '@renderer/store'
import { addDownload, updateDownload } from '@renderer/store/downloads'
import Log from '@renderer/utils/log'

import './index.scss'
import { getVideoUrl } from '@renderer/utils'

const { Text } = Typography

interface VideoCardProps {
  video: FavoriteVideoEntity
  addFavorite?: () => void
  quickFavorite?: () => void
  delFavorite?: () => void
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  addFavorite,
  quickFavorite,
  delFavorite
}: VideoCardProps) => {
  const notify = useNotify()

  const dispatch = useDispatch()

  const download = useSelector((state: RootState) => state.downloads.downloadMap[video.videoId])

  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const [loadVideo, setLoadVideo] = useState<boolean>(false)
  const [preview, setPreview] = useState<boolean>(false)
  const [exsit, setExsit] = useState<boolean>(false)

  const playerRef = useRef<YouTubePlayer>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const opts = {
    height: '270px',
    width: '450px',
    playerVars: {
      autoplay: 0,
      mute: 1
    }
  }

  useEffect(() => {
    if (download) {
      window.api
        .fileExists(download.filePath)
        .then((value) => {
          setExsit(value)
        })
        .catch(() => {
          setExsit(false)
        })
    } else {
      setExsit(false)
    }
  }, [download])

  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('fullscreenchange', handleFullscreenChange)
      }
    }
  }, [])

  // launch url
  const launchUrl = (): void => {
    const url = getVideoUrl(video.videoId)
    window.open(url, '_blank')
  }

  // copy url
  const copyUrl = async (): Promise<void> => {
    try {
      const url = getVideoUrl(video.videoId)
      await navigator.clipboard.writeText(url)

      notify.success('Link copied')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // mouse enter
  // when mouse enter, load video and play video
  const onMouseEnter = (): void => {
    setLoadVideo(true)
    setPreview(true)
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.mute()
      playerRef.current.playVideo()
    }
  }

  // mouse leave
  // when mouse leave, pause video
  const onMouseLeave = (): void => {
    setPreview(false)
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo()
    }
  }

  const onAddDownload = async (): Promise<void> => {
    const value: DownloadEntity = {
      videoId: video.videoId,
      videoName: video.videoName,
      videoUrl: getVideoUrl(video.videoId),
      videoThumbnail: video.videoThumbnail,
      videoChannelName: video.videoChannelName,
      videoPublishAt: video.videoPublishAt,
      filePath: '',
      progressText: '',
      errorText: '',
      status: DownloadStatus.PENDING
    }
    const download = await window.api.addDownload(value)
    if (download) {
      dispatch(addDownload(download))
      notify.success('Download added successfully')
    } else {
      notify.error('Failed to add download')
    }
  }

  /**
   * pause download
   */
  const onPauseDownload = async (value: DownloadEntity): Promise<void> => {
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
  const onResumeDownload = async (value: DownloadEntity): Promise<void> => {
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
  const onReDownload = async (value: DownloadEntity): Promise<void> => {
    const download = await window.api.addDownload(value)
    if (download) {
      dispatch(addDownload(download))
      notify.success('Download restarted successfully')
    } else {
      notify.error('Failed to restart download')
    }
  }

  // open file
  const openFile = async (value: DownloadEntity): Promise<void> => {
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

  /**
   * render button about download
   */
  const renderDownloadButton = (): JSX.Element => {
    // if download is null, show add download button
    if (!download) {
      return (
        <Tooltip title="Download">
          <Button type="text" icon={<DownloadOutlined />} onClick={onAddDownload} size="small" />
        </Tooltip>
      )
    }

    // Show different UI based on different status
    switch (download.status) {
      case DownloadStatus.COMPLETED:
        return (
          <>
            {exsit ? (
              <Tooltip title="Open File">
                <Button
                  type="text"
                  icon={<FolderOpenOutlined />}
                  size="small"
                  onClick={() => openFile(download)}
                />
              </Tooltip>
            ) : (
              <Tooltip title="Retry Download">
                <Button
                  key="resume"
                  type="text"
                  size="small"
                  icon={<RedoOutlined />}
                  onClick={() => onReDownload(download)}
                />
              </Tooltip>
            )}
          </>
        )

      case DownloadStatus.DOWNLOADING:
        return (
          <div
            className="download-progress-container"
            title="Downloading - Click to pause"
            onClick={() => onPauseDownload(download)}
          >
            <Progress
              type="circle"
              percent={Number(download.progressText)}
              strokeWidth={12}
              size={14}
            />
          </div>
        )

      case DownloadStatus.PENDING:
        return (
          <Tooltip title="Pending - Click to pause">
            <Button
              type="text"
              icon={<SyncOutlined />}
              size="small"
              onClick={() => onPauseDownload(download)}
            />
          </Tooltip>
        )
      case DownloadStatus.PAUSED:
        return (
          <Tooltip title="Paused - Click to resume">
            <Button
              type="text"
              icon={<PauseOutlined />}
              size="small"
              onClick={() => onResumeDownload(download)}
            />
          </Tooltip>
        )

      case DownloadStatus.FAILED:
      default:
        return (
          <Tooltip title="Failed - Click to retry">
            <Button
              type="text"
              icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              size="small"
              onClick={() => onReDownload(download)}
            />
          </Tooltip>
        )
    }
  }

  const onReady = (event: YouTubeEvent): void => {
    const hadPlayer = !!playerRef.current
    playerRef.current = event.target
    if (hadPlayer) {
      playerRef.current.playVideo()
      playerRef.current.mute()
    }
    iframeRef.current = event.target.getIframe()
    if (iframeRef.current) {
      iframeRef.current.addEventListener('fullscreenchange', handleFullscreenChange)
    }
  }

  const handleFullscreenChange = (): void => {
    const isCurrentlyFullscreen = !!document.fullscreenElement
    setFullscreen(isCurrentlyFullscreen)
  }

  return (
    <>
      {video && (
        <Card className="ya-youtube-video-card" hoverable>
          <div className="ya-video-card-content">
            <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
              {loadVideo && (
                <div
                  className="ya-video-thumbnail"
                  style={{ display: preview || fullscreen ? 'block' : 'none' }}
                >
                  <YouTube videoId={video.videoId} opts={opts} onReady={onReady} />
                </div>
              )}

              <div
                className="ya-video-thumbnail"
                style={{ display: loadVideo && (preview || fullscreen) ? 'none' : 'block' }}
              >
                <Image
                  src={video.videoThumbnail || ''}
                  alt={video.videoName}
                  preview={false}
                  width="100%"
                  height={270}
                />
              </div>
            </div>

            <div className="ya-video-title" title={video.videoName}>
              {video.videoName}
            </div>

            <div className="ya-video-channel-date">
              <Text
                className="ya-channel-name"
                type="secondary"
                ellipsis={{ tooltip: video.videoChannelName }}
                title={video.videoChannelName}
              >
                {video.videoChannelName}
              </Text>
              <Text className="ya-publish-date" type="secondary">
                {video.videoPublishAt}
              </Text>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div className="ya-video-actions">
              <Space size="small">
                {renderDownloadButton()}
                <Tooltip title="Open Video">
                  <Button type="text" icon={<LinkOutlined />} onClick={launchUrl} size="small" />
                </Tooltip>
                <Tooltip title="Copy Link">
                  <Button type="text" icon={<CopyOutlined />} onClick={copyUrl} size="small" />
                </Tooltip>
                {quickFavorite && (
                  <Tooltip title="Quick Favorite">
                    <Button
                      type="text"
                      danger
                      icon={<HeartOutlined />}
                      onClick={quickFavorite}
                      size="small"
                    />
                  </Tooltip>
                )}
                {addFavorite && (
                  <Tooltip title="Add to Favorites">
                    <Button
                      type="text"
                      icon={<HeartOutlined />}
                      onClick={addFavorite}
                      size="small"
                    />
                  </Tooltip>
                )}
                {delFavorite && (
                  <Popconfirm
                    title="Confirm remove this video from favorites?"
                    onConfirm={delFavorite}
                    okText="Confirm"
                    cancelText="Cancel"
                  >
                    <Tooltip title="Remove">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                      />
                    </Tooltip>
                  </Popconfirm>
                )}
              </Space>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}

export default VideoCard
