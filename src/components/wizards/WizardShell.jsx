// ─── WizardShell.jsx ─────────────────────────────────────────────────────────
// naturalquest.org 共通ウィザードUI
// 全ウィザードで import して使う共通部品集
// ─────────────────────────────────────────────────────────────────────────────

// ─── Design tokens ───────────────────────────────────────────────────────────
export const C = {
  bg:         "#FDFAF4",
  green:      "#1B5E20",
  greenMid:   "#388E3C",
  greenBtn:   "#43A047",
  greenLight: "#A5D6A7",
  greenPale:  "#E8F5E9",
  sky:        "#0288D1",
  skyPale:    "#E1F5FE",
  gold:       "#F9A825",
  goldPale:   "#FFFDE7",
  amber:      "#E65100",
  amberMid:   "#F57C00",
  amberPale:  "#FFF3E0",
  white:      "#FFFFFF",
  border:     "#C8E6C9",
  text:       "#1A1A1A",
  muted:      "#616161",
  warn:       "#E65100",
  warnBg:     "#FFF8F0",
  warnBorder: "#FFB74D",
};

// ─── Badge ───────────────────────────────────────────────────────────────────
const badgeCfg = {
  open:    { label: "受付中", color: "#1B5E20", bg: "#C8E6C9" },
  closed:  { label: "終了",   color: "#757575", bg: "#EEEEEE" },
  none:    { label: "未実施", color: "#9E9E9E", bg: "#F5F5F5" },
  unknown: { label: "要確認", color: "#0277BD", bg: "#E1F5FE" },
};

