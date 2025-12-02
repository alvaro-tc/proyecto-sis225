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
import clinicApi from "api/clinic";
import ModalVerConsulta from "layouts/profile/ModalVerConsulta";

export default function ModalHistorialMascota({ open, onClose, mascotaId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [selectedConsultaId, setSelectedConsultaId] = useState(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      setConsultas([]);
      try {
        if (!mascotaId) {
          setError("Mascota no proporcionada");
          return;
        }
        const res = await clinicApi.request(
          `/api/clinic/mascotas/${mascotaId}/consultas/asistidas`,
          { method: "GET" }
        );
        if (!mounted) return;
        // Expect an array of consultas; normalize
        const arr = Array.isArray(res) ? res : res?.data || [];
        // sort by fecha+hora desc
        arr.sort((a, b) => {
          const fa = (a.fecha || "") + " " + (a.hora || "");
          const fb = (b.fecha || "") + " " + (b.hora || "");
          return fb.localeCompare(fa);
        });
        setConsultas(arr);
      } catch (err) {
        setError(err?.message || "Error cargando historial");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [open, mascotaId]);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Historial clínico</DialogTitle>
        <Divider />
        <DialogContent>
          {loading ? (
            <Grid container justifyContent="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Grid>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : consultas.length === 0 ? (
            <Typography>No hay consultas asistidas para esta mascota.</Typography>
          ) : (
            <List>
              {consultas.map((c) => {
                const idVal = c.idConsulta || c.id || null;
                const fecha = c.fecha || (c.fechaHora ? String(c.fechaHora).split("T")[0] : "");
                const hora =
                  c.hora ||
                  (c.fechaHora ? (String(c.fechaHora).split("T")[1] || "").slice(0, 5) : "");
                const motivo = c.motivo || c.descripcion || "-";
                return (
                  <ListItemButton
                    key={idVal || `${fecha}-${hora}-${motivo}`}
                    onClick={() => setSelectedConsultaId(idVal)}
                  >
                    <ListItemText primary={`${fecha} ${hora}`} secondary={motivo} />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <SuiButton variant="outlined" buttonColor="secondary" onClick={onClose}>
            Cerrar
          </SuiButton>
        </DialogActions>
      </Dialog>

      {selectedConsultaId && (
        <ModalVerConsulta
          open={!!selectedConsultaId}
          onClose={() => setSelectedConsultaId(null)}
          consultaId={selectedConsultaId}
        />
      )}
    </>
  );
}
