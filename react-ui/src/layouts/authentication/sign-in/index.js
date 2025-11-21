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
import Switch from "@mui/material/Switch";

// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiInput from "components/SuiInput";
import SuiButton from "components/SuiButton";

// Authentication layout components
import CoverLayout from "layouts/authentication/components/CoverLayout";

// Images
import { useAuth } from "../../../auth-context/auth.context";
import AuthApi from "../../../api/auth";

import { useHistory } from "react-router-dom";

// imagen de fondo externa temporal (veterinaria)
const curved9 = "https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=1350&q=80";

function SignIn() {
  const history = useHistory();
  const { setUser } = useAuth();
  const { user } = useAuth();

  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(undefined);
  const [buttonText, setButtonText] = useState("Iniciar sesión");
  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  const login = async (event) => {
    if (event) {
      event.preventDefault();
    }
    if (user && user.token) {
      return history.push("/dashboard");
    }
    if (email === "") {
      return setError("You must enter your email.");
    }
    if (password === "") {
      return setError("You must enter your password");
    }
    setButtonText("Signing in");
    try {
      let response = await AuthApi.Login({
        email,
        password,
      });
      if (response.data && response.data.success === false) {
        return setError(response.data.msg);
      }
      return setProfile(response);
    } catch (err) {
      console.log(err);
      setButtonText("Sign in");
      if (err.response) {
        return setError(err.response.data.msg);
      }
      return setError("There has been an error.");
    }
  };

  const setProfile = async (response) => {
    let userObj = { ...response.data.user };
    const token = response.data.token;
    userObj.token = token;
    const userStr = JSON.stringify(userObj);
    setUser(userStr);
    localStorage.setItem("user", userStr);
    // Also store token separately for API clients that read `localStorage.token`
    if (token) {
      localStorage.setItem("token", token);
      // log token for debugging (remove in production)
      // eslint-disable-next-line no-console
      console.log("[Auth] stored token:", token);
    }
    // also log the saved localStorage values for debugging
    try {
      // eslint-disable-next-line no-console
      console.log("[Auth] localStorage.token =", localStorage.getItem("token"));
      // eslint-disable-next-line no-console
      console.log("[Auth] localStorage.user =", localStorage.getItem("user"));
    } catch (e) {
      // ignore
    }
    return history.push("/dashboard");
  };

  return (
    <CoverLayout
      title="Clínica Veterinaria - Iniciar sesión"
      description={`${user && user.token ? "" : "Ingrese su correo y contraseña para iniciar sesión"}`}
      image={curved9}
    >
      {user && user.token ? (
        <div>
          <h3 style={{ textAlign: "center" }}>You are already signed in.</h3>
          <SuiBox mt={4} mb={1}>
            <SuiButton variant="gradient" buttonColor="info" fullWidth onClick={login}>
              {`Let's go`}
            </SuiButton>
          </SuiBox>
        </div>
      ) : (
        <SuiBox component="form" role="form">
          <SuiBox mb={2}>
            <SuiBox mb={1} ml={0.5}>
              <SuiTypography component="label" variant="caption" fontWeight="bold">
                Correo
              </SuiTypography>
            </SuiBox>
            <SuiInput
              defaultValue={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(undefined);
              }}
              type="email"
              placeholder="Correo"
            />
          </SuiBox>
          <SuiBox mb={2}>
            <SuiBox mb={1} ml={0.5}>
              <SuiTypography component="label" variant="caption" fontWeight="bold">
                Contraseña
              </SuiTypography>
            </SuiBox>
            <SuiInput
              defaultValue={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(undefined);
              }}
              type="password"
              placeholder="Contraseña"
            />
          </SuiBox>
          <SuiBox display="flex" alignItems="center">
            <Switch checked={rememberMe} onChange={handleSetRememberMe} />
            <SuiTypography
              variant="button"
              fontWeight="regular"
              onClick={handleSetRememberMe}
              customClass="cursor-pointer user-select-none"
            >
              &nbsp;&nbsp;Recordarme
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
            <SuiButton variant="gradient" buttonColor="info" fullWidth onClick={login}>
              {buttonText}
            </SuiButton>
          </SuiBox>
          <SuiBox mt={3} textAlign="center">
            <SuiTypography variant="button" textColor="text" fontWeight="regular">
              ¿No tienes cuenta?{" "}
              <SuiTypography
                component={Link}
                to="/authentication/sign-up"
                variant="button"
                textColor="info"
                fontWeight="medium"
                textGradient
              >
                Regístrate
              </SuiTypography>
            </SuiTypography>
          </SuiBox>
        </SuiBox>
      )}
    </CoverLayout>
  );
}

export default SignIn;
