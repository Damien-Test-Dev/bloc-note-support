
(function () {

  var NOTES_KEY = 'notepad.notes.v1';
  var ACTIVE_KEY = 'notepad.active.v1';

  var tabsEl = document.getElementById('tabs');
  var noteEl = document.getElementById('note');
  var saveBtn = document.getElementById('saveBtn');
  var clearBtn = document.getElementById('clearBtn');

  function loadNotes() {
    var data = localStorage.getItem(NOTES_KEY);
    return data ? JSON.parse(data) : [];
  }

  function saveNotes(notes) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  function getActiveId() {
    return localStorage.getItem(ACTIVE_KEY);
  }

  function setActiveId(id) {
    localStorage.setItem(ACTIVE_KEY, id);
  }

  function renderTabs(notes, activeId) {
    tabsEl.innerHTML = '';

    notes.forEach(function (note) {
      var tab = document.createElement('div');
      tab.className = 'tab' + (note.id === activeId ? ' active' : '');
      tab.textContent = note.title || 'Note';

      tab.onclick = function () {
        setActiveId(note.id);
        render();
      };

      tabsEl.appendChild(tab);
    });
  }

  function render() {
    var notes = loadNotes();
    var activeId = getActiveId();

    if (!notes.length) {
      var id = Date.now().toString();
      notes.push({ id: id, title: 'Note 1', content: '' });
      saveNotes(notes);
      setActiveId(id);
      activeId = id;
    }

    var activeNote = notes.filter(function (n) {
      return n.id === activeId;
    })[0];

    renderTabs(notes, activeId);
    noteEl.value = activeNote ? activeNote.content : '';
  }

  saveBtn.onclick = function () {
    var notes = loadNotes();
    var activeId = getActiveId();

    var note = notes.filter(function (n) {
      return n.id === activeId;
    })[0];

    if (!note) {
      note = { id: Date.now().toString(), title: 'Note', content: '' };
      notes.push(note);
      setActiveId(note.id);
    }

    note.content = noteEl.value;
    note.title = noteEl.value.substring(0, 15) || 'Note';

    saveNotes(notes);
    render();
  };

  clearBtn.onclick = function () {
    noteEl.value = '';
  };

  render();

})();
