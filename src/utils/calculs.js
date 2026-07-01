// ═══════════════════════════════════════════════════════════════════
// FONCTIONS DE CALCUL — CHECK-lite
// ═══════════════════════════════════════════════════════════════════
//
// Moteur de score pour les 3 types d'exercice : "items" (questions/items
// classique), "brut" (note brute directe, ex. dictée) et "paliers"
// (compétences locales à l'exercice notées par palier 1-4).
// Aucune dépendance React.
// ═══════════════════════════════════════════════════════════════════

// ─── Utilitaires de base ─────────────────────────────────────────

/** Génère un identifiant unique court */
export const uid = () => Math.random().toString(36).slice(2, 10);

/** Clé de stockage pour la note d'un item d'un élève, ou pour la note
 *  brute d'un exercice "brut" (studentId__exerciseId) */
export const gradeKey = (studentId, itemId) => studentId + "__" + itemId;

/** Clé de stockage pour les remarques d'une question (ou d'un exercice
 *  brut/paliers, qui joue le rôle de « question unique ») d'un élève */
export const remarkKey = (studentId, questionId) => studentId + "__" + questionId;

/** Clé de stockage pour les points traités d'une question d'un élève */
export function treatedKey(studentId, questionId) {
  return "treated_" + studentId + "_" + questionId;
}

/** Clé de stockage pour un palier sélectionné : studentId__exerciseId__competenceId */
export function palierKey(studentId, exerciseId, competenceId) {
  return studentId + "__" + exerciseId + "__" + competenceId;
}

/** Borne une valeur entre min et max */
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Scores par question / exercice ──────────────────────────────

/** Score d'un élève sur une question à items : { earned, total, treated } */
export function questionScore(grades, studentId, question) {
  let earned = 0, total = 0;
  for (const item of question.items) {
    const pts = parseFloat(item.points) || 0;
    total += pts;
    if (grades[gradeKey(studentId, item.id)]) earned += pts;
  }
  const wasTreated = earned > 0 || !!grades[treatedKey(studentId, question.id)];
  return { earned, total, treated: wasTreated };
}

/** Barème maximum d'une compétence "par paliers" (le palier le plus haut) */
function competenceMaxBareme(competence) {
  return (competence.paliers || []).reduce((m, p) => Math.max(m, parseFloat(p.bareme) || 0), 0);
}

/** Score d'un élève sur un exercice, quel que soit son type : { earned, total } */
export function exerciseScore(grades, notesBrutes, palierGrades, studentId, exercise) {
  if (exercise.type === "brut") {
    const val = notesBrutes[gradeKey(studentId, exercise.id)];
    return { earned: typeof val === "number" ? val : 0, total: parseFloat(exercise.bareme) || 0 };
  }
  if (exercise.type === "paliers") {
    let earned = 0, total = 0;
    for (const c of (exercise.competences || [])) {
      total += competenceMaxBareme(c);
      const idx = palierGrades[palierKey(studentId, exercise.id, c.id)];
      const p = (typeof idx === "number") ? c.paliers[idx] : null;
      if (p) earned += parseFloat(p.bareme) || 0;
    }
    return { earned, total };
  }
  // Type "items" (défaut)
  let earned = 0, total = 0;
  for (const q of exercise.questions) {
    const s = questionScore(grades, studentId, q);
    earned += s.earned;
    total += s.total;
  }
  return { earned, total };
}

/** Score total brut d'un élève sur l'examen (tous types d'exercice confondus) */
export function studentTotal(grades, notesBrutes, palierGrades, studentId, exam) {
  return exam.exercises.reduce((sum, ex) => sum + exerciseScore(grades, notesBrutes, palierGrades, studentId, ex).earned, 0);
}

/** Barème maximum de l'examen (tous types d'exercice confondus) */
export function examTotal(exam) {
  return exam.exercises.reduce((sum, ex) => {
    if (ex.type === "brut") return sum + (parseFloat(ex.bareme) || 0);
    if (ex.type === "paliers") return sum + (ex.competences || []).reduce((s, c) => s + competenceMaxBareme(c), 0);
    return sum + ex.questions.reduce((sq, q) => sq + q.items.reduce((si, it) => si + (parseFloat(it.points) || 0), 0), 0);
  }, 0);
}

/** Note ramenée sur 100 (règle de trois simple) */
export function noteSur100(earned, total) {
  return total === 0 ? 0 : (earned / total) * 100;
}

// ─── Remarques fixes : ajustement en points ──────────────────────

/** Liste des identifiants "porteurs de remarques" d'un exam : une
 *  question par exercice "items", ou l'exercice lui-même pour les
 *  exercices "brut"/"paliers" (qui n'ont pas de sous-questions). */
function remarkTargetsForExam(exam) {
  const ids = [];
  exam.exercises.forEach(function(ex) {
    if (ex.type === "brut" || ex.type === "paliers") ids.push(ex.id);
    else (ex.questions || []).forEach(function(q) { ids.push(q.id); });
  });
  return ids;
}

