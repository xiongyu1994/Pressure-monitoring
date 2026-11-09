// electron-main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

// 引入你写好的 Node.js 读取传感器的代码
// ⚠️ 请确保你的读取代码文件叫 server.js (或者改成你实际的文件名)
// ⚠️ 记得在那份代码里，把 ws 监听的端口设为 8080
require('./server.js'); 

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true, // 隐藏顶部菜单栏，更像专业的客户端
  });

  // 判断是开发环境还是打包后的生产环境
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // 开发环境：加载 Vite 的本地服务
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools(); // 开发时可以打开控制台
  } else {
    // 生产环境（打包成 exe 后）：加载打包后的静态 HTML 文件
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});