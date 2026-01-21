(function () {
  var NOTES_KEY = 'notepad.notes.v1';
  var ACTIVE_KEY = 'notepad.active.v1';

  var tabsEl = document.getElementById('tabs');
  var noteEl = document.getElementById('note');
  var saveBtn = document.getElementById('saveBtn');
  var clearBtn = document.getElementById('clearBtn');

  function loadNotes() {
    try {
      var raw = localStorage.getItem(NOTES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveNotes(notes) {
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch (e) {}
  }

  function getActiveId() {
    try { return localStorage.getItem(ACTIVE_KEY) || ''; } catch (e) { return ''; }
  }

  function setActiveId(id) {
    try { localStorage.setItem(ACTIVE_KEY, id || ''); } catch (e) {}
  }

  function firstLineTitle(text) {
    var t = (text || '').split(/\r?\n/)[0] || 'Note';
    if (t.length > 20) t = t.slice(0, 20);
    return t;
  }

  function findNote(notes, id) {
    var i;
    for (i = 0; i < notes.length; i++) {
      if (notes[i].id === id) return notes[i];
    }
    return null;
  }

  function removeNote(notes, id) {
    var i;
    for (i = 0; i < notes.length; i++) {
      if (notes[i].id === id) { notes.splice(i, 1); return true; }
    }
    return false;
  }

  function renderTabs(notes, activeId) {
    tabsEl.innerHTML = '';
    var i, n, tab;

    for (i = 0; i < notes.length; i++) {
      n = notes[i];
      tab = document.createElement('div');
      tab.className = 'tab' + (n.id === activeId ? ' active' : '');
      tab.textContent = n.title || 'Note';

      tab.onclick = (function (id) {
        return function () {
          setActiveId(id);
          render();
          noteEl.focus();
        };
      })(n.id);

      tabsEl.appendChild(tab);
    }
  }

  function render() {
    var notes = loadNotes();
    var activeId = getActiveId();
    var current = activeId ? findNote(notes, activeId) : null;

    if (activeId && !current) {
      setActiveId('');
      activeId = '';
    }

    renderTabs(notes, activeId);
    noteEl.value = current ? current.content : '';
  }

  // Sauvegarder :
  // - si un onglet est actif -> update
  // - sinon -> crée un nouvel onglet
  saveBtn.onclick = function () {
    var notes = loadNotes();
    var activeId = getActiveId();
    var content = noteEl.value || '';
    var title = firstLineTitle(content);

    if (activeId) {
      var existing = findNote(notes, activeId);
      if (existing) {
        existing.content = content;
        existing.title = title;
        saveNotes(notes);
        render();
        noteEl.focus();
        return;
      } else {
        setActiveId('');
      }
    }

    var id = String(new Date().getTime());
    notes.push({ id: id, title: title, content: content });
    saveNotes(notes);
    setActiveId(id);
    render();
    noteEl.focus();
  };

  // Effacer :
  // - si onglet actif -> supprime l’onglet + vide la zone
  // - sinon -> vide juste la zone
  clearBtn.onclick = function () {
    var notes = loadNotes();
    var activeId = getActiveId();

    if (activeId) {
      removeNote(notes, activeId);
      saveNotes(notes);
      setActiveId('');
    }

    noteEl.value = '';
    render();
    noteEl.focus();
  };

  render();
})();