/**
 * Ajustement en points dû aux remarques fixes pour un élève :
 *   - "r" Rédaction  : -1 pt/case, plafonné à -2 pts sur la copie
 *   - "g" Guillemets : -1 pt si cochée ≥ 3 fois sur la copie
 *   - "b" Bonus      : +1 pt/case, plafonné à +4 pts sur la copie
 * Retourne un nombre (peut être négatif) à ajouter au total brut.
 */
export function remarquesAjustement(remarks, studentId, exam) {
  const ids = remarkTargetsForExam(exam);
  let countR = 0, countG = 0, countB = 0;
  ids.forEach(function(id) {
    const r = remarks[remarkKey(studentId, id)];
    if (!r) return;
    r.forEach(function(rid) {
      if (rid === "r") countR++;
      else if (rid === "g") countG++;
      else if (rid === "b") countB++;
    });
  });
  const malusRedaction = Math.min(2, countR);
  const malusGuillemets = countG >= 3 ? 1 : 0;
  const bonus = Math.min(4, countB);
  return bonus - malusRedaction - malusGuillemets;
}

// ─── Scores par exercice (pour le radar "classement" en Stats) ───

/** % de réussite absolu par exercice */
export function exercisePctAbsolute(grades, notesBrutes, palierGrades, studentId, exam) {
  return exam.exercises.map(ex => {
    const s = exerciseScore(grades, notesBrutes, palierGrades, studentId, ex);
    return { id: ex.id, label: ex.title.replace(/^Exercice\s*/i, "Ex.").slice(0, 12), pct: s.total > 0 ? s.earned / s.total : 0 };
  });
}

/** % relatif par exercice (par rapport au meilleur de la classe) */
export function exercisePctRelative(grades, notesBrutes, palierGrades, studentId, exam, students) {
  return exam.exercises.map(ex => {
    const maxScore = Math.max(...students.map(s => exerciseScore(grades, notesBrutes, palierGrades, s.id, ex).earned), 0.001);
    return { id: ex.id, label: ex.title.replace(/^Exercice\s*/i, "Ex.").slice(0, 12), pct: exerciseScore(grades, notesBrutes, palierGrades, studentId, ex).earned / maxScore };
  });
}

// ─── Import CSV d'élèves ─────────────────────────────────────────

/**
 * Parse un texte CSV et retourne un tableau d'élèves.
 * Formats acceptés :  NOM;Prénom  ou  NOM,Prénom  ou  NOM\tPrénom  ou  NOM Prénom
 */
export function importCSV(text) {
  return text.split(/\r?\n/).filter(l => l.trim()).map(line => {
    let parts;
    if (line.includes(";")) parts = line.split(";");
    else if (line.includes(",")) parts = line.split(",");
    else if (line.includes("\t")) parts = line.split("\t");
    else parts = line.split(/\s+/);
    if (parts.length >= 2) {
      return { id: uid(), nom: parts[0].trim(), prenom: parts.slice(1).join(" ").trim() };
    }
    return null;
  }).filter(Boolean);
}

// ─── Validation des données importées ────────────────────────────

/**
 * Vérifie la structure minimale d'un objet d'état importé.
 * Retourne { valid, data, warnings, errors }
 */
export function validateState(d) {
  var errors = [];
  var warnings = [];

  if (!d || typeof d !== "object" || Array.isArray(d)) {
    return { valid: false, data: null, errors: ["Le fichier n'est pas un objet JSON valide."], warnings: [] };
  }

  if (!Array.isArray(d.exams)) {
    errors.push("Champ 'exams' manquant ou invalide (tableau attendu).");
  } else {
    d.exams.forEach(function(ex, i) {
      if (!ex || !ex.id) errors.push("Exam #" + (i + 1) + " : pas d'identifiant.");
      if (!Array.isArray(ex.exercises)) errors.push("Exam #" + (i + 1) + " : 'exercises' manquant.");
    });
  }

  if (!Array.isArray(d.students)) {
    errors.push("Champ 'students' manquant ou invalide (tableau attendu).");
  } else {
    d.students.forEach(function(s, i) {
      if (!s || !s.id) errors.push("Élève #" + (i + 1) + " : pas d'identifiant.");
      if (!s || !s.nom) warnings.push("Élève #" + (i + 1) + " : nom manquant.");
    });
  }

  if (errors.length > 0) {
    return { valid: false, data: d, errors: errors, warnings: warnings };
  }

  if (d.grades && typeof d.grades !== "object") {
    warnings.push("'grades' ignoré (objet attendu, " + typeof d.grades + " reçu).");
    d.grades = {};
  }
  if (d.remarks && typeof d.remarks !== "object") {
    warnings.push("'remarks' ignoré (objet attendu).");
    d.remarks = {};
  }

  return { valid: true, data: d, errors: [], warnings: warnings };
}

// ─── Téléchargement de fichier ───────────────────────────────────

export function downloadFile(content, filename, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
