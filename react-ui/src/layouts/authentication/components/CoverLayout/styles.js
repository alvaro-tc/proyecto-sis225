/**
=========================================================
* Soft UI Dashboard React - v2.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-material-ui
* Copyright 2021 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import { makeStyles } from "@mui/styles";

export default makeStyles(({ functions, borders }) => {
  const { pxToRem } = functions;
  const { borderRadius } = borders;

  return {
    coverLayout: {
      minHeight: "100vh",
      margin: 0,
    },

    coverLayout_imageBox: {
      transform: "skewX(-10deg)",
      height: "100%",
      overflow: "hidden",
      marginRight: pxToRem(-128),
      borderBottomLeftRadius: borderRadius.lg,
      // ensure the diagonal gradient sits behind the image
      backgroundImage:
        "linear-gradient(135deg, #5c5b78 0% 33%, #8f83b0 33% 66%, #5c5b78 66% 100%)",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    },

    coverLayout_image: {
      // If the `image` prop is the special sentinel value, render a diagonal
      // 3-band gradient as the background. Otherwise treat `image` as a URL.
      backgroundImage: ({ image }) =>
        image === "DIAGONAL_GRADIENT"
          ? `linear-gradient(135deg, #5c5b78 0% 33%, #8f83b0 33% 66%, #5c5b78 66% 100%)`
          : `url(${image})`,
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      transform: "skewX(10deg)",
      marginLeft: pxToRem(-64),
      height: "100%",
      // subtle plomo border on the leading edge for contrast
      boxShadow: "inset 0 0 0 1px rgba(107,108,112,0.08)",
    },

    coverLayout_dogBox: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      // keep the right column visually aligned with previous image position
      marginRight: pxToRem(0),
    },

    coverLayout_dogCircle: {
      width: pxToRem(542),
      height: pxToRem(542),
      borderRadius: "50%",
      backgroundColor: "#e7d0ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 10px 30px rgba(22,28,45,0.12)",
      marginLeft: pxToRem(0),
    },

    coverLayout_dogImage: {
      width: "99%",
      height: "99%",
      objectFit: "contain",
      borderRadius: "50%",
    },
  };
});
