import React, { useEffect, useMemo, useState } from "react";
import SuiButton from "components/SuiButton";

const defaultWeekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function SimpleCalendar({ value, onChange, disablePast }) {
  function parseISOToDate(iso) {
    if (!iso) return null;
    const parts = String(iso).split("-");
    if (parts.length < 3) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    return new Date(y, m, d);
  }

  function formatDateToISO(d) {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const [viewDate, setViewDate] = useState(() => parseISOToDate(value) || new Date());

  useEffect(() => {
    if (value) {
      const parsed = parseISOToDate(value);
      if (parsed) setViewDate(parsed);
    }
  }, [value]);

  function prevMonth() {
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1));
  }

  function buildMatrix(d) {
    const year = d.getFullYear();
    const month = d.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const matrix = [];
    let week = [];
    const startDay = first.getDay();
    for (let i = 0; i < startDay; i++) week.push(null);
    for (let day = 1; day <= last.getDate(); day++) {
      week.push(new Date(year, month, day));
      if (week.length === 7) {
        matrix.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      matrix.push(week);
    }
    return matrix;
  }

  const matrix = useMemo(() => buildMatrix(viewDate) || [], [viewDate]);

  function toISO(d) {
    return formatDateToISO(d);
  }

  const monthName = viewDate.toLocaleString(undefined, { month: "long", year: "numeric" });
  const months = Array.from({ length: 12 }).map((_, i) => new Date(0, i).toLocaleString(undefined, { month: "long" }));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }).map((_, i) => currentYear - 5 + i);
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="simple-calendar" style={{ width: "100%" }}>
      <div className="sc-header" style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <div style={{ flex: "0 0 auto" }}>
          <SuiButton aria-label="Mes anterior" variant="outlined" size="small" onClick={() => { prevMonth(); setShowPicker(false); }} style={{ minWidth: 36 }}>◀</SuiButton>
        </div>
        <div style={{ flex: "1 1 auto", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
          <div onClick={() => setShowPicker((s) => !s)} role="button" tabIndex={0} style={{ fontSize: "0.98rem", fontWeight: 700, cursor: "pointer", userSelect: "none" }}>{monthName}</div>
          {showPicker ? (
            <div style={{ position: "absolute", top: 36, display: "flex", gap: 8, background: "#fff", padding: 8, borderRadius: 6, boxShadow: "0 6px 18px rgba(0,0,0,0.08)", zIndex: 10 }}>
              <select aria-label="Seleccionar mes" value={viewDate.getMonth()} onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), Number(e.target.value), 1))} style={{ fontSize: "0.9rem", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.12)" }}>
                {months.map((m, i) => (<option key={m} value={i}>{m}</option>))}
              </select>
              <select aria-label="Seleccionar año" value={viewDate.getFullYear()} onChange={(e) => setViewDate(new Date(Number(e.target.value), viewDate.getMonth(), 1))} style={{ fontSize: "0.9rem", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.12)" }}>
                {years.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
              <SuiButton variant="outlined" size="small" onClick={() => setShowPicker(false)}>Cerrar</SuiButton>
            </div>
          ) : null}
        </div>
        <div style={{ flex: "0 0 auto" }}>
          <SuiButton aria-label="Mes siguiente" variant="outlined" size="small" onClick={() => { nextMonth(); setShowPicker(false); }} style={{ minWidth: 36 }}>▶</SuiButton>
        </div>
      </div>

      <div className="sc-weekdays" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
        {defaultWeekdays.map((d) => (<div key={d} style={{ textAlign: "center", fontSize: "0.72rem", color: "#666" }}>{d}</div>))}
      </div>

      <div className="sc-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {matrix.flat().map((cell, idx) => {
          const isSelected = cell && toISO(cell) === value;
          const isToday = cell && toISO(cell) === toISO(new Date());

          let isPast = false;
          if (cell && disablePast) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const cellD = new Date(cell);
            cellD.setHours(0, 0, 0, 0);
            if (cellD < today) isPast = true;
          }

          const cellBg = isSelected ? "#212121" : isPast ? "#ececec" : "#fff";
          const cellColor = isSelected ? "#fff" : isPast ? "#bbb" : cell ? "#111" : "#aaa";
          const cellBorder = isSelected ? "1px solid #333" : "1px solid rgba(0,0,0,0.08)";
          const cellCursor = cell && !isPast ? "pointer" : "default";

          return (
            <button key={idx} type="button" onClick={() => cell && !isPast && onChange(toISO(cell))} disabled={!cell || isPast} className={"sc-cell" + (isSelected ? " selected" : "") + (isToday ? " today" : "")} style={{ width: "100%", height: 36, borderRadius: 6, border: cellBorder, background: cellBg, color: cellColor, cursor: cellCursor }}>{cell ? cell.getDate() : ""}</button>
          );
        })}
      </div>
    </div>
  );
}
