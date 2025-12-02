import React, { useEffect, useState } from "react";
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

export default function ModalDueno({ open, onClose, onSave, initialData, id }) {
  const LABEL_FONT = "1.1rem";
  const INPUT_FONT = "1rem";
  const TITLE_FONT = "1.25rem";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { nombre: "", telefono: "" },
  });

  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;
    let mounted = true;

    async function fetchData() {
      if (initialData) {
        reset({ nombre: initialData.nombre || "", telefono: initialData.telefono || "" });
        return;
      }
      if (!id) {
        reset({ nombre: "", telefono: "" });
        return;
      }
      try {
        const data = await clinicApi.retrieve("duenos", id);
        if (!mounted) return;
        reset({ nombre: data.nombre || "", telefono: data.telefono || "" });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching dueno:", err);
        if (mounted) reset({ nombre: "", telefono: "" });
      }
    }

    fetchData();
    return () => (mounted = false);
  }, [initialData, id, open, reset]);

  const submit = async (data) => {
    setSubmitError("");
    try {
      await onSave?.(data);
      reset();
      onClose?.();
    } catch (err) {
      setSubmitError(err?.message || "Error al guardar");
    }
  };

  const textFieldSx = {
    "& .MuiInputLabel-root": { fontSize: LABEL_FONT, fontWeight: 400 },
    "& .MuiFormHelperText-root": { fontSize: "1rem" },
    "& .MuiOutlinedInput-root": { minHeight: 48 },
    "& .MuiInputBase-input": { fontSize: INPUT_FONT, padding: "12px 12px" },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, p: 0 } }}
    >
      <DialogTitle sx={{ fontWeight: 600, textAlign: "center", pb: 1, fontSize: TITLE_FONT }}>
        Registrar Dueño
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(submit)}>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography
                sx={{ fontSize: "1.05rem", fontWeight: 400, display: "block", marginBottom: "6px" }}
              >
                Nombre
              </Typography>
              <TextField
                placeholder="Nombre"
                fullWidth
                size="small"
                {...register("nombre", {
                  maxLength: { value: 255, message: "Máximo 255 caracteres" },
                })}
                sx={textFieldSx}
                error={!!errors?.nombre}
                helperText={errors?.nombre?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography
                sx={{ fontSize: "1.05rem", fontWeight: 400, display: "block", marginBottom: "6px" }}
              >
                Teléfono
              </Typography>
              <TextField
                placeholder="Teléfono"
                fullWidth
                size="small"
                {...register("telefono", {
                  maxLength: { value: 50, message: "Máximo 50 caracteres" },
                })}
                sx={textFieldSx}
                error={!!errors?.telefono}
                helperText={errors?.telefono?.message}
              />
            </Grid>

            {submitError && (
              <Grid item xs={12}>
                <Typography color="error">{submitError}</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ p: 2, justifyContent: "flex-end", gap: 1 }}>
          <SuiButton variant="outlined" buttonColor="secondary" onClick={onClose}>
            Cancelar
          </SuiButton>
          <SuiButton variant="gradient" buttonColor="dark" type="submit">
            Guardar
          </SuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
