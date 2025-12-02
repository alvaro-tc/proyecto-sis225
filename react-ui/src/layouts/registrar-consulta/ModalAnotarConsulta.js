import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
} from "@mui/material";
import SuiButton from "components/SuiButton";
import clinicApi from "api/clinic";

export default function ModalAnotarConsulta({ open, onClose, consultaId, onSaved }) {
  const { register, handleSubmit, control, reset, watch, setValue } = useForm({
    defaultValues: {
      motivo: "",
      descripcion: "",
      fecha: "",
      hora: "",
      sintomas: "",
      diagnostico: "",
      tratamiento: "",
      notas: "",
      asistio: false,
      veterinario: null,
      dueno: null,
      mascota_id: null,
    },
  });

  const LABEL_FONT = "1rem";
  const INPUT_FONT = "1.05rem";
  const DISPLAY_FONT = "0.9rem";
  const TITLE_FONT = "1.25rem";

  const textFieldSx = {
    "& .MuiInputLabel-root": { fontSize: LABEL_FONT },
    "& .MuiFormHelperText-root": { fontSize: "1.1rem" },
    "& .MuiOutlinedInput-root": { minHeight: 52 },
    "& .MuiInputBase-input": { fontSize: INPUT_FONT, padding: "14px 12px" },
  };

  const asistio = watch("asistio");
  const motivoVal = watch("motivo");
  const descripcionVal = watch("descripcion");
  const fechaVal = watch("fecha");
  const horaVal = watch("hora");

  function formatFechaHora(fecha, hora) {
    if (!fecha) return "-";
    try {
      const weekdays = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
      const months = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ];
      const parts = String(fecha).split("-");
      if (parts.length !== 3) return `${fecha}${hora ? ' a hrs ' + hora : ''}`;
      const [y, m, d] = parts;
      const day = Number(d);
      const monthIndex = Number(m) - 1;
      const monthName = months[monthIndex] || m;
      // construct date without timezone shifts
      const dt = new Date(Number(y), monthIndex, day);
      const weekday = weekdays[dt.getDay()] || "";
      const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      return `${weekdayCap} ${day} de ${monthName} ${y}${hora ? ' a hrs ' + hora : ''}`;
    } catch (e) {
      return `${fecha}${hora ? ' a hrs ' + hora : ''}`;
    }
  }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!open || !consultaId) return;
      setLoading(true);
      try {
        const data = await clinicApi.request(`/api/clinic/consultas/${consultaId}`, { method: "GET" });
        if (!mounted) return;
        // Map response to form fields
        const mascotaId = data.mascota && (data.mascota.idMascota || data.mascota.id || data.mascota.mascota_id) || data.mascota_id || null;
        const veterinarioId = data.veterinario && (data.veterinario.idVeterinario || data.veterinario.id) || data.veterinario || null;
        const duenoId = data.dueno && (data.dueno.idDueno || data.dueno.id) || data.dueno || null;
        setValue("motivo", data.motivo || data.descripcion || "");
        setValue("descripcion", data.descripcion || "");
        setValue("fecha", data.fecha || (data.fechaHora ? String(data.fechaHora).split("T")[0] : ""));
        setValue("hora", data.hora || (data.fechaHora ? (String(data.fechaHora).split("T")[1] || "").slice(0,5) : ""));
        setValue("sintomas", data.sintomas || "");
        setValue("diagnostico", data.diagnostico || "");
        setValue("tratamiento", data.tratamiento || "");
        setValue("notas", data.notas || "");
        setValue("asistio", !!data.asistio);
        setValue("veterinario", veterinarioId);
        setValue("dueno", duenoId);
        setValue("mascota_id", mascotaId);
      } catch (err) {
        console.error("Error loading consulta:", err);
        setError("Error cargando la consulta");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [open, consultaId, setValue]);

  const onSubmit = async (values) => {
    setError("");
    const payload = {
      motivo: values.motivo?.slice(0, 255) || "",
      descripcion: values.descripcion || null,
      fecha: values.fecha || null,
      hora: values.hora || null,
      sintomas: values.asistio ? (values.sintomas || null) : null,
      diagnostico: values.asistio ? (values.diagnostico || null) : null,
      tratamiento: values.asistio ? (values.tratamiento || null) : null,
      notas: values.asistio ? (values.notas || null) : null,
      asistio: !!values.asistio,
      veterinario: values.veterinario || null,
      dueno: values.dueno || null,
      mascota_id: values.mascota_id || null,
    };

    try {
      setSaving(true);
      // Partial update via PATCH
      await clinicApi.request(`/api/clinic/consultas/${consultaId}`, { method: "PATCH", body: payload });
      onSaved && onSaved();
    } catch (err) {
      console.error("Error updating consulta:", err);
      setError(err?.body?._raw || err?.message || "Error guardando la anotación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, p: 0 } }}>
      <DialogTitle sx={{ fontWeight: 600, textAlign: "center", pb: 1, fontSize: TITLE_FONT }}>Anotar / Registrar Consulta</DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2 }}>
          {loading ? (
            <Grid container justifyContent="center" sx={{ py: 6 }}>
              <Typography>Cargando...</Typography>
            </Grid>
          ) : (
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography sx={{ fontSize: INPUT_FONT, color: "text.primary", mb: 0.5 }}>{formatFechaHora(fechaVal, horaVal)}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ fontSize: INPUT_FONT, color: "text.primary", mb: 0.5 }}>
                  <Box component="span" sx={{ fontSize: LABEL_FONT, fontWeight: 600, mr: 0.5 }}>Motivo:</Box>
                  <Box component="span" sx={{ fontSize: DISPLAY_FONT, color: "text.primary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{motivoVal || "-"}</Box>
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ fontSize: INPUT_FONT, color: "text.primary", mb: 0.5 }}>
                  <Box component="span" sx={{ fontSize: LABEL_FONT, fontWeight: 600, mr: 0.5 }}>Descripción:</Box>
                  <Box component="span" sx={{ fontSize: DISPLAY_FONT, color: "text.primary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{descripcionVal || "-"}</Box>
                </Typography>
              </Grid>

              <Grid item xs={12} container justifyContent="flex-start" alignItems="center">
                <FormControlLabel sx={{ ml: 0 }} control={<Controller name="asistio" control={control} render={({ field }) => <Switch {...field} checked={!!field.value} />} />} label="Asistió" />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ fontSize: LABEL_FONT, mb: 0.5 }}>Síntomas</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={1}
                  {...register("sintomas")}
                  sx={{
                    ...textFieldSx,
                    "& .MuiOutlinedInput-root": { minHeight: 40 },
                    "& .MuiInputBase-input": { padding: "8px 10px", fontSize: INPUT_FONT },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ fontSize: LABEL_FONT, mb: 0.5 }}>Diagnóstico</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={1}
                  {...register("diagnostico")}
                  sx={{
                    ...textFieldSx,
                    "& .MuiOutlinedInput-root": { minHeight: 40 },
                    "& .MuiInputBase-input": { padding: "8px 10px", fontSize: INPUT_FONT },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ fontSize: LABEL_FONT, mb: 0.5 }}>Tratamiento</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={1}
                  {...register("tratamiento")}
                  sx={{
                    ...textFieldSx,
                    "& .MuiOutlinedInput-root": { minHeight: 40 },
                    "& .MuiInputBase-input": { padding: "8px 10px", fontSize: INPUT_FONT },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ fontSize: LABEL_FONT, mb: 0.5 }}>Notas</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  {...register("notas")}
                  sx={{
                    ...textFieldSx,
                    "& .MuiOutlinedInput-root": { minHeight: 120 },
                    "& .MuiInputBase-input": { padding: "12px 12px", fontSize: INPUT_FONT },
                  }}
                />
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
          <SuiButton variant="outlined" buttonColor="secondary" onClick={onClose} disabled={saving} sx={{ minWidth: 120, height: 44 }}>Cancelar</SuiButton>
          <SuiButton variant="gradient" buttonColor="dark" type="submit" disabled={saving} sx={{ minWidth: 120, height: 44 }}>{saving ? "Guardando..." : "Guardar"}</SuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
