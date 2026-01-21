// ES5 pour compat iOS 11/12 (pas d'arrow, pas d'import/export)
(function () {
  var NOTES_KEY = 'notepad.notes.v1';   // tableau de {id, title, content}
  var ACTIVE_KEY = 'notepad.active.v1'; // id de la note active, ou "" pour brouillon

  var tabsEl = document.getElementById('tabs');
  var noteEl = document.getElementById('note');
  var saveBtn = document.getElementById('saveBtn');
  var clearBtn = document.getElementById('clearBtn');

  /* ---------- Storage ---------- */
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
    return localStorage.getItem(ACTIVE_KEY) || '';
  }
  function setActiveId(id) {
    try { localStorage.setItem(ACTIVE_KEY, id || ''); } catch (e) {}
  }

  /* ---------- Helpers ---------- */
  function firstLineTitle(text) {
    // Titre = 1re ligne (ou 20 premiers chars) sans retours à la ligne
    var t = (text || '').split(/\r?\n/)[0];
    if (!t) t = 'Note';
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

  function removeNoteById(notes, id) {
    var i;
    for (i = 0; i < notes.length; i++) {
      if (notes[i].id === id) { notes.splice(i, 1); return true; }
    }
    return false;
  }

  /* ---------- UI ---------- */
  function renderTabs(notes, activeId) {
    tabsEl.innerHTML = '';
    var i, n, tab;

    for (i = 0; i < notes.length; i++) {
      n = notes[i];
      tab = document.createElement('div');
      tab.className = 'tab' + (n.id === activeId ? ' active' : '');
      tab.textContent = n.title || 'Note';

      // Changer d’onglet
      tab.onclick = (function (id) {
        return function () {
          setActiveId(id);
          render();           // recharge l’UI
          noteEl.focus();     // l’utilisateur reste dans la zone de texte
        };
      })(n.id);

      tabsEl.appendChild(tab);
    }
  }

  function render() {
    var notes = loadNotes();
    var activeId = getActiveId();
    var current = activeId ? findNote(notes, activeId) : null;

    // Si id actif introuvable (supprimé), repasser en brouillon
    if (activeId && !current) {
      setActiveId('');
      activeId = '';
    }

    renderTabs(notes, activeId);

    // Zone de texte = contenu de la note active ou brouillon vide
    noteEl.value = current ? current.content : '';
  }

  /* ---------- Actions ---------- */

  // Sauvegarde :
  // - Si une note est active => on met à jour CET onglet
  // - Si aucune note active (brouillon) => on crée un NOUVEL onglet
  saveBtn.onclick = function () {
    var notes = loadNotes();
    var activeId = getActiveId();
    var content = noteEl.value || '';
    var title = firstLineTitle(content);
    var caret = noteEl.selectionStart || content.length; // pour tenter de garder la position

    if (activeId) {
      // Mettre à jour la note existante
      var n = findNote(notes, activeId);
      if (!n) {
        // sécurité : si l’ID a disparu, créer une nouvelle note
        activeId = '';
      } else {
        n.content = content;
        n.title = title;
        saveNotes(notes);
        render();
        try { noteEl.focus(); noteEl.setSelectionRange(caret, caret); } catch (e) { noteEl.focus(); }
        return;
      }
    }

    // Créer une note (cas brouillon ou fallback)
    var id = String(new Date().getTime());
    notes.push({ id: id, title: title, content: content });
    saveNotes(notes);
    setActiveId(id);
    render();
    try { noteEl.focus(); noteEl.setSelectionRange(caret, caret); } catch (e) { noteEl.focus(); }
  };

  // Effacer :
  // - Si une note est active => SUPPRIME L’ONGLET (du localStorage)
  // - Si brouillon => vide simplement la zone
  clearBtn.onclick = function () {
    var notes = loadNotes();
    var activeId = getActiveId();

    if (activeId) {
      // Supprimer la note active
      var removed = removeNoteById(notes, activeId);
      if (removed) {
        saveNotes(notes);
        setActiveId('');
        noteEl.value = '';
        render();
        noteEl.focus();  // l’utilisateur est replacé dans la zone de texte vide
      }
    } else {
      // Brouillon : juste tout vider
      noteEl.value = '';
      noteEl.focus();
    }
  };

  // Initialisation
  render();
})();
