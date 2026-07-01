import { useState } from "react";
import { APP_VERSION } from "./config/settings";
import { studentTotal, examTotal, remarquesAjustement } from "./utils/calculs";

/** Note totale brute d'un élève sur un DS : total des exercices + ajustement remarques/malus manuel, clampé à 0 */
function studentFinalTotal(grades, notesBrutes, palierGrades, palierAjust, remarks, malusManuel, studentId, exam) {
  var brut = studentTotal(grades, notesBrutes, palierGrades, palierAjust, studentId, exam);
  var adjust = remarquesAjustement(remarks, studentId, exam) + ((malusManuel && malusManuel[studentId]) || 0);
  return Math.max(0, brut + adjust);
}

function countCorriges(exam, students, grades, notesBrutes, palierGrades) {
  if (!exam || !students) return 0;
  return students.filter(function(s) {
    return exam.exercises.some(function(ex) {
      if (ex.type === "brut") return typeof notesBrutes[s.id + "__" + ex.id] === "number";
      if (ex.type === "paliers") return (ex.competences || []).some(function(c) { return typeof palierGrades[s.id + "__" + ex.id + "__" + c.id] === "number"; });
      return ex.questions.some(function(q) { return q.items.some(function(it) { return !!grades[s.id + "__" + it.id]; }); });
    });
  }).length;
}

function corrigedStudents(exam, students, grades, notesBrutes, palierGrades) {
  return students.filter(function(s) {
    return exam.exercises.some(function(ex) {
      if (ex.type === "brut") return typeof notesBrutes[s.id + "__" + ex.id] === "number";
      if (ex.type === "paliers") return (ex.competences || []).some(function(c) { return typeof palierGrades[s.id + "__" + ex.id + "__" + c.id] === "number"; });
      return ex.questions.some(function(q) { return q.items.some(function(it) { return !!grades[s.id + "__" + it.id]; }); });
    });
  });
}

/** Moyenne de la classe en points bruts (pas de normalisation en CHECK-lite) */
function calcClassAvg(exam, students, grades, notesBrutes, palierGrades, palierAjust, remarks, malusManuel) {
  if (!exam || !students || students.length === 0) return null;
  var presents = corrigedStudents(exam, students, grades, notesBrutes, palierGrades);
  if (presents.length === 0) return null;
  var sum = 0;
  presents.forEach(function(s) { sum += studentFinalTotal(grades, notesBrutes, palierGrades, palierAjust, remarks, malusManuel, s.id, exam); });
  return sum / presents.length;
}

function calcMinMax(exam, students, grades, notesBrutes, palierGrades, palierAjust, remarks, malusManuel) {
  if (!exam || !students || students.length === 0) return null;
  var presents = corrigedStudents(exam, students, grades, notesBrutes, palierGrades);
  if (presents.length === 0) return null;
  var notes = presents.map(function(s) { return studentFinalTotal(grades, notesBrutes, palierGrades, palierAjust, remarks, malusManuel, s.id, exam); });
  return { min: Math.min.apply(null, notes), max: Math.max.apply(null, notes) };
}

function fmt1(n) { return (Math.round(n * 10) / 10).toFixed(1); }

