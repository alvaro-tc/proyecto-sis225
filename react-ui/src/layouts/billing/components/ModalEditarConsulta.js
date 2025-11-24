import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  CircularProgress,
} from "@mui/material";
import SuiButton from "components/SuiButton";
import clinicApi from "api/clinic";

export default function ModalEditarConsulta({ open, onClose, consultaId, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { motivo: "", descripcion: "", fecha: "", mascota: "" } });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !consultaId) return;
    let mounted = true;
    setLoading(true);
    clinicApi
      .request(`/api/clinic/consultas/${consultaId}`, { method: "GET" })
      .then((data) => {
        if (!mounted) return;
        reset({ motivo: data.motivo || "", descripcion: data.descripcion || "", fecha: data.fecha || "", mascota: data.mascota?.id || (data.mascota || "") });
      })
      .catch((err) => setError("Error cargando consulta"))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, consultaId, reset]);

  const onSubmit = async (values) => {
    setError("");
    try {
      setSaving(true);
      await clinicApi.request(`/api/clinic/consultas/${consultaId}`, { method: "PUT", body: values });
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      setError(err?.message || "Error actualizando consulta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar consulta</DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {loading ? (
            <Grid container justifyContent="center" alignItems="center" style={{ minHeight: 120 }}>
              <CircularProgress />
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Motivo" fullWidth {...register("motivo", { required: true, maxLength: 255 })} error={!!errors.motivo} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Descripción" fullWidth multiline rows={3} {...register("descripcion")} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Fecha" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register("fecha", { required: true })} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="ID Mascota" fullWidth {...register("mascota", { required: true })} helperText="Introduce el id de la mascota" />
              </Grid>
              {error && (
                <Grid item xs={12}>
                  <div style={{ color: "#f44336" }}>{error}</div>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <SuiButton variant="outlined" buttonColor="secondary" onClick={onClose} disabled={saving || loading}>
            Cancelar
          </SuiButton>
          <SuiButton variant="gradient" buttonColor="dark" type="submit" disabled={saving || loading}>
            {saving ? "Guardando..." : "Guardar"}
          </SuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
