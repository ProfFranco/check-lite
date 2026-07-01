# CONTEXTE_CHECK_LITE

# Contexte projet — C.H.E.C.K.-lite

**C.H.E.C.K.-lite** est un fork allégé de **C.H.E.C.K.** (Correcteur Hautement Efficace avec Cases à Kocher), conçu pour la correction du **brevet des collèges**. Là où CHECK est un outil complet destiné à un enseignant de classes préparatoires (compétences ARNV, coefficients, exports HTML/LaTeX, synchro cloud, carte stellaire, audio...), CHECK-lite retire tout ce qui ne sert pas ce cas d'usage précis et ajoute deux types d'exercice adaptés au brevet (note brute pour la dictée, notation par paliers pour les grilles de compétences).

Le dépôt local vit dans `/Applications/check-app-lite`, indépendant du dépôt `check-app` d'origine (git history séparé, pas un fork GitHub). Dépôt distant prévu : `https://github.com/ProfFranco/check-lite`, publié sur `https://ProfFranco.github.io/check-lite`.

---

## Stack technique

Identique à CHECK : **React** (create-react-app), JavaScript vanilla dans les utils, **IndexedDB** (pas de backend), **PWA** installable. Aucune dépendance à LaTeX/XeLaTeX ni weasyprint — CHECK-lite ne génère aucun export (voir plus bas).

---

## Structure du projet

```other
check-app-lite/
├── public/
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js                  ← Service Worker PWA (network-first, fallback cache)
│   └── logos/
├── .github/workflows/deploy.yml  ← Build + déploiement GitHub Pages (branche gh-pages)
└── src/
    ├── index.js
    ├── App.jsx                ← Composant principal (~1620 lignes)
    ├── AccueilTab.jsx         ← Tableau de bord (accueil au clic logo)
    ├── SauvegardeTab.jsx      ← Onglet Sauvegarde (très réduit, voir plus bas)
    ├── OverviewTab.jsx        ← Onglet Vue d'ensemble (tableau croisé)
    ├── components/
    │   └── Charts.jsx         ← Histo, PBar (histogramme + barre de progression)
    ├── config/
    │   ├── settings.js        ← APP_VERSION, REMARQUES_FIXES (3 remarques en dur)
    │   └── theme.js           ← Thème clair/sombre/jeune (palettes)
    └── utils/
        ├── calculs.js         ← Scores, remarques, note brute totale — moteur de calcul complet
        ├── db.js              ← Persistance IndexedDB (open, load, save, profils)
        └── backup.js (+ test) ← Sauvegarde/restauration multi-profils
```

Fichiers **supprimés** par rapport à CHECK (n'existent pas dans ce dépôt) : `ExportTab.jsx`, `SettingsModal.jsx`, `HelpTab.jsx`, `utils/html.js`, `utils/latex.js`, `utils/starmap.js`, `utils/sync.js` (+ test), `utils/filelink.js` (+ test), `utils/helpers.js`, `components/AudioRecorder.jsx`, `components/DebugModal.jsx`, `components/SyncIndicator.jsx`, `utils/calculs.test.js` (obsolète, jamais réécrit pour la nouvelle API).

> **Note :** `src/hooks/useAppState.js` est présent mais inutilisé (artefact hérité de CHECK, jamais nettoyé).

---

## Fonctionnalités actuelles

- **Onglet Préparation** : créer des devoirs et des exercices de **3 types** (voir section dédiée), assigner des points/barèmes, importer élèves par CSV, réordonnancement exercices/questions via ▲/▼, confirmation avant toute suppression. Chaque item d'une question "items" a un champ optionnel `hint` (indice de correction), affiché en Correction via une icône ⓘ.
- **Onglet Correction** : navigation élève par élève (flèches ◂/▸ dans le héros), recherche 🔍, **ajout d'élève à la volée** (bouton "+", modale Nom/Prénom, l'élève devient immédiatement corrigeable). Cochage des items pour les exercices "items", saisie directe de note pour "brut", sélection de palier + bonus/malus manuel pour "paliers". Trois remarques fixes (Rédaction/Bonus/Guillemets) avec plafonds automatiques. Malus/bonus manuel global par élève, en points.
  - **Desktop** (largeur ≥ 1024px) : toutes les questions/compétences d'un exercice affichées en même temps ; navigation "◄ Ex. préc. / Ex. suiv. ►".
  - **Tablette/mobile** (< 1024px) : une seule question ou compétence affichée à la fois, avec indicateur "Question X/N" ou "Compétence X/N", boutons "◄ Précédent / Suivant ►", et swipe gauche/droite. Le passage au bout de la liste avance automatiquement à l'exercice suivant, puis à l'élève suivant.
