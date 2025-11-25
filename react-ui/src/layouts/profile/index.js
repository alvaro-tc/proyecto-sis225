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
import ProfilesList from "examples/ProfilesList";
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
      .list("duenos/me/summary")
      .then((data) => {
        if (!mounted) return;
        console.log("Fetched profile summary:", data);
        setSummary(data);
      })
      .catch((err) => {
        console.warn("Error fetching profile summary:", err);
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

        // helper to map mascota to ProfilesList shape (use imported petsIcon)
        const mapMascotas = (mascotas = []) =>
          mascotas.map((m) => ({
            image: petsIcon,
            name: m.nombre || "-",
            description: `${m.especie || "-"}${m.raza ? ` · ${m.raza}` : ""}`,
            action: { type: "internal", route: `#/clinic/mascotas/${m.idMascota || m.id || ""}`, color: "info", label: "ver" },
          }));

        const mapCitas = (citas = []) =>
          citas.map((c) => {
            // format date dd-mm-yyyy
            const rawDate = c.fecha || "";
            let formatted = rawDate;
            try {
              const d = new Date(rawDate);
              if (!Number.isNaN(d.getTime())) {
                const dd = String(d.getDate()).padStart(2, "0");
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const yyyy = d.getFullYear();
                formatted = `${dd}-${mm}-${yyyy}`;
              }
            } catch (e) {}

            const hora = c.hora || "";
            const mascotaName = c.mascota?.nombre || (typeof c.mascota === "string" ? c.mascota : "-");

            return {
              image: "",
              name: `Consulta para ${formatted}`,
              description: `Hora: ${hora} · Mascota: ${mascotaName}`,
              action: {
                type: "callback",
                onClick: () => {
                  setViewConsultaId(c.idConsulta || c.id || null);
                  setViewConsultaOpen(true);
                },
                color: "info",
                label: "ver",
              },
            };
          });

        return (
          <SuiBox mt={5} mb={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6} xl={4}>
                <ProfileInfoCard
                  title="Perfil"
                  description={summary?.profile ? "Perfil del usuario" : "Detalle del usuario"}
                  info={{
                    "Nombre completo": summary?.dueno?.nombre || "Nombre Apellido",
                    Teléfono: summary?.dueno?.telefono || "",
                    Email: summary?.dueno?.user?.email || "",
                  }}
                  action={{ onClick: () => setEditProfileOpen(true), tooltip: "Editar perfil" }}
                />
              </Grid>

              <Grid item xs={12} md={6} xl={4}>
                {loading ? (
                    <ProfileLoadingCard title="Mascotas" />
                  ) : summary?.mascotas && summary.mascotas.length > 0 ? (
                    (() => {
                      const mascotasToShow = (summary.mascotas || []).slice(0, 4);
                      return (
                        <Card className="h-100">
                          <SuiBox pt={2} px={2} display="flex" alignItems="center" justifyContent="space-between">
                            <SuiTypography variant="h6" fontWeight="medium">
                              Mascotas
                            </SuiTypography>
                            <SuiButton component="a" href="/mascotas" variant="text" buttonColor="info">
                              Ver más
                            </SuiButton>
                          </SuiBox>
                          <SuiBox p={2}>
                            <SuiBox component="ul" display="flex" flexDirection="column" p={0} m={0}>
                              {mapMascotas(mascotasToShow).map(({ image, name, description, action }) => (
                                <SuiBox key={name} component="li" display="flex" alignItems="center" py={1} mb={1}>
                                  <SuiBox mr={2}>
                                    <img src={image || petsIcon} alt={name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
                                  </SuiBox>
                                  <SuiBox display="flex" flexDirection="column" alignItems="flex-start" justifyContent="center">
                                    <SuiTypography variant="button" fontWeight="medium">
                                      {name}
                                    </SuiTypography>
                                    <SuiTypography variant="caption" textColor="text">
                                      {description}
                                    </SuiTypography>
                                  </SuiBox>
                                  {/* action removed for inline mascotas list */}
                                </SuiBox>
                              ))}
                            </SuiBox>
                          </SuiBox>
                        </Card>
                      );
                    })()
                  ) : (
                  <Card className="h-100">
                    <SuiBox pt={2} px={2}>
                      <SuiTypography variant="h6" fontWeight="medium">
                        Mascotas
                      </SuiTypography>
                    </SuiBox>
                    <SuiBox p={2}>
                          <SuiTypography variant="body2" textColor="text">
                            Aún no tienes mascotas registradas.
                          </SuiTypography>
                          <SuiBox mt={2}>
                            <SuiButton component="a" href="/mascotas" variant="gradient" buttonColor="dark">
                              Agregar mascota
                            </SuiButton>
                          </SuiBox>
                        </SuiBox>
                  </Card>
                )}
              </Grid>

              <Grid item xs={12} md={6} xl={4}>
                {loading ? (
                  <ProfileLoadingCard title="Citas próximas" />
                ) : summary?.citas && summary.citas.length > 0 ? (
                  <ProfilesList title="Citas próximas" profiles={mapCitas((summary.citas || []).slice(0, 4))} />
                ) : (
                  <Card className="h-100">
                    <SuiBox pt={2} px={2}>
                      <SuiTypography variant="h6" fontWeight="medium">
                        Citas próximas
                      </SuiTypography>
                    </SuiBox>
                    <SuiBox p={2}>
                      <SuiTypography variant="body2" textColor="text">
                        No hay consultas disponibles.
                      </SuiTypography>
                    </SuiBox>
                  </Card>
                )}
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
