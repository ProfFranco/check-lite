// ═══════════════════════════════════════════════════════════════════
// SauvegardeTab — onglet Sauvegarde (CHECK-lite)
// ═══════════════════════════════════════════════════════════════════

export default function SauvegardeTab({
  th, FONT, FONT_B,
  onFullBackup, onOpenRestore, backupBusy,
}) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ background: th.card, borderRadius: th.radius, border: "1px solid " + th.border, padding: "16px", boxShadow: th.shadow }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>{"💾"}</span>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT }}>{"Sauvegarde & restauration"}</span>
        </div>
        <div style={{ fontSize: 12, color: th.textMuted, fontFamily: FONT_B, marginBottom: 12, lineHeight: 1.6 }}>
          {"Un seul fichier JSON contient tous vos profils. Les boutons "}<strong>{"💾 Sauver"}</strong>{" / "}<strong>{"📂 Charger"}</strong>{" dans l'en-tête gèrent, eux, uniquement le devoir en cours."}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onFullBackup} disabled={!!backupBusy}
            style={{ flex: 1, padding: "11px", borderRadius: th.radiusSm, cursor: backupBusy ? "not-allowed" : "pointer", fontFamily: FONT_B, fontSize: 13, fontWeight: 700, background: th.accentBg, border: "1px solid " + th.accent + "55", color: th.accent, opacity: backupBusy ? 0.6 : 1 }}>
            {backupBusy ? "⏳ En cours…" : "💾 Sauvegarde complète"}
          </button>
          <button onClick={onOpenRestore} disabled={!!backupBusy}
            style={{ flex: 1, padding: "11px", borderRadius: th.radiusSm, cursor: backupBusy ? "not-allowed" : "pointer", fontFamily: FONT_B, fontSize: 13, fontWeight: 700, background: th.surface, border: "1px solid " + th.border, color: th.text, opacity: backupBusy ? 0.6 : 1 }}>
            {"📂 Restaurer une sauvegarde"}
          </button>
        </div>
        <div style={{ fontSize: 10, color: th.textDim, fontFamily: FONT_B, marginTop: 8 }}>
          {"La restauration propose deux modes : Remplacer (efface tout) ou Fusionner (le fichier gagne en cas de collision)."}
        </div>
      </div>
    </div>
  );
}
