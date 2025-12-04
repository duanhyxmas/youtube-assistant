import Log from 'electron-log/main'

Log.initialize()

Log.transports.file.level = 'info'
Log.transports.console.level = 'info'

export default Log
