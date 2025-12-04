import { HomeOutlined, HeartOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons'

import Downloads from '@renderer/pages/frame/downloads'
import Favorites from '@renderer/pages/frame/favorites'
import Home from '@renderer/pages/frame/home'
import Settings from '@renderer/pages/frame/settings'

import { FramePage } from '@common/types/base'

const framePages: FramePage[] = [
  {
    title: 'Home',
    name: 'home',
    page: Home,
    icon: HomeOutlined
  },
  {
    title: 'Favorites',
    name: 'favorites',
    page: Favorites,
    icon: HeartOutlined
  },
  {
    title: 'Downloads',
    name: 'downloads',
    page: Downloads,
    icon: DownloadOutlined
  },
  {
    title: 'Settings',
    name: 'settings',
    page: Settings,
    icon: SettingOutlined
  }
]

export default framePages
