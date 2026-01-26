// Fichier : docs/assets/js/app.js
// Premium + Hybrid color UX (B presets + C recents + A native picker + F categories)
// + Premium FX animation on pinned cards only (Home)
// ES5 compatible (iOS 11/12)

(function () {
  var NOTES_KEY = 'notepad.notes.v1';
  var ACTIVE_KEY = 'notepad.active.v1';
  var VIEW_KEY = 'notepad.view.v1';

  var DRAFT_COLOR_KEY = 'notepad.draftColor.v1'; // legacy
  var DRAFT_TAG_KEY = 'notepad.draftTag.v1';
  var DRAFT_COLORMODE_KEY = 'notepad.draftColorMode.v1';

  var RECENT_COLORS_KEY = 'notepad.recentColors.v1';

  var TAG_COLORS = {
    'Pro': '#3B82F6',
    'Perso': '#A855F7',
    'Urgent': '#EF4444',
    'Idées': '#22C55E',
    'À lire': '#F59E0B',
    'Archive': '#64748B'
  };

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

  // Color UI
  var colorPreview = document.getElementById('colorPreview');
  var hueEl = document.getElementById('hue');
  var satEl = document.getElementById('sat');
  var lightEl = document.getElementById('light');
  var hueOut = document.getElementById('hueOut');
  var satOut = document.getElementById('satOut');
  var lightOut = document.getElementById('lightOut');

  var tagSelect = document.getElementById('tagSelect');
  var colorModeEl = document.getElementById('colorMode');
  var colorPicker = document.getElementById('colorPicker');

  var presetPalette = document.getElementById('presetPalette');
  var recentPalette = document.getElementById('recentPalette');

  var advancedToggle = document.getElementById('advancedToggle');
  var advancedSection = document.getElementById('advancedSection');

  var toastEl = document.getElementById('toast');
  var saveStatusEl = document.getElementById('saveStatus');

  // Autosave / dirty state
  var isDirty = false;
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

  function defaultColor() { return { h: 210, s: 80, l: 45 }; }

  function normalizeColor(c) {
    c = c || {};
    return {
      h: clamp(parseInt(c.h, 10) || 210, 0, 360),
      s: clamp(parseInt(c.s, 10) || 80, 0, 100),
      l: clamp(parseInt(c.l, 10) || 45, 0, 100)
    };
  }

  function getDraftColor() {
    // compat legacy
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

  function getDraftTag() {
    try { return localStorage.getItem(DRAFT_TAG_KEY) || ''; }
    catch (e) { return ''; }
  }

  function setDraftTag(t) {
    try { localStorage.setItem(DRAFT_TAG_KEY, t || ''); }
    catch (e) {}
  }

  function getDraftColorMode() {
    try { return localStorage.getItem(DRAFT_COLORMODE_KEY) || 'custom'; }
    catch (e) { return 'custom'; }
  }

  function setDraftColorMode(m) {
    try { localStorage.setItem(DRAFT_COLORMODE_KEY, m || 'custom'); }
    catch (e) {}
  }

  function loadRecentColors() {
    try {
      var raw = localStorage.getItem(RECENT_COLORS_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      if (!arr || !arr.length) return [];
      return arr;
    } catch (e) {
      return [];
    }
  }

  function saveRecentColors(arr) {
    try { localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(arr || [])); }
    catch (e) {}
  }

  // -------- Utils --------
  function nowTs() { return new Date().getTime(); }

  function clamp(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function trim(s) { return (s || '').replace(/^\s+|\s+$/g, ''); }

  function hslToCss(c) {
    c = normalizeColor(c);
    return 'hsl(' + c.h + ', ' + c.s + '%, ' + c.l + '%)';
  }

  function idealTextColorFromLightness(l) {
    return l >= 62 ? '#111827' : '#ffffff';
  }

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

  // --- Color conversions (HEX <-> HSL) ---
  function hexToRgb(hex) {
    hex = String(hex || '').replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return { r: 0, g: 0, b: 0 };

    var r = parseInt(hex.slice(0, 2), 16);
    var g = parseInt(hex.slice(2, 4), 16);
    var b = parseInt(hex.slice(4, 6), 16);
    return { r: r, g: g, b: b };
  }

  function rgbToHex(r, g, b) {
    function to2(n) {
      var s = n.toString(16);
      return s.length === 1 ? '0' + s : s;
    }
    return '#' + to2(r) + to2(g) + to2(b);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h, s, l;
    l = (max + min) / 2;

    if (max === min) {
      h = 0; s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }

    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }

  function hslToRgb(h, s, l) {
    h = (h % 360) / 360;
    s = s / 100;
    l = l / 100;

    var r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function hexToHsl(hex) {
    var rgb = hexToRgb(hex);
    return normalizeColor(rgbToHsl(rgb.r, rgb.g, rgb.b));
  }

  function hslToHex(c) {
    c = normalizeColor(c);
    var rgb = hslToRgb(c.h, c.s, c.l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
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
    if (typeof n.autoTitle !== 'boolean') n.autoTitle = true;

    if (typeof n.tag !== 'string') n.tag = '';
    n.tag = trim(n.tag);
    if (n.tag.length > 30) n.tag = n.tag.slice(0, 30);

    if (n.colorMode !== 'tag' && n.colorMode !== 'custom') n.colorMode = 'custom';

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

  // -------- Dirty / autosave --------
  function setDirty(d) {
    isDirty = !!d;
    renderSaveStatus();
  }

  function computeDirtyAgainstCurrent(current) {
    var v = noteEl.value || '';
    if (!current) return !!trim(v);
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
    if (!activeId) return;

    var notes = loadNotes();
    var current = findNote(notes, activeId);
    if (!current) return;

    current = ensureNoteShape(current);

    var v = noteEl.value || '';
    if (v === (current.content || '')) return;

    current.content = v;

    if (current.autoTitle) current.title = firstLineTitle(v);

    current.updatedAt = nowTs();
    saveNotes(notes);

    partialRender(true);
    toast('Autosave ✓');
    setDirty(false);
  }

  // -------- Hybrid color UX --------
  function pushRecent(hex) {
    hex = String(hex || '').toUpperCase();
    if (!hex || hex.charAt(0) !== '#') return;

    var arr = loadRecentColors();
    var i;
    for (i = 0; i < arr.length; i++) {
      if (String(arr[i]).toUpperCase() === hex) {
        arr.splice(i, 1);
        break;
      }
    }
    arr.unshift(hex);
    if (arr.length > 8) arr = arr.slice(0, 8);
    saveRecentColors(arr);
    renderRecents(arr);
  }

  function renderRecents(arr) {
    if (!recentPalette) return;
    recentPalette.innerHTML = '';

    arr = arr || loadRecentColors();
    if (!arr.length) {
      var t = document.createElement('div');
      t.className = 'muted small';
      t.textContent = '—';
      recentPalette.appendChild(t);
      return;
    }

    var i, btn;
    for (i = 0; i < arr.length; i++) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch';
      btn.setAttribute('data-hex', arr[i]);
      btn.title = arr[i];
      btn.style.setProperty('--sw', arr[i]);

      btn.onclick = (function (hex) {
        return function () { setColorFromHex(hex, 'custom', true); };
      })(arr[i]);

      recentPalette.appendChild(btn);
    }
  }

  function updateColorModeLabel(mode, tag) {
    if (!colorModeEl) return;
    if (mode === 'tag' && tag) {
      colorModeEl.textContent = 'Mode : Catégorie (' + tag + ')';
    } else {
      colorModeEl.textContent = 'Mode : Personnalisée';
    }
  }

  function syncColorUI(c, mode, tag) {
    c = normalizeColor(c);

    if (hueEl) hueEl.value = String(c.h);
    if (satEl) satEl.value = String(c.s);
    if (lightEl) lightEl.value = String(c.l);

    if (hueOut) hueOut.textContent = String(c.h);
    if (satOut) satOut.textContent = String(c.s);
    if (lightOut) lightOut.textContent = String(c.l);

    if (colorPreview) colorPreview.style.background = hslToCss(c);

    if (colorPicker) {
      try { colorPicker.value = hslToHex(c); } catch (e) {}
    }

    updateColorModeLabel(mode, tag);
  }

  function getCurrentContext() {
    var notes = loadNotes();
    var activeId = getActiveId();
    var current = activeId ? findNote(notes, activeId) : null;
    if (current) current = ensureNoteShape(current);

    return { notes: notes, activeId: activeId, current: current };
  }

  function setColorFromHex(hex, mode, addRecent) {
    var c = hexToHsl(hex);
    setColorFromHsl(c, mode || 'custom', addRecent ? true : false);
  }

  function setColorFromHsl(c, mode, addRecent) {
    c = normalizeColor(c);
    var ctx = getCurrentContext();
    var tag = '';

    if (ctx.current) {
      tag = ctx.current.tag || '';
      ctx.current.color = c;
      ctx.current.colorMode = mode || 'custom';
      ctx.current.updatedAt = nowTs();
      saveNotes(ctx.notes);
      syncColorUI(c, ctx.current.colorMode, tag);
      partialRender(true);
    } else {
      // draft
      setDraftColor(c);
      setDraftColorMode(mode || 'custom');
      tag = getDraftTag();
      syncColorUI(c, getDraftColorMode(), tag);
      partialRender(true);
    }

    if (addRecent) pushRecent(hslToHex(c));
  }

  function applyTag(tag) {
    tag = trim(tag || '');
    var ctx = getCurrentContext();
    var colorHex = tag && TAG_COLORS[tag] ? TAG_COLORS[tag] : null;

    if (ctx.current) {
      ctx.current.tag = tag;

      if (tag) {
        ctx.current.colorMode = 'tag';
        if (colorHex) ctx.current.color = hexToHsl(colorHex);
      } else {
        ctx.current.colorMode = 'custom';
      }

      ctx.current.updatedAt = nowTs();
      saveNotes(ctx.notes);

      if (tagSelect) tagSelect.value = tag;
      syncColorUI(ctx.current.color, ctx.current.colorMode, ctx.current.tag);
      partialRender(true);

      toast(tag ? ('Catégorie : ' + tag) : 'Catégorie retirée.');
      return;
    }

    // draft
    setDraftTag(tag);
    if (tag) {
      setDraftColorMode('tag');
      if (colorHex) setDraftColor(hexToHsl(colorHex));
    } else {
      setDraftColorMode('custom');
    }

    if (tagSelect) tagSelect.value = tag;

    syncColorUI(getDraftColor(), getDraftColorMode(), getDraftTag());
    partialRender(true);
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
        var els = tabsEl.querySelectorAll('.tab');
        var k;
        for (k = 0; k < els.length; k++) {
          els[k].className = els[k].className.replace(/\s?dragging/g, '');
        }
      };

      tab.ondragover = function (e) { e.preventDefault(); };

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

    if (q) {
      list = list.filter(function (n) {
        n = ensureNoteShape(n);
        var t = (n.title || '').toLowerCase();
        var c = (n.content || '').toLowerCase();
        var g = (n.tag || '').toLowerCase();
        return t.indexOf(q) !== -1 || c.indexOf(q) !== -1 || g.indexOf(q) !== -1;
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

    var i, n, card, bar, top, left, title, actions, pin, ren, del, meta, snip, tagBadge;
    var fxDot, fxTop, fxBottom, fxLeft, fxRight;

    for (i = 0; i < list.length; i++) {
      n = ensureNoteShape(list[i]);

      // ✅ FX uniquement si pinned
      card = document.createElement('div');
      card.className = 'note-card' + (n.pinned ? ' fx-fav' : '');

      // Accent FX lié à la couleur de la note (permet un glow cohérent)
      if (n.pinned) {
        card.style.setProperty('--fx-accent', hslToCss(n.color));

        fxDot = document.createElement('div');
        fxDot.className = 'fx-dot';

        fxTop = document.createElement('div');
        fxTop.className = 'fx-line top';

        fxBottom = document.createElement('div');
        fxBottom.className = 'fx-line bottom';

        fxLeft = document.createElement('div');
        fxLeft.className = 'fx-line left';

        fxRight = document.createElement('div');
        fxRight.className = 'fx-line right';

        card.appendChild(fxDot);
        card.appendChild(fxTop);
        card.appendChild(fxBottom);
        card.appendChild(fxLeft);
        card.appendChild(fxRight);
      }

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

      if (n.tag) {
        tagBadge = document.createElement('span');
        tagBadge.className = 'badge';
        tagBadge.textContent = '🏷️ ' + n.tag;
        left.appendChild(tagBadge);
      }

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

      if (!preserveEditorValue) noteEl.value = current.content || '';

      if (tagSelect) tagSelect.value = current.tag || '';
      syncColorUI(current.color, current.colorMode, current.tag);

      pinBtn.textContent = current.pinned ? '⭐ Désépingler' : '⭐ Épingler';
      setDirty(computeDirtyAgainstCurrent(current));
    } else {
      if (!preserveEditorValue) noteEl.value = noteEl.value || '';

      if (tagSelect) tagSelect.value = getDraftTag() || '';
      syncColorUI(getDraftColor(), getDraftColorMode(), getDraftTag());

      pinBtn.textContent = '⭐ Épingler';
      setDirty(computeDirtyAgainstCurrent(null));
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
    renderRecents(loadRecentColors());
  }

  function partialRender(preserveEditorValue) {
    var notes = loadNotes();
    var i;
    for (i = 0; i < notes.length; i++) notes[i] = ensureNoteShape(notes[i]);
    saveNotes(notes);

    renderHeaderMeta(notes);
    renderHome(notes);
    renderEditor(notes, !!preserveEditorValue);

    renderSaveStatus();
    renderRecents(loadRecentColors());
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

    if (activeId) {
      var existing = findNote(notes, activeId);
      if (existing) {
        existing = ensureNoteShape(existing);
        existing.content = content;
        if (existing.autoTitle) existing.title = firstLineTitle(content);
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

    // création depuis brouillon
    var id = String(nowTs());
    var title = firstLineTitle(content);

    var dTag = getDraftTag();
    var dMode = getDraftColorMode();
    var dColor = getDraftColor();

    if (dMode === 'tag' && dTag && TAG_COLORS[dTag]) {
      dColor = hexToHsl(TAG_COLORS[dTag]);
    }

    notes.push({
      id: id,
      title: title,
      content: content,
      color: normalizeColor(dColor),
      updatedAt: nowTs(),
      pinned: false,
      autoTitle: true,
      tag: dTag || '',
      colorMode: (dTag ? dMode : 'custom')
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

    if (getActiveId() === id) {
      setActiveId('');
      noteEl.value = '';
    }

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

    var idx = indexOfNote(notes, id);
    if (idx >= 0) notes.splice(idx, 1);

    var s = splitPinned(notes);
    if (n.pinned) s.pinned.unshift(n);
    else s.normal.unshift(n);

    notes = s.pinned.concat(s.normal);
    saveNotes(notes);

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

    var s = splitPinned(notes);
    var group = from.pinned ? s.pinned : s.normal;

    var ids = [];
    var i;
    for (i = 0; i < group.length; i++) ids.push(group[i].id);

    var fromIdx = -1, toIdx = -1;
    for (i = 0; i < ids.length; i++) {
      if (ids[i] === fromId) fromIdx = i;
      if (ids[i] === toId) toIdx = i;
    }
    if (fromIdx < 0 || toIdx < 0) return;

    ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0]);

    var newGroup = [];
    for (i = 0; i < ids.length; i++) newGroup.push(findNote(group, ids[i]));

    if (from.pinned) notes = newGroup.concat(s.normal);
    else notes = s.pinned.concat(newGroup);

    saveNotes(notes);
    partialRender(true);
    toast('Ordre mis à jour.');
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

          if (map[n.id]) {
            suffix += 1;
            n.id = String(nowTs()) + '-' + String(suffix);
          }
          map[n.id] = true;

          n.title = trim(n.title) || 'Note';
          if (n.title.length > 60) n.title = n.title.slice(0, 60);

          n.tag = trim(n.tag || '');
          if (n.tag.length > 30) n.tag = n.tag.slice(0, 30);

          if (n.colorMode !== 'tag' && n.colorMode !== 'custom') n.colorMode = 'custom';

          if (n.pinned) pinnedAdd.push(n);
          else normalAdd.push(n);

          added += 1;
        }

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

  saveBtn.onclick = saveCurrent;
  clearBtn.onclick = deleteActiveOrClear;

  copyBtn.onclick = copyAll;
  renameBtn.onclick = promptRenameActive;

  pinBtn.onclick = function () {
    var activeId = getActiveId();
    if (!activeId) { toast('Épingle après avoir créé/sélectionné une note.'); return; }
    togglePin(activeId);
  };

  exportBtn.onclick = exportJSON;

  importBtn.onclick = function () {
    if (importFile) importFile.click();
  };

  if (importFile) {
    importFile.onchange = function () {
      var f = importFile.files && importFile.files[0] ? importFile.files[0] : null;
      importJSONFile(f);
      try { importFile.value = ''; } catch (e) {}
    };
  }

  // Hybrid color UX events
  if (tagSelect) {
    tagSelect.onchange = function () {
      applyTag(tagSelect.value || '');
    };
  }

  if (colorPicker) {
    colorPicker.oninput = function () {
      setColorFromHex(colorPicker.value, 'custom', true);
    };
  }

  if (presetPalette) {
    var swatches = presetPalette.querySelectorAll('.swatch');
    var i;
    for (i = 0; i < swatches.length; i++) {
      (function (btn) {
        btn.onclick = function () {
          var hex = btn.getAttribute('data-hex') || '';
          if (!hex) return;
          setColorFromHex(hex, 'custom', true);
        };
      })(swatches[i]);
    }
  }

  if (advancedToggle && advancedSection) {
    advancedToggle.onclick = function () {
      advancedSection.hidden = !advancedSection.hidden;
      advancedToggle.textContent = advancedSection.hidden ? '⚙️ Avancé (HSL)' : '✅ Avancé (HSL)';
    };
  }

  function applyAdvancedSliderChange() {
    var c = normalizeColor({
      h: hueEl.value,
      s: satEl.value,
      l: lightEl.value
    });

    setColorFromHsl(c, 'custom', true);
  }

  if (hueEl) hueEl.oninput = applyAdvancedSliderChange;
  if (satEl) satEl.oninput = applyAdvancedSliderChange;
  if (lightEl) lightEl.oninput = applyAdvancedSliderChange;

  // Dirty + autosave
  noteEl.oninput = function () {
    var notes = loadNotes();
    var activeId = getActiveId();
    var current = activeId ? findNote(notes, activeId) : null;
    if (current) current = ensureNoteShape(current);

    setDirty(computeDirtyAgainstCurrent(current));

    if (activeId) scheduleAutosave();
    else renderSaveStatus();
  };

  // Init
  (function init() {
    var notes = loadNotes();
    if (!notes.length) setView('editor');
    fullRender(false);
  })();
})();
