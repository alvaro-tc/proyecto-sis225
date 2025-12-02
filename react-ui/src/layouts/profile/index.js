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
import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";


// Soft UI Dashboard React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import Footer from "examples/Footer";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";
import SuiButton from "components/SuiButton";
import clinicApi from "api/clinic";
import ModalEditarPerfil from "./ModalEditarPerfil";
import ModalVerConsulta from "./ModalVerConsulta";

// Overview page components
import Header from "layouts/profile/components/Header";
// PlatformSettings removed from layout (not necessary)

// Data


// Images (projects removed)
import petsIcon from "assets/images/pets.svg";

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
  // fetch profile summary at Overview level and pass to Header/ProfileSummary
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [viewConsultaOpen, setViewConsultaOpen] = useState(false);
  const [viewConsultaId, setViewConsultaId] = useState(null);

  const fetchSummary = () => {
    let mounted = true;
    setLoadingSummary(true);
    clinicApi
      .request("/api/users/me", { method: "GET" })
      .then((data) => {
        if (!mounted) return;
        console.debug("Fetched authenticated user:", data);
        setSummary(data);
      })
      .catch((err) => {
        console.warn("Error fetching authenticated user:", err);
        if (mounted) setSummaryError(err);
      })
      .finally(() => {
        if (mounted) setLoadingSummary(false);
      });
    return () => {
      mounted = false;
    };
  };

  useEffect(() => {
    const cleanup = fetchSummary();
    return cleanup;
  }, []);

  function ProfileSummary({ summary, loading, error }) {

        return (
          <SuiBox mt={5} mb={3}>
            <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} md={10} xl={8}>
                {(() => {
                  // Build info object with nicer labels and hide work fields for 'recepcionista'
                  const info = {};
                  info["Rol"] = summary?.role || "-";
                  info["Email"] = summary?.email || summary?.user?.email || "-";
                  info["Nombre"] = summary?.nombre || summary?.user?.name || "-";
                  info["Teléfono"] = summary?.telefono || "-";
                  if (typeof summary?.profile_id !== "undefined") info["Profile ID"] = summary?.profile_id ?? "-";

                  const isRecepcionista = String((summary?.role || "")).toLowerCase() === "recepcionista";
                  if (!isRecepcionista) {
                    // only show work schedule fields for non-receptionists
                    info["Hora inicio"] = summary?.work_start || "-";
                    info["Hora fin"] = summary?.work_end || "-";
                    info["Días de trabajo"] = summary?.work_days || "-";
                  }

                  return (
                    <ProfileInfoCard
                      title="Perfil"
                      description={summary ? "Perfil del usuario autenticado" : "Detalle del usuario"}
                      info={info}
                      action={{ onClick: () => setEditProfileOpen(true), tooltip: "Editar perfil" }}
                    />
                  );
                })()}
              </Grid>
            </Grid>
          </SuiBox>
        );
      }

      function getImageForEspecie(especie) {
        // Return imported petsIcon for consistency
        return petsIcon;
      }

      function ProfileLoadingCard({ title }) {
        return (
          <Card className="h-100">
            <SuiBox pt={2} px={2}>
              <SuiTypography variant="h6" fontWeight="medium">
                {title}
              </SuiTypography>
            </SuiBox>
            <SuiBox p={2}>
              <SuiTypography variant="body2" textColor="text">
                Cargando...
              </SuiTypography>
            </SuiBox>
          </Card>
        );
      }

  function getProfileName(summary) {
    if (!summary) return undefined;
    // try common places for name across roles
    return (
      summary?.dueno?.nombre ||
      summary?.veterinario?.nombre ||
      summary?.recepcionista?.nombre ||
      summary?.user?.name ||
      summary?.user?.email ||
      summary?.nombre ||
      undefined
    );
  }

  function getProfileAvatar(summary) {
    return (
      summary?.dueno?.avatar || summary?.dueno?.foto || summary?.veterinario?.avatar || summary?.veterinario?.foto || undefined
    );
  }

  return (
    <DashboardLayout>
      <Header name={getProfileName(summary)} role={summary?.role} avatar={getProfileAvatar(summary)} />
      <SuiBox py={3}>
        <ProfileSummary summary={summary} loading={loadingSummary} error={summaryError} />
      </SuiBox>
      <ModalEditarPerfil
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onSaved={() => {
          setEditProfileOpen(false);
          fetchSummary();
        }}
      />
      <ModalVerConsulta open={viewConsultaOpen} onClose={() => setViewConsultaOpen(false)} consultaId={viewConsultaId} />
      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
