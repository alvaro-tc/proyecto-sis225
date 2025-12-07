/**
=========================================================
* Soft UI Dashboard React - v2.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-material-ui
* Copyright 2021 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
import React, { useEffect, useState } from "react";
import AuthApi from "../../../api/auth";
import { useHistory } from "react-router-dom";
import { useAuth } from "../../../auth-context/auth.context";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import SuiButton from "components/SuiButton";
import SuiTypography from "components/SuiTypography";
import SuiBox from "components/SuiBox";

function SignOut() {
  const history = useHistory();
  const { setUser } = useAuth();
  let { user } = useAuth();
  const [open, setOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await AuthApi.Logout(user);
      await setUser(null);
      localStorage.removeItem("user");
      history.push("/authentication/sign-in");
    } catch (e) {
      // Force logout even if API fails
      await setUser(null);
      localStorage.removeItem("user");
      history.push("/authentication/sign-in");
    }
  };

  const handleCancel = () => {
    setOpen(false);
    // Go back to previous page or dashboard
    history.goBack();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle id="alert-dialog-title">
        {"Cerrar sesión"}
      </DialogTitle>
      <DialogContent>
        <SuiBox>
          <SuiTypography variant="body2" textColor="text">
            ¿Estás seguro de que deseas cerrar sesión?
          </SuiTypography>
        </SuiBox>
      </DialogContent>
      <DialogActions>
        <SuiButton onClick={handleCancel} variant="outlined" buttonColor="secondary">
          Cancelar
        </SuiButton>
        <SuiButton onClick={handleLogout} variant="gradient" buttonColor="dark" autoFocus>
          Confirmar
        </SuiButton>
      </DialogActions>
    </Dialog>
  );
}

export default SignOut;
