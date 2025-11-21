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

// @mui material components
import React, { useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";

// Soft UI Dashboard React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import Footer from "examples/Footer";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";
import ProfilesList from "examples/ProfilesList";

// Overview page components
import Header from "layouts/profile/components/Header";
// PlatformSettings removed from layout (not necessary)

// Data
import profilesListData from "layouts/profile/data/profilesListData";

// Images (projects removed)

function Overview() {
  // Temporal: interceptar y bloquear llamadas a LaunchDarkly (events.launchdarkly.com)
  // para que la página de perfil no haga llamadas externas innecesarias.
  useEffect(() => {
    const blockedHost = "events.launchdarkly.com";

    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      try {
        const url = typeof input === "string" ? input : input?.url || "";
        if (url && url.includes(blockedHost)) {
          // devolver una respuesta vacía sin realizar la petición externa
          return new Response(null, { status: 204, statusText: "No Content" });
        }
      } catch (e) {}
      return originalFetch(input, init);
    };

    const XHR = window.XMLHttpRequest;
    const origOpen = XHR.prototype.open;
    const origSend = XHR.prototype.send;

    XHR.prototype.open = function (method, url, async, user, password) {
      try {
        this._ld_url = typeof url === "string" ? url : "";
      } catch (e) {
        this._ld_url = "";
      }
      return origOpen.apply(this, arguments);
    };

    XHR.prototype.send = function (body) {
      try {
        if (this._ld_url && this._ld_url.includes(blockedHost)) {
          // simular finalización sin enviar la petición
          this.readyState = 4;
          this.status = 204;
          this.onreadystatechange && this.onreadystatechange();
          this.onload && this.onload();
          return;
        }
      } catch (e) {}
      return origSend.apply(this, arguments);
    };

    return () => {
      // restaurar originales al desmontar la página
      try {
        window.fetch = originalFetch;
        XHR.prototype.open = origOpen;
        XHR.prototype.send = origSend;
      } catch (e) {}
    };
  }, []);

  return (
    <DashboardLayout>
      <Header />
      <SuiBox mt={5} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} xl={4}>
            <ProfileInfoCard
              title="Información de perfil"
              description="Detalle del usuario y preferencias de la clínica."
              info={{
                fullName: "Nombre Apellido",
                mobile: "",
                email: "",
                location: "",
              }}
              action={{ route: "", tooltip: "Editar perfil" }}
            />
          </Grid>
          <Grid item xs={12} md={6} xl={4}>
            <ProfilesList title="conversations" profiles={profilesListData} />
          </Grid>
        </Grid>
      </SuiBox>
      {/* Projects section removed to simplify profile page */}

      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
