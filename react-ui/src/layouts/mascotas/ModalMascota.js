import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  Grid,
  Typography,
  Divider,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SuiButton from "components/SuiButton";

const ESPECIES = ["Perro", "Gato", "Loro", "Otro"];

export default function ModalMascota({ open, onClose, onSave }) {
  // Tipografías: ajusta aquí si quieres otro tamaño global
  const LABEL_FONT = "1.25rem"; // label / helper text
  const INPUT_FONT = "1.05rem"; // texto dentro del input
  const TITLE_FONT = "1.25rem";

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: "",
      especieSel: "Perro",
      especieOtro: "",
      raza: "",
      edad: "",
    },
  });

  const especieSel = watch("especieSel");
  const [submitError, setSubmitError] = useState("");
  // controla apertura del autocomplete para que se abra al click en cualquier parte
  const [speciesOpen, setSpeciesOpen] = useState(false);

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

  // common sx para TextField
  const textFieldSx = {
    "& .MuiInputLabel-root": { fontSize: LABEL_FONT },
    "& .MuiFormHelperText-root": { fontSize: "1.2rem" },
    // inputs más grandes y con padding uniforme
    "& .MuiOutlinedInput-root": { minHeight: 52 },
    "& .MuiInputBase-input": { fontSize: INPUT_FONT, padding: "16px 14px" },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 0,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 600,
          textAlign: "center",
          pb: 1,
          fontSize: TITLE_FONT,
        }}
      >
        Registrar Mascota
      </DialogTitle>

      <Divider />

      <form onSubmit={handleSubmit(submit)}>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Nombre */}
            <Grid item xs={12}>
              <TextField
                label="Nombre"
                fullWidth
                size="small"
                {...register("nombre", { required: "El nombre es obligatorio" })}
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
                sx={textFieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Autocomplete de especie */}
            <Grid item xs={12}>
              <Controller
                name="especieSel"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={ESPECIES}
                    size="small"
                    value={field.value}
                    onChange={(_, value) => field.onChange(value ?? "")}
                    open={speciesOpen}
                    onOpen={() => setSpeciesOpen(true)}
                    onClose={() => setSpeciesOpen(false)}
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Especie"
                        InputLabelProps={{ shrink: true }}
                        // evita que el usuario escriba; solo selección desde la lista
                        inputProps={{ ...params.inputProps, readOnly: true }}
                        onClick={() => setSpeciesOpen(true)}
                        sx={{
                          // mantener la apariencia general pero reducir altura específica
                          ...textFieldSx,
                          "& .MuiOutlinedInput-root": { minHeight: 54 },
                          "& .MuiInputBase-input": { fontSize: INPUT_FONT, padding: "10px 12px" },
                        }}
                      />
                    )}
                    popupIcon={<ArrowDropDownIcon sx={{ fontSize: 22 }} />}
                    disableClearable
                    sx={{
                      // reducir la altura del root del Autocomplete solo para especie
                      "& .MuiAutocomplete-inputRoot": { fontSize: INPUT_FONT, minHeight: 44, alignItems: "center" },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Campo "Otro" si corresponde */}
            {especieSel === "Otro" && (
              <Grid item xs={12}>
                <TextField
                  label="Otra especie"
                  fullWidth
                  size="small"
                  {...register("especieOtro", {
                    required: "Debes especificar la especie",
                  })}
                  error={!!errors.especieOtro}
                  helperText={errors.especieOtro?.message}
                  sx={textFieldSx}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            {/* Raza */}
            <Grid item xs={12}>
              <TextField
                label="Raza"
                fullWidth
                size="small"
                {...register("raza")}
                sx={textFieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Edad */}
            <Grid item xs={12}>
              <TextField
                label="Edad"
                type="number"
                fullWidth
                size="small"
                {...register("edad", { valueAsNumber: true })}
                sx={textFieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Error submit */}
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

        <DialogActions sx={{ p:2, justifyContent: "flex-end", gap: 1}}>
          {/* Ambos botones usan el mismo tamaño/alto/ancho para consistencia */}
          <SuiButton
            variant="outlined"
            buttonColor="secondary"
            onClick={onClose}
            sx={{
              fontSize: INPUT_FONT,
              textTransform: "none",
              px: 3,
              minWidth: 120,
              height: 44,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Cancelar
          </SuiButton>
          <SuiButton
            variant="gradient"
            buttonColor="dark"
            type="submit"
            sx={{
              fontSize: INPUT_FONT,
              textTransform: "none",
              px: 3,
              minWidth: 120,
              height: 44,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Guardar
          </SuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
