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
import Grid from "@mui/material/Grid";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";

// Soft UI Dashboard React example components
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import PageLayout from "examples/LayoutContainers/PageLayout";

// Authentication layout components
import Footer from "layouts/authentication/components/Footer";

// Custom styles for the Baise
import styles from "layouts/authentication/components/CoverLayout/styles";
import loginDog from "assets/images/login-dog.png";

// Soft UI Dashboard React page layout routes
import routes from "routes";

function CoverLayout({ color, header, title, description, image, top, children }) {
  const classes = styles({ image });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const titleStyle = color === "white" ? { color: "#ffffff" } : {};

  return (
    <PageLayout background="">
      <DefaultNavbar routes={routes} transparent light />
      <Grid container justifyContent="center" alignItems="center" className={classes.coverLayout}>
        <Grid item xs={11} sm={8} md={6} xl={4}>
          <SuiBox mt={top}>
            {/* wrapper to align title/description with the inner white form */}
            <SuiBox sx={{ maxWidth: 480, margin: '0 auto' }}>
              <SuiBox pt={3} px={3}>
                {!header ? (
                  <>
                    <SuiBox mb={1}>
                      <SuiTypography
                        variant="h3"
                        fontWeight="bold"
                        textColor={color}
                        textGradient={color !== "white"}
                        style={titleStyle}
                      >
                        {title}
                      </SuiTypography>
                    </SuiBox>
                    <SuiTypography variant="body2" fontWeight="regular" textColor="text" style={titleStyle}>
                      {description}
                    </SuiTypography>
                  </>
                ) : (
                  header
                )}
              </SuiBox>
              <SuiBox p={3}>{children}</SuiBox>
            </SuiBox>
          </SuiBox>
        </Grid>
        {image && image !== "DIAGONAL_GRADIENT" ? (
          <Grid item xs={12} md={5}>
            <SuiBox
              display={{ xs: "none", md: "block" }}
              position="relative"
              right={{ md: "-12rem", xl: "-16rem" }}
              customClass={classes.coverLayout_imageBox}
            >
              <SuiBox customClass={classes.coverLayout_image} />
            </SuiBox>
          </Grid>
        ) : null}

        {image === "DIAGONAL_GRADIENT" && !isMobile ? (
          <Grid item xs={12} md={5}>
            <SuiBox
              display={{ xs: "none", md: "block" }}
              position="relative"
              right={{ md: "-2rem", xl: "-4rem" }}
              customClass={classes.coverLayout_dogBox}
            >
              <SuiBox customClass={classes.coverLayout_dogCircle}>
                <img src={loginDog} alt="dog" className={classes.coverLayout_dogImage} />
              </SuiBox>
            </SuiBox>
          </Grid>
        ) : null}
      </Grid>
      <Footer />
    </PageLayout>
  );
}

// Setting default values for the props of CoverLayout
CoverLayout.defaultProps = {
  header: "",
  title: "",
  description: "",
  color: "white",
  top: 20,
};

// Typechecking props for the CoverLayout
CoverLayout.propTypes = {
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "dark",
    "light",
    "white",
  ]),
  header: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.string.isRequired,
  top: PropTypes.number,
  children: PropTypes.node.isRequired,
};

export default CoverLayout;
