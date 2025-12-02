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

export default function ModalEliminarMascota({ open, onClose, onConfirm, item, errorMessage }) {
  const name = item?.nombre || "esta mascota";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{errorMessage ? "No es posible eliminar" : "Confirmar eliminación"}</DialogTitle>
      <Divider />
      <DialogContent>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {errorMessage ? (
            <>
              <strong>{name}</strong> no se puede eliminar porque está vinculada a una o más citas
              médicas.
              <br />
              {errorMessage}
            </>
          ) : (
            <>
              ¿Estás seguro que deseas eliminar a <strong>{name}</strong>? Esta acción no se puede
              deshacer.
            </>
          )}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <SuiButton
          variant="outlined"
          buttonColor="secondary"
          onClick={onClose}
          sx={{ minWidth: 100 }}
        >
          Cerrar
        </SuiButton>
        {!errorMessage && (
          <SuiButton
            variant="gradient"
            buttonColor="error"
            onClick={() => onConfirm && onConfirm(item)}
            sx={{ minWidth: 100 }}
          >
            Eliminar
          </SuiButton>
        )}
      </DialogActions>
    </Dialog>
  );
}
