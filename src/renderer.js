function getTitle(md) {
  const untitled = 'Untitled';
  const firstLine = md.trim().split('\n')[0];
  const headingPattern = /^# /;

  if (firstLine && headingPattern.test(firstLine)) {
    return firstLine.replace(headingPattern, '').trim() || untitled;
  }

  return untitled;
}

function findById(items, id) {
  return items.find((item) => item.id === id);
}

function objectSet(object, key, value) {
  const copy = { ...object };
  copy[key] = value;
  return copy;
}

function setContentById(items, id, content) {
  return items.map((item) => {
    if (item.id === id) {
      return objectSet(item, 'content', content);
    }
    return item;
  });
}

function getSortedNotes(notes) {
  const sortedNotes = [...notes];
  sortedNotes.sort((a, b) => b.createdAt - a.createdAt);
  return sortedNotes;
}

function NoteList({ el, notes, selectedNoteId, onSelect }) {
  this.$el = document.querySelector(el);

  if (!this.$el) return;

  const activeClass = 'note--active';

  this.notes = notes;
  this.selectedNoteId = selectedNoteId;

  this.renderNotes = () => {
    const template =
      this.notes.length > 0
        ? this.notes
            .map(
              (note) => `
          <li class="note ${
            this.selectedNoteId === note.id ? activeClass : ''
          }" data-id="${note.id}">
            <h3 class="note__title">${getTitle(note.content)}</h3>
            <p class="note__created-at">${window.utils.formatDate(
              note.createdAt
            )}</p>
          </li>`
            )
            .join('')
        : '<li class="note note--empty">No notes available!</li>';
    this.$el.innerHTML = template;
  };

  this.handleNoteClick = (event) => {
    const { target } = event;
    const $note = target.closest('li');

    if (
      $note &&
      $note.classList.contains('note') &&
      typeof $note.dataset.id !== 'undefined'
    ) {
      const id = $note.dataset.id;
      if (onSelect) {
        onSelect(id);
      }
    }
  };

  this.render = ({ notes, selectedNoteId } = {}) => {
    if (notes) {
      this.notes = notes;
    }
    if (selectedNoteId) {
      this.selectedNoteId = selectedNoteId;
    }
    this.renderNotes();
    this.$el.removeEventListener('click', this.handleNoteClick);
    this.$el.addEventListener('click', this.handleNoteClick);
  };
}

function App({ notes }) {
  this.notes = getSortedNotes(notes);
  const firstNote = this.notes[0];
  this.selectedNoteId = firstNote?.id;
  this.$addButton = document.getElementById('add-new');
  this.$editor = document.getElementById('editor');
  this.$preview = document.getElementById('preview');
  this.$previewButton = document.getElementById('preview-button');
  this.$editButton = document.getElementById('edit-button');

  this.editor = CodeMirror(this.$editor, {
    value: firstNote?.content ?? '',
    mode: 'markdown',
    theme: 'duotone-light',
    lineWrapping: true,
  });

  this.editor.on('change', () => {
    if (this.selectedNoteId) {
      const newContent = this.editor.getValue();
      this.notes = setContentById(this.notes, this.selectedNoteId, newContent);
      this.rerenderNoteList();
      this.updatePreview(newContent);
      window.electron.saveNote(this.selectedNoteId, newContent);
    }
  });

  this.updatePreview = (md) => {
    this.$preview.innerHTML = window.utils.mdToHtml(md);
  };

  this.handleNoteSelect = (id) => {
    this.editMode();
    this.selectedNoteId = id;
    this.rerenderNoteList();
    this.resetEditorContent(findById(this.notes, this.selectedNoteId)?.content);
  };

  this.resetEditorContent = (content) => {
    this.editor.setValue(content);
    this.editor.clearHistory();
  };

  this.rerenderNoteList = () => {
    this.noteList.render({
      notes: this.notes,
      selectedNoteId: this.selectedNoteId,
    });
  };

  this.previewMode = () => {
    this.$preview.classList.remove('hidden');
    this.$previewButton.classList.add('hidden');
    this.$editor.classList.add('hidden');
    this.$editButton.classList.remove('hidden');
  };

  this.editMode = () => {
    this.$editor.classList.remove('hidden');
    this.$editButton.classList.add('hidden');
    this.$preview.classList.add('hidden');
    this.$previewButton.classList.remove('hidden');
  };

  this.deleteNote = (id) => {
    const itemIndex = this.notes.findIndex((note) => note.id === id);
    if (itemIndex < 0) return;
    this.notes = [
      ...this.notes.slice(0, itemIndex),
      ...this.notes.slice(itemIndex + 1),
    ];
    if (this.selectedNoteId === id) {
      // Move to next note if current selected note will be removed
      this.selectedNoteId = this.notes[itemIndex]?.id;
    }
    this.handleNoteSelect(this.selectedNoteId);
    window.electron.deleteNote(id);
  };

  this.addNew = () => {
    const newNote = window.electron.addNew();
    if (newNote) {
      this.notes = [newNote, ...this.notes];
      this.selectedNoteId = newNote.id;
      this.rerenderNoteList();
      this.resetEditorContent(newNote.content);
    }
  };

  this.noteList = new NoteList({
    el: '#notes',
    notes: this.notes,
    selectedNoteId: this.selectedNoteId,
    onSelect: this.handleNoteSelect,
  });

  this.$addButton.addEventListener('click', this.addNew);

  this.$previewButton.addEventListener('click', this.previewMode);

  this.$editButton.addEventListener('click', this.editMode);

  // Setup context menu
  window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    const $note = event.target.closest('li');
    if ($note && $note.classList.contains('note')) {
      window.electron.showNoteContextMenu($note.dataset.id);
    }
  });

  window.electron.onNoteContextMenu((event, command, id) => {
    if (command === 'delete-note') {
      this.deleteNote(id);
    }
  });

  window.electron.onNewNote(this.addNew);

  this.noteList.render();
  this.updatePreview(firstNote?.content);
}

window.addEventListener('DOMContentLoaded', () => {
  const initialNotes = window.electron.getNotes();
  new App({ notes: initialNotes });
});
