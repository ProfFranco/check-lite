// ═══════════════════════════════════════════════════════════════════
// OverviewTab — Vue d'ensemble du DS
// ═══════════════════════════════════════════════════════════════════
//
// Tableau élèves × questions/items (exercices "items") ou note unique
// (exercices "brut"/"paliers") avec code couleur de réussite.
// Aucune persistance : tout l'état est éphémère.
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef } from "react";
import { gradeKey, palierKey, treatedKey, exerciseScore } from "./utils/calculs";

// Points obtenus par un étudiant sur une question
function questionObtenu(grades, studentId, question) {
  return (question.items || []).reduce(function(s, it) {
    return s + (grades[gradeKey(studentId, it.id)] ? (parseFloat(it.points) || 0) : 0);
  }, 0);
}

// Points max d'une question
function questionMax(question) {
  return (question.items || []).reduce(function(s, it) {
    return s + (parseFloat(it.points) || 0);
  }, 0);
}

// Points obtenus par un étudiant sur un item
function itemObtenu(grades, studentId, item) {
  return grades[gradeKey(studentId, item.id)] ? (parseFloat(item.points) || 0) : 0;
}

// Couleur de cellule selon ratio (0..1)
function cellColor(ratio, th) {
  if (ratio >= 0.75) return th.success;
  if (ratio >= 0.50) return th.warning;
  return th.danger;
}

// ── Composant principal ──────────────────────────────────────────

