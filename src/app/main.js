const { app } = require('electron');
const path = require('path');

const createServiceContainer = require('../core/service-container');
const createBrowserWindow = require('./browser-window');
const registerIpcRoutes = require('./ipc-routes');

let services;

function createMainWindow() {
  const win = createBrowserWindow({
    services: services,
    preloadPath: path.join(__dirname, 'preload.js')
  });

  win.loadFile(path.join(__dirname, '..', 'ui', 'management', 'index.html'));
  return win;
}

app.whenReady().then(function () {
  services = createServiceContainer({ app: app });
  registerIpcRoutes({ services: services });
  createMainWindow();

  app.on('activate', function () {
    if (require('electron').BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
