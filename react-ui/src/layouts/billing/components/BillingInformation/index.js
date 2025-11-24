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

// @mui material components
import Card from "@mui/material/Card";

// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiButton from "components/SuiButton";

// Billing page components
import Bill from "layouts/billing/components/Bill";
import ModalCrearConsulta from "layouts/billing/components/ModalCrearConsulta";
import ModalEditarConsulta from "layouts/billing/components/ModalEditarConsulta";
import { useEffect, useState } from "react";
import clinicApi from "api/clinic";


function BillingInformation() {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchConsultas = () => {
    setLoading(true);
    setError(null);
    clinicApi
      .request("/api/clinic/consultas", { method: "GET" })
      .then((data) => {
        setConsultas(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Error fetching consultas:", err);
        setError(err?.message || "Error cargando consultas");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConsultas();
  }, []);

  const handleDelete = async (consulta) => {
    if (!consulta) return;
    try {
      await clinicApi.request(`/api/clinic/consultas/${consulta.idConsulta || consulta.id}`, { method: "DELETE" });
      fetchConsultas();
    } catch (err) {
      console.error("Error deleting consulta:", err);
    }
  };

  const handleEdit = (consulta) => {
    setEditId(consulta.idConsulta || consulta.id);
    setOpenEdit(true);
  };

  return (
    <Card id="consultas-card">
      <SuiBox pt={2} px={2} display="flex" justifyContent="space-between" alignItems="center">
        <SuiTypography variant="h6" fontWeight="medium">
          Tus Consultas
        </SuiTypography>
        <SuiButton variant="gradient" buttonColor="dark" onClick={() => setOpenCreate(true)}>
          Agregar consulta
        </SuiButton>
      </SuiBox>
      <SuiBox pt={1} pb={2} px={2}>
        <SuiBox component="ul" display="flex" flexDirection="column" p={0} m={0}>
          {loading ? (
            <SuiTypography variant="body2">Cargando consultas...</SuiTypography>
          ) : consultas && consultas.length > 0 ? (
            consultas.map((c, idx) => (
              <Bill key={c.idConsulta || c.id || idx} consulta={c} onEdit={handleEdit} onDelete={handleDelete} noGutter={idx === consultas.length - 1} />
            ))
          ) : (
            <SuiTypography variant="body2">No hay consultas registradas.</SuiTypography>
          )}
        </SuiBox>
      </SuiBox>

      <ModalCrearConsulta open={openCreate} onClose={() => setOpenCreate(false)} onSaved={() => { setOpenCreate(false); fetchConsultas(); }} />
      <ModalEditarConsulta open={openEdit} onClose={() => setOpenEdit(false)} consultaId={editId} onSaved={() => { setOpenEdit(false); fetchConsultas(); }} />
    </Card>
  );
}

export default BillingInformation;
