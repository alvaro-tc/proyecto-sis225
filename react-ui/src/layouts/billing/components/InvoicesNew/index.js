/**
* Invoices (past citas) - custom component
*/

// @mui material components
import Card from "@mui/material/Card";

// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiButton from "components/SuiButton";

import React, { useEffect, useState } from "react";
import clinicApi from "api/clinic";
import ModalVerConsulta from "layouts/profile/ModalVerConsulta";

function formatDateShort(rawDate) {
  if (!rawDate) return "";
  try {
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return rawDate;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) {
    return rawDate;
  }
}

export default function InvoicesNew() {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    clinicApi
      .request("/api/clinic/duenos/me/past-citas", { method: "GET" })
      .then((data) => {
        if (!mounted) return;
        setRecent(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Error fetching past citas:", err);
        if (mounted) setRecent([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  return (
    <>
      <Card id="historial-consultas">
        <SuiBox pt={2} px={2} display="flex" justifyContent="space-between" alignItems="center">
          <SuiTypography variant="h6" fontWeight="medium">
            Historial consultas
          </SuiTypography>
        </SuiBox>
        <SuiBox p={2}>
          <SuiBox component="ul" display="flex" flexDirection="column" p={0} m={0}>
            {loading ? (
              <SuiTypography variant="body2">Cargando...</SuiTypography>
            ) : recent && recent.length > 0 ? (
              recent.map((c, idx) => (
                <SuiBox
                  key={c.idConsulta || c.id || idx}
                  component="li"
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  py={1}
                  pr={1}
                  mb={idx === recent.length - 1 ? 0 : 1}
                >
                  <SuiBox lineHeight={1}>
                    <SuiTypography display="block" variant="button" fontWeight="medium">
                      {`Cita ${formatDateShort(c.fecha)}`}
                    </SuiTypography>
                    <SuiTypography variant="caption" fontWeight="regular" textColor="text">
                      {c.motivo || "-"}
                    </SuiTypography>
                  </SuiBox>

                  <SuiBox display="flex" alignItems="center" sx={{ gap: 2 }}>
                    <SuiTypography variant="button" fontWeight="regular" textColor="text">
                      {c.mascota?.nombre || (typeof c.mascota === "string" ? c.mascota : "-")}
                    </SuiTypography>
                    <SuiButton
                      variant="outlined"
                      buttonColor="info"
                      size="small"
                      onClick={() => {
                        setViewId(c.idConsulta || c.id || null);
                        setViewOpen(true);
                      }}
                    >
                      Ver
                    </SuiButton>
                  </SuiBox>
                </SuiBox>
              ))
            ) : (
              <SuiTypography variant="body2">No tiene consultas anteriores</SuiTypography>
            )}
          </SuiBox>
        </SuiBox>
      </Card>

      <ModalVerConsulta open={viewOpen} onClose={() => setViewOpen(false)} consultaId={viewId} />
    </>
  );
}
