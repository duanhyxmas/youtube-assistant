import path from 'path'
import { exec } from 'child_process'
import { app } from 'electron'
import { existsSync } from 'fs'
import YTDlpWrap, { YTDlpEventEmitter, Progress } from 'yt-dlp-wrap'
import { DownloadEntity } from '@common/types/entity'
import Log from '@main/log'
import DatabaseHelper from './database-helper'
import MainWindowHelper from './main-window-helper'
import { DEFAULT_DOWNLOAD_MAX_PROCESS, DEFAULT_DOWNLOAD_MIN_PROCESS } from '@common/constants'
import { DOWNLOAD_CHANGED } from '@common/constants/ipc-events'
import { DownloadStatus } from '@common/enum'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const YTDlp = require('yt-dlp-wrap').default

/**
 * download helper
 */
export default class DownloadHelper {
  // downloads
  private _downloads: DownloadEntity[] = []

  // download processes
  private _downloadProcesses: Map<number, YTDlpEventEmitter> = new Map<number, YTDlpEventEmitter>()

  // max process count
  private _maxProcessCount: number = 3

  // yt-dlp wrap
  private _ytDlpWrap: YTDlpWrap | null = null

  // browser cookie file
  private _browserCookieFile: string | null = null

  // browser name
  private _browserName: string | null = null

  // download path
  private _downloadPath: string | null = null

  // lock, when process is starting, lock it
  private _lock: boolean = false

  // singleton, instance of DownloadHelper
  public static _instance: DownloadHelper | null = null

  constructor() {
    try {
      const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
      let binaryPath: string

      if (app.isPackaged) {
        binaryPath = path.join(process.resourcesPath, 'bin', binaryName)
      } else {
        binaryPath = path.join(process.cwd(), 'resources', 'bin', binaryName)
      }

      this._ytDlpWrap = new YTDlp(binaryPath)

      // Ensure executable permission on non-Windows
      if (process.platform !== 'win32') {
        try {
          // fs.chmodSync(binaryPath, '755')
        } catch (e) {
          Log.error('Failed to chmod yt-dlp', e)
        }
      }
    } catch (e) {
      Log.error('init class Youtube Video Downloader fail', e)

      throw e
    }
  }

  /**
   * get instance of DownloadHelper
   */
  public static get instance(): DownloadHelper {
    if (!this._instance) {
      this._instance = new DownloadHelper()
    }
    return this._instance
  }

  /**
   * start download process
   */
  private _startDownloadProcess(): void {
    if (this._lock) {
      return
    }
    // lock
    this._lock = true

    // if download queue is empty, unlock and return
    if (this._downloads.length === 0) {
      this._lock = false
      return
    }

    // if download process count is greater than max process count, unlock and return
    if (this._downloadProcesses.size >= this._maxProcessCount) {
      this._lock = false
      return
    }

    // get download form queue top
    const download = this._downloads.shift()

    // if download is null, unlock and return
    if (!download) {
      this._lock = false
      return
    }
    Log.info(`start download video, videoId: ${download.videoId}, videoName: ${download.videoName}`)

    try {
      const outputFileTemplate = path.join(this._downloadPath!, '%(id)s.%(ext)s')
      const downloadFormat = 'best'
      const args = [
        download.videoUrl,
        '-f',
        downloadFormat,
        '-o',
        outputFileTemplate,
        '--no-warnings',
        '--extractor-args',
        'youtube:player_client=default'
      ]

      // if browser cookie file is not null, add it to args
      if (this._browserCookieFile) {
        args.push('--cookies', this._browserCookieFile)
      }

      // if browser name is not null, add it to args
      if (this._browserName) {
        args.push('--cookies-from-browser', this._browserName)
      }

      // 在 Windows 上添加模块参数
      // if (os.platform() === 'win32') {
      //   args = ['-m', 'yt_dlp', ...args]
      // }

      let progressNumber = 0

      let isStart = false

      const process: YTDlpEventEmitter = this._ytDlpWrap!.exec(args)

      process.on('ytDlpEvent', (eventType: string, eventData: string) => {
        if (eventType === 'download' && eventData.trim().startsWith('Destination:')) {
          const filepath = eventData.trim().substring('Destination:'.length).trim()
          if (filepath) {
            download.filePath = filepath
            if (DatabaseHelper.instance.updateFilePath(download)) {
              MainWindowHelper.instance.sendBroadcast(DOWNLOAD_CHANGED, download)
            }
          }
        }
      })

      // progress event
      // if progress percent is greater than progressNumber, update progressNumber and download progress
      process.on('progress', (progress: Progress) => {
        if (
          progressNumber > Number(progress.percent) ||
          (progressNumber === 0 && Number(progress.percent) === 100)
        ) {
          return
        }
        // if download is not start, log download start
        if (!isStart) {
          Log.info(
            `video downloading, videoId: ${download.videoId}, videoName: ${download.videoName}`
          )
          isStart = true
        }
        // update progress
        progressNumber = Number(progress.percent)
        download.errorText = ''
        download.status = DownloadStatus.DOWNLOADING
        download.progressText = progressNumber + ''

        // update database and send broadcast
        if (DatabaseHelper.instance.updateProcess(download)) {
          MainWindowHelper.instance.sendBroadcast(DOWNLOAD_CHANGED, download)
        }
      })

      // close event
      process.on('close', () => {
        if (!download || !existsSync(path.join(download.filePath))) {
          Log.error(
            `video download close, videoId: ${download.videoId}, videoName: ${download.videoName}`
          )
        } else {
          Log.info(
            `video download completed, videoId: ${download.videoId}, videoName: ${download.videoName}`
          )
          download.progressText = '100'
          download.status = DownloadStatus.COMPLETED
          download.errorText = ''

          // update database and send broadcast
          if (DatabaseHelper.instance.updateProcess(download)) {
            MainWindowHelper.instance.sendBroadcast(DOWNLOAD_CHANGED, download)
          }
        }
        this._killDownloadProcess(download.id!).then(() => {
          this._startDownloadProcess()
        })
      })

      // error event
      process.on('error', (e: Error) => {
        Log.error(
          `video download error, videoId: ${download.videoId}, videoName: ${download.videoName}, error: `,
          e
        )

        download.status = DownloadStatus.FAILED
        download.errorText = e.message
        if (DatabaseHelper.instance.updateProcess(download)) {
          MainWindowHelper.instance.sendBroadcast(DOWNLOAD_CHANGED, download)
        }
      })

      // add process to download processes
      this._downloadProcesses.set(download.id!, process)
    } catch (e) {
      Log.error('start download process error', e)
      download.status = DownloadStatus.FAILED
      download.errorText = 'start download process error'
      if (DatabaseHelper.instance.updateProcess(download)) {
        MainWindowHelper.instance.sendBroadcast(DOWNLOAD_CHANGED, download)
      }
    } finally {
      this._lock = false
      this._startDownloadProcess()
    }
  }

