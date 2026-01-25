```md
# Bloc-notes (GitHub Pages)

Application web **statique** de prise de notes avec **onglets**, **couleurs personnalisées**, **dashboard**, **favoris**, **autosave**, **export/import JSON** et **persistance locale** via `localStorage`.

> Objectif : un bloc-notes moderne, simple à déployer, zéro backend, utilisable immédiatement sur GitHub Pages.

---

## Fonctionnalités

### Notes & onglets
- **Multi-notes** sous forme d’onglets.
- **Création rapide** : bouton *Nouvelle note* (brouillon).
- **Sauvegarde** :
  - si une note est active → **mise à jour**
  - sinon → **création d’une nouvelle note**
- **Suppression** de la note active.

### Titre & renommage
- Par défaut, le titre d’un onglet = **première ligne** de la note (mode automatique).
- **Renommage manuel** :
  - bouton *Renommer*
  - ou **double-clic** sur un onglet
- Une fois renommée manuellement, la note passe en mode **titre manuel** (le titre ne sera plus écrasé).

### Couleurs d’onglets (précision)
- Chaque note a une **couleur dédiée**.
- Sélection via **sliders HSL** (Teinte / Saturation / Luminosité) pour un réglage très précis.
- Si aucune note n’est active (brouillon), la couleur choisie devient la **couleur par défaut de la prochaine note créée**.

### Dashboard (Home)
- Page “Mes notes” sous forme de **cards** stylées.
- **Recherche** (titre + contenu).
- Accès instantané à une note par clic.

### Favoris / Pin ⭐
- Épinglage d’une note en favoris.
- Les notes épinglées sont regroupées **en tête**.
- **L’ordre est conservé** dans chaque groupe (favoris / non favoris).

### Réorganisation Drag & Drop
- Réordonner les onglets par **glisser-déposer**.
- Règle volontaire : réorganisation **dans le même groupe uniquement**
  - favoris entre favoris
  - non favoris entre non favoris

### Autosave + indicateur “non sauvegardé”
- Sur une **note existante** : autosave au fil de la saisie (avec debounce).
- Sur un **brouillon** : pas d’autosave (choix produit volontaire), sauvegarde manuelle pour créer une note.
- Indicateur clair :
  - **Enregistré** / **Non sauvegardé**
  - mode **Autosave actif** / **Brouillon**

### Copier
- Bouton *Copier* : copie **tout le texte** de l’éditeur.
- Supporte Clipboard API + fallback `execCommand('copy')` si nécessaire.

### Export / Import JSON
- Export JSON : télécharge un fichier contenant toutes les notes.
- Import JSON : importe un fichier `.json`, fusionne les notes.
- Gestion des collisions d’ID (un nouvel ID est généré si nécessaire).

---

## Stack & Architecture

- **HTML / CSS / JavaScript** (sans framework)
- Compatible **GitHub Pages**
- **ES5** (compat iOS 11/12)
- Persistance : `localStorage`

### Structure du repo
```

docs/
index.html
assets/
css/
styles.css
js/
app.js
README.md

````

---

## Déploiement sur GitHub Pages

### Option recommandée
1. Aller dans **Settings → Pages**
2. **Source** : Deploy from a branch
3. **Branch** : `main`
4. **Folder** : `/docs`
5. Save

Ton site sera servi via une URL du type :
`https://<user>.github.io/<repo>/`

---

## Utilisation

### Créer une nouvelle note
1. Clique sur **Nouvelle note**
2. Écris dans l’éditeur
3. Clique sur **Sauvegarder**
→ un onglet est créé

### Renommer une note
- Double-clique sur l’onglet  
ou
- Clique sur **Renommer** (dans l’éditeur)

### Changer la couleur d’une note
- Ajuste les sliders **H / S / L**
- La couleur est appliquée à la note active (persistée)

### Épingler une note ⭐
- Clique sur l’étoile dans l’onglet  
ou
- Clique sur **Épingler** dans l’éditeur

### Réordonner
- Drag & drop sur les onglets
- Réordonnage possible uniquement dans le même groupe (favoris/non favoris)

### Export / Import
- Home → **Export JSON**
- Home → **Import JSON** puis sélection du fichier `.json`

### Copier le contenu
- Clique sur **Copier**
→ tout le texte est copié dans le presse-papiers

---

## Données stockées (localStorage)

Clés utilisées :
- `notepad.notes.v1` : liste des notes
- `notepad.active.v1` : id note active
- `notepad.view.v1` : vue courante (`home` / `editor`)
- `notepad.draftColor.v1` : couleur par défaut du brouillon

### Modèle de note (exemple)
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
````

---

## Contraintes / choix produit assumés

* **Pas de backend** : toutes les notes sont locales au navigateur.
* **Brouillon sans autosave** : création volontairement explicite via “Sauvegarder”.
* **Drag & drop limité** :

  * ne traverse pas favoris / non favoris
  * évite des “surprises” d’organisation

---

## Roadmap (optionnelle)

* Raccourcis clavier (Ctrl/Cmd+S, Ctrl/Cmd+K)
* Export sélectif (une note / favoris)
* Thème clair/sombre
* Réorganisation dans la Home (drag & drop sur cards)
* Sync cloud (si on accepte de sortir du 100% statique)

---

## Licence

À définir (MIT recommandé pour un projet open source).

```
```
