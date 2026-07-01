// ═══════════════════════════════════════════════════════════════════
// C.H.E.C.K. — Application principale
// ═══════════════════════════════════════════════════════════════════
// Ce fichier contient l'application complète.
// La configuration est dans src/config/settings.js
// Les fonctions de calcul dans src/utils/calculs.js
// Le générateur LaTeX dans src/utils/latex.js
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── Imports depuis les modules du projet ────────────────────────
import {
  APP_VERSION, REMARQUES_FIXES,
} from "./config/settings";
import { lightTheme, darkTheme, youngTheme, FONT_TITLE, FONT_BODY, FONT_MONO, FONTS_URL } from "./config/theme";
import {
  uid, gradeKey, remarkKey, palierKey, clamp,
  questionScore, exerciseScore, studentTotal, examTotal, noteSur100,
  remarquesAjustement, exercisePctAbsolute, exercisePctRelative,
  importCSV, downloadFile, treatedKey, validateState,
} from "./utils/calculs";
import { loadDB, saveDB, loadMeta, saveMeta, initProfiles, profileDBName, openNamedDB } from "./utils/db";
import { Histo, PBar, MiniRadarEx } from "./components/Charts";
import HelpTab from "./HelpTab";
import SauvegardeTab from "./SauvegardeTab";
import OverviewTab from "./OverviewTab";
import { collectAllProfiles, restoreReplace, restoreMerge, parseBackup, validateBackup, backupFilename } from "./utils/backup";
import AccueilTab from "./AccueilTab";
// ─── Logos (dans public/logos/) ──────────────────────────────────
const LOGO_LIGHT  = process.env.PUBLIC_URL + "/logos/logo-light.png";
const LOGO_DARK   = process.env.PUBLIC_URL + "/logos/logo-dark.png";
const LOGO_YOUNG  = process.env.PUBLIC_URL + "/logos/logo-young.png";
const SPLASH_IMG = process.env.PUBLIC_URL + "/logos/splash.png";

var PROFILE_COLORS = ["#8B7355","#534AB7","#0F6E56","#A32D2D","#185FA5"];

// ─── Raccourcis ──────────────────────────────────────────────────

const FONT = FONT_TITLE;
const FONT_B = FONT_BODY;
const MONO = FONT_MONO;

