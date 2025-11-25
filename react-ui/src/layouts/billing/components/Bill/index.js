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

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Icon from "@mui/material/Icon";

// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiButton from "components/SuiButton";

function Bill({ consulta, onEdit, onDelete, noGutter }) {
  const mascotaName = consulta?.mascota?.nombre || (typeof consulta?.mascota === "string" ? consulta.mascota : "-");
  const fecha = consulta?.fecha || "";
  const hora = consulta?.hora || "";
  const motivo = consulta?.motivo || "-";
  const descripcion = consulta?.descripcion || "";
  const vetName = consulta?.veterinario?.nombre || (typeof consulta?.veterinario === "string" ? consulta.veterinario : "-");

  function formatDateLongSpanish(rawDate) {
    if (!rawDate) return "";
    try {
      const d = new Date(rawDate);
      if (Number.isNaN(d.getTime())) return rawDate;
      const opts = { weekday: "long", day: "numeric", month: "long" };
      const s = d.toLocaleDateString("es-ES", opts);
      return s.replace(/,?\s*\d{4}/, "");
    } catch (e) {
      return rawDate;
    }
  }

  const title = fecha ? `Consulta para el ${formatDateLongSpanish(fecha)}` : "Consulta";

  return (
    <SuiBox
      component="li"
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      backgroundColor="grey-100"
      borderRadius="lg"
      p={3}
      mb={noGutter ? 0 : 1}
      mt={2}
    >
      <SuiBox width="100%" display="flex" flexDirection="column">
        <SuiBox
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}
          mb={2}
        >
          <SuiTypography variant="button" fontWeight="medium" textTransform="none">
            {title}
          </SuiTypography>

          <SuiBox display="flex" alignItems="center" mt={{ xs: 2, sm: 0 }} ml={{ xs: -1.5, sm: 0 }}>
            <SuiBox mr={1}>
              <SuiButton variant="text" buttonColor="error" onClick={() => onDelete && onDelete(consulta)}>
                <Icon className="material-icons-round">delete</Icon>&nbsp;eliminar
              </SuiButton>
            </SuiBox>
            <SuiButton variant="text" buttonColor="dark" onClick={() => onEdit && onEdit(consulta)}>
              <Icon className="material-icons-round">edit</Icon>&nbsp;editar
            </SuiButton>
          </SuiBox>
        </SuiBox>

        {hora && (
          <SuiBox mb={1} lineHeight={0}>
            <SuiTypography variant="caption" textColor="text">
              Hora:&nbsp;&nbsp;&nbsp;
              <SuiTypography variant="caption" fontWeight="medium">{hora}</SuiTypography>
            </SuiTypography>
          </SuiBox>
        )}

        <SuiBox mb={1} lineHeight={0}>
          <SuiTypography variant="caption" textColor="text">
            Mascota:&nbsp;&nbsp;&nbsp;
            <SuiTypography variant="caption" fontWeight="medium" textTransform="capitalize">
              {mascotaName}
            </SuiTypography>
          </SuiTypography>
        </SuiBox>

        <SuiBox mb={1} lineHeight={0}>
          <SuiTypography variant="caption" textColor="text">
            Motivo:&nbsp;&nbsp;&nbsp;
            <SuiTypography variant="caption" fontWeight="medium">
              {motivo}
            </SuiTypography>
          </SuiTypography>
        </SuiBox>

        <SuiBox mb={1} lineHeight={0}>
          <SuiTypography variant="caption" textColor="text">
            Descripción:&nbsp;&nbsp;&nbsp;
            <SuiTypography variant="caption" fontWeight="medium">
              {descripcion}
            </SuiTypography>
          </SuiTypography>
        </SuiBox>

        <SuiBox mb={1} lineHeight={0}>
          <SuiTypography variant="caption" textColor="text">
            Veterinario:&nbsp;&nbsp;&nbsp;
            <SuiTypography variant="caption" fontWeight="medium">
              {vetName}
            </SuiTypography>
          </SuiTypography>
        </SuiBox>

        
      </SuiBox>
    </SuiBox>
  );
}

// Setting default values for the props of Bill
Bill.defaultProps = {
  noGutter: false,
};

// Typechecking props for the Bill (adapted for consultas)
Bill.propTypes = {
  consulta: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  noGutter: PropTypes.bool,
};

export default Bill;
