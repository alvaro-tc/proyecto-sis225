import React from "react";
import ResourceCrud from "./ResourceCrud";

export default function Mascotas() {
  return (
    <ResourceCrud
      resource="mascotas"
      title="Mascotas"
      fields={[
        { name: "nombre", label: "Nombre", required: true },
        { name: "especie", label: "Especie" },
        { name: "raza", label: "Raza" },
        { name: "edad", label: "Edad", type: "number" },
        { name: "dueno", label: "ID Dueño", type: "number" },
      ]}
    />
  );
}
