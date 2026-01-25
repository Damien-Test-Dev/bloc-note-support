## Chemin complet GitHub

`README.md`

## Message de commit

`docs(readme): update documentation with hybrid color UX (presets/recents/picker/tags) and agile increments`

```md
# Bloc-notes — Premium (GitHub Pages)

Application web **statique** de prise de notes orientée productivité : **onglets**, **dashboard**, **renommage**, **drag & drop**, **favoris**, **autosave**, **export/import JSON**, et désormais un **sélecteur de couleur ultra simple** (catégories + presets + récents + picker natif + HSL avancé).  
Zéro backend : tout est stocké en **localStorage**.

---

## Démo & déploiement

- URL GitHub Pages : `https://<user>.github.io/<repo>/`
- Source recommandée : branche `main`, dossier `/docs`

---

## Fonctionnalités (à jour)

### 1) Notes & onglets
- Multi-notes via onglets.
- **Nouvelle note** = démarre un **brouillon** (pas de note persistée tant que tu ne sauvegardes pas).
- **Sauvegarder** :
  - si une note est active → mise à jour
  - si brouillon → création d’une nouvelle note + onglet
- **Suppression** de la note active (ou nettoyage du brouillon).

### 2) Dashboard (Home)
- Page “Mes notes” en **cards**.
- Recherche sur **titre + contenu + catégorie**.
- Actions rapides sur card : ⭐ épingler, ✏️ renommer, 🗑️ supprimer.
- Accès instantané à une note (clic).

### 3) Titre auto + renommage manuel
- Par défaut : titre = première ligne (`autoTitle=true`).
- Renommage :
  - bouton **Renommer**
  - ou **double-clic** sur un onglet
- Après renommage : `autoTitle=false` (titre stable, non écrasé par le contenu).

### 4) Favoris / Pin ⭐
- Épinglage des notes.
- Organisation canonique :
  - Favoris d’abord
  - Non favoris ensuite
- Ordre conservé à l’intérieur de chaque groupe.

### 5) Réorganisation (Drag & Drop)
- Drag & drop des onglets.
- Règle produit : réordonnage **dans le même groupe uniquement** (favoris ↔ favoris, non favoris ↔ non favoris) pour maintenir une UX prévisible.

### 6) Autosave + indicateur d’état
- Sur une **note existante** : autosave automatique (debounce).
- Sur un **brouillon** : pas d’autosave (création volontaire via sauvegarde).
- Indicateur en éditeur :
  - ✓ Enregistré / ● Non sauvegardé
  - Autosave actif / Brouillon (sauvegarde manuelle)

### 7) Copier
- Bouton **Copier** : copie l’intégralité du texte.
- Supporte Clipboard API et fallback navigateur.

### 8) Export / Import JSON
- Export : fichier `.json` téléchargeable (toutes les notes).
- Import : fusion + normalisation + gestion collisions d’ID.
- Formats supportés :
  - v2 `{ version, exportedAt, notes: [...] }`
  - ou tableau direct `[{...}, ...]`

---

## Nouveau : Couleur “hybride” (B + C + A + F)

Objectif : permettre au user de choisir une couleur **en 1 clic**, tout en gardant une option “précision” pour les power users.

### Modes disponibles
1. **Catégorie (F)**  
   Sélection d’une catégorie → la couleur est appliquée automatiquement (mode `tag`).  
   Catégories disponibles :
   - Pro
   - Perso
   - Urgent
   - Idées
   - À lire
   - Archive

2. **Presets (B)**  
   Palette de pastilles harmonisées → 1 clic = couleur appliquée (mode `custom`).

3. **Récents (C)**  
   Les **8 dernières couleurs** utilisées (auto-alimenté) → 1 clic pour réutiliser.

4. **Picker natif (A)**  
   `input[type=color]` → simple, rapide, précis.

5. **Avancé (HSL)**  
   Section HSL masquée par défaut → activation manuelle via bouton “Avancé”.

