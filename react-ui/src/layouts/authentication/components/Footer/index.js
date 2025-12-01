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
import Grid from "@mui/material/Grid";

// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";

function Footer() {
  return (
    <SuiBox component="footer" py={4}>
      <Grid container justifyContent="center">
        <Grid item xs={12} className="text-center">
          <SuiTypography variant="body2" textColor="white">
            Grupo 5 - Sistemas de informacion
          </SuiTypography>
        </Grid>
      </Grid>
    </SuiBox>
  );
}

export default Footer;
