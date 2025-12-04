import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import Database from 'better-sqlite3'

import {
  ConfigEntity,
  DownloadEntity,
  FavoriteEntity,
  FavoriteVideoEntity
} from '@common/types/entity'
import { DownloadStatus } from '@common/enum'
import { SQLITE_DIRECTORY } from '@common/constants'
import Log from '@main/log'

/**
 * DatabaseHelper
 */
export default class DatabaseHelper {
  // the current version of database
  private readonly CURRENT_VERSION = 1

  // singleton instance of DatabaseHelper
  private static _instance: DatabaseHelper | null = null

  // the database connection
  private _db: Database.Database | null = null

  /**
   * constructor
   * check and create database directory
   * initialize database connection
   * migrate database
   */
  constructor() {
    try {
      const sqlitePath = join(app.getPath('userData'), SQLITE_DIRECTORY)
      if (!existsSync(sqlitePath)) {
        mkdirSync(sqlitePath)
      }
      if (!existsSync(sqlitePath)) {
        throw new Error('Failed to create database directory')
      }
      const dbFilePath = join(sqlitePath, 'ya.db')
      this._db = new Database(dbFilePath)
      this.migrate()
    } catch (e) {
      Log.error('Failed to initialize database', e)
      throw e
    }
  }

  /**
   * get instance of DatabaseHelper
   *
   * @returns instance of DatabaseHelper
   */
  public static get instance(): DatabaseHelper {
    if (!this._instance) {
      this._instance = new DatabaseHelper()
    }
    return this._instance
  }

  /**
   * get all configs
   *
   * @returns the config entities
   */
  public getConfigs(): ConfigEntity[] {
    try {
      const result = this._db!.prepare(`SELECT * FROM config`).all()
      return result as ConfigEntity[]
    } catch (e) {
      Log.error(`config get error: ${e}`)
      return []
    }
  }

  /**
   * get config by key
   *
   * @param key the key of config
   *
   * @returns the config entity
   */
  public getConfig(key: string): ConfigEntity | null {
    try {
      const result = this._db!.prepare(`SELECT * FROM config WHERE key = ? limit 1`).get(key)
      return result as ConfigEntity
    } catch (e) {
      Log.error(`config get error: ${e}`)
      return null
    }
  }

