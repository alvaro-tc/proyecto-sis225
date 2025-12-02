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

import { useState, useEffect } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
// removed Tabs UI for clinic profile

// Soft UI Dashboard PRO React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiAvatar from "components/SuiAvatar";

// Soft UI Dashboard PRO React example components
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Soft UI Dashboard PRO React icons
// icons removed

// Soft UI Dashboard PRO React base styles
import breakpoints from "assets/theme/base/breakpoints";

// Custom styles for Header
import styles from "layouts/profile/components/Header/styles";

// Images
import usersIcon from "assets/images/user.svg";

function Header({ name, role, avatar }) {
  const classes = styles();

  return (
    <SuiBox position="relative">
      <DashboardNavbar absolute light />
      <SuiBox customClass={classes.profileHeader_background} />
      <Card className={classes.profileHeader_profile}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <SuiAvatar
              src={usersIcon}
              alt="profile-image"
              variant="rounded"
              size="xl"
              customClass="shadow-sm"
            />
          </Grid>
          <Grid item>
            <SuiBox
              height="100%"
              mt={0.5}
              lineHeight={1}
              display="flex"
              alignItems="center"
              gap={1}
            >
              <SuiBox>
                <SuiTypography variant="h5" fontWeight="medium">
                  {name || "Nombre Apellido"}
                </SuiTypography>
                <SuiTypography variant="button" textColor="text" fontWeight="medium">
                  {role || ""}
                </SuiTypography>
              </SuiBox>
            </SuiBox>
          </Grid>
          {/* removed App/Message/Settings tabs for clinic UI */}
        </Grid>
      </Card>
    </SuiBox>
  );
}

export default Header;
