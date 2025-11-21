import React from "react";
import ResourceCrud from "./ResourceCrud";

export default function Duenos() {
  return (
    <ResourceCrud
      resource="duenos"
      title="Dueños"
      fields={[
        {
          name: "nombre",
          label: "Nombre completo",
          required: true,
          placeholder: "Ej: Juan Pérez",
          help: "Nombre y apellido",
        },
        {
          name: "correo",
          label: "Correo electrónico",
          type: "email",
          placeholder: "ejemplo@correo.com",
          help: "Correo de contacto",
        },
        {
          name: "telefono",
          label: "Teléfono",
          placeholder: "Ej: +34 600 000 000",
          help: "Número telefónico (móvil o fijo)",
        },
        {
          name: "direccion",
          label: "Dirección",
          placeholder: "Calle, número, ciudad",
          help: "Opcional",
        },
        {
          name: "notas",
          label: "Notas",
          placeholder: "Información adicional (alergias, preferencias)",
          help: "Opcional",
        },
      ]}
    />
  );
}
