import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  Autocomplete,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import SuiButton from "components/SuiButton";
import clinicApi from "api/clinic";

const SLOT_MINUTES = 30; // slot length in minutes

function parseTime(t) {
  if (!t) return null;
  // accept formats like HH:MM:SS, HH:MM:SSZ, HH:MM
  const m = String(t).match(/(\d{2}):(\d{2})/);
  if (!m) return null;
  return { hh: parseInt(m[1], 10), mm: parseInt(m[2], 10) };
}

function timeToMinutes(t) {
  return t.hh * 60 + t.mm;
}

function minutesToTime(mins) {
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function formatSlotLabel(slot) {
  // slot e.g. "09:30"
  return slot;
}

function parseFechaHora(value) {
  if (!value) return { fecha: null, hora: null };
  // if it's an object with fecha/hora
  if (typeof value === "object") {
    return { fecha: value.fecha || null, hora: value.hora || null };
  }
  // try ISO string
  try {
    const d = new Date(String(value));
    if (!isNaN(d.getTime())) {
      const fecha = d.toISOString().slice(0, 10);
      const hora = d.toISOString().slice(11, 16);
      return { fecha, hora };
    }
  } catch (e) {
    // fallthrough
  }
  // try split 'YYYY-MM-DD HH:MM' or 'YYYY-MM-DDTHH:MM:SS'
  const m = String(value).match(/(\d{4}-\d{2}-\d{2}).*(\d{2}:\d{2})/);
  if (m) return { fecha: m[1], hora: m[2] };
  return { fecha: null, hora: null };
}

function isFuture(fecha, hora) {
  if (!fecha) return false;
  const dateStr = `${fecha}T${hora || "00:00"}:00`;
  const d = new Date(dateStr);
  return d.getTime() > Date.now();
}

export default function ModalCrearConsulta({ open, onClose, onSaved }) {
  const LABEL_FONT = "1.25rem";
  const INPUT_FONT = "1.05rem";
  const TITLE_FONT = "1.25rem";

  const textFieldSx = {
    "& .MuiInputLabel-root": { fontSize: LABEL_FONT },
    "& .MuiFormHelperText-root": { fontSize: "1.1rem" },
    "& .MuiOutlinedInput-root": { minHeight: 52 },
    "& .MuiInputBase-input": { fontSize: INPUT_FONT, padding: "14px 12px" },
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { motivo: "", descripcion: "", fecha: "", mascota: null, veterinario: null, hora: "" } });

  const veterinarioSel = watch("veterinario");
  const fechaSel = watch("fecha");
  const horaSel = watch("hora");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [veterinarios, setVeterinarios] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [ocupadas, setOcupadas] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingData(true);
      try {
        const vets = await clinicApi.list("veterinarios/with-availability");
        const myPets = await clinicApi.list("mascotas/user");
        if (!mounted) return;
        setVeterinarios(Array.isArray(vets) ? vets : []);
        setMascotas(Array.isArray(myPets) ? myPets : []);
        // eslint-disable-next-line no-console
        console.debug("[ModalCrearConsulta] loaded veterinarios count:", Array.isArray(vets) ? vets.length : 0, "mascotas:", Array.isArray(myPets) ? myPets.length : 0);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error loading vets or mascotas:", err);
      } finally {
        if (mounted) setLoadingData(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [open]);

  useEffect(() => {
    // debug whenever selected veterinarian changes
    // eslint-disable-next-line no-console
    console.debug("[ModalCrearConsulta] veterinarioSel changed:", veterinarioSel);
  }, [veterinarioSel]);

  // when veterinarian changes, fetch his consultas to mark occupied slots
  useEffect(() => {
    let mounted = true;
    async function loadConsultas() {
      setOcupadas([]);
      if (!veterinarioSel) return;
      const vetId = veterinarioSel.idVeterinario || veterinarioSel.id || (veterinarioSel.user && veterinarioSel.user.id) || null;
      // eslint-disable-next-line no-console
      console.debug("[ModalCrearConsulta] loadConsultas called, veterinarianSel:", veterinarioSel, "resolved vetId:", vetId);
      if (!vetId) return;
      try {
        const res = await clinicApi.request(`/api/clinic/veterinarios/${vetId}/consultas`, { method: "GET" });
        if (!mounted) return;
        // eslint-disable-next-line no-console
        console.debug("[ModalCrearConsulta] consultas for vet:", res);
        // normalize into objects { id, fecha, hora }
        const arr = Array.isArray(res) ? res : [];
        const taken = arr
          .map((c) => {
            const id = c.idConsulta || c.id || null;
            if (c.fecha && c.hora) return { id, fecha: c.fecha, hora: c.hora };
            if (c.fechaHora) return { id, ...parseFechaHora(c.fechaHora) };
            if (c.start_time) return { id, ...parseFechaHora(c.start_time) };
            if (c.scheduled_at) return { id, ...parseFechaHora(c.scheduled_at) };
            // try full object
            return { id, fecha: c.fecha || null, hora: c.hora || null };
          })
          .filter((x) => x && x.fecha && x.hora);
        setOcupadas(taken);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error loading consultas for vet:", err);
      }
    }
    loadConsultas();
    return () => (mounted = false);
  }, [veterinarioSel]);

  const availableSlotsForDate = useMemo(() => {
    if (!veterinarioSel || !veterinarioSel.work_start || !veterinarioSel.work_end || !fechaSel) return [];
    const start = parseTime(veterinarioSel.work_start) || { hh: 9, mm: 0 };
    const end = parseTime(veterinarioSel.work_end) || { hh: 17, mm: 0 };
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);
    const slots = [];
    for (let m = startMin; m + SLOT_MINUTES <= endMin; m += SLOT_MINUTES) {
      const timeLabel = minutesToTime(m);
      // check if occupied by any consulta that overlaps this slot (each consulta lasts SLOT_MINUTES)
      const occupied = ocupadas.some((o) => {
        if (String(o.fecha) !== String(fechaSel)) return false;
        const parsed = parseTime(o.hora);
        if (!parsed) return false;
        const consultStart = timeToMinutes(parsed);
        const consultEnd = consultStart + SLOT_MINUTES;
        const slotStart = m;
        const slotEnd = m + SLOT_MINUTES;
        // overlap if slotStart < consultEnd && slotEnd > consultStart
        return slotStart < consultEnd && slotEnd > consultStart;
      });
      const futureOk = isFuture(fechaSel, timeLabel);
      slots.push({ time: timeLabel, available: !occupied && futureOk, occupied });
    }
    return slots;
  }, [veterinarioSel, fechaSel, ocupadas]);

  const onSubmit = async (values) => {
    setError("");
    try {
      setSaving(true);
      // build payload expected by backend
      const payload = {
        motivo: values.motivo,
        descripcion: values.descripcion,
        fecha: values.fecha,
        hora: values.hora,
        mascota: values.mascota?.idMascota || values.mascota?.id || values.mascota || null,
        veterinario: values.veterinario?.idVeterinario || values.veterinario?.id || values.veterinario || null,
      };
      if (!isFuture(payload.fecha, payload.hora)) {
        setError("No se puede agendar en fecha/hora pasada. Selecciona una fecha y hora futuras.");
        setSaving(false);
        return;
      }
      // eslint-disable-next-line no-console
      console.log("[ModalCrearConsulta] Crear consulta payload:", payload);
      await clinicApi.request("/api/clinic/consultas", { method: "POST", body: payload });
      onSaved && onSaved();
      onClose && onClose();
      reset();
    } catch (err) {
      setError(err?.message || "Error creando consulta");
    } finally {
      setSaving(false);
    }
  };

  const pickSlot = (slot) => {
    if (!slot.available) return;
    setValue("hora", slot.time);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, p: 0 } }}
    >
      <DialogTitle sx={{ fontWeight: 600, textAlign: "center", pb: 1, fontSize: TITLE_FONT }}>Registrar Consulta</DialogTitle>
      <Divider />

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2 }}>
          {loadingData ? (
            <Grid container justifyContent="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Grid>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="veterinario"
                  control={control}
                  rules={{ required: "Selecciona un veterinario" }}
                  render={({ field }) => (
                    <Autocomplete
                      options={veterinarios}
                      getOptionLabel={(o) => o?.nombre || o?.user?.email || "-"}
                      value={field.value}
                      onChange={(_, v) => {
                        // eslint-disable-next-line no-console
                        console.debug("[ModalCrearConsulta] Autocomplete onChange selected:", v);
                        field.onChange(v);
                      }}
                      isOptionEqualToValue={(option, value) => {
                        if (!option || !value) return false;
                        return (option.idVeterinario && value.idVeterinario && option.idVeterinario === value.idVeterinario) || (option.id && value.id && option.id === value.id);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Veterinario"
                          InputLabelProps={{ shrink: true }}
                          error={!!errors.veterinario}
                          helperText={errors.veterinario?.message}
                          sx={textFieldSx}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="mascota"
                  control={control}
                  rules={{ required: "Selecciona una mascota" }}
                  render={({ field }) => (
                    <Autocomplete
                      options={mascotas}
                      getOptionLabel={(m) => (m ? m?.nombre || m?.nombreMascota || String(m?.id || "") : "")}
                      value={field.value}
                      onChange={(_, v) => field.onChange(v)}
                      isOptionEqualToValue={(option, value) => {
                        if (!option || !value) return false;
                        return (option.idMascota && value.idMascota && option.idMascota === value.idMascota) || (option.id && value.id && option.id === value.id);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Mascota" InputLabelProps={{ shrink: true }} sx={textFieldSx} error={!!errors.mascota} helperText={errors.mascota?.message} />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Fecha"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  {...register("fecha", { required: "Selecciona fecha" })}
                  error={!!errors.fecha}
                  sx={textFieldSx}
                />
                {veterinarioSel?.work_days && (
                  <Typography variant="caption" color="text.secondary">
                    Días de trabajo: {String(veterinarioSel.work_days)} — Horario: {veterinarioSel.work_start || "--"} a {veterinarioSel.work_end || "--"}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography fontSize="0.95rem" fontWeight={600} mb={1}>
                  Horarios disponibles
                </Typography>

                <Grid container spacing={1}>
                  {availableSlotsForDate.length === 0 ? (
                    <Grid item xs={12}>
                      <Typography color="text.secondary">
                        Selecciona veterinario y fecha para ver los horarios
                      </Typography>
                    </Grid>
                  ) : (
                    availableSlotsForDate.map((s) => (
                      <Grid item key={s.time}>
                        <Button
                          variant={s.time === horaSel ? "contained" : "outlined"}
                          color={
                            s.available
                              ? "primary"
                              : s.occupied
                              ? "error"
                              : "inherit"
                          }
                          onClick={() => pickSlot(s)}
                          disabled={!s.available}
                          sx={{
                            minWidth: 84,
                            height: 40,
                            textTransform: "none",
                            fontWeight: 600,
                            color:
                              s.time === horaSel
                                ? "common.white"
                                : s.available
                                ? "text.primary"
                                : "grey.700",
                            borderColor: s.occupied ? "grey.300" : undefined,
                          }}
                        >
                          {formatSlotLabel(s.time)}
                        </Button>
                      </Grid>
                    ))
                  )}
                </Grid>
              </Grid>


              <Grid item xs={12}>
                <TextField label="Hora seleccionada" fullWidth value={horaSel || ""} InputProps={{ readOnly: true }} sx={textFieldSx} />
              </Grid>

              <Grid item xs={12}>
                <TextField label="Motivo" fullWidth {...register("motivo", { required: "El motivo es requerido" })} error={!!errors.motivo} sx={textFieldSx} />
              </Grid>

              <Grid item xs={12}>
                <TextField label="Descripción" fullWidth multiline rows={3} {...register("descripcion")} sx={textFieldSx} />
              </Grid>

              {error && (
                <Grid item xs={12}>
                  <Typography color="error">{error}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2, justifyContent: "flex-end", gap: 1 }}>
          <SuiButton variant="outlined" buttonColor="secondary" onClick={onClose} disabled={saving} sx={{ minWidth: 120, height: 44 }}>
            Cancelar
          </SuiButton>
          <SuiButton variant="gradient" buttonColor="dark" type="submit" disabled={saving} sx={{ minWidth: 120, height: 44 }}>
            {saving ? "Guardando..." : "Crear"}
          </SuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
