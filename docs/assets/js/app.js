// Fichier : docs/assets/js/app.js
// Objectif : Home (liste) + onglets + couleurs (sliders HSL) + sauvegarde + effacer + copier + persistance localStorage
// ES5 compatible (iOS 11/12)

(function () {
  var NOTES_KEY = 'notepad.notes.v1';
  var ACTIVE_KEY = 'notepad.active.v1';
  var VIEW_KEY = 'notepad.view.v1';
  var DRAFT_COLOR_KEY = 'notepad.draftColor.v1';

  var homeView = document.getElementById('homeView');
  var editorView = document.getElementById('editorView');

  var tabsEl = document.getElementById('tabs');
  var noteEl = document.getElementById('note');

  var saveBtn = document.getElementById('saveBtn');
  var clearBtn = document.getElementById('clearBtn');
  var copyBtn = document.getElementById('copyBtn');

  var homeBtn = document.getElementById('homeBtn');
  var editorBtn = document.getElementById('editorBtn');

  var newBtn = document.getElementById('newBtn');
  var newBtnHome = document.getElementById('newBtnHome');
  var emptyCreateBtn = document.getElementById('emptyCreateBtn');

  var notesListEl = document.getElementById('notesList');
  var emptyStateEl = document.getElementById('emptyState');
  var searchInput = document.getElementById('searchInput');

  var notesCountEl = document.getElementById('notesCount');

  // Color panel
  var colorPreview = document.getElementById('colorPreview');
  var hueEl = document.getElementById('hue');
  var satEl = document.getElementById('sat');
  var lightEl = document.getElementById('light');
  var hueOut = document.getElementById('hueOut');
  var satOut = document.getElementById('satOut');
  var lightOut = document.getElementById('lightOut');

  var toastEl = document.getElementById('toast');

  // -------- Storage helpers --------
  function loadNotes() {
    try {
      var raw = localStorage.getItem(NOTES_KEY);
      var notes = raw ? JSON.parse(raw) : [];
      return notes && notes.length ? notes : [];
    } catch (e) {
      return [];
    }
  }

  function saveNotes(notes) {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (e) {}
  }

  function getActiveId() {
    try {
      return localStorage.getItem(ACTIVE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setActiveId(id) {
    try {
      localStorage.setItem(ACTIVE_KEY, id || '');
    } catch (e) {}
  }

  function getView() {
    try {
      return localStorage.getItem(VIEW_KEY) || 'home';
    } catch (e) {
      return 'home';
    }
  }

  function setView(v) {
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch (e) {}
  }

  function getDraftColor() {
    try {
      var raw = localStorage.getItem(DRAFT_COLOR_KEY);
      if (!raw) return defaultColor();
      var c = JSON.parse(raw);
      return normalizeColor(c);
    } catch (e) {
      return defaultColor();
    }
  }

  function setDraftColor(c) {
    try {
      localStorage.setItem(DRAFT_COLOR_KEY, JSON.stringify(normalizeColor(c)));
    } catch (e) {}
  }

  // -------- Utils --------
  function nowTs() {
    return new Date().getTime();
  }

  function clamp(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function normalizeColor(c) {
    c = c || {};
    return {
      h: clamp(parseInt(c.h, 10) || 210, 0, 360),
      s: clamp(parseInt(c.s, 10) || 80, 0, 100),
      l: clamp(parseInt(c.l, 10) || 45, 0, 100)
    };
  }

  function defaultColor() {
    return { h: 210, s: 80, l: 45 };
  }

  function hslToCss(c) {
    c = normalizeColor(c);
    return 'hsl(' + c.h + ', ' + c.s + '%, ' + c.l + '%)';
  }

  function idealTextColorFromLightness(l) {
    // Simple : texte sombre si fond très clair, sinon texte clair
    return l >= 62 ? '#111827' : '#ffffff';
  }

  function firstLineTitle(text) {
    var t = (text || '').split(/\r?\n/)[0];
    if (!t) t = 'Note';
    t = t.replace(/^\s+|\s+$/g, '');
    if (!t) t = 'Note';
    if (t.length > 28) t = t.slice(0, 28);
    return t;
  }

  function snippet(text) {
    var s = (text || '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    if (!s) return '—';
    if (s.length > 140) s = s.slice(0, 140) + '…';
    return s;
  }

  function formatDate(ts) {
    try {
      var d = new Date(ts);
      // iOS 11/12 friendly
      return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
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
      if (notes[i].id === id) {
        notes.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  function ensureNoteShape(n) {
    // Compat si anciennes notes sans color/updatedAt
    n = n || {};
    if (!n.id) n.id = String(nowTs());
    if (typeof n.title !== 'string') n.title = 'Note';
    if (typeof n.content !== 'string') n.content = '';
    n.color = normalizeColor(n.color);
    if (!n.updatedAt) n.updatedAt = nowTs();
    return n;
  }

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      toastEl.hidden = true;
    }, 1800);
  }

  // -------- View handling --------
  function showHome() {
    homeView.hidden = false;
    editorView.hidden = true;

    homeBtn.className = 'nav-btn active';
    editorBtn.className = 'nav-btn';

    setView('home');
  }

  function showEditor() {
    homeView.hidden = true;
    editorView.hidden = false;

    homeBtn.className = 'nav-btn';
    editorBtn.className = 'nav-btn active';

    setView('editor');
  }

  // -------- UI render --------
  function renderTabs(notes, activeId) {
    tabsEl.innerHTML = '';

    if (!notes.length) {
      // Pas d’onglets si aucune note
      return;
    }

    var i, n, tab, bg, fg;
    for (i = 0; i < notes.length; i++) {
      n = ensureNoteShape(notes[i]);

      tab = document.createElement('div');
      tab.className = 'tab' + (n.id === activeId ? ' active' : '');
      tab.textContent = n.title || 'Note';

      bg = hslToCss(n.color);
      fg = idealTextColorFromLightness(n.color.l);

      tab.style.setProperty('--tab-bg', bg);
      tab.style.setProperty('--tab-fg', fg);

      tab.onclick = (function (id) {
        return function () {
          setActiveId(id);
          showEditor();
          render();
          noteEl.focus();
        };
      })(n.id);

      tabsEl.appendChild(tab);
    }
  }

  function renderHome(notes) {
    var q = (searchInput && searchInput.value ? searchInput.value : '').toLowerCase();
    var list = notes.slice();

    // tri: plus récent d'abord
    list.sort(function (a, b) {
      a = ensureNoteShape(a);
      b = ensureNoteShape(b);
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    // filtre
    if (q) {
      list = list.filter(function (n) {
        n = ensureNoteShape(n);
        var t = (n.title || '').toLowerCase();
        var c = (n.content || '').toLowerCase();
        return t.indexOf(q) !== -1 || c.indexOf(q) !== -1;
      });
    }

    notesListEl.innerHTML = '';

    if (!notes.length) {
      emptyStateEl.hidden = false;
      return;
    } else {
      emptyStateEl.hidden = true;
    }

    if (!list.length) {
      // aucun résultat search
      var msg = document.createElement('div');
      msg.className = 'muted';
      msg.style.padding = '10px 2px';
      msg.textContent = 'Aucun résultat pour cette recherche.';
      notesListEl.appendChild(msg);
      return;
    }

    var i, n, card, bar, title, meta, snip;
    for (i = 0; i < list.length; i++) {
      n = ensureNoteShape(list[i]);

      card = document.createElement('div');
      card.className = 'note-card';

      bar = document.createElement('div');
      bar.className = 'color-bar';
      bar.style.background = hslToCss(n.color);

      title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = n.title || 'Note';

      meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.textContent = 'Mis à jour : ' + formatDate(n.updatedAt);

      snip = document.createElement('div');
      snip.className = 'card-snippet';
      snip.textContent = snippet(n.content);

      card.appendChild(bar);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(snip);

      card.onclick = (function (id) {
        return function () {
          setActiveId(id);
          showEditor();
          render();
          noteEl.focus();
        };
      })(n.id);

      notesListEl.appendChild(card);
    }
  }

  function syncColorUI(c) {
    c = normalizeColor(c);

    hueEl.value = String(c.h);
    satEl.value = String(c.s);
    lightEl.value = String(c.l);

    hueOut.textContent = String(c.h);
    satOut.textContent = String(c.s);
    lightOut.textContent = String(c.l);

    if (colorPreview) {
      colorPreview.style.background = hslToCss(c);
    }
  }

  function renderEditor(notes) {
    var activeId = getActiveId();
    var current = activeId ? findNote(notes, activeId) : null;

    // si l’actif n’existe plus
    if (activeId && !current) {
      setActiveId('');
      activeId = '';
      current = null;
    }

    renderTabs(notes, activeId);

    if (current) {
      current = ensureNoteShape(current);
      noteEl.value = current.content || '';
      syncColorUI(current.color);
    } else {
      // brouillon
      noteEl.value = noteEl.value || '';
      syncColorUI(getDraftColor());
    }
  }

  function renderHeaderMeta(notes) {
    if (!notesCountEl) return;
    var n = notes.length;
    notesCountEl.textContent = n + (n > 1 ? ' notes' : ' note') + ' — pilotage local (localStorage)';
  }

  function render() {
    var notes = loadNotes();
    // normalise notes
    var i;
    for (i = 0; i < notes.length; i++) notes[i] = ensureNoteShape(notes[i]);
    saveNotes(notes); // garde la structure propre

    renderHeaderMeta(notes);

    // view
    var v = getView();
    if (v === 'editor') showEditor();
    else showHome();

    // home + editor (on rend les deux pour cohérence)
    renderHome(notes);
    renderEditor(notes);
  }

  // -------- Actions --------
  function startNewNote() {
    // On passe en brouillon sans détruire l’existant
    setActiveId('');
    noteEl.value = '';
    showEditor();
    render();
    noteEl.focus();
    toast('Nouveau brouillon prêt.');
  }

  function saveCurrent() {
    var notes = loadNotes();
    var activeId = getActiveId();

    var content = noteEl.value || '';
    var title = firstLineTitle(content);

    // Si note active : update
    if (activeId) {
      var existing = findNote(notes, activeId);
      if (existing) {
        existing = ensureNoteShape(existing);
        existing.content = content;
        existing.title = title;
        existing.updatedAt = nowTs();
        // conserve couleur existante
        saveNotes(notes);
        render();
        noteEl.focus();
        toast('Note mise à jour.');
        return;
      } else {
        // sécurité
        setActiveId('');
        activeId = '';
      }
    }

    // création nouvelle note (avec couleur du brouillon)
    var id = String(nowTs());
    var c = getDraftColor();
    notes.push({
      id: id,
      title: title,
      content: content,
      color: normalizeColor(c),
      updatedAt: nowTs()
    });

    saveNotes(notes);
    setActiveId(id);

    render();
    noteEl.focus();
    toast('Nouvel onglet créé.');
  }

  function clearOrDelete() {
    var notes = loadNotes();
    var activeId = getActiveId();

    if (activeId) {
      removeNote(notes, activeId);
      saveNotes(notes);
      setActiveId('');
      noteEl.value = '';
      render();
      noteEl.focus();
      toast('Note supprimée.');
      return;
    }

    // sinon, juste vider l’éditeur
    noteEl.value = '';
    render();
    noteEl.focus();
    toast('Brouillon vidé.');
  }

  function copyAll() {
    var text = noteEl.value || '';
    if (!text) {
      toast('Rien à copier.');
      return;
    }

    // Clipboard API (si dispo et contexte sécurisé)
    if (navigator && navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Copié dans le presse-papiers.');
      }).catch(function () {
        fallbackCopy(text);
      });
      return;
    }

    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    // ES5 fallback
    try {
      var ta = noteEl;
      var prevStart = ta.selectionStart;
      var prevEnd = ta.selectionEnd;

      ta.focus();
      ta.select();

      var ok = document.execCommand('copy');
      // restore selection
      ta.setSelectionRange(prevStart, prevEnd);

      toast(ok ? 'Copié dans le presse-papiers.' : 'Copie impossible (navigateur).');
    } catch (e) {
      toast('Copie impossible (navigateur).');
    }
  }

  function applyColorChange() {
    var c = normalizeColor({
      h: hueEl.value,
      s: satEl.value,
      l: lightEl.value
    });

    hueOut.textContent = String(c.h);
    satOut.textContent = String(c.s);
    lightOut.textContent = String(c.l);
    colorPreview.style.background = hslToCss(c);

    var notes = loadNotes();
    var activeId = getActiveId();
    var current = activeId ? findNote(notes, activeId) : null;

    if (current) {
      current = ensureNoteShape(current);
      current.color = c;
      current.updatedAt = current.updatedAt || nowTs();
      saveNotes(notes);
      render(); // rafraîchit tabs + home
      return;
    }

    // brouillon : on persiste la couleur pour la prochaine création
    setDraftColor(c);
  }

  // -------- Events --------
  homeBtn.onclick = function () { showHome(); render(); };
  editorBtn.onclick = function () { showEditor(); render(); noteEl.focus(); };

  if (searchInput) {
    searchInput.oninput = function () { render(); };
  }

  newBtn.onclick = startNewNote;
  newBtnHome.onclick = startNewNote;
  emptyCreateBtn.onclick = startNewNote;

  saveBtn.onclick = saveCurrent;
  clearBtn.onclick = clearOrDelete;
  copyBtn.onclick = copyAll;

  hueEl.oninput = applyColorChange;
  satEl.oninput = applyColorChange;
  lightEl.oninput = applyColorChange;

  // Init : par défaut, si aucune note → éditeur, sinon home
  (function init() {
    var notes = loadNotes();
    if (!notes.length) setView('editor');
    render();
  })();
})();
