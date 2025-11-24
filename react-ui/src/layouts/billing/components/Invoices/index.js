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
import Invoice from "layouts/billing/components/Invoice";
import { useEffect, useState } from "react";
import clinicApi from "api/clinic";


function Invoices() {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    clinicApi
      .request("/api/clinic/consultas/user/recent", { method: "GET" })
      .then((data) => {
        if (!mounted) return;
        setRecent(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Error fetching recent consultas:", err);
        if (mounted) setRecent([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  return (
    <Card id="historial-consultas">
      <SuiBox pt={2} px={2} display="flex" justifyContent="space-between" alignItems="center">
        <SuiTypography variant="h6" fontWeight="medium">
          Historial consultas
        </SuiTypography>
        <SuiButton variant="outlined" buttonColor="info" size="small" component="a" href="/clinic/consultas">
          ver todo
        </SuiButton>
      </SuiBox>
      <SuiBox p={2}>
        <SuiBox component="ul" display="flex" flexDirection="column" p={0} m={0}>
          {loading ? (
            <SuiTypography variant="body2">Cargando...</SuiTypography>
          ) : recent && recent.length > 0 ? (
            recent.map((c, idx) => (
              <Invoice key={c.idConsulta || c.id || idx} date={c.fecha} id={`#${c.idConsulta || c.id || ""}`} price={c.motivo || ""} noGutter={idx === recent.length - 1} />
            ))
          ) : (
            <SuiTypography variant="body2">No tiene consultas aun</SuiTypography>
          )}
        </SuiBox>
      </SuiBox>
    </Card>
  );
}

export default Invoices;