  /**
   * save config
   * if config exists, update it
   *
   * @param config the config entity
   *
   * @returns the config entity
   */
  public saveConfig(config: ConfigEntity): ConfigEntity | null {
    try {
      this._db!.prepare(
        `INSERT INTO config(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      ).run(config.key, config.value)
      return config
    } catch (e) {
      Log.error(`config save error: ${e}`)
      return null
    }
  }

  /**
   * get favorites
   *
   * @returns the favorite entities
   */
  public getFavorites(): FavoriteEntity[] {
    try {
      const result = this._db!.prepare(`SELECT * FROM favorite ORDER BY id DESC`).all()
      return result as FavoriteEntity[]
    } catch (e) {
      Log.error(`favorite list error: ${e}`)
      return []
    }
  }

  /**
   * add favorite
   *
   * @param favorite the favorite entity
   * @returns the favorite entity
   */
  public addFavorite(favorite: FavoriteEntity): FavoriteEntity | null {
    try {
      const result = this._db!.prepare(`INSERT INTO favorite(name) VALUES (?)`).run(favorite.name)
      favorite.id = result.lastInsertRowid as number
      return favorite
    } catch (e) {
      Log.error(`favorite add error: ${e}`)
      return null
    }
  }

  /**
   * update favorite
   *
   * @param favorite the favorite entity
   * @returns the favorite entity
   */
  public updateFavorite(favorite: FavoriteEntity): FavoriteEntity | null {
    try {
      this._db!.prepare(`UPDATE favorite SET name = ? WHERE id = ?`).run(favorite.name, favorite.id)
      return favorite
    } catch (e) {
      Log.error(`favorite update error: ${e}`)
      return null
    }
  }

  /**
   * copy favorite
   *
   * @param favorite the favorite entity
   * @param originFavorite the origin favorite entity
   * @returns the favorite entity
   */
  public copyFavorite(
    favorite: FavoriteEntity,
    originFavorite: FavoriteEntity
  ): FavoriteEntity | null {
    try {
      let videos: FavoriteVideoEntity[] = []
      if (originFavorite.id) {
        videos = this.getFavoriteVideosByFavoriteId(originFavorite.id)
      }
      if (videos.length === 0) {
        const result = this._db!.prepare(`INSERT INTO favorite(name) VALUES (?)`).run(favorite.name)
        favorite.id = result.lastInsertRowid as number
        return favorite
      }
      this._db!.transaction(() => {
        const result = this._db!.prepare(`INSERT INTO favorite(name) VALUES (?)`).run(favorite.name)
        favorite.id = result.lastInsertRowid as number
        videos.forEach((video) => {
          const favoriteVideo = {
            favoriteId: favorite.id!,
            videoId: video.videoId,
            videoName: video.videoName,
            videoUrl: video.videoUrl,
            videoThumbnail: video.videoThumbnail,
            videoChannelName: video.videoChannelName,
            videoPublishAt: video.videoPublishAt
          }
          this.saveFavoriteVideo(favoriteVideo)
        })
      }).call(this)
      return favorite
    } catch (e) {
      Log.error(`favorite copy error: ${e}`)
      return null
    }
  }

  /**
   * delete favorite
   *
   * @param favoriteId the id of favorite
   *
   * @returns true if delete success, false otherwise
   */
  public deleteFavorite(favoriteId: number): boolean {
    try {
      this._db!.transaction(() => {
        this._db!.prepare(`DELETE FROM favorite WHERE id = ?`).run(favoriteId)
        this._db!.prepare(`DELETE FROM favoriteVideo WHERE favoriteId = ?`).run(favoriteId)
      }).call(this)
      return true
    } catch (e) {
      Log.error(`favorite delete error: ${e}`)
      return false
    }
  }

  /**
   * get favorite videos by favorite id
   *
   * @param favoriteId the id of favorite
   *
   * @returns the favorite videos
   */
  public getFavoriteVideosByFavoriteId(favoriteId: number): FavoriteVideoEntity[] {
    try {
      const result = this._db!.prepare(
        `SELECT * FROM favoriteVideo WHERE favoriteId = ? ORDER BY id DESC`
      ).all(favoriteId)
      return result as FavoriteVideoEntity[]
    } catch (e) {
      Log.error(`favorite video list error: ${e}`)
      return []
    }
  }

  /**
   * add favorite video
   * if favorite video exists, replace it
   *
   * @param favoriteVideo the favorite video entity
   *
   * @returns the favorite video entity
   */
  public saveFavoriteVideo(favoriteVideo: FavoriteVideoEntity): FavoriteVideoEntity | null {
    try {
      const reuslt = this._db!.prepare(
        `REPLACE INTO favoriteVideo(favoriteId, videoId, videoName, videoUrl, videoThumbnail, videoChannelName, videoPublishAt) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        favoriteVideo.favoriteId,
        favoriteVideo.videoId,
        favoriteVideo.videoName,
        favoriteVideo.videoUrl,
        favoriteVideo.videoThumbnail,
        favoriteVideo.videoChannelName,
        favoriteVideo.videoPublishAt
      )
      favoriteVideo.id = reuslt.lastInsertRowid as number
      return favoriteVideo
    } catch (e) {
      Log.error(`favorite video add error: ${e}`)
      return null
    }
  }

  /**
   * delete favorite video
   *
   * @param favoriteVideoId the id of favorite video
   *
   * @returns true if delete success, false otherwise
   */
  public deleteFavoriteVideo(favoriteVideoId: number): boolean {
    try {
      this._db!.prepare(`DELETE FROM favoriteVideo WHERE id = ?`).run(favoriteVideoId)
      return true
    } catch (e) {
      Log.error(`favorite video delete error: ${e}`)
      return false
    }
  }

  /**
   * get downloads
   *
   * @returns the download entities
   */
  public getDownloads(): DownloadEntity[] {
    try {
      const result = this._db!.prepare(`SELECT * FROM download ORDER BY id DESC`).all()
      return result as DownloadEntity[]
    } catch (e) {
      Log.error(`download find error: ${e}`)
      return []
    }
  }

  /**
   * set download status to pending
   * if download status is downloading, change it to pending
   */
  public setDownloadPending(): void {
    try {
      this._db!.prepare(`UPDATE download SET status = ? WHERE status = ?`).run(
        DownloadStatus.PENDING,
        DownloadStatus.DOWNLOADING
      )
    } catch (e) {
      Log.error(`download set pending error: ${e}`)
    }
  }

