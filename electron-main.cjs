const { app, BrowserWindow } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

let mainWindow;
let localServer;
let serverPort;

// Self-contained static file server with HTML5 History SPA routing fallback
function startLocalServer() {
  const distDir = path.join(__dirname, 'dist');
  
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
  };

  const server = http.createServer((req, res) => {
    // Strip query parameters
    const cleanUrl = req.url.split('?')[0];
    let filePath = path.join(distDir, cleanUrl);

    // Fallback to index.html for SPA (HTML5 routing support)
    const exists = fs.existsSync(filePath);
    const isDir = exists && fs.statSync(filePath).isDirectory();
    
    if (!exists || isDir || cleanUrl === '/') {
      filePath = path.join(distDir, 'index.html');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      } else {
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*' // Enable cross-origin for local testing
        });
        res.end(content, 'utf-8');
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`[LocalServer] Listening on http://127.0.0.1:${port}`);
      resolve({ server, port });
    });
  });
}

async function createWindow() {
  // Start static file server
  const serverConfig = await startLocalServer();
  localServer = serverConfig.server;
  serverPort = serverConfig.port;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: 'PayStore POS',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Load the locally served URL
  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (localServer) {
    localServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
