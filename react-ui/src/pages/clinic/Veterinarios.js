import React from "react";
import ResourceCrud from "./ResourceCrud";

export default function Veterinarios() {
  return (
    <ResourceCrud
      resource="veterinarios"
      title="Veterinarios"
      fields={[{ name: "nombre", label: "Nombre", required: true }]}
    />
  );
}
