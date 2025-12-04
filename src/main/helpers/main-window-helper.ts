import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'

import ServerHelper from '@main/helpers/server-helper'
import TrayHelper from '@main/helpers/tray-helper'
import packageJson from '@main/../../package.json'

import icon from '@resources/icon.png?asset'
import { is } from '@electron-toolkit/utils'

/**
 * the main window helper
 */
export default class MainWindowHelper {
  // the main window
  private _mainWindow: BrowserWindow | null = null

  // when isQuit is true, window quit
  // when isQuit is false, window hide
  private _isQuit: boolean = false

  // singleton, the instance of class MainWindowHelper
  private static _instance: MainWindowHelper | null = null

  /**
   * get the instance of class MainWindowHelper
   *
   * @returns MainWindowHelper
   */
  public static get instance(): MainWindowHelper {
    if (!MainWindowHelper._instance) {
      MainWindowHelper._instance = new MainWindowHelper()
    }
    return MainWindowHelper._instance
  }

  /**
   * get the main window
   *
   * @returns the main window
   */
  public get mainWindow(): BrowserWindow | null {
    return this._mainWindow
  }

  /**
   * create the main window
   */
  public create(): void {
    const httpUrl: string = ServerHelper.instance.httpUrl

    // if the http url is null, start server
    if (!httpUrl && !is.dev) {
      ServerHelper.instance.start()
      return
    }

    // create the main window
    const mainWindow = new BrowserWindow({
      title: packageJson.productName,
      width: 1400,
      height: 900,
      minWidth: 1400,
      minHeight: 900,
      show: false,
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        webSecurity: false, // Disable for YouTube HTML Player API
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    if (process.platform === 'darwin') {
      app.dock?.setIcon(icon)
    }

    // set main window
    this._mainWindow = mainWindow

    TrayHelper.instance.create()

    // listen event
    this._listenEvent(httpUrl)
  }

  /**
   * set quit
   */
  public setQuit(): void {
    this._isQuit = true
  }

  /**
   * show the main window
   */
  public show(): void {
    // if the window is null, return
    if (!this._mainWindow) {
      return
    }

    // if the window is minimized, restore it
    if (this._mainWindow.isMinimized()) {
      this._mainWindow.restore()
    }

    // show and focus window
    this._mainWindow.show()
    this._mainWindow.focus()
  }

  /**
   * hide the main window
   */
  public hide(): void {
    // if the window is null, return
    if (!this._mainWindow) {
      return
    }

    // hide window
    this._mainWindow.hide()
  }

  /**
   * send broadcast to main window
   *
   * @param event the event name
   * @param args the event args
   */
  public sendBroadcast(event: string, ...args: unknown[]): void {
    this._mainWindow?.webContents.send(event, ...args)
  }

  private _listenEvent(httpUrl: string): void {
    // HMR for renderer base on electron-vite cli.
    // when is development, load the remote URL
    // when is production, load the local server
    // youtube play video in iframe need to web server
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this._mainWindow!.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      this._mainWindow!.loadURL(httpUrl)
    }

    // listen ready to show event
    // when the main window is ready to show
    this._mainWindow!.on('ready-to-show', () => {
      this._mainWindow?.show()
    })

    // listen close event
    this._mainWindow!.on('close', (event) => {
      // when main window has value and is not quit, hide it
      if (this._mainWindow && !this._isQuit) {
        event.preventDefault()
        this._mainWindow.hide()
      }
    })

    // when open external url, open it in default browser
    this._mainWindow!.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })
  }
}
