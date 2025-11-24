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

export default function ModalEditarPerfil({ open, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { nombre: "", telefono: "" } });

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    // Use the configured API_BASE by requesting the relative path
    clinicApi
      .request("/api/users/me", { method: "GET" })
      .then((data) => {
        if (!mounted) return;
        reset({ nombre: data.nombre || data.name || "", telefono: data.telefono || data.phone || "" });
      })
      .catch((err) => {
        console.error("Error loading perfil from /api/users/me:", err);
        if (mounted) setSubmitError("Error cargando datos del usuario");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, reset]);

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      setSaving(true);
      await clinicApi.request("/api/users/me", {
        method: "PUT",
        body: { nombre: values.nombre || null, telefono: values.telefono || null },
      });
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      console.error("Error saving perfil:", err);
      setSubmitError(err?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar perfil</DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {loading ? (
            <Grid container justifyContent="center" alignItems="center" style={{ minHeight: 120 }}>
              <CircularProgress />
            </Grid>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Nombre completo"
                  fullWidth
                  {...register("nombre", { maxLength: 255 })}
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ style: { fontSize: 16 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Teléfono"
                  fullWidth
                  {...register("telefono", { maxLength: 50 })}
                  error={!!errors.telefono}
                  helperText={errors.telefono?.message}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ style: { fontSize: 16 } }}
                />
              </Grid>
              {submitError && (
                <Grid item xs={12}>
                  <div style={{ color: "#f44336" }}>{submitError}</div>
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
