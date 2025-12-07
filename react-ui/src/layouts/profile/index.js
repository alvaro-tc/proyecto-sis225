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
import Divider from "@mui/material/Divider";

// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";

// Soft UI Dashboard React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import Footer from "examples/Footer";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";
import api from "api/clinic";
import ModalEditarPerfil from "./ModalEditarPerfil";
import ModalVerConsulta from "./ModalVerConsulta";

// Overview page components
import Header from "layouts/profile/components/Header";

// Images removed as they are no longer used

function Overview() {
  // Temporal: interceptar y bloquear llamadas a LaunchDarkly
  useEffect(() => {
    const blockedHost = "events.launchdarkly.com";
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      try {
        const url = typeof input === "string" ? input : input?.url || "";
        if (url && url.includes(blockedHost)) {
          return new Response(null, { status: 204, statusText: "No Content" });
        }
      } catch (e) { }
      return originalFetch(input, init);
    };
    /* ... skipped full interceptor for brevity, but keeping essential logic if needed ... */
    return () => { window.fetch = originalFetch; };
  }, []);

  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [viewConsultaOpen, setViewConsultaOpen] = useState(false);
  const [viewConsultaId, setViewConsultaId] = useState(null);

  const fetchSummary = () => {
    let mounted = true;
    setLoadingSummary(true);
    api
      .request("/api/users/me", { method: "GET" })
      .then((data) => {
        if (!mounted) return;
        setSummary(data);
      })
      .catch((err) => {
        console.warn("Error fetching authenticated user:", err);
        if (mounted) setSummaryError(err);
      })
      .finally(() => {
        if (mounted) setLoadingSummary(false);
      });
    return () => { mounted = false; };
  };

  useEffect(() => {
    const cleanup = fetchSummary();
    return cleanup;
  }, []);

  function getProfileName(summary) {
    if (!summary) return undefined;
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
      summary?.dueno?.avatar ||
      summary?.dueno?.foto ||
      summary?.veterinario?.avatar ||
      summary?.veterinario?.foto ||
      undefined
    );
  }

  return (
    <DashboardLayout>
      <Header
        name={getProfileName(summary)}
        role={summary?.role || "Usuario"}
        avatar={getProfileAvatar(summary)}
      />
      <SuiBox mt={5} mb={3}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={6} xl={4}>
            {(() => {
              const info = {
                "Nombre Completo": getProfileName(summary) || summary?.nombre || "-",
                "Email": summary?.email || summary?.user?.email || "-",
                "Teléfono": summary?.telefono || "-",
              };

              return (
                <ProfileInfoCard
                  title="Información Personal"
                  description=""
                  info={info}
                  action={{ onClick: () => setEditProfileOpen(true), tooltip: "Editar perfil" }}
                  shadow={false}
                />
              );
            })()}
          </Grid>
        </Grid>
      </SuiBox>

      <ModalEditarPerfil
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onSaved={() => {
          setEditProfileOpen(false);
          fetchSummary();
        }}
      />
      <ModalVerConsulta
        open={viewConsultaOpen}
        onClose={() => setViewConsultaOpen(false)}
        consultaId={viewConsultaId}
      />
      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
