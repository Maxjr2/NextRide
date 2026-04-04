import { useState, useCallback, useEffect, useRef } from "react";

// ─── Mock Data ───────────────────────────────────────────────
const VEHICLES = [
  { id: "v1", name: "Flotte Lotte", type: "rickshaw", location: "Wersten", seats: 2, certLevel: 1, status: "available" },
  { id: "v2", name: "Schnelle Elle", type: "rickshaw", location: "Flingern", seats: 2, certLevel: 1, status: "available" },
  { id: "v3", name: "Doppeltes Lottchen", type: "tandem", location: "Flingern", seats: 2, certLevel: 2, status: "available" },
];

const NEIGHBORHOODS = ["Wersten", "Flingern", "Bilk", "Oberbilk", "Unterbilk"];

const USERS = {
  pilot: { id: "u1", name: "Maria K.", role: "pilot", certLevels: [1, 2], neighborhoods: ["Wersten", "Flingern"], trainingStatus: "active" },
  facility: { id: "u2", name: "Matthias-Claudius-Haus", role: "facility", facilityId: "f1", neighborhoods: ["Wersten"] },
  coordinator: { id: "u3", name: "Benjamin F.", role: "coordinator", certLevels: [1, 2], neighborhoods: NEIGHBORHOODS, trainingStatus: "active" },
  rider: { id: "u4", name: "Hans M.", role: "rider", neighborhoods: ["Wersten"] },
};

const INITIAL_POSTS = [
  {
    id: "p1", type: "offer", authorId: "u1", authorName: "Maria K.", authorRole: "pilot",
    vehicleId: "v1", vehicleName: "Flotte Lotte", vehicleLocation: "Wersten",
    date: "2026-04-12", timeStart: "14:00", timeEnd: "16:00",
    neighborhood: "Wersten", passengerCount: null,
    routeWish: "Gerne entlang des Rheins", accessibilityNotes: null,
    status: "open", createdAt: "2026-04-04T08:30:00",
  },
  {
    id: "p2", type: "offer", authorId: "u1", authorName: "Maria K.", authorRole: "pilot",
    vehicleId: "v2", vehicleName: "Schnelle Elle", vehicleLocation: "Flingern",
    date: "2026-04-15", timeStart: "10:00", timeEnd: "12:00",
    neighborhood: "Flingern", passengerCount: null,
    routeWish: "Durch den Volksgarten", accessibilityNotes: null,
    status: "open", createdAt: "2026-04-04T09:00:00",
  },
  {
    id: "p3", type: "request", authorId: "u2", authorName: "Matthias-Claudius-Haus", authorRole: "facility",
    vehicleId: null, vehicleName: null, vehicleLocation: null,
    date: "2026-04-12", timeStart: "10:00", timeEnd: "12:00",
    neighborhood: "Wersten", passengerCount: 2,
    routeWish: "Zum Südpark und zurück", accessibilityNotes: "Rollstuhltransfer nötig",
    status: "open", createdAt: "2026-04-03T14:00:00",
  },
  {
    id: "p4", type: "request", authorId: "u4", authorName: "Hans M.", authorRole: "rider",
    vehicleId: null, vehicleName: null, vehicleLocation: null,
    date: null, timeStart: null, timeEnd: null,
    neighborhood: "Wersten", passengerCount: 1,
    routeWish: "Flexibel — einfach mal raus!", accessibilityNotes: null,
    status: "open", createdAt: "2026-04-02T11:00:00",
  },
  {
    id: "p5", type: "offer", authorId: "u1", authorName: "Maria K.", authorRole: "pilot",
    vehicleId: "v1", vehicleName: "Flotte Lotte", vehicleLocation: "Wersten",
    date: "2026-04-06", timeStart: "09:00", timeEnd: "11:00",
    neighborhood: "Wersten", passengerCount: null,
    routeWish: null, accessibilityNotes: null,
    status: "confirmed", createdAt: "2026-04-01T10:00:00",
    matchedWith: "Matthias-Claudius-Haus", matchStatus: "confirmed",
  },
];

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return "Flexibel";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
};

