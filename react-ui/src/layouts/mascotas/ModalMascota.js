import React, { useState, useEffect } from "react";
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
import clinicApi from "api/clinic";

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
      dueno: null,
    },
  });

  const especieSel = watch("especieSel");
  const [submitError, setSubmitError] = useState("");
  const [owners, setOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  // controla apertura del autocomplete para que se abra al click en cualquier parte
  const [speciesOpen, setSpeciesOpen] = useState(false);

  const submit = async (data) => {
    setSubmitError("");
    try {
      // normalize dueno: if the autocomplete returns an object, send the id
      const normalized = { ...data };
      if (normalized.dueno && typeof normalized.dueno === "object") {
        normalized.dueno =
          normalized.dueno.id ||
          normalized.dueno.idDueno ||
          normalized.dueno.pk ||
          normalized.dueno.dueno ||
          null;
      }
      await onSave?.(normalized);
      reset();
      onClose?.();
    } catch (err) {
      setSubmitError(err?.message || "Error al guardar");
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoadingOwners(true);
    clinicApi
      .list("duenos")
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) setOwners(data);
        else setOwners([]);
      })
      .catch((err) => {
        console.warn("Error fetching duenos:", err);
        if (mounted) setOwners([]);
      })
      .finally(() => {
        if (mounted) setLoadingOwners(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

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
          <Grid container spacing={1}>
            {/* Nombre */}
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
                {...register("nombre", { required: "El nombre es obligatorio" })}
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
                sx={textFieldSx}
              />
            </Grid>

            {/* Autocomplete de especie */}
            <Grid item xs={12}>
              <Controller
                name="especieSel"
                control={control}
                render={({ field }) => (
                  <>
                    <Typography
                      sx={{
                        fontSize: "1.05rem",
                        fontWeight: 400,
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Especie
                    </Typography>
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
                          placeholder="Especie"
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
                        "& .MuiAutocomplete-inputRoot": {
                          fontSize: INPUT_FONT,
                          minHeight: 44,
                          alignItems: "center",
                        },
                      }}
                    />
                  </>
                )}
              />
            </Grid>

            {/* Campo "Otro" si corresponde */}
            {especieSel === "Otro" && (
              <Grid item xs={12}>
                <Typography
                  sx={{
                    fontSize: "1.05rem",
                    fontWeight: 400,
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Otra especie
                </Typography>
                <TextField
                  placeholder="Otra especie"
                  fullWidth
                  size="small"
                  {...register("especieOtro", {
                    required: "Debes especificar la especie",
                  })}
                  error={!!errors.especieOtro}
                  helperText={errors.especieOtro?.message}
                  sx={textFieldSx}
                />
              </Grid>
            )}

            {/* Raza */}
            <Grid item xs={12}>
              <Typography
                sx={{ fontSize: "1.05rem", fontWeight: 400, display: "block", marginBottom: "6px" }}
              >
                Raza
              </Typography>
              <TextField
                placeholder="Raza"
                fullWidth
                size="small"
                {...register("raza")}
                sx={textFieldSx}
              />
            </Grid>

            {/* Edad */}
            <Grid item xs={12}>
              <Typography
                sx={{ fontSize: "1.05rem", fontWeight: 400, display: "block", marginBottom: "6px" }}
              >
                Edad
              </Typography>
              <TextField
                placeholder="Edad"
                type="number"
                fullWidth
                size="small"
                {...register("edad", { valueAsNumber: true })}
                sx={textFieldSx}
              />
            </Grid>

            {/* Dueño */}
            <Grid item xs={12}>
              <Controller
                name="dueno"
                control={control}
                rules={{ required: "Selecciona un dueño" }}
                render={({ field }) => (
                  <>
                    <Typography
                      sx={{
                        fontSize: "1.05rem",
                        fontWeight: 400,
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Dueño
                    </Typography>
                    <Autocomplete
                      options={owners}
                      getOptionLabel={(opt) =>
                        (opt && (opt.nombre || opt.dueno_nombre || opt.name)) || String(opt || "")
                      }
                      isOptionEqualToValue={(option, value) => {
                        if (!option || !value) return false;
                        const oid = option.id || option.idDueno || option.pk || option.dueno;
                        const vid = value.id || value.idDueno || value.pk || value.dueno;
                        return oid && vid ? String(oid) === String(vid) : option === value;
                      }}
                      size="small"
                      value={field.value || null}
                      onChange={(_, value) => field.onChange(value)}
                      loading={loadingOwners}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Dueño"
                          error={!!errors.dueno}
                          helperText={errors.dueno?.message}
                          sx={textFieldSx}
                        />
                      )}
                    />
                  </>
                )}
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

        <DialogActions sx={{ p: 2, justifyContent: "flex-end", gap: 1 }}>
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