function AccueilTab({ th, FONT_B, MONO, profiles, activeProfileId, PROFILE_COLORS, exams, students, grades, notesBrutes, palierGrades, palierAjust, remarks, malusManuel, setMode, switchProfile, setShowProfileMenu, setActiveExamId, askConfirm, onFullBackup, onOpenRestore, backupBusy }) {
  var _ddOpen = useState(false); var ddOpen = _ddOpen[0]; var setDdOpen = _ddOpen[1];

  var profileIndex = profiles.findIndex(function(p) { return p.id === activeProfileId; });
  var profileColor = PROFILE_COLORS[profileIndex] !== undefined ? PROFILE_COLORS[profileIndex] : PROFILE_COLORS[0];
  var activeProfile = profiles[profileIndex] || {};

  // Stats globales
  var lastExam = exams.length > 0 ? exams[exams.length - 1] : null;
  var prevExams = exams.length > 1 ? exams.slice(0, exams.length - 1).slice(-5).reverse() : [];

  var lastCorriges = lastExam ? countCorriges(lastExam, students, grades, notesBrutes, palierGrades) : 0;
  var tauxCorrection = students.length > 0 ? (lastCorriges / students.length) * 100 : 0;

  var lastAvg = lastExam ? calcClassAvg(lastExam, students, grades, notesBrutes, palierGrades, palierAjust, remarks, malusManuel) : null;
  var lastMM = lastExam ? calcMinMax(lastExam, students, grades, notesBrutes, palierGrades, palierAjust, remarks, malusManuel) : null;
  var lastExamMax = lastExam ? examTotal(lastExam) : 0;

  var cardStyle = { background: th.card, border: "1px solid " + th.border, borderRadius: th.radiusSm, padding: "16px 18px" };
  var labelStyle = { fontSize: 11, color: th.textMuted, fontFamily: FONT_B, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 };
  var bigNumStyle = { fontSize: 26, fontWeight: 700, color: th.text, fontFamily: MONO, lineHeight: 1 };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px", fontFamily: FONT_B }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: th.text }}>{"Tableau de bord"}</div>
          <div style={{ fontSize: 12, color: th.textMuted, marginTop: 2 }}>{activeProfile.name || "Profil"}</div>
        </div>
        {/* Pill profil */}
        <div style={{ position: "relative" }}>
          <button
            onClick={function() { setDdOpen(!ddOpen); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: "2px solid " + profileColor, background: profileColor + "15", cursor: "pointer", fontFamily: FONT_B, fontSize: 13, fontWeight: 700, color: profileColor }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: profileColor, display: "inline-block", flexShrink: 0 }} />
            {activeProfile.name || "Profil"}
            <span style={{ fontSize: 9, opacity: 0.7 }}>{"▾"}</span>
          </button>
          {ddOpen && (
            <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 6, background: th.card, border: "1px solid " + th.border, borderRadius: th.radiusSm, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", zIndex: 120, minWidth: 200, overflow: "hidden" }}
              onClick={function(e) { e.stopPropagation(); }}>
              {profiles.map(function(p, idx) {
                var isActive = p.id === activeProfileId;
                var c = PROFILE_COLORS[idx] !== undefined ? PROFILE_COLORS[idx] : PROFILE_COLORS[0];
                return (
                  <button key={p.id}
                    onClick={function() { if (!isActive) switchProfile(p.id); setDdOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: isActive ? profileColor + "12" : "transparent", border: "none", borderBottom: "1px solid " + th.border, cursor: "pointer", fontFamily: FONT_B, fontSize: 13, color: isActive ? c : th.text, fontWeight: isActive ? 700 : 400, textAlign: "left" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block", flexShrink: 0 }} />
                    {p.name}
                    {isActive && <span style={{ marginLeft: "auto", fontSize: 10, color: c }}>{"✓"}</span>}
                  </button>
                );
              })}
              <button
                onClick={function() { setShowProfileMenu(true); setDdOpen(false); }}
                style={{ width: "100%", padding: "8px 12px", background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT_B, fontSize: 12, color: th.textMuted, textAlign: "left" }}>
                {"⚙ Gérer les profils…"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STATS GLOBALES — 3 cartes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {/* DS archivés */}
        <div style={cardStyle}>
          <div style={labelStyle}>{"DS archivés"}</div>
          <div style={bigNumStyle}>{exams.length}</div>
        </div>
        {/* Élèves suivis */}
        <div style={cardStyle}>
          <div style={labelStyle}>{"Élèves suivis"}</div>
          <div style={bigNumStyle}>{students.length}</div>
        </div>
        {/* Taux de correction */}
        <div style={cardStyle}>
          <div style={labelStyle}>{"Taux de correction"}</div>
          <div style={bigNumStyle}>{students.length > 0 && lastExam ? Math.round(tauxCorrection) + "%" : "—"}</div>
          {students.length > 0 && lastExam && (
            <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: tauxCorrection + "%", background: profileColor, borderRadius: 2 }} />
            </div>
          )}
        </div>
      </div>

      {/* DEUX COLONNES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* COLONNE GAUCHE — Dernier DS */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: th.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{"Dernier devoir"}</div>
          {!lastExam ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: "32px 20px" }}>
              <div style={{ fontSize: 36, color: profileColor, marginBottom: 10 }}>{"♙"}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: th.text, marginBottom: 6 }}>{"Aucun devoir ouvert"}</div>
              <div style={{ fontSize: 12, color: th.textMuted, marginBottom: 16 }}>{"Créez votre premier devoir pour commencer."}</div>
              <button onClick={function() { setMode("prep"); }}
                style={{ padding: "8px 18px", borderRadius: th.radiusSm, border: "none", background: profileColor, color: "#fff", fontFamily: FONT_B, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {"Créer un DS →"}
              </button>
            </div>
          ) : (
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 18, color: profileColor }}>{"♜"}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: th.text }}>{lastExam.nomDS || lastExam.name || "Sans titre"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: th.textMuted }}>
                    {lastExam.dateDS || "—"}
                    {" · "}
                    {students.length + " élève" + (students.length > 1 ? "s" : "")}
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, background: profileColor + "20", color: profileColor, padding: "2px 8px", borderRadius: 10, border: "1px solid " + profileColor + "40", whiteSpace: "nowrap" }}>{"récent"}</span>
              </div>

              {/* Mini-stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                <div style={{ background: th.surface, borderRadius: th.radiusSm, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: th.textMuted, marginBottom: 2 }}>{"Moyenne"}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: th.text, fontFamily: MONO }}>{lastAvg !== null ? fmt1(lastAvg) : "—"}</div>
                  {lastAvg !== null && <div style={{ fontSize: 9, color: th.textMuted, marginTop: 1 }}>{"/ " + lastExamMax + " pts"}</div>}
                </div>
                <div style={{ background: th.surface, borderRadius: th.radiusSm, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: th.textMuted, marginBottom: 2 }}>{"Étendue"}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: th.text, fontFamily: MONO }}>{lastMM ? fmt1(lastMM.min) + "–" + fmt1(lastMM.max) : "—"}</div>
                </div>
                <div style={{ background: th.surface, borderRadius: th.radiusSm, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: th.textMuted, marginBottom: 2 }}>{"Corrigées"}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: th.text, fontFamily: MONO }}>{lastCorriges + "/" + students.length}</div>
                </div>
              </div>

              {/* Boutons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={function() { setActiveExamId(lastExam.id); setMode("correct"); }}
                  style={{ flex: 1, padding: "7px 0", borderRadius: th.radiusSm, border: "none", background: profileColor, color: "#fff", fontFamily: FONT_B, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {"Correction →"}
                </button>
                <button onClick={function() { setActiveExamId(lastExam.id); setMode("stats"); }}
                  style={{ flex: 1, padding: "7px 0", borderRadius: th.radiusSm, border: "1px solid " + th.border, background: th.surface, color: th.text, fontFamily: FONT_B, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {"Stats"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* COLONNE DROITE — DS précédents */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: th.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{"Historique"}</div>
          {prevExams.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: "32px 20px" }}>
              <div style={{ fontSize: 32, color: th.textDim, marginBottom: 10, opacity: 0.4 }}>{"♟"}</div>
              <div style={{ fontSize: 13, color: th.textMuted }}>{"L'historique apparaîtra ici."}</div>
            </div>
          ) : (
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              {prevExams.map(function(ex, i) {
                var avg = calcClassAvg(ex, students, grades, notesBrutes, palierGrades, palierAjust, remarks, malusManuel);
                var corriges = countCorriges(ex, students, grades, notesBrutes, palierGrades);
                var isComplete = corriges >= students.length;
                return (
                  <div key={ex.id}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < prevExams.length - 1 ? "1px solid " + th.border : "none", background: "transparent" }}>
                    <span style={{ fontSize: 16, color: profileColor, flexShrink: 0 }}>{"♜"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: th.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.nomDS || ex.name || "Sans titre"}</div>
                      <div style={{ fontSize: 11, color: th.textMuted }}>{(ex.dateDS || "—") + " · " + students.length + " élève" + (students.length > 1 ? "s" : "")}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: th.text, fontFamily: MONO }}>{avg !== null ? fmt1(avg) : "—"}</div>
                      {avg !== null && <div style={{ fontSize: 9, color: th.textMuted }}>{"/ " + examTotal(ex) + " pts"}</div>}
                    </div>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: isComplete ? "#22c55e" : "#f59e0b", flexShrink: 0 }} title={isComplete ? "Complet" : "Copies manquantes"} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SAUVEGARDE & RESTAURATION (filet universel) */}
      {(onFullBackup || onOpenRestore) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginBottom: 10 }}>
          {onFullBackup && (
            <button onClick={onFullBackup} disabled={!!backupBusy}
              title={"Télécharge un fichier JSON contenant tous vos profils"}
              style={{ background: "transparent", border: "1px solid " + th.border, borderRadius: th.radiusSm, padding: "6px 12px", cursor: backupBusy ? "not-allowed" : "pointer", fontFamily: FONT_B, fontSize: 11, color: th.textMuted, opacity: backupBusy ? 0.6 : 1 }}>
              {backupBusy ? "⏳ Sauvegarde…" : "💾 Sauvegarder mes données"}
            </button>
          )}
          {onOpenRestore && (
            <button onClick={onOpenRestore} disabled={!!backupBusy}
              title={"Restaurer depuis un fichier de sauvegarde"}
              style={{ background: "transparent", border: "1px solid " + th.border, borderRadius: th.radiusSm, padding: "6px 12px", cursor: backupBusy ? "not-allowed" : "pointer", fontFamily: FONT_B, fontSize: 11, color: th.textMuted, opacity: backupBusy ? 0.6 : 1 }}>
              {"📂 Restaurer"}
            </button>
          )}
        </div>
      )}

      {/* PIED DE PAGE */}
      <div style={{ padding: "12px 0", borderTop: "1px solid " + th.border, fontSize: 11, color: th.textDim }}>
        <span>{"C.H.E.C.K.-lite v" + APP_VERSION}</span>
      </div>

      {ddOpen && <div style={{ position: "fixed", inset: 0, zIndex: 110 }} onClick={function() { setDdOpen(false); }} />}
    </div>
  );
}

export default AccueilTab;