function OverviewTab({ exam, students, grades, notesBrutes, palierGrades, palierAjust, th, FONT, FONT_B, MONO, onNavigate }) {
  var nb = notesBrutes || {};
  var pg = palierGrades || {};
  var pa = palierAjust || {};

  // États éphémères locaux
  var _granularity = useState("question");
  var granularity = _granularity[0]; var setGranularity = _granularity[1];

  var _sort = useState({ col: null, dir: "none" });
  var sort = _sort[0]; var setSort = _sort[1];
  var _hideUncorrected = useState(false); var hideUncorrected = _hideUncorrected[0]; var setHideUncorrected = _hideUncorrected[1];

  // Détecte si un élève a au moins une note saisie sur ce DS (tous types d'exercice)
  function isStudentCorrected(studentId) {
    for (var exz of exam.exercises) {
      if (exz.type === "brut") {
        if (typeof nb[gradeKey(studentId, exz.id)] === "number") return true;
      } else if (exz.type === "paliers") {
        for (var cz of (exz.competences || [])) {
          if (typeof pg[palierKey(studentId, exz.id, cz.id)] === "number") return true;
        }
      } else {
        for (var qz of exz.questions) {
          if (grades[treatedKey(studentId, qz.id)]) return true;
          for (var itz of qz.items) {
            if (grades[gradeKey(studentId, itz.id)]) return true;
          }
        }
      }
    }
    return false;
  }

  // Refs pour scroll vers exercice
  var exRefs = useRef({});

  var presents = students;

  if (!presents.length) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: th.textMuted, fontFamily: FONT_B }}>
        {"Aucun élève à corriger."}
      </div>
    );
  }

  // ── Colonnes selon granularité ───────────────────────────────
  // cols = [{ id, label, exIdx, max, type: "question"|"item"|"brut"|"paliers", ... }]
  var cols = [];
  exam.exercises.forEach(function(ex, exIdx) {
    if (ex.type === "brut") {
      cols.push({ id: "brut_" + ex.id, label: ex.title, exIdx: exIdx, max: parseFloat(ex.bareme) || 0, type: "brut", ex: ex });
      return;
    }
    if (ex.type === "paliers") {
      cols.push({ id: "paliers_" + ex.id, label: ex.title, exIdx: exIdx, max: (ex.competences || []).reduce(function(s, c) { return s + c.paliers.reduce(function(m, p) { return Math.max(m, parseFloat(p.bareme) || 0); }, 0); }, 0), type: "paliers", ex: ex });
      return;
    }
    ex.questions.forEach(function(q, qIdx) {
      if (granularity === "question") {
        cols.push({
          id: "q_" + q.id,
          label: "Q." + q.label,
          exIdx: exIdx,
          qIdx: qIdx,
          questionId: q.id,
          question: q,
          max: questionMax(q),
          type: "question",
        });
      } else {
        (q.items || []).forEach(function(it) {
          cols.push({
            id: "i_" + it.id,
            label: (it.label || "item") + " (" + (parseFloat(it.points) || 0) + "pt)",
            exIdx: exIdx,
            qIdx: qIdx,
            questionId: q.id,
            question: q,
            item: it,
            max: parseFloat(it.points) || 0,
            type: "item",
          });
        });
      }
    });
  });

  // ── Calcul des données par élève ─────────────────────────────
  function getColValue(studentId, col) {
    if (col.type === "question") return questionObtenu(grades, studentId, col.question);
    if (col.type === "item") return itemObtenu(grades, studentId, col.item);
    return exerciseScore(grades, nb, pg, pa, studentId, col.ex).earned;
  }

  function getStudentTotal(studentId) {
    return exam.exercises.reduce(function(sum, ex) { return sum + exerciseScore(grades, nb, pg, pa, studentId, ex).earned; }, 0);
  }

  var examMax = cols.reduce(function(s, c) { return s + c.max; }, 0);

  // ── Tri ──────────────────────────────────────────────────────
  function handleColClick(colId) {
    setSort(function(prev) {
      if (prev.col !== colId) return { col: colId, dir: "desc" };
      if (prev.dir === "desc") return { col: colId, dir: "asc" };
      return { col: null, dir: "none" };
    });
  }

  function handleNomClick() {
    setSort(function(prev) {
      if (prev.col !== "nom") return { col: "nom", dir: "asc" };
      if (prev.dir === "asc") return { col: "nom", dir: "desc" };
      return { col: null, dir: "none" };
    });
  }

  var filteredPresents = hideUncorrected
    ? presents.filter(function(s) { return isStudentCorrected(s.id); })
    : presents;
  var sortedStudents = filteredPresents.slice().sort(function(a, b) {
    if (sort.col === null || sort.dir === "none") {
      var na = (a.nom + a.prenom).toLowerCase();
      var nb2 = (b.nom + b.prenom).toLowerCase();
      return na < nb2 ? -1 : na > nb2 ? 1 : 0;
    }
    if (sort.col === "nom") {
      var na2 = (a.nom + a.prenom).toLowerCase();
      var nb3 = (b.nom + b.prenom).toLowerCase();
      return sort.dir === "asc" ? (na2 < nb3 ? -1 : 1) : (na2 > nb3 ? -1 : 1);
    }
    var col = cols.find(function(c) { return c.id === sort.col; });
    if (!col) return 0;
    var va = col.max > 0 ? getColValue(a.id, col) / col.max : 0;
    var vb = col.max > 0 ? getColValue(b.id, col) / col.max : 0;
    return sort.dir === "desc" ? vb - va : va - vb;
  });

  // ── Groupement des colonnes par exercice ─────────────────────
  var exGroups = exam.exercises.map(function(ex, exIdx) {
    var exCols = cols.filter(function(c) { return c.exIdx === exIdx; });
    return { ex: ex, exIdx: exIdx, count: exCols.length };
  });

  function scrollToEx(exIdx) {
    var el = exRefs.current[exIdx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }

  var thBase = {
    padding: "5px 8px", fontFamily: FONT_B, fontSize: 10, fontWeight: 700,
    whiteSpace: "nowrap", userSelect: "none", borderBottom: "2px solid " + th.border,
    background: th.surface, color: th.textMuted, position: "sticky", top: 0, zIndex: 3,
  };

  var tdBase = {
    padding: "4px 6px", fontFamily: MONO, fontSize: 11, textAlign: "center",
    borderBottom: "1px solid " + th.border + "44", whiteSpace: "nowrap", cursor: "pointer",
  };

  var sortArrow = function(colId) {
    if (sort.col !== colId) return " ↕";
    return sort.dir === "desc" ? " ↓" : " ↑";
  };

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto" }}>

      {/* ── Barre de contrôles ─────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10, padding: "10px 14px", background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, boxShadow: th.shadow }}>
        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT, flex: 1 }}>
          {"📋 Vue d'ensemble — " + (exam.nomDS || exam.name || "DS")}
        </span>

        <div style={{ display: "flex", gap: 2 }}>
          {[{ v: "question", l: "☰ Questions" }, { v: "item", l: "⊞ Items" }].map(function(g) {
            var active = granularity === g.v;
            return (
              <button key={g.v} onClick={function() { setGranularity(g.v); }}
                style={{ padding: "5px 10px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 11, fontWeight: 600, background: active ? th.accentBg : th.surface, border: "1px solid " + (active ? th.accent + "55" : th.border), color: active ? th.accent : th.textMuted }}>{g.l}</button>
            );
          })}
        </div>

        <button
          onClick={function() { setHideUncorrected(function(v) { return !v; }); }}
          style={{ padding: "5px 10px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 11, fontWeight: 600, background: hideUncorrected ? th.accentBg : th.surface, border: "1px solid " + (hideUncorrected ? th.accent + "55" : th.border), color: hideUncorrected ? th.accent : th.textMuted }}>
          {"✓ Corrigés seulement" + (hideUncorrected ? " (" + filteredPresents.length + "/" + presents.length + ")" : "")}
        </button>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[{ label: "≥ 75 %", color: th.success }, { label: "≥ 50 %", color: th.warning }, { label: "< 50 %", color: th.danger }].map(function(item) {
            return (
              <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontFamily: FONT_B, color: th.textMuted }}>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: item.color + "33", border: "1px solid " + item.color + "77" }} />
                {item.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Bulles de navigation par exercice ──────────────────── */}
      {exam.exercises.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {exam.exercises.map(function(ex, exIdx) {
            return (
              <button key={ex.id} onClick={function() { scrollToEx(exIdx); }}
                style={{ padding: "4px 12px", borderRadius: 20, cursor: "pointer", fontFamily: FONT_B, fontSize: 11, fontWeight: 600, background: th.accentBg, border: "1px solid " + th.accent + "44", color: th.accent }}>
                {ex.title || ("Ex " + (exIdx + 1))}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Tableau ─────────────────────────────────────────────── */}
      <div style={{ overflowX: "auto", background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, boxShadow: th.shadow }}>
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "auto" }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ ...thBase, textAlign: "left", position: "sticky", left: 0, zIndex: 5, minWidth: 130, borderRight: "2px solid " + th.border, cursor: "pointer" }} onClick={handleNomClick}>
                {"Élève" + sortArrow("nom")}
              </th>
              {exGroups.map(function(g) {
                if (g.count === 0) return null;
                return (
                  <th key={g.ex.id} ref={function(el) { exRefs.current[g.exIdx] = el; }} colSpan={g.count}
                    style={{ ...thBase, textAlign: "center", borderLeft: "2px solid " + th.border, borderRight: "1px solid " + th.border + "44", color: th.accent, background: th.accentBg, fontSize: 11 }}>
                    {g.ex.title || ("Exercice " + (g.exIdx + 1))}
                  </th>
                );
              })}
              <th rowSpan={2} style={{ ...thBase, textAlign: "right", position: "sticky", right: 0, zIndex: 5, minWidth: 60, borderLeft: "2px solid " + th.border }}>
                {"Total"}
              </th>
            </tr>
            <tr>
              {cols.map(function(col, idx) {
                var isFirstOfEx = idx === 0 || cols[idx - 1].exIdx !== col.exIdx;
                var active = sort.col === col.id;
                return (
                  <th key={col.id} onClick={function() { handleColClick(col.id); }}
                    style={{ ...thBase, textAlign: "center", cursor: "pointer", borderLeft: isFirstOfEx ? "2px solid " + th.border : "1px solid " + th.border + "22", background: active ? th.accentBg : th.surface, color: active ? th.accent : th.textMuted, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {col.label + sortArrow(col.id)}
                    <div style={{ fontSize: 8, fontWeight: 400, color: th.textDim, fontFamily: MONO }}>{"/" + col.max}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map(function(student, rowIdx) {
              var total = getStudentTotal(student.id);
              var totalRatio = examMax > 0 ? total / examMax : 0;
              var totalColor = cellColor(totalRatio, th);
              return (
                <tr key={student.id} style={{ background: rowIdx % 2 === 0 ? "transparent" : th.surface + "55" }}>
                  <td style={{ ...tdBase, textAlign: "left", fontFamily: FONT_B, fontSize: 11, fontWeight: 600, position: "sticky", left: 0, zIndex: 2, background: rowIdx % 2 === 0 ? th.card : th.surface, borderRight: "2px solid " + th.border, cursor: "default", color: th.text, minWidth: 130 }}>
                    {student.prenom + " "}
                    <span style={{ fontVariant: "small-caps" }}>{student.nom}</span>
                  </td>
                  {cols.map(function(col, idx) {
                    var isFirstOfEx = idx === 0 || cols[idx - 1].exIdx !== col.exIdx;
                    var obtained = getColValue(student.id, col);
                    var ratio = col.max > 0 ? obtained / col.max : 0;

                    var attempted;
                    if (col.type === "question") {
                      attempted = !!grades[treatedKey(student.id, col.questionId)] || (col.question.items || []).some(function(it) { return !!grades[gradeKey(student.id, it.id)]; });
                    } else if (col.type === "item") {
                      attempted = !!grades[gradeKey(student.id, col.item.id)];
                    } else if (col.type === "brut") {
                      attempted = typeof nb[gradeKey(student.id, col.ex.id)] === "number";
                    } else {
                      attempted = (col.ex.competences || []).some(function(c) { return typeof pg[palierKey(student.id, col.ex.id, c.id)] === "number"; });
                    }

                    var bg, borderColor, textColor;
                    if (!attempted) {
                      bg = "transparent"; borderColor = th.border + "22"; textColor = th.textDim;
                    } else {
                      bg = cellColor(ratio, th) + "22"; borderColor = cellColor(ratio, th) + "55"; textColor = cellColor(ratio, th);
                    }

                    var studentIdx = students.indexOf(student);

                    return (
                      <td key={col.id}
                        onClick={function() { if (onNavigate) onNavigate(studentIdx, col.exIdx); }}
                        title={student.prenom + " " + student.nom + " — " + col.label + " : " + obtained + "/" + col.max}
                        style={{ ...tdBase, background: bg, borderLeft: isFirstOfEx ? "2px solid " + th.border : "1px solid " + borderColor, color: textColor, fontWeight: attempted ? 700 : 400, minWidth: 48 }}>
                        {attempted ? obtained : "—"}
                      </td>
                    );
                  })}
                  <td style={{ ...tdBase, textAlign: "right", position: "sticky", right: 0, zIndex: 2, background: rowIdx % 2 === 0 ? th.card : th.surface, borderLeft: "2px solid " + th.border, fontWeight: 700, color: totalColor, cursor: "default", minWidth: 60 }}>
                    {total.toFixed(total % 1 === 0 ? 0 : 1)}
                    <span style={{ fontSize: 9, color: th.textDim, fontWeight: 400 }}>{"/" + examMax}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 10, color: th.textDim, fontFamily: FONT_B, marginTop: 8, textAlign: "right" }}>
        {presents.length + " élèves · clic sur une cellule → Correction"}
      </div>
    </div>
  );
}

export default OverviewTab;
