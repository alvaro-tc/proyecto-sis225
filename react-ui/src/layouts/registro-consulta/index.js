/**
=========================================================
* Registro Consulta (Recepcionistas)
=========================================================
*/

import React, { useEffect, useState, useMemo } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiButton from "components/SuiButton";
import SuiAvatar from "components/SuiAvatar";
import Autocomplete from "@mui/material/Autocomplete";
// Using a lightweight in-file calendar component instead of Flatpickr
import Table from "examples/Table";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import clinicApi from "api/clinic";
import { useSoftUIController } from "context";
import styles from "layouts/tables/styles";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const SLOT_MINUTES = 30;

function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generateSlots(start = 9 * 60, end = 17 * 60, step = SLOT_MINUTES) {
  const slots = [];
  for (let t = start; t < end; t += step) slots.push(t);
  return slots;
}

export default function RegistroConsulta() {
  const classes = styles();
  const [controller, dispatch] = useSoftUIController();
  const { fixedNavbar: fixedNavbarCurrent } = controller;
  const [veterinarios, setVeterinarios] = useState([]);
  const [owners, setOwners] = useState([]);
  const [mascotas, setMascotas] = useState([]);

  const [vetSel, setVetSel] = useState(null);
  const [ownerSel, setOwnerSel] = useState(null);
  const [mascotaSel, setMascotaSel] = useState(null);

  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);

  // comprobante state
  const [motivo, setMotivo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reserveError, setReserveError] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [reservedData, setReservedData] = useState(null);

  // Simple responsive calendar component (fills container width)
  function SimpleCalendar({ value, onChange }) {
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

    function startOfMonth(d) {
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    function endOfMonth(d) {
      return new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }
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
      // JS: Sunday = 0 ... Saturday = 6. We'll render starting Sunday.
      const startDay = first.getDay();
      // fill leading nulls
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

    const matrix = useMemo(() => buildMatrix(viewDate), [viewDate]);

    function toISO(d) {
      return formatDateToISO(d);
    }

    const monthName = viewDate.toLocaleString(undefined, { month: "long", year: "numeric" });
    const months = Array.from({ length: 12 }).map((_, i) =>
      new Date(0, i).toLocaleString(undefined, { month: "long" })
    );
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }).map((_, i) => currentYear - 5 + i);
    const [showPicker, setShowPicker] = useState(false);

    return (
      <div className="simple-calendar" style={{ width: "100%" }}>
        <div
          className="sc-header"
          style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
        >
          <div style={{ flex: "0 0 auto" }}>
            <SuiButton
              aria-label="Mes anterior"
              variant="outlined"
              size="small"
              onClick={() => {
                prevMonth();
                setShowPicker(false);
              }}
              style={{ minWidth: 36 }}
            >
              ◀
            </SuiButton>
          </div>
          <div
            style={{
              flex: "1 1 auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <div
              onClick={() => setShowPicker((s) => !s)}
              role="button"
              tabIndex={0}
              style={{
                fontSize: "0.98rem",
                fontWeight: 700,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {monthName}
            </div>
            {showPicker ? (
              <div
                style={{
                  position: "absolute",
                  top: 36,
                  display: "flex",
                  gap: 8,
                  background: "#fff",
                  padding: 8,
                  borderRadius: 6,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                }}
              >
                <select
                  aria-label="Seleccionar mes"
                  value={viewDate.getMonth()}
                  onChange={(e) =>
                    setViewDate(new Date(viewDate.getFullYear(), Number(e.target.value), 1))
                  }
                  style={{
                    fontSize: "0.9rem",
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid rgba(0,0,0,0.12)",
                  }}
                >
                  {months.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Seleccionar año"
                  value={viewDate.getFullYear()}
                  onChange={(e) =>
                    setViewDate(new Date(Number(e.target.value), viewDate.getMonth(), 1))
                  }
                  style={{
                    fontSize: "0.9rem",
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid rgba(0,0,0,0.12)",
                  }}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <SuiButton variant="outlined" size="small" onClick={() => setShowPicker(false)}>
                  Cerrar
                </SuiButton>
              </div>
            ) : null}
          </div>
          <div style={{ flex: "0 0 auto" }}>
            <SuiButton
              aria-label="Mes siguiente"
              variant="outlined"
              size="small"
              onClick={() => {
                nextMonth();
                setShowPicker(false);
              }}
              style={{ minWidth: 36 }}
            >
              ▶
            </SuiButton>
          </div>
        </div>

        <div
          className="sc-weekdays"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
            marginBottom: 6,
          }}
        >
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: "0.72rem", color: "#666" }}>
              {d}
            </div>
          ))}
        </div>

        <div
          className="sc-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}
        >
          {matrix.flat().map((cell, idx) => {
            const isSelected = cell && toISO(cell) === value;
            const isToday = cell && toISO(cell) === toISO(new Date());
            return (
              <button
                key={idx}
                type="button"
                onClick={() => cell && onChange(toISO(cell))}
                disabled={!cell}
                className={"sc-cell" + (isSelected ? " selected" : "") + (isToday ? " today" : "")}
                style={{
                  width: "100%",
                  height: 36,
                  borderRadius: 6,
                  border: isSelected ? "1px solid #333" : "1px solid rgba(0,0,0,0.08)",
                  background: isSelected ? "#212121" : "#fff",
                  color: isSelected ? "#fff" : cell ? "#111" : "#aaa",
                  cursor: cell ? "pointer" : "default",
                }}
              >
                {cell ? cell.getDate() : ""}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  useEffect(() => {
    let mounted = true;
    async function loadLists() {
      try {
        const vets = await clinicApi.list("veterinarios/with-availability");
        if (!mounted) return;
        setVeterinarios(Array.isArray(vets) ? vets : []);
      } catch (err) {
        console.warn("Error loading veterinarios", err);
        if (mounted) setVeterinarios([]);
      }

      try {
        const d = await clinicApi.list("duenos");
        if (!mounted) return;
        setOwners(Array.isArray(d) ? d : []);
      } catch (err) {
        console.warn("Error loading duenos", err);
        if (mounted) setOwners([]);
      }

      // mascotas will be loaded on owner selection
      if (mounted) setLoading(false);
    }
    loadLists();
    return () => (mounted = false);
  }, []);

  // When veterinarios list is loaded, auto-select the first one if none selected
  useEffect(() => {
    if ((!vetSel || vetSel === null) && Array.isArray(veterinarios) && veterinarios.length > 0) {
      setVetSel(veterinarios[0]);
    }
    // only run when veterinarios changes
  }, [veterinarios]);

  // Ensure navbar is fixed on this page and restore previous state when leaving
  useEffect(() => {
    try {
      dispatch({ type: "FIXED_NAVBAR", value: true });
    } catch (e) {
      // no-op
    }
    return () => {
      try {
        dispatch({ type: "FIXED_NAVBAR", value: fixedNavbarCurrent });
      } catch (e) {
        // no-op
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadMascotas() {
      if (!ownerSel) {
        setMascotas([]);
        return;
      }
      setMascotas([]);
      try {
        // try endpoint that returns mascotas for owner; fallback to general list and filter
        const all = await clinicApi.list("mascotas/with-dueno");
        if (!mounted) return;
        const filtered = Array.isArray(all)
          ? all.filter(
              (m) =>
                String(m.dueno) ===
                String(ownerSel.id || ownerSel.idDueno || ownerSel.pk || ownerSel.dueno)
            )
          : [];
        setMascotas(filtered);
      } catch (err) {
        console.warn("Error loading mascotas for owner", err);
        setMascotas([]);
      }
    }
    loadMascotas();
    return () => (mounted = false);
  }, [ownerSel]);

  useEffect(() => {
    let mounted = true;
    async function loadConsultas() {
      setConsultas([]);
      if (!vetSel) return;
      try {
        const id = vetSel.id || vetSel.idVeterinario || vetSel.idVet || vetSel.pk;
        // fetch all consultas for vet and filter by date
        const res = await clinicApi.request(`/api/clinic/veterinarios/${id}/consultas`, {
          method: "GET",
        });
        if (!mounted) return;
        const arr = Array.isArray(res) ? res : [];
        // normalize consulta date fields and filter by date
        const byDate = arr.filter((c) => {
          const f =
            c.fecha || (c.fechaHora ? String(c.fechaHora).split("T")[0] : null) || c.date || null;
          return f === date;
        });
        setConsultas(byDate);
      } catch (err) {
        console.warn("Error loading consultas for vet", err);
        setConsultas([]);
      }
    }
    loadConsultas();
    return () => (mounted = false);
  }, [vetSel, date]);

  const availableSlots = useMemo(() => {
    const allSlots = generateSlots();
    if (!consultas || consultas.length === 0) return allSlots;
    // build occupied minutes from consultas
    const occupied = new Set();
    consultas.forEach((c) => {
      const hora =
        c.hora ||
        (c.fechaHora ? (String(c.fechaHora).split("T")[1] || "").slice(0, 5) : null) ||
        c.time ||
        "";
      if (!hora) return;
      const [hh, mm] = String(hora).split(":");
      const start = Number(hh) * 60 + Number(mm);
      occupied.add(start);
    });
    return allSlots.filter((s) => !occupied.has(s));
  }, [consultas]);

  // compute occupied set once for rendering both available and unavailable slots
  const occupiedSlots = useMemo(() => {
    const set = new Set();
    if (!consultas || consultas.length === 0) return set;
    consultas.forEach((c) => {
      const hora =
        c.hora ||
        (c.fechaHora ? (String(c.fechaHora).split("T")[1] || "").slice(0, 5) : null) ||
        c.time ||
        "";
      if (!hora) return;
      const [hh, mm] = String(hora).split(":");
      const start = Number(hh) * 60 + Number(mm);
      set.add(start);
    });
    return set;
  }, [consultas]);

  function handleReserve() {
    setReserveError(null);
    if (!vetSel || !ownerSel || !mascotaSel || !selectedSlot) {
      setReserveError("Selecciona veterinario, dueño, mascota y horario");
      setConfirmOpen(true);
      return;
    }
    setConfirmOpen(true);
  }

  async function performReserve() {
    setReserveError(null);
    if (!vetSel || !ownerSel || !mascotaSel || !selectedSlot) {
      setReserveError("Faltan campos obligatorios: veterinario, dueño, mascota o horario");
      return;
    }
    const idVet = vetSel.id || vetSel.idVeterinario || vetSel.idVet || vetSel.pk;
    const idMasc = mascotaSel.idMascota || mascotaSel.id || mascotaSel.pk;
    const payload = {
      motivo: motivo || "",
      descripcion: descripcion || "",
      fecha: date,
      hora: minutesToTime(selectedSlot),
      veterinario: Number(idVet),
      mascota_id: Number(idMasc),
      dueno: Number(ownerSel.id || ownerSel.idDueno || ownerSel.pk || ownerSel.dueno),
    };
    try {
      await clinicApi.request("/api/clinic/consultas", { method: "POST", body: payload });
      // prepare reserved data to display in success modal before clearing state
      const reserved = {
        fecha: date,
        hora: minutesToTime(selectedSlot),
        veterinario: vetSel ? vetSel.nombre || vetSel.name || "-" : "-",
        dueno: ownerSel ? ownerSel.nombre || ownerSel.name || "-" : "-",
        mascota: mascotaSel ? mascotaSel.nombre || mascotaSel.name || "-" : "-",
        motivo: motivo || "",
        descripcion: descripcion || "",
      };
      setConfirmOpen(false);
      setReservedData(reserved);
      // success: show modal with reserved info
      setSuccessOpen(true);
      // then clear form
      setSelectedSlot(null);
      setMotivo("");
      setDescripcion("");
      // refresh consultas list
      setDate((d) => d);
    } catch (err) {
      console.error("Error reservando consulta", err);
      const msg = err?.body?.message || err?.body?._raw || JSON.stringify(err);
      setReserveError(msg || "Error al registrar consulta");
    }
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SuiBox py={3}>
        <SuiBox mb={3}>
          <Card>
            {/* Header removed to keep the page compact for receptionists */}
            <Divider />
            <SuiBox p={3}>
              <Grid container spacing={3}>
                {/* Left column */}
                <Grid item xs={12} md={8}>
                  <SuiTypography variant="h6">Disponibilidad</SuiTypography>
                  <SuiBox mt={2}>
                    <Autocomplete
                      options={veterinarios}
                      getOptionLabel={(o) => o && (o.nombre || o.name || (o.user && o.user.email))}
                      value={vetSel}
                      onChange={(_, v) => setVetSel(v)}
                      freeSolo
                      popupIcon={<ExpandMoreIcon fontSize="small" />}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar veterinario"
                          variant="outlined"
                          size="small"
                          autoFocus
                          fullWidth
                          InputLabelProps={{ sx: { fontSize: "0.78rem" } }}
                          inputProps={{
                            ...params.inputProps,
                            style: { fontSize: "0.78rem", padding: "8px 10px" },
                          }}
                          sx={{ "& .MuiOutlinedInput-root": { minHeight: 44 } }}
                        />
                      )}
                    />
                  </SuiBox>
                  <SuiBox mt={2}>
                    <Autocomplete
                      options={owners}
                      getOptionLabel={(o) => o && (o.nombre || o.name || (o.user && o.user.email))}
                      value={ownerSel}
                      onChange={(_, v) => setOwnerSel(v)}
                      disabled={!vetSel}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar dueño"
                          variant="outlined"
                          size="small"
                          fullWidth
                          InputLabelProps={{ sx: { fontSize: "0.78rem" } }}
                          inputProps={{
                            ...params.inputProps,
                            style: { fontSize: "0.78rem", padding: "8px 10px" },
                          }}
                          disabled={!vetSel}
                          helperText={!vetSel ? "Selecciona un veterinario primero" : undefined}
                          sx={{ "& .MuiOutlinedInput-root": { minHeight: 44 } }}
                        />
                      )}
                    />
                  </SuiBox>
                  <SuiBox mt={2}>
                    <Autocomplete
                      options={mascotas}
                      getOptionLabel={(o) => o && (o.nombre || o.name || "")}
                      value={mascotaSel}
                      onChange={(_, v) => setMascotaSel(v)}
                      disabled={!vetSel}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Mascota (por dueño)"
                          variant="outlined"
                          size="small"
                          fullWidth
                          InputLabelProps={{ sx: { fontSize: "0.78rem" } }}
                          inputProps={{
                            ...params.inputProps,
                            style: { fontSize: "0.78rem", padding: "8px 10px" },
                          }}
                          disabled={!vetSel}
                          helperText={!vetSel ? "Selecciona un veterinario primero" : undefined}
                          sx={{ "& .MuiOutlinedInput-root": { minHeight: 44 } }}
                        />
                      )}
                    />
                  </SuiBox>

                  <SuiBox mt={3}>
                    <SuiTypography variant="subtitle2">Horarios disponibles</SuiTypography>
                    <SuiBox display="flex" flexWrap="wrap" gap={1} mt={1}>
                      {generateSlots().map((s) => {
                        const occupied = occupiedSlots.has(s);
                        return (
                          <SuiButton
                            key={s}
                            variant={selectedSlot === s ? "contained" : "outlined"}
                            buttonColor={
                              selectedSlot === s ? "dark" : occupied ? "secondary" : "info"
                            }
                            size="small"
                            onClick={() => !occupied && vetSel && setSelectedSlot(s)}
                            disabled={occupied || !vetSel}
                            sx={{
                              textTransform: "none",
                              minWidth: 64,
                              padding: "6px 8px",
                              fontSize: "0.75rem",
                              ...(occupied
                                ? {
                                    color: "#ffffff",
                                    borderColor: "#bdbdbd",
                                    backgroundColor: "#bdbdbd",
                                    pointerEvents: "none",
                                    "&.Mui-disabled": {
                                      backgroundColor: "#bdbdbd",
                                      color: "#ffffff",
                                      opacity: 1,
                                    },
                                  }
                                : !vetSel
                                ? { opacity: 0.65 }
                                : {}),
                            }}
                          >
                            {minutesToTime(s)}
                          </SuiButton>
                        );
                      })}
                    </SuiBox>
                  </SuiBox>

                  <SuiBox mt={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Motivo"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      InputLabelProps={{ sx: { fontSize: "0.78rem" } }}
                      inputProps={{ style: { fontSize: "0.78rem", padding: "8px 10px" } }}
                      sx={{ "& .MuiOutlinedInput-root": { minHeight: 44 } }}
                      disabled={!vetSel}
                      helperText={!vetSel ? "Selecciona un veterinario primero" : undefined}
                    />
                  </SuiBox>

                  <SuiBox mt={2}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      size="small"
                      label="Descripción"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      InputLabelProps={{ sx: { fontSize: "0.78rem" } }}
                      inputProps={{ style: { fontSize: "0.78rem", padding: "8px 10px" } }}
                      sx={{ "& .MuiOutlinedInput-root": { minHeight: 80 } }}
                      disabled={!vetSel}
                      helperText={!vetSel ? "Selecciona un veterinario primero" : undefined}
                    />
                  </SuiBox>

                  <SuiBox mt={2} display="flex" gap={1}>
                    <SuiButton
                      variant="outlined"
                      buttonColor="secondary"
                      onClick={() => {
                        setSelectedSlot(null);
                        setMotivo("");
                        setDescripcion("");
                      }}
                    >
                      Limpiar
                    </SuiButton>
                    <SuiButton
                      variant="gradient"
                      buttonColor="dark"
                      onClick={handleReserve}
                      disabled={!vetSel}
                    >
                      Reservar cita
                    </SuiButton>
                  </SuiBox>
                </Grid>

                {/* Right column */}
                <Grid item xs={12} md={4}>
                  <SuiTypography variant="h6">Seleccionar fecha</SuiTypography>
                  <SuiBox mt={2}>
                    {/* hide any visible flatpickr input and show calendar inline filling container */}
                    <div
                      id="rc-calendar"
                      style={{ display: "flex", justifyContent: "center", width: "100%" }}
                    >
                      <style>{`
                        /* SimpleCalendar overrides inside the rc-calendar container */
                        #rc-calendar .simple-calendar { width: 100%; }
                        #rc-calendar .sc-weekdays { margin-bottom: 6px; }
                        #rc-calendar .sc-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
                        #rc-calendar .sc-cell { width: 100%; height: 36px; border-radius: 6px; }
                        #rc-calendar .sc-cell.selected { background: #212121; color: #fff; border: 1px solid #333; }
                        #rc-calendar .sc-cell.today { box-shadow: inset 0 0 0 1px rgba(0,0,0,0.04); }
                      `}</style>
                      <SimpleCalendar value={date} onChange={(d) => setDate(d)} />
                    </div>
                  </SuiBox>
                  {/* Confirm dialog for reservation */}
                  <Dialog
                    open={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    fullWidth
                    maxWidth="xs"
                  >
                    <DialogTitle>Confirmar reserva</DialogTitle>
                    <DialogContent>
                      {reserveError ? (
                        <SuiTypography color="error">{reserveError}</SuiTypography>
                      ) : (
                        <SuiBox>
                          <SuiTypography>¿Confirmas la reserva de la cita?</SuiTypography>
                          <SuiBox mt={1}>
                            <SuiTypography variant="caption">Fecha:</SuiTypography>
                            <SuiTypography>{date}</SuiTypography>
                          </SuiBox>
                          <SuiBox mt={1}>
                            <SuiTypography variant="caption">Hora:</SuiTypography>
                            <SuiTypography>
                              {selectedSlot ? minutesToTime(selectedSlot) : "—"}
                            </SuiTypography>
                          </SuiBox>
                          <SuiBox mt={1}>
                            <SuiTypography variant="caption">Veterinario:</SuiTypography>
                            <SuiTypography>
                              {vetSel ? vetSel.nombre || vetSel.name || "-" : "—"}
                            </SuiTypography>
                          </SuiBox>
                        </SuiBox>
                      )}
                    </DialogContent>
                    <DialogActions>
                      <SuiButton
                        variant="outlined"
                        buttonColor="secondary"
                        onClick={() => setConfirmOpen(false)}
                      >
                        Cancelar
                      </SuiButton>
                      <SuiButton variant="gradient" buttonColor="dark" onClick={performReserve}>
                        Confirmar
                      </SuiButton>
                    </DialogActions>
                  </Dialog>

                  {/* Success dialog (small modal) */}
                  <Dialog
                    open={successOpen}
                    onClose={() => {
                      setSuccessOpen(false);
                      setReservedData(null);
                    }}
                    fullWidth
                    maxWidth="xs"
                  >
                    <DialogTitle>Consulta reservada</DialogTitle>
                    <DialogContent>
                      <SuiBox>
                        <SuiBox mt={1}>
                          <SuiTypography variant="caption">Fecha:</SuiTypography>
                          <SuiTypography>{reservedData ? reservedData.fecha : date}</SuiTypography>
                        </SuiBox>
                        <SuiBox mt={1}>
                          <SuiTypography variant="caption">Hora:</SuiTypography>
                          <SuiTypography>
                            {reservedData
                              ? reservedData.hora
                              : selectedSlot
                              ? minutesToTime(selectedSlot)
                              : "—"}
                          </SuiTypography>
                        </SuiBox>
                        <SuiBox mt={1}>
                          <SuiTypography variant="caption">Veterinario:</SuiTypography>
                          <SuiTypography>
                            {reservedData
                              ? reservedData.veterinario
                              : vetSel
                              ? vetSel.nombre || vetSel.name || "-"
                              : "—"}
                          </SuiTypography>
                        </SuiBox>
                        <SuiBox mt={1}>
                          <SuiTypography variant="caption">Dueño:</SuiTypography>
                          <SuiTypography>
                            {reservedData
                              ? reservedData.dueno
                              : ownerSel
                              ? ownerSel.nombre || ownerSel.name || "-"
                              : "—"}
                          </SuiTypography>
                        </SuiBox>
                        <SuiBox mt={1}>
                          <SuiTypography variant="caption">Mascota:</SuiTypography>
                          <SuiTypography>
                            {reservedData
                              ? reservedData.mascota
                              : mascotaSel
                              ? mascotaSel.nombre || mascotaSel.name || "-"
                              : "—"}
                          </SuiTypography>
                        </SuiBox>
                        {reservedData && reservedData.motivo ? (
                          <SuiBox mt={1}>
                            <SuiTypography variant="caption">Motivo:</SuiTypography>
                            <SuiTypography>{reservedData.motivo}</SuiTypography>
                          </SuiBox>
                        ) : null}
                        {reservedData && reservedData.descripcion ? (
                          <SuiBox mt={1}>
                            <SuiTypography variant="caption">Descripción:</SuiTypography>
                            <SuiTypography>{reservedData.descripcion}</SuiTypography>
                          </SuiBox>
                        ) : null}
                      </SuiBox>
                    </DialogContent>
                    <DialogActions>
                      <SuiButton
                        variant="gradient"
                        buttonColor="dark"
                        onClick={() => {
                          setSuccessOpen(false);
                          setReservedData(null);
                        }}
                      >
                        Cerrar
                      </SuiButton>
                    </DialogActions>
                  </Dialog>

                  <SuiBox mt={3}>
                    <SuiTypography variant="subtitle2">Comprobante (vista previa)</SuiTypography>
                    <Card sx={{ p: 2, mt: 1 }}>
                      <SuiBox display="flex" alignItems="center" gap={2} mb={2}>
                        <SuiAvatar size="md" variant="rounded">
                          C
                        </SuiAvatar>
                        <SuiBox sx={{ display: "flex", flexDirection: "column" }}>
                          <SuiTypography variant="button" sx={{ fontWeight: 700, lineHeight: 1 }}>
                            {"Clínica Veterinaria"}
                          </SuiTypography>
                          <SuiTypography variant="caption" sx={{ mt: 0.5 }}>
                            {"Comprobante de cita"}
                          </SuiTypography>
                        </SuiBox>
                      </SuiBox>

                      <Divider sx={{ my: 1 }} />

                      <SuiBox
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <SuiTypography variant="caption" sx={{ fontSize: "0.72rem" }}>
                          Fecha:
                        </SuiTypography>
                        <SuiTypography variant="body2" sx={{ fontSize: "0.85rem" }}>
                          {date}
                        </SuiTypography>
                      </SuiBox>

                      <SuiBox
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <SuiTypography variant="caption" sx={{ fontSize: "0.72rem" }}>
                          Hora:
                        </SuiTypography>
                        <SuiTypography variant="body2" sx={{ fontSize: "0.85rem" }}>
                          {selectedSlot ? minutesToTime(selectedSlot) : "—"}
                        </SuiTypography>
                      </SuiBox>

                      <SuiBox
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <SuiTypography variant="caption" sx={{ fontSize: "0.72rem" }}>
                          Veterinario:
                        </SuiTypography>
                        <SuiTypography variant="body2" sx={{ fontSize: "0.85rem" }}>
                          {vetSel ? vetSel.nombre || vetSel.name || "-" : "—"}
                        </SuiTypography>
                      </SuiBox>

                      <SuiBox
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <SuiTypography variant="caption" sx={{ fontSize: "0.72rem" }}>
                          Dueño:
                        </SuiTypography>
                        <SuiTypography variant="body2" sx={{ fontSize: "0.85rem" }}>
                          {ownerSel ? ownerSel.nombre || ownerSel.name || "-" : "—"}
                        </SuiTypography>
                      </SuiBox>

                      <SuiBox
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <SuiTypography variant="caption" sx={{ fontSize: "0.72rem" }}>
                          Mascota:
                        </SuiTypography>
                        <SuiTypography variant="body2" sx={{ fontSize: "0.85rem" }}>
                          {mascotaSel ? mascotaSel.nombre || mascotaSel.name || "-" : "—"}
                        </SuiTypography>
                      </SuiBox>
                    </Card>
                  </SuiBox>
                </Grid>
              </Grid>
            </SuiBox>
          </Card>
        </SuiBox>
      </SuiBox>
      <Footer />
    </DashboardLayout>
  );
}
