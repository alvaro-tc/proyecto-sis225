import React, { useCallback } from "react";
import Card from "@mui/material/Card";
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Table from "examples/Table";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import clinicApi from "api/clinic";
import { useHistory } from "react-router-dom";

export default function ConsultasRecepcion() {
  const history = useHistory();

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
      const hora = c.hora || (c.fechaHora ? (String(c.fechaHora).split("T")[1] || "").slice(0, 5) : "");
      const mascotaName =
        (c.mascota && (c.mascota.nombre || c.mascota.nombreMascota || c.mascota.name)) || "-";

      return {
        Fecha: fecha,
        Hora: hora,
        Mascota: mascotaName,
        Motivo: c.motivo || c.descripcion || "",
        action: (
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <IconButton
              size="small"
              title="Editar"
              onClick={() => {
                history.push(`/consultas/editar/${idVal}`);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              title="Eliminar"
              onClick={async () => {
                // simple confirmation
                // eslint-disable-next-line no-restricted-globals
                if (!confirm("¿Eliminar esta consulta?")) return;
                try {
                  await clinicApi.remove("consultas", idVal);
                  // refresh by reloading the page (Table will pick up changes)
                  window.location.reload();
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.error("Error eliminando consulta:", err);
                  // eslint-disable-next-line no-alert
                  alert("Error eliminando consulta");
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        ),
      };
    },
    [history]
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SuiBox py={3}>
        <SuiBox mb={3}>
          <Card>
            <SuiBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
              <SuiTypography variant="h6">Consultas</SuiTypography>
            </SuiBox>

            <SuiBox p={2}>
              <Table columns={columns} apiResource={"consultas"} rowMapper={rowMapper} />
            </SuiBox>
          </Card>
        </SuiBox>
      </SuiBox>
      <Footer />
    </DashboardLayout>
  );
}
