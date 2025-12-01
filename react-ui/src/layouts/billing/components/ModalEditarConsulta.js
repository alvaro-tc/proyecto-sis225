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

const SLOT_MINUTES = 30;

function parseTime(t) {
  if (!t) return null;
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

export default function ModalEditarConsulta({ open, onClose, consultaId, onSaved }) {
  const LABEL_FONT = "1.25rem";
  const INPUT_FONT = "1.05rem";
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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [veterinarios, setVeterinarios] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [ocupadas, setOcupadas] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadLists() {
      setLoading(true);
      try {
        const vets = await clinicApi.list("veterinarios/with-availability");
        const myPets = await clinicApi.list("mascotas/user");
        if (!mounted) return;
        setVeterinarios(Array.isArray(vets) ? vets : []);
        setMascotas(Array.isArray(myPets) ? myPets : []);
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (open) loadLists();
    return () => (mounted = false);
  }, [open]);

  // load consulta details
  useEffect(() => {
    if (!open || !consultaId) return;
    let mounted = true;
    setLoading(true);
    clinicApi
      .request(`/api/clinic/consultas/${consultaId}`, { method: "GET" })
      .then((data) => {
        if (!mounted) return;
        // try to set mascota/veterinario objects if lists already loaded
        const petObj = (data.mascota && typeof data.mascota === "object") ? data.mascota : null;
        const vetObj = (data.veterinario && typeof data.veterinario === "object") ? data.veterinario : null;
        reset({ motivo: data.motivo || "", descripcion: data.descripcion || "", fecha: data.fecha || "", mascota: petObj, veterinario: vetObj, hora: data.hora || "" });
      })
      .catch(() => setError("Error cargando consulta"))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [open, consultaId, reset]);

  // when veterinarian changes, fetch his consultas to mark occupied slots
  useEffect(() => {
    let mounted = true;
    async function loadConsultas() {
      setOcupadas([]);
      if (!veterinarioSel) return;
      const vetId = veterinarioSel.idVeterinario || veterinarioSel.id || (veterinarioSel.user && veterinarioSel.user.id) || null;
      // eslint-disable-next-line no-console
      console.debug("[ModalEditarConsulta] loadConsultas called, veterinarianSel:", veterinarioSel, "resolved vetId:", vetId);
      if (!vetId) return;
      try {
        const res = await clinicApi.request(`/api/clinic/veterinarios/${vetId}/consultas`, { method: "GET" });
        if (!mounted) return;
        // eslint-disable-next-line no-console
        console.debug("[ModalEditarConsulta] consultas for vet:", res);
        const taken = (Array.isArray(res) ? res : []).map((c) => ({ id: c.idConsulta || c.id, fecha: c.fecha, hora: c.hora }));
        setOcupadas(taken);
      } catch (err) {
        // ignore
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
      const occupied = ocupadas.some((o) => {
        if (String(o.fecha) !== String(fechaSel)) return false;
        const parsed = parseTime(o.hora);
        if (!parsed) return false;
        const consultStart = timeToMinutes(parsed);
        const consultEnd = consultStart + SLOT_MINUTES;
        const slotStart = m;
        const slotEnd = m + SLOT_MINUTES;
        // if this is the consulta being edited, ignore it (allow keeping same slot)
        if (o.id && consultaId && String(o.id) === String(consultaId)) return false;
        return slotStart < consultEnd && slotEnd > consultStart;
      });
      slots.push({ time: timeLabel, available: !occupied, occupied });
    }
    return slots;
  }, [veterinarioSel, fechaSel, ocupadas, consultaId]);

  function isFuture(fecha, hora) {
    if (!fecha) return false;
    const dateStr = `${fecha}T${hora || "00:00"}:00`;
    const d = new Date(dateStr);
    return d.getTime() > Date.now();
  }

  const onSubmit = async (values) => {
    setError("");
    // values.mascota and values.veterinario may be objects
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
      return;
    }

    try {
      setSaving(true);
      await clinicApi.request(`/api/clinic/consultas/${consultaId}`, { method: "PUT", body: payload });
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      setError(err?.message || "Error actualizando consulta");
    } finally {
      setSaving(false);
    }
  };

  const pickSlot = (slot) => {
    if (!slot.available) return;
    setValue("hora", slot.time);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, p: 0 } }}>
      <DialogTitle sx={{ textAlign: "center", fontWeight: 700 }}>Editar consulta</DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2 }}>
          {loading ? (
            <Grid container justifyContent="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Grid>
          ) : (
            <Grid container spacing={1}>
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
                        <TextField {...params} label="Veterinario" InputLabelProps={{ shrink: true }} sx={textFieldSx} error={!!errors.veterinario} helperText={errors.veterinario?.message} />
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
                <TextField label="Fecha" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register("fecha", { required: "Selecciona fecha" })} error={!!errors.fecha} sx={textFieldSx} />
                <Typography variant="caption" color="text.secondary">Seleccione una fecha futura</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography fontSize="0.95rem" fontWeight={600} mb={1}>Horarios disponibles</Typography>
                <Grid container spacing={1}>
                  {availableSlotsForDate.length === 0 ? (
                    <Grid item xs={12}><Typography color="text.secondary">Selecciona veterinario y fecha para ver los horarios</Typography></Grid>
                  ) : (
                    availableSlotsForDate.map((s) => (
                      <Grid item key={s.time}>
                        <Button
                          variant={s.time === horaSel ? "contained" : "outlined"}
                          color={s.available ? "primary" : (s.occupied ? "error" : "inherit")}
                          onClick={() => pickSlot(s)}
                          disabled={!s.available}
                          sx={{
                            minWidth: 84,
                            height: 40,
                            textTransform: "none",
                            fontWeight: 600,
                            color: s.time === horaSel ? 'common.white' : (s.available ? 'text.primary' : 'grey.700'),
                            borderColor: s.occupied ? 'grey.300' : undefined,
                          }}
                        >
                          {s.time}
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
                <Grid item xs={12}><Typography color="error">{error}</Typography></Grid>
              )}
            </Grid>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2, justifyContent: "flex-end", gap: 1 }}>
          <SuiButton variant="outlined" buttonColor="secondary" onClick={onClose} disabled={saving} sx={{ minWidth: 120, height: 44 }}>Cancelar</SuiButton>
          <SuiButton variant="gradient" buttonColor="dark" type="submit" disabled={saving} sx={{ minWidth: 120, height: 44 }}>{saving ? "Guardando..." : "Guardar"}</SuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
