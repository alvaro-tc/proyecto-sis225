/**
=========================================================
* Dueños (duplicated from Mascotas)
=========================================================
*/

import Card from "@mui/material/Card";
import React, { useState, useCallback, useEffect } from "react";
import ModalDueno from "./ModalDueno";
import ModalEliminarDueno from "./ModalEliminarDueno";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ModalMascota from "../mascotas/ModalMascota";
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiButton from "components/SuiButton";
import Table from "examples/Table";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import clinicApi from "api/clinic";
import styles from "layouts/tables/styles";

export default function Duenos() {
  const classes = styles();

  const [open, setOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const [itemsCount, setItemsCount] = useState(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoadingItems(true);
    clinicApi
      .list("duenos")
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) setItemsCount(data.length);
        else setItemsCount(0);
      })
      .catch((err) => {
        console.warn("Error fetching duenos count:", err);
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
    { name: "Nombre", align: "left" },
    { name: "Teléfono", align: "left" },
    { name: "action", align: "center" },
  ];

  const rowMapper = useCallback(
    (m) => {
      const name = m.nombre || m.name || (m.user && (m.user.nombre || m.user.email)) || "-";
      return {
        Nombre: [null, name],
        "Teléfono": m.telefono || "",
        action: (
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <IconButton size="small" title="Crear mascota" onClick={() => { setCreatingOwnerId(m.id || m.idDueno || m.idUsuario || m.id); setCreatePetOpen(true); }}>
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => openEdit(m.id || m.idDueno || m.idUsuario || m.id)}>
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

  async function handleSaveDueno(data) {
    const payload = { nombre: data.nombre || null, telefono: data.telefono || null };
    const res = await clinicApi.create("duenos", payload);
    setReload((r) => r + 1);
    return res;
  }

  // Edit flow
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);

  async function openEdit(id) {
    try {
      const data = await clinicApi.retrieve("duenos", id);
      setEditingId(id);
      setEditingData(data);
      setEditOpen(true);
    } catch (err) {
      console.error("Error cargando dueño:", err);
    }
  }

  async function handleUpdateDueno(data) {
    const payload = { nombre: data.nombre || null, telefono: data.telefono || null };
    const res = await clinicApi.update("duenos", editingId, payload);
    setReload((r) => r + 1);
    return res;
  }

  async function handleDeleteDueno(id) {
    try {
      await clinicApi.remove("duenos", id);
      setReload((r) => r + 1);
    } catch (err) {
      console.error("Error eliminando dueño:", err);
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
    const id = deletingItem.id || deletingItem.idDueno || deletingItem.idUsuario || deletingItem;
    await handleDeleteDueno(id);
    closeDeleteModal();
  }

  // Create mascota for a given dueño
  const [createPetOpen, setCreatePetOpen] = useState(false);
  const [creatingOwnerId, setCreatingOwnerId] = useState(null);

  async function handleSaveMascotaForOwner(data) {
    const especie = data.especieSel === "Otro" ? data.especieOtro : data.especieSel;
    if (!data.nombre || !especie) throw new Error("Nombre y especie son obligatorios");
    const payload = {
      nombre: data.nombre,
      especie,
      raza: data.raza || null,
      edad: data.edad !== "" && data.edad != null ? Number(data.edad) : null,
      dueno: creatingOwnerId || null,
    };
    const res = await clinicApi.create("mascotas", payload);
    setCreatePetOpen(false);
    setCreatingOwnerId(null);
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
              <SuiTypography variant="h6">Dueños</SuiTypography>
              <SuiButton variant="gradient" buttonColor="dark" onClick={() => setOpen(true)}>
                Agregar
              </SuiButton>
            </SuiBox>

            <SuiBox customClass={classes.tables_table} p={2}>
              {loadingItems ? (
                <SuiBox display="flex" alignItems="center" justifyContent="center" py={4}>
                  <SuiTypography variant="body2" textColor="text">Cargando...</SuiTypography>
                </SuiBox>
              ) : itemsCount === 0 ? (
                <SuiBox textAlign="center" py={6}>
                  <SuiTypography variant="h6" sx={{ mb: 1 }}>No hay dueños registrados</SuiTypography>
                  <SuiTypography variant="body2" textColor="text" sx={{ mb: 2 }}>Registra al primer dueño usando el botón Agregar</SuiTypography>
                  <SuiButton variant="gradient" buttonColor="dark" onClick={() => setOpen(true)}>Agregar dueño</SuiButton>
                </SuiBox>
              ) : (
                <Table columns={columns} apiResource="duenos" rowMapper={rowMapper} />
              )}
            </SuiBox>
          </Card>
        </SuiBox>

        <ModalDueno open={open} onClose={() => setOpen(false)} onSave={handleSaveDueno} />
        <ModalDueno open={editOpen} onClose={() => setEditOpen(false)} onSave={handleUpdateDueno} initialData={editingData} id={editingId} />
        <ModalEliminarDueno open={deleteOpen} onClose={closeDeleteModal} onConfirm={confirmDelete} item={deletingItem} />
        <ModalMascota open={createPetOpen} onClose={() => { setCreatePetOpen(false); setCreatingOwnerId(null); }} onSave={handleSaveMascotaForOwner} />

      </SuiBox>
      <Footer />
    </DashboardLayout>
  );
}
