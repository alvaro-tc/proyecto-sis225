import React from "react";
import ResourceCrud from "./ResourceCrud";

export default function Recepcionistas() {
  return (
    <ResourceCrud
      resource="recepcionistas"
      title="Recepcionistas"
      fields={[{ name: "nombre", label: "Nombre", required: true }]}
    />
  );
}
