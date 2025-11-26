// src/components/Reception/ReceptionDesk.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";

const STORAGE_KEY = "mock_appointments_v1";

const initialMock = [
  {
    id: 1,
    owner: "Ana",
    contact: "ana@mail.com",
    pet_name: "Fido",
    service: "Consulta",
    date: "2025-11-26",
    time: "10:00",
    notes: "Traer historial",
  },
  {
    id: 2,
    owner: "Luis",
    contact: "luis@mail.com",
    pet_name: "Mila",
    service: "Vacunación",
    date: "2025-11-27",
    time: "14:30",
    notes: "",
  },
];

function loadMock() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMock));
      return initialMock;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("loadMock:", e);
    return [];
  }
}

function saveMock(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("saveMock:", e);
  }
}

export default function ReceptionDesk() {
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({
    owner: "",
    contact: "",
    pet_name: "",
    service: "",
    date: "",
    time: "",
    notes: "",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setAppointments(loadMock());
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function clearForm() {
    setEditingId(null);
    setForm({
      owner: "",
      contact: "",
      pet_name: "",
      service: "",
      date: "",
      time: "",
      notes: "",
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    // simple validation
    if (!form.owner || !form.pet_name || !form.date || !form.time) {
      window.alert("Completa: dueño, nombre de mascota, fecha y hora.");
      return;
    }

    if (editingId) {
      const updated = appointments.map((a) => (a.id === editingId ? { ...a, ...form } : a));
      setAppointments(updated);
      saveMock(updated);
      clearForm();
      return;
    }

    const newId = appointments.length ? Math.max(...appointments.map((a) => a.id)) + 1 : 1;
    const newAppt = { id: newId, ...form };
    const next = [newAppt, ...appointments];
    setAppointments(next);
    saveMock(next);
    clearForm();
  }

  function handleEdit(a) {
    setEditingId(a.id);
    setForm({
      owner: a.owner || "",
      contact: a.contact || "",
      pet_name: a.pet_name || "",
      service: a.service || "",
      date: a.date || "",
      time: a.time || "",
      notes: a.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    if (!window.confirm("Eliminar esta cita?")) return;
    const next = appointments.filter((a) => a.id !== id);
    setAppointments(next);
    saveMock(next);
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: 3 }}>
      <Typography variant="h5" mb={2}>
        Recepción — Agendar / Editar Citas (MOCK)
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle1" gutterBottom>
                {editingId ? "Editar cita" : "Nueva cita"}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Dueño"
                    name="owner"
                    value={form.owner}
                    onChange={handleChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contacto (tel/email)"
                    name="contact"
                    value={form.contact}
                    onChange={handleChange}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre mascota"
                    name="pet_name"
                    value={form.pet_name}
                    onChange={handleChange}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Servicio"
                    name="service"
                    value={form.service}
                    onChange={handleChange}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fecha"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hora"
                    name="time"
                    type="time"
                    value={form.time}
                    onChange={handleChange}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notas"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    multiline
                    rows={2}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sx={{ display: "flex", gap: 1 }}>
                  <Button type="submit" variant="contained" startIcon={<AddIcon />}>
                    {editingId ? "Guardar cambios" : "Crear cita"}
                  </Button>
                  <Button variant="outlined" startIcon={<ClearIcon />} onClick={clearForm}>
                    Limpiar
                  </Button>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle2">Resumen</Typography>
                  <Stack spacing={1} mt={1}>
                    <Typography variant="body2">Citas totales: {appointments.length}</Typography>
                    <Typography variant="body2">Modo: MOCK (localStorage)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Las citas se guardan localmente en tu navegador. No se usa backend.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lista de citas
          </Typography>
          {appointments.length === 0 ? (
            <Typography color="text.secondary">No hay citas.</Typography>
          ) : (
            <List>
              {appointments.map((a) => (
                <React.Fragment key={a.id}>
                  <ListItem alignItems="flex-start" sx={{ gap: 2 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle1">
                            {a.pet_name || "(sin nombre)"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            — {a.service || "—"}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {a.date} {a.time} • Dueño: {a.owner} • {a.contact}
                          </Typography>
                          {a.notes ? (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              Notas: {a.notes}
                            </Typography>
                          ) : null}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(a)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(a.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