  /**
   * kill download process
   *
   * @param id download id
   *
   * @return true if kill success and process not exist, false if kill failed and process exist
   */
  private async _killDownloadProcess(id: number): Promise<boolean> {
    Log.info(`kill process, download id: ${id}`)

    const downloadProcess = this._downloadProcesses.get(id)
    if (!downloadProcess || !downloadProcess.ytDlpProcess) {
      return true
    }

    // Remove all listeners to prevent side effects (like error reporting) when killing
    if (downloadProcess.removeAllListeners) {
      downloadProcess.removeAllListeners()
      downloadProcess.on('error', () => {})
    }

    try {
      // kill yt-dlp process
      if (process.platform === 'win32') {
        await new Promise<void>((resolve) => {
          if (downloadProcess.ytDlpProcess) {
            exec(`taskkill /pid ${downloadProcess.ytDlpProcess.pid} /T /F`, () => {
              resolve()
            })
          } else {
            resolve()
          }
        })
      } else {
        downloadProcess.ytDlpProcess.kill()
      }

      // delete process
      this._downloadProcesses.delete(id)

      return true
    } catch (error) {
      Log.error(`kill process error, id: ${id}`, error)
      return false
    }
  }

  /**
   * add downloads
   * and start download process
   *
   * @param downloads
   */
  public addDownloads(...downloads: DownloadEntity[]): void {
    // push downloads
    this._downloads.push(...downloads)

    // start download process
    this._startDownloadProcess()
  }

  /**
   * delete download
   * and kill download process
   *
   * @param id download id
   */
  public async deleteDownload(id: number): Promise<void> {
    // delete download
    this._downloads = this._downloads.filter((item) => item.id !== id)

    // kill download process
    await this._killDownloadProcess(id)

    // start download process
    this._startDownloadProcess()
  }

  /**
   * set browser cookie file
   *
   * @param browserCookieFile browser cookie file path
   */
  public setBrowserCookieFile(browserCookieFile: string): void {
    this._browserCookieFile = browserCookieFile
  }

  /**
   * set browser name
   *
   * @param browserName browser name
   */
  public setBrowserName(browserName: string): void {
    this._browserName = browserName
  }

  /**
   * set max process count
   *
   * @param maxProcessCount max process count
   */
  public setMaxProcessCount(maxProcessCount: number): void {
    if (maxProcessCount < DEFAULT_DOWNLOAD_MIN_PROCESS) {
      this._maxProcessCount = DEFAULT_DOWNLOAD_MIN_PROCESS
    } else if (maxProcessCount > DEFAULT_DOWNLOAD_MAX_PROCESS) {
      this._maxProcessCount = DEFAULT_DOWNLOAD_MAX_PROCESS
    } else {
      this._maxProcessCount = maxProcessCount
    }
    if (this._maxProcessCount < this._downloadProcesses.size) {
      this._startDownloadProcess()
    }
  }

  /**
   * set download path
   *
   * @param downloadPath download path
   */
  public setDownloadPath(downloadPath: string): void {
    this._downloadPath = downloadPath
  }

  /**
   * close
   * and kill all download processes
   * and clear all downloads
   */
  public close(): void {
    // kill all download processes
    this._downloadProcesses.forEach((_, index) => {
      this._killDownloadProcess(index)
    })

    // clear all downloads
    this._downloads = []
  }
}
