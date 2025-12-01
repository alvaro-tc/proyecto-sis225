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

import { useState } from "react";

// react-router-dom components
import { Link } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";

// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiInput from "components/SuiInput";
import SuiButton from "components/SuiButton";

// Authentication layout components
import BasicLayout from "layouts/authentication/components/BasicLayout";
import Separator from "layouts/authentication/components/Separator";

// Images
import AuthApi from "../../../api/auth";
import { useHistory } from "react-router-dom";
// no background image for sign-up; global diagonal background will show

function SignUp() {
  const history = useHistory();
  const [agreement, setAgremment] = useState(true);
  const [firstName, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [buttonText, setButtonText] = useState("Registrarse");
  const [error, setError] = useState(undefined);

  const handleSetAgremment = () => setAgremment(!agreement);

  const register = async (event) => {
    if (event) {
      event.preventDefault();
    }
    if (firstName === "") {
      return setError("Debes ingresar tu nombre.");
    }
    if (email === "") {
      return setError("Debes ingresar tu correo.");
    }
    if (password === "") {
      return setError("Debes ingresar una contraseña.");
    }
    try {
      setButtonText("Registrando...");
      const response = await AuthApi.Register({
        username: firstName,
        email,
        password,
      });
      // assume success when response.status in 200-299
      if (response && response.data && response.data.success === false) {
        setButtonText("Registrarse");
        return setError(response.data.msg || "Error en el registro.");
      }
      return history.push("/authentication/sign-in");
    } catch (err) {
      console.log(err);
      setButtonText("Registrarse");
      if (err.response && err.response.data) {
        return setError(err.response.data.msg || "Error en el servidor.");
      }
      return setError("Ha ocurrido un error. Intenta de nuevo.");
    }
  };

  return (
    <BasicLayout
      title="Clínica Veterinaria - Registro"
      description="Crea una cuenta para gestionar citas y fichas de mascotas."
      image={""}
    >
      <Card>
        <SuiBox p={3} mb={1} textAlign="center">
          <SuiTypography variant="h5" fontWeight="medium">
            Crear cuenta
          </SuiTypography>
        </SuiBox>
        <Separator />
        <SuiBox pt={2} pb={3} px={3}>
          <SuiBox component="form" role="form">
            <SuiBox mb={2}>
              <SuiInput
                onChange={(event) => {
                  setName(event.target.value);
                  setError(undefined);
                }}
                placeholder="Nombre"
              />
            </SuiBox>
            <SuiBox mb={2}>
              <SuiInput
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(undefined);
                }}
                type="email"
                placeholder="Correo"
              />
            </SuiBox>
            <SuiBox mb={2}>
              <SuiInput
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(undefined);
                }}
                type="password"
                placeholder="Contraseña"
              />
            </SuiBox>
            <SuiBox display="flex" alignItems="center">
              <Checkbox checked={agreement} onChange={handleSetAgremment} />
              <SuiTypography
                variant="button"
                fontWeight="regular"
                onClick={handleSetAgremment}
                customClass="cursor-pointer user-select-none"
              >
                &nbsp;&nbsp;Acepto los&nbsp;
              </SuiTypography>
              <SuiTypography component="a" href="#" variant="button" fontWeight="bold" textGradient>
                Terms and Conditions
              </SuiTypography>
            </SuiBox>
            <SuiBox mt={2} mb={2} textAlign="center">
              <h6
                style={{
                  fontSize: ".8em",
                  color: "red",
                  textAlign: "center",
                  fontWeight: 400,
                  transition: ".2s all",
                }}
              >
                {error}
              </h6>
            </SuiBox>
            <SuiBox mt={4} mb={1}>
              <SuiButton onClick={register} variant="gradient" buttonColor="dark" fullWidth>
                {buttonText}
              </SuiButton>
            </SuiBox>
            <SuiBox mt={3} textAlign="center">
              <SuiTypography variant="button" textColor="text" fontWeight="regular">
                ¿Ya tienes cuenta?&nbsp;
                <SuiTypography
                  component={Link}
                  to="/authentication/sign-in"
                  variant="button"
                  textColor="dark"
                  fontWeight="bold"
                  textGradient
                >
                  Iniciar sesión
                </SuiTypography>
              </SuiTypography>
            </SuiBox>
          </SuiBox>
        </SuiBox>
      </Card>
    </BasicLayout>
  );
}

export default SignUp;