- **Onglet Vue d'ensemble** : tableau croisé élèves × questions/items (granularité togglable), ou une colonne unique pour les exercices "brut"/"paliers". Toggle "✓ Corrigés seulement", tri par clic sur colonne, clic sur cellule → bascule vers Correction.
- **Onglet Stats** : deux sous-onglets seulement — **Général** (moyenne/médiane/min/max/σ en points bruts, histogramme de distribution par point) et **Exercices** (histogramme + détail par question pour les exercices "items", histogramme seul pour "brut"/"paliers"). Pas de sous-onglet Classement, pas de compétences, pas de progression multi-DS.
- **Onglet Sauvegarde** : réduit à deux boutons — "💾 Sauvegarde complète" (tous profils, JSON) et "📂 Restaurer une sauvegarde" (modes Remplacer/Fusionner). Les boutons 💾 Sauver / 📂 Charger (JSON du profil courant) restent dans l'en-tête, hors de cet onglet.
- **Tableau de bord** (`AccueilTab`) : cartes stats globales (DS archivés, élèves suivis, taux de correction — pas de moyenne générale inter-DS, voir plus bas), dernier DS + historique (moyenne/étendue en points bruts, par DS). Pied de page réduit à la version de l'app (plus de lien CHANGELOG).
- **Zoom interface**, **3 thèmes** (clair/sombre/jeune), **multi-profils** : inchangés par rapport à CHECK.
- **Mode debug, Aide, À propos** : supprimés (pas adaptés à cet usage).

### Ce qui n'existe **pas** dans CHECK-lite

Onglets Résultats individuels et Export (aucune génération de rapport HTML/LaTeX/CSV/ZIP) ; synchronisation GitHub et fichier lié auto-réécrit ; audio ; carte stellaire ; compétences ARNV (A/N/R/V, radar) ; système de features/presets par DS (♙♜♔♞) ; questions pièges/difficiles ; bonus exercice complet 🏆 ; coefficients d'exercice ; items négatifs ; question bonus 🎁 ; remarques personnalisables (custom/activation/réordonnancement) ; les 6 méthodes de normalisation ; groupes (tiers-temps + pédagogiques) ; absences par DS ; commentaire libre élève ; note privée 🔒 ; perles 💎 ; mode debug ; Aide ; À propos.

---

## Les 3 types d'exercice — `exercise.type`

C'est la différence structurelle majeure avec CHECK. Chaque exercice porte un champ `type` :

### `"items"` (défaut, comportement historique de CHECK)

```other
{ id, title, type: "items", questions: [{ id, label, items: [{ id, label, points, hint? }] }] }
```

Cochage d'items, case "traitée (0 pt)", bouton tout cocher/décocher si ≥ 2 items positifs.

### `"brut"` — Note brute (ex. dictée)

```other
{ id, title, type: "brut", bareme: number }
```

Pas de questions/items : l'enseignant saisit directement une note, bornée `[0, bareme]`. Stockage : `notesBrutes[studentId__exerciseId] = number`.

### `"paliers"` — Par Paliers (grilles de compétences du brevet)

```other
{ id, title, type: "paliers", competences: [{ id, label, paliers: [{ indice, bareme }, ×4] }] }
```

Chaque **compétence** est locale à l'exercice (aucun rapport avec l'ancien système ARNV de CHECK — simple critère de correction défini librement par l'enseignant). 4 paliers par compétence, chacun avec un `indice` (texte d'aide affiché dans la cellule) et un `bareme` (points).

- **Sélection** : exclusive par compétence — un seul palier actif ; recliquer désélectionne. Stockage : `palierGrades[studentId__exerciseId__competenceId] = index (0-3)`.
- **Bonus/malus manuel** : en Correction, un champ numérique par compétence permet d'ajuster le score du palier sélectionné. Borné : ne peut pas descendre sous 0, ne peut pas dépasser le barème du palier le plus élevé de la compétence. Stockage : `palierAjust[studentId__exerciseId__competenceId] = points (+/-)`.
- **Affichage** : tableau complet (desktop) ou une compétence à la fois (tablette/mobile, voir navigation Correction).

