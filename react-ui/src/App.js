/**
=========================================================
* Soft UI Dashboard React - v2.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-material-ui
* Copyright 2021 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect, useMemo } from "react";

// react-router components
import { Route, Switch, Redirect, useLocation } from "react-router-dom";

// jss components
import { create } from "jss";

// jss-rtl components
import rtl from "jss-rtl";

// @mui style components
import { StylesProvider, jssPreset } from "@mui/styles";

// @mui material components
import { ThemeProvider, StyledEngineProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard PRO React components
import SuiBox from "components/SuiBox";

// Soft UI Dashboard PRO React example components
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";

// Soft UI Dashboard PRO React themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";

// Soft UI Dashboard PRO React routes
import routes from "routes";

// Soft UI Dashboard PRO React contexts
import { useSoftUIController } from "context";

import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "auth-context/auth.context";
import clinicApi from "api/clinic";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

function DefaultRedirect() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resolvedPath, setResolvedPath] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function resolve() {
      try {
        // If no user at all, go to sign-in
        if (!user) {
          setResolvedPath("/authentication/sign-in");
          return;
        }

        // helper to normalize role
        const normalize = (s) => (s || "").toString().toLowerCase();
        const roleFromUser = normalize(user.role || (user.roles && user.roles[0]) || "");
        if (roleFromUser) {
          if (!mounted) return;
          if (roleFromUser === "recepcionista") setResolvedPath("/registro-consulta");
          else if (roleFromUser === "veterinario" || roleFromUser === "vet")
            setResolvedPath("/consultas");
          else setResolvedPath("/profile");
          return;
        }

        // no role present locally; try fetching server-side profile
        setLoading(true);
        const me = await clinicApi.request("/api/users/me", { method: "GET" });
        if (!mounted) return;
        const serverRole = normalize(me.role || (me.roles && me.roles[0]) || "");
        if (serverRole === "recepcionista") setResolvedPath("/registro-consulta");
        else if (serverRole === "veterinario" || serverRole === "vet")
          setResolvedPath("/consultas");
        else setResolvedPath("/profile");
      } catch (e) {
        if (!mounted) return;
        setResolvedPath("/authentication/sign-in");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    resolve();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading || !resolvedPath) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return <Redirect to={resolvedPath} />;
}

export default function App() {
  const [controller, dispatch] = useSoftUIController();
  const { direction, layout, openConfigurator } = controller;
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();
  const { user } = useAuth();

  const getDefaultPathForUser = (u) => {
    try {
      // try to resolve from user object first
      if (!u) return "/authentication/sign-in";
      const normalize = (s) => (s || "").toString().toLowerCase();
      const roleFromUser = normalize(
        u.role || (u.roles && u.roles[0]) || (u.user && u.user.role) || ""
      );
      if (roleFromUser) {
        if (roleFromUser === "recepcionista") return "/registro-consulta";
        if (roleFromUser === "veterinario" || roleFromUser === "vet") return "/consultas";
        return "/profile";
      }
      // fallback: try decoding token from user.token or localStorage
      try {
        const token = (u && u.token) || localStorage.getItem("token");
        if (token) {
          const parts = token.split(".");
          if (parts.length >= 2) {
            const payload = parts[1];
            const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
            let parsed = null;
            try {
              parsed = JSON.parse(atob(b64));
            } catch (e) {
              try {
                const str = decodeURIComponent(
                  Array.prototype.map
                    .call(atob(b64), (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
                );
                parsed = JSON.parse(str);
              } catch (e2) {
                parsed = null;
              }
            }
            if (parsed) {
              const r = normalize(
                parsed.role ||
                  (parsed.roles && parsed.roles[0]) ||
                  (parsed.user && parsed.user.role) ||
                  (parsed.realm_access &&
                    parsed.realm_access.roles &&
                    parsed.realm_access.roles[0]) ||
                  parsed.scope ||
                  ""
              );
              if (r === "recepcionista") return "/registro-consulta";
              if (r === "veterinario" || r === "vet") return "/consultas";
            }
          }
        }
      } catch (e) {
        // ignore
      }
      return "/profile";
    } catch (e) {
      return "/authentication/sign-in";
    }
  };

  const defaultPath = getDefaultPathForUser(user);

  // JSS presets for the rtl
  const jss = create({
    plugins: [...jssPreset().plugins, rtl()],
  });

  // Cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      prepend: true,
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => {
    dispatch({ type: "OPEN_CONFIGURATOR", value: !openConfigurator });
  };

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        if (route.protected) {
          return <ProtectedRoute path={route.route} component={route.component} key={route.key} />;
        }
        return <Route exact path={route.route} component={route.component} key={route.key} />;
      }

      return null;
    });

  // configsButton removed (no floating settings icon)

  return direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <StylesProvider jss={jss}>
        <ThemeProvider theme={themeRTL}>
          <CssBaseline />
          {layout === "dashboard" && (
            <>
              <Sidenav routes={routes} />
              <Configurator />
              {configsButton}
            </>
          )}
          {layout === "vr" && <Configurator />}
          <Switch>
            {getRoutes(routes)}
            <Route path="*">
              <DefaultRedirect />
            </Route>
          </Switch>
        </ThemeProvider>
      </StylesProvider>
    </CacheProvider>
  ) : (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {layout === "dashboard" && (
          <>
            <Sidenav routes={routes} />
            <Configurator />
          </>
        )}
        {layout === "vr" && <Configurator />}
        <Switch>
          {getRoutes(routes)}
          <Route path="*">
            <DefaultRedirect />
          </Route>
        </Switch>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
