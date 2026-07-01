// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION GÉNÉRALE DE C.H.E.C.K.-LITE
// ═══════════════════════════════════════════════════════════════════
// Fork allégé de C.H.E.C.K. pour la correction du brevet des collèges.
// ═══════════════════════════════════════════════════════════════════

export const APP_VERSION = "1.0-lite";

// ─── Remarques fixes (non configurables) ─────────────────────────
// id    : lettre utilisée comme clé de stockage
// label : texte affiché sur le bouton
// icon  : emoji affiché à côté du texte
// La logique de malus/bonus associée à chaque remarque est câblée
// en dur dans utils/calculs.js (remarquesAjustement) :
//   - "r" Rédaction  : -1 pt/case, plafonné à -2 pts sur la copie
//   - "g" Guillemets : -1 pt si cochée ≥ 3 fois sur la copie
//   - "b" Bonus      : +0,5 ou +1 pt/case au choix (menu déroulant),
//                      plafonné à +4 pts sur la copie
// Rédaction/Guillemets n'ont de sens que par question (exercices "items") ;
// Bonus n'apparaît que là aussi — pas sur les exercices "brut"/"paliers".
export const REMARQUES_FIXES = [
  { id: "r", label: "Rédaction",  icon: "✏️" },
  { id: "b", label: "Bonus",      icon: "🎁" },
  { id: "g", label: "Guillemets", icon: "“”" },
];
