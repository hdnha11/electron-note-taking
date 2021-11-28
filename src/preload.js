const { contextBridge, ipcRenderer } = require('electron');
const debounce = require('lodash/debounce');
const { formatDate, mdToHtml } = require('./utils.js');

contextBridge.exposeInMainWorld('electron', {
  addNew: () => ipcRenderer.sendSync('add-new'),
  getNotes: () => ipcRenderer.sendSync('get-notes'),
  saveNote: debounce(
    (id, content) => ipcRenderer.sendSync('save-note', id, content),
    500
  ),
  deleteNote: (id, content) => ipcRenderer.sendSync('delete-note', id),
  showNoteContextMenu: (id) => ipcRenderer.send('show-note-context-menu', id),
  onNoteContextMenu: (handler) =>
    ipcRenderer.on('note-context-menu-command', handler),
  onNewNote: (handler) => ipcRenderer.on('new-note', handler),
});

contextBridge.exposeInMainWorld('utils', {
  formatDate,
  mdToHtml,
});
