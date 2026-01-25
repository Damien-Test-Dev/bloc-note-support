```md
# Bloc-notes — Premium (GitHub Pages)

Application web **statique** de prise de notes, orientée productivité : **onglets**, **dashboard**, **couleurs par note**, **renommage**, **drag & drop**, **favoris**, **autosave**, **export/import JSON** — le tout en **zéro backend** via `localStorage`.

> Positionnement : un bloc-notes moderne, rapide, autonome, idéal pour GitHub Pages et les environnements sans serveur.

---

## Démo & accès

- Déploiement typique GitHub Pages : `https://<user>.github.io/<repo>/`
- Dossier source recommandé : `/docs` sur la branche `main`

---

## Fonctionnalités

### Notes & onglets
- Gestion de **notes multiples** via onglets.
- **Nouvelle note** démarre un **brouillon** (aucune note persistée tant que tu ne sauvegardes pas).
- **Sauvegarder** :
  - si une note est active → mise à jour de la note
  - si aucun onglet actif (brouillon) → création d’une nouvelle note + onglet
- **Suppression** de la note active (ou nettoyage du brouillon).

### Dashboard (Home)
- Page “Mes notes” sous forme de **cards**.
- **Recherche** sur titre + contenu.
- Accès instantané à une note (clic sur la card).
- Actions rapides depuis une card :
  - ⭐ pin/unpin
  - ✏️ renommer
  - 🗑️ supprimer

### Titres : auto + manuel
- Par défaut, le titre suit la **première ligne** du contenu (`autoTitle=true`).
- Renommage manuel :
  - bouton **Renommer**
  - ou **double-clic** sur un onglet
- Après renommage : `autoTitle=false` → le titre devient **stable** (plus d’écrasement automatique).

### Couleurs par note (réglage précis)
- Chaque note a une **couleur persistée**.
- Sélection via **sliders HSL** :
  - Teinte (0–360)
  - Saturation (0–100)
  - Luminosité (0–100)
- Si aucun onglet actif (brouillon), la couleur choisie devient la **couleur par défaut** de la prochaine note créée.

### Favoris / Pin ⭐
- Épinglage d’une note en favoris.
- Organisation :
  - Groupe 1 : **favoris**
  - Groupe 2 : **non favoris**
- L’ordre est conservé dans chaque groupe.

### Réorganisation (Drag & Drop)
- Drag & drop des onglets pour réordonner.
- Règle produit : réorganisation **dans le même groupe uniquement** (favoris ↔ favoris, non favoris ↔ non favoris), pour éviter les surprises.

### Autosave + indicateur “non sauvegardé”
- Sur une **note existante** : autosave automatique après saisie (debounce).
- Sur un **brouillon** : pas d’autosave (création explicite via sauvegarde).
- Indicateur en éditeur :
  - ✓ Enregistré / ● Non sauvegardé
  - Autosave actif / Brouillon (sauvegarde manuelle)

### Copier
- Bouton **Copier** : copie l’intégralité du texte de l’éditeur.
- Support :
  - Clipboard API (si disponible)
  - fallback `execCommand('copy')`

### Export / Import JSON
- **Export** : génère un fichier `.json` téléchargeable contenant toutes les notes.
- **Import** : fusionne un fichier `.json` dans l’existant :
  - gestion des collisions d’ID (ID alternatif généré)
  - normalisation des champs manquants (compat)
- Formats acceptés :
  - export v2 `{ version, exportedAt, notes: [...] }`
  - ou tableau direct `[{...}, ...]`

---

## Stack & architecture

- HTML / CSS / JavaScript (sans framework)
- ES5 (compat iOS 11/12)
- Déploiement GitHub Pages
- Persistance `localStorage`

### Structure du repo
```

docs/
index.html          # UI + navigation Home/Editor
assets/
css/
styles.css      # style
js/
app.js          # logique (storage, autosave, dnd, import/export)
README.md

````

---

## Démarrage (local)

### Option 1 — ouvrir directement
- Ouvre `docs/index.html` dans ton navigateur.

> Note : certaines APIs peuvent être limitées en `file://`. Pour reproduire GitHub Pages, préfère un serveur local.

### Option 2 — serveur local (recommandé)
Exemple Python :
```bash
python -m http.server 8080
````

Puis ouvre :

* `http://localhost:8080/docs/`

---

## Déploiement GitHub Pages (recommandé)

1. Settings → Pages
2. Source : Deploy from a branch
3. Branch : `main`
4. Folder : `/docs`
5. Save

---

## Parcours utilisateur (UX)

### Créer une nouvelle note

1. Home → Nouvelle note
2. Écrire dans l’éditeur (brouillon)
3. Sauvegarder
   → création d’un onglet + note persistée

### Modifier une note

1. Sélectionner un onglet
2. Éditer
   → autosave s’exécute automatiquement

### Renommer

* Double-clic onglet
  ou
* Éditeur → Renommer
  → titre manuel stable (autoTitle désactivé)

### Couleur

* Ajuster H/S/L
  → couleur persistée sur la note active (ou utilisée pour le brouillon)

### Favoris

* Cliquer ⭐ depuis Home ou onglet
  → la note passe dans le groupe Favoris

### Réordonner

* Drag & drop dans la barre d’onglets
  → ordre persisté (par groupe)

### Export / Import

* Home → Export JSON
* Home → Import JSON → sélectionner le fichier

---

## Stockage (localStorage)

Clés :

* `notepad.notes.v1` : tableau de notes
* `notepad.active.v1` : id note active
* `notepad.view.v1` : vue (`home` / `editor`)
* `notepad.draftColor.v1` : couleur du brouillon

### Modèle d’une note

```json
{
  "id": "1699999999999",
  "title": "Titre visible",
  "content": "Contenu complet…",
  "color": { "h": 210, "s": 80, "l": 45 },
  "updatedAt": 1700000000000,
  "pinned": false,
  "autoTitle": true
}
```

### Règles d’ordre

* Stockage canonique : favoris d’abord, puis non favoris.
* L’ordre utilisateur est conservé dans chaque groupe.
* `updatedAt` sert à l’affichage, pas à réordonner automatiquement.

---

## Limites & décisions produit

* Stockage local uniquement :

  * pas de synchro multi-appareils
  * vider le stockage navigateur = perte des notes
* L’import JSON sert de stratégie de sauvegarde/restauration.
* Autosave uniquement sur note existante (brouillon volontairement explicite).

---

## Contribuer (optionnel)

### Conventions de commit (recommandées)

* `feat(scope): ...`
* `fix(scope): ...`
* `docs(scope): ...`

### Checklist QA

* Création note → onglet créé, titre ok
* Renommage → titre stable, autoTitle désactivé
* Couleur → persiste, visible onglet + home
* Pin/unpin → bascule groupe, ordre ok
* Drag & drop → persiste dans le groupe
* Autosave → s’exécute sur note active, statut correct
* Export → fichier téléchargé
* Import → merge ok, collisions gérées

---

## Roadmap (idées futures)

* Raccourcis clavier (Ctrl/Cmd+S, Ctrl/Cmd+K, Ctrl/Cmd+P)
* Export sélectif (une note / favoris)
* Thème clair/sombre
* Drag & drop depuis la Home (cards)
* Option sync cloud (si on accepte de sortir du 100% statique)

---

## Licence

Projet personnel. Aucune licence n’est fournie.

```
```
