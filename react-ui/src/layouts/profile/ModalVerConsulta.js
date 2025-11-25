import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  Divider,
  Button,
  CircularProgress,
  Box,
  Card,
} from "@mui/material";
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiButton from "components/SuiButton";
import SuiAvatar from "components/SuiAvatar";
import petsIcon from "assets/images/pets.svg";
import clinicApi from "api/clinic";

export default function ModalVerConsulta({ open, onClose, consultaId }) {
  const [loading, setLoading] = useState(false);
  const [consulta, setConsulta] = useState(null);
  const [error, setError] = useState(null);
  const [vetInfo, setVetInfo] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      setConsulta(null);

      if (!consultaId) {
        setError("ID de consulta no proporcionado");
        setLoading(false);
        return;
      }

      try {
        const data = await clinicApi.request(`/api/clinic/consultas/${consultaId}`, { method: "GET" });
        if (!mounted) return;
        setConsulta(data);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Error cargando consulta");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [open, consultaId]);

  useEffect(() => {
    let mounted = true;
    async function loadRelated() {
      setVetInfo(null);
      setOwnerInfo(null);
      if (!consulta) return;

      try {
        if (typeof consulta.veterinario === "number") {
          const v = await clinicApi.retrieve("veterinarios", consulta.veterinario);
          if (mounted) setVetInfo(v);
        } else setVetInfo(consulta.veterinario);
      } catch {}

      try {
        if (typeof consulta.dueno === "number") {
          const d = await clinicApi.retrieve("duenos", consulta.dueno);
          if (mounted) setOwnerInfo(d);
        } else setOwnerInfo(consulta.dueno);
      } catch {}
    }
    loadRelated();
    return () => (mounted = false);
  }, [consulta]);

  function formatDateLong(dateStr) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const fmt = d.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return fmt.charAt(0).toUpperCase() + fmt.slice(1);
    } catch {
      return dateStr;
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      {/* TITULO */}
      <DialogTitle>
        <SuiBox display="flex" alignItems="center" gap={2}>
          <SuiAvatar src={petsIcon} size="lg" variant="rounded" />

          <Box display="flex" flexDirection="column">
            <SuiTypography variant="h4" fontWeight={800}>
              {consulta?.fecha
                ? `Consulta del ${formatDateLong(consulta.fecha)}`
                : "Consulta Veterinaria"}
            </SuiTypography>

            <SuiTypography variant="body2" color="text.secondary">
              Hora: {consulta?.hora || "--"} · Mascota: {consulta?.mascota?.nombre || "--"}
            </SuiTypography>

            {vetInfo && (
              <SuiTypography variant="caption" color="text.secondary">
                Veterinario: {vetInfo?.nombre}
              </SuiTypography>
            )}
          </Box>
        </SuiBox>
      </DialogTitle>

      <Divider />

      {/* CONTENIDO */}
      <DialogContent sx={{ py: 4 }}>
        {loading ? (
          <Grid container justifyContent="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Grid>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : consulta ? (
          <Grid container spacing={4}>
            {/* ---------------- COLUMNA IZQUIERDA ---------------- */}
            <Grid item xs={12} md={4}>
              {/* --- CARD MASCOTA --- */}
              <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <SuiAvatar src={petsIcon} size="xl" variant="rounded" />

                  <SuiTypography variant="h5" fontWeight={700} sx={{ mt: 2 }}>
                    {consulta.mascota?.nombre || "Mascota"}
                  </SuiTypography>

                  <SuiTypography variant="body2" color="text.secondary">
                    {consulta.mascota?.especie}
                    {consulta.mascota?.raza ? ` · ${consulta.mascota.raza}` : ""}
                  </SuiTypography>
                </Box>
              </Card>

              {/* --- CARD DUEÑO --- */}
              <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3, mt: 3 }}>
                <SuiTypography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Información del dueño
                </SuiTypography>

                <SuiTypography>
                  <strong>Nombre:</strong>{" "}
                  {ownerInfo?.nombre || consulta.dueno?.nombre || "--"}
                </SuiTypography>
              </Card>
            </Grid>

            {/* ---------------- COLUMNA DERECHA ---------------- */}
            <Grid item xs={12} md={8}>
              {/* --- DETALLES DE CITA --- */}
              <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                <SuiTypography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Detalles de la cita
                </SuiTypography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption">ID Consulta</Typography>
                    <Typography fontWeight={700}>
                      {consulta.idConsulta || consulta.id || "-"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption">Fecha</Typography>
                    <Typography fontWeight={700}>
                      {formatDateLong(consulta.fecha)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption">Hora</Typography>
                    <Typography fontWeight={700}>{consulta.hora}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption">Veterinario</Typography>
                    <Typography fontWeight={700}>
                      {vetInfo?.nombre || "--"}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              {/* --- MOTIVO --- */}
              <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3, mt: 3 }}>
                <SuiTypography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Motivo de la consulta
                </SuiTypography>
                <Typography>{consulta.motivo || "--"}</Typography>
              </Card>

              {/* --- DESCRIPCIÓN --- */}
              <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3, mt: 3 }}>
                <SuiTypography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Descripción / Observaciones
                </SuiTypography>
                <Typography>{consulta.descripcion || "--"}</Typography>
              </Card>

              {/* --- SÍNTOMAS --- */}
              <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3, mt: 3 }}>
                <SuiTypography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Síntomas
                </SuiTypography>
                <Typography>{consulta.sintomas || "--"}</Typography>
              </Card>

              {/* --- DIAGNÓSTICO --- */}
              <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3, mt: 3 }}>
                <SuiTypography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Diagnóstico
                </SuiTypography>
                <Typography>{consulta.diagnostico || "--"}</Typography>
              </Card>

              {/* --- TRATAMIENTO --- */}
              <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3, mt: 3 }}>
                <SuiTypography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Tratamiento
                </SuiTypography>
                <Typography>{consulta.tratamiento || "--"}</Typography>
              </Card>

              {/* --- NOTAS --- */}
              <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3, mt: 3 }}>
                <SuiTypography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Notas
                </SuiTypography>
                <Typography>{consulta.notas || "--"}</Typography>
              </Card>

              {/* --- ASISTIÓ --- */}
              <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3, mt: 3 }}>
                <SuiTypography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Asistió
                </SuiTypography>
                <Typography>{typeof consulta.asistio === "boolean" ? (consulta.asistio ? "Sí" : "No") : "--"}</Typography>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Typography>No hay datos de consulta.</Typography>
        )}
      </DialogContent>

      {/* FOOTER */}
      <DialogActions sx={{ p: 3 }}>
        <SuiButton variant="outlined" buttonColor="secondary" onClick={onClose}>
          Cerrar
        </SuiButton>
      </DialogActions>
    </Dialog>
  );
}
