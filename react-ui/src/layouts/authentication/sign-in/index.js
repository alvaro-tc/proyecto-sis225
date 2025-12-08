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

import { useState, useEffect } from "react";

// react-router-dom components
import { Link } from "react-router-dom";

// @mui material components
import Switch from "@mui/material/Switch";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

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

// page-only CSS for login
import "assets/theme/global-login.css";

// imagen de fondo externa temporal (veterinaria)
const curved9 =
  "https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=1350&q=80";

function SignIn() {
  const history = useHistory();
  const { setUser } = useAuth();
  const { user } = useAuth();

  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("recepcionista");
  const [error, setError] = useState(undefined);
  const [buttonText, setButtonText] = useState("Iniciar sesión");
  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  useEffect(() => {
    // add login-specific global class so `global-login.css` rules apply
    try {
      document.body.classList.add("login-global");
      const root = document.getElementById("root");
      if (root) root.classList.add("login-global");
    } catch (e) {
      // ignore (server-side rendering / test environments)
    }
    return () => {
      try {
        document.body.classList.remove("login-global");
        const root = document.getElementById("root");
        if (root) root.classList.remove("login-global");
      } catch (e) {
        // ignore
      }
    };
  }, []);

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
        role,
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
    // decide default redirect based on role. Try user object first, then decode token if needed
    function decodeJwt(t) {
      if (!t || typeof t !== "string") return null;
      try {
        const parts = t.split(".");
        if (parts.length < 2) return null;
        const payload = parts[1];
        const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const str = decodeURIComponent(
          Array.prototype.map
            .call(atob(b64), (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        return JSON.parse(str);
      } catch (e) {
        try {
          // fallback: try plain atob JSON
          const parts = t.split(".");
          const payload = parts[1];
          const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
          return JSON.parse(atob(b64));
        } catch (e2) {
          return null;
        }
      }
    }

    function resolveRoleFromUserOrToken(u, t) {
      const normalize = (s) => (s || "").toString().toLowerCase();
      if (u) {
        const r = normalize(u.role || (u.roles && u.roles[0]) || (u.user && u.user.role) || "");
        if (r) return r;
        // try common boolean flags
        if (u.is_admin || u.is_staff) return "admin";
      }
      const payload = decodeJwt(t || (u && u.token) || localStorage.getItem("token"));
      if (payload) {
        // common locations for roles
        if (payload.role) return normalize(payload.role);
        if (payload.roles && Array.isArray(payload.roles) && payload.roles.length)
          return normalize(payload.roles[0]);
        if (payload.user && payload.user.role) return normalize(payload.user.role);
        if (
          payload.realm_access &&
          Array.isArray(payload.realm_access.roles) &&
          payload.realm_access.roles.length
        )
          return normalize(payload.realm_access.roles[0]);
        if (payload.scope) return normalize(payload.scope);
      }
      return null;
    }

    const resolvedRole = resolveRoleFromUserOrToken(userObj, token);
    let target = "/profile";
    if (!userObj) target = "/authentication/sign-in";
    else if (resolvedRole === "recepcionista") target = "/registro-consulta";
    else if (resolvedRole === "veterinario" || resolvedRole === "vet") target = "/consultas";

    // Redirect to root so App's DefaultRedirect can resolve role using server-side profile
    history.push("/");
    return;
  };

  return (
    <CoverLayout
      title="Clínica Veterinaria - Inicio Sesion"
      description="Ingresa tus datos para gestionar citas y fichas de mascotas."
      color="white"
      image={"DIAGONAL_GRADIENT"}
      top={0}
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
        <SuiBox width="100%" display="flex" justifyContent="center">
          <SuiBox
            component="form"
            role="form"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "28px",
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 10px 30px rgba(22,28,45,0.12)",
            }}
          >
            <SuiBox
              mb={2}
              className="auth-cover-header-box"
              style={{ textAlign: "center", maxWidth: 480, margin: "0 auto" }}
            >
              <SuiBox mb={1} className="auth-cover-header">
                <SuiTypography variant="h5" fontWeight="medium" style={{ textAlign: "center" }}>
                  Iniciar sesión
                </SuiTypography>
              </SuiBox>
              <SuiTypography
                variant="body2"
                fontWeight="regular"
                textColor="text"
                className="auth-cover-description"
                style={{ textAlign: "center" }}
              >
                Ingrese su correo y contraseña para iniciar sesión
              </SuiTypography>
            </SuiBox>
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
            <SuiBox mb={2}>
              <SuiBox mb={1} ml={0.5}>
                <SuiTypography component="label" variant="caption" fontWeight="bold">
                  Rol
                </SuiTypography>
              </SuiBox>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                displayEmpty
                inputProps={{ "aria-label": "Without label" }}
                sx={{
                  height: "40px",
                  backgroundColor: "#fff",
                  borderRadius: "0.5rem",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#d2d6da",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#3584cf",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#3584cf",
                    borderWidth: "2px",
                  },
                  "& .MuiSelect-select": {
                    padding: "10px 12px",
                    fontSize: "0.875rem",
                    color: "#495057",
                  },
                }}
              >
                <MenuItem value="recepcionista">Recepcionista</MenuItem>
                <MenuItem value="veterinario">Veterinario</MenuItem>
              </Select>
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
              <SuiButton
                variant="gradient"
                fullWidth
                onClick={login}
                style={{ backgroundColor: "#232844", color: "#ffffff" }}
              >
                {buttonText}
              </SuiButton>
            </SuiBox>

          </SuiBox>
        </SuiBox>
      )}
    </CoverLayout>
  );
}

export default SignIn;
