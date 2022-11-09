import { lazy } from "react";
import { IFieldConfig, FieldType } from "@src/components/fields/types";
import withTableCell from "@src/components/Table/withTableCell";

import CodeIcon from "@mui/icons-material/Code";
import DisplayCell from "./DisplayCell";

const Settings = lazy(
  () => import("./Settings" /* webpackChunkName: "Settings-Code" */)
);

const SideDrawerField = lazy(
  () =>
    import("./SideDrawerField" /* webpackChunkName: "SideDrawerField-Code" */)
);

export const config: IFieldConfig = {
  type: FieldType.code,
  name: "Code",
  group: "Code",
  dataType: "string",
  initialValue: "",
  initializable: true,
  icon: <CodeIcon />,
  description: "Raw code edited with the Monaco Editor.",
  TableCell: withTableCell(DisplayCell, SideDrawerField, "popover"),
  SideDrawerField,
  settings: Settings,
};
export default config;
