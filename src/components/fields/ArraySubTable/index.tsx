import { lazy } from "react";
import { IFieldConfig, FieldType } from "@src/components/fields/types";
import withRenderTableCell from "@src/components/Table/TableCell/withRenderTableCell";

import { ArraySubTable as ArraySubTableIcon } from "@src/assets/icons/ArraySubTable";
import DisplayCell from "./DisplayCell";

const SideDrawerField = lazy(
  () =>
    import(
      "./SideDrawerField" /* webpackChunkName: "SideDrawerField-ArraySubTable" */
    )
);
const Settings = lazy(
  () => import("./Settings" /* webpackChunkName: "Settings-ArraySubtable" */)
);
export const config: IFieldConfig = {
  type: FieldType.arraySubTable,
  name: "Array-Sub-Table",
  group: "Connection",
  dataType: "undefined",
  initialValue: null,
  icon: <ArraySubTableIcon />,
  settings: Settings,
  description: "Connects to a array-table in the current row.",
  TableCell: withRenderTableCell(DisplayCell, null, "focus", {
    usesRowData: true,
    disablePadding: true,
  }),
  SideDrawerField,
  initializable: false,
  requireConfiguration: true,
  requireCollectionTable: true,
};
export default config;
