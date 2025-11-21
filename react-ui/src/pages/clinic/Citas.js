import React from "react";
import ResourceCrud from "./ResourceCrud";

export default function Citas() {
  return (
    <ResourceCrud
      resource="citas"
      title="Citas"
      fields={[
        { name: "fecha", label: "Fecha (YYYY-MM-DD)", required: true },
        { name: "hora", label: "Hora (HH:MM:SS)", required: true },
        { name: "motivo", label: "Motivo" },
        { name: "dueno", label: "ID Dueño", type: "number", required: true },
        { name: "veterinario", label: "ID Veterinario", type: "number" },
      ]}
    />
  );
}