export function Badge({ status }) {
  const s = badgeCfg[status] || badgeCfg.unknown;
  return (
    <span style={{
      fontSize: "12px", fontWeight: 700, padding: "3px 10px",
      borderRadius: "20px", background: s.bg, color: s.color,
      letterSpacing: "0.02em",
    }}>
      {s.label}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.white, borderRadius: "18px", padding: "24px",
      boxShadow: "0 3px 14px rgba(0,0,0,0.08)", marginBottom: "16px",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── OptionBtn ───────────────────────────────────────────────────────────────
export function OptionBtn({ label, desc, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: selected ? C.green : C.white,
      color: selected ? "#fff" : C.text,
      border: `2.5px solid ${selected ? C.green : C.border}`,
      borderRadius: "14px", padding: "16px 14px",
      cursor: "pointer", textAlign: "left", outline: "none", width: "100%",
      boxShadow: selected ? "0 4px 12px rgba(27,94,32,0.25)" : "0 1px 4px rgba(0,0,0,0.06)",
      transition: "all 0.15s",
    }}>
      <span style={{ fontSize: "17px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
        {label}
      </span>
      {desc && (
        <span style={{ fontSize: "13px", color: selected ? C.greenLight : C.muted, display: "block", lineHeight: 1.4 }}>
          {desc}
        </span>
      )}
    </button>
  );
}

// ─── NavRow ──────────────────────────────────────────────────────────────────
export function NavRow({ onBack, onNext, nextDisabled, nextLabel = "次へ →", isFirst }) {
  return (
    <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
      {!isFirst && (
        <button onClick={onBack} style={{
          flex: 1, padding: "15px", background: "transparent",
          border: `2px solid ${C.border}`, borderRadius: "12px",
          color: C.muted, fontSize: "15px", fontWeight: 600, cursor: "pointer",
        }}>
          ← 戻る
        </button>
      )}
      <button onClick={onNext} disabled={nextDisabled} style={{
        flex: 2, padding: "16px", fontSize: "17px", fontWeight: 700,
        background: nextDisabled
          ? "#BDBDBD"
          : `linear-gradient(135deg, ${C.greenBtn} 0%, ${C.greenMid} 100%)`,
        border: "none", borderRadius: "12px", color: "#fff",
        cursor: nextDisabled ? "not-allowed" : "pointer",
        boxShadow: nextDisabled ? "none" : "0 4px 14px rgba(56,142,60,0.35)",
      }}>
        {nextLabel}
      </button>
    </div>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
export function ProgressBar({ current, total }) {
  return (
    <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: "6px", borderRadius: "3px",
          background: i + 1 < current ? C.greenMid : i + 1 === current ? C.gold : C.border,
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

// ─── StepHeader ──────────────────────────────────────────────────────────────
export function StepHeader({ step, total, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
      <div style={{
        background: C.greenPale, color: C.greenMid, borderRadius: "50%",
        width: "32px", height: "32px", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "14px", fontWeight: 800, flexShrink: 0,
      }}>
        {step}
      </div>
      <div>
        <div style={{ fontSize: "12px", color: C.greenMid, fontWeight: 700, letterSpacing: "0.08em" }}>
          STEP {step} / {total}
        </div>
        <div style={{ fontSize: "20px", fontWeight: 800, color: C.green, lineHeight: 1.3 }}>
          {title}
        </div>
      </div>
    </div>
  );
}

// ─── WizardHeader ────────────────────────────────────────────────────────────
// 各ウィザードのトップヘッダー（緑グラデーション）
export function WizardHeader({ label, badge, title, subtitle }) {
  return (
    <div style={{
      background: `linear-gradient(160deg, ${C.green} 0%, #2E7D32 100%)`,
      padding: "36px 24px 30px",
    }}>
      <div style={{ fontSize: "12px", letterSpacing: "0.15em", color: C.greenLight, marginBottom: "6px", fontWeight: 600 }}>
        {label}
      </div>
      {badge && (
        <div style={{
          display: "inline-block", background: "rgba(255,255,255,0.15)",
          borderRadius: "20px", padding: "4px 14px", fontSize: "13px",
          color: "#fff", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "12px",
        }}>
          {badge}
        </div>
      )}
      <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#fff", margin: "0 0 10px", lineHeight: 1.3 }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ color: "#C8E6C9", fontSize: "15px", margin: 0, lineHeight: 1.7 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── ResultBar ───────────────────────────────────────────────────────────────
// 結果画面の横棒グラフ1本分
export function ResultBar({ label, value, maxValue, color, formatFn }) {
  const pct = Math.round((value / maxValue) * 100);
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "14px", color: "#444" }}>{label}</span>
        <span style={{ fontSize: "15px", fontWeight: 700, color: C.green }}>
          {formatFn ? formatFn(value) : value}
        </span>
      </div>
      <div style={{ height: "12px", background: "#E8F5E9", borderRadius: "6px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: pct + "%", background: color,
          borderRadius: "6px", transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}

// ─── TimelineStep ────────────────────────────────────────────────────────────
export function TimelineStep({ index, text, warn }) {
  return (
    <li style={{ display: "flex", gap: "14px", marginBottom: "18px", alignItems: "flex-start" }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "50%",
        background: C.green, color: "#fff", fontSize: "15px", fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {index}
      </div>
      <div style={{ paddingTop: "4px" }}>
        <div style={{ fontSize: "16px", color: "#222", lineHeight: 1.7, fontWeight: 500 }}>{text}</div>
        {warn && (
          <div style={{ fontSize: "14px", color: C.warn, fontWeight: 700, marginTop: "5px" }}>{warn}</div>
        )}
      </div>
    </li>
  );
}

// ─── CtaBox ──────────────────────────────────────────────────────────────────
export function CtaBox({ badge, title, subtitle, btnLabel, href }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.amberMid} 0%, ${C.amber} 100%)`,
      borderRadius: "18px", padding: "24px", textAlign: "center",
      marginBottom: "16px", boxShadow: "0 6px 20px rgba(230,81,0,0.3)",
    }}>
      {badge && (
        <div style={{ color: "#FFE0B2", fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "8px" }}>
          {badge}
        </div>
      )}
      <div style={{ color: "#fff", fontSize: "18px", fontWeight: 800, marginBottom: "6px", lineHeight: 1.4 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ color: "#FFD0AA", fontSize: "14px", marginBottom: "18px" }}>{subtitle}</div>
      )}
      <a href={href || "#"} target="_blank" rel="noopener noreferrer" style={{
        display: "block", background: "#fff", color: C.amber,
        borderRadius: "50px", padding: "14px 32px", fontSize: "16px",
        fontWeight: 800, textDecoration: "none",
        boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
      }}>
        {btnLabel}
      </a>
    </div>
  );
}

// ─── Disclaimer ──────────────────────────────────────────────────────────────
export function Disclaimer({ children }) {
  return (
    <div style={{
      fontSize: "12px", color: C.muted, lineHeight: 1.8,
      marginTop: "16px", borderTop: `1px solid ${C.border}`, paddingTop: "14px",
    }}>
      {children}
    </div>
  );
}

// ─── StatsBar ────────────────────────────────────────────────────────────────
export function StatsBar({ items }) {
  const colors = [C.greenMid, C.gold, C.sky, C.amberMid];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
      {items.map((item, i) => (
        <div key={i} style={{
          background: C.white, borderRadius: "14px", padding: "14px 16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          borderLeft: `4px solid ${colors[i % colors.length]}`,
        }}>
          <div style={{ fontSize: "12px", color: C.muted, marginBottom: "4px" }}>{item.label}</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: C.green, lineHeight: 1.1 }}>{item.value}</div>
          <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>{item.sub}</div>
        </div>
      ))}
    </div>
  );
}
