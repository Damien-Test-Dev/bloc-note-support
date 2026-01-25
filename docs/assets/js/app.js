// Fichier : docs/assets/js/app.js
// Premium : rename onglets + drag&drop reorder + pin/favoris + export/import JSON + autosave + dirty indicator + couleurs HSL
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
  var renameBtn = document.getElementById('renameBtn');
  var pinBtn = document.getElementById('pinBtn');

  var homeBtn = document.getElementById('homeBtn');
  var editorBtn = document.getElementById('editorBtn');

  var newBtn = document.getElementById('newBtn');
  var newBtnHome = document.getElementById('newBtnHome');
  var emptyCreateBtn = document.getElementById('emptyCreateBtn');

  var notesListEl = document.getElementById('notesList');
  var emptyStateEl = document.getElementById('emptyState');
  var searchInput = document.getElementById('searchInput');

  var notesCountEl = document.getElementById('notesCount');

  var exportBtn = document.getElementById('exportBtn');
  var importBtn = document.getElementById('importBtn');
  var importFile = document.getElementById('importFile');

  // Color panel
  var colorPreview = document.getElementById('colorPreview');
  var hueEl = document.getElementById('hue');
  var satEl = document.getElementById('sat');
  var lightEl = document.getElementById('light');
  var hueOut = document.getElementById('hueOut');
  var satOut = document.getElementById('satOut');
  var lightOut = document.getElementById('lightOut');

  var toastEl = document.getElementById('toast');
  var saveStatusEl = document.getElementById('saveStatus');

  // Autosave / dirty state
  var isDirty = false;
  var lastSavedValue = '';
  var autosaveTimer = null;

  // Drag&drop state
  var dragId = '';

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
      // On maintient l’invariant : épinglées d’abord, puis non épinglées (ordre utilisateur dans chaque bloc)
      notes = normalizeOrder(notes);
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (e) {}
  }

  function getActiveId() {
    try { return localStorage.getItem(ACTIVE_KEY) || ''; }
    catch (e) { return ''; }
  }

  function setActiveId(id) {
    try { localStorage.setItem(ACTIVE_KEY, id || ''); }
    catch (e) {}
  }

  function getView() {
    try { return localStorage.getItem(VIEW_KEY) || 'home'; }
    catch (e) { return 'home'; }
  }

  function setView(v) {
    try { localStorage.setItem(VIEW_KEY, v); }
    catch (e) {}
  }

  function getDraftColor() {
    try {
      var raw = localStorage.getItem(DRAFT_COLOR_KEY);
      if (!raw) return defaultColor();
      return normalizeColor(JSON.parse(raw));
    } catch (e) {
      return defaultColor();
    }
  }

  function setDraftColor(c) {
    try { localStorage.setItem(DRAFT_COLOR_KEY, JSON.stringify(normalizeColor(c))); }
    catch (e) {}
  }

  // -------- Utils --------
  function nowTs() { return new Date().getTime(); }

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

  function defaultColor() { return { h: 210, s: 80, l: 45 }; }

  function hslToCss(c) {
    c = normalizeColor(c);
    return 'hsl(' + c.h + ', ' + c.s + '%, ' + c.l + '%)';
  }

  function idealTextColorFromLightness(l) {
    return l >= 62 ? '#111827' : '#ffffff';
  }

  function trim(s) { return (s || '').replace(/^\s+|\s+$/g, ''); }

  function firstLineTitle(text) {
    var t = (text || '').split(/\r?\n/)[0];
    t = trim(t);
    if (!t) t = 'Note';
    if (t.length > 28) t = t.slice(0, 28);
    return t;
  }

  function snippet(text) {
    var s = (text || '').replace(/\s+/g, ' ');
    s = trim(s);
    if (!s) return '—';
    if (s.length > 140) s = s.slice(0, 140) + '…';
    return s;
  }

  function formatDate(ts) {
    try {
      var d = new Date(ts);
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

  function indexOfNote(notes, id) {
    var i;
    for (i = 0; i < notes.length; i++) {
      if (notes[i].id === id) return i;
    }
    return -1;
  }

  function removeNote(notes, id) {
    var i = indexOfNote(notes, id);
    if (i >= 0) { notes.splice(i, 1); return true; }
    return false;
  }

  function ensureNoteShape(n) {
    n = n || {};
    if (!n.id) n.id = String(nowTs());
    if (typeof n.title !== 'string') n.title = 'Note';
    if (typeof n.content !== 'string') n.content = '';
    n.color = normalizeColor(n.color);
    if (!n.updatedAt) n.updatedAt = nowTs();
    if (typeof n.pinned !== 'boolean') n.pinned = false;

    // autoTitle : héritage = true (comme l’ancien comportement)
    if (typeof n.autoTitle !== 'boolean') n.autoTitle = true;

    return n;
  }

  function splitPinned(notes) {
    var pinned = [];
    var normal = [];
    var i, n;
    for (i = 0; i < notes.length; i++) {
      n = ensureNoteShape(notes[i]);
      if (n.pinned) pinned.push(n);
      else normal.push(n);
    }
    return { pinned: pinned, normal: normal };
  }

  function normalizeOrder(notes) {
    // Stockage canonique : épinglées d’abord (ordre existant), puis normales (ordre existant)
    var s = splitPinned(notes);
    return s.pinned.concat(s.normal);
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

  // -------- Dirty / autosave --------
  function setDirty(d) {
    isDirty = !!d;
    renderSaveStatus();
  }

  function markSavedState(value) {
    lastSavedValue = value || '';
    setDirty(false);
  }

  function computeDirtyAgainstCurrent(current) {
    var v = noteEl.value || '';
    if (!current) return !!trim(v); // brouillon : dirty si du contenu existe
    return v !== (current.content || '');
  }

  function renderSaveStatus() {
    if (!saveStatusEl) return;

    var activeId = getActiveId();
    var dot = isDirty ? '●' : '✓';
    var label = isDirty ? 'Non sauvegardé' : 'Enregistré';
    var mode = activeId ? 'Autosave actif' : 'Brouillon (sauvegarde manuelle)';

    saveStatusEl.innerHTML = '';
    var b = document.createElement('span');
    b.className = 'badge';
    b.textContent = dot + ' ' + label;

    var b2 = document.createElement('span');
    b2.className = 'badge';
    b2.textContent = mode;

    saveStatusEl.appendChild(b);
    saveStatusEl.appendChild(b2);
  }

  function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(function () {
      autosaveIfNeeded();
    }, 900);
  }

  function autosaveIfNeeded() {
    var activeId = getActiveId();
    if (!activeId) return; // pas d’autosave sur brouillon

    var notes = loadNotes();
    var current = findNote(notes, activeId);
    if (!current) return;

    current = ensureNoteShape(current);

    // Si rien de nouveau, ne touche à rien
    var v = noteEl.value || '';
    if (v === (current.content || '')) return;

    current.content = v;

    // Title : seulement si autoTitle = true
    if (current.autoTitle) {
      current.title = firstLineTitle(v);
    }

    current.updatedAt = nowTs();
    saveNotes(notes);

    // Update UI sans casser le curseur : on rerend tabs + home sans réécrire noteEl.value
    partialRender(true);
    toast('Autosave ✓');
    setDirty(false);
  }

  // -------- UI render --------
  function renderHeaderMeta(notes) {
    if (!notesCountEl) return;
    var n = notes.length;
    notesCountEl.textContent = n + (n > 1 ? ' notes' : ' note') + ' — localStorage';
  }

  function renderTabs(notes, activeId) {
    tabsEl.innerHTML = '';

    if (!notes.length) return;

    var i, n, tab, titleSpan, pinBtnEl, bg, fg;

    for (i = 0; i < notes.length; i++) {
      n = ensureNoteShape(notes[i]);

      tab = document.createElement('div');
      tab.className = 'tab' + (n.id === activeId ? ' active' : '');
      tab.setAttribute('data-id', n.id);
      tab.draggable = true;

      bg = hslToCss(n.color);
      fg = idealTextColorFromLightness(n.color.l);
      tab.style.setProperty('--tab-bg', bg);
      tab.style.setProperty('--tab-fg', fg);

      titleSpan = document.createElement('span');
      titleSpan.className = 'tab-title';
      titleSpan.textContent = n.title || 'Note';

      pinBtnEl = document.createElement('button');
      pinBtnEl.type = 'button';
      pinBtnEl.className = 'tab-pin';
      pinBtnEl.textContent = n.pinned ? '⭐' : '☆';
      pinBtnEl.title = n.pinned ? 'Retirer des favoris' : 'Épingler en favoris';
      pinBtnEl.onclick = (function (id) {
        return function (e) {
          e.stopPropagation();
          togglePin(id);
        };
      })(n.id);

      tab.appendChild(titleSpan);
      tab.appendChild(pinBtnEl);

      tab.onclick = (function (id) {
        return function () {
          setActiveId(id);
          showEditor();
          fullRender(true);
          noteEl.focus();
        };
      })(n.id);

      tab.ondblclick = (function (id) {
        return function (e) {
          e.stopPropagation();
          setActiveId(id);
          showEditor();
          fullRender(true);
          promptRenameActive();
        };
      })(n.id);

      // Drag & drop
      tab.ondragstart = (function (id) {
        return function () {
          dragId = id;
          tab.className = tab.className + ' dragging';
        };
      })(n.id);

      tab.ondragend = function () {
        dragId = '';
        // nettoyage classe
        var els = tabsEl.querySelectorAll('.tab');
        var k;
        for (k = 0; k < els.length; k++) {
          els[k].className = els[k].className.replace(/\s?dragging/g, '');
        }
      };

      tab.ondragover = function (e) {
        e.preventDefault();
      };

      tab.ondrop = (function (toId) {
        return function (e) {
          e.preventDefault();
          if (!dragId || dragId === toId) return;
          reorderWithinPinnedGroup(dragId, toId);
        };
      })(n.id);

      tabsEl.appendChild(tab);
    }
  }

  function renderHome(notes) {
    var q = (searchInput && searchInput.value ? searchInput.value : '').toLowerCase();
    var list = notes.slice(); // déjà canonique (pinned puis normal)

    // filtre recherche, mais on garde l’ordre utilisateur
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
      var msg = document.createElement('div');
      msg.className = 'muted';
      msg.style.padding = '10px 2px';
      msg.textContent = 'Aucun résultat pour cette recherche.';
      notesListEl.appendChild(msg);
      return;
    }

    var i, n, card, bar, top, left, title, actions, pin, ren, del, meta, snip;

    for (i = 0; i < list.length; i++) {
      n = ensureNoteShape(list[i]);

      card = document.createElement('div');
      card.className = 'note-card';

      bar = document.createElement('div');
      bar.className = 'color-bar';
      bar.style.background = hslToCss(n.color);

      top = document.createElement('div');
      top.className = 'card-top';

      left = document.createElement('div');

      title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = (n.pinned ? '⭐ ' : '') + (n.title || 'Note');

      meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.textContent = 'Mis à jour : ' + formatDate(n.updatedAt);

      left.appendChild(title);
      left.appendChild(meta);

      actions = document.createElement('div');
      actions.className = 'card-actions';

      pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'icon-btn';
      pin.textContent = n.pinned ? '⭐' : '☆';
      pin.title = n.pinned ? 'Retirer des favoris' : 'Épingler';
      pin.onclick = (function (id) {
        return function (e) {
          e.stopPropagation();
          togglePin(id);
        };
      })(n.id);

      ren = document.createElement('button');
      ren.type = 'button';
      ren.className = 'icon-btn';
      ren.textContent = '✏️';
      ren.title = 'Renommer';
      ren.onclick = (function (id) {
        return function (e) {
          e.stopPropagation();
          setActiveId(id);
          showEditor();
          fullRender(true);
          promptRenameActive();
        };
      })(n.id);

      del = document.createElement('button');
      del.type = 'button';
      del.className = 'icon-btn danger';
      del.textContent = '🗑️';
      del.title = 'Supprimer';
      del.onclick = (function (id) {
        return function (e) {
          e.stopPropagation();
          deleteNoteById(id);
        };
      })(n.id);

      actions.appendChild(pin);
      actions.appendChild(ren);
      actions.appendChild(del);

      top.appendChild(left);
      top.appendChild(actions);

      snip = document.createElement('div');
      snip.className = 'card-snippet';
      snip.textContent = snippet(n.content);

      card.appendChild(bar);
      card.appendChild(top);
      card.appendChild(snip);

      card.onclick = (function (id) {
        return function () {
          setActiveId(id);
          showEditor();
          fullRender(true);
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

    if (colorPreview) colorPreview.style.background = hslToCss(c);
  }

  function renderEditor(notes, preserveEditorValue) {
    var activeId = getActiveId();
    var current = activeId ? findNote(notes, activeId) : null;

    if (activeId && !current) {
      setActiveId('');
      activeId = '';
      current = null;
    }

    renderTabs(notes, activeId);

    if (current) {
      current = ensureNoteShape(current);

      if (!preserveEditorValue) {
        noteEl.value = current.content || '';
      }

      syncColorUI(current.color);

      // Bouton pin dans l’éditeur
      pinBtn.textContent = current.pinned ? '⭐ Désépingler' : '⭐ Épingler';

      // Dirty state basé sur current
      setDirty(computeDirtyAgainstCurrent(current));
      markSavedValue(current.content || '');
    } else {
      // brouillon
      if (!preserveEditorValue) {
        noteEl.value = noteEl.value || '';
      }
      syncColorUI(getDraftColor());

      pinBtn.textContent = '⭐ Épingler';
      setDirty(computeDirtyAgainstCurrent(null));
      renderSaveStatus();
    }
  }

  function fullRender(preserveEditorValue) {
    var notes = loadNotes();
    var i;
    for (i = 0; i < notes.length; i++) notes[i] = ensureNoteShape(notes[i]);
    saveNotes(notes);

    renderHeaderMeta(notes);

    var v = getView();
    if (v === 'editor') showEditor();
    else showHome();

    renderHome(notes);
    renderEditor(notes, !!preserveEditorValue);
    renderSaveStatus();
  }

  function partialRender(preserveEditorValue) {
    // Rerender “safe” : tabs + home + header, sans écraser le textarea (préserve curseur)
    var notes = loadNotes();
    var i;
    for (i = 0; i < notes.length; i++) notes[i] = ensureNoteShape(notes[i]);
    saveNotes(notes);

    renderHeaderMeta(notes);
    renderHome(notes);
    renderEditor(notes, !!preserveEditorValue);
    renderSaveStatus();
  }

  // -------- Actions --------
  function startNewNote() {
    setActiveId('');
    noteEl.value = '';
    showEditor();
    fullRender(true);
    noteEl.focus();
    toast('Nouveau brouillon prêt.');
    setDirty(false);
  }

  function saveCurrent() {
    var notes = loadNotes();
    var activeId = getActiveId();
    var content = noteEl.value || '';

    // update note existante
    if (activeId) {
      var existing = findNote(notes, activeId);
      if (existing) {
        existing = ensureNoteShape(existing);
        existing.content = content;

        if (existing.autoTitle) {
          existing.title = firstLineTitle(content);
        }

        existing.updatedAt = nowTs();
        saveNotes(notes);
        partialRender(true);
        toast('Note sauvegardée.');
        setDirty(false);
        return;
      } else {
        setActiveId('');
        activeId = '';
      }
    }

    // création d’une nouvelle note
    var id = String(nowTs());
    var c = getDraftColor();
    var title = firstLineTitle(content);

    notes.push({
      id: id,
      title: title,
      content: content,
      color: normalizeColor(c),
      updatedAt: nowTs(),
      pinned: false,
      autoTitle: true
    });

    saveNotes(notes);
    setActiveId(id);

    showEditor();
    fullRender(true);
    noteEl.focus();
    toast('Nouvel onglet créé.');
    setDirty(false);
  }

  function deleteActiveOrClear() {
    var activeId = getActiveId();
    if (!activeId) {
      // brouillon
      noteEl.value = '';
      fullRender(true);
      toast('Brouillon vidé.');
      setDirty(false);
      return;
    }
    deleteNoteById(activeId);
  }

  function deleteNoteById(id) {
    var notes = loadNotes();
    var ok = removeNote(notes, id);
    if (!ok) return;

    saveNotes(notes);

    // si on supprime l’actif, retour brouillon
    if (getActiveId() === id) {
      setActiveId('');
      noteEl.value = '';
    }

    // view : si plus aucune note, va à l’éditeur (tradition du bloc-notes)
    if (!notes.length) setView('editor');
    else setView('home');

    fullRender(true);
    toast('Note supprimée.');
    setDirty(false);
  }

  function copyAll() {
    var text = noteEl.value || '';
    if (!text) { toast('Rien à copier.'); return; }

    if (navigator && navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Copié.');
      }).catch(function () {
        fallbackCopy();
      });
      return;
    }
    fallbackCopy();

    function fallbackCopy() {
      try {
        var prevStart = noteEl.selectionStart;
        var prevEnd = noteEl.selectionEnd;

        noteEl.focus();
        noteEl.select();
        var ok = document.execCommand('copy');

        noteEl.setSelectionRange(prevStart, prevEnd);
        toast(ok ? 'Copié.' : 'Copie impossible (navigateur).');
      } catch (e) {
        toast('Copie impossible (navigateur).');
      }
    }
  }

  function promptRenameActive() {
    var activeId = getActiveId();
    if (!activeId) { toast('Renomme après avoir créé/sélectionné une note.'); return; }

    var notes = loadNotes();
    var n = findNote(notes, activeId);
    if (!n) return;

    n = ensureNoteShape(n);

    var name = window.prompt('Nouveau nom de l’onglet :', n.title || 'Note');
    if (name === null) return;

    name = trim(name);
    if (!name) { toast('Nom invalide.'); return; }
    if (name.length > 60) name = name.slice(0, 60);

    n.title = name;
    n.autoTitle = false;
    n.updatedAt = nowTs();

    saveNotes(notes);
    partialRender(true);
    toast('Onglet renommé.');
  }

  function togglePin(id) {
    var notes = loadNotes();
    var n = findNote(notes, id);
    if (!n) return;

    n = ensureNoteShape(n);
    n.pinned = !n.pinned;
    n.updatedAt = nowTs();

    // Déplacement : pin/unpin -> tête de bloc pour “impact” immédiat
    var idx = indexOfNote(notes, id);
    if (idx >= 0) notes.splice(idx, 1);

    // rebuild blocs
    var s = splitPinned(notes);
    if (n.pinned) {
      s.pinned.unshift(n);
    } else {
      s.normal.unshift(n);
    }

    notes = s.pinned.concat(s.normal);
    saveNotes(notes);

    // UI
    partialRender(true);
    toast(n.pinned ? 'Ajouté aux favoris.' : 'Retiré des favoris.');
  }

  function reorderWithinPinnedGroup(fromId, toId) {
    var notes = loadNotes();
    var from = findNote(notes, fromId);
    var to = findNote(notes, toId);
    if (!from || !to) return;

    from = ensureNoteShape(from);
    to = ensureNoteShape(to);

    if (from.pinned !== to.pinned) {
      toast('Drag & drop : réordonne uniquement dans le même bloc (favoris / non favoris).');
      return;
    }

    // extraire le bloc cible
    var s = splitPinned(notes);
    var group = from.pinned ? s.pinned : s.normal;

    // ids dans l’ordre
    var ids = [];
    var i;
    for (i = 0; i < group.length; i++) ids.push(group[i].id);

    var fromIdx = -1, toIdx = -1;
    for (i = 0; i < ids.length; i++) {
      if (ids[i] === fromId) fromIdx = i;
      if (ids[i] === toId) toIdx = i;
    }
    if (fromIdx < 0 || toIdx < 0) return;

    // move
    ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0]);

    // rebuild group by ids
    var newGroup = [];
    for (i = 0; i < ids.length; i++) {
      newGroup.push(findNote(group, ids[i]));
    }

    if (from.pinned) {
      notes = newGroup.concat(s.normal);
    } else {
      notes = s.pinned.concat(newGroup);
    }

    saveNotes(notes);
    partialRender(true);
    toast('Ordre mis à jour.');
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
      current.updatedAt = nowTs();
      saveNotes(notes);
      partialRender(true);
      return;
    }

    // brouillon
    setDraftColor(c);
  }

  // -------- Export / Import --------
  function download(filename, text) {
    try {
      var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 500);
    } catch (e) {
      toast('Export impossible (navigateur).');
    }
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function exportJSON() {
    var notes = loadNotes();
    var i;
    for (i = 0; i < notes.length; i++) notes[i] = ensureNoteShape(notes[i]);
    saveNotes(notes);

    var payload = {
      version: 2,
      exportedAt: nowTs(),
      notes: notes
    };

    var d = new Date();
    var name = 'notepad-export-' +
      d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' +
      pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds()) +
      '.json';

    download(name, JSON.stringify(payload, null, 2));
    toast('Export JSON prêt.');
  }

  function importJSONFile(file) {
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var incoming = data && data.notes ? data.notes : (data && data.length ? data : null);

        if (!incoming || !incoming.length) {
          toast('Import : fichier invalide.');
          return;
        }

        var notes = loadNotes();
        var map = {};
        var i;

        // map existant
        for (i = 0; i < notes.length; i++) {
          notes[i] = ensureNoteShape(notes[i]);
          map[notes[i].id] = true;
        }

        var added = 0;
        var pinnedAdd = [];
        var normalAdd = [];
        var suffix = 0;

        for (i = 0; i < incoming.length; i++) {
          var n = ensureNoteShape(incoming[i]);

          // collision id => regen
          if (map[n.id]) {
            suffix += 1;
            n.id = String(nowTs()) + '-' + String(suffix);
          }
          map[n.id] = true;

          // sécurise title
          n.title = trim(n.title) || 'Note';
          if (n.title.length > 60) n.title = n.title.slice(0, 60);

          // normalise
          n.color = normalizeColor(n.color);
          n.updatedAt = n.updatedAt || nowTs();
          n.pinned = !!n.pinned;
          if (typeof n.autoTitle !== 'boolean') n.autoTitle = true;

          if (n.pinned) pinnedAdd.push(n);
          else normalAdd.push(n);

          added += 1;
        }

        // append en fin de bloc (respect de l’ordre importé)
        var s = splitPinned(notes);
        s.pinned = s.pinned.concat(pinnedAdd);
        s.normal = s.normal.concat(normalAdd);
        notes = s.pinned.concat(s.normal);

        saveNotes(notes);
        setView('home');
        fullRender(true);
        toast('Import terminé : ' + added + ' note(s) ajoutée(s).');
      } catch (e) {
        toast('Import : JSON invalide.');
      }
    };
    reader.onerror = function () {
      toast('Import : lecture impossible.');
    };
    reader.readAsText(file);
  }

  // -------- Events --------
  homeBtn.onclick = function () { showHome(); fullRender(true); };
  editorBtn.onclick = function () { showEditor(); fullRender(true); noteEl.focus(); };

  if (searchInput) searchInput.oninput = function () { partialRender(true); };

  newBtn.onclick = startNewNote;
  newBtnHome.onclick = startNewNote;
  emptyCreateBtn.onclick = startNewNote;

  saveBtn.onclick = function () {
    saveCurrent();
  };

  clearBtn.onclick = function () {
    deleteActiveOrClear();
  };

  copyBtn.onclick = copyAll;
  renameBtn.onclick = promptRenameActive;

  pinBtn.onclick = function () {
    var activeId = getActiveId();
    if (!activeId) { toast('Épingle après avoir créé/sélectionné une note.'); return; }
    togglePin(activeId);
  };

  hueEl.oninput = applyColorChange;
  satEl.oninput = applyColorChange;
  lightEl.oninput = applyColorChange;

  exportBtn.onclick = exportJSON;

  importBtn.onclick = function () {
    if (importFile) importFile.click();
  };

  if (importFile) {
    importFile.onchange = function () {
      var f = importFile.files && importFile.files[0] ? importFile.files[0] : null;
      importJSONFile(f);
      // reset input (permet réimport du même fichier)
      try { importFile.value = ''; } catch (e) {}
    };
  }

  // Dirty + autosave
  noteEl.oninput = function () {
    var notes = loadNotes();
    var activeId = getActiveId();
    var current = activeId ? findNote(notes, activeId) : null;

    setDirty(computeDirtyAgainstCurrent(current));

    if (activeId) {
      scheduleAutosave();
    } else {
      // brouillon : pas d’autosave, mais statut mis à jour
      renderSaveStatus();
    }
  };

  // Init : si aucune note -> éditeur, sinon home
  (function init() {
    var notes = loadNotes();
    if (!notes.length) setView('editor');
    fullRender(false);

    // Init saved state
    var activeId = getActiveId();
    if (activeId) {
      var n = findNote(loadNotes(), activeId);
      if (n) {
        n = ensureNoteShape(n);
        markSavedState(n.content || '');
      }
    } else {
      markSavedState(noteEl.value || '');
    }
  })();
})();
