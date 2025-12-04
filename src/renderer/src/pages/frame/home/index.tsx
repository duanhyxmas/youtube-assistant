import React, { useRef, useState } from 'react'
import { Space, Spin, Empty, Drawer, Select, Button } from 'antd'
import { useSelector } from 'react-redux'
import { RootState } from '@renderer/store'
import YoutubeVideoCard from '@renderer/components/video-card'
import SearchComponent from '@renderer/components/search'
import './index.scss'
import { YoutubeSearchResult } from '@common/types/google'
import { youtubeVideoLoadmore, youtubeVideoSearch } from '@renderer/utils/request'
import { YT } from 'youtubei.js'
import { useNotify } from '@renderer/hooks/useNotify'
import { FavoriteEntity, FavoriteVideoEntity } from '@common/types/entity'
import Log from '@renderer/utils/log'

const Home: React.FC = () => {
  const [keywords, setKeywords] = useState<string>('')

  const [loading, setLoading] = useState<boolean>(false)

  const [values, setValues] = useState<FavoriteVideoEntity[]>([])

  const [continuation, setContinuation] = useState<YT.Search | null>(null)

  const [isLoad, setIsLoad] = useState<boolean>(false)

  const notify = useNotify()

  const favorites = useSelector((state: RootState) => state.favorites.favorites)

  const [favoriteId, setFavoriteId] = useState<number | null>(null)

  const favoriteVideo = useRef<FavoriteVideoEntity | null>(null)

  const [drawerVisiable, setDrawerVisible] = useState<boolean>(false)

  // search
  const handleSearch = async (): Promise<void> => {
    setValues([])
    setContinuation(null)
    if (!keywords.trim()) {
      return
    }
    setIsLoad(true)
    try {
      setLoading(true)
      const youtubeSearchResult: YoutubeSearchResult = await youtubeVideoSearch(keywords)
      const { videos, continuation } = youtubeSearchResult
      setValues(videos)
      setContinuation(continuation || null)
    } catch (e: unknown) {
      Log.error(`search error:`, e)
    } finally {
      setLoading(false)
    }
  }

  // load more
  const loadMore = async (): Promise<void> => {
    if (!continuation) return
    try {
      setLoading(true)
      const youtubeSearchResult: YoutubeSearchResult = await youtubeVideoLoadmore(continuation)
      const { videos, continuation: newContinuation } = youtubeSearchResult
      setValues([...values, ...videos])
      setContinuation(newContinuation || null)
    } catch (e: unknown) {
      Log.error('load more error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickFavorite = async (video: FavoriteVideoEntity): Promise<void> => {
    if (favorites.length === 0) {
      notify.error('Please create a folder first')
      return
    }
    try {
      const favorite = favorites[0]

      addFavorite(favorite, video)
    } catch (e) {
      console.error(e)
    }
  }

  const openFavoriteDrawer = async (video: FavoriteVideoEntity): Promise<void> => {
    // use favorites from redux
    if (favorites.length === 0) {
      notify.error('Please create a folder first')
      return
    }
    favoriteVideo.current = video
    if (!favoriteId || favorites.findIndex((item) => item.id === favoriteId) === -1) {
      setFavoriteId(favorites[0].id!)
    }
    setDrawerVisible(true)
  }

  const handleAddToFavorite = async (): Promise<void> => {
    if (favorites.length === 0) {
      notify.error('Please create a folder first')
      return
    }
    const favorite = favorites.find((item) => item.id === favoriteId)

    if (!favorite) {
      notify.error('Please select a folder')
      return
    }

    try {
      addFavorite(favorite, favoriteVideo.current!)
      setDrawerVisible(false)
    } catch (e) {
      console.error(e)
    }
  }

  const addFavorite = async (
    favorite: FavoriteEntity,
    video: FavoriteVideoEntity
  ): Promise<void> => {
    try {
      const payload: FavoriteVideoEntity = JSON.parse(JSON.stringify(video))
      payload.favoriteId = favorite.id
      await window.api.saveFavoriteVideo(payload)
      notify.success('Added to favorites successfully')
    } catch (e) {
      console.error(e)
      notify.error('Failed to add to favorites')
      throw e
    }
  }

  return (
    <div className="ya-home-page">
      <SearchComponent
        keywords={keywords}
        loading={loading}
        setKeywords={setKeywords}
        handleSearch={handleSearch}
      />

      {/* Search results area */}
      <div className="ya-home-results">
        {!isLoad && (
          <div className="ya-home-prompt ya-home-loading height">Enter keywords to search</div>
        )}

        {values.length === 0 && !loading && isLoad && (
          <div className="ya-home-loading height">
            <Empty description="no data" />
          </div>
        )}

        {values.length > 0 && (
          <Space wrap>
            {values.map((item) => (
              <YoutubeVideoCard
                key={item.videoId}
                video={item}
                quickFavorite={() => handleQuickFavorite(item)}
                addFavorite={() => openFavoriteDrawer(item)}
              />
            ))}
          </Space>
        )}
        {loading && (
          <div className={values.length > 0 ? 'ya-home-loading' : 'ya-home-loading height'}>
            <Spin size="large" tip="Loading..." />
          </div>
        )}
        {continuation && !loading && (
          <div className="load-more-container">
            <button className="load-more-button" onClick={loadMore}>
              Load More
            </button>
          </div>
        )}
      </div>
      <Drawer
        title="Add to Favorites"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisiable}
        width={360}
      >
        <p>Please select a folder to add to:</p>
        <Select
          style={{ width: '100%' }}
          value={favoriteId}
          onChange={(v: number) => setFavoriteId(v)}
        >
          {favorites.map((item: FavoriteEntity) => (
            <Select.Option value={item.id} key={item.id}>
              {item.name}
            </Select.Option>
          ))}
        </Select>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button style={{ marginRight: 8 }} onClick={() => setDrawerVisible(false)}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleAddToFavorite}>
            Add
          </Button>
        </div>
      </Drawer>
    </div>
  )
}

export default Home
