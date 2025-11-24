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

import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "App";

// Soft UI Dashboard React Context Provider
import { SoftUIControllerProvider } from "context";

import { AuthProvider } from "auth-context/auth.context";

let user = localStorage.getItem("user");
try {
  user = typeof user === "string" && user !== "null" ? JSON.parse(user) : null;
} catch (e) {
  // if the stored value is not valid JSON (eg. an HTML error page), ignore it
  // and fall back to null to avoid crashing the app on startup
  // eslint-disable-next-line no-console
  console.warn("Could not parse localStorage.user, ignoring invalid value.", e);
  user = null;
}

ReactDOM.render(
  <BrowserRouter>
    <SoftUIControllerProvider>
      <AuthProvider userData={user}>
        <App />
      </AuthProvider>
    </SoftUIControllerProvider>
  </BrowserRouter>,
  document.getElementById("root")
);