### Règle importante (brouillon vs note)
- Si **note active** : la couleur et/ou la catégorie s’applique **à la note** (persistée).
- Si **brouillon** : la couleur/catégorie devient le **default** de la prochaine note créée.

---

## Stack & architecture

- HTML / CSS / JavaScript (sans framework)
- ES5 (compat iOS 11/12)
- Déploiement GitHub Pages
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

## Démarrage local

### Option simple
- Ouvrir `docs/index.html`

### Option recommandée (reproduit GitHub Pages)
```bash
python -m http.server 8080
````

Puis :

* `http://localhost:8080/docs/`

---

## Stockage (localStorage)

### Clés

* `notepad.notes.v1` : tableau de notes
* `notepad.active.v1` : id note active
* `notepad.view.v1` : vue (`home` / `editor`)
* `notepad.draftColor.v1` : couleur brouillon (HSL)
* `notepad.draftTag.v1` : catégorie brouillon
* `notepad.draftColorMode.v1` : mode brouillon (`custom` / `tag`)
* `notepad.recentColors.v1` : historique couleurs récentes (HEX)

### Modèle d’une note

```json
{
  "id": "1699999999999",
  "title": "Titre visible",
  "content": "Contenu complet…",
  "color": { "h": 210, "s": 80, "l": 45 },
  "updatedAt": 1700000000000,
  "pinned": false,
  "autoTitle": true,
  "tag": "Pro",
  "colorMode": "tag"
}
```

### Invariants

* Stockage canonique : favoris puis non favoris.
* Ordre utilisateur conservé dans chaque groupe.
* `updatedAt` sert à l’affichage, pas au tri automatique.

---

## Limites & décisions produit

* Stockage local :

  * pas de sync multi-appareils
  * effacer le stockage navigateur = perte des notes
* Import JSON = stratégie de backup/restauration.
* Autosave uniquement sur note existante (brouillon = action explicite).

---

## Présentation Agile/Scrum — incréments (release par sprints)

> Vision : livrer un bloc-notes “simple à l’usage” mais “solide en mécanique”, avec une montée en gamme progressive.

### Sprint 0 — Foundation (MVP)

**Objectif** : l’app doit fonctionner, être stable, et déployable sur GitHub Pages.
**Incrément livré**

* UI de base
* Éditeur de texte
* Sauvegarde / effacement
* Persistance `localStorage`

**DoD**

* Pas d’erreurs console
* Données persistées après refresh

---

### Sprint 1 — Multi-notes (Core Product)

**Objectif** : permettre une vraie gestion multi-notes.
**Incrément livré**

* Onglets multiples
* Création de note à la sauvegarde (depuis brouillon)
* Titre basé sur première ligne

**DoD**

* Création illimitée de notes
* Switch onglet fiable

---

### Sprint 2 — Navigation & Dashboard (UX)

**Objectif** : accélérer l’accès aux notes et la lisibilité du parc.
**Incrément livré**

* Home page (liste/cards)
* Recherche
* Accès direct à une note

**DoD**

* Navigation Home/Editor stable
* Recherche performante sur un volume raisonnable

---

### Sprint 3 — Premium Ops (Productivité)

**Objectif** : piloter le contenu comme un outil pro.
**Incrément livré**

* Renommage manuel (et verrouillage du titre)
* Favoris (pin)
* Drag & drop (réordonnage)
* Export/Import JSON
* Autosave + indicateur d’état
* Copier le contenu

**DoD**

* Pas de pertes de données lors des actions
* Import résilient (collisions gérées)

---

### Sprint 4 — Color UX Hybrid (Simplicité + précision)

**Objectif** : rendre le choix de couleur évident, sans “panneau technique”.
**Incrément livré**

* Catégories avec couleurs (mode tag)
* Presets en 1 clic
* Couleurs récentes (8)
* Picker natif
* HSL avancé “opt-in”

**DoD**

* Choisir une couleur en < 2 secondes (presets / tag / récents)
* Couleur persistée par note et reflétée UI (onglets + home)

---

## Licence

Projet personnel. Aucune licence n’est fournie.

```
```
