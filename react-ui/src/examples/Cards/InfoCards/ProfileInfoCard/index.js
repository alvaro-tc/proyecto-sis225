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

// react-routers components
import { Link } from "react-router-dom";

// prop-types is library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiTypography from "components/SuiTypography";

// Soft UI Dashboard React base styles
// colors/typography imports removed because social section was removed

function ProfileInfoCard({ title, description, info, action }) {
  const labels = [];
  const values = [];

  // Convert this form `objectKey` of the object key in to this `object key`
  Object.keys(info).forEach((el) => {
    if (el.match(/[A-Z\s]+/)) {
      const uppercaseLetter = Array.from(el).find((i) => i.match(/[A-Z]+/));
      const newElement = el.replace(uppercaseLetter, ` ${uppercaseLetter.toLowerCase()}`);

      labels.push(newElement);
    } else {
      labels.push(el);
    }
  });

  // Push the object values into the values array
  Object.values(info).forEach((el) => values.push(el));

  // Render the card info items
  const renderItems = labels.map((label, key) => (
    <SuiBox key={label} display="flex" py={1} pr={2}>
      <SuiTypography variant="button" fontWeight="bold" textTransform="capitalize">
        {label}: &nbsp;
      </SuiTypography>
      <SuiTypography variant="button" fontWeight="regular" textColor="text">
        &nbsp;{values[key]}
      </SuiTypography>
    </SuiBox>
  ));

  // social section intentionally removed for clinic profile

  return (
    <Card className="h-100">
      <SuiBox display="flex" justifyContent="space-between" alignItems="center" pt={2} px={2}>
        <SuiTypography variant="h6" fontWeight="medium" textTransform="capitalize">
          {title}
        </SuiTypography>
        {action && action.onClick ? (
          <SuiTypography
            component="button"
            onClick={action.onClick}
            variant="body2"
            textColor="secondary"
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <Tooltip title={action.tooltip} placement="top">
              <Icon>edit</Icon>
            </Tooltip>
          </SuiTypography>
        ) : (
          <SuiTypography component={Link} to={action.route} variant="body2" textColor="secondary">
            <Tooltip title={action.tooltip} placement="top">
              <Icon>edit</Icon>
            </Tooltip>
          </SuiTypography>
        )}
      </SuiBox>
      <SuiBox p={2}>
        <SuiBox mb={2} lineHeight={1.25}>
          <SuiTypography variant="button" textColor="text" fontWeight="regular">
            {description}
          </SuiTypography>
        </SuiBox>
        <SuiBox opacity={0.3}>
          <Divider />
        </SuiBox>
        <SuiBox>{renderItems}</SuiBox>
      </SuiBox>
    </Card>
  );
}

// Typechecking props for the ProfileInfoCard
ProfileInfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  info: PropTypes.objectOf(PropTypes.string).isRequired,
  action: PropTypes.shape({
    route: PropTypes.string,
    tooltip: PropTypes.string.isRequired,
    onClick: PropTypes.func,
  }).isRequired,
};
/**
 * Note: social prop and defaults removed on purpose for clinic usage.
 */

export default ProfileInfoCard;
