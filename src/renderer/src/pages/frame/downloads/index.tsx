import React, { JSX } from 'react'
import './index.scss'
import { Tabs, List, Badge } from 'antd'
import { useSelector } from 'react-redux'
import { DownloadEntity } from '@common/types/entity'
import { RootState } from '@renderer/store'
import DownloadCard from '@renderer/components/download-card'
import { DownloadStatus } from '@common/enum'

const Downloads: React.FC = (): JSX.Element => {
  const completedDownloads = useSelector((state: RootState) =>
    state.downloads.downloads.filter((video) => video.status === DownloadStatus.COMPLETED).reverse()
  )

  const failedDownloads = useSelector((state: RootState) =>
    state.downloads.downloads.filter((video) => video.status === DownloadStatus.FAILED)
  )

  const downloadingDownloads = useSelector((state: RootState) =>
    state.downloads.downloads.filter((video) =>
      [DownloadStatus.PENDING, DownloadStatus.DOWNLOADING, DownloadStatus.PAUSED].includes(
        video.status
      )
    )
  )

  return (
    <div className="ya-download-page">
      <div className="download-tabs">
        <Tabs
          defaultActiveKey="downloading"
          items={[
            {
              key: DownloadStatus.DOWNLOADING,
              label: (
                <Badge
                  count={downloadingDownloads.length}
                  offset={[10, 0]}
                  showZero={false}
                  overflowCount={99}
                >
                  Downloading
                </Badge>
              ),
              children: (
                <List
                  dataSource={downloadingDownloads}
                  renderItem={(item: DownloadEntity) => {
                    return <DownloadCard value={item} />
                  }}
                />
              )
            },
            {
              key: DownloadStatus.COMPLETED,
              label: (
                <Badge
                  count={completedDownloads.length}
                  offset={[10, 0]}
                  showZero={false}
                  overflowCount={99}
                >
                  Downloaded
                </Badge>
              ),
              children: (
                <List
                  dataSource={completedDownloads}
                  renderItem={(item: DownloadEntity) => {
                    return <DownloadCard value={item} />
                  }}
                />
              )
            },
            {
              key: DownloadStatus.FAILED,
              label: (
                <Badge
                  count={failedDownloads.length}
                  offset={[10, 0]}
                  showZero={false}
                  overflowCount={99}
                >
                  Failed
                </Badge>
              ),
              children: (
                <List
                  dataSource={failedDownloads}
                  renderItem={(item: DownloadEntity) => {
                    return <DownloadCard value={item} />
                  }}
                />
              )
            }
          ]}
        />
      </div>
    </div>
  )
}

export default Downloads
