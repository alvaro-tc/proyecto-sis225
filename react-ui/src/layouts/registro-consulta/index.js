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
import Autocomplete from "@mui/material/Autocomplete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import SimpleCalendar from "components/SimpleCalendar";
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiButton from "components/SuiButton";
import SuiAvatar from "components/SuiAvatar";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import clinicApi from "api/clinic";
import { useSoftUIController } from "context";

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
  const [controller, dispatch] = useSoftUIController();
  const { fixedNavbar } = controller;
  const [fixedNavbarCurrent] = useState(fixedNavbar);

  const [veterinarios, setVeterinarios] = useState([]);
  const [owners, setOwners] = useState([]);
  const [mascotas, setMascotas] = useState([]);

  const [vetSel, setVetSel] = useState(null);
  const [ownerSel, setOwnerSel] = useState(null);
  const [mascotaSel, setMascotaSel] = useState(null);

  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reserveError, setReserveError] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [reservedData, setReservedData] = useState(null);

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
  }, [veterinarios]);

  useEffect(() => {
    try {
      dispatch({ type: "FIXED_NAVBAR", value: true });
    } catch (e) {
    }
    return () => {
      try {
        dispatch({ type: "FIXED_NAVBAR", value: fixedNavbarCurrent });
      } catch (e) {
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
        const res = await clinicApi.request(`/api/clinic/veterinarios/${id}/consultas`, {
          method: "GET",
        });
        if (!mounted) return;
        const arr = Array.isArray(res) ? res : [];
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
      setReserveError("Faltan campos obligatorios");
      return;
    }

    // Strict Validation for Past Dates/Time
    const today = new Date();
    // Reset time to start of day for accurate date comparison
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Parse selected date (safe assumption it's yyyy-mm-dd from SimpleCalendar)
    const [y, m, d] = date.split('-').map(Number);
    const selectedDateObj = new Date(y, m - 1, d);

    if (selectedDateObj < todayDateOnly) {
      setReserveError("No se puede reservar en una fecha pasada.");
      setConfirmOpen(false); // keep in view to see error
      alert("Error: Fecha pasada.");
      return;
    }

    if (selectedDateObj.getTime() === todayDateOnly.getTime()) {
      // checks time
      const currentMinutes = today.getHours() * 60 + today.getMinutes();
      if (selectedSlot < currentMinutes) {
        setReserveError("No se puede reservar en un horario pasado.");
        setConfirmOpen(false);
        return;
      }
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
      setSuccessOpen(true);
      setSelectedSlot(null);
      setMotivo("");
      setDescripcion("");
      setDate((d) => d); // trigger re-fetch
    } catch (err) {
      console.error("Error reservando consulta", err);
      const msg = err?.body?.message || err?.body?._raw || JSON.stringify(err);
      setReserveError(msg || "Error al registrar consulta");
    }
  }

  // Handle Date Change wrapper to prevent selecting past dates (visual feedback)
  const handleDateChange = (newDate) => {
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [y, m, d] = newDate.split('-').map(Number);
    const selectedObj = new Date(y, m - 1, d);

    if (selectedObj < todayDateOnly) {
      // You could block it here, or just let them select but disable slots.
      // User asked "verify that past days cannot be selected".
      // Let's block the state update and alert.
      // alert("No puedes seleccionar días pasados."); // Optional: too intrusive?
      // just ignore
      return;
    }
    setDate(newDate);
    setSelectedSlot(null); // reset slot on date change
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SuiBox py={3}>
        <SuiBox mb={3}>
          <Card>
            <Divider />
            <SuiBox p={3}>
              <Grid container spacing={3}>
                {/* Left column */}
                <Grid item xs={12} md={8}>
                  <SuiTypography variant="h6">Disponibilidad</SuiTypography>

                  {/* Veterinario - Label Above */}
                  <SuiBox mt={2}>
                    <SuiBox mb={1}>
                      <SuiTypography variant="caption" fontWeight="bold" color="text">
                        Buscar veterinario
                      </SuiTypography>
                    </SuiBox>
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
                          placeholder="Escribe para buscar..."
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

                  {/* Dueño - Label Above */}
                  <SuiBox mt={2}>
                    <SuiBox mb={1}>
                      <SuiTypography variant="caption" fontWeight="bold" color="text">
                        Buscar dueño
                      </SuiTypography>
                    </SuiBox>
                    <Autocomplete
                      options={owners}
                      getOptionLabel={(o) => o && (o.nombre || o.name || (o.user && o.user.email))}
                      value={ownerSel}
                      onChange={(_, v) => setOwnerSel(v)}
                      disabled={!vetSel}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Escribe para buscar..."
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

                  {/* Mascota - Label Above */}
                  <SuiBox mt={2}>
                    <SuiBox mb={1}>
                      <SuiTypography variant="caption" fontWeight="bold" color="text">
                        Mascota (por dueño)
                      </SuiTypography>
                    </SuiBox>
                    <Autocomplete
                      options={mascotas}
                      getOptionLabel={(o) => o && (o.nombre || o.name || "")}
                      value={mascotaSel}
                      onChange={(_, v) => setMascotaSel(v)}
                      disabled={!vetSel}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Selecciona una mascota"
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
                        let past = false;

                        // Check if time is past
                        const today = new Date();
                        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                        // Assume `date` is YYYY-MM-DD
                        if (date) {
                          const [y, m, d] = date.split('-').map(Number);
                          const selectedDateObj = new Date(y, m - 1, d);

                          if (selectedDateObj < todayDateOnly) {
                            past = true; // All slots in past days are past
                          } else if (selectedDateObj.getTime() === todayDateOnly.getTime()) {
                            const nowMinutes = today.getHours() * 60 + today.getMinutes();
                            if (s <= nowMinutes) past = true;
                          }
                        }

                        const disabled = occupied || !vetSel || past;
                        return (
                          <SuiButton
                            key={s}
                            variant={selectedSlot === s ? "contained" : "outlined"}
                            buttonColor={
                              selectedSlot === s ? "dark" : occupied ? "secondary" : "info"
                            }
                            size="small"
                            onClick={() => !disabled && vetSel && setSelectedSlot(s)}
                            disabled={disabled}
                            sx={{
                              textTransform: "none",
                              minWidth: 64,
                              padding: "6px 8px",
                              fontSize: "0.75rem",
                              ...(occupied || past
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

                  {/* Motivo - Label Above */}
                  <SuiBox mt={3}>
                    <SuiBox mb={1}>
                      <SuiTypography variant="caption" fontWeight="bold" color="text">
                        Motivo
                      </SuiTypography>
                    </SuiBox>
                    <TextField
                      fullWidth
                      size="small"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      InputLabelProps={{ sx: { fontSize: "0.78rem" } }}
                      inputProps={{ style: { fontSize: "0.78rem", padding: "8px 10px" } }}
                      sx={{ "& .MuiOutlinedInput-root": { minHeight: 44 } }}
                      disabled={!vetSel}
                      helperText={!vetSel ? "Selecciona un veterinario primero" : undefined}
                    />
                  </SuiBox>

                  {/* Descripción - Label Above */}
                  <SuiBox mt={2}>
                    <SuiBox mb={1}>
                      <SuiTypography variant="caption" fontWeight="bold" color="text">
                        Descripción
                      </SuiTypography>
                    </SuiBox>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      size="small"
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
                      <SimpleCalendar value={date} onChange={handleDateChange} disablePast={true} />
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