const statusLabel = { open: "Offen", matched: "Angefragt", confirmed: "Bestätigt", completed: "Abgeschlossen", cancelled: "Abgesagt" };
const statusColor = { open: "#2d7d46", matched: "#b8860b", confirmed: "#1a6fb5", completed: "#555", cancelled: "#a33" };

let nextId = 10;

// ─── Styles ──────────────────────────────────────────────────
const font = `'Atkinson Hyperlegible', 'Verdana', sans-serif`;
const googleFont = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap";

const T = {
  bg: "#faf8f5",
  surface: "#ffffff",
  textPrimary: "#1a1a1a",
  textSecondary: "#4a4a4a",
  textMuted: "#767676",
  offerBlue: "#1a6fb5",
  offerBlueBg: "#e8f2fb",
  offerBlueBorder: "#b3d4ed",
  requestOrange: "#c26a1a",
  requestOrangeBg: "#fdf0e3",
  requestOrangeBorder: "#e8c9a5",
  accent: "#2d7d46",
  accentBg: "#e6f4ec",
  border: "#ddd5ca",
  borderLight: "#ebe6de",
  focus: "#1a6fb5",
  danger: "#a33030",
  dangerBg: "#fdeaea",
  shadow: "0 2px 8px rgba(0,0,0,0.08)",
  shadowLg: "0 4px 20px rgba(0,0,0,0.1)",
  radius: 14,
  radiusSm: 8,
};

const HC = {
  bg: "#000000", surface: "#0a0a0a", textPrimary: "#ffffff", textSecondary: "#f0f0f0", textMuted: "#cccccc",
  offerBlue: "#5cb8ff", offerBlueBg: "#001a33", offerBlueBorder: "#5cb8ff",
  requestOrange: "#ffb347", requestOrangeBg: "#331a00", requestOrangeBorder: "#ffb347",
  accent: "#00e060", accentBg: "#002211", border: "#666", borderLight: "#444",
  focus: "#ffdd00", danger: "#ff5555", dangerBg: "#330000",
  shadow: "0 2px 8px rgba(255,255,255,0.05)", shadowLg: "0 4px 20px rgba(255,255,255,0.08)",
  radius: 14, radiusSm: 8,
};

// ─── Components ──────────────────────────────────────────────

function SkipLink() {
  return (
    <a href="#main-content" style={{
      position: "absolute", left: -9999, top: 0, padding: "12px 24px",
      background: T.focus, color: "#fff", zIndex: 9999, fontSize: 16, fontFamily: font,
      borderRadius: "0 0 8px 0", textDecoration: "none", fontWeight: 700,
    }} onFocus={(e) => { e.target.style.left = 0; }}
       onBlur={(e) => { e.target.style.left = "-9999px"; }}>
      Zum Inhalt springen
    </a>
  );
}

