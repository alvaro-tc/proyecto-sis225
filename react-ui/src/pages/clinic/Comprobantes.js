import React from "react";
import ResourceCrud from "./ResourceCrud";

export default function Comprobantes() {
  return (
    <ResourceCrud
      resource="comprobantes"
      title="Comprobantes"
      fields={[
        { name: "cita", label: "ID Cita", type: "number", required: true },
        { name: "dueno", label: "ID Dueño", type: "number", required: true },
      ]}
    />
  );
}
