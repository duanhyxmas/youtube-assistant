import { app } from 'electron'
import { readFile } from 'fs/promises'
import { createServer, Server } from 'http'
import { AddressInfo } from 'net'
import { lookup } from 'mime-types'
import { join } from 'path'

import Log from '@main/log'
import MainWindowHelper from '@main/helpers/main-window-helper'
import { is } from '@electron-toolkit/utils'

/**
 * the server helper
 */
export default class ServerHelper {
  // the web root path
  private readonly WEB_ROOT_PATH = 'out/renderer'

  // the http host
  private readonly HTTP_HOST = '127.0.0.1'

  // the http port
  private _port: number = 0

  // the web server
  private _server: Server | null = null

  // singleton, the instance of the ServerHelper
  private static _instance: ServerHelper | null = null

  /**
   * get the instance of the ServerHelper
   *
   * @returns the instance of the ServerHelper
   */
  public static get instance(): ServerHelper {
    if (!ServerHelper._instance) {
      ServerHelper._instance = new ServerHelper()
    }
    return ServerHelper._instance
  }

  /**
   * get the http url
   *
   * @returns the http url
   */
  public get httpUrl(): string {
    if (!this._port) {
      return ''
    }
    return `http://${this.HTTP_HOST}:${this._port}`
  }

  public start(): void {
    // if server exists
    if (this._server) {
      return
    }

    // create server
    this._server = createServer(async (req, res) => {
      let requestUrl = req.url

      // default file and path
      if (requestUrl === '/' || requestUrl === '') {
        requestUrl = '/index.html'
      }

      // remove query parameters
      const urlPath = requestUrl?.split('?')[0]

      // build local file path
      const filePath = join(
        is.dev ? join(__dirname, '..', '..') : app.getAppPath(),
        this.WEB_ROOT_PATH,
        urlPath!
      )
      try {
        // read file content
        const data = await readFile(filePath)

        // get mime type
        const mimeType = lookup(urlPath!) || 'application/octet-stream'

        // send response
        res.writeHead(200, { 'Content-Type': mimeType })

        // send file content
        res.end(data)
      } catch (e) {
        Log.error('Error reading file:', e)

        // send 404
        res.writeHead(404, { 'Content-Type': 'text/plain' })

        // send 404 message
        res.end('404 Not Found')
      }
    })

    // listen random available port
    this._server.listen(0, this.HTTP_HOST, () => {
      const address: AddressInfo = this._server!.address() as AddressInfo
      this._port = address.port
      Log.info(`Server started at http://${this.HTTP_HOST}:${this._port}`)
      MainWindowHelper.instance.create()
    })

    // error handler
    this._server.on('error', (e: Error) => {
      Log.error('Error starting server:', e)
      this.stop()
      app.quit()
    })
  }

  // stop server
  public stop(): void {
    // if server exists close
    if (this._server) {
      this._server.close()
      this._server = null
    }

    // set port to 0
    this._port = 0
  }
}
