'use strict'

const { app, BrowserWindow } = require('electron')
const { join } = require('path')
// const { joinSafe } = require('upath')
 
app.on('window-all-closed', app.quit)
app.on('ready', function() {
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    center: true,
    resizable: true,
    darkTheme: true,
    show: true,
    title: 'MIDI Sequencer',
    frame: false
  })

  mainWindow.loadURL(`file://${join(__dirname, 'html', 'index.html')}`)
  
})