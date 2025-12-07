/**
=========================================================
* Registrar Consulta - listado para veterinario
=========================================================
*/

import React, { useEffect, useState, useCallback } from "react";
import { useHistory } from "react-router-dom";
import Card from "@mui/material/Card";
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiButton from "components/SuiButton";
import IconButton from "@mui/material/IconButton";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import HistoryIcon from "@mui/icons-material/History";
import ModalAnotarConsulta from "./ModalAnotarConsulta";
import ModalHistorialMascota from "./ModalHistorialMascota";
import Table from "examples/Table";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import clinicApi from "api/clinic";
import styles from "layouts/tables/styles";
import petIcon from "assets/images/user.svg";

export default function RegistrarConsulta() {
  const classes = styles();
  const history = useHistory();
  const [vetId, setVetId] = useState(null);
  const [apiResource, setApiResource] = useState(null);
  const [reload, setReload] = useState(0);
  const [openAnotar, setOpenAnotar] = useState(false);
  const [selectedConsultaId, setSelectedConsultaId] = useState(null);
  const [openHistorial, setOpenHistorial] = useState(false);
  const [selectedMascotaId, setSelectedMascotaId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function resolveVet() {
      setLoading(true);
      try {
        // 1) Try dedicated endpoint (if API exposes /veterinarios/me)
        try {
          const me = await clinicApi.request("/api/clinic/veterinarios/me");
          if (!mounted) return;
          const id = me && (me.idVeterinario || me.id || me.pk);
          if (id) {
            setVetId(id);
            setApiResource(`veterinarios/${id}/consultas`);
            return;
          }
        } catch (e) {
          // ignore and continue to broader matching
        }

        // 2) Fetch authenticated user and try to match against vet lists
        const user = await clinicApi.request("/api/users/me");
        // If the authenticated user is not a veterinarian, redirect to the receptionist view
        const userRole = (user && (user.role || (user.roles && user.roles[0])) || "").toString().toLowerCase();
        if (userRole !== "veterinario") {
          // If recepcionista or other role, send them to the receptionist registro page
          try {
            history.replace("/registro-consulta");
          } catch (e) {
            // ignore if history not available
          }
          return;
        }
        if (!mounted) return;

        // Try fetching vets from multiple endpoints and merge
        let vets = [];
        try {
          const a = await clinicApi.list("veterinarios/with-availability");
          if (Array.isArray(a)) vets = vets.concat(a);
        } catch (e) {
          // ignore
        }
        try {
          const b = await clinicApi.list("veterinarios");
          if (Array.isArray(b)) vets = vets.concat(b);
        } catch (e) {
          // ignore
        }

        // de-duplicate by id if possible
        const byKey = new Map();
        vets.forEach((v) => {
          const key = v && (v.idVeterinario || v.id || v.pk || v.user?.id || v.user?.email);
          if (key) byKey.set(String(key), v);
        });
        vets = Array.from(byKey.values());

        // matching heuristics: match by nested user.id, nested user.email, vet.idVeterinario/id against user.id, or email field
        const found = vets.find((v) => {
          try {
            if (!v) return false;
            if (v.user && (String(v.user.id) === String(user.id) || String(v.user.email) === String(user.email))) return true;
            if (v.idVeterinario && String(v.idVeterinario) === String(user.id)) return true;
            if (v.id && String(v.id) === String(user.id)) return true;
            if (v.email && String(v.email).toLowerCase() === String(user.email).toLowerCase()) return true;
            return false;
          } catch (e) {
            return false;
          }
        });

        if (found) {
          const id = found.idVeterinario || found.id || found.pk;
          setVetId(id);
          setApiResource(`veterinarios/${id}/consultas`);
          return;
        }

        // 3) As a last resort: if authenticated user claims role veterinario, but no profile found,
        // try to use user.id as a fallback resource id (some APIs map user->veterinario directly)
        if (user && (String(user.role || "").toLowerCase() === "veterinario" || user.is_veterinario)) {
          const possible = user.id || user.pk || user.idVeterinario;
          if (possible) {
            setVetId(possible);
            setApiResource(`veterinarios/${possible}/consultas`);
            return;
          }
        }

        // if we reach here, we couldn't resolve the veterinarian profile: apiResource remains null
        // UI will display the 'No se encontró el perfil' message. Log for easier debugging.
        // eslint-disable-next-line no-console
        console.warn("registrar-consulta: no se pudo resolver perfil de veterinario para el usuario:", user);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error resolving veterinarian identity:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    resolveVet();
    return () => (mounted = false);
  }, []);

  // Hide IDs from the UI: do not include ID column
  const columns = [
    { name: "Fecha", align: "left" },
    { name: "Hora", align: "left" },
    { name: "Mascota", align: "left" },
    { name: "Motivo", align: "left" },
    { name: "action", align: "center" },
  ];

  const rowMapper = useCallback(
    (c) => {
      const idVal = c.idConsulta || c.id || "";
      const fecha = c.fecha || (c.fechaHora ? String(c.fechaHora).split("T")[0] : "");
      const hora =
        c.hora || (c.fechaHora ? (String(c.fechaHora).split("T")[1] || "").slice(0, 5) : "");
      const mascotaName =
        (c.mascota &&
          (c.mascota.nombre ||
            c.mascota.nombreMascota ||
            (c.mascota.user && (c.mascota.user.nombre || c.mascota.user.email)))) ||
        "-";

      // determine asistio state: 1/true -> green, 0/false -> red, null/undefined -> blue
      const asistioVal = c.asistio;
      const iconColor =
        asistioVal === 1 || asistioVal === true
          ? "success.main"
          : asistioVal === 0 || asistioVal === false
            ? "error.main"
            : "info.main";

      const mascotaIdVal =
        (c.mascota && (c.mascota.idMascota || c.mascota.id)) || c.mascota || null;

      return {
        Fecha: fecha,
        Hora: hora,
        // show just the name (remove avatar/icon per request)
        Mascota: mascotaName,
        Motivo: c.motivo || c.descripcion || "",
        action: (
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <IconButton
              size="small"
              title={
                asistioVal == null
                  ? "Anotar/Registrar (sin asistencia)"
                  : asistioVal
                    ? "Anotar/Registrar (asistió)"
                    : "Anotar/Registrar (no asistió)"
              }
              onClick={() => {
                setSelectedConsultaId(idVal);
                setOpenAnotar(true);
              }}
            >
              <NoteAddIcon fontSize="small" sx={{ color: iconColor }} />
            </IconButton>

            <IconButton
              size="small"
              title="Historial clínico"
              onClick={() => {
                if (mascotaIdVal) {
                  setSelectedMascotaId(mascotaIdVal);
                  setOpenHistorial(true);
                }
              }}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </div>
        ),
      };
    },
    [setSelectedConsultaId]
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SuiBox py={3}>
        <SuiBox mb={3}>
          <Card>
            <SuiBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
              <SuiTypography variant="h6">Registrar Consulta</SuiTypography>
              {/* Veterinarian should not create new consultas from this page */}
            </SuiBox>

            <SuiBox customClass={classes.tables_table} p={2}>
              {loading ? (
                <SuiBox display="flex" alignItems="center" justifyContent="center" py={4}>
                  <SuiTypography variant="body2" textColor="text">
                    Cargando...
                  </SuiTypography>
                </SuiBox>
              ) : apiResource ? (
                <Table
                  key={`${apiResource}?_=${reload}`}
                  columns={columns}
                  apiResource={apiResource}
                  rowMapper={rowMapper}
                />
              ) : (
                <SuiBox textAlign="center" py={6}>
                  <SuiTypography variant="h6">
                    No se encontró el perfil de veterinario
                  </SuiTypography>
                  <SuiTypography variant="body2" textColor="text">
                    Asegúrate de tener una cuenta de veterinario o contacta al administrador.
                  </SuiTypography>
                </SuiBox>
              )}
            </SuiBox>
          </Card>
        </SuiBox>
      </SuiBox>
      <Footer />
      <ModalAnotarConsulta
        open={openAnotar}
        onClose={() => {
          setOpenAnotar(false);
          setSelectedConsultaId(null);
        }}
        consultaId={selectedConsultaId}
        onSaved={() => {
          setOpenAnotar(false);
          setSelectedConsultaId(null);
          setReload((r) => r + 1);
        }}
      />
      <ModalHistorialMascota
        open={openHistorial}
        onClose={() => {
          setOpenHistorial(false);
          setSelectedMascotaId(null);
        }}
        mascotaId={selectedMascotaId}
      />
    </DashboardLayout>
  );
}
