import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import SuiButton from "components/SuiButton";
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import clinicApi from "api/clinic";
import dogImg from "assets/images/gemini_perro.png";
import catImg from "assets/images/gemini_gato.png";
import birdImg from "assets/images/gemini_ave.png";
import { Card, CardMedia, CardContent } from "@mui/material";

export default function ModalHistorialMascota({ open, onClose, mascotaId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [mascota, setMascota] = useState(null);
  const [displayImage, setDisplayImage] = useState(null);
  const [currentVetName, setCurrentVetName] = useState("Cargando...");
  const [ownerPhone, setOwnerPhone] = useState(null);

  useEffect(() => {
    if (!open || !mascotaId) return;
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      setConsultas([]);
      setMascota(null);
      setOwnerPhone(null);
      try {
        // Fetch consultations
        const resHistory = await clinicApi.request(
          `/api/clinic/mascotas/${mascotaId}/consultas/asistidas`,
          { method: "GET" }
        );

        // Fetch pet details
        const resPet = await clinicApi.request(`/api/clinic/mascotas/${mascotaId}`, { method: "GET" });

        if (!mounted) return;

        // Process consultations
        const arr = Array.isArray(resHistory) ? resHistory : resHistory?.data || [];
        arr.sort((a, b) => {
          const fa = (a.fecha || "") + " " + (a.hora || "");
          const fb = (b.fecha || "") + " " + (b.hora || "");
          return fb.localeCompare(fa);
        });
        setConsultas(arr);
        setMascota(resPet);

        // Fetch owner phone if available
        let duenoId = null;
        if (resPet.dueno) {
          if (typeof resPet.dueno === 'object') duenoId = resPet.dueno.id || resPet.dueno.idDueno;
          else duenoId = resPet.dueno;
        }

        if (duenoId) {
          try {
            const ownerRes = await clinicApi.request(`/api/clinic/duenos/${duenoId}`);
            if (mounted && ownerRes && ownerRes.telefono) {
              setOwnerPhone(ownerRes.telefono);
            }
          } catch (e) {
            console.warn("Could not fetch owner phone", e);
          }
        }

      } catch (err) {
        setError(err?.message || "Error cargando historial");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => (mounted = false);
  }, [open, mascotaId]);

  // Determine pet image based on species
  useEffect(() => {
    if (open && mascota) {
      const especie = (mascota.especie || "").toLowerCase();

      let finalImg = dogImg;

      // Strict species detection for local assets
      if (especie.includes("perro") || especie.includes("canino") || especie.includes("dog")) {
        finalImg = dogImg;
      } else if (especie.includes("gato") || especie.includes("felino") || especie.includes("cat")) {
        finalImg = catImg;
      } else if (especie.includes("ave") || especie.includes("pajaro") || especie.includes("bird") || especie.includes("loro")) {
        finalImg = birdImg;
      } else if (especie) {
        finalImg = dogImg; // safe fallback
      }

      setDisplayImage(finalImg);
    }
  }, [open, mascota]);

  // Fetch Veterinarian Name when consultation is selected
  useEffect(() => {
    let mounted = true;
    if (selectedConsulta) {
      // Default based on existing data if available
      const preloadedName = selectedConsulta.veterinario_nombre ||
        (selectedConsulta.veterinario && selectedConsulta.veterinario.nombre);

      setCurrentVetName(preloadedName || "Cargando...");

      // If we have an ID, fetch the latest details
      // Check if selectedConsulta.veterinario is an object or just an ID
      let vetId = null;
      if (typeof selectedConsulta.veterinario === 'object' && selectedConsulta.veterinario !== null) {
        vetId = selectedConsulta.veterinario.id || selectedConsulta.veterinario.idVeterinario;
      } else {
        vetId = selectedConsulta.veterinario;
      }

      if (vetId) {
        clinicApi.request(`/api/clinic/veterinarios/${vetId}`)
          .then((data) => {
            if (mounted && data && data.nombre) {
              setCurrentVetName(data.nombre);
            }
          })
          .catch((err) => {
            console.error("Failed to fetch vet details", err);
            if (mounted && !preloadedName) {
              setCurrentVetName("No especificado");
            }
          });
      } else if (!preloadedName) {
        setCurrentVetName("No especificado");
      }
    } else {
      setCurrentVetName("");
    }
    return () => { mounted = false; };
  }, [selectedConsulta]);

  const ownerName =
    (mascota && mascota.dueno && (mascota.dueno.nombre || mascota.dueno.name)) ||
    (mascota && mascota.dueno_nombre) ||
    "-";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Historial de {mascota ? mascota.nombre : "Mascota"}</DialogTitle>
      <Divider />
      <DialogContent>
        {loading ? (
          <Grid container justifyContent="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Grid>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Grid container spacing={4}>
            {/* Left Column: Pet Info */}
            <Grid item xs={12} md={4}>
              {mascota && (
                <Card sx={{ boxShadow: 3 }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={displayImage || dogImg}
                    alt={mascota.nombre}
                  />
                  <CardContent>
                    <SuiTypography variant="h5" gutterBottom>{mascota.nombre}</SuiTypography>
                    <SuiTypography variant="body2" color="text">
                      <strong>Especie/Raza:</strong> {mascota.especie || "-"} - {mascota.raza || "-"}
                    </SuiTypography>
                    <SuiTypography variant="body2" color="text">
                      <strong>Edad:</strong> {mascota.edad ? `${mascota.edad} años` : "-"}
                    </SuiTypography>
                    <SuiBox mt={2} mb={1}>
                      <Divider />
                    </SuiBox>
                    <SuiTypography variant="subtitle2">Información del Dueño</SuiTypography>
                    <SuiTypography variant="body2" color="text">
                      {ownerName}
                    </SuiTypography>
                    {ownerPhone && (
                      <SuiTypography variant="body2" color="text">
                        Tel: {ownerPhone}
                      </SuiTypography>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Right Column: Consultations */}
            <Grid item xs={12} md={8}>
              {selectedConsulta ? (
                <SuiBox p={2}>
                  <SuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <SuiTypography variant="h6">Detalles de Consulta</SuiTypography>
                    <SuiButton size="small" variant="outlined" buttonColor="info" onClick={() => setSelectedConsulta(null)}>
                      Volver
                    </SuiButton>
                  </SuiBox>

                  {/* Info Button Box: ID, Date, Time, Vet */}
                  <SuiBox p={3} bgcolor="background.paper" borderRadius="20px" border="2px solid #5c5c5c" mb={3} boxShadow={1}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <SuiTypography variant="caption" color="text" fontWeight="bold" display="block">ID Consulta</SuiTypography>
                        <SuiTypography variant="body2">{selectedConsulta.id || selectedConsulta.idConsulta || "-"}</SuiTypography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <SuiTypography variant="caption" color="text" fontWeight="bold" display="block">Fecha y Hora</SuiTypography>
                        <SuiTypography variant="body2">
                          {selectedConsulta.fecha || (selectedConsulta.fechaHora || "").split("T")[0]} {" "}
                          {selectedConsulta.hora || (selectedConsulta.fechaHora ? (selectedConsulta.fechaHora.split("T")[1] || "").slice(0, 5) : "")}
                        </SuiTypography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <SuiTypography variant="caption" color="text" fontWeight="bold" display="block">Veterinario</SuiTypography>
                        <SuiTypography variant="body2">
                          {currentVetName}
                        </SuiTypography>
                      </Grid>
                    </Grid>
                  </SuiBox>

                  {/* Motive Box */}
                  <SuiBox p={3} bgcolor="background.paper" borderRadius="20px" border="2px solid #5c5c5c" mb={3} boxShadow={1}>
                    <SuiTypography variant="caption" color="text" fontWeight="bold" display="block">Motivo</SuiTypography>
                    <SuiTypography variant="body2">{selectedConsulta.motivo || "-"}</SuiTypography>
                  </SuiBox>

                  {/* Description Box */}
                  <SuiBox p={3} bgcolor="background.paper" borderRadius="20px" border="2px solid #5c5c5c" mb={3} boxShadow={1}>
                    <SuiTypography variant="caption" color="text" fontWeight="bold" display="block">Descripción</SuiTypography>
                    <SuiTypography variant="body2">{selectedConsulta.observaciones || selectedConsulta.descripcion || "-"}</SuiTypography>
                  </SuiBox>

                  {/* Symptoms Box */}
                  <SuiBox p={3} bgcolor="background.paper" borderRadius="20px" border="2px solid #5c5c5c" mb={3} boxShadow={1}>
                    <SuiTypography variant="caption" color="text" fontWeight="bold" display="block">Síntomas</SuiTypography>
                    <SuiTypography variant="body2">{selectedConsulta.sintomas || "-"}</SuiTypography>
                  </SuiBox>

                  {/* Diagnosis Box */}
                  <SuiBox p={3} bgcolor="background.paper" borderRadius="20px" border="2px solid #5c5c5c" mb={3} boxShadow={1}>
                    <SuiTypography variant="caption" color="text" fontWeight="bold" display="block">Diagnóstico</SuiTypography>
                    <SuiTypography variant="body2">{selectedConsulta.diagnostico || "-"}</SuiTypography>
                  </SuiBox>

                  {/* Treatment and Notes */}
                  <SuiBox p={3} bgcolor="background.paper" borderRadius="20px" border="2px solid #5c5c5c" boxShadow={1}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <SuiTypography variant="caption" color="text" fontWeight="bold" display="block">Tratamiento</SuiTypography>
                        <SuiTypography variant="body2">{selectedConsulta.tratamiento || "-"}</SuiTypography>
                      </Grid>
                      <Grid item xs={12}>
                        <SuiTypography variant="caption" color="text" fontWeight="bold" display="block">Notas</SuiTypography>
                        <SuiTypography variant="body2">{selectedConsulta.notas || "-"}</SuiTypography>
                      </Grid>
                    </Grid>
                  </SuiBox>

                </SuiBox>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <SuiTypography variant="h6" textColor="dark" mb={2}>
                      Consultas Asistidas
                    </SuiTypography>
                    {consultas.length === 0 ? (
                      <SuiTypography variant="caption" color="text">No hay consultas asistidas para esta mascota.</SuiTypography>
                    ) : (
                      <List sx={{ maxHeight: 400, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #eee' }}>
                        {consultas.map((c, i) => {
                          const fecha = c.fecha || (c.fechaHora ? String(c.fechaHora).split("T")[0] : "");
                          const hora = c.hora || (c.fechaHora ? (String(c.fechaHora).split("T")[1] || "").slice(0, 5) : "");
                          const motivo = c.motivo || c.descripcion || "-";
                          return (
                            <React.Fragment key={i}>
                              <ListItemButton alignItems="center">
                                <ListItemText
                                  primary={`${fecha} ${hora}`}
                                  secondary={motivo}
                                />
                                <SuiBox ml={2}>
                                  <SuiButton variant="text" buttonColor="info" size="small" onClick={(e) => { e.stopPropagation(); setSelectedConsulta(c); }}>
                                    Ver
                                  </SuiButton>
                                </SuiBox>
                              </ListItemButton>
                              {i < consultas.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                          );
                        })}
                      </List>
                    )}
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <SuiButton variant="outlined" buttonColor="secondary" onClick={onClose}>
          Cerrar
        </SuiButton>
      </DialogActions>
    </Dialog>
  );
}
