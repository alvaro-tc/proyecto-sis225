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

import { useEffect, useState } from "react";

// react-router-dom components
import { useLocation, NavLink } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// clsx is a utility for constructing className strings conditionally
import clsx from "clsx";

// @mui material components
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import Link from "@mui/material/Link";

// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";

// Soft UI Dashboard React example components
import SidenavCollapse from "examples/Sidenav/SidenavCollapse";
import SidenavCard from "examples/Sidenav/SidenavCard";

// Custom styles for the Sidenav
import styles from "examples/Sidenav/styles/sidenav";

// Images
import SoftUILogo from "assets/images/logo-ct.png";

// Soft UI Dashboard React context
import { useSoftUIController } from "context";
import clinicApi from "api/clinic";

function Sidenav({ routes, ...rest }) {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, transparentSidenav } = controller;
  const classes = styles({ miniSidenav, transparentSidenav });
  const location = useLocation();
  const { pathname } = location;
  const collapseName = pathname.split("/").slice(1)[0];

  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setUserLoading(true);
    clinicApi
      .request("/api/users/me")
      .then((u) => {
        if (!mounted) return;
        setCurrentUser(u);
      })
      .catch(() => {
        if (!mounted) return;
        setCurrentUser(null);
      })
      .finally(() => {
        if (!mounted) return;
        setUserLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const closeSizenav = () => dispatch({ type: "MINI_SIDENAV", value: true });

  useEffect(() => {
    // A function that sets the mini state of the sidenav.
    function handleMiniSidenav() {
      dispatch({
        type: "MINI_SIDENAV",
        value: window.innerWidth < 1200,
      });
    }

    /** 
     The event listener that's calling the handleMiniSidenav function when resizing the window.
    */
    window.addEventListener("resize", handleMiniSidenav);

    // Call the handleMiniSidenav function to set the state with the initial value.
    handleMiniSidenav();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleMiniSidenav);
  }, [dispatch, location]);

  // Filter routes by role (if route.roles is set, require current user to match)
  const isAdminUser = (u) => {
    if (!u) return false;
    return !!(u.is_admin || u.is_staff || u.isSuperuser || u.isSuperUser || u.role === "admin" || (u.roles && u.roles.indexOf("admin") >= 0));
  };

  const filteredRoutes = routes.filter((r) => {
    if (!r.roles || r.roles.length === 0) return true;
    // if user still loading, hide role-restricted routes until we know
    if (userLoading) return false;
    if (r.roles.indexOf("admin") >= 0) return isAdminUser(currentUser);
    // fallback: allow if user has a matching role string in r.roles
    if (!currentUser) return false;
    return r.roles.some((role) => String(currentUser.role) === String(role));
  });

  // If current user is admin, show only the specific admin menu items
  // (Veterinarios, Recepcionistas, Perfil, Cerrar sesión).
  const adminAllowedKeys = ["veterinarios", "recepcionistas", "profile", "sign-out"];
  let finalRoutes = filteredRoutes;
  if (!userLoading && isAdminUser(currentUser)) {
    finalRoutes = filteredRoutes.filter((r) => adminAllowedKeys.indexOf(r.key) >= 0);
  }

  // Render all the routes from the routes.js (All the visible items on the Sidenav)
  const renderRoutes = finalRoutes.map(({ type, name, icon, title, noCollapse, key, route, href }) => {
    let returnValue;

    if (type === "collapse") {
      // Determine active state by route (preferred) or fallback to the old key comparison
      const isActive = () => {
        try {
          if (route) {
            const normalizedRoute = route.replace(/\/$/, "");
            return pathname === normalizedRoute || pathname.startsWith(`${normalizedRoute}/`);
          }
        } catch (e) {
          // ignore
        }
        return key === collapseName;
      };

      returnValue = href ? (
        <Link
          href={href}
          key={key}
          target="_blank"
          rel="noreferrer"
          className={classes.sidenav_navlink}
        >
          <SidenavCollapse
            name={name}
            icon={icon}
            active={isActive()}
            noCollapse={noCollapse}
          />
        </Link>
      ) : (
        <NavLink to={route} key={key} className={classes.sidenav_navlink}>
          <SidenavCollapse
            name={name}
            icon={icon}
            active={isActive()}
            noCollapse={noCollapse}
          />
        </NavLink>
      );
    } else if (type === "title") {
      returnValue = (
        <SuiTypography
          key={key}
          variant="caption"
          fontWeight="bold"
          textTransform="uppercase"
          customClass={classes.sidenav_title}
        >
          {title}
        </SuiTypography>
      );
    } else if (type === "divider") {
      returnValue = <Divider key={key} />;
    }

    return returnValue;
  });

  return (
    <Drawer
      {...rest}
      variant="permanent"
      classes={{
        paper: clsx(classes.sidenav, {
          [classes.sidenav_open]: !miniSidenav,
          [classes.sidenav_close]: miniSidenav,
        }),
      }}
    >
      <SuiBox customClass={classes.sidenav_header}>
        <SuiBox
          display={{ xs: "block", xl: "none" }}
          position="absolute"
          top={0}
          right={0}
          p={1.625}
          customClass="cursor-pointer"
          onClick={closeSizenav}
        >
          <SuiTypography variant="h6" textColor="secondary">
            <Icon className="font-bold">close</Icon>
          </SuiTypography>
        </SuiBox>
        <NavLink to="/">
          <SuiBox
            component="img"
            src={SoftUILogo}
            alt="Clínica Veterinaria"
            customClass={classes.sidenav_logo}
          />
          <SuiBox customClass={classes.sidenav_logoLabel}>
            <SuiTypography component="h6" variant="button" fontWeight="medium">
              Clínica Veterinaria
            </SuiTypography>
          </SuiBox>
        </NavLink>
      </SuiBox>
      <Divider />
      <List>{renderRoutes}</List>
      <SuiBox customClass={classes.sidenav_footer}>
        {!userLoading && !isAdminUser(currentUser) && <SidenavCard />}
      </SuiBox>
    </Drawer>
  );
}

// Typechecking props for the Sidenav
Sidenav.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;
