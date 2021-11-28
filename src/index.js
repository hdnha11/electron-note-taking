const { app, ipcMain, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const mainMenu = require('./main-menu');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  const mainWindow = createWindow();
  Menu.setApplicationMenu(mainMenu(mainWindow));
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const noteNamePattern = /note-(.*).md/;
const dataFolder = path.join(app.getPath('home'), 'SimpleNote');

function isFile(filePath) {
  return fs.lstatSync(filePath).isFile();
}

function isNoteFile(filePath) {
  return noteNamePattern.test(filePath);
}

function getNotes() {
  try {
    if (!fs.existsSync(dataFolder)) {
      fs.mkdirSync(dataFolder, { recursive: true });
    }

    const noteFiles = fs
      .readdirSync(dataFolder)
      .map((fileName) => {
        return path.join(dataFolder, fileName);
      })
      .filter(isFile)
      .filter(isNoteFile)
      .map((filePath) => {
        const timestamp = Number(filePath.match(noteNamePattern)?.[1]);
        const createdAt = new Date(timestamp);

        return {
          id: filePath,
          content: fs.readFileSync(filePath, 'utf8'),
          createdAt,
        };
      });

    return noteFiles;
  } catch (error) {
    console.error(`Cannot get notes from ${dataFolder}`, error);
  }
}

function saveNote(filePath, content) {
  try {
    fs.writeFileSync(filePath, content);
  } catch (error) {
    console.error(`Cannot save file to ${filePath}`, error);
    return false;
  }

  return true;
}

function addNewNote() {
  const createdAt = Date.now();
  const filePath = path.join(dataFolder, `note-${createdAt}.md`);

  return {
    id: filePath,
    content: '',
    createdAt: new Date(createdAt),
  };
}

function deleteNote(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error(`Cannot delete file ${filePath}`, error);
    return false;
  }

  return true;
}

ipcMain.on('add-new', (event) => {
  event.returnValue = addNewNote();
});

ipcMain.on('get-notes', (event) => {
  event.returnValue = getNotes();
});

ipcMain.on('save-note', (event, id, content) => {
  event.returnValue = saveNote(id, content);
});

ipcMain.on('delete-note', (event, id) => {
  event.returnValue = deleteNote(id);
});

ipcMain.on('show-note-context-menu', (event, noteId) => {
  const template = [
    {
      label: 'Delete this note',
      click: () => {
        event.sender.send('note-context-menu-command', 'delete-note', noteId);
      },
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});