export default function App() {
  // ─── State ───
  var _appTheme = useState("light"); var setAppTheme = _appTheme[1]; var appTheme = _appTheme[0];
  var mainScrollRef = useRef(null);
  var dark = appTheme === "dark";
  var _splash = useState(true); var setSplash = _splash[1]; var showSplash = _splash[0];
  var th = appTheme === "dark" ? darkTheme : appTheme === "young" ? youngTheme : lightTheme;
  var FONT_B = appTheme === "young" ? "'Nunito', 'Segoe UI', system-ui, sans-serif" : FONT_BODY;

  var _exams = useState([]); var setExams = _exams[1]; var exams = _exams[0];
  var _students = useState([]); var setStudents = _students[1]; var students = _students[0];
  var _grades = useState({}); var setGrades = _grades[1]; var grades = _grades[0];
  var _remarks = useState({}); var setRemarks = _remarks[1]; var remarks = _remarks[0];
  var _notesBrutes = useState({}); var setNotesBrutes = _notesBrutes[1]; var notesBrutes = _notesBrutes[0];
  var _palierGrades = useState({}); var setPalierGrades = _palierGrades[1]; var palierGrades = _palierGrades[0];
  var _activeExamId = useState(null); var setActiveExamId = _activeExamId[1]; var activeExamId = _activeExamId[0];
  var _nomDS = useState(""); var setNomDS = _nomDS[1]; var nomDS = _nomDS[0];
  var _dateDS = useState(""); var setDateDS = _dateDS[1]; var dateDS = _dateDS[0];
  var _mode = useState("prep"); var setMode = _mode[1]; var mode = _mode[0];
  var _malusManuel = useState({}); var setMalusManuel = _malusManuel[1]; var malusManuel = _malusManuel[0];
  var _si = useState(0); var setSi = _si[1]; var si = _si[0];
  var _ei = useState(0); var setEi = _ei[1]; var ei = _ei[0];
  var _uiScale = useState(1); var setUiScale = _uiScale[1]; var uiScale = _uiScale[0];
  var _showSearch = useState(false); var setShowSearch = _showSearch[1]; var showSearch = _showSearch[0];
  var _searchTerm = useState(""); var setSearchTerm = _searchTerm[1]; var searchTerm = _searchTerm[0];
  var _showMore = useState(false); var setShowMore = _showMore[1]; var showMore = _showMore[0];
  var _showDsMenu = useState(false); var setShowDsMenu = _showDsMenu[1]; var showDsMenu = _showDsMenu[0];
  var _tab = useState("general"); var setTab = _tab[1]; var tab = _tab[0];
  var _dbLoaded = useState(false); var setDbLoaded = _dbLoaded[1]; var dbLoaded = _dbLoaded[0];
  // Prep state
  var _collapsed = useState({}); var setCollapsed = _collapsed[1]; var collapsed = _collapsed[0];
  var _collapsedExams = useState({}); var setCollapsedExams = _collapsedExams[1]; var collapsedExams = _collapsedExams[0];
  var _csortMode = useState("rang"); var csortMode = _csortMode[0]; var setCsortMode = _csortMode[1];
  var _progressionStudentId = useState(null); var progressionStudentId = _progressionStudentId[0]; var setProgressionStudentId = _progressionStudentId[1];
  var _progressionViewMode = useState("courbe"); var progressionViewMode = _progressionViewMode[0]; var setProgressionViewMode = _progressionViewMode[1];
  var _confirmDelete = useState(null); var setConfirmDelete = _confirmDelete[1]; var confirmDelete = _confirmDelete[0];
  var _confirmImportVide = useState(null); var setConfirmImportVide = _confirmImportVide[1]; var confirmImportVide = _confirmImportVide[0];
  var _showApropos = useState(false); var setShowApropos = _showApropos[1]; var showApropos = _showApropos[0];
  var _showChangelog = useState(false); var setShowChangelog = _showChangelog[1]; var showChangelog = _showChangelog[0];
  var _changelogText = useState(""); var setChangelogText = _changelogText[1]; var changelogText = _changelogText[0];
  var _profiles = useState([]); var setProfiles = _profiles[1]; var profiles = _profiles[0];
  var _activeProfileId = useState(null); var setActiveProfileId = _activeProfileId[1]; var activeProfileId = _activeProfileId[0];
  var _showProfileMenu = useState(false); var setShowProfileMenu = _showProfileMenu[1]; var showProfileMenu = _showProfileMenu[0];
  var _editingProfileId = useState(null); var setEditingProfileId = _editingProfileId[1]; var editingProfileId = _editingProfileId[0];
  var _editingProfileName = useState(""); var setEditingProfileName = _editingProfileName[1]; var editingProfileName = _editingProfileName[0];
  var _newProfileName = useState(""); var setNewProfileName = _newProfileName[1]; var newProfileName = _newProfileName[0];
  var _showCreateProfile = useState(false); var setShowCreateProfile = _showCreateProfile[1]; var showCreateProfile = _showCreateProfile[0];
  var _newProfileSourceId = useState(""); var setNewProfileSourceId = _newProfileSourceId[1]; var newProfileSourceId = _newProfileSourceId[0];
  var _newProfileImport = useState({ students: false }); var setNewProfileImport = _newProfileImport[1]; var newProfileImport = _newProfileImport[0];
  var _itemHintVisible = useState(null); var itemHintVisible = _itemHintVisible[0]; var setItemHintVisible = _itemHintVisible[1];
  var _backupBusy = useState(false); var backupBusy = _backupBusy[0]; var setBackupBusy = _backupBusy[1];
  var _backupRestoreModal = useState(null); var backupRestoreModal = _backupRestoreModal[0]; var setBackupRestoreModal = _backupRestoreModal[1];
  var _restoreMode = useState("replace"); var restoreMode = _restoreMode[0]; var setRestoreMode = _restoreMode[1];
  var _showAddStudent = useState(false); var showAddStudent = _showAddStudent[0]; var setShowAddStudent = _showAddStudent[1];
  var _newStudentNom = useState(""); var newStudentNom = _newStudentNom[0]; var setNewStudentNom = _newStudentNom[1];
  var _newStudentPrenom = useState(""); var newStudentPrenom = _newStudentPrenom[0]; var setNewStudentPrenom = _newStudentPrenom[1];
  var searchInputRef = useRef();
  var fileRef = useRef();
  var backupFileRef = useRef();
  var csvRef = useRef();
  var touchRef = useRef({ x: 0, y: 0 });  var hintTimerRef = useRef(null);
  // ─── Persistence: load from IndexedDB on mount ───
  useEffect(function() {
    loadMeta().then(function(meta) {
      // Premier lancement : migration depuis l'ancienne base
      if (!meta) return initProfiles();
      return meta;
    }).then(function(meta) {
      setProfiles(meta.profiles);
      setActiveProfileId(meta.activeId);
      return loadDB(meta.activeId);
    }).then(function(saved) {
      if (saved) restoreState(saved);
      setDbLoaded(true);
    });
  }, []);

  // ─── Construction de l'objet d'état complet (source unique) ────
  function buildAppState(overrides) {
    return Object.assign({
      exams: exams, students: students, grades: grades, remarks: remarks,
      notesBrutes: notesBrutes, palierGrades: palierGrades,
      activeExamId: activeExamId, nomDS: nomDS, dateDS: dateDS,
      malusManuel: malusManuel, uiScale: uiScale, appTheme: appTheme,
      mode: mode,
    }, overrides || {});
  }

  // ─── Restauration de l'état depuis un objet sauvegardé (source unique) ────
  function restoreState(d) {
    if (d.exams) setExams(d.exams);
    if (d.students) setStudents(d.students);
    if (d.grades) setGrades(d.grades);
    if (d.remarks) setRemarks(d.remarks);
    if (d.notesBrutes) setNotesBrutes(d.notesBrutes);
    if (d.palierGrades) setPalierGrades(d.palierGrades);
    if (d.activeExamId) setActiveExamId(d.activeExamId);
    if (d.nomDS) setNomDS(d.nomDS);
    if (d.dateDS) setDateDS(d.dateDS);
    if (d.malusManuel) setMalusManuel(d.malusManuel);
    if (d.uiScale) setUiScale(d.uiScale);
    if (d.appTheme !== undefined) setAppTheme(d.appTheme);
    else if (d.dark !== undefined) setAppTheme(d.dark ? "dark" : "light"); // migration anciens profils
    if (d.mode) setMode(d.mode);
  }

  // ─── Persistence: save to IndexedDB on changes (debounced) ───
  useEffect(function() {
    if (!dbLoaded) return;
    var timer = setTimeout(function() {
      saveDB(buildAppState(), activeProfileId);
    }, 500);
    return function() { clearTimeout(timer); };
  }, [dbLoaded, exams, students, grades, remarks, notesBrutes, palierGrades, activeExamId, nomDS, dateDS, malusManuel, uiScale, appTheme, mode]);

  useEffect(function() { if (showSearch && searchInputRef.current) searchInputRef.current.focus(); }, [showSearch]);
  useEffect(function() { var t = setTimeout(function() { setSplash(false); }, 2000); return function() { clearTimeout(t); }; }, []);

  // ─── Raccourcis clavier (desktop, onglet Correction uniquement) ───
  useEffect(function() {
    if (isMobile) return;
    function handleKey(e) {
      if (mode !== "correct") return;
      var tag = document.activeElement ? document.activeElement.tagName : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      var numEx = exam ? exam.exercises.length : 0;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (ei > 0) { setEi(ei - 1); }
        else if (si > 0) { setSi(si - 1); setEi(numEx - 1); }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (ei < numEx - 1) { setEi(ei + 1); }
        else if (si < students.length - 1) { setSi(si + 1); setEi(0); }
      } else if (e.key >= "1" && e.key <= "9") {
        var idx = parseInt(e.key, 10) - 1;
        if (idx < numEx) setEi(idx);
      }
    }
    window.addEventListener("keydown", handleKey);
    return function() { window.removeEventListener("keydown", handleKey); };
  }, [mode, isMobile, ei, si, exam, students.length]);

  var exam = exams.find(function(e) { return e.id === activeExamId; }) || exams[0] || null;
  var et = exam ? examTotal(exam) : 0;
  // Nom et date lus depuis l'exam actif (avec repli sur états globaux pour rétrocompatibilité)
  var examNomDS = exam ? (exam.nomDS !== undefined ? exam.nomDS : nomDS) : nomDS;
  var examDateDS = exam ? (exam.dateDS !== undefined ? exam.dateDS : dateDS) : dateDS;
  function setExamNomDS(val) { if (exam) updateExam(Object.assign({}, exam, { nomDS: val })); else setNomDS(val); }
  function setExamDateDS(val) { if (exam) updateExam(Object.assign({}, exam, { dateDS: val })); else setDateDS(val); }
  var presents = students;

  // ─── Gestion des profils ─────────────────────────────────────────

  function resetAppState() {
    setExams([]); setStudents([]); setGrades({}); setRemarks({});
    setNotesBrutes({}); setPalierGrades({}); setActiveExamId(null);
    setNomDS(""); setDateDS(""); setMalusManuel({});
  }

  function switchProfile(profileId) {
    // Sauvegarde immédiate du profil courant avant de switcher
    saveDB(buildAppState(), activeProfileId);
    setActiveProfileId(profileId);
    saveMeta({ profiles: profiles, activeId: profileId });
    resetAppState();
    loadDB(profileId).then(function(saved) {
      if (saved) restoreState(saved);
    });
    setShowProfileMenu(false);
  }

  function createProfile(name) {
    var newId = Math.random().toString(36).slice(2, 10);
    var newProfile = { id: newId, name: name.trim() || "Nouveau profil", createdAt: Date.now() };
    var newProfiles = profiles.concat([newProfile]);
    setProfiles(newProfiles);
    setNewProfileName("");
    saveMeta({ profiles: newProfiles, activeId: activeProfileId });
    // Crée immédiatement une base vide pour ce profil
    openNamedDB(profileDBName(newId)).catch(function() {});
  }

  async function createProfileWithImport() {
    var name = newProfileName.trim();
    if (!name) return;
    var newId = Math.random().toString(36).slice(2, 10);
    var newProfile = { id: newId, name: name, createdAt: Date.now() };
    var newProfiles = profiles.concat([newProfile]);
    setProfiles(newProfiles);
    await saveMeta({ profiles: newProfiles, activeId: activeProfileId });

    if (newProfileImport.students && newProfileSourceId) {
      var sourceState = await loadDB(newProfileSourceId);
      if (sourceState && sourceState.students) {
        await saveDB({ students: sourceState.students }, newId);
      } else {
        openNamedDB(profileDBName(newId)).catch(function() {});
      }
    } else {
      openNamedDB(profileDBName(newId)).catch(function() {});
    }

    setNewProfileName("");
    setNewProfileSourceId(activeProfileId);
    setNewProfileImport({ students: false });
    setShowCreateProfile(false);
    setShowProfileMenu(false);
  }

  function renameProfile(profileId, newName) {
    var updated = profiles.map(function(p) {
      return p.id === profileId ? Object.assign({}, p, { name: newName.trim() || p.name }) : p;
    });
    setProfiles(updated);
    saveMeta({ profiles: updated, activeId: activeProfileId });
    setEditingProfileId(null);
  }

  function deleteProfile(profileId) {
    if (profiles.length <= 1) return; // jamais supprimer le dernier
    var remaining = profiles.filter(function(p) { return p.id !== profileId; });
    setProfiles(remaining);
    var newActive = profileId === activeProfileId ? remaining[0].id : activeProfileId;
    saveMeta({ profiles: remaining, activeId: newActive });
    if (profileId === activeProfileId) switchProfile(newActive);
    // Suppression physique de la base IndexedDB (best effort)
    try { indexedDB.deleteDatabase(profileDBName(profileId)); } catch(e) {}
  }

  // ─── Élèves corrigés (au moins une note saisie, quel que soit le type d'exercice) ───
  var corriges = useMemo(function() {
    if (!exam) return [];
    return students.filter(function(st) {
      for (var exz of exam.exercises) {
        if (exz.type === "brut") {
          if (typeof notesBrutes[gradeKey(st.id, exz.id)] === "number") return true;
        } else if (exz.type === "paliers") {
          for (var cz of (exz.competences || [])) {
            if (typeof palierGrades[palierKey(st.id, exz.id, cz.id)] === "number") return true;
          }
        } else {
          for (var qz of exz.questions) {
            if (grades["treated_" + st.id + "_" + qz.id]) return true;
            for (var itz of qz.items) { if (grades[gradeKey(st.id, itz.id)]) return true; }
          }
        }
      }
      return false;
    });
  }, [students, grades, notesBrutes, palierGrades, exam]);

  // ─── Scores (bruts + ajustement remarques/malus manuel + note /100) ───
  var scoreData = useMemo(function() {
    if (!exam || !corriges.length) return { map: {} };
    var map = {};
    corriges.forEach(function(st) {
      var brut = studentTotal(grades, notesBrutes, palierGrades, st.id, exam);
      var adjust = remarquesAjustement(remarks, st.id, exam) + (malusManuel[st.id] || 0);
      map[st.id] = { brut: brut, adjust: adjust, final: Math.max(0, brut + adjust) };
    });
    return { map: map };
  }, [exam, corriges, grades, notesBrutes, palierGrades, remarks, malusManuel]);

  function getFinalPts(sid) { var e = scoreData.map[sid]; return e ? e.final : 0; }
  function getBrutPts(sid) { var e = scoreData.map[sid]; return e ? e.brut : 0; }
  function getAdjust(sid) { var e = scoreData.map[sid]; return e ? e.adjust : 0; }
  function getNote100(sid) { return et > 0 ? noteSur100(getFinalPts(sid), et) : 0; }
  function fmt1(n) { return (Math.round(n * 10) / 10).toFixed(1); }

  var inp = { background: th.card, border: "1px solid " + th.border, color: th.text, borderRadius: 4, padding: "4px 8px", fontSize: 13, fontFamily: FONT_B, outline: "none" };

  // Responsive
  var _winW = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  var setWinW = _winW[1]; var winW = _winW[0];
  useEffect(function() { var h = function() { setWinW(window.innerWidth); }; window.addEventListener("resize", h); return function() { window.removeEventListener("resize", h); }; }, []);

  var isMobile = winW < 700;  var isTablet = winW < 1024 && !isMobile;  var isTouch = winW < 1024;
  var sc = isMobile ? Math.min(uiScale, 1.1) : uiScale;

  // JSON save/load
  function saveJSON() {
    var today = new Date(); var dd = String(today.getFullYear()) + "-" + String(today.getMonth()+1).padStart(2,"0") + "-" + String(today.getDate()).padStart(2,"0");
    var slug = (examNomDS || "data").replace(/\s+/g, "_");
    downloadFile(JSON.stringify({ exams: exams, students: students, grades: grades, remarks: remarks, notesBrutes: notesBrutes, palierGrades: palierGrades, nomDS: examNomDS, dateDS: examDateDS, uiScale: uiScale, malusManuel: malusManuel }, null, 2), "check_" + slug + "_" + dd + ".json", "application/json");
  }

  // ─── Sauvegarde complète multi-profils (filet universel P2-a) ──
  async function saveFullBackup() {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      var activeState = buildAppState();
      if (activeProfileId) await saveDB(activeState, activeProfileId);
      var envelope = await collectAllProfiles(APP_VERSION, { id: activeProfileId, state: activeState });
      downloadFile(JSON.stringify(envelope, null, 2), backupFilename(), "application/json");
    } catch (e) {
      window.alert("La sauvegarde a échoué : " + (e && e.message ? e.message : e));
    } finally {
      setBackupBusy(false);
    }
  }

  function loadJSONFile(e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function(ev) {
      try {
        var d = JSON.parse(ev.target.result);
        var v = validateState(d);
        if (!v.valid) {
          window.alert("Import impossible :\n" + v.errors.join("\n"));
          return;
        }
        if (v.warnings.length > 0) {
          console.warn("Import — avertissements :", v.warnings);
        }
        var estVide = v.data.exams.length === 0 && v.data.students.length === 0;
        var estVideActuel = exams.length === 0 && students.length === 0;
        if (estVide && !estVideActuel) {
          setConfirmImportVide(function() { return function() { restoreState(v.data); }; });
          return;
        }
        restoreState(v.data);
      } catch(err) {
        window.alert("Le fichier n'est pas un JSON valide.");
        console.error("Import JSON error:", err);
      }
    };
    r.readAsText(f); e.target.value = "";
  }

  // ─── Ouverture d'un fichier de backup complet (ouvre la modale) ──
  function loadBackupFile(e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function(ev) {
      try {
        var raw = JSON.parse(ev.target.result);
        var parsed = parseBackup(raw);
        var actuelVide = exams.length === 0 && students.length === 0;
        var validation = validateBackup(parsed, actuelVide);
        if (!validation.valid) {
          window.alert("Import impossible :\n" + validation.errors.join("\n"));
          return;
        }
        if (parsed.kind === "mono") {
          if (validation.warnings.length > 0 && !actuelVide) {
            setConfirmImportVide(function() { return function() { restoreState(parsed.state); }; });
          } else {
            restoreState(parsed.state);
          }
          return;
        }
        setRestoreMode("replace");
        setBackupRestoreModal({ parsed: parsed, validation: validation });
      } catch (err) {
        window.alert("Le fichier n'est pas un JSON valide.");
        console.error("Import backup error:", err);
      }
    };
    r.readAsText(f); e.target.value = "";
  }

  // ─── Confirmation de restauration multi-profils ─────────────────
  async function confirmRestore() {
    if (!backupRestoreModal) return;
    var parsed = backupRestoreModal.parsed;
    setBackupRestoreModal(null);
    try {
      var newMeta = (restoreMode === "merge")
        ? await restoreMerge(parsed)
        : await restoreReplace(parsed);
      setProfiles(newMeta.profiles);
      setActiveProfileId(newMeta.activeId);
      if (newMeta.activeId) {
        var saved = await loadDB(newMeta.activeId);
        if (saved) restoreState(saved);
      }
      window.alert("Restauration terminée : " + newMeta.profiles.length + " profil(s).");
    } catch (e) {
      window.alert("La restauration a échoué : " + (e && e.message ? e.message : e));
    }
  }

  // ─── Exam CRUD ───
  function createExam() {
    var id = uid();
    var newExam = { id: id, name: "Nouveau DS", nomDS: "", dateDS: "",
      exercises: [{ id: uid(), title: "Exercice 1", type: "items",
        questions: [{ id: uid(), label: "1", items: [{ id: uid(), label: "Item 1", points: 1 }] }] }] };
    setExams(exams.concat([newExam]));
    setActiveExamId(id);
  }
  function updateExam(updated) { setExams(exams.map(function(e) { return e.id === updated.id ? updated : e; })); }
  function deleteExam(id) { setExams(exams.filter(function(e) { return e.id !== id; })); if (activeExamId === id) setActiveExamId(null); }

  // ─── Exam editor helpers ───
  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function addExercise(type) {
    if (!exam) return;
    type = type || "items";
    var newEx = { id: uid(), title: "Exercice " + (exam.exercises.length + 1), type: type };
    if (type === "brut") newEx.bareme = 20;
    else if (type === "paliers") newEx.competences = [];
    else newEx.questions = [];
    updateExam(Object.assign({}, exam, { exercises: exam.exercises.concat([newEx]) }));
  }
  function updateExerciseType(exIdx, type) {
    var n = deepClone(exam);
    var ex2 = n.exercises[exIdx];
    ex2.type = type;
    if (type === "items" && !ex2.questions) ex2.questions = [];
    if (type === "brut" && ex2.bareme === undefined) ex2.bareme = 20;
    if (type === "paliers" && !ex2.competences) ex2.competences = [];
    updateExam(n);
  }
  function updateBareme(exIdx, val) {
    var n = deepClone(exam);
    n.exercises[exIdx].bareme = parseFloat(val) || 0;
    updateExam(n);
  }
  function addQuestion(exIdx) {
    var n = deepClone(exam);
    n.exercises[exIdx].questions.push({ id: uid(), label: "" + (n.exercises[exIdx].questions.length + 1), items: [{ id: uid(), label: "Item 1", points: 1 }] });
    updateExam(n);
  }
  function addItem(exIdx, qIdx) {
    var n = deepClone(exam);
    var its = n.exercises[exIdx].questions[qIdx].items;
    its.push({ id: uid(), label: "Item " + (its.length + 1), points: 1 });
    updateExam(n);
  }
  function delAt(exIdx, qIdx, iIdx) {
    var n = deepClone(exam);
    if (iIdx !== undefined) n.exercises[exIdx].questions[qIdx].items.splice(iIdx, 1);
    else if (qIdx !== undefined) n.exercises[exIdx].questions.splice(qIdx, 1);
    else n.exercises.splice(exIdx, 1);
    updateExam(n);
  }
  // Compétences d'un exercice "Par Paliers" (critères locaux à l'exercice)
  function addCompetence(exIdx) {
    var n = deepClone(exam);
    var comps = n.exercises[exIdx].competences || (n.exercises[exIdx].competences = []);
    comps.push({ id: uid(), label: "Compétence " + (comps.length + 1),
      paliers: [0, 1, 2, 3].map(function() { return { indice: "", bareme: 0 }; }) });
    updateExam(n);
  }
  function delCompetence(exIdx, cIdx) {
    var n = deepClone(exam);
    n.exercises[exIdx].competences.splice(cIdx, 1);
    updateExam(n);
  }
  function updateCompetenceLabel(exIdx, cIdx, val) {
    var n = deepClone(exam);
    n.exercises[exIdx].competences[cIdx].label = val;
    updateExam(n);
  }
  function updatePalier(exIdx, cIdx, pIdx, field, val) {
    var n = deepClone(exam);
    n.exercises[exIdx].competences[cIdx].paliers[pIdx][field] = field === "bareme" ? (parseFloat(val) || 0) : val;
    updateExam(n);
  }

  // Confirmation suppression
  function askConfirm(label, onConfirm) {
    setConfirmDelete({ label: label, onConfirm: onConfirm });
  }

  // Réordonnancement exercices et questions
  function moveExercise(exIdx, dir) {
    var j = exIdx + dir;
    if (!exam || j < 0 || j >= exam.exercises.length) return;
    var n = deepClone(exam);
    var tmp = n.exercises[exIdx]; n.exercises[exIdx] = n.exercises[j]; n.exercises[j] = tmp;
    updateExam(n);
  }
  function moveQuestion(exIdx, qIdx, dir) {
    var j = qIdx + dir;
    if (!exam || j < 0 || j >= exam.exercises[exIdx].questions.length) return;
    var n = deepClone(exam);
    var tmp = n.exercises[exIdx].questions[qIdx]; n.exercises[exIdx].questions[qIdx] = n.exercises[exIdx].questions[j]; n.exercises[exIdx].questions[j] = tmp;
    updateExam(n);
  }

  // CSV import (élèves)
  function handleCSV(e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function(ev) {
      var parsed = importCSV(ev.target.result);
      if (parsed.length > 0) setStudents(parsed);
    };
    r.readAsText(f); e.target.value = "";
  }

  // ─── Ajout d'élève à la volée (onglet Correction) ────────────────
  function addStudentQuick() {
    var nom = newStudentNom.trim(); var prenom = newStudentPrenom.trim();
    if (!nom && !prenom) return;
    var ns = { id: uid(), nom: nom, prenom: prenom };
    var updated = students.concat([ns]);
    setStudents(updated);
    setNewStudentNom(""); setNewStudentPrenom("");
    setShowAddStudent(false);
    setSi(updated.length - 1); setEi(0);
  }

  // ─── Saisie des notes (Correction) ───────────────────────────────
  function setNoteBrute(studentId, exerciseId, val) {
    setNotesBrutes(function(prev) {
      var next = Object.assign({}, prev);
      var key = gradeKey(studentId, exerciseId);
      var parsed = parseFloat(val);
      if (val === "" || isNaN(parsed)) { delete next[key]; return next; }
      next[key] = Math.max(0, parsed);
      return next;
    });
  }
  function togglePalier(studentId, exerciseId, competenceId, palierIdx) {
    setPalierGrades(function(prev) {
      var key = palierKey(studentId, exerciseId, competenceId);
      var next = Object.assign({}, prev);
      if (next[key] === palierIdx) delete next[key]; // reclic = désélection
      else next[key] = palierIdx;
      return next;
    });
  }
  function toggleRemark(studentId, targetId, remarkId) {
    setRemarks(function(prev) {
      var key = remarkKey(studentId, targetId);
      var cur = prev[key] || [];
      var idx = cur.indexOf(remarkId);
      var next = idx >= 0 ? cur.filter(function(x) { return x !== remarkId; }) : cur.concat([remarkId]);
      var out = Object.assign({}, prev);
      if (next.length) out[key] = next; else delete out[key];
      return out;
    });
  }

  // Swipe
  var handleTouchStart = useCallback(function(e) { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, []);
  var handleTouchEnd = useCallback(function(e) {
    var dx = e.changedTouches[0].clientX - touchRef.current.x;
    var dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0 && si > 0) { setSi(si - 1); setEi(0); }
      if (dx < 0 && si < students.length - 1) { setSi(si + 1); setEi(0); }
    }
  }, [si, students.length]);

  // ─── Current student data (for correction mode) ───
  var safeIdx = si < students.length ? si : 0;
  var s = students[safeIdx] || { id: "none", nom: "", prenom: "" };
  // Réinitialiser si si dépasse le tableau (ajout/suppression d'élèves)
  useEffect(function() { if (students.length > 0 && si >= students.length) setSi(0); }, [students.length, si]);
  useEffect(function() {
    if (progressionStudentId && !students.find(function(s) { return s.id === progressionStudentId; })) {
      setProgressionStudentId(null);
    }
  }, [students, progressionStudentId]);
  var exCur = exam && exam.exercises[ei] ? exam.exercises[ei] : null;
  var stuTot = exam ? studentTotal(grades, notesBrutes, palierGrades, s.id, exam) : 0;
  var eAbsVals = exam ? exercisePctAbsolute(grades, notesBrutes, palierGrades, s.id, exam) : [];
  var eRelVals = exam ? exercisePctRelative(grades, notesBrutes, palierGrades, s.id, exam, students) : [];
  var curBrut = stuTot;
  var remAdjust = exam ? remarquesAjustement(remarks, s.id, exam) : 0;
  var manMalus = malusManuel[s.id] || 0;
  var totalAdjust = remAdjust + manMalus;
  var curNote = et > 0 ? noteSur100(Math.max(0, stuTot + totalAdjust), et) : 0;

  // Ranking
  var allNotesRanked = corriges.map(function(st) { return { id: st.id, note: getNote100(st.id) }; }).sort(function(a, b) { return b.note - a.note; });
  var rangMap = {}; var curRang = 1;
  allNotesRanked.forEach(function(item, i) { if (i > 0 && item.note < allNotesRanked[i - 1].note) curRang = i + 1; rangMap[item.id] = curRang; });
  var rang = rangMap[s.id] || "-";
  var gradedCount = corriges.length;

  // Search
  var searchResults = searchTerm.trim().length > 0
    ? students.map(function(st, idx) { return { st: st, idx: idx }; }).filter(function(o) { var term = searchTerm.toLowerCase(); return o.st.nom.toLowerCase().indexOf(term) >= 0 || o.st.prenom.toLowerCase().indexOf(term) >= 0; }).slice(0, 8)
    : [];

  // Stats
  var statNotes = corriges.map(function(ss) { return getNote100(ss.id); });
  var statMoy = statNotes.length ? statNotes.reduce(function(a, b) { return a + b; }, 0) / statNotes.length : 0;
  var statSorted = statNotes.slice().sort(function(a, b) { return a - b; });
  var statMed = statSorted.length % 2 === 0 && statSorted.length ? (statSorted[statSorted.length / 2 - 1] + statSorted[statSorted.length / 2]) / 2 : (statSorted[Math.floor(statSorted.length / 2)] || 0);
  var statMin = statSorted[0] || 0;
  var statMax = statSorted[statSorted.length - 1] || 0;
  var statSigma = statNotes.length ? Math.sqrt(statNotes.reduce(function(ss2, nn) { return ss2 + (nn - statMoy) * (nn - statMoy); }, 0) / statNotes.length) : 0;

  // Total points for exam editor display
  var totalPts = exam ? examTotal(exam) : 0;

  var navItems = [{ id: "prep", l: "Préparation", ic: "\u2699\uFE0F" }, { id: "correct", l: "Correction", ic: "\u270F\uFE0F" }, { id: "overview", l: "Vue d\u2019ensemble", ic: "\uD83D\uDCCB" }, { id: "stats", l: "Stats", ic: "\uD83D\uDCCA" }, { id: "sauvegarde", l: "Sauvegarde", ic: "\u2601\uFE0F" }];  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  // Splash screen
  if (showSplash) {
    return (
      <div style={{ fontFamily: FONT_B, background: "#faf7f2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={SPLASH_IMG} alt="C.H.E.C.K." style={{ maxWidth: "80%", maxHeight: "70vh", objectFit: "contain" }} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT_B, background: th.bg, color: th.text, height: "100vh", display: "flex", flexDirection: "column", overflowX: "hidden", maxWidth: "100vw", fontSize: "14px" }}
         onTouchStart={isMobile && mode === "correct" ? handleTouchStart : undefined}
         onTouchEnd={isMobile && mode === "correct" ? handleTouchEnd : undefined}
         onClick={function() { if (showProfileMenu) setShowProfileMenu(false); if (showDsMenu) setShowDsMenu(false); }}>
      <link href={FONTS_URL} rel="stylesheet" />
      <div style={{ position: "fixed", inset: 0, opacity: dark ? 0.025 : 0.035, backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, " + th.ruledLine + " 31px, " + th.ruledLine + " 32px)", backgroundPosition: "0 8px", pointerEvents: "none", zIndex: 0 }} />

      {/* MODALE CONFIRMATION SUPPRESSION */}
      {confirmDelete && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={function() { setConfirmDelete(null); }}>
        <div style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, padding: "24px 28px", width: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", textAlign: "center" }} onClick={function(e) { e.stopPropagation(); }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🗑️</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT, marginBottom: 6, color: th.text }}>Confirmer la suppression</div>
          <div style={{ fontSize: 12, color: th.textMuted, fontFamily: FONT_B, marginBottom: 20, lineHeight: 1.5 }}>
            {"Supprimer "}<strong>{confirmDelete.label}</strong>{" ?"}
            <br />{"Cette action est irréversible."}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={function() { setConfirmDelete(null); }} style={{ flex: 1, padding: "9px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 13, fontWeight: 600, background: th.surface, border: "1px solid " + th.border, color: th.textMuted }}>Annuler</button>
            <button onClick={function() { confirmDelete.onConfirm(); setConfirmDelete(null); }} style={{ flex: 1, padding: "9px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 13, fontWeight: 700, background: th.dangerBg, border: "1px solid " + th.danger + "40", color: th.danger }}>Supprimer</button>
          </div>
        </div>
      </div>}

      {confirmImportVide && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={function() { setConfirmImportVide(null); }}>
        <div style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, padding: "24px 28px", width: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", textAlign: "center" }} onClick={function(e) { e.stopPropagation(); }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT, marginBottom: 6, color: th.text }}>Attention — fichier vide détecté</div>
          <div style={{ fontSize: 12, color: th.textMuted, fontFamily: FONT_B, marginBottom: 20, lineHeight: 1.5 }}>
            {"Le fichier sélectionné ne contient aucun DS ni élève. Charger ce fichier remplacerait votre travail en cours par un état vide."}
            <br /><br />{"Vérifiez que vous avez sélectionné le bon fichier."}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={function() { confirmImportVide(); setConfirmImportVide(null); }} style={{ flex: 1, padding: "9px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 13, fontWeight: 600, background: th.surface, border: "1px solid " + th.border, color: th.textMuted }}>Charger quand même</button>
            <button autoFocus onClick={function() { setConfirmImportVide(null); }} style={{ flex: 1, padding: "9px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 13, fontWeight: 700, background: th.accent, border: "none", color: "#fff" }}>Annuler</button>
          </div>
        </div>
      </div>}

      {/* HEADER — escamotable au scroll, taille agrandie */}
      <header style={{ background: th.card, borderBottom: "2px solid " + th.headerBorder, padding: isMobile ? "8px 10px" : "10px 14px", display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, position: "sticky", top: 0, zIndex: 100, boxShadow: th.shadow, flexShrink: 0 }}>
        <img src={appTheme === "dark" ? LOGO_DARK : appTheme === "young" ? LOGO_YOUNG : LOGO_LIGHT} alt="C.H.E.C.K." onClick={function() { setMode("accueil"); }} style={{ height: (isMobile || isTablet) ? 32 : 42, objectFit: "contain", cursor: "pointer" }} />
        {/* Sélecteur de profil — toujours visible */}
        <div style={{ position: "relative" }}>
          <button onClick={function() { setShowProfileMenu(!showProfileMenu); setEditingProfileId(null); setNewProfileName(""); }}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: isMobile ? 11 : 12, fontWeight: 600, background: showProfileMenu ? th.accentBg : "transparent", border: "1px solid " + (showProfileMenu ? th.accent + "40" : th.border), color: th.textMuted }}
            title="Changer de profil">
            {"\uD83D\uDC64"}
            {!isMobile && !isTablet && <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(profiles.find(function(p) { return p.id === activeProfileId; }) || {}).name || ""}</span>}
            <span style={{ fontSize: 9, opacity: 0.6 }}>{"▾"}</span>
          </button>
          {showProfileMenu && <div style={{ position: "absolute", left: 0, top: "100%", marginTop: 4, background: th.card, border: "1px solid " + th.border, borderRadius: th.radiusSm, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", zIndex: 120, minWidth: 210, overflow: "hidden" }} onClick={function(e) { e.stopPropagation(); }}>
            {profiles.map(function(p) {
              var isActive = p.id === activeProfileId;
              var isEditing = editingProfileId === p.id;
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderBottom: "1px solid " + th.border, background: isActive ? th.accentBg : "transparent" }}>
                  {isEditing
                    ? <input autoFocus value={editingProfileName} onChange={function(e) { setEditingProfileName(e.target.value); }}
                        onKeyDown={function(e) { if (e.key === "Enter") renameProfile(p.id, editingProfileName); if (e.key === "Escape") setEditingProfileId(null); }}
                        onBlur={function() { renameProfile(p.id, editingProfileName); }}
                        style={{ flex: 1, fontFamily: FONT_B, fontSize: 12, padding: "2px 6px", borderRadius: 4, border: "1px solid " + th.accent, background: th.surface, color: th.text, outline: "none" }} />
                    : <button onClick={function() { if (!isActive) switchProfile(p.id); else setShowProfileMenu(false); }}
                        style={{ flex: 1, textAlign: "left", fontFamily: FONT_B, fontSize: 12, fontWeight: isActive ? 700 : 400, background: "transparent", border: "none", cursor: "pointer", color: isActive ? th.accent : th.text, padding: "2px 0" }}>
                        {(isActive ? "\u25CF " : "\u25CB ") + p.name}
                      </button>
                  }
                  <button onClick={function() { setEditingProfileId(p.id); setEditingProfileName(p.name); }}
                    style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: th.textDim, padding: "2px 4px", flexShrink: 0 }} title="Renommer">{"✏️"}</button>
                  {!isActive && profiles.length > 1 &&
                    <button onClick={function() { askConfirm("Supprimer le profil \"" + p.name + "\" ?", function() { deleteProfile(p.id); }); setShowProfileMenu(false); }}
                      style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: th.danger, padding: "2px 4px", flexShrink: 0 }} title="Supprimer">{"\uD83D\uDDD1\uFE0F"}</button>
                  }
                </div>
              );
            })}
            {/* Créer un nouveau profil */}
            <div style={{ padding: "6px 10px" }}>
              <button
                onClick={function() { setNewProfileSourceId(activeProfileId); setShowCreateProfile(true); }}
                style={{ width: "100%", fontFamily: FONT_B, fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 4, cursor: "pointer", background: th.accentBg, border: "1px solid " + th.accent + "40", color: th.accent, textAlign: "left" }}>
                {"+ Nouveau profil"}
              </button>
            </div>
          </div>}
        </div>
        {!isMobile && !isTablet && examNomDS && (function() {
          if (exams.length <= 1) {
            return <span style={{ fontSize: 13, color: th.textMuted, fontFamily: FONT, fontStyle: "italic" }}>{"\u2014 " + examNomDS + (examDateDS ? " \u00B7 " + examDateDS : "")}</span>;
          }
          return (
            <div style={{ position: "relative" }}>
              <button
                onClick={function() { setShowMore(false); setShowProfileMenu(false); setShowDsMenu(function(v) { return !v; }); }}
                style={{ background: showDsMenu ? th.accentBg : "transparent", border: "1px solid " + (showDsMenu ? th.accent + "40" : th.border), borderRadius: th.radiusSm, padding: "3px 10px", cursor: "pointer", fontFamily: FONT, fontStyle: "italic", fontSize: 13, color: showDsMenu ? th.accent : th.textMuted }}
                title="Changer de devoir">
                {"\u2014 " + examNomDS + (examDateDS ? " \u00B7 " + examDateDS : "") + " \u25BE"}
              </button>
              {showDsMenu && (
                <div style={{ position: "absolute", left: 0, top: "100%", marginTop: 4, background: th.card, border: "1px solid " + th.border, borderRadius: th.radiusSm, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", zIndex: 120, minWidth: 200, overflow: "hidden" }}
                     onClick={function(e) { e.stopPropagation(); }}>
                  {exams.map(function(ex) {
                    var isActive = ex.id === activeExamId;
                    return (
                      <button key={ex.id}
                        onClick={function() { setActiveExamId(ex.id); setShowDsMenu(false); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: isActive ? th.accentBg : "transparent", border: "none", borderBottom: "1px solid " + th.border, cursor: "pointer", fontFamily: FONT_B, fontSize: 12, color: isActive ? th.accent : th.text, textAlign: "left", fontWeight: isActive ? 700 : 400 }}>
                        <span style={{ fontSize: 9, color: isActive ? th.accent : th.textDim }}>{isActive ? "\u25CF" : "\u25CB"}</span>
                        <span style={{ flex: 1 }}>{ex.nomDS || ex.name}</span>
                        {ex.dateDS && <span style={{ fontSize: 10, color: th.textDim, fontFamily: MONO }}>{ex.dateDS}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
        {exam && mode === "correct" && <span style={{ fontSize: isMobile ? 10 : 11, color: th.accent, fontWeight: 600, fontFamily: MONO, background: th.accentBg, padding: "3px 8px", borderRadius: 10, border: "1px solid " + th.accent + "25" }}>{gradedCount + "/" + presents.length}</span>}
        <div style={{ flex: 1 }} />
        {!isMobile && !isTablet && <div style={{ display: "flex", gap: 2 }}>
          {navItems.map(function(nn) { return (
            <button key={nn.id} onClick={function() { setMode(nn.id); }} style={{ display: "flex", alignItems: "center", gap: 3, padding: "6px 10px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 12, fontWeight: 600, border: "1px solid " + (mode === nn.id ? th.accent + "40" : "transparent"), background: mode === nn.id ? th.accent + "12" : "transparent", color: mode === nn.id ? th.accent : th.textMuted }}>
              {nn.ic} {nn.l}
            </button>
          ); })}
        </div>}
        {!isMobile && !isTablet && <div style={{ flex: 1 }} />}
        
        {!isMobile && !isTablet && <button onClick={saveJSON} style={{ ...inp, cursor: "pointer", fontSize: 12, padding: "5px 8px" }}>{"\uD83D\uDCBE"}</button>}
        {!isMobile && !isTablet && <button onClick={function() { fileRef.current && fileRef.current.click(); }} style={{ ...inp, cursor: "pointer", fontSize: 12, padding: "5px 8px" }}>{"\uD83D\uDCC2"}</button>}
        {/* Menu ⋯ — toujours à droite, contient zoom + thème + À propos */}
        <div style={{ position: "relative" }}>
          <button onClick={function() { setShowMore(function(v) { return !v; }); }}
            style={{ ...inp, cursor: "pointer", fontSize: 16, padding: "5px 9px", background: showMore ? th.accentBg : "transparent", border: "1px solid " + (showMore ? th.accent + "40" : th.border), color: showMore ? th.accent : th.textMuted }}
            title="Plus d'options">{"⋯"}</button>
          {showMore && <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, background: th.card, border: "1px solid " + th.border, borderRadius: th.radiusSm, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", zIndex: 120, minWidth: 190, overflow: "hidden", padding: "6px 0" }} onClick={function(e) { e.stopPropagation(); }}>
            
            {/* Navigation onglets — visible en mode mobile (complète la nav bas) */}
            {isMobile && <div style={{ borderBottom: "1px solid " + th.border, padding: "4px 0" }}>
              {navItems.map(function(nn) { return (
                <button key={nn.id} onClick={function() { setMode(nn.id); setShowMore(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: mode === nn.id ? th.accentBg : "transparent", border: "none", cursor: "pointer", fontFamily: FONT_B, fontSize: 13, color: mode === nn.id ? th.accent : th.text, textAlign: "left", fontWeight: mode === nn.id ? 700 : 400 }}>
                  {nn.ic} {nn.l}
                </button>
              ); })}
            </div>}
            {/* Sauvegarde JSON — visible en mode mobile */}
            {isMobile && <div style={{ display: "flex", borderBottom: "1px solid " + th.border }}>
              <button onClick={function() { saveJSON(); setShowMore(false); }} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "transparent", border: "none", borderRight: "1px solid " + th.border, cursor: "pointer", fontFamily: FONT_B, fontSize: 13, color: th.text, textAlign: "left" }}>{"💾"} Sauver</button>
              <button onClick={function() { fileRef.current && fileRef.current.click(); setShowMore(false); }} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT_B, fontSize: 13, color: th.text, textAlign: "left" }}>{"📂"} Charger</button>
            </div>}
            {/* Navigation onglets — visible uniquement en mode tablette */}
            {isTablet && <div style={{ borderBottom: "1px solid " + th.border, padding: "4px 0" }}>
              {navItems.map(function(nn) { return (
                <button key={nn.id} onClick={function() { setMode(nn.id); setShowMore(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: mode === nn.id ? th.accentBg : "transparent", border: "none", cursor: "pointer", fontFamily: FONT_B, fontSize: 13, color: mode === nn.id ? th.accent : th.text, textAlign: "left", fontWeight: mode === nn.id ? 700 : 400 }}>
                  {nn.ic} {nn.l}
                </button>
              ); })}
            </div>}
            {/* Sauvegarde JSON — visible uniquement en mode tablette */}
            {isTablet && <div style={{ display: "flex", borderBottom: "1px solid " + th.border }}>
              <button onClick={function() { saveJSON(); setShowMore(false); }} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "transparent", border: "none", borderRight: "1px solid " + th.border, cursor: "pointer", fontFamily: FONT_B, fontSize: 13, color: th.text, textAlign: "left" }}>{"💾"} Sauver</button>
              <button onClick={function() { fileRef.current && fileRef.current.click(); setShowMore(false); }} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT_B, fontSize: 13, color: th.text, textAlign: "left" }}>{"📂"} Charger</button>
            </div>}
            {/* Zoom */}
            <div style={{ display: "flex", alignItems: "center", padding: "6px 12px", borderBottom: "1px solid " + th.border }}>
              <span style={{ fontSize: 11, color: th.textMuted, fontFamily: FONT_B, flex: 1 }}>{"Zoom"}</span>
              <button onClick={function() { setUiScale(function(v) { return Math.max(0.75, +(v - 0.05).toFixed(2)); }); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 15, color: th.textMuted, padding: "2px 7px", lineHeight: 1 }} title="Réduire">{"−"}</button>
              <span style={{ fontFamily: MONO, fontSize: 11, color: th.textDim, minWidth: 36, textAlign: "center", userSelect: "none" }}>{Math.round(uiScale * 100) + "%"}</span>
              <button onClick={function() { setUiScale(function(v) { return Math.min(1.5, +(v + 0.05).toFixed(2)); }); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 15, color: th.textMuted, padding: "2px 7px", lineHeight: 1 }} title="Agrandir">{"+"}</button>
            </div>
            
            {/* Thème */}
            <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid " + th.border, gap: 8 }}>
              <span style={{ fontSize: 11, color: th.textMuted, fontFamily: FONT_B, flex: 1 }}>{"Thème"}</span>
              {[{ v: "light", ic: "\u2600\uFE0F" }, { v: "dark", ic: "\uD83C\uDF19" }, { v: "young", ic: "\uD83C\uDF08" }].map(function(t) {
                return <button key={t.v} onClick={function() { setAppTheme(t.v); }}
                  style={{ background: appTheme === t.v ? th.accentBg : "transparent", border: "1px solid " + (appTheme === t.v ? th.accent + "55" : th.border), borderRadius: 4, cursor: "pointer", fontSize: 14, padding: "2px 6px", opacity: appTheme === t.v ? 1 : 0.5 }}
                  title={t.v}>{t.ic}</button>;
              })}
            </div>
            {/* Aide */}
            <button onClick={function() { setMode("aide"); setShowMore(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: mode === "aide" ? th.accentBg : "transparent", border: "none", cursor: "pointer", fontFamily: FONT_B, fontSize: 12, color: mode === "aide" ? th.accent : th.textMuted, textAlign: "left" }}>
              {"ℹ️"} <span>{"Aide"}</span>
            </button>
            {/* À propos */}
            <button onClick={function() { setShowApropos(true); setShowMore(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT_B, fontSize: 12, color: th.textMuted, textAlign: "left" }}>
              {"❓"} <span>{"À propos"}</span>
            </button>

          </div>}
        </div>
        <input ref={fileRef} type="file" accept=".json" onChange={loadJSONFile} style={{ display: "none" }} />
        <input ref={backupFileRef} type="file" accept=".json" onChange={loadBackupFile} style={{ display: "none" }} />
      </header>
      {/* Barre de progression — correction uniquement */}
      {mode === "correct" && exam && presents.length > 0 && (
        <div style={{ height: 3, background: th.border, flexShrink: 0 }}>
          <div style={{ height: "100%", background: th.success, width: (gradedCount / presents.length * 100) + "%", transition: "width 0.4s" }} />
        </div>
      )}

      {/* MAIN — zoomé via la propriété CSS zoom (scroll natif, pas de compensation) */}
      <div ref={mainScrollRef} style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <div style={{ zoom: isMobile ? 1 : sc }}>
        <main key={mode} className="tab-enter" style={{ padding: isMobile ? 6 : 10, maxWidth: isMobile ? "100%" : "840px", margin: "0 auto", width: "100%", boxSizing: "border-box", position: "relative", zIndex: 1, paddingBottom: isMobile ? 70 : 10 }}>


        {/* ═══ PREPARATION ═══ */}
        {mode === "prep" && <div>
          {/* Exam selector */}
          {exams.length > 1 && <div style={{ display: "flex", gap: 3, marginBottom: 10, flexWrap: "wrap" }}>
            {exams.map(function(ex) { return (
              <button key={ex.id} onClick={function() { setActiveExamId(ex.id); }} style={{ padding: "4px 10px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 11, fontWeight: 600, background: activeExamId === ex.id ? th.accentBg : th.surface, border: "1px solid " + (activeExamId === ex.id ? th.accent + "55" : th.border), color: activeExamId === ex.id ? th.accent : th.textMuted }}>{ex.nomDS || ex.name}</button>
            ); })}
          </div>}

          {/* Exam editor */}
          {exam && <div style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, marginBottom: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: collapsedExams[exam.id] ? "none" : "1px solid " + th.border, background: th.surface, cursor: "pointer" }} onClick={function() { setCollapsedExams(function(c) { var n2 = {}; for (var k in c) n2[k] = c[k]; n2[exam.id] = !c[exam.id]; return n2; }); }}>
              <span style={{ fontSize: 10, color: th.textDim, transform: collapsedExams[exam.id] ? "rotate(-90deg)" : "none", transition: "transform 0.15s" }}>{"▼"}</span>
              <input value={examNomDS} onChange={function(e) { e.stopPropagation(); setExamNomDS(e.target.value); }} onClick={function(e) { e.stopPropagation(); }} style={{ ...inp, flex: 2, fontSize: 16, fontWeight: 600, background: "transparent", border: "none" }} placeholder="Nom du DS (ex: DS 05)..." />
              <span style={{ fontSize: 11, color: th.textDim, fontFamily: FONT_B, flexShrink: 0 }}>{"Date :"}</span>
              <input value={examDateDS} onChange={function(e) { e.stopPropagation(); setExamDateDS(e.target.value); }} onClick={function(e) { e.stopPropagation(); }} style={{ ...inp, flex: 1, fontSize: 12, background: "transparent", border: "none", color: th.textMuted }} placeholder="jj/mm/aaaa..." />
              <span style={{ fontFamily: MONO, fontSize: 13, color: th.accent, fontWeight: 700, padding: "2px 8px", background: th.accentBg, borderRadius: th.radiusSm }}>{totalPts + " pts"}</span>
              <button onClick={function(e) { e.stopPropagation(); askConfirm("le devoir « " + examNomDS + " »", function() { deleteExam(exam.id); }); }} style={{ background: th.dangerBg, border: "none", color: th.danger, borderRadius: th.radiusSm, padding: "4px 6px", cursor: "pointer", fontSize: 12 }}>{"✗"}</button>
            </div>
            {!collapsedExams[exam.id] && <div style={{ padding: 10 }}>
              {exam.exercises.map(function(ex, exIdx) {
                var exType = ex.type || "items";
                var exPts = exType === "brut" ? (parseFloat(ex.bareme) || 0)
                  : exType === "paliers" ? (ex.competences || []).reduce(function(s2, c) { return s2 + c.paliers.reduce(function(m, p) { return Math.max(m, parseFloat(p.bareme) || 0); }, 0); }, 0)
                  : ex.questions.reduce(function(s2, q) { return s2 + q.items.reduce(function(si2, it) { return si2 + (+it.points || 0); }, 0); }, 0);
                var isCol = collapsed[ex.id];
                return (
                  <div key={ex.id} style={{ marginBottom: 8, background: th.surface, borderRadius: th.radiusSm, border: "1px solid " + th.border, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderBottom: isCol ? "none" : "1px solid " + th.border, cursor: "pointer" }} onClick={function() { setCollapsed(function(c) { var n2 = {}; for (var k in c) n2[k] = c[k]; n2[ex.id] = !c[ex.id]; return n2; }); }}>
                      <span style={{ fontSize: 10, color: th.textDim, transform: isCol ? "rotate(-90deg)" : "none", transition: "0.15s" }}>{"▼"}</span>
                      <input value={ex.title} onChange={function(e) { e.stopPropagation(); updateExam(updPath(exam, ["exercises", exIdx, "title"], e.target.value)); }} onClick={function(e) { e.stopPropagation(); }} style={{ ...inp, flex: 1, fontWeight: 600, background: "transparent", border: "none" }} />
                      <select value={exType} onClick={function(e) { e.stopPropagation(); }} onChange={function(e) { e.stopPropagation(); updateExerciseType(exIdx, e.target.value); }} style={{ ...inp, fontSize: 10, padding: "2px 4px" }}>
                        <option value="items">Questions / Items</option>
                        <option value="brut">Note brute</option>
                        <option value="paliers">Par Paliers</option>
                      </select>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: th.textMuted }}>{exPts + "pts"}</span>
                      <button onClick={function(e) { e.stopPropagation(); moveExercise(exIdx, -1); }} disabled={exIdx === 0} style={{ background: "none", border: "none", color: exIdx === 0 ? th.textDim : th.textMuted, cursor: exIdx === 0 ? "default" : "pointer", fontSize: 10, padding: "0 2px" }} title="Monter">{"▲"}</button>
                      <button onClick={function(e) { e.stopPropagation(); moveExercise(exIdx, 1); }} disabled={exIdx === exam.exercises.length - 1} style={{ background: "none", border: "none", color: exIdx === exam.exercises.length - 1 ? th.textDim : th.textMuted, cursor: exIdx === exam.exercises.length - 1 ? "default" : "pointer", fontSize: 10, padding: "0 2px" }} title="Descendre">{"▼"}</button>
                      <button onClick={function(e) { e.stopPropagation(); askConfirm("l’exercice « " + ex.title + " »", function() { delAt(exIdx); }); }} style={{ background: "none", border: "none", color: th.textDim, cursor: "pointer", fontSize: 11 }}>{"✕"}</button>
                    </div>
                    {!isCol && exType === "items" && <div style={{ padding: "4px 10px 8px" }}>
                      {ex.questions.map(function(q, qIdx) {
                        return (
                          <div key={q.id} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: qIdx < ex.questions.length - 1 ? "1px solid " + th.border + "22" : "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                              <span style={{ color: th.textMuted, fontSize: 10, fontWeight: 700, minWidth: 18 }}>Q.</span>
                              <input value={q.label} onChange={function(e) { updateExam(updPath(exam, ["exercises", exIdx, "questions", qIdx, "label"], e.target.value)); }} style={{ ...inp, width: 50 }} />
                              <div style={{ flex: 1 }} />
                              <span style={{ fontFamily: MONO, fontSize: 9, color: th.textMuted }}>{q.items.reduce(function(s2, it) { return s2 + (+it.points || 0); }, 0) + "pts"}</span>
                              <button onClick={function() { moveQuestion(exIdx, qIdx, -1); }} disabled={qIdx === 0} style={{ background: "none", border: "none", color: qIdx === 0 ? th.textDim : th.textMuted, cursor: qIdx === 0 ? "default" : "pointer", fontSize: 9, padding: "0 1px" }} title="Monter">{"▲"}</button>
                              <button onClick={function() { moveQuestion(exIdx, qIdx, 1); }} disabled={qIdx === ex.questions.length - 1} style={{ background: "none", border: "none", color: qIdx === ex.questions.length - 1 ? th.textDim : th.textMuted, cursor: qIdx === ex.questions.length - 1 ? "default" : "pointer", fontSize: 9, padding: "0 1px" }} title="Descendre">{"▼"}</button>
                              <button onClick={function() { askConfirm("la question « Q. " + q.label + " »", function() { delAt(exIdx, qIdx); }); }} style={{ background: "none", border: "none", color: th.textDim, cursor: "pointer", fontSize: 10 }}>{"✕"}</button>
                            </div>
                            <div style={{ marginLeft: 24 }}>
                              {q.items.map(function(it, iIdx) { return (
                                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                  <span style={{ color: th.textDim, fontSize: 8 }}>{"•"}</span>
                                  <input value={it.label} onChange={function(e) { updateExam(updPath(exam, ["exercises", exIdx, "questions", qIdx, "items", iIdx, "label"], e.target.value)); }} style={{ ...inp, flex: 1, fontSize: 11, padding: "2px 6px" }} placeholder="Description..." />
                                  <input value={it.hint || ""} onChange={function(e) { updateExam(updPath(exam, ["exercises", exIdx, "questions", qIdx, "items", iIdx, "hint"], e.target.value)); }} style={{ ...inp, flex: 1, fontSize: 10, padding: "2px 6px", color: th.textMuted, fontStyle: "italic" }} placeholder={"Indice de correction…"} />
                                  <input type="number" step="0.5" min="0" value={it.points} onChange={function(e) { var v = Math.max(0, parseFloat(e.target.value) || 0); updateExam(updPath(exam, ["exercises", exIdx, "questions", qIdx, "items", iIdx, "points"], v)); }} style={{ ...inp, width: 44, fontSize: 11, fontFamily: MONO, textAlign: "center", color: th.accent, padding: "2px 3px" }} />
                                  <button onClick={function() { askConfirm("l’item « " + (it.label || "sans nom") + " »", function() { delAt(exIdx, qIdx, iIdx); }); }} style={{ background: "none", border: "none", color: th.textDim, cursor: "pointer", fontSize: 9 }}>{"✕"}</button>
                                </div>
                              ); })}
                              <button onClick={function() { addItem(exIdx, qIdx); }} style={{ background: "none", border: "none", color: th.accent, cursor: "pointer", fontSize: 10, fontFamily: FONT_B }}>+ Item</button>
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={function() { addQuestion(exIdx); }} style={{ background: th.accentBg, border: "1px dashed " + th.accent + "33", color: th.accent, borderRadius: th.radiusSm, padding: "4px 8px", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: FONT_B, width: "100%" }}>+ Question</button>
                    </div>}
                    {!isCol && exType === "brut" && <div style={{ padding: "10px 10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: th.textMuted, fontFamily: FONT_B }}>{"Barème (points max) :"}</span>
                      <input type="number" min="0" step="0.5" value={ex.bareme !== undefined ? ex.bareme : 20} onChange={function(e) { updateBareme(exIdx, e.target.value); }} style={{ ...inp, width: 70, fontSize: 12, fontFamily: MONO, textAlign: "center", color: th.accent }} />
                      <span style={{ fontSize: 10, color: th.textDim, fontFamily: FONT_B }}>{"La note sera saisie directement par élève en Correction (ex : dictée)."}</span>
                    </div>}
                    {!isCol && exType === "paliers" && <div style={{ padding: "8px 10px 10px" }}>
                      {(ex.competences || []).map(function(comp, cIdx) {
                        return (
                          <div key={comp.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid " + th.border + "33" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <input value={comp.label} onChange={function(e) { updateCompetenceLabel(exIdx, cIdx, e.target.value); }} style={{ ...inp, flex: 1, fontSize: 12, fontWeight: 600 }} placeholder="Nom de la compétence..." />
                              <button onClick={function() { askConfirm("la compétence « " + comp.label + " »", function() { delCompetence(exIdx, cIdx); }); }} style={{ background: "none", border: "none", color: th.textDim, cursor: "pointer", fontSize: 10 }}>{"✕"}</button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                              {comp.paliers.map(function(p, pIdx) {
                                return (
                                  <div key={pIdx} style={{ border: "1px solid " + th.border, borderRadius: th.radiusSm, padding: 6, background: th.card }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: th.textMuted, marginBottom: 3 }}>{"Palier " + (pIdx + 1)}</div>
                                    <input value={p.indice} onChange={function(e) { updatePalier(exIdx, cIdx, pIdx, "indice", e.target.value); }} style={{ ...inp, width: "100%", fontSize: 10, marginBottom: 3, boxSizing: "border-box" }} placeholder="Indice de correction..." />
                                    <input type="number" min="0" step="0.5" value={p.bareme} onChange={function(e) { updatePalier(exIdx, cIdx, pIdx, "bareme", e.target.value); }} style={{ ...inp, width: "100%", fontSize: 11, fontFamily: MONO, textAlign: "center", color: th.accent, boxSizing: "border-box" }} />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={function() { addCompetence(exIdx); }} style={{ background: th.accentBg, border: "1px dashed " + th.accent + "33", color: th.accent, borderRadius: th.radiusSm, padding: "4px 8px", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: FONT_B, width: "100%" }}>+ Compétence</button>
                    </div>}
                  </div>
                );
              })}
              <button onClick={function() { addExercise("items"); }} style={{ background: th.accentBg, border: "1px dashed " + th.accent + "44", color: th.accent, borderRadius: th.radiusSm, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: FONT_B, width: "100%" }}>+ Exercice</button>
            </div>}
          </div>}

          <button onClick={createExam} style={{ background: th.accentBg, border: "1px dashed " + th.accent + "55", color: th.accent, borderRadius: th.radius, padding: "10px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: FONT_B, width: "100%", marginBottom: 14 }}>+ Nouveau devoir</button>

          {/* Students */}
          <div style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT }}>{"Eleves (" + students.length + ")"}</span>
              <div style={{ flex: 1 }} />
              <button onClick={function() { csvRef.current && csvRef.current.click(); }} style={{ background: th.accentBg, border: "1px solid " + th.accent + "33", color: th.accent, borderRadius: th.radiusSm, padding: "4px 8px", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: FONT_B }}>{"📂 CSV"}</button>
              <input ref={csvRef} type="file" accept=".csv,.txt,.tsv" onChange={handleCSV} style={{ display: "none" }} />
            </div>
            <div style={{ fontSize: 10, color: th.textDim, marginBottom: 8, fontFamily: FONT_B }}>NOM;Prenom — un par ligne</div>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {students.map(function(st, idx) { return (
                <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: th.textDim, minWidth: 18, textAlign: "right" }}>{idx + 1}</span>
                  <input value={st.nom} onChange={function(e) { var n2 = students.slice(); n2[idx] = { ...n2[idx], nom: e.target.value }; setStudents(n2); }} placeholder="NOM" style={{ ...inp, flex: 1, fontSize: 12 }} />
                  <input value={st.prenom} onChange={function(e) { var n2 = students.slice(); n2[idx] = { ...n2[idx], prenom: e.target.value }; setStudents(n2); }} placeholder="Prenom" style={{ ...inp, flex: 1, fontSize: 12 }} />
                  <button onClick={function() { askConfirm((st.prenom + " " + st.nom).trim() || "cet élève", function() { setStudents(students.filter(function(_, j) { return j !== idx; })); }); }} style={{ background: "none", border: "none", color: th.textDim, cursor: "pointer", fontSize: 10 }}>{"✕"}</button>
                </div>
              ); })}
            </div>
            <button onClick={function() { setStudents(students.concat([{ id: uid(), nom: "", prenom: "" }])); }} style={{ marginTop: 4, background: "none", border: "1px dashed " + th.border, color: th.textMuted, borderRadius: th.radiusSm, padding: "4px 8px", cursor: "pointer", fontSize: 11, fontFamily: FONT_B, width: "100%" }}>+ Eleve</button>
          </div>
        </div>}

        {/* ═══ CORRECTION ═══ */}
        {mode === "correct" && exam && students.length === 0 && (
          <div style={{ maxWidth: 420, margin: "60px auto", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: th.textMuted, fontFamily: FONT_B, marginBottom: 12 }}>{"Aucun élève pour ce devoir."}</div>
            <button onClick={function() { setShowAddStudent(true); }} style={{ padding: "10px 16px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 13, fontWeight: 700, background: th.accentBg, border: "1px solid " + th.accent + "55", color: th.accent }}>{"+ Ajouter un élève"}</button>
          </div>
        )}

        {mode === "correct" && exam && students.length > 0 && <div style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 80 }}>
          {/* Search overlay */}
          {showSearch && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 150, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }} onClick={function() { setShowSearch(false); setSearchTerm(""); }}>
            <div style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, padding: 12, width: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }} onClick={function(e) { e.stopPropagation(); }}>
              <input ref={searchInputRef} value={searchTerm} onChange={function(e) { setSearchTerm(e.target.value); }} placeholder="Chercher un élève" style={{ background: th.card, border: "1px solid " + th.border, color: th.text, borderRadius: 4, padding: "10px 12px", fontSize: 15, fontFamily: FONT_B, outline: "none", width: "100%", marginBottom: 6, boxSizing: "border-box" }} />
              {searchResults.map(function(o) { return (
                <button key={o.st.id} onClick={function() { setSi(o.idx); setEi(0); setShowSearch(false); setSearchTerm(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", marginBottom: 2, borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 14, textAlign: "left", background: o.idx === si ? th.accentBg : "transparent", border: "1px solid " + (o.idx === si ? th.accent + "30" : th.border), color: th.text }}>
                  <span style={{ fontWeight: 600 }}>{o.st.prenom}</span> <span style={{ fontVariant: "small-caps" }}>{o.st.nom}</span>
                </button>); })}
              {searchTerm.trim().length > 0 && searchResults.length === 0 && <div style={{ padding: 10, textAlign: "center", color: th.textDim, fontSize: 13 }}>Aucun résultat</div>}
            </div>
          </div>}

          {/* Ajout d'élève à la volée */}
          {showAddStudent && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={function() { setShowAddStudent(false); }}>
            <div style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, padding: 18, width: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }} onClick={function(e) { e.stopPropagation(); }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT, marginBottom: 10, color: th.text }}>{"+ Ajouter un élève"}</div>
              <input autoFocus value={newStudentNom} onChange={function(e) { setNewStudentNom(e.target.value); }} placeholder="NOM" style={{ ...inp, width: "100%", boxSizing: "border-box", marginBottom: 6 }} />
              <input value={newStudentPrenom} onChange={function(e) { setNewStudentPrenom(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") addStudentQuick(); }} placeholder="Prénom" style={{ ...inp, width: "100%", boxSizing: "border-box", marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={function() { setShowAddStudent(false); setNewStudentNom(""); setNewStudentPrenom(""); }} style={{ flex: 1, padding: "8px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 12, background: th.surface, border: "1px solid " + th.border, color: th.textMuted }}>{"Annuler"}</button>
                <button onClick={addStudentQuick} style={{ flex: 1, padding: "8px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 12, fontWeight: 700, background: th.accent, border: "none", color: "#fff" }}>{"Ajouter"}</button>
              </div>
            </div>
          </div>}

          {/* Student card — héros */}
          <div style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, padding: "14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, boxShadow: th.shadow, overflow: "hidden" }}>
            <div onClick={function() { if (si > 0) { setSi(si - 1); setEi(0); } }} style={{ fontSize: 18, color: si === 0 ? th.textDim : th.textMuted, cursor: "pointer", padding: "0 4px", userSelect: "none" }}>{"◂"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: FONT }}>{s.prenom} <span style={{ fontVariant: "small-caps", letterSpacing: "0.5px" }}>{s.nom}</span></div>
                <button onClick={function() { setShowSearch(true); }} style={{ background: "none", border: "1px solid " + th.border, borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontSize: 10, color: th.textDim, fontFamily: FONT_B }}>{"🔍"}</button>
                <button onClick={function() { setShowAddStudent(true); }} style={{ background: "none", border: "1px solid " + th.border, borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontSize: 10, color: th.textDim, fontFamily: FONT_B }} title="Ajouter un élève">{"+"}</button>
              </div>
              <div style={{ fontSize: 13, color: th.textMuted, fontFamily: FONT_B, marginTop: 2 }}>
                {"Rang "}<b style={{ color: th.accent }}>{rang}</b>{"/" + presents.length}
              </div>
            </div>
            <div style={{ textAlign: "right", minWidth: 90 }}>
              <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: curNote >= 70 ? th.success : curNote >= 50 ? th.warning : th.danger }}>{fmt1(curNote)}<span style={{ fontSize: 11, color: th.textDim }}>/100</span></div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: th.textDim }}>{"brut " + fmt1(curBrut) + "/" + et + " pts"}</div>
              {totalAdjust !== 0 && <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: totalAdjust > 0 ? th.success : th.danger }}>{(totalAdjust > 0 ? "+" : "") + totalAdjust + " pt"}</div>}
            </div>
            <div onClick={function() { if (si < students.length - 1) { setSi(si + 1); setEi(0); } }} style={{ fontSize: 18, color: si === students.length - 1 ? th.textDim : th.textMuted, cursor: "pointer", padding: "0 4px", userSelect: "none" }}>{"▸"}</div>
          </div>

          {/* Note par exercice */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {exam.exercises.map(function(x) {
              var sc = exerciseScore(grades, notesBrutes, palierGrades, s.id, x);
              return (
                <div key={x.id} style={{ padding: "4px 8px", borderRadius: th.radiusSm, border: "1px solid " + th.border, background: th.surface, fontSize: 10, fontFamily: FONT_B, color: th.textMuted }}>
                  <span style={{ fontWeight: 600, color: th.text }}>{x.title}</span>{" : "}<span style={{ fontFamily: MONO }}>{fmt1(sc.earned) + "/" + fmt1(sc.total)}</span>
                </div>
              );
            })}
          </div>

          {/* Malus manuel */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 10px", borderRadius: th.radiusSm, background: th.surface, border: "1px solid " + th.border }}>
            <span style={{ fontSize: 11, fontFamily: FONT_B, color: th.textMuted }}>
              {"Remarques : " + (remAdjust > 0 ? "+" : "") + remAdjust + " pt"}
            </span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: th.textMuted, fontFamily: FONT_B }}>Malus/bonus manuel (pts) :</span>
            <input type="number" step="0.5" value={manMalus}
              onChange={function(e) { var v = parseFloat(e.target.value) || 0; setMalusManuel(function(p) { var n = {}; for (var k in p) n[k] = p[k]; n[s.id] = v; return n; }); }}
              style={{ background: th.card, border: "1px solid " + th.border, color: th.text, borderRadius: 4, width: 50, textAlign: "center", fontFamily: MONO, fontSize: 11, padding: "2px 4px", outline: "none" }} />
          </div>

          {/* Exercise tabs */}
          <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
            {exam.exercises.map(function(x, i) {
              var sc = exerciseScore(grades, notesBrutes, palierGrades, s.id, x);
              return (
                <button key={x.id} onClick={function() { setEi(i); }} style={{ flex: 1, padding: "6px 3px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 10, fontWeight: 600, background: i === ei ? th.accent + "15" : "transparent", border: "1.5px solid " + (i === ei ? th.accent + "50" : th.border), color: i === ei ? th.accent : th.textMuted }}>
                  <div>{x.title.length > 20 ? x.title.slice(0, 18) + "…" : x.title}</div>
                  <div style={{ fontSize: 9, fontFamily: MONO, opacity: 0.7 }}>{fmt1(sc.earned) + "/" + fmt1(sc.total)}</div>
                </button>); })}
          </div>

          {/* Remarques (fixes) pour un exercice sans sous-questions (brut/paliers) */}
          {exCur && (exCur.type === "brut" || exCur.type === "paliers") && (function() {
            var tr = remarks[remarkKey(s.id, exCur.id)] || [];
            return (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
                {REMARQUES_FIXES.map(function(rem) {
                  var act = tr.indexOf(rem.id) >= 0;
                  return <button key={rem.id} onClick={function() { toggleRemark(s.id, exCur.id, rem.id); }} style={{ padding: "5px 9px", borderRadius: 14, cursor: "pointer", fontFamily: FONT_B, fontSize: 11, fontWeight: 600, background: act ? th.warningBg : "transparent", border: "1px solid " + (act ? th.warning + "40" : th.border), color: act ? th.warning : th.textMuted }}>{rem.icon + " " + rem.label}</button>;
                })}
              </div>
            );
          })()}

          {/* Exercice type "Note brute" */}
          {exCur && exCur.type === "brut" && (
            <div style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, padding: 16, marginBottom: 6, boxShadow: th.shadow, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontFamily: FONT_B, color: th.textMuted }}>{"Note :"}</span>
              <input type="number" min="0" max={exCur.bareme} step="0.5"
                value={notesBrutes[gradeKey(s.id, exCur.id)] !== undefined ? notesBrutes[gradeKey(s.id, exCur.id)] : ""}
                onChange={function(e) { setNoteBrute(s.id, exCur.id, e.target.value); }}
                style={{ ...inp, width: 70, fontSize: 16, fontFamily: MONO, textAlign: "center", color: th.accent }} />
              <span style={{ fontSize: 13, fontFamily: MONO, color: th.textDim }}>{"/ " + (exCur.bareme || 0)}</span>
            </div>
          )}

          {/* Exercice type "Par Paliers" */}
          {exCur && exCur.type === "paliers" && (
            <div style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, padding: 10, marginBottom: 6, boxShadow: th.shadow, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_B }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", fontSize: 11, color: th.textMuted, padding: "4px 6px" }}>{"Compétence"}</th>
                    {[0, 1, 2, 3].map(function(pIdx) { return <th key={pIdx} style={{ fontSize: 11, color: th.textMuted, padding: "4px 6px" }}>{"Palier " + (pIdx + 1)}</th>; })}
                  </tr>
                </thead>
                <tbody>
                  {(exCur.competences || []).map(function(comp) {
                    var sel = palierGrades[palierKey(s.id, exCur.id, comp.id)];
                    return (
                      <tr key={comp.id}>
                        <td style={{ fontSize: 12, fontWeight: 600, color: th.text, padding: "4px 6px", whiteSpace: "nowrap" }}>{comp.label}</td>
                        {comp.paliers.map(function(p, pIdx) {
                          var isSel = sel === pIdx;
                          return (
                            <td key={pIdx} style={{ padding: 3 }}>
                              <button onClick={function() { togglePalier(s.id, exCur.id, comp.id, pIdx); }}
                                style={{ width: "100%", minHeight: 46, padding: "4px 6px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 10, textAlign: "left", background: isSel ? th.success + "18" : th.surface, border: "1.5px solid " + (isSel ? th.success + "55" : th.border), color: isSel ? th.text : th.textMuted }}>
                                <div style={{ fontSize: 9, opacity: 0.85 }}>{p.indice || "—"}</div>
                                <div style={{ fontFamily: MONO, fontWeight: 700, marginTop: 2, color: isSel ? th.success : th.textDim }}>{p.bareme + " pt"}</div>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Questions (exercice type "items") */}
          {exCur && (!exCur.type || exCur.type === "items") && exCur.questions.map(function(q) {
            var sc = questionScore(grades, s.id, q);
            var qr = remarks[remarkKey(s.id, q.id)] || [];
            return (
              <div key={q.id} style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, marginBottom: 6, overflow: "hidden", boxShadow: th.shadow }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderBottom: "1px solid " + th.border, background: th.surface }}>
                  <span style={{ fontWeight: 700, fontSize: 13, fontFamily: FONT }}>{"Q. " + q.label}</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: sc.earned === sc.total ? th.success : sc.earned > 0 ? th.warning : th.textDim }}>{sc.earned + "/" + sc.total}</span>
                </div>
                <div style={{ padding: 6 }}>
                  {q.items.map(function(it) {
                    var ch = !!grades[gradeKey(s.id, it.id)];
                    return (
                      <button key={it.id} onClick={function() { setGrades(function(p) { var n = {}; for (var k in p) n[k] = p[k]; n[gradeKey(s.id, it.id)] = !p[gradeKey(s.id, it.id)]; return n; }); }} style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 8, width: "100%", padding: isMobile ? "14px 12px" : "11px 10px", marginBottom: 2, borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: isMobile ? 15 : 13, textAlign: "left", background: ch ? th.success + "0a" : "transparent", border: "1.5px solid " + (ch ? th.success + "35" : th.border), color: ch ? th.text : th.textMuted, WebkitTapHighlightColor: "transparent" }} onMouseEnter={!isTouch ? function() { hintTimerRef.current = setTimeout(function() { if (it.hint) setItemHintVisible(it.id); }, 200); } : undefined} onMouseLeave={!isTouch ? function() { clearTimeout(hintTimerRef.current); setItemHintVisible(null); } : undefined}>
                        <div style={{ width: isMobile ? 28 : 22, height: isMobile ? 28 : 22, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 16 : 13, fontWeight: 800, background: ch ? th.success : "transparent", border: "2px solid " + (ch ? th.success : th.textDim), color: ch ? (dark ? "#1a1814" : "#fff") : "transparent", flexShrink: 0 }}>{"✓"}</div>
                        <span style={{ flex: 1, fontWeight: 500 }}>{it.label}</span>
                        {it.hint && (
                          <span
                            onClick={isTouch ? function(e) { e.stopPropagation(); setItemHintVisible(function(prev) { return prev === it.id ? null : it.id; }); } : undefined}
                            style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: isTouch ? "pointer" : "default", flexShrink: 0 }}>
                            <span style={{ width: 15, height: 15, borderRadius: "50%", border: "1px solid " + th.accent + "88", fontSize: 9, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", color: th.accent, background: th.accentBg, userSelect: "none" }}>{"ⓘ"}</span>
                            {itemHintVisible === it.id && (
                              <span style={{ position: "absolute", bottom: "calc(100% + 6px)", right: 0, minWidth: 160, maxWidth: 260, background: th.card, border: "1px solid " + th.accent + "55", borderRadius: th.radiusSm, padding: "6px 10px", fontSize: 11, fontFamily: FONT_B, color: th.text, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", zIndex: 50, lineHeight: 1.5, whiteSpace: "pre-wrap", pointerEvents: "none" }}>
                                {it.hint}
                              </span>
                            )}
                          </span>
                        )}
                        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: ch ? th.success : th.textDim }}>{it.points}</span>
                      </button>); })}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4, marginBottom: isTouch ? 8 : 4 }}>
                    {REMARQUES_FIXES.map(function(rem) {
                      var act = qr.indexOf(rem.id) >= 0;
                      return <button key={rem.id} onClick={function() { toggleRemark(s.id, q.id, rem.id); }} style={{ padding: isMobile ? "8px 12px" : "5px 9px", borderRadius: 14, cursor: "pointer", fontFamily: FONT_B, fontSize: isMobile ? 12 : 10, fontWeight: 600, background: act ? th.warningBg : "transparent", border: "1px solid " + (act ? th.warning + "40" : th.border), color: act ? th.warning : th.textMuted }}>{rem.icon + " " + rem.label}</button>; })}
                  </div>
                  {/* Case "traitée" — visible seulement si aucun item n'est coché */}
                  <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 4 }}>
                  {q.items.length >= 2 && (function() {
                    var allChecked = q.items.every(function(it) { return !!grades[gradeKey(s.id, it.id)]; });
                    return (
                      <button
                        onClick={function(e) {
                          e.stopPropagation();
                          setGrades(function(p) {
                            var ng = {}; for (var k in p) ng[k] = p[k];
                            q.items.forEach(function(it) { ng[gradeKey(s.id, it.id)] = !allChecked; });
                            return ng;
                          });
                        }}
                        title={allChecked ? "Tout décocher" : "Tout cocher"}
                        style={{ background: "none", border: "1px solid " + th.border, borderRadius: 3, cursor: "pointer", fontSize: 9, color: allChecked ? th.success : th.textDim, padding: "2px 8px", fontFamily: FONT_B, fontWeight: 700, opacity: 0.8 }}>
                        {allChecked ? "✓✓" : "☐→✓"}
                      </button>
                    );
                  })()}
                  {sc.earned === 0 && (
                    <button
                      onClick={function() {
                        var key = treatedKey(s.id, q.id);
                        setGrades(function(g) {
                          var ng = Object.assign({}, g);
                          if (ng[key]) delete ng[key]; else ng[key] = true;
                          return ng;
                        });
                      }}
                      style={{ padding: "2px 8px", fontSize: 9, borderRadius: 3, cursor: "pointer", border: "2px solid " + (grades[treatedKey(s.id, q.id)] ? th.warning : th.warning + "88"), background: grades[treatedKey(s.id, q.id)] ? th.warning + "22" : "transparent", color: th.warning, fontFamily: FONT_B, fontWeight: 700 }}
                    >
                      {grades[treatedKey(s.id, q.id)] ? "✓ traitée (0 pt)" : "marquer traitée"}
                    </button>
                  )}
                  </div>
                </div>
              </div>); })}

          {/* Bottom nav — navigation par exercice avec wrap vers élève suivant/précédent */}
          <div style={{ display: "flex", gap: 6, marginTop: 12, position: "sticky", bottom: isMobile ? 64 : 8 }}>
            <button onClick={function() {
              if (ei > 0) {
                setEi(ei - 1);
              } else if (si > 0) {
                setSi(si - 1);
                setEi(exam.exercises.length - 1);
              }
              if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
            }} style={{ flex: 1, padding: isMobile ? "16px" : "14px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: isMobile ? 14 : 13, fontWeight: 700, background: th.card, border: "1px solid " + th.border, color: (si === 0 && ei === 0) ? th.textDim : th.text, boxShadow: th.shadow }}>{"◄ Ex. préc."}</button>
            <button onClick={function() {
              if (ei < exam.exercises.length - 1) {
                setEi(ei + 1);
              } else if (si < students.length - 1) {
                setSi(si + 1);
                setEi(0);
              }
              if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
            }} style={{ flex: 1, padding: isMobile ? "16px" : "14px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: isMobile ? 14 : 13, fontWeight: 700, background: th.accent, border: "none", color: "#fff", boxShadow: th.shadow }}>{"Ex. suiv. ►"}</button>
          </div>
        </div>}

        {/* ═══ STATS ═══ */}
        {mode === "stats" && exam && <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1 }} />
            {["general", "exercices", "classement"].map(function(t) { return (
              <button key={t} onClick={function() { setTab(t); }} style={{ padding: "6px 10px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 11, fontWeight: 600, background: tab === t ? th.accent + "18" : "transparent", border: "1px solid " + (tab === t ? th.accent + "40" : th.border), color: tab === t ? th.accent : th.textMuted }}>{t === "general" ? "Général" : t === "exercices" ? "Exercices" : "Classement"}</button>); })}
          </div>

          {tab === "general" && <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5, marginBottom: 8 }}>
            {[{ l: "Moy", v: statMoy, c: th.accent }, { l: "Méd", v: statMed, c: th.violet }, { l: "Min", v: statMin, c: th.danger }, { l: "Max", v: statMax, c: th.success }, { l: "σ", v: statSigma, c: th.textMuted }].map(function(x) { return (
                <div key={x.l} style={{ background: th.card, borderRadius: th.radiusSm, border: "1px solid " + th.border, padding: "7px 5px", textAlign: "center", boxShadow: th.shadow }}>
                  <div style={{ fontSize: 9, color: th.textMuted, fontFamily: FONT_B }}>{x.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: MONO, color: x.c }}>{x.v.toFixed(1)}<span style={{ fontSize: 9, color: th.textDim }}>/100</span></div>
                </div>); })}
            </div>
            <div style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, padding: 12, boxShadow: th.shadow }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, fontFamily: FONT }}>{"Distribution /100"}</div>
              <Histo bins={Array.from({ length: 21 }, function(_, i) {
                var lo = i * 5;
                return { note: lo, count: statNotes.filter(function(nn) { return Math.min(20, Math.floor(nn / 5)) === i; }).length };
              })} colorFn={function(nn) { return nn < 40 ? th.danger + "aa" : nn < 60 ? th.warning + "aa" : th.success + "aa"; }} th={th}
                moyLine={statMoy / 5} medLine={statMed / 5} />
            </div>
          </div>}
          {tab === "exercices" && exam.exercises.map(function(exx, i) {
            var isItems = !exx.type || exx.type === "items";
            var scores = corriges.map(function(s) { return exerciseScore(grades, notesBrutes, palierGrades, s.id, exx); });
            var exT = scores.length ? scores[0].total : (exx.type === "brut" ? (parseFloat(exx.bareme) || 0) : 0);
            var enotes = scores.map(function(sc) { return sc.earned; }).sort(function(a, b) { return a - b; });
            var copies = corriges.filter(function(s) {
              if (exx.type === "brut") return typeof notesBrutes[gradeKey(s.id, exx.id)] === "number";
              if (exx.type === "paliers") return (exx.competences || []).some(function(c) { return typeof palierGrades[palierKey(s.id, exx.id, c.id)] === "number"; });
              return exx.questions.some(function(q) { return !!grades[treatedKey(s.id, q.id)] || q.items.some(function(it) { return grades[gradeKey(s.id, it.id)]; }); });
            }).length;
            var emoy = enotes.length ? enotes.reduce(function(a, b) { return a + b; }, 0) / enotes.length : 0;
            var bins = Array.from({ length: Math.ceil(exT) + 1 }, function(_, j) { return { note: j, count: 0 }; });
            enotes.forEach(function(sc) { bins[Math.min(bins.length - 1, Math.floor(sc))].count++; });
            var qStats = isItems ? exx.questions.map(function(q) {
              var totQ = q.items.reduce(function(s, it) { return s + (parseFloat(it.points) || 0); }, 0);
              var nb = 0, obt = 0;
              corriges.forEach(function(ss) {
                var qTraitee = !!grades[treatedKey(ss.id, q.id)] || q.items.some(function(it) { return grades[gradeKey(ss.id, it.id)]; });
                if (qTraitee) {
                  nb++;
                  q.items.forEach(function(it) { if (grades[gradeKey(ss.id, it.id)]) obt += parseFloat(it.points) || 0; });
                }
              });
              var n = corriges.length;
              var tauxTraitement = n > 0 ? (nb / n) * 100 : 0;
              var tauxReussite = nb > 0 && totQ > 0 ? (obt / (nb * totQ)) * 100 : 0;
              return { q: q, tot: totQ, nb: nb, tauxTraitement: tauxTraitement, tauxReussite: tauxReussite };
            }) : [];
            return (
              <div key={exx.id} style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, padding: 12, marginBottom: 8, boxShadow: th.shadow }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: FONT }}>{exx.title}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: th.textMuted }}>{"/" + exT}</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 10, color: th.textMuted, fontFamily: FONT_B }}>{copies + " copies"}</span>
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 11, fontFamily: FONT_B }}>
                  <span>Moy: <b style={{ fontFamily: MONO, color: th.accent }}>{emoy.toFixed(1)}</b></span>
                  <span>Min: <b style={{ fontFamily: MONO, color: th.danger }}>{enotes[0] != null ? enotes[0].toFixed(1) : "—"}</b></span>
                  <span>Max: <b style={{ fontFamily: MONO, color: th.success }}>{enotes[enotes.length - 1] != null ? enotes[enotes.length - 1].toFixed(1) : "—"}</b></span>
                </div>
                <Histo bins={bins} th={th} />
                {isItems && <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 16, fontSize: 9, fontWeight: 600, color: th.textMuted, marginBottom: 3, fontFamily: FONT_B }}>
                    <span style={{ minWidth: 28 }}></span>
                    <span style={{ flex: 1 }}>Traitement (% classe)</span>
                    <span style={{ flex: 1 }}>Réussite (parmi traités)</span>
                  </div>
                  {qStats.map(function(qs, j) {
                    return (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                        <span style={{ fontWeight: 500, fontSize: 10, minWidth: 28, color: th.text, fontFamily: FONT_B }}>{"Q." + qs.q.label}</span>
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3 }}>
                          <PBar value={qs.tauxTraitement} max={100} color={th.textMuted} h={5} th={th} />
                          <span style={{ fontFamily: MONO, fontSize: 9, color: th.textMuted, minWidth: 26, textAlign: "right" }}>{qs.tauxTraitement.toFixed(0) + "%"}</span>
                        </div>
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3 }}>
                          <PBar value={qs.tauxReussite} max={100} color={qs.tauxReussite < 33 ? th.danger : qs.tauxReussite < 66 ? th.warning : th.success} h={5} th={th} />
                          <span style={{ fontFamily: MONO, fontSize: 9, color: th.textMuted, minWidth: 26, textAlign: "right" }}>{qs.tauxReussite.toFixed(0) + "%"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>}
              </div>
            );
          })}

          {tab === "classement" && (function() {
            var withNotes = corriges.map(function(ss) { return { student: ss, note100: getNote100(ss.id) }; });
            var byNote = withNotes.slice().sort(function(a, b) { return b.note100 - a.note100; });
            var rangMap2 = {}; var rr = 1;
            byNote.forEach(function(r, i) { if (i > 0 && r.note100 < byNote[i - 1].note100) rr = i + 1; rangMap2[r.student.id] = rr; });
            var sorted = withNotes.slice().sort(csortMode === "alpha"
              ? function(a, b) { var na = (a.student.nom + a.student.prenom).toLowerCase(); var nb = (b.student.nom + b.student.prenom).toLowerCase(); return na < nb ? -1 : na > nb ? 1 : 0; }
              : function(a, b) { return b.note100 - a.note100; });
            return (
              <div style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, padding: 12, boxShadow: th.shadow }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT, flex: 1 }}>{"Classement (" + corriges.length + " él.)"}</div>
                  {["rang", "alpha"].map(function(m) { return (
                    <button key={m} onClick={function() { setCsortMode(m); }}
                      style={{ padding: "3px 9px", borderRadius: 10, cursor: "pointer", fontFamily: FONT_B, fontSize: 10, fontWeight: 600, background: csortMode === m ? th.accent + "18" : "transparent", border: "1px solid " + (csortMode === m ? th.accent + "40" : th.border), color: csortMode === m ? th.accent : th.textMuted }}>
                      {m === "rang" ? "Par rang" : "A → Z"}
                    </button>); })}
                </div>
                {sorted.map(function(r, i) {
                  var rang2 = rangMap2[r.student.id];
                  var exVals = exam.exercises.map(function(ex) { var sc = exerciseScore(grades, notesBrutes, palierGrades, r.student.id, ex); return sc.total > 0 ? sc.earned / sc.total : 0; });
                  return (
                    <div key={r.student.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 2px", borderBottom: i < sorted.length - 1 ? "1px solid " + th.border : "none" }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: th.textDim, minWidth: 18, textAlign: "right" }}>{rang2}</span>
                      <MiniRadarEx values={exVals} size={30} dark={dark} />
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 500, fontFamily: FONT_B }}>{r.student.prenom} <span style={{ fontVariant: "small-caps" }}>{r.student.nom}</span></span>
                      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, minWidth: 40, textAlign: "right", color: r.note100 < 40 ? th.danger : r.note100 < 60 ? th.warning : th.success }}>{r.note100.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>}

        {/* ═══ VUE D'ENSEMBLE ═══ */}
        {mode === "overview" && (function() {
          if (!exam) return <div style={{ textAlign: "center", padding: 40, color: th.textMuted, fontFamily: FONT_B }}>{"Créez d'abord un devoir dans l'onglet Préparation."}</div>;
          return (
            <OverviewTab
              exam={exam}
              students={students}
              grades={grades}
              notesBrutes={notesBrutes}
              palierGrades={palierGrades}
              th={th}
              FONT={FONT}
              FONT_B={FONT_B}
              MONO={MONO}
              onNavigate={function(studentIdx, exIdx) { setSi(studentIdx); setEi(exIdx); setMode("correct"); }}
            />
          );
        })()}

        {/* ═══ AIDE ═══ */}
        {mode === "aide" && <HelpTab th={th} FONT={FONT} FONT_B={FONT_B} MONO={MONO} />}

        {/* ═══ SAUVEGARDE ═══ */}
        {mode === "sauvegarde" && <SauvegardeTab
          th={th} FONT={FONT} FONT_B={FONT_B}
          onFullBackup={saveFullBackup}
          onOpenRestore={function() { backupFileRef.current && backupFileRef.current.click(); }}
          backupBusy={backupBusy}
        />}

        {mode === "accueil" && (
          <AccueilTab
            th={th} FONT_B={FONT_B} MONO={MONO}
            profiles={profiles}
            activeProfileId={activeProfileId}
            PROFILE_COLORS={PROFILE_COLORS}
            exams={exams}
            students={students}
            grades={grades}
            notesBrutes={notesBrutes}
            palierGrades={palierGrades}
            setMode={setMode}
            switchProfile={switchProfile}
            setShowProfileMenu={setShowProfileMenu}
            setActiveExamId={setActiveExamId}
            askConfirm={askConfirm}
            onChangelog={function() {
              if (!changelogText) {
                fetch(process.env.PUBLIC_URL + "/CHANGELOG.md").then(function(r) { return r.text(); }).then(function(t) { setChangelogText(t); }).catch(function() { setChangelogText("_(changelog non disponible)_"); });
              }
              setShowApropos(true);
              setShowChangelog(true);
            }}
            onFullBackup={saveFullBackup}
            onOpenRestore={function() { backupFileRef.current && backupFileRef.current.click(); }}
            backupBusy={backupBusy}
          />
        )}

        </main>
        </div>
      </div>

      {showMore && <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={function() { setShowMore(false); }} />}

{/* MODAL RESTAURATION BACKUP COMPLET (multi-profils) */}
{backupRestoreModal && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 240, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={function() { setBackupRestoreModal(null); }}>
  <div style={{ background: th.card, borderRadius: 12, border: "1px solid " + th.border, padding: "24px 28px", width: 420, maxWidth: "95vw", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", fontFamily: FONT_B }} onClick={function(e) { e.stopPropagation(); }}>
    <div style={{ fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 8 }}>{"💾 Restaurer une sauvegarde"}</div>
    <div style={{ fontSize: 12, color: th.textMuted, marginBottom: 8 }}>{backupRestoreModal.validation.summary.profileCount + " profil(s) dans le fichier."}</div>
    <ul style={{ fontSize: 12, margin: "6px 0 10px", paddingLeft: 18, color: th.text }}>
      {backupRestoreModal.validation.summary.profiles.map(function(p, i) {
        return <li key={i}>{p.name + " "}{p.empty ? "(vide)" : "(" + p.dsCount + " DS)"}</li>;
      })}
    </ul>
    {backupRestoreModal.validation.warnings.length > 0 && (
      <div style={{ fontSize: 11, color: th.warning, background: th.warningBg, padding: "6px 10px", borderRadius: th.radiusSm, border: "1px solid " + th.warning + "33", marginBottom: 10 }}>
        {"⚠ " + backupRestoreModal.validation.warnings.join(" ")}
      </div>
    )}
    <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: th.text, margin: "8px 0", cursor: "pointer" }}>
      <input type="radio" name="restoreMode" checked={restoreMode === "replace"} onChange={function() { setRestoreMode("replace"); }} style={{ marginTop: 2 }} />
      <span><strong>{"Remplacer tout"}</strong>{" — efface les profils actuels."}</span>
    </label>
    <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: th.text, margin: "8px 0", cursor: "pointer" }}>
      <input type="radio" name="restoreMode" checked={restoreMode === "merge"} onChange={function() { setRestoreMode("merge"); }} style={{ marginTop: 2 }} />
      <span><strong>{"Fusionner"}</strong>{" — le fichier écrase les profils de même identifiant ; les profils locaux absents du fichier sont conservés."}</span>
    </label>
    <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
      <button onClick={function() { setBackupRestoreModal(null); }} style={{ padding: "7px 14px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 12, background: "transparent", border: "1px solid " + th.border, color: th.textMuted }}>{"Annuler"}</button>
      <button onClick={confirmRestore} style={{ padding: "7px 14px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 12, fontWeight: 700, background: th.accent, border: "none", color: "#fff" }}>{"Restaurer"}</button>
    </div>
  </div>
</div>}


{/* MODALE CRÉATION DE PROFIL */}
{showCreateProfile && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: th.card, border: "1px solid " + th.border, borderRadius: 12, padding: 24, width: 400, maxWidth: "92vw", fontFamily: FONT_B }} onClick={function(e) { e.stopPropagation(); }}>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 16, color: th.text }}>{"✦ Nouveau profil"}</div>

      {/* Champ nom */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: th.textMuted, display: "block", marginBottom: 4 }}>{"Nom du profil"}</label>
        <input
          type="text"
          value={newProfileName}
          onChange={function(e) { setNewProfileName(e.target.value); }}
          onKeyDown={function(e) { if (e.key === "Enter") createProfileWithImport(); }}
          placeholder="Ex : MP2I 2025-2026"
          autoFocus
          style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", borderRadius: 7, border: "1px solid " + th.border, background: th.surface, color: th.text, fontFamily: FONT_B, fontSize: 14 }}
        />
      </div>

      {/* Section import — masquée si profil unique */}
      {profiles.length > 1 && (
        <div style={{ borderTop: "1px solid " + th.border, paddingTop: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: th.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{"Importer depuis un profil existant"}</div>
          <div style={{ marginBottom: 12 }}>
            <select
              value={newProfileSourceId}
              onChange={function(e) { setNewProfileSourceId(e.target.value); }}
              style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid " + th.border, background: th.surface, color: th.text, fontFamily: FONT_B, fontSize: 13, width: "100%" }}
            >
              {profiles.map(function(p) {
                return <option key={p.id} value={p.id}>{p.name + (p.id === activeProfileId ? " (actif)" : "")}</option>;
              })}
            </select>
          </div>
          {[
            { key: "students", label: "Liste d'élèves", sub: null },
          ].map(function(item) {
            return (
              <label key={item.key} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newProfileImport[item.key]}
                  onChange={function(e) { var checked = e.target.checked; setNewProfileImport(function(prev) { return Object.assign({}, prev, { [item.key]: checked }); }); }}
                  style={{ marginTop: 2 }}
                />
                <span>
                  <span style={{ fontSize: 13, color: th.text }}>{item.label}</span>
                  {item.sub && <span style={{ fontSize: 11, color: th.textMuted, display: "block" }}>{item.sub}</span>}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {/* Boutons */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={function() { setShowCreateProfile(false); setNewProfileName(""); }}
          style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid " + th.border, background: "transparent", color: th.text, fontFamily: FONT_B, fontSize: 13, cursor: "pointer" }}>
          {"Annuler"}
        </button>
        <button
          onClick={createProfileWithImport}
          disabled={!newProfileName.trim()}
          style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: newProfileName.trim() ? th.accent : th.border, color: newProfileName.trim() ? "#fff" : th.textMuted, fontFamily: FONT_B, fontSize: 13, cursor: newProfileName.trim() ? "pointer" : "default" }}>
          {"✓ Créer le profil"}
        </button>
      </div>
    </div>
  </div>
)}

{/* MODAL À PROPOS */}
{showApropos && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={function() { setShowApropos(false); }}>
        <div style={{ background: th.card, borderRadius: 12, border: "1px solid " + th.border, padding: "28px 32px", width: showChangelog ? 580 : 360, maxWidth: "95vw", transition: "width 0.2s", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", textAlign: "center" }} onClick={function(e) { e.stopPropagation(); }}>
          <div style={{ fontSize: 13, fontFamily: MONO, color: th.textDim, marginBottom: 4, letterSpacing: 2 }}>{"v\u00A0" + APP_VERSION}</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: FONT, color: th.text, marginBottom: 6 }}>{"C.H.E.C.K."}</div>
          <div style={{ fontSize: 11, color: th.textMuted, fontFamily: FONT_B, lineHeight: 1.6, marginBottom: 20 }}>
            {"Correcteur Hautement Efficace avec Cases à Kocher"}
            <br />
            {"Application de correction de copies et de génération de rapports individuels, conçue pour les enseignants."}
          </div>
          <button onClick={function() {
            if (!changelogText) {
              fetch(process.env.PUBLIC_URL + "/CHANGELOG.md").then(function(r) { return r.text(); }).then(function(t) { setChangelogText(t); }).catch(function() { setChangelogText("_(changelog non disponible)_"); });
            }
            setShowChangelog(!showChangelog);
          }} style={{ width: "100%", padding: "9px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 12, fontWeight: 700, background: th.accentBg, border: "1px solid " + th.accent + "30", color: th.accent, marginBottom: 8 }}>
            {"📋 Nouveautés récentes"}
          </button>
          {showChangelog && <div style={{ textAlign: "left", background: th.surface, border: "1px solid " + th.border, borderRadius: th.radiusSm, padding: "10px 14px", marginBottom: 8, maxHeight: 260, overflowY: "auto", fontSize: 12, fontFamily: FONT_B, color: th.text, lineHeight: 1.7 }}>
            {changelogText.split("\n").map(function(line, i) {
              var inlineBold = function(s) {
                var parts = s.split(/\*\*(.+?)\*\*/g);
                return parts.map(function(p, j) { return j % 2 === 1 ? <strong key={j}>{p}</strong> : p; });
              };
              if (line.startsWith("### ")) return <div key={i} style={{ fontWeight: 700, color: th.accent, marginTop: 6, marginBottom: 1 }}>{line.slice(4)}</div>;
              if (line.startsWith("## "))  return <div key={i} style={{ fontWeight: 700, fontSize: 13, color: th.text, marginTop: 10, marginBottom: 2 }}>{line.slice(3)}</div>;
              if (line.startsWith("- "))   return <div key={i} style={{ paddingLeft: 12 }}>{"• "}{inlineBold(line.slice(2))}</div>;
              if (line.trim() === "" || line.trim() === "---") return <div key={i} style={{ height: 4 }} />;
              return <div key={i}>{inlineBold(line)}</div>;
            })}
          </div>}
          <button onClick={function() { setShowApropos(false); setMode("aide"); }} style={{ width: "100%", padding: "9px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 12, fontWeight: 700, background: th.surface, border: "1px solid " + th.border, color: th.textMuted, marginBottom: 8 }}>
            {"ℹ️ Ouvrir le guide d'utilisation"}
          </button>
          <button onClick={function() { setShowApropos(false); }} style={{ width: "100%", padding: "9px", borderRadius: th.radiusSm, cursor: "pointer", fontFamily: FONT_B, fontSize: 13, fontWeight: 700, background: th.accent, border: "none", color: "#fff" }}>
            {"Fermer"}
          </button>
        </div>
      </div>}


      {/* MOBILE BOTTOM NAV */}
      {isMobile && <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: th.card, borderTop: "2px solid " + th.headerBorder, display: "flex", padding: "4px 0 4px 0", boxShadow: "0 -2px 8px rgba(0,0,0,0.1)" }}>
        {[{ id: "correct", l: "Correction", ic: "\u270F\uFE0F" }, { id: "stats", l: "Stats", ic: "\uD83D\uDCCA" }].map(function(nn) { return (
          <button key={nn.id} onClick={function() { setMode(nn.id); setShowMore(false); }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 4px", cursor: "pointer", fontFamily: FONT_B, background: "transparent", border: "none", color: mode === nn.id ? th.accent : th.textMuted, fontSize: 18 }}>
            <span>{nn.ic}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{nn.l}</span>
          </button>); })}
      </nav>}
    </div>
  );
}
