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

import React, { useState, useCallback, useEffect, useRef } from "react";
import ModalMascota from "./ModalMascota";
import ModalEditarMascota from "./ModalEditarMascota";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiButton from "components/SuiButton";
import { useAuth } from "../../auth-context/auth.context";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import Table from "examples/Table";
import clinicApi from "api/clinic";

import styles from "layouts/tables/styles";

import petsIcon from "assets/images/pets.svg";


function Mascotas() {
  const classes = styles();
  const auth = useAuth(); // moved to top-level hook usage

  // modal/form delegated to ModalMascota component

  const [open, setOpen] = useState(false);
  const [reload, setReload] = useState(0);
  // new: track fetched pets to show empty message
  const [petsCount, setPetsCount] = useState(null);
  const [loadingPets, setLoadingPets] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoadingPets(true);
    clinicApi
      .list("mascotas/user")
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) setPetsCount(data.length);
        else setPetsCount(0);
      })
      .catch((err) => {
        console.warn("Error fetching mascotas count:", err);
        if (mounted) setPetsCount(0);
      })
      .finally(() => {
        if (mounted) setLoadingPets(false);
      });
    return () => {
      mounted = false;
    };
  }, [reload]);

  const columns = [
    { name: "Nombre", align: "left" },
    { name: "Raza", align: "left" },
    { name: "Edad", align: "center" },
    { name: "action", align: "center" },
  ];

  const rowMapper = useCallback(
    (m) => {
      // m expected with fields: idMascota, nombre, especie, raza, edad
      const especie = (m.especie || "").toLowerCase();
      let img = petsIcon;

      return {
        Nombre: [img, m.nombre || "-"],
        Raza: (
          <SuiBox display="flex" flexDirection="column">
            <SuiTypography variant="button" fontWeight="medium" textColor="dark" sx={{ fontSize: "0.95rem" }}>
              {m.especie || "-"}
            </SuiTypography>
            <SuiTypography variant="caption" textColor="text" sx={{ fontSize: "0.85rem" }}>
              {m.raza || ""}
            </SuiTypography>
          </SuiBox>
        ),
        Edad: m.edad != null ? String(m.edad) : "",
        action: (
          <IconButton size="small" onClick={() => openEdit(m.idMascota || m.id)}>
            <EditIcon fontSize="small" />
          </IconButton>
        ),
      };
    },
    [reload]
  );

  async function handleSaveMascota(data) {
    const especie = data.especieSel === "Otro" ? data.especieOtro : data.especieSel;
    if (!data.nombre || !especie) throw new Error("Nombre y especie son obligatorios");
    const payload = {
      nombre: data.nombre,
      especie,
      raza: data.raza || null,
      edad: data.edad !== "" && data.edad != null ? Number(data.edad) : null,
    };

    try {
      const user = auth && auth.user ? auth.user : null;
      if (user) {
        const possibleId = user.idDueno || user.id || user.user || user.pk || null;
        if (possibleId) payload.dueno = possibleId;
      }
    } catch (err) {
      // ignore
    }

    const res = await clinicApi.create("mascotas", payload);
    setReload((r) => r + 1);
    return res;
  }

  // Edit flow
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);

  async function openEdit(id) {
    try {
      const data = await clinicApi.retrieve("mascotas", id);
      setEditingId(id);
      setEditingData(data);
      setEditOpen(true);
    } catch (err) {
      console.error("Error cargando mascota:", err);
      // TODO: show toast
    }
  }

  async function handleUpdateMascota(data) {
    const especie = data.especieSel === "Otro" ? data.especieOtro : data.especieSel;
    if (!data.nombre || !especie) throw new Error("Nombre y especie son obligatorios");
    const payload = {
      nombre: data.nombre,
      especie,
      raza: data.raza || null,
      edad: data.edad !== "" && data.edad != null ? Number(data.edad) : null,
    };
    try {
      const user = auth && auth.user ? auth.user : null;
      if (user) {
        const possibleId = user.idDueno || user.id || user.user || user.pk || null;
        if (possibleId) payload.dueno = possibleId;
      }
    } catch (err) {}

    const res = await clinicApi.update("mascotas", editingId, payload);
    setReload((r) => r + 1);
    return res;
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SuiBox py={3}>
        <SuiBox mb={3}>
          <Card>
            <SuiBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
              <SuiTypography variant="h6">Tus Mascotas</SuiTypography>
              <SuiButton variant="gradient" buttonColor="dark" onClick={() => setOpen(true)}>
                Agregar
              </SuiButton>
            </SuiBox>

            <SuiBox customClass={classes.tables_table} p={2}>
              {/* show empty state if loaded and zero */}
              {loadingPets ? (
                <SuiBox display="flex" alignItems="center" justifyContent="center" py={4}>
                  <SuiTypography variant="body2" textColor="text">
                    Cargando...
                  </SuiTypography>
                </SuiBox>
              ) : petsCount === 0 ? (
                <SuiBox textAlign="center" py={6}>
                  <SuiTypography variant="h6" sx={{ mb: 1 }}>
                    Aún no tienes mascotas registradas
                  </SuiTypography>
                  <SuiTypography variant="body2" textColor="text" sx={{ mb: 2 }}>
                    Registra a tu primera mascota usando el botón Agregar
                  </SuiTypography>
                  <SuiButton variant="gradient" buttonColor="dark" onClick={() => setOpen(true)}>
                    Agregar mascota
                  </SuiButton>
                </SuiBox>
              ) : (
                <Table columns={columns} apiResource="mascotas/user" rowMapper={rowMapper} />
              )}
            </SuiBox>
          </Card>
        </SuiBox>

        {/* Modal externo: ModalMascota maneja formulario con react-hook-form */}
        <ModalMascota open={open} onClose={() => setOpen(false)} onSave={handleSaveMascota} />
        {/* Modal de edición */}
        <ModalEditarMascota open={editOpen} onClose={() => setEditOpen(false)} onSave={handleUpdateMascota} initialData={editingData} />

      </SuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Mascotas;
