/**
=========================================================
* Recepcionistas (duplicated from Veterinarios)
=========================================================
*/

// @mui material components
import Card from "@mui/material/Card";

import React, { useState, useCallback, useEffect } from "react";
import ModalRecepcionista from "./ModalRecepcionista";
import ModalEditarRecepcionista from "./ModalEditarRecepcionista";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SuiBox from "components/SuiBox";
import SuiAvatar from "components/SuiAvatar";
import SuiTypography from "components/SuiTypography";
import SuiButton from "components/SuiButton";
import ModalEliminarRecepcionista from "./ModalEliminarRecepcionista";
import { useAuth } from "../../auth-context/auth.context";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import Table from "examples/Table";
import clinicApi from "api/clinic";

import styles from "layouts/tables/styles";

import recepIcon from "assets/images/users.svg";

function Recepcionistas() {
  const classes = styles();
  const auth = useAuth();

  const [open, setOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const [itemsCount, setItemsCount] = useState(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoadingItems(true);
    // Admin list of recepcionistas
    clinicApi
      .list("recepcionistas")
      .then((data) => {
        // eslint-disable-next-line no-console
        console.debug("[Recepcionistas] list →", data);
        if (!mounted) return;
        if (Array.isArray(data)) setItemsCount(data.length);
        else setItemsCount(0);
      })
      .catch((err) => {
        console.warn("Error fetching recepcionistas count:", err);
        if (mounted) setItemsCount(0);
      })
      .finally(() => {
        if (mounted) setLoadingItems(false);
      });
    return () => {
      mounted = false;
    };
  }, [reload]);

  const columns = [
    { name: "ID", align: "left" },
    { name: "Nombre", align: "left" },
    { name: "Email", align: "left" },
    { name: "Teléfono", align: "center" },
    { name: "action", align: "center" },
  ];

  const rowMapper = useCallback(
    (m) => {
      let img = recepIcon;

      const name = m.nombre || (m.user && (m.user.nombre || m.user.email || "")) || "-";
      const initial = name && String(name).trim().length > 0 ? String(name).trim()[0].toUpperCase() : "?";
      const idVal = m.id || m.idRecepcionista || m.idDueno || m.id || "";
      return {
        ID: idVal,
        Nombre: [<SuiAvatar size="sm" variant="rounded">{initial}</SuiAvatar>, name],
        Email: m.email || (m.user && m.user.email) || "",
        "Teléfono": m.telefono || (m.user && m.user.telefono) || "",
        action: (
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <IconButton size="small" onClick={() => openEdit(idVal)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => openDeleteModal(m)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        ),
      };
    },
    [reload]
  );

  async function handleDeleteRecepcionista(id) {
    try {
      await clinicApi.remove("recepcionistas", id);
      setReload((r) => r + 1);
    } catch (err) {
      console.error("Error eliminando recepcionista:", err);
      alert("Error al eliminar: " + (err?.body?._raw || JSON.stringify(err)));
    }
  }

  function openDeleteModal(item) {
    setDeletingItem(item);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    setDeletingItem(null);
    setDeleteOpen(false);
  }

  async function confirmDelete() {
    if (!deletingItem) return;
    const id = deletingItem.id || deletingItem.idRecepcionista || deletingItem.idDueno || deletingItem;
    await handleDeleteRecepcionista(id);
    closeDeleteModal();
  }

  async function handleSaveRecepcionista(data) {
    if (!data.email) throw new Error("El email es obligatorio");
    if (!data.password) throw new Error("La contraseña es obligatoria");
    const payload = {
      email: data.email,
      password: data.password,
      telefono: data.telefono || null,
      nombre: data.nombre || null,
    };

    // Log the exact payload sent to the API for debugging
    // eslint-disable-next-line no-console
    console.log("POST /api/clinic/recepcionistas payload:", payload);
    const res = await clinicApi.create("recepcionistas", payload);
    setReload((r) => r + 1);
    return res;
  }

  // Edit flow
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);

  async function openEdit(id) {
    try {
      const data = await clinicApi.retrieve("recepcionistas", id);
      setEditingId(id);
      setEditingData(data);
      setEditOpen(true);
    } catch (err) {
      console.error("Error cargando recepcionista:", err);
    }
  }

  async function handleUpdateRecepcionista(data) {
    if (!data.email) throw new Error("El email es obligatorio");
    const payload = {
      email: data.email,
      telefono: data.telefono || null,
      nombre: data.nombre || null,
    };
    if (data.password) payload.password = data.password;

    // Log the exact payload sent to the API for debugging
    // eslint-disable-next-line no-console
    console.log(`PUT /api/clinic/recepcionistas/${editingId} payload:`, payload);
    const res = await clinicApi.update("recepcionistas", editingId, payload);
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
              <SuiTypography variant="h6">Recepcionistas</SuiTypography>
              <SuiButton variant="gradient" buttonColor="dark" onClick={() => setOpen(true)}>
                Agregar
              </SuiButton>
            </SuiBox>

            <SuiBox customClass={classes.tables_table} p={2}>
              {loadingItems ? (
                <SuiBox display="flex" alignItems="center" justifyContent="center" py={4}>
                  <SuiTypography variant="body2" textColor="text">
                    Cargando...
                  </SuiTypography>
                </SuiBox>
              ) : itemsCount === 0 ? (
                <SuiBox textAlign="center" py={6}>
                  <SuiTypography variant="h6" sx={{ mb: 1 }}>
                    No hay recepcionistas registrados
                  </SuiTypography>
                  <SuiTypography variant="body2" textColor="text" sx={{ mb: 2 }}>
                    Registra al primer recepcionista usando el botón Agregar
                  </SuiTypography>
                  <SuiButton variant="gradient" buttonColor="dark" onClick={() => setOpen(true)}>
                    Agregar recepcionista
                  </SuiButton>
                </SuiBox>
              ) : (
                <Table columns={columns} apiResource="recepcionistas" rowMapper={rowMapper} />
              )}
            </SuiBox>
          </Card>
        </SuiBox>

        <ModalRecepcionista open={open} onClose={() => setOpen(false)} onSave={handleSaveRecepcionista} />
        <ModalEditarRecepcionista open={editOpen} onClose={() => setEditOpen(false)} onSave={handleUpdateRecepcionista} id={editingId} />
        <ModalEliminarRecepcionista open={deleteOpen} onClose={closeDeleteModal} onConfirm={confirmDelete} item={deletingItem} />

      </SuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Recepcionistas;
