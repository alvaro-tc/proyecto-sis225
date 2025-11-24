import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Divider,
} from "@mui/material";
import SuiButton from "components/SuiButton";

export default function ModalEliminarVeterinario({ open, onClose, onConfirm, item }) {
  const name = item?.nombre || item?.user?.nombre || item?.email || "este veterinario";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Confirmar eliminación</DialogTitle>
      <Divider />
      <DialogContent>
        <Typography variant="body1" sx={{ mt: 1 }}>
          ¿Estás seguro que deseas eliminar a <strong>{name}</strong>? Esta acción no se puede deshacer.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <SuiButton variant="outlined" buttonColor="secondary" onClick={onClose} sx={{ minWidth: 100 }}>
          Cancelar
        </SuiButton>
        <SuiButton
          variant="gradient"
          buttonColor="error"
          onClick={() => onConfirm && onConfirm(item)}
          sx={{ minWidth: 100 }}
        >
          Eliminar
        </SuiButton>
      </DialogActions>
    </Dialog>
  );
}
