
// ES5 pour compat iOS 11/12 (pas d'arrow function, pas d'import/export)
(function () {
  var KEY = 'notepad.content.v1';
  var TIME_KEY = 'notepad.savedAt.v1';
  var note = document.getElementById('note');
  var saveBtn = document.getElementById('saveBtn');
  var clearBtn = document.getElementById('clearBtn');
  var statusEl = document.getElementById('status');
  var savedAtEl = document.getElementById('savedAt');
  var saveTimer = null;

  function setStatus(text, color) {
    statusEl.textContent = text;
    statusEl.style.color = color || '#a7f3d0';
  }

  function formatDate(d) {
    // Format simple lisible : JJ/MM/AAAA HH:MM:SS
    var dd = ('0' + d.getDate()).slice(-2);
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var yyyy = d.getFullYear();
    var hh = ('0' + d.getHours()).slice(-2);
    var mi = ('0' + d.getMinutes()).slice(-2);
    var ss = ('0' + d.getSeconds()).slice(-2);
    return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + mi + ':' + ss;
  }

  function saveNow() {
    try {
      var content = note.value || '';
      localStorage.setItem(KEY, content);
      var now = new Date();
      localStorage.setItem(TIME_KEY, now.getTime().toString());
      setStatus('Enregistré', '#34d399'); // vert
      savedAtEl.textContent = 'Dernière sauvegarde : ' + formatDate(now);
      // Met à jour le titre pour retour visuel discret
      document.title = 'Bloc-notes — Enregistré';
    } catch (e) {
      setStatus('Erreur de sauvegarde', '#f87171'); // rouge
    }
  }

  function scheduleSave() {
    setStatus('En cours…', '#fbbf24'); // jaune
    if (saveTimer) { clearTimeout(saveTimer); }
    // debounce 600ms après l’arrêt de frappe
    saveTimer = setTimeout(function () {
      saveNow();
    }, 600);
  }

  function load() {
    try {
      var content = localStorage.getItem(KEY);
      if (content !== null && typeof content !== 'undefined') {
        note.value = content;
      }
      var ts = localStorage.getItem(TIME_KEY);
      if (ts) {
        var time = new Date(parseInt(ts, 10));
        savedAtEl.textContent = 'Dernière sauvegarde : ' + formatDate(time);
        setStatus('Enregistré', '#34d399');
      } else {
        setStatus('—', '#a7f3d0');
      }
    } catch (e) {
      setStatus('Stockage indisponible', '#f87171');
    }
  }

  function clearAll() {
    var confirmClear = window.confirm('Effacer tout le contenu du bloc‑notes ?');
    if (!confirmClear) return;
    note.value = '';
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(TIME_KEY);
      setStatus('Effacé', '#60a5fa'); // bleu
      savedAtEl.textContent = 'Dernière sauvegarde : —';
      document.title = 'Bloc-notes';
    } catch (e) {
      setStatus('Erreur lors de l’effacement', '#f87171');
    }
  }

  // Events
  note.addEventListener('input', scheduleSave);
  saveBtn.addEventListener('click', saveNow);
  clearBtn.addEventListener('click', clearAll);

  // Init
  load();
  // Premier titrage
  if (!document.title) { document.title = 'Bloc-notes'; }
})();
