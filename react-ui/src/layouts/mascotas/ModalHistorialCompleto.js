import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Divider,
    List,
    ListItem,
    ListItemText,
    Typography,
    CircularProgress,
    Card,
    CardMedia,
    CardContent,
} from "@mui/material";
import SuiButton from "components/SuiButton";
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import clinicApi from "api/clinic";

import dogImg from "assets/images/gemini_perro.png";
import catImg from "assets/images/gemini_gato.png";
import birdImg from "assets/images/gemini_ave.png";

// Normalizador básico
const normalize = (str) =>
    (str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quitar acentos
        .toLowerCase()
        .trim();

// Diccionario ampliable de especies
const speciesMap = {
    perro: "dog",
    canino: "dog",
    cachorro: "dog",

    gato: "cat",
    felino: "cat",

    ave: "bird",
    pajaro: "bird",
    loro: "parrot",

    pez: "fish",
    pescado: "fish",
    acuario: "fish",

    caballo: "horse",
    equino: "horse",

    conejo: "rabbit",
    liebre: "rabbit",

    tortuga: "turtle",

    serpiente: "snake",

    hamster: "hamster",

    cerdo: "pig",
    chancho: "pig",

    vaca: "cow",

    oveja: "sheep",

    cabra: "goat",
};

// intento de detección automática
const detectSpecies = (rawText) => {
    const text = normalize(rawText);

    // 1) detectar cualquier especie de speciesMap
    for (const key in speciesMap) {
        if (text.includes(key)) {
            return speciesMap[key];
        }
    }

    // 2) fallback: usar palabra completa como especie en inglés
    // para cosas raras como: "axolotl", "capybara", "tarantula"
    return text.split(" ")[0];
};

export default function ModalHistorialCompleto({ open, onClose, mascota }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pastConsultas, setPastConsultas] = useState([]);
    const [pendingConsultas, setPendingConsultas] = useState([]);
    const [displayImage, setDisplayImage] = useState(null);
    const [ownerPhone, setOwnerPhone] = useState(null);

    // Determine pet image based on species
    useEffect(() => {
        if (open && mascota) {
            const especie = (mascota.especie || "").toLowerCase();

            // Default to dog if unknown
            let finalImg = dogImg;

            // Strict species detection for local assets
            if (especie.includes("perro") || especie.includes("canino") || especie.includes("dog")) {
                finalImg = dogImg;
            } else if (especie.includes("gato") || especie.includes("felino") || especie.includes("cat")) {
                finalImg = catImg;
            } else if (especie.includes("ave") || especie.includes("pajaro") || especie.includes("bird") || especie.includes("loro")) {
                finalImg = birdImg;
            } else if (especie) {
                // Try map
                const mapped = detectSpecies(especie);
                if (mapped === "cat") finalImg = catImg;
                else if (mapped === "bird" || mapped === "parrot") finalImg = birdImg;
                else finalImg = dogImg; // fallback
            }

            setDisplayImage(finalImg);
        }
    }, [open, mascota]);

    useEffect(() => {
        if (!open || !mascota) return;

        let mounted = true;

        // Fetch owner phone if we have an ID
        const fetchOwnerInfo = async () => {
            // Try to find owner ID
            let duenoId = null;
            if (mascota.dueno) {
                if (typeof mascota.dueno === 'object') duenoId = mascota.dueno.id || mascota.dueno.idDueno;
                else duenoId = mascota.dueno;
            }

            if (duenoId) {
                try {
                    const response = await clinicApi.request(`/api/clinic/duenos/${duenoId}`);
                    if (mounted && response && response.telefono) {
                        setOwnerPhone(response.telefono);
                    }
                } catch (err) {
                    console.warn("Could not fetch owner phone", err);
                }
            }
        };
        fetchOwnerInfo();

        const loadConsultas = async () => {
            setLoading(true);
            setError(null);
            try {
                const id = mascota.idMascota || mascota.id;

                let data = [];
                try {
                    // "debes llamar a esta Api: get /api/clinic/mascotas/{idMascota}/consultas"
                    const response = await clinicApi.request(`/api/clinic/mascotas/${id}/consultas`);

                    // Handle various response structures
                    if (Array.isArray(response)) {
                        data = response;
                    } else if (response && Array.isArray(response.results)) {
                        data = response.results;
                    } else if (response && Array.isArray(response.consultas)) {
                        data = response.consultas;
                    } else if (response && Array.isArray(response.data)) {
                        data = response.data;
                    } else {
                        // If the response is the pet object itself (as per the user sample maybe?) but we need consultations
                        // We strictly need the list. If it's missing, we default to empty.
                        console.warn("API response format unexpected, expected array or list wrapper:", response);
                        data = [];
                    }
                } catch (e) {
                    // If specific endpoint fails, we could try fallback or just fail
                    console.error("Failed to fetch specific history", e);
                    throw e;
                }

                if (!mounted) return;

                const arr = Array.isArray(data) ? data : data.data || [];
                const now = new Date();

                const past = [];
                const pending = [];

                arr.forEach((c) => {
                    const cDateStr = c.fecha || (c.fechaHora ? String(c.fechaHora).split("T")[0] : "");
                    const cTimeStr = c.hora || (c.fechaHora ? (String(c.fechaHora).split("T")[1] || "").slice(0, 5) : "00:00");

                    if (!cDateStr) return;

                    const cDateTime = new Date(`${cDateStr}T${cTimeStr}`);

                    // Simple logic: if status says 'Pendiente' or if date is in future (or today but time is future?)
                    // Let's rely on status if available, otherwise date
                    const isPending = c.estado === 'Pendiente' || c.status === 'pending' || cDateTime > now;

                    if (isPending) {
                        pending.push(c);
                    } else {
                        past.push(c);
                    }
                });

                // Sort: Past (descending), Pending (ascending)
                past.sort((a, b) => new Date(b.fecha || b.fechaHora) - new Date(a.fecha || a.fechaHora));
                pending.sort((a, b) => new Date(a.fecha || a.fechaHora) - new Date(b.fecha || b.fechaHora));

                setPastConsultas(past);
                setPendingConsultas(pending);

            } catch (err) {
                console.error("Error loading history", err);
                setError("No se pudo cargar el historial.");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadConsultas();
        return () => { mounted = false; };
    }, [open, mascota]);

    if (!mascota) return null;

    const ownerName =
        (mascota.dueno && (mascota.dueno.nombre || mascota.dueno.name)) ||
        mascota.dueno_nombre ||
        "-";

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>Historial de {mascota.nombre}</DialogTitle>
            <Divider />
            <DialogContent>
                <Grid container spacing={4}>
                    {/* Left Column: Pet Info */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ boxShadow: 3 }}>
                            <CardMedia
                                component="img"
                                height="200"
                                image={displayImage || dogImg}
                                alt={mascota.nombre}
                            />
                            <CardContent>
                                <SuiTypography variant="h5" gutterBottom>{mascota.nombre}</SuiTypography>
                                <SuiTypography variant="body2" color="text">
                                    <strong>Especie/Raza:</strong> {mascota.especie || "-"} - {mascota.raza || "-"}
                                </SuiTypography>
                                <SuiTypography variant="body2" color="text">
                                    <strong>Edad:</strong> {mascota.edad ? `${mascota.edad} años` : "-"}
                                </SuiTypography>
                                <SuiBox mt={2} mb={1}>
                                    <Divider />
                                </SuiBox>
                                <SuiTypography variant="subtitle2">Información del Dueño</SuiTypography>
                                <SuiTypography variant="body2" color="text">
                                    {ownerName}
                                </SuiTypography>
                                {ownerPhone && (
                                    <SuiTypography variant="body2" color="text">
                                        Tel: {ownerPhone}
                                    </SuiTypography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right Column: Consultations */}
                    <Grid item xs={12} md={8}>
                        {loading ? (
                            <SuiBox display="flex" justifyContent="center" p={4}>
                                <CircularProgress />
                            </SuiBox>
                        ) : error ? (
                            <SuiTypography color="error">{error}</SuiTypography>
                        ) : (
                            <Grid container spacing={2}>
                                {/* Past Consultations */}
                                <Grid item xs={12}>
                                    <SuiTypography variant="h6" textColor="dark" mb={2}>
                                        Consultas Realizadas
                                    </SuiTypography>
                                    {pastConsultas.length === 0 ? (
                                        <SuiTypography variant="caption" color="text">No hay consultas pasadas.</SuiTypography>
                                    ) : (
                                        <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #eee' }}>
                                            {pastConsultas.map((c, i) => (
                                                <React.Fragment key={i}>
                                                    <ListItem alignItems="flex-start">
                                                        <ListItemText
                                                            primary={c.motivo || "Consulta General"}
                                                            secondary={
                                                                <React.Fragment>
                                                                    <Typography component="span" variant="body2" color="text.primary">
                                                                        {c.fecha || (c.fechaHora || "").split("T")[0]}
                                                                    </Typography>
                                                                    {" — " + (c.diagnostico || c.observaciones || "Sin observaciones")}
                                                                </React.Fragment>
                                                            }
                                                        />
                                                    </ListItem>
                                                    {i < pastConsultas.length - 1 && <Divider variant="inset" component="li" />}
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    )}
                                </Grid>

                                {/* Pending Consultations */}
                                <Grid item xs={12} mt={3}>
                                    <SuiTypography variant="h6" textColor="dark" mb={2}>
                                        Consultas Pendientes
                                    </SuiTypography>
                                    {pendingConsultas.length === 0 ? (
                                        <SuiTypography variant="caption" color="text">No hay consultas futuras.</SuiTypography>
                                    ) : (
                                        <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #eee' }}>
                                            {pendingConsultas.map((c, i) => (
                                                <React.Fragment key={i}>
                                                    <ListItem alignItems="flex-start">
                                                        <ListItemText
                                                            primary={c.motivo || "Consulta Programada"}
                                                            secondary={
                                                                <React.Fragment>
                                                                    <Typography component="span" variant="body2" color="text.primary">
                                                                        {c.fecha || (c.fechaHora || "").split("T")[0]}
                                                                    </Typography>
                                                                    {" — " + (c.hora || (c.fechaHora || "").split("T")[1] || "").slice(0, 5)}
                                                                </React.Fragment>
                                                            }
                                                        />
                                                    </ListItem>
                                                    {i < pendingConsultas.length - 1 && <Divider variant="inset" component="li" />}
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    )}
                                </Grid>
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <SuiButton onClick={onClose} variant="outlined" buttonColor="dark">
                    Cerrar
                </SuiButton>
            </DialogActions>
        </Dialog>
    );
}
