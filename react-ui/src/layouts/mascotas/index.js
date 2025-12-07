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
import ModalEliminarMascota from "./ModalEliminarMascota";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArticleIcon from "@mui/icons-material/Article";
import ModalHistorialCompleto from "./ModalHistorialCompleto";
import SuiBox from "components/SuiBox";
import SuiAvatar from "components/SuiAvatar";
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // History modal state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPet, setHistoryPet] = useState(null);

  function openHistory(pet) {
    setHistoryPet(pet);
    setHistoryOpen(true);
  }

  useEffect(() => {
    let mounted = true;
    setLoadingPets(true);
    clinicApi
      .list("mascotas/with-dueno")
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
    { name: "Dueno", align: "left" },
    { name: "Raza", align: "left" },
    { name: "Edad", align: "center" },
    { name: "action", align: "center" },
  ];

  const rowMapper = useCallback(
    (m) => {
      // m expected with fields: idMascota, nombre, especie, raza, edad
      const especie = (m.especie || "").toLowerCase();
      let img = petsIcon;

      // Resolve owner name defensively. Backend may return `dueno` as object, or as name fields, or as id.
      const ownerName =
        (m.dueno && (m.dueno.nombre || m.dueno.name)) ||
        m.dueno_nombre ||
        m.duenoName ||
        (m.owner && (m.owner.nombre || m.owner.name)) ||
        (typeof m.dueno === "string" && m.dueno) ||
        "-";
      const ownerInitial =
        ownerName && String(ownerName).trim().length > 0
          ? String(ownerName).trim()[0].toUpperCase()
          : "?";

      return {
        Nombre: [img, m.nombre || "-"],
        Dueno: [
          <SuiAvatar size="sm" variant="rounded">
            {ownerInitial}
          </SuiAvatar>,
          ownerName,
        ],
        Raza: (
          <SuiBox display="flex" flexDirection="column">
            <SuiTypography
              variant="button"
              fontWeight="medium"
              textColor="dark"
              sx={{ fontSize: "0.95rem" }}
            >
              {m.especie || "-"}
            </SuiTypography>
            <SuiTypography variant="caption" textColor="text" sx={{ fontSize: "0.85rem" }}>
              {m.raza || ""}
            </SuiTypography>
          </SuiBox>
        ),
        Edad: m.edad != null ? String(m.edad) : "",
        action: (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
            <IconButton size="small" onClick={() => openEdit(m.idMascota || m.id)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => confirmDelete(m)} style={{ marginLeft: 8 }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => openHistory(m)} title="Ver Historial" style={{ marginLeft: 8 }}>
              <ArticleIcon fontSize="small" />
            </IconButton>
          </div>
        ),
      };
    },
    [reload, history]
  );

  async function handleSaveMascota(data) {
    const especie = data.especieSel === "Otro" ? data.especieOtro : data.especieSel;
    if (!data.nombre || !especie) throw new Error("Nombre y especie son obligatorios");
    // prefer dueno provided by modal; fallback to authenticated user if available
    let duenoId = null;
    if (data.dueno) {
      if (typeof data.dueno === "object") {
        duenoId = data.dueno.id || data.dueno.idDueno || data.dueno.pk || data.dueno.dueno || null;
      } else {
        duenoId = Number(data.dueno);
      }
    }
    if (!duenoId) {
      try {
        const user = auth && auth.user ? auth.user : null;
        if (user) {
          const possibleId = user.idDueno || user.id || user.user || user.pk || null;
          if (possibleId) duenoId = possibleId;
        }
      } catch (err) {
        // ignore
      }
    }
    if (!duenoId) throw new Error("Debes seleccionar un dueño");

    const payload = {
      nombre: data.nombre,
      especie,
      raza: data.raza || null,
      edad: data.edad !== "" && data.edad != null ? Number(data.edad) : null,
      dueno: Number(duenoId),
    };

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
    } catch (err) { }

    const res = await clinicApi.update("mascotas", editingId, payload);
    setReload((r) => r + 1);
    return res;
  }

  function confirmDelete(m) {
    setItemToDelete(m);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function performDelete() {
    if (!itemToDelete) return;
    const id = itemToDelete.idMascota || itemToDelete.id;
    try {
      await clinicApi.remove("mascotas", id);
      setDeleteOpen(false);
      setItemToDelete(null);
      setReload((r) => r + 1);
    } catch (err) {
      console.error("Error eliminando mascota:", err);
      let msg = "No fue posible eliminar la mascota.";
      if (err && err.body) {
        if (err.body.message) msg = err.body.message;
        else if (typeof err.body === "string") msg = err.body;
        else if (err.body._raw) msg = err.body._raw;
      }
      setDeleteError(msg || "La mascota está ligada a una o más citas y no puede eliminarse.");
      // Keep modal open and show the error message
    }
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SuiBox py={3}>
        <SuiBox mb={3}>
          <Card>
            <SuiBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
              <SuiTypography variant="h6">Mascotas</SuiTypography>
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
                <Table columns={columns} apiResource="mascotas/with-dueno" rowMapper={rowMapper} />
              )}
            </SuiBox>
          </Card>
        </SuiBox>

        {/* Modal externo: ModalMascota maneja formulario con react-hook-form */}
        <ModalMascota open={open} onClose={() => setOpen(false)} onSave={handleSaveMascota} />
        {/* Modal de edición */}
        <ModalEditarMascota
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={handleUpdateMascota}
          initialData={editingData}
        />
        {/* Modal para confirmar/eliminar mascota (muestra error si está ligada a citas) */}
        <ModalEliminarMascota
          open={deleteOpen}
          onClose={() => {
            setDeleteOpen(false);
            setItemToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={performDelete}
          item={itemToDelete}
          errorMessage={deleteError}
        />
        <ModalHistorialCompleto
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          mascota={historyPet}
        />
      </SuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Mascotas;
