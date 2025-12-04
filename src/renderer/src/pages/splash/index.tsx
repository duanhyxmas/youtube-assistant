import { JSX, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import {
  setBrowserCookieFile,
  setDownloadPath,
  setBrowserName,
  setDownloadMaxProcessCount
} from '@renderer/store/settings'
import { AppInitializeResult } from '@common/types/base'

import { setFavorites } from '@renderer/store/favorites'
import { setDownloads } from '@renderer/store/downloads'

import LoadingDots from '@renderer/components/loading-dots'

import logo from '@renderer/images/icon.png'

import packageJson from '@common/../../package.json'

import './index.scss'

/**
 * splash page
 */
const Splash: React.FC = (): JSX.Element => {
  // navigate
  const navigate = useNavigate()

  // dispatch
  const dispatch = useDispatch()

  useEffect(() => {
    appInitialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  const appInitialize = (): void => {
    window.api.appInitialize().then((res: AppInitializeResult) => {
      dispatch(setDownloadPath(res.downloadPath))
      dispatch(setDownloadMaxProcessCount(res.downloadMaxProcessCount))
      dispatch(setBrowserCookieFile(res.browserCookieFile))
      dispatch(setBrowserName(res.browserName))
      dispatch(setFavorites(res.favorites))
      dispatch(setDownloads(res.downloads))

      navigate('/main')
    })
  }

  return (
    <div className="ya-splash-page">
      <div className="ya-splash-content">
        <img src={logo} alt="Logo" className="ya-splash-logo" />
        <h1 className="ya-splash-title">{packageJson.productName}</h1>
        <LoadingDots />
      </div>
    </div>
  )
}

export default Splash
