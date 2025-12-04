import { app } from 'electron'

import { electronApp, optimizer } from '@electron-toolkit/utils'
import MainWindowHelper from '@main/helpers/main-window-helper'
import ServerHelper from '@main/helpers/server-helper'
import IpcMainHelper from '@main/helpers/ipc-main-helper'
import DownloadHelper from '@main/helpers/download-helper'
import Log from '@main/log'

// get single instance lock
const gotTheLock = app.requestSingleInstanceLock()

// when app is not single instance, quit it
if (!gotTheLock) {
  app.quit()
} else {
  // when app is second instance, show main window
  app.on('second-instance', () => {
    MainWindowHelper.instance.show()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // setHeader()

  IpcMainHelper.instance()

  // create main window
  MainWindowHelper.instance.create()
})

// Default open or close DevTools by F12 in development
// and ignore CommandOrControl + R in production.
// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
app.on('browser-window-created', (_, window) => {
  optimizer.watchWindowShortcuts(window)
})

// on macos, when click dock icon and the app is closed, the app will create a new main window
app.on('activate', () => {
  if (MainWindowHelper.instance.mainWindow === null) {
    MainWindowHelper.instance.create()
  } else {
    MainWindowHelper.instance.show()
  }
})

// before quit, stop server
// and set isQuit to true to main window close not effect
app.on('before-quit', () => {
  Log.info('before-quit')
  ServerHelper.instance.stop()
  DownloadHelper.instance.close()
  MainWindowHelper.instance.setQuit()
})