function RideCard({ post, theme, currentRole, onAction, leicht }) {
  const isOffer = post.type === "offer";
  const color = isOffer ? theme.offerBlue : theme.requestOrange;
  const bgColor = isOffer ? theme.offerBlueBg : theme.requestOrangeBg;
  const borderColor = isOffer ? theme.offerBlueBorder : theme.requestOrangeBorder;

  const label = isOffer
    ? (leicht ? "Pilot:in kann fahren" : "Pilot:in bietet Fahrt an")
    : (leicht ? "Jemand möchte mitfahren" : "Fahrt-Wunsch");

  const actionText = (() => {
    if (post.status !== "open") return null;
    if (isOffer && (currentRole === "rider" || currentRole === "facility"))
      return leicht ? "Ich möchte mitfahren" : "Fahrt anfragen";
    if (!isOffer && currentRole === "pilot")
      return leicht ? "Ich fahre" : "Ich übernehme das";
    if (currentRole === "coordinator")
      return "Zuweisen";
    return null;
  })();

  return (
    <article
      role="article"
      aria-label={`${label}: ${post.date ? fmt(post.date) : "Flexibel"}`}
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: theme.radius,
        padding: "20px 22px",
        marginBottom: 16,
        position: "relative",
        boxShadow: theme.shadow,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }} aria-hidden="true">{isOffer ? "🚲" : "💛"}</span>
        <span style={{
          fontFamily: font, fontWeight: 700, fontSize: 14, textTransform: "uppercase",
          letterSpacing: "0.06em", color,
        }}>
          {label}
        </span>
        {post.status !== "open" && (
          <span style={{
            marginLeft: "auto", fontSize: 13, fontWeight: 700, fontFamily: font,
            background: statusColor[post.status], color: "#fff",
            padding: "3px 10px", borderRadius: 20,
          }}>
            {statusLabel[post.status]}
          </span>
        )}
      </div>

      <div style={{ fontFamily: font, color: theme.textPrimary, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
        {post.date ? fmt(post.date) : "Flexibel"}{post.timeStart && ` · ${post.timeStart} – ${post.timeEnd}`}
      </div>

      <div style={{ fontFamily: font, color: theme.textSecondary, fontSize: 16, marginBottom: 6 }}>
        {post.neighborhood}
        {post.vehicleName && ` · ${post.vehicleName}`}
        {post.passengerCount && ` · ${post.passengerCount} ${post.passengerCount === 1 ? "Person" : "Personen"}`}
      </div>

      {post.routeWish && (
        <div style={{ fontFamily: font, color: theme.textSecondary, fontSize: 15, fontStyle: "italic", marginBottom: 6 }}>
          „{post.routeWish}"
        </div>
      )}

      {post.accessibilityNotes && (
        <div style={{
          fontFamily: font, fontSize: 14, color: theme.danger, fontWeight: 600,
          background: theme.dangerBg, padding: "6px 12px", borderRadius: theme.radiusSm, marginTop: 8, display: "inline-block",
        }}>
          ♿ {post.accessibilityNotes}
        </div>
      )}

      {post.matchedWith && (
        <div style={{ fontFamily: font, fontSize: 14, color: theme.textMuted, marginTop: 8 }}>
          Zugeordnet: {post.matchedWith}
        </div>
      )}

      {actionText && (
        <button
          onClick={() => onAction(post)}
          aria-label={`${actionText} — ${post.date ? fmt(post.date) : "Flexibel"}`}
          style={{
            display: "block", width: "100%", marginTop: 16,
            padding: "16px 24px", fontSize: 17, fontWeight: 700, fontFamily: font,
            background: color, color: "#fff", border: "none",
            borderRadius: theme.radiusSm, cursor: "pointer",
            minHeight: 56, letterSpacing: "0.02em",
            transition: "transform 0.1s, box-shadow 0.1s",
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.focus}`; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
        >
          {actionText}
        </button>
      )}
    </article>
  );
}

function TabBar({ tabs, active, onChange, theme }) {
  return (
    <nav role="tablist" aria-label="Hauptnavigation" style={{
      display: "flex", background: theme.surface, borderTop: `2px solid ${theme.border}`,
      position: "sticky", bottom: 0, zIndex: 100, boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id} role="tab" aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1, padding: "12px 4px 10px", border: "none", background: "transparent",
            fontFamily: font, fontSize: 13, fontWeight: active === tab.id ? 700 : 500,
            color: active === tab.id ? theme.offerBlue : theme.textMuted,
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            borderTop: active === tab.id ? `3px solid ${theme.offerBlue}` : "3px solid transparent",
            minHeight: 56, justifyContent: "center", transition: "all 0.15s",
          }}
          onFocus={(e) => { e.currentTarget.style.outline = `2px solid ${theme.focus}`; e.currentTarget.style.outlineOffset = "-2px"; }}
          onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
        >
          <span style={{ fontSize: 20 }} aria-hidden="true">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function PostForm({ currentUser, theme, onSubmit, leicht }) {
  const isPilot = currentUser.role === "pilot" || currentUser.role === "coordinator";
  const [vehicle, setVehicle] = useState("");
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("10:00");
  const [timeEnd, setTimeEnd] = useState("12:00");
  const [neighborhood, setNeighborhood] = useState(currentUser.neighborhoods?.[0] || "");
  const [passengers, setPassengers] = useState("1");
  const [routeWish, setRouteWish] = useState("");
  const [a11yNotes, setA11yNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const allowedVehicles = VEHICLES.filter(
    (v) => !isPilot || (currentUser.certLevels || []).includes(v.certLevel)
  );

  const labelStyle = { fontFamily: font, fontSize: 15, fontWeight: 600, color: theme.textPrimary, display: "block", marginBottom: 6 };
  const inputStyle = {
    fontFamily: font, fontSize: 17, padding: "14px 16px", borderRadius: theme.radiusSm,
    border: `2px solid ${theme.border}`, width: "100%", boxSizing: "border-box",
    background: theme.surface, color: theme.textPrimary, minHeight: 52,
  };
  const selectStyle = { ...inputStyle, appearance: "auto" };

  const handleSubmit = () => {
    const post = {
      id: `p${nextId++}`, type: isPilot ? "offer" : "request",
      authorId: currentUser.id, authorName: currentUser.name, authorRole: currentUser.role,
      vehicleId: vehicle || null, vehicleName: allowedVehicles.find((v) => v.id === vehicle)?.name || null,
      vehicleLocation: allowedVehicles.find((v) => v.id === vehicle)?.location || null,
      date: date || null, timeStart: date ? timeStart : null, timeEnd: date ? timeEnd : null,
      neighborhood, passengerCount: isPilot ? null : parseInt(passengers),
      routeWish: routeWish || null, accessibilityNotes: a11yNotes || null,
      status: "open", createdAt: new Date().toISOString(),
    };
    onSubmit(post);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setVehicle(""); setDate(""); setRouteWish(""); setA11yNotes("");
  };

  if (submitted) {
    return (
      <div role="status" style={{
        textAlign: "center", padding: 60, fontFamily: font,
        color: theme.accent, fontSize: 20, fontWeight: 700,
      }}>
        <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>✓</span>
        {isPilot
          ? (leicht ? "Dein Angebot ist da!" : "Dein Fahrt-Angebot wurde veröffentlicht!")
          : (leicht ? "Dein Wunsch ist da!" : "Dein Fahrt-Wunsch wurde veröffentlicht!")}
      </div>
    );
  }

  return (
    <div style={{ padding: "0 4px" }}>
      <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: theme.textPrimary, marginBottom: 6 }}>
        {isPilot ? (leicht ? "Ich kann fahren" : "Fahrt anbieten") : (leicht ? "Ich möchte mitfahren" : "Fahrt anfragen")}
      </h2>
      <p style={{ fontFamily: font, fontSize: 15, color: theme.textMuted, marginBottom: 24 }}>
        {isPilot
          ? (leicht ? "Sag uns, wann du fahren kannst." : "Teile mit, wann und wo du eine Rikscha-Fahrt anbieten möchtest.")
          : (leicht ? "Sag uns, wann du fahren möchtest." : "Beschreibe deinen Fahrtwunsch — wir finden eine:n Pilot:in.")}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {isPilot && (
          <div>
            <label style={labelStyle} htmlFor="vehicle">{leicht ? "Welches Fahrzeug?" : "Fahrzeug"}</label>
            <select id="vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} style={selectStyle}>
              <option value="">Bitte wählen…</option>
              {allowedVehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.location})</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={labelStyle} htmlFor="date">{leicht ? "Wann?" : "Datum"}</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          <span style={{ fontFamily: font, fontSize: 13, color: theme.textMuted, marginTop: 4, display: "block" }}>
            {leicht ? "Leer lassen = flexibel" : "Leer lassen für flexible Terminwünsche"}
          </span>
        </div>

        {date && (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="timeStart">{leicht ? "Von" : "Beginn"}</label>
              <input id="timeStart" type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="timeEnd">{leicht ? "Bis" : "Ende"}</label>
              <input id="timeEnd" type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} style={inputStyle} />
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle} htmlFor="neighborhood">{leicht ? "Wo?" : "Stadtteil"}</label>
          <select id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} style={selectStyle}>
            {NEIGHBORHOODS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {!isPilot && (
          <div>
            <label style={labelStyle} htmlFor="passengers">{leicht ? "Wie viele Personen?" : "Anzahl Fahrgäste"}</label>
            <select id="passengers" value={passengers} onChange={(e) => setPassengers(e.target.value)} style={selectStyle}>
              <option value="1">1 Person</option>
              <option value="2">2 Personen</option>
            </select>
          </div>
        )}

        <div>
          <label style={labelStyle} htmlFor="routeWish">{leicht ? "Wohin möchtest du?" : "Routenwunsch (optional)"}</label>
          <input id="routeWish" type="text" value={routeWish} onChange={(e) => setRouteWish(e.target.value)}
            placeholder={leicht ? "z.B. an den Rhein" : "z.B. Entlang des Rheins, zum Südpark…"} style={inputStyle} />
        </div>

        {!isPilot && (
          <div>
            <label style={labelStyle} htmlFor="a11y">{leicht ? "Braucht ihr Hilfe?" : "Hinweise zur Barrierefreiheit (optional)"}</label>
            <input id="a11y" type="text" value={a11yNotes} onChange={(e) => setA11yNotes(e.target.value)}
              placeholder={leicht ? "z.B. Rollstuhl" : "z.B. Rollstuhltransfer nötig"} style={inputStyle} />
          </div>
        )}

        <button
          onClick={handleSubmit}
          style={{
            padding: "18px 24px", fontSize: 18, fontWeight: 700, fontFamily: font,
            background: isPilot ? theme.offerBlue : theme.requestOrange,
            color: "#fff", border: "none", borderRadius: theme.radiusSm,
            cursor: "pointer", minHeight: 60, marginTop: 8,
            transition: "transform 0.1s",
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {isPilot
            ? (leicht ? "Angebot senden" : "Fahrt-Angebot veröffentlichen")
            : (leicht ? "Wunsch senden" : "Fahrt-Wunsch absenden")}
        </button>
      </div>
    </div>
  );
}

function MatchModal({ post, theme, onConfirm, onClose, leicht }) {
  const isOffer = post.type === "offer";
  return (
    <div
      role="dialog" aria-modal="true"
      aria-label={isOffer ? "Fahrt anfragen" : "Fahrt übernehmen"}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: theme.surface, borderRadius: `${theme.radius}px ${theme.radius}px 0 0`,
        padding: "28px 24px 36px", width: "100%", maxWidth: 500,
        boxShadow: theme.shadowLg, maxHeight: "70vh", overflowY: "auto",
      }}>
        <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: theme.textPrimary, marginBottom: 8, marginTop: 0 }}>
          {isOffer
            ? (leicht ? "Diese Fahrt anfragen?" : "Möchtest du diese Fahrt anfragen?")
            : (leicht ? "Diese Fahrt übernehmen?" : "Möchtest du diese Fahrt übernehmen?")}
        </h2>

        <div style={{
          background: isOffer ? theme.offerBlueBg : theme.requestOrangeBg,
          border: `2px solid ${isOffer ? theme.offerBlueBorder : theme.requestOrangeBorder}`,
          borderRadius: theme.radiusSm, padding: 16, marginBottom: 20,
        }}>
          <div style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: theme.textPrimary }}>
            {post.date ? fmt(post.date) : "Flexibel"}{post.timeStart && ` · ${post.timeStart}–${post.timeEnd}`}
          </div>
          <div style={{ fontFamily: font, fontSize: 15, color: theme.textSecondary, marginTop: 4 }}>
            {post.neighborhood}{post.vehicleName && ` · ${post.vehicleName}`}
          </div>
          {post.routeWish && (
            <div style={{ fontFamily: font, fontSize: 14, color: theme.textMuted, marginTop: 4, fontStyle: "italic" }}>
              „{post.routeWish}"
            </div>
          )}
        </div>

        <p style={{ fontFamily: font, fontSize: 15, color: theme.textSecondary, marginBottom: 24 }}>
          {isOffer
            ? (leicht ? "Die Pilot:in bekommt eine Nachricht." : "Die Pilot:in wird benachrichtigt und kann bestätigen.")
            : (leicht ? "Die Einrichtung bekommt eine Nachricht." : "Die anfragende Einrichtung wird benachrichtigt und kann bestätigen.")}
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "16px", fontSize: 16, fontWeight: 600, fontFamily: font,
            background: "transparent", color: theme.textSecondary,
            border: `2px solid ${theme.border}`, borderRadius: theme.radiusSm,
            cursor: "pointer", minHeight: 56,
          }}>
            {leicht ? "Zurück" : "Abbrechen"}
          </button>
          <button onClick={() => onConfirm(post)} style={{
            flex: 2, padding: "16px", fontSize: 16, fontWeight: 700, fontFamily: font,
            background: theme.accent, color: "#fff", border: "none",
            borderRadius: theme.radiusSm, cursor: "pointer", minHeight: 56,
          }}>
            {isOffer
              ? (leicht ? "Ja, anfragen!" : "Ja, Fahrt anfragen")
              : (leicht ? "Ja, übernehmen!" : "Ja, Fahrt übernehmen")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, theme }) {
  return (
    <div role="status" aria-live="polite" style={{
      position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
      background: theme.accent, color: "#fff", fontFamily: font, fontWeight: 700,
      fontSize: 15, padding: "14px 28px", borderRadius: 40, zIndex: 2000,
      boxShadow: theme.shadowLg, animation: "fadeInUp 0.3s ease",
    }}>
      ✓ {message}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function NextRide() {
  const [tab, setTab] = useState("rides");
  const [role, setRole] = useState("pilot");
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [highContrast, setHighContrast] = useState(false);
  const [leicht, setLeicht] = useState(false);
  const [modalPost, setModalPost] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("all");

  const theme = highContrast ? HC : T;
  const currentUser = USERS[role];

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleAction = (post) => setModalPost(post);

  const handleConfirmMatch = (post) => {
    setPosts((prev) => prev.map((p) =>
      p.id === post.id ? { ...p, status: "matched", matchedWith: currentUser.name, matchStatus: "proposed" } : p
    ));
    setModalPost(null);
    showToast(post.type === "offer" ? "Fahrt angefragt!" : "Fahrt übernommen!");
  };

  const handleNewPost = (post) => {
    setPosts((prev) => [post, ...prev]);
    setTab("rides");
    showToast(post.type === "offer" ? "Angebot veröffentlicht!" : "Wunsch veröffentlicht!");
  };

  const openPosts = posts.filter((p) => {
    if (filter === "offers") return p.type === "offer" && p.status === "open";
    if (filter === "requests") return p.type === "request" && p.status === "open";
    return p.status === "open";
  });

  const myPosts = posts.filter((p) => p.authorId === currentUser.id || p.matchedWith === currentUser.name);

  const tabs = [
    { id: "rides", label: leicht ? "Fahrten" : "Fahrten", icon: "📋" },
    { id: "offer", label: leicht ? "Anbieten" : "Anbieten", icon: "➕" },
    { id: "mine", label: leicht ? "Meine" : "Meine", icon: "👤" },
    { id: "more", label: leicht ? "Mehr" : "Mehr", icon: "⚙️" },
  ];

  return (
    <div style={{
      background: theme.bg, minHeight: "100vh", maxWidth: 520, margin: "0 auto",
      display: "flex", flexDirection: "column", fontFamily: font,
      color: theme.textPrimary, position: "relative",
    }}>
      <style>{`
        @import url('${googleFont}');
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        input:focus, select:focus, button:focus-visible {
          outline: 3px solid ${theme.focus};
          outline-offset: 2px;
        }
        ::selection { background: ${theme.offerBlue}33; }
      `}</style>

      <SkipLink />

      {/* Header */}
      <header style={{
        background: theme.surface, borderBottom: `2px solid ${theme.border}`,
        padding: "14px 20px", position: "sticky", top: 0, zIndex: 100,
        boxShadow: theme.shadow,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.offerBlue, margin: 0, letterSpacing: "-0.02em" }}>
              NextRide
            </h1>
            <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500 }}>
              {leicht ? "Rikscha-Fahrten für alle" : "Inklusive Rikscha-Fahrten · Düsseldorf"}
            </span>
          </div>
          <div style={{
            fontSize: 12, fontWeight: 600, color: theme.surface,
            background: theme.accent, padding: "4px 10px", borderRadius: 20,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            {currentUser.role === "facility" ? "Einrichtung" : currentUser.role === "coordinator" ? "Koordination" : currentUser.role === "rider" ? "Fahrgast" : "Pilot:in"}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" role="main" style={{ flex: 1, padding: "20px 16px 100px", overflowY: "auto" }}>

        {tab === "rides" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: theme.textPrimary }}>
                {leicht ? "Alle Fahrten" : "Verfügbare Fahrten"}
              </h2>
              <div role="group" aria-label="Filter" style={{ display: "flex", gap: 8 }}>
                {[
                  { id: "all", label: "Alle" },
                  { id: "offers", label: leicht ? "Angebote" : "Angebote" },
                  { id: "requests", label: leicht ? "Wünsche" : "Wünsche" },
                ].map((f) => (
                  <button key={f.id} onClick={() => setFilter(f.id)}
                    aria-pressed={filter === f.id}
                    style={{
                      padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: font,
                      background: filter === f.id ? theme.offerBlue : "transparent",
                      color: filter === f.id ? "#fff" : theme.textSecondary,
                      border: `2px solid ${filter === f.id ? theme.offerBlue : theme.border}`,
                      borderRadius: 24, cursor: "pointer", minHeight: 44,
                      transition: "all 0.15s",
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {openPosts.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: theme.textMuted, fontSize: 16 }}>
                {leicht ? "Gerade keine Fahrten." : "Keine offenen Fahrten in dieser Kategorie."}
              </div>
            ) : (
              openPosts.map((p) => (
                <RideCard key={p.id} post={p} theme={theme} currentRole={role} onAction={handleAction} leicht={leicht} />
              ))
            )}
          </>
        )}

        {tab === "offer" && (
          <PostForm currentUser={currentUser} theme={theme} onSubmit={handleNewPost} leicht={leicht} />
        )}

        {tab === "mine" && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: theme.textPrimary }}>
              {leicht ? "Meine Fahrten" : "Meine Fahrten"}
            </h2>
            {myPosts.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: theme.textMuted, fontSize: 16 }}>
                {leicht ? "Du hast noch keine Fahrten." : "Noch keine Fahrten — biete eine an oder frage eine an!"}
              </div>
            ) : (
              myPosts.map((p) => (
                <RideCard key={p.id} post={p} theme={theme} currentRole={role} onAction={() => {}} leicht={leicht} />
              ))
            )}
          </>
        )}

        {tab === "more" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary }}>
              {leicht ? "Einstellungen" : "Einstellungen & Profil"}
            </h2>

            {/* Role Switcher — demo only */}
            <fieldset style={{
              border: `2px solid ${theme.border}`, borderRadius: theme.radius,
              padding: 20, background: theme.surface,
            }}>
              <legend style={{ fontWeight: 700, fontSize: 15, color: theme.offerBlue, padding: "0 8px" }}>
                ⚡ Demo: Rolle wechseln
              </legend>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {Object.entries(USERS).map(([key, u]) => (
                  <button key={key} onClick={() => setRole(key)}
                    style={{
                      padding: "12px 18px", fontSize: 14, fontWeight: role === key ? 700 : 500,
                      fontFamily: font, borderRadius: theme.radiusSm, cursor: "pointer",
                      background: role === key ? theme.offerBlue : "transparent",
                      color: role === key ? "#fff" : theme.textSecondary,
                      border: `2px solid ${role === key ? theme.offerBlue : theme.border}`,
                      minHeight: 48,
                    }}>
                    {u.role === "facility" ? "Einrichtung" : u.role === "coordinator" ? "Koordination" : u.role === "rider" ? "Fahrgast" : "Pilot:in"}
                    <span style={{ display: "block", fontSize: 12, fontWeight: 400, marginTop: 2 }}>{u.name}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Accessibility toggles */}
            <div style={{ background: theme.surface, border: `2px solid ${theme.border}`, borderRadius: theme.radius, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: theme.textPrimary }}>
                {leicht ? "Anzeige" : "Barrierefreiheit"}
              </h3>

              <label style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 0", borderBottom: `1px solid ${theme.borderLight}`, cursor: "pointer",
              }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  {leicht ? "Einfache Sprache" : "Leichte Sprache"}
                </span>
                <div
                  role="switch" aria-checked={leicht} tabIndex={0}
                  onClick={() => setLeicht(!leicht)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLeicht(!leicht); }}}
                  style={{
                    width: 56, height: 32, borderRadius: 16,
                    background: leicht ? theme.accent : theme.border,
                    position: "relative", cursor: "pointer", transition: "background 0.2s",
                    flexShrink: 0,
                  }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 13,
                    background: "#fff", position: "absolute", top: 3,
                    left: leicht ? 27 : 3, transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </div>
              </label>

              <label style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 0", cursor: "pointer",
              }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  {leicht ? "Starke Kontraste" : "Hoher Kontrast"}
                </span>
                <div
                  role="switch" aria-checked={highContrast} tabIndex={0}
                  onClick={() => setHighContrast(!highContrast)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setHighContrast(!highContrast); }}}
                  style={{
                    width: 56, height: 32, borderRadius: 16,
                    background: highContrast ? theme.accent : theme.border,
                    position: "relative", cursor: "pointer", transition: "background 0.2s",
                    flexShrink: 0,
                  }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 13,
                    background: "#fff", position: "absolute", top: 3,
                    left: highContrast ? 27 : 3, transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </div>
              </label>
            </div>

            {/* About */}
            <div style={{ background: theme.surface, border: `2px solid ${theme.border}`, borderRadius: theme.radius, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: theme.textPrimary }}>
                {leicht ? "Über diese App" : "Über NextRide"}
              </h3>
              <p style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>
                {leicht
                  ? "NextRide bringt Rikscha-Fahrer und Fahrgäste zusammen. So können alle Menschen ihre Stadt erleben."
                  : "NextRide verbindet ehrenamtliche Rikscha-Pilot:innen mit Menschen, die ihre Stadt vom Fahrgastsitz aus erleben möchten. Ein Projekt im Geiste von Radeln ohne Alter."}
              </p>
              <p style={{ fontSize: 14, fontStyle: "italic", color: theme.textMuted }}>
                „Das Recht auf Wind in den Haaren"
              </p>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${theme.borderLight}`, fontSize: 13, color: theme.textMuted }}>
                v0.1 POC · AGPL-3.0 · April 2026
              </div>
            </div>
          </div>
        )}
      </main>

      <TabBar tabs={tabs} active={tab} onChange={setTab} theme={theme} />

      {modalPost && (
        <MatchModal post={modalPost} theme={theme} onConfirm={handleConfirmMatch} onClose={() => setModalPost(null)} leicht={leicht} />
      )}

      {toast && <Toast message={toast} theme={theme} />}
    </div>
  );
}
