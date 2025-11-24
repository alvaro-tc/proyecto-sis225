import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
} from "@mui/material";
import SuiButton from "components/SuiButton";
import clinicApi from "api/clinic";

export default function ModalCrearConsulta({ open, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { motivo: "", descripcion: "", fecha: "", mascota: "" } });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (values) => {
    setError("");
    try {
      setSaving(true);
      await clinicApi.request("/api/clinic/consultas", { method: "POST", body: values });
      onSaved && onSaved();
      onClose && onClose();
      reset();
    } catch (err) {
      setError(err?.message || "Error creando consulta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Agregar consulta</DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
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
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <SuiButton variant="outlined" buttonColor="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </SuiButton>
          <SuiButton variant="gradient" buttonColor="dark" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear"}
          </SuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
