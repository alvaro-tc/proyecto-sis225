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

/** 
  All of the routes for the Soft UI Dashboard React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Soft UI Dashboard React layouts
import MascotasLayout from "layouts/mascotas";
import VeterinariosLayout from "layouts/veterinarios";
import HistorialVeterinario from "layouts/historial-veterinario";
import RecepcionistasLayout from "layouts/recepcionistas";
import Billing from "layouts/billing";
import Profile from "layouts/profile";
import DuenosLayout from "layouts/duenos";
import RegistrarConsulta from "layouts/registrar-consulta";
import RegistroConsulta from "layouts/registro-consulta";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import SignOut from "layouts/authentication/sign-out";
// Clinic pages
// Clinic pages removed (not needed)

// Soft UI Dashboard React icons
import Office from "examples/Icons/Office";
import Document from "examples/Icons/Document";
import SpaceShip from "examples/Icons/SpaceShip";
import CustomerSupport from "examples/Icons/CustomerSupport";
import CreditCard from "examples/Icons/CreditCard";

const routes = [
  {
    type: "collapse",
    name: "Mascotas",
    key: "mascotas-layout",
    route: "/mascotas",
    icon: <Office size="12px" />,
    component: MascotasLayout,
    noCollapse: true,
    protected: true,
    roles: ["recepcionista", "admin"],
  },
  {
    type: "collapse",
    name: "Veterinarios",
    key: "veterinarios",
    route: "/veterinarios",
    icon: <Office size="12px" />,
    component: VeterinariosLayout,
    noCollapse: true,
    protected: true,
    roles: ["admin"],
  },
  {
    type: "collapse",
    name: "Recepcionistas",
    key: "recepcionistas",
    route: "/recepcionistas",
    icon: <CustomerSupport size="12px" />,
    component: RecepcionistasLayout,
    noCollapse: true,
    protected: true,
    roles: ["admin"],
  },
  {
    type: "collapse",
    name: "Dueños",
    key: "duenos",
    route: "/duenos",
    icon: <Office size="12px" />,
    component: DuenosLayout,
    noCollapse: true,
    protected: true,
    roles: ["recepcionista"],
  },
  {
    type: "collapse",
    name: "Registro Consulta",
    key: "registro-consulta",
    route: "/registro-consulta",
    icon: <CreditCard size="12px" />,
    component: RegistroConsulta,
    noCollapse: true,
    protected: true,
    roles: ["recepcionista"],
  },
  {
    type: "collapse",
    name: "Consultas",
    key: "consultas-global",
    route: "/consultas",
    icon: <CreditCard size="12px" />,
    component: RegistrarConsulta,
    noCollapse: true,
    protected: true,
    roles: ["veterinario"],
  },

  {
    type: "none",
    name: "Historial Veterinario",
    key: "historial-veterinario",
    route: "/historial-veterinario/:id",
    component: HistorialVeterinario,
    protected: true,
  },
  { type: "title", title: "Cuenta", key: "account-pages" },
  {
    type: "collapse",
    name: "Perfil",
    key: "profile",
    route: "/profile",
    icon: <CustomerSupport size="12px" />,
    component: Profile,
    noCollapse: true,
    protected: true,
  },
  {
    type: "none",
    name: "Iniciar Sesión",
    key: "sign-in",
    route: "/authentication/sign-in",
    icon: <Document size="12px" />,
    component: SignIn,
    noCollapse: true,
  },
  {
    type: "none",
    name: "Registrarse",
    key: "sign-up",
    route: "/authentication/sign-up",
    icon: <SpaceShip size="12px" />,
    component: SignUp,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Cerrar sesión",
    key: "sign-out",
    route: "/authentication/sign-out",
    icon: <SpaceShip size="12px" />,
    component: SignOut,
    noCollapse: true,
  },

  // Clinic routes removed
];

export default routes;
