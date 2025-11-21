import React from "react";
import ResourceCrud from "./ResourceCrud";

export default function Consultas() {
  return (
    <ResourceCrud
      resource="consultas"
      title="Consultas"
      fields={[
        { name: "motivo", label: "Motivo", required: true },
        { name: "descripcion", label: "Descripción" },
        { name: "historial", label: "ID Historial", type: "number", required: true },
        { name: "veterinario", label: "ID Veterinario", type: "number" },
      ]}
    />
  );
}
