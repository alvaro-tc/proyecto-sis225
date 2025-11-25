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

  const asistio = watch("asistio");
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ textAlign: "center", fontWeight: 700 }}>Anotar / Registrar Consulta</DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2 }}>
          {loading ? (
            <Grid container justifyContent="center" sx={{ py: 6 }}>
              <Typography>Cargando...</Typography>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Motivo" fullWidth {...register("motivo", { required: true, maxLength: 255 })} InputProps={{ readOnly: true }} />
              </Grid>

              <Grid item xs={12}>
                <TextField label="Descripción" fullWidth multiline rows={2} {...register("descripcion")} InputProps={{ readOnly: true }} />
              </Grid>

              <Grid item xs={6}>
                <TextField label="Fecha" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register("fecha")} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Hora" type="time" fullWidth InputLabelProps={{ shrink: true }} {...register("hora")} InputProps={{ readOnly: true }} />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel control={<Controller name="asistio" control={control} render={({ field }) => <Switch {...field} checked={!!field.value} />} />} label="Asistió" />
              </Grid>

              <Grid item xs={12}>
                <TextField label="Síntomas" fullWidth multiline rows={2} {...register("sintomas")} disabled={!asistio} />
              </Grid>

              <Grid item xs={12}>
                <TextField label="Diagnóstico" fullWidth multiline rows={2} {...register("diagnostico")} disabled={!asistio} />
              </Grid>

              <Grid item xs={12}>
                <TextField label="Tratamiento" fullWidth multiline rows={2} {...register("tratamiento")} disabled={!asistio} />
              </Grid>

              <Grid item xs={12}>
                <TextField label="Notas" fullWidth multiline rows={2} {...register("notas")} disabled={!asistio} />
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
          <SuiButton variant="outlined" buttonColor="secondary" onClick={onClose} disabled={saving}>Cancelar</SuiButton>
          <SuiButton variant="gradient" buttonColor="dark" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</SuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
