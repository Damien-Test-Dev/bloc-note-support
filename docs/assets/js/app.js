// Fichier : docs/assets/js/app.js
// Premium + Hybrid color UX (B presets + C recents + A native picker + F categories)
// + Premium FX animation on pinned cards only (Home)
// ES5 compatible (iOS 11/12)
//
// HOTFIX: Defensive DOM bindings to avoid startup crash if some optional nodes are missing.

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

  function byId(id) { return document.getElementById(id); }

  // Views / navigation (optional depending on HTML)
  var homeView = byId('homeView');
  var editorView = byId('editorView');

  var homeBtn = byId('homeBtn');
  var editorBtn = byId('editorBtn');

  // Core editor nodes (required for minimum functionality)
  var tabsEl = byId('tabs');
  var noteEl = byId('note');
  var saveBtn = byId('saveBtn');
  var clearBtn = byId('clearBtn');

  // Optional buttons
  var copyBtn = byId('copyBtn');
  var renameBtn = byId('renameBtn');
  var pinBtn = byId('pinBtn');

  var newBtn = byId('newBtn');
  var newBtnHome = byId('newBtnHome');
  var emptyCreateBtn = byId('emptyCreateBtn');

  // Home UI (optional)
  var notesListEl = byId('notesList');
  var emptyStateEl = byId('emptyState');
  var searchInput = byId('searchInput');
  var notesCountEl = byId('notesCount');

  // Import/export (optional)
  var exportBtn = byId('exportBtn');
  var importBtn = byId('importBtn');
  var importFile = byId('importFile');

  // Color UI (optional)
  var colorPreview = byId('colorPreview');
  var hueEl = byId('hue');
  var satEl = byId('sat');
  var lightEl = byId('light');
  var hueOut = byId('hueOut');
  var satOut = byId('satOut');
  var lightOut = byId('lightOut');

  var tagSelect = byId('tagSelect');
  var colorModeEl = byId('colorMode');
  var colorPicker = byId('colorPicker');

  var presetPalette = byId('presetPalette');
  var recentPalette = byId('recentPalette');

  var advancedToggle = byId('advancedToggle');
  var advancedSection = byId('advancedSection');

  // Status/toast (optional)
  var toastEl = byId('toast');
  var saveStatusEl = byId('saveStatus');

  // ---- Hard guard: if minimum editor nodes are missing, abort (avoid noisy errors)
  if (!tabsEl || !noteEl || !saveBtn || !clearBtn) {
    return;
  }

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
      // options peuvent être partiellement supportées selon browser, donc try/catch.
      return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      try {
        var d2 = new Date(ts);
        return d2.toLocaleString('fr-FR');
      } catch (e2) {
        return '';
      }
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
    return '#' призн; // placeholder to ensure we don't accidentally break? NO.
  }
