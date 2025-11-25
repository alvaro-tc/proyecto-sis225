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

  // when veterinarian changes, fetch his consultas to mark occupied slots
  useEffect(() => {
    let mounted = true;
    async function loadConsultas() {
      setOcupadas([]);
      if (!veterinarioSel || !veterinarioSel.idVeterinario) return;
      try {
        const res = await clinicApi.request(`/api/clinic/veterinarios/${veterinarioSel.idVeterinario}/consultas`, { method: "GET" });
        if (!mounted) return;
        // normalize: try to extract fecha+hora from each consulta
        const taken = (Array.isArray(res) ? res : []).map((c) => {
          // possible shapes: { fecha: '2023-11-01', hora: '09:30' } or { fechaHora: '2023-11-01T09:30:00Z' }
          if (c.fecha && c.hora) return `${c.fecha} ${c.hora}`;
          if (c.fechaHora) return c.fechaHora;
          // try known fields
          if (c.start_time) return c.start_time;
          if (c.scheduled_at) return c.scheduled_at;
          return null;
        }).filter(Boolean);
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
      // check if occupied
      const datetimeIso = `${fechaSel} ${timeLabel}`;
      const occupied = ocupadas.some((o) => String(o).indexOf(`${fechaSel}`) !== -1 && String(o).indexOf(timeLabel) !== -1);
      slots.push({ time: timeLabel, available: !occupied });
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
                      onChange={(_, v) => field.onChange(v)}
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
                      <Typography color="text.secondary">Selecciona veterinario y fecha para ver los horarios</Typography>
                    </Grid>
                  ) : (
                    availableSlotsForDate.map((s) => (
                      <Grid item key={s.time}>
                        <Button
                          variant={s.time === horaSel ? "contained" : "outlined"}
                          color={s.available ? "primary" : "inherit"}
                          onClick={() => pickSlot(s)}
                          disabled={!s.available}
                          sx={{ minWidth: 84, height: 40, textTransform: "none" }}
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