### Moteur de calcul (`utils/calculs.js`)

`exerciseScore(grades, notesBrutes, palierGrades, palierAjust, studentId, exercise)` dispatche selon `exercise.type` et retourne `{ earned, total }`. Pour `"paliers"` :

```js
earned += clamp(baremeDuPalierSélectionné + ajustement, 0, baremeMaxDeLaCompetence);
```

`studentTotal`, `examTotal`, `exercisePctAbsolute`, `exercisePctRelative` agrègent sur tous les types d'exercice d'un DS sans distinction — **inconditionnel**, comme dans CHECK (`calculs.js` ne lit jamais un état d'UI).

---

## Remarques fixes et note brute totale (pas de /100)

Trois remarques **non configurables** (`REMARQUES_FIXES` dans `config/settings.js`), attachées par question (exercices "items") ou par exercice entier (exercices "brut"/"paliers", qui jouent le rôle de "question unique" pour le stockage des remarques — clé `remarks[studentId__targetId]`, `targetId` = id de question ou d'exercice) :

| Remarque | Effet |
|---|---|
| ✏️ Rédaction | −1 pt par case cochée, plafonné à **−2 pts** sur la copie |
| “” Guillemets | −1 pt **si cochée ≥ 3 fois** sur la copie (flat, non cumulatif au-delà) |
| 🎁 Bonus | +1 pt par case cochée, plafonné à **+4 pts** sur la copie |

`remarquesAjustement(remarks, studentId, exam)` retourne l'ajustement net en points. Le **malus manuel** (`malusManuel[studentId]`, en points, +/-) s'additionne au même ajustement.

**Il n'y a pas de note normalisée /100 dans CHECK-lite** (retirée après le round 3 — voir historique). La seule note qui fait foi est la **note brute totale** : `clamp(studentTotal(exam) + remarquesAjustement + malusManuel, 0, +∞)`, affichée partout en points (`X / maxTotal pts`) — héros Correction (grand nombre dominant, plus de radar ni de %), classement (par points, équivalent à un tri par % puisque le barème est le même pour tous), Stats Général (moyenne/médiane/min/max/σ en points, histogramme de distribution par point), Vue d'ensemble (déjà en points), Accueil (moyenne/étendue par DS en points — la carte "Moyenne générale" inter-DS a été retirée du tableau de bord, un total brut n'ayant de sens que DS par DS puisque les barèmes diffèrent d'un DS à l'autre).

**Cas d'usage brevet — rédaction à deux barèmes** : si l'épreuve de rédaction a deux barèmes possibles selon l'élève, on crée simplement **deux exercices distincts** (ex. "Rédaction — barème A" et "Rédaction — barème B") et on ne corrige que celui qui s'applique à chaque élève ; l'autre reste à 0 pour cet élève. Aucun mécanisme d'exercice "non applicable" n'existe — c'est un choix assumé pour rester simple, rendu possible par le fait que la note ne soit plus un pourcentage (un exercice non fait qui reste à 0 fausserait fortement une note /100, beaucoup moins un total en points brut lu avec le détail par exercice à côté).

---

## Navigation Correction — desktop vs tablette/mobile

Nouveauté propre à CHECK-lite : sur petit écran, l'onglet Correction n'affiche plus toutes les questions/compétences d'un exercice en même temps mais **une seule à la fois**, pour un usage tablette pendant la surveillance du brevet.

- **État** : `qi` (index de la question ou compétence courante dans l'exercice affiché), en plus de `si` (élève) et `ei` (exercice).
- **Seuil** : `isTouch = winW < 1024` (couvre tablette et mobile).
- **Navigation pas-à-pas** (`goNextStep`/`goPrevStep` dans `App.jsx`) : avance `qi`, puis à la fin de la liste avance `ei` (reset `qi` à 0, ou au dernier index de la liste en arrière), puis à la fin des exercices avance `si` (élève suivant/précédent). Déclenchée par les boutons "◄ Précédent / Suivant ►" et par le **swipe** (gauche = suivant, droite = précédent) sur le conteneur principal.
- **Desktop** (`!isTouch`) : comportement historique inchangé — toutes les questions/compétences listées, boutons "◄ Ex. préc. / Ex. suiv. ►" qui avancent d'un exercice entier.
- Tout changement direct de `si`/`ei` (clic sur un onglet d'exercice, flèches du héros, recherche, ajout d'élève, raccourcis clavier, Vue d'ensemble → Correction) réinitialise `qi` à 0.

---

## Modèle de données (état React)

```other
exams        : [{ id, name, nomDS, dateDS,
               exercises: [{ id, title, type: "items"|"brut"|"paliers",
                 // type "items" :
                 questions: [{ id, label, items: [{ id, label, points, hint? }] }],
                 // type "brut" :
                 bareme: number,
                 // type "paliers" :
                 competences: [{ id, label, paliers: [{ indice, bareme }, ×4] }]
               }] }]
students     : [{ id, nom, prenom }]
grades       : { "studentId__itemId": true, "treated_studentId_questionId": true }
notesBrutes  : { "studentId__exerciseId": number }
palierGrades : { "studentId__exerciseId__competenceId": index (0-3) }
palierAjust  : { "studentId__exerciseId__competenceId": points (+/-) }
remarks      : { "studentId__targetId": ["r"|"b"|"g", ...] }   ← targetId = questionId ou exerciseId
malusManuel  : { "studentId": points (+/-) }

Persistés en IndexedDB (hors buildAppState, éphémères) :
collapsed, collapsedExams, featOpen, showSearch, showMore, showDsMenu, si/ei/qi, etc.
```

`buildAppState()` / `restoreState()` (uniques, dans `App.jsx`) couvrent : `exams, students, grades, remarks, notesBrutes, palierGrades, palierAjust, activeExamId, nomDS, dateDS, malusManuel, uiScale, appTheme, mode`. Sauvegarde debounce 500ms.

Meta-base `check-app-profiles` séparée (multi-profils), inchangée par rapport à CHECK.

---

## Points techniques hérités de CHECK (toujours valables)

- **Hooks pré-transpilés** : `var _x = useState(...); var setX = _x[1]; var x = _x[0];` — ne jamais réordonner ni moderniser en `const [x, setX] = useState(...)`.
- **`buildAppState` ↔ deps `useEffect`** : tout nouvel état persisté doit être ajouté aux deux endroits (fonction `buildAppState` + tableau de deps du `useEffect` de sauvegarde).
- **`calculs.js` inconditionnel** : aucune fonction n'y lit un état d'UI ou de feature flag (il n'y a d'ailleurs plus de feature flags du tout dans CHECK-lite).
- **`paletteTheme` / thèmes** : `theme.js` conservé tel quel (3 palettes), bien que certaines clés historiques (`negBg`, `compColors`...) ne soient plus consommées par aucun composant depuis la suppression des items négatifs et des compétences ARNV — laissées en l'état, inoffensives.

---

## Déploiement — GitHub Pages

- Dépôt prévu : `github.com/ProfFranco/check-lite` (public).
- `.github/workflows/deploy.yml` : `npm ci` → `npm run build` (`PUBLIC_URL=/check-lite`) → `peaceiris/actions-gh-pages@v4` publie `build/` sur la branche `gh-pages` à chaque push sur `main`.
- `package.json.homepage` : `https://ProfFranco.github.io/check-lite`.
- Alternative manuelle : `npm run deploy` (script `gh-pages -d build` déjà présent, hérité de CHECK).
- Le token GitHub utilisé pour créer le dépôt et pousser (PAT classique, scopes `repo` + `workflow`) est distinct du `GITHUB_TOKEN` automatique utilisé par le workflow pour publier sur `gh-pages`.

---

## Historique

Fork créé à partir de `check-app` (CHECK v1.42) en juillet 2026 :
1. Retrait de fonctionnalités + ajout des types d'exercice "brut"/"paliers" + remarques fixes en points + note/100.
2. Correctifs : bug `updPath`, suppression Classement/Aide/À propos, navigation tablette/mobile pas-à-pas.
3. Bonus/malus manuel par compétence (paliers), suppression Aide/À propos, doc de référence.
4. **Retrait complet de la note /100** : seule la note brute totale fait foi (voir section dédiée) ; carte "Moyenne générale" retirée de l'Accueil.

Pas de journal de session détaillé comme `CONTEXTE_CHECK.md` (pas nécessaire à ce stade — projet plus petit, un seul contributeur). À réévaluer si le projet grandit.
