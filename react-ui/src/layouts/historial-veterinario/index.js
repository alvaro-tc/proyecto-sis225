/**
=========================================================
* Historial Veterinario (duplicated from Mascotas and adapted)
=========================================================
*/

import Card from "@mui/material/Card";

import React, { useState, useCallback, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiButton from "components/SuiButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import Table from "examples/Table";
import clinicApi from "api/clinic";

import styles from "layouts/tables/styles";

import petsIcon from "assets/images/pets.svg";

import { useParams } from "react-router-dom";

function HistorialVeterinario() {
  const classes = styles();

  const { id } = useParams();
  const petId = id;

  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    async function load() {
      try {
        const petData = await clinicApi.retrieve("mascotas", petId);
        if (!mounted) return;
        setPet(petData);
      } catch (err) {
        console.error("Error loading mascota:", err);
      }

      try {
        // Call the historial endpoint and filter for this mascota id
        const hist = await clinicApi.request("/api/clinic/consultas/historial");
        if (!mounted) return;
        const arr = Array.isArray(hist) ? hist : (hist && hist.results) || [];
        const filtered = arr.filter((c) => {
          const mid = c.mascota && (c.mascota.idMascota || c.mascota.id || c.mascota.id_mascota);
          return String(mid) === String(petId);
        });
        setItems(filtered);
      } catch (err) {
        console.error("Error loading historial:", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [petId]);

  const columns = [
    { name: "Fecha", align: "left" },
    { name: "Hora", align: "left" },
    { name: "Motivo", align: "left" },
    { name: "Veterinario", align: "left" },
    { name: "action", align: "center" },
  ];

  const rowMapper = useCallback((c) => {
    const fecha = c.fecha || "";
    const hora = c.hora || "";
    const motivo = c.motivo || c.descripcion || "";
    const vet = c.veterinario || (c.user && c.user.email) || "";
    return {
      Fecha: fecha,
      Hora: hora,
      Motivo: motivo,
      Veterinario: vet,
      action: (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <IconButton size="small">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    };
  }, []);

  const title = pet ? `${pet.nombre || "Mascota"} - ${pet.especie || ""}` : "Historial veterinario";

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SuiBox py={3}>
        <SuiBox mb={3}>
          <Card>
            <SuiBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
              <SuiTypography variant="h6">{title}</SuiTypography>
            </SuiBox>

            <SuiBox customClass={classes.tables_table} p={2}>
              {loading ? (
                <SuiBox display="flex" alignItems="center" justifyContent="center" py={4}>
                  <SuiTypography variant="body2" textColor="text">
                    Cargando...
                  </SuiTypography>
                </SuiBox>
              ) : items.length === 0 ? (
                <SuiBox textAlign="center" py={6}>
                  <SuiTypography variant="h6" sx={{ mb: 1 }}>
                    No hay entradas en el historial
                  </SuiTypography>
                </SuiBox>
              ) : (
                <Table columns={columns} rows={items.map((it) => rowMapper(it))} />
              )}
            </SuiBox>
          </Card>
        </SuiBox>
      </SuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default HistorialVeterinario;
