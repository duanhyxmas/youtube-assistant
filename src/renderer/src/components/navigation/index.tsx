import { JSX, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Badge } from 'antd'
import { DownloadStatus } from '@common/enum'
import { DownloadEntity } from '@common/types/entity'

import { RootState } from '@renderer/store'
import framePages from '@renderer/routes'
import { updateDownload } from '@renderer/store/downloads'

import './index.scss'
interface NavigationProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  setCurrentPage
}: NavigationProps): JSX.Element => {
  const badgeCount = useSelector(
    (state: RootState) =>
      state.downloads.downloads.filter((download) => download.status !== DownloadStatus.COMPLETED)
        .length
  )

  const dispatch = useDispatch()

  useEffect(() => {
    window.api.onDownloadChanged((download: DownloadEntity) => {
      dispatch(updateDownload(download))
    })
  }, [dispatch])

  return (
    <nav className="ya-navigation">
      <div className="ya-navigation-list">
        {framePages.map((item) => (
          <div
            className={'ya-navigation-item ' + (currentPage === item.name ? 'active' : '')}
            key={item.name}
            onClick={() => setCurrentPage(item.name)}
          >
            {item.name === 'downloads' ? (
              <Badge count={badgeCount} offset={[-20, 10]} showZero={false} overflowCount={99}>
                <div className="ya-navigation-text">
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </div>
              </Badge>
            ) : (
              <div className="ya-navigation-text">
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}

export default Navigation
