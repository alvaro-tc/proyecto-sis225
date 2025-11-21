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

import { useMemo, useState, useEffect } from "react";

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import { Table as MuiTable } from "@mui/material";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";

// Soft UI Dashboard React components
import SuiBox from "components/SuiBox";
import SuiAvatar from "components/SuiAvatar";
import SuiTypography from "components/SuiTypography";

// Soft UI Dashboard React base styles
import colors from "assets/theme/base/colors";
import typography from "assets/theme/base/typography";
import borders from "assets/theme/base/borders";

import clinicApi from "api/clinic";

function Table({ columns, rows, apiResource, rowMapper }) {
  const [remoteRows, setRemoteRows] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!apiResource || !rowMapper) return;
      setLoading(true);
      try {
        const data = await clinicApi.list(apiResource);
        if (!mounted) return;
        const mapped = (data || []).map((it) => rowMapper(it));
        setRemoteRows(mapped);
      } catch (e) {
        console.error("Error loading table data:", e);
        setRemoteRows([]);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [apiResource, rowMapper]);
  const { light } = colors;
  const { size, fontWeightBold } = typography;
  const { borderWidth } = borders;

  const renderColumns = columns.map(({ name, align }, key) => {
    let pl;
    let pr;

    if (key === 0) {
      pl = 3;
      pr = 3;
    } else if (key === columns.length - 1) {
      pl = 3;
      pr = 3;
    } else {
      pl = 1;
      pr = 1;
    }

    return (
      <SuiBox
        key={name}
        component="th"
        pt={1.5}
        pb={1.25}
        pl={align === "left" ? pl : 3}
        pr={align === "right" ? pr : 3}
        textAlign={align}
        fontSize={size.xxs}
        fontWeight={fontWeightBold}
        color="secondary"
        opacity={0.7}
        borderBottom={`${borderWidth[1]} solid ${light.main}`}
      >
        {name.toUpperCase()}
      </SuiBox>
    );
  });

  const rowsToRender = apiResource && rowMapper ? remoteRows : rows;

  const renderRows = (rowsToRender || []).map((row, key) => {
    const rowKey = `row-${key}`;

    const tableRow = columns.map(({ name, align }) => {
      let template;

      if (Array.isArray(row[name])) {
        template = (
          <SuiBox key={row[name][1]} component="td" p={1}>
            <SuiBox display="flex" alignItems="center" py={0.5} px={1}>
              <SuiBox mr={2}>
                <SuiAvatar src={row[name][0]} name={row[name][1]} variant="rounded" size="sm" />
              </SuiBox>
              <SuiTypography variant="button" fontWeight="medium" customClass="w-max">
                {row[name][1]}
              </SuiTypography>
            </SuiBox>
          </SuiBox>
        );
      } else {
        template = (
          <SuiBox key={row[name]} component="td" p={1} textAlign={align}>
            <SuiTypography
              variant="button"
              fontWeight="regular"
              textColor="secondary"
              customClass="d-inline-block w-max"
            >
              {row[name]}
            </SuiTypography>
          </SuiBox>
        );
      }

      return template;
    });

    return <TableRow key={rowKey}>{tableRow}</TableRow>;
  });

  return useMemo(
    () => (
      <TableContainer>
        <MuiTable>
          <SuiBox component="thead">
            <TableRow>{renderColumns}</TableRow>
          </SuiBox>
          <TableBody>
            {loading ? (
              <TableRow>
                <SuiBox component="td" p={2} colSpan={columns.length} textAlign="center">
                  Cargando...
                </SuiBox>
              </TableRow>
            ) : (
              renderRows
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>
    ),
    [columns, rows, loading, rowsToRender]
  );
}

// Setting default values for the props of Table
Table.defaultProps = {
  columns: [],
  rows: [{}],
};

// Typechecking props for the Table
Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object),
  rows: PropTypes.arrayOf(PropTypes.object),
  apiResource: PropTypes.string,
  rowMapper: PropTypes.func,
};

export default Table;
