# Bloc-notes (GitHub Pages)

Application web **statique** de prise de notes avec **onglets**, **couleurs personnalisées**, **dashboard**, **favoris**, **autosave**, **export/import JSON** et **persistance locale** via `localStorage`.

> Objectif : un bloc-notes moderne, simple à déployer, zéro backend, utilisable immédiatement sur GitHub Pages.

---

## Fonctionnalités

### Notes & onglets
- **Multi-notes** sous forme d’onglets.
- **Création rapide'** : bouton *Nouvelle note* (brouillon).
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
