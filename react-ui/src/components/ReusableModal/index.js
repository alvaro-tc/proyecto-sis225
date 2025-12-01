import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import SuiBox from "components/SuiBox";
import SuiButton from "components/SuiButton";
import SuiTypography from "components/SuiTypography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloseIcon from "@mui/icons-material/Close";

/**
 * ReusableModal
 * props:
 * - open, onClose
 * - title
 * - fields: [{ name, label, type: 'text'|'number'|'select', options?: [{value,label}] , required?:bool }]
 * - initialValues: { name: value }
 * - submitLabel
 * - onSubmit(values) -> Promise
 */
export default function ReusableModal({ open, onClose, title, fields, initialValues, submitLabel, onSubmit }) {
  const [values, setValues] = useState(initialValues || {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [openSelects, setOpenSelects] = useState({});

  useEffect(() => {
    setValues(initialValues || {});
    setError("");
    setSubmitting(false);
    setFieldErrors({});
    setOpenSelects({});
  }, [initialValues, open]);

  function handleChange(name, v) {
    setValues((s) => ({ ...s, [name]: v }));
    setError("");
    setFieldErrors((s) => ({ ...s, [name]: undefined }));
  }

  function validate() {
    const errs = {};
    (fields || []).forEach((f) => {
      if (f.required) {
        const val = values[f.name];
        if (val === undefined || val === null || String(val).trim() === "") {
          errs[f.name] = `${f.label} es obligatorio`;
        }
      }
      // simple dependent validation: if field name 'especie' === 'Otro' and there's a field 'especie_otro' required
      if (f.name === "especie") {
        const val = values[f.name];
        const otroField = fields.find((x) => x.name === "especie_otro");
        if (val === "Otro" && otroField && otroField.required) {
          const v2 = values["especie_otro"];
          if (!v2 || String(v2).trim() === "") errs["especie_otro"] = "Especifique la otra especie";
        }
      }
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e && e.preventDefault();
    setError("");
    if (!validate()) return;
    try {
      setSubmitting(true);
      await onSubmit(values || {});
      setSubmitting(false);
    } catch (err) {
      setSubmitting(false);
      setError(err && err.message ? err.message : JSON.stringify(err));
      // bubble up field errors if error has field mapping
      if (err && err.fieldErrors) setFieldErrors(err.fieldErrors);
      throw err;
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 0 }}>
        <SuiBox px={3} pt={2} pb={1} sx={{ background: "linear-gradient(90deg,#2d7aee,#4b67f6)", borderRadius: "8px 8px 0 0" }}>
          <SuiTypography variant="h5" fontWeight="bold" sx={{ fontSize: "1.15rem", color: "#fff" }}>
            {title}
          </SuiTypography>
          <SuiTypography variant="body2" sx={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.9)" }}>
            Completa los datos
          </SuiTypography>
        </SuiBox>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <form id="reusable-modal-form" onSubmit={handleSubmit}>
          <Grid container spacing={1}>
            {(fields || []).map((f) => (
              <Grid item xs={12} sm={12} key={f.name}>
                {f.type === "select" ? (
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: "0.9rem" }}>{f.label}</InputLabel>
                    <Select
                      value={values[f.name] ?? f.default ?? ""}
                      label={f.label}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                      IconComponent={ArrowDropDownIcon}
                      open={!!openSelects[f.name]}
                      onClose={() => setOpenSelects((s) => ({ ...s, [f.name]: false }))}
                      onOpen={() => setOpenSelects((s) => ({ ...s, [f.name]: true }))}
                      sx={{
                        "& .MuiSelect-select": { fontSize: "0.95rem", padding: "12px 14px", minHeight: 48, display: "flex", alignItems: "center" },
                        borderRadius: 1,
                      }}
                      MenuProps={{ PaperProps: { sx: { "& .MuiMenuItem-root": { fontSize: "0.95rem" } } } }}
                    >
                      {(f.options || []).map((opt) => (
                        <MenuItem value={opt.value} key={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {fieldErrors[f.name] && (
                      <SuiTypography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {fieldErrors[f.name]}
                      </SuiTypography>
                    )}
                  </FormControl>
                ) : (
                  <div>
                    <TextField
                      label={f.label}
                      fullWidth
                      size="small"
                      variant="outlined"
                      type={f.type === "number" ? "number" : "text"}
                      value={values[f.name] ?? f.default ?? ""}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiInputBase-input": { fontSize: "0.95rem", padding: "12px 14px" },
                        "& .MuiInputLabel-root": { fontSize: "0.95rem" },
                        minHeight: 56,
                      }}
                    />
                    {fieldErrors[f.name] && (
                      <SuiTypography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {fieldErrors[f.name]}
                      </SuiTypography>
                    )}
                  </div>
                )}
              </Grid>
            ))}
          </Grid>

          {error && (
            <SuiBox mt={2}>
              <SuiTypography variant="caption" color="error">
                {error}
              </SuiTypography>
            </SuiBox>
          )}
        </form>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <CloseIcon />
        </IconButton>
        <SuiBox sx={{ flex: 1 }} />
        <SuiButton color="secondary" onClick={onClose} sx={{ fontSize: "0.9rem", mr: 1 }}>
          Cancelar
        </SuiButton>
        <SuiButton type="submit" form="reusable-modal-form" variant="gradient" buttonColor="dark" sx={{ fontSize: "0.95rem", padding: "8px 18px" }} disabled={submitting}>
          {submitLabel || "Guardar"}
        </SuiButton>
      </DialogActions>
    </Dialog>
  );
}

ReusableModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  fields: PropTypes.array,
  initialValues: PropTypes.object,
  submitLabel: PropTypes.string,
  onSubmit: PropTypes.func,
};