  /**
   * add download
   * if download exists, replace it
   *
   * @param download the download entity
   *
   * @returns the download entity
   */
  public saveDownload(download: DownloadEntity): DownloadEntity | null {
    try {
      const result = this._db!.prepare(
        `REPLACE INTO download(videoId, videoName, videoUrl, videoThumbnail, videoChannelName, videoPublishAt, filePath, progressText, errorText, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        download.videoId,
        download.videoName,
        download.videoUrl,
        download.videoThumbnail,
        download.videoChannelName,
        download.videoPublishAt,
        download.filePath,
        download.progressText,
        download.errorText,
        download.status
      )
      download.id = result.lastInsertRowid as number
      return download
    } catch (e) {
      Log.error(`download add error: ${e}`)
      return null
    }
  }

  /**
   * update download process
   *
   * @param download the download entity
   *
   * @returns the download entity
   */
  public updateProcess(download: DownloadEntity): DownloadEntity | null {
    try {
      this._db!.prepare(
        `UPDATE download SET progressText = ?, status = ?, errorText = ? WHERE id = ?`
      ).run(download.progressText, download.status, download.errorText, download.id)
      return download
    } catch (e) {
      Log.error(`download update process error: ${e}`)
      return null
    }
  }

  /**
   * update download file path
   *
   * @param download the download entity
   *
   * @returns true if update success, false otherwise
   */
  public updateFilePath(download: DownloadEntity): boolean {
    try {
      this._db!.prepare(`UPDATE download SET filePath = ? WHERE id = ?`).run(
        download.filePath,
        download.id
      )
      return true
    } catch (e) {
      Log.error(`download update file path error: ${e}`)
      return false
    }
  }

  /**
   * delete download
   *
   * @param downloadId the id of download
   *
   * @returns true if delete success, false otherwise
   */
  public deleteDownload(downloadId: number): boolean {
    try {
      this._db!.prepare(`DELETE FROM download WHERE id = ?`).run(downloadId)
      return true
    } catch (e) {
      Log.error(`download delete error: ${e}`)
      return false
    }
  }

  /**
   * close database connection
   */
  public close(): void {
    this._db?.close()
  }

  /**
   * database migrate
   */
  private migrate(): void {
    // get current database version
    const version = this._db!.pragma('user_version', { simple: true }) as number
    // if current version is greater than or equal to the current version, return
    if (version >= this.CURRENT_VERSION) {
      return
    }
    // begin transaction to execute database migration
    this._db
      ?.transaction(() => {
        if (version < 1) {
          this.executeVersion1()
          this._db!.pragma(`user_version = 1`)
        }
      })
      .call(this)
  }

  /**
   * execute database migration to version 1
   */
  private executeVersion1(): void {
    // create config table
    this._db!.exec(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT NOT NULL PRIMARY KEY,
        value TEXT NOT NULL
      )
    `)

    // create favorite table
    this._db!.exec(`
      CREATE TABLE IF NOT EXISTS favorite (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `)

    // create favorite video table
    this._db!.exec(`
      CREATE TABLE IF NOT EXISTS favoriteVideo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        favoriteId INTEGER NOT NULL,
        videoId TEXT NOT NULL,
        videoName TEXT NOT NULL,
        videoUrl TEXT NOT NULL,
        videoChannelName TEXT NOT NULL,
        videoThumbnail TEXT NOT NULL,
        videoPublishAt TEXT NOT NULL
      )
    `)

    // create unique index for favorite video table
    this._db!.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idxFavoriteVideo ON favoriteVideo(favoriteId, videoId)
    `)

    // create download table
    this._db!.exec(`
      CREATE TABLE IF NOT EXISTS download (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        videoId TEXT NOT NULL,
        videoName TEXT NOT NULL,
        videoUrl TEXT NOT NULL,
        videoChannelName TEXT NOT NULL,
        videoThumbnail TEXT NOT NULL,
        videoPublishAt TEXT NOT NULL,
        filePath TEXT NOT NULL,
        progressText TEXT NOT NULL,
        errorText TEXT NOT NULL,
        status TEXT DEFAULT 'pending'
      )
    `)

    // create unique index for download table
    this._db!.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idxDownload ON download(videoId)
    `)
  }
}
