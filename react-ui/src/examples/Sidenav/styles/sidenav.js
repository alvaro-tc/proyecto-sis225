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
import { makeStyles } from "@mui/styles";

export default makeStyles(
  ({ palette, typography, boxShadows, transitions, breakpoints, functions }) => {
    const sidebarWidth = 250;
    const { white, transparent } = palette;
    const { fontWeightMedium } = typography;
    const { xxl } = boxShadows;
    const { pxToRem } = functions;

    return {
      sidenav: {
        boxShadow: xxl,
        border: "none",
        // default background for the sidenav (applies on desktop when not transparent)
        backgroundColor: ({ transparentSidenav }) =>
          transparentSidenav ? transparent.main : "#b3b0e6",
        boxShadow: ({ transparentSidenav }) => (transparentSidenav ? "none" : xxl),
        marginBottom: ({ transparentSidenav }) => (transparentSidenav ? 0 : "inherit"),
        left: "0",

        // Ensure the Drawer paper uses the same background color (higher specificity)
        "&.MuiPaper-root, &.MuiDrawer-paper, &.MuiDrawer-paperAnchorLeft": {
          backgroundColor: ({ transparentSidenav }) =>
            transparentSidenav ? transparent.main : "#b3b0e6 !important",
        },

        [breakpoints.up("xl")]: {
          // keep the same behaviour on xl (explicit for clarity)
          backgroundColor: ({ transparentSidenav }) =>
            transparentSidenav ? transparent.main : "#b3b0e6",
        },
      },

      sidenav_header: {
        padding: `${pxToRem(24)} ${pxToRem(32)} ${pxToRem(8)}`,
        textAlign: "center",

        "& a": {
          display: "flex",
          alignItems: "center",
          textDecoration: "none",
        },
      },

      sidenav_logo: {
        width: pxToRem(40),
        // ensure the logo sits nicely on the background
        display: "block",
      },

      sidenav_logoLabel: {
        marginLeft: pxToRem(6),
        fontWeight: fontWeightMedium,
        wordSpacing: pxToRem(-1),
        fontSize: pxToRem(16),
        transition: transitions.create("opacity", {
          easing: transitions.easing.easeInOut,
          duration: transitions.duration.standard,
        }),
        color: white.main,

        [breakpoints.up("xl")]: {
          opacity: ({ miniSidenav }) => (miniSidenav ? 0 : 1),
        },
      },

      sidenav_title: {
        display: "block",
        color: white.main,
        opacity: 0.9,
        paddingLeft: pxToRem(24),
        margin: `${pxToRem(16)} 0 ${pxToRem(8)} ${pxToRem(8)}`,
        fontSize: pxToRem(13),
      },

      marginTopNone: {
        marginTop: 0,
      },

      sidenav_footer: {
        margin: `auto ${pxToRem(16)} ${pxToRem(16)}`,
        paddingTop: pxToRem(16),
      },

      sidenav_open: {
        transform: "translateX(0)",
        transition: transitions.create("transform", {
          easing: transitions.easing.sharp,
          duration: transitions.duration.shorter,
        }),

        [breakpoints.up("xl")]: {
          width: sidebarWidth,
          transform: "translateX(0)",
          transition: transitions.create(["width", "background-color"], {
            easing: transitions.easing.sharp,
            duration: transitions.duration.enteringScreen,
          }),
        },
      },

      sidenav_close: {
        transform: `translateX(${pxToRem(-320)})`,
        transition: transitions.create("transform", {
          easing: transitions.easing.sharp,
          duration: transitions.duration.shorter,
        }),

        [breakpoints.up("xl")]: {
          width: pxToRem(96),
          overflowX: "hidden",
          transform: "translateX(0)",
          transition: transitions.create(["width", "background-color"], {
            easing: transitions.easing.sharp,
            duration: transitions.duration.shorter,
          }),
        },
      },

      sidenav_navlink: {
        textDecoration: "none",
      },
    };
  }
);
