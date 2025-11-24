import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

import clinicApi from "api/clinic";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  Divider,
} from "@mui/material";
import SuiButton from "components/SuiButton";

export default function ModalEditarRecepcionista({ open, onClose, onSave, initialData, id }) {
  const LABEL_FONT = "1.25rem";
  const INPUT_FONT = "1.05rem";
  const TITLE_FONT = "1.25rem";

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      email: "",
      password: "",
      telefono: "",
      nombre: "",
    },
  });

  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    async function fetchData() {
      if (initialData) {
        reset({
          email: initialData.email || initialData.user?.email || "",
          password: "",
          telefono:
            initialData.telefono || initialData.phone || initialData.telefono_movil || initialData.user?.telefono || initialData.user?.phone || initialData.user?.telefono_movil || "",
          nombre: initialData.nombre || initialData.user?.nombre || "",
        });
        return;
      }

      if (!id) {
        reset({ email: "", password: "", telefono: "", nombre: "" });
        return;
      }

      try {
        const data = await clinicApi.retrieve("recepcionistas", id);
        // eslint-disable-next-line no-console
        console.debug("Fetched recepcionista:", data);
        if (!mounted) return;
        const telefonoVal = data.telefono || data.phone || data.telefono_movil || data.user?.telefono || data.user?.phone || data.user?.telefono_movil || "";
        reset({
          email: data.email || data.user?.email || "",
          password: "",
          telefono: telefonoVal,
          nombre: data.nombre || data.user?.nombre || "",
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching recepcionista in modal:", err);
        if (mounted) reset({ email: "", password: "", telefono: "", nombre: "" });
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [initialData, id, open, reset]);

  const submit = async (data) => {
    setSubmitError("");
    try {
      await onSave?.(data);
      onClose?.();
    } catch (err) {
      setSubmitError(err?.message || "Error al actualizar");
    }
  };

  const textFieldSx = {
    "& .MuiInputLabel-root": { fontSize: LABEL_FONT },
    "& .MuiFormHelperText-root": { fontSize: "1.2rem" },
    "& .MuiOutlinedInput-root": { minHeight: 52 },
    "& .MuiInputBase-input": { fontSize: INPUT_FONT, padding: "16px 14px" },
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3, p: 0 } }}>
      <DialogTitle sx={{ fontWeight: 600, textAlign: "center", pb: 1, fontSize: TITLE_FONT }}>
        Editar Recepcionista
      </DialogTitle>

      <Divider />

      <form onSubmit={handleSubmit(submit)}>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                size="small"
                type="email"
                {...register("email", { required: "El email es obligatorio", maxLength: { value: 255, message: "Máximo 255 caracteres" } })}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={textFieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField label="Password (dejar vacío para no cambiar)" fullWidth size="small" type="password" {...register("password")} sx={textFieldSx} InputLabelProps={{ shrink: true }} />
            </Grid>

            <Grid item xs={12}>
              <TextField label="Teléfono" fullWidth size="small" {...register("telefono", { maxLength: { value: 50, message: "Máximo 50 caracteres" } })} sx={textFieldSx} InputLabelProps={{ shrink: true }} />
            </Grid>

            <Grid item xs={12}>
              <TextField label="Nombre" fullWidth size="small" {...register("nombre", { maxLength: { value: 255, message: "Máximo 255 caracteres" } })} sx={textFieldSx} InputLabelProps={{ shrink: true }} />
            </Grid>

            {submitError && (
              <Grid item xs={12}>
                <Typography color="error" fontSize="0.88rem">
                  {submitError}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2, justifyContent: "flex-end", gap: 1 }}>
          <SuiButton variant="outlined" buttonColor="secondary" onClick={onClose} sx={{ fontSize: INPUT_FONT, textTransform: "none", px: 3, minWidth: 120, height: 44 }}>
            Cancelar
          </SuiButton>
          <SuiButton variant="gradient" buttonColor="dark" type="submit" sx={{ fontSize: INPUT_FONT, textTransform: "none", px: 3, minWidth: 120, height: 44 }}>
            Guardar
          </SuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
