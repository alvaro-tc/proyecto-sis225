/* eslint-disable react/prop-types */
// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";
import SuiAvatar from "components/SuiAvatar";

// Images (use curved/illustrative images for species)
import dogImg from "assets/images/curved-images/curved1.jpg";
import catImg from "assets/images/curved-images/curved14.jpg";
import rabbitImg from "assets/images/curved-images/curved0.jpg";
import defaultImg from "assets/images/team-2.jpg";

function Author({ image, name }) {
  return (
    <SuiBox display="flex" alignItems="center" px={1} py={0.5}>
      <SuiBox mr={2}>
        <SuiAvatar src={image} alt={name} size="sm" variant="rounded" />
      </SuiBox>
      <SuiBox display="flex" flexDirection="column">
        <SuiTypography variant="button" fontWeight="medium">
          {name}
        </SuiTypography>
      </SuiBox>
    </SuiBox>
  );
}

function Function({ job, org }) {
  return (
    <SuiBox display="flex" flexDirection="column">
      <SuiTypography variant="caption" fontWeight="medium" textColor="text">
        {job}
      </SuiTypography>
      <SuiTypography variant="caption" textColor="secondary">
        {org}
      </SuiTypography>
    </SuiBox>
  );
}

export default {
  columns: [
    { name: "Nombre", align: "left" },
    { name: "Raza", align: "left" },
    { name: "Edad", align: "center" },
    { name: "action", align: "center" },
  ],

  rows: [
    {
      Nombre: <Author image={dogImg} name="Firulais" />,
      Raza: <Function job="Perro" org="Labrador" />,
      Edad: (
        <SuiTypography variant="caption" textColor="secondary" fontWeight="medium">
          3
        </SuiTypography>
      ),
      action: (
        <SuiTypography
          component="a"
          href="#"
          variant="caption"
          textColor="secondary"
          fontWeight="medium"
        >
          Edit
        </SuiTypography>
      ),
    },
    {
      Nombre: <Author image={catImg} name="Misu" />,
      Raza: <Function job="Gato" org="Europeo" />,
      Edad: (
        <SuiTypography variant="caption" textColor="secondary" fontWeight="medium">
          2
        </SuiTypography>
      ),
      action: (
        <SuiTypography
          component="a"
          href="#"
          variant="caption"
          textColor="secondary"
          fontWeight="medium"
        >
          Edit
        </SuiTypography>
      ),
    },
    {
      Nombre: <Author image={rabbitImg} name="Bunny" />,
      Raza: <Function job="Conejo" org="Angora" />,
      Edad: (
        <SuiTypography variant="caption" textColor="secondary" fontWeight="medium">
          1
        </SuiTypography>
      ),
      action: (
        <SuiTypography
          component="a"
          href="#"
          variant="caption"
          textColor="secondary"
          fontWeight="medium"
        >
          Edit
        </SuiTypography>
      ),
    },
  ],
};
