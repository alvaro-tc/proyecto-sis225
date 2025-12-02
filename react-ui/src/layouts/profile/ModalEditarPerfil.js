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
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { nombre: "", telefono: "", email: "", password: "" } });

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [userObj, setUserObj] = useState(null);
  const [roleResource, setRoleResource] = useState({ name: null, data: null });

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    setSubmitError("");
    setRoleResource({ name: null, data: null });

    async function load() {
      try {
        const u = await clinicApi.request("/api/users/me", { method: "GET" });
        if (!mounted) return;
        setUserObj(u);
        // try role-specific endpoints in order and pick the first that works
        const tryEndpoints = [
          { name: "dueno", path: "/api/clinic/duenos/me" },
          { name: "veterinario", path: "/api/clinic/veterinarios/me" },
          { name: "recepcionista", path: "/api/clinic/recepcionistas/me" },
        ];
        let found = null;
        for (const ep of tryEndpoints) {
          try {
            // eslint-disable-next-line no-console
            console.debug("Trying role endpoint:", ep.path);
            const d = await clinicApi.request(ep.path, { method: "GET" });
            if (!mounted) return;
            if (d) {
              found = { name: ep.name, data: d, path: ep.path };
              break;
            }
          } catch (e) {
            // ignore and try next
          }
        }

        // prepare form values using the best available source
        const source = found?.data || u;
        reset({
          nombre: source.nombre || source.name || u.nombre || u.name || "",
          telefono: source.telefono || source.phone || u.telefono || u.phone || "",
          email: u.email || u.user?.email || source.email || source.user?.email || "",
          password: "",
        });

        if (found) setRoleResource({ name: found.name, data: found.data });
      } catch (err) {
        console.error("Error loading perfil from /api/users/me or role endpoint:", err);
        if (mounted) setSubmitError("Error cargando datos del usuario");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [open, reset]);

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      setSaving(true);
      const payload = { nombre: values.nombre || null, telefono: values.telefono || null };
      if (values.email) payload.email = values.email;
      if (values.password) payload.password = values.password;

      // choose endpoint based on discovered roleResource, fallback to /api/users/me
      let endpoint = "/api/users/me";
      if (roleResource.name === "dueno") endpoint = "/api/clinic/duenos/me";
      else if (roleResource.name === "veterinario") endpoint = "/api/clinic/veterinarios/me";
      else if (roleResource.name === "recepcionista") endpoint = "/api/clinic/recepcionistas/me";

      // eslint-disable-next-line no-console
      console.debug("Submitting profile update to:", endpoint, "payload:", payload);

      await clinicApi.request(endpoint, {
        method: "PUT",
        body: payload,
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
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <TextField
                  label="Nombre completo"
                  fullWidth
                  {...register("nombre", { maxLength: 255 })}
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiInputLabel-root": { fontSize: "1.05rem", fontWeight: 400 },
                    "& .MuiOutlinedInput-root": { minHeight: 48 },
                    "& .MuiInputBase-input": { fontSize: 16 },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  {...register("email", { required: false, maxLength: 255 })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiInputLabel-root": { fontSize: "1.05rem", fontWeight: 400 },
                    "& .MuiOutlinedInput-root": { minHeight: 48 },
                    "& .MuiInputBase-input": { fontSize: 16 },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Password (dejar vacío para no cambiar)"
                  fullWidth
                  type="password"
                  {...register("password", {
                    minLength: { value: 6, message: "Mínimo 6 caracteres" },
                  })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiInputLabel-root": { fontSize: "1.05rem", fontWeight: 400 },
                    "& .MuiOutlinedInput-root": { minHeight: 48 },
                    "& .MuiInputBase-input": { fontSize: 16 },
                  }}
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
                  sx={{
                    "& .MuiInputLabel-root": { fontSize: "1.05rem", fontWeight: 400 },
                    "& .MuiOutlinedInput-root": { minHeight: 48 },
                    "& .MuiInputBase-input": { fontSize: 16 },
                  }}
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
          <SuiButton
            variant="outlined"
            buttonColor="secondary"
            onClick={onClose}
            disabled={saving || loading}
          >
            Cancelar
          </SuiButton>
          <SuiButton
            variant="gradient"
            buttonColor="dark"
            type="submit"
            disabled={saving || loading}
          >
            {saving ? "Guardando..." : "Guardar"}
          </SuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
