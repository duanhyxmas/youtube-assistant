import React, { JSX, useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Row,
  Col,
  Button,
  Input,
  List,
  Card,
  Space,
  Modal,
  Tooltip,
  Popconfirm,
  Spin,
  Empty
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, CopyOutlined } from '@ant-design/icons'

import { FavoriteEntity, FavoriteVideoEntity } from '@common/types/entity'
import { RootState } from '@renderer/store'
import { addFavorite, updateFavorite, deleteFavorite } from '@renderer/store/favorites'
import { useNotify } from '@renderer/hooks/useNotify'
import YoutubeVideoCard from '@renderer/components/video-card'
import './index.scss'

const Favorites: React.FC = (): JSX.Element => {
  const dispatch = useDispatch()

  const favorites: FavoriteEntity[] = useSelector((state: RootState) => state.favorites.favorites)

  const [selectedFavorite, setSelectedFavorite] = useState<FavoriteEntity | null>(null)

  const selectedFavoriteRef = useRef<FavoriteEntity | null>(null)

  const [videos, setVideos] = useState<FavoriteVideoEntity[]>([])

  const targetFavorite = useRef<FavoriteEntity | null>(null)

  const [loading, setLoading] = useState<boolean>(false)

  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'copy'>('create')
  const [modalName, setModalName] = useState<string>('')
  const notify = useNotify()

  useEffect(() => {
    window.api.onFavoriteVideosChanged((id: number) => {
      if (selectedFavoriteRef.current && id === selectedFavoriteRef.current.id) {
        loadVideos(selectedFavoriteRef.current)
      }
    })
  }, [])

  useEffect(() => {
    selectedFavoriteRef.current = selectedFavorite
    if (selectedFavorite !== null) {
      setVideos([])
      loadVideos(selectedFavorite)
    } else {
      setVideos([])
    }
  }, [selectedFavorite])

  // Initialize by splash, listen to redux favorites changes and set default selection
  useEffect(() => {
    if (selectedFavorite !== null || !favorites || favorites.length === 0) {
      return
    }
    setSelectedFavorite(favorites[0])
  }, [favorites, selectedFavorite])

  const loadVideos = async (favorite: FavoriteEntity): Promise<void> => {
    try {
      setLoading(true)
      const list = await window.api.getFavoriteVideosByFavoriteId(favorite.id!)
      setVideos(list || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // open create modal
  const openCreateModal = (): void => {
    targetFavorite.current = null
    setModalMode('create')
    setModalName('')
    setModalVisible(true)
  }

  // open edit modal
  const openEditModal = (favorite: FavoriteEntity): void => {
    targetFavorite.current = favorite
    setModalMode('edit')
    setModalName(favorite.name)
    setModalVisible(true)
  }

  // open copy modal
  const openCopyModal = (favorite: FavoriteEntity): void => {
    targetFavorite.current = favorite
    setModalMode('copy')
    setModalName(`${favorite.name} - Copy`)
    setModalVisible(true)
  }

  const handleModalOk = async (): Promise<void> => {
    if (!modalName.trim()) {
      notify.warning('Please enter folder name')
      return
    }
    if (modalMode === 'create') {
      let payload: FavoriteEntity | null = {
        name: modalName.trim()
      }
      payload = await window.api.addFavorite(payload)
      if (payload) {
        dispatch(addFavorite(payload))
        notify.success('Created successfully')
      } else {
        notify.error('Failed to create')
      }
    } else if (modalMode === 'edit') {
      if (!targetFavorite.current) {
        return
      }
      let payload: FavoriteEntity | null = {
        id: targetFavorite.current.id,
        name: modalName.trim()
      }
      payload = await window.api.updateFavorite(payload)
      if (payload) {
        dispatch(updateFavorite(payload))
        notify.success('Updated successfully')
      } else {
        notify.error('Failed to update')
      }
    } else {
      if (!targetFavorite.current) {
        return
      }
      let payload: FavoriteEntity | null = {
        name: modalName.trim()
      }
      payload = await window.api.copyFavorite(payload, targetFavorite.current)
      if (payload) {
        dispatch(addFavorite(payload))
        notify.success('Copied successfully')
      } else {
        notify.error('Failed to copy')
      }
    }
    setModalVisible(false)
  }

  const handleModalCancel = (): void => {
    setModalVisible(false)
  }

  const onDeleteFavorite = async (id: number): Promise<void> => {
    if (await window.api.deleteFavorite(id)) {
      dispatch(deleteFavorite(id))
      if (selectedFavorite && selectedFavorite.id === id) {
        setSelectedFavorite(null)
      }
      notify.success('delete favorite success')
    } else {
      notify.error('delete favorite failed')
    }
  }

  const onDeleteFavoriteVideo = async (id: number): Promise<void> => {
    if (await window.api.deleteFavoriteVideo(id)) {
      setVideos(videos.filter((v) => v.id !== id))
      notify.success('delete favorite video success')
    } else {
      notify.error('delete favorite video failed')
    }
  }

  return (
    <div className="ya-favorites-page">
      <Modal
        title={modalMode === 'create' ? 'Create Folder' : 'Edit Folder'}
        open={modalVisible}
        cancelText="Cancel"
        okText="Confirm"
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Input
          value={modalName}
          onChange={(e) => setModalName(e.target.value)}
          placeholder="Folder name"
        />
      </Modal>
      <Row gutter={16}>
        <Col span={7}>
          <Card
            title="Folders"
            size="small"
            className="left-card"
            extra={
              <Tooltip key={`tooltip-create`} title="Create folder">
                <Button
                  type="text"
                  shape="circle"
                  icon={<PlusOutlined />}
                  onClick={openCreateModal}
                />
              </Tooltip>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={favorites}
              renderItem={(item: FavoriteEntity) => (
                <List.Item
                  actions={[
                    <Tooltip key={`tooltip-edit-${item.id}`} title="Edit folder">
                      <Button
                        key={`edit-${item.id}`}
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(item)
                        }}
                      />
                    </Tooltip>,
                    <Tooltip key={`tooltip-copy-${item.id}`} title="Copy folder as new folder">
                      <Button
                        key={`copy-${item.id}`}
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          openCopyModal(item)
                        }}
                      />
                    </Tooltip>,
                    <Popconfirm
                      key={`pop-${item.id}`}
                      title="Confirm delete folder?"
                      onConfirm={() => onDeleteFavorite(item.id!)}
                      okText="Confirm"
                      cancelText="Cancel"
                    >
                      <Tooltip title="Delete folder">
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          danger
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          key={`del-${item.id}`}
                        />
                      </Tooltip>
                    </Popconfirm>
                  ]}
                  className={selectedFavorite && selectedFavorite.id === item.id ? 'selected' : ''}
                  onClick={() => {
                    console.log(item)
                    setSelectedFavorite(item)
                  }}
                >
                  <List.Item.Meta title={item.name} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={17}>
          <Card title="Favorites" size="small" className="right-card">
            {selectedFavorite === null ? (
              <div>Please select a folder on the left to view content</div>
            ) : loading ? (
              <div className="ya-home-loading height">
                <Spin size="large" tip="Loading..." />
              </div>
            ) : videos.length === 0 ? (
              <div className="ya-home-loading height">
                <Empty description="No data" />
              </div>
            ) : (
              <div className="favorite-videos-container">
                <Space wrap>
                  {videos.map((item) => {
                    return (
                      <YoutubeVideoCard
                        key={item.id}
                        video={item}
                        delFavorite={() => onDeleteFavoriteVideo(item.id!)}
                      />
                    )
                  })}
                </Space>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Favorites
