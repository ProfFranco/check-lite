// ═══════════════════════════════════════════════════════════════════
// Composants visuels : Histo, PBar
// ═══════════════════════════════════════════════════════════════════

import { clamp } from "../utils/calculs";
import { FONT_BODY, FONT_MONO } from "../config/theme";

const FONT_B = FONT_BODY;
const MONO = FONT_MONO;

// ═══════════════════════════════════════════════════════════════════
// HISTOGRAM / PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════
export function Histo({ bins, colorFn, label, th, moyLine, medLine }) {
  const mx = Math.max(...bins.map(b => b.count), 1);
  const total = bins.length;
  return (
    <div>
      {label && <div style={{ fontSize: 11, fontWeight: 600, color: th.textMuted, marginBottom: 6, fontFamily: FONT_B }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 130, position: "relative" }}>
        {/* Traits en arrière-plan */}
        {moyLine != null && (
          <div style={{ position: "absolute", top: 0, bottom: 18, left: `${(moyLine / (total - 1)) * 100}%`, width: 2, background: th.danger, opacity: 0.45, pointerEvents: "none", zIndex: 0 }} />
        )}
        {medLine != null && (
          <div style={{ position: "absolute", top: 0, bottom: 18, left: `${(medLine / (total - 1)) * 100}%`, width: 2, background: th.violet, opacity: 0.45, pointerEvents: "none", zIndex: 0 }} />
        )}
        {/* Barres au premier plan */}
        {bins.map((b, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 8, color: th.textMuted, marginBottom: 1, fontFamily: MONO }}>{b.count > 0 ? b.count : ""}</div>
            <div style={{ width: "100%", borderRadius: "2px 2px 0 0", height: b.count > 0 ? Math.max(4, (b.count / mx) * 110) : 0, background: colorFn ? colorFn(b.note) : th.accent + "88" }} />
            <div style={{ fontSize: 8, color: th.textDim, marginTop: 2, fontFamily: MONO }}>{b.note}</div>
          </div>
        ))}
      </div>
      {/* Légende sous le graphique */}
      {(moyLine != null || medLine != null) && (
        <div style={{ display: "flex", gap: 12, marginTop: 4, justifyContent: "flex-end" }}>
          {moyLine != null && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 12, height: 2, background: th.danger, opacity: 0.7 }} />
              <span style={{ fontSize: 9, color: th.danger, fontFamily: MONO }}>{"moy " + moyLine.toFixed(1)}</span>
            </div>
          )}
          {medLine != null && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 12, height: 2, background: th.violet, opacity: 0.7 }} />
              <span style={{ fontSize: 9, color: th.violet, fontFamily: MONO }}>{"méd " + medLine.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PBar({ value, max, color, h = 6, th }) {
  return <div style={{ background: th.border, borderRadius: h / 2, height: h, overflow: "hidden", width: "100%" }}><div style={{ height: "100%", borderRadius: h / 2, width: `${max > 0 ? clamp((value / max) * 100, 0, 100) : 0}%`, background: color, transition: "width 0.3s" }} /></div>;
}
