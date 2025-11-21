import React from "react";
import ResourceCrud from "./ResourceCrud";

export default function Historiales() {
  return (
    <ResourceCrud
      resource="historiales"
      title="Historiales"
      fields={[{ name: "mascota", label: "ID Mascota", type: "number", required: true }]}
    />
  );
}
