import { app, Tray, Menu } from 'electron'

import MainWindowHelper from '@main/helpers/main-window-helper'

import trayPng from '@resources/tray.png?asset'
import trayIco from '@resources/tray.ico?asset'
import trayEmptyIco from '@resources/tray.empty.ico?asset'
import packageJson from '../../../package.json'

/**
 * the tray helper
 */
export default class TrayHelper {
  // the tray
  private tray: Electron.Tray | null = null

  // timer to flash the tray image
  // on windows tray image will flash when the app has new message
  private timer: NodeJS.Timeout | null = null

  // timer count
  // when timerCount is odd number, the tray image is trayIco
  // when timerCount is even number, the tray image is trayEmptyIco
  private timerCount: number = 0

  // max timer count
  private readonly maxTimerCount: number = 100

  // min timer count
  private readonly minTimerCount: number = 1

  // singleton, the instance of class TrayHelper
  private static _instance: TrayHelper | null = null

  /**
   * get the instance of class TrayHelper
   *
   * @returns the instance of class TrayHelper
   */
  public static get instance(): TrayHelper {
    if (!TrayHelper._instance) {
      TrayHelper._instance = new TrayHelper()
    }
    return TrayHelper._instance
  }

  /**
   * set the message
   * on windows, the tray image will flash when the app has new message
   * on macos, the dock badge will show the message
   *
   * @param message
   */
  public setMessage(message: string): void {
    // if message is empty, clear the message
    if (!message) {
      this.clearMessage()
      return
    }

    // reset timer count
    this.timerCount = this.minTimerCount

    if (process.platform === 'win32') {
      // on window set timer to flash the tray image
      this.setTimer()
    } else {
      // on macos set dock badge message
      app.dock?.setBadge(message)
    }
  }

  /**
   * on windows, clear the timer to flash the tray image
   * on macos, clear the dock badge
   */
  public clearMessage(): void {
    if (process.platform === 'win32') {
      // on window clear timer to flash the tray image
      this.clearTimer()
    } else {
      // on macos set dock badge empty
      app.dock?.setBadge('')
    }
  }

  /**
   * on windows, when the app has messages, set timer to flash the tray image
   */
  private setTimer(): void {
    // clear timer first
    this.clearTimer()

    // set timer
    this.timer = setInterval(() => {
      // if timer count is max, reset it
      if (this.timerCount === this.maxTimerCount) {
        this.timerCount = 1
      } else {
        this.timerCount++
      }

      // if timer count is odd number, the tray image is trayIco
      // if timer count is even number, the tray image is trayEmptyIco
      const trayImage = this.timerCount % 2 === 0 ? trayEmptyIco : trayIco

      // set tray image
      this.setImage(trayImage)
    }, 500)
  }

  /**
   * on windows, when the app has no messages, clear timer to flash the tray image
   */
  private clearTimer(): void {
    // if timer is running, stop it
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    // set tray icon
    // because the tray icon will flash only on windows
    // so the tray image is ico
    this.setImage(trayIco)
  }

  /**
   * create the tray icon
   */
  public create(): void {
    // on windows、 the tray image ext is ico, on macos、 the tray image ext is png
    const image = process.platform === 'win32' ? trayIco : trayPng

    // new tray
    const tray: Tray = new Tray(image)

    // context menu
    const menus: Electron.Menu = Menu.buildFromTemplate([
      // show label
      {
        label: 'Show',
        click: () => {
          MainWindowHelper.instance.show()
        }
      },
      // hide label
      {
        label: 'Hide',
        click: () => {
          MainWindowHelper.instance.hide()
        }
      },
      // separator
      { type: 'separator' },
      // quit label
      {
        label: 'Quit',
        click: () => {
          app.quit()
        }
      }
    ])

    // set context menu
    tray.setContextMenu(menus)

    // double click to show the main window
    tray.on('double-click', () => {
      MainWindowHelper.instance.show()
    })

    // set class property tray
    this.tray = tray

    // set tooltip
    this.setToolTip(packageJson.productName)
  }

  /**
   * set the tray icon tooltip
   * on macos, the tray icon will show the tooltip
   *
   * @param tooltip the tray icon tooltip
   */
  private setToolTip(tooltip: string): void {
    this.tray?.setToolTip(tooltip)
  }

  /**
   * set the tray icon title
   * on macos, the tray icon will show the title
   *
   * @param title the tray icon title
   */
  public setTitle(title: string): void {
    this.tray?.setTitle(title)
  }

  /**
   * set the tray icon image
   * on windows, when app has message, the tray icon will flash
   * @param image the tray icon image
   */
  private setImage(image: string): void {
    this.tray?.setImage(image)
  }
}
