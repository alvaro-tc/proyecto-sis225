/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import clinicApi from "../../api/clinic";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";

// Layout and table components (to match Tables page)
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import Table from "examples/Table";
import styles from "layouts/tables/styles";
import typography from "assets/theme/base/typography";

export default function ResourceCrud({ resource, title, fields }) {
  const classes = styles();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(() => {
    const o = {};
    fields.forEach((f) => (o[f.name] = f.default || ""));
    return o;
  });
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({});

  const relationMap = {
    dueno: "duenos",
    veterinario: "veterinarios",
    mascota: "mascotas",
    historial: "historiales",
    cita: "citas",
  };

  useEffect(() => {
    load();
    // load relation options
    (async () => {
      const relFields = fields.filter((f) => relationMap[f.name]);
      for (const f of relFields) {
        try {
          const list = await clinicApi.list(relationMap[f.name]);
          const opts = (list || []).map((it) => ({
            label: it.nombre || it.title || `ID ${it.id || it.pk || it._id}`,
            id: it.id || it.pk || it._id,
          }));
          setOptions((s) => ({ ...s, [f.name]: opts }));
        } catch (err) {
          console.error("error cargando opciones para", f.name, err);
          setOptions((s) => ({ ...s, [f.name]: [] }));
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await clinicApi.list(resource);
      setItems(data || []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await clinicApi.create(resource, form);
      setForm(fields.reduce((acc, f) => ({ ...acc, [f.name]: f.default || "" }), {}));
      await load();
    } catch (err) {
      console.error(err);
      alert("Error al crear: " + JSON.stringify(err));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Eliminar elemento?")) return;
    try {
      await clinicApi.remove(resource, id);
      await load();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar: " + JSON.stringify(err));
    }
  }

  // Build table columns/rows from fields/items
  const columns = [
    { name: "id", align: "left" },
    ...fields.map((f) => ({ name: f.name, align: "left" })),
    { name: "action", align: "center" },
  ];

  const rows = (items || []).map((it) => {
    const row = {};
    row.id = it.id || it.pk || it._id || "";
    fields.forEach((f) => {
      const val = it[f.name];
      if (val === null || val === undefined) {
        row[f.name] = "";
      } else if (typeof val === "object") {
        row[f.name] = val.nombre || val.title || val.id || JSON.stringify(val);
      } else {
        row[f.name] = String(val);
      }
    });
    row.action = (
      <div>
        <Button size="small" color="error" onClick={() => handleDelete(it.id || it.pk || it._id)}>
          Eliminar
        </Button>
      </div>
    );
    return row;
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SuiBox py={3}>
        <SuiBox mb={3}>
          <Card>
            <SuiBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
              <SuiTypography variant="h6">{title}</SuiTypography>
            </SuiBox>
            <SuiBox p={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <form onSubmit={handleCreate}>
                    {fields.map((f) => {
                      const rel = relationMap[f.name];
                      const placeholder = f.placeholder || (f.type === "number" ? "Ej: 123" : f.name === "fecha" ? "YYYY-MM-DD" : "");
                      const helper = f.help || "";
                      const labelFont = typography.size.xs;
                      const inputFont = typography.size.sm;
                      if (rel) {
                        const opts = options[f.name] || [];
                        const value = opts.find((o) => o.id === form[f.name]) || null;
                        return (
                          <SuiBox key={f.name} mb={1}>
                            <SuiTypography variant="caption" fontWeight="medium" component="label">
                              {f.label}
                            </SuiTypography>
                            <Autocomplete
                              options={opts}
                              getOptionLabel={(o) => o.label}
                              value={value}
                              onChange={(_, newVal) =>
                                setForm((s) => ({ ...s, [f.name]: newVal ? Number(newVal.id) : "" }))
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  margin="normal"
                                  fullWidth
                                  variant="outlined"
                                  size="small"
                                  placeholder={placeholder}
                                  helperText={helper}
                                  required={!!f.required}
                                  InputLabelProps={{ shrink: true, style: { fontSize: labelFont } }}
                                  inputProps={{ ...params.inputProps, style: { fontSize: inputFont } }}
                                  InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                      <>
                                        {params.InputProps.endAdornment}
                                        {opts.length === 0 && <CircularProgress size={20} />}
                                      </>
                                    ),
                                  }}
                                />
                              )}
                            />
                          </SuiBox>
                        );
                      }

                      return (
                        <SuiBox key={f.name} mb={1}>
                          <SuiTypography variant="caption" fontWeight="medium" component="label" style={{ fontSize: labelFont }}>
                            {f.label}
                          </SuiTypography>
                          <TextField
                            margin="normal"
                            fullWidth
                            variant="outlined"
                            size="small"
                            name={f.name}
                            type={f.type || "text"}
                            value={form[f.name] || ""}
                            onChange={handleChange}
                            required={!!f.required}
                            placeholder={placeholder}
                            helperText={helper}
                            InputLabelProps={{ shrink: true, style: { fontSize: labelFont } }}
                            inputProps={{ style: { fontSize: inputFont } }}
                          />
                        </SuiBox>
                      );
                    })}
                    <SuiBox mt={1}>
                      <Button type="submit" variant="contained" color="primary">
                        Crear
                      </Button>
                    </SuiBox>
                  </form>
                </Grid>
                <Grid item xs={12} md={8}>
                  <SuiBox customClass={classes.tables_table}>
                    <Table columns={columns} rows={rows} />
                  </SuiBox>
                </Grid>
              </Grid>
            </SuiBox>
          </Card>
        </SuiBox>
      </SuiBox>
      <Footer />
    </DashboardLayout>
  );
}

ResourceCrud.propTypes = {
  resource: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  fields: PropTypes.array.isRequired,
};
