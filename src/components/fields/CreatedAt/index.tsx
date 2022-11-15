import { lazy } from "react";
import { IFieldConfig, FieldType } from "@src/components/fields/types";
import withTableCell from "@src/components/Table/withTableCell";

import { CreatedAt as CreatedAtIcon } from "@src/assets/icons";
import DisplayCell from "./DisplayCell";

const SideDrawerField = lazy(
  () =>
    import(
      "./SideDrawerField" /* webpackChunkName: "SideDrawerField-CreatedAt" */
    )
);
const Settings = lazy(
  () =>
    import("../CreatedBy/Settings" /* webpackChunkName: "Settings-CreatedAt" */)
);

export const config: IFieldConfig = {
  type: FieldType.createdAt,
  name: "Created At",
  group: "Auditing",
  dataType: "firebase.firestore.Timestamp",
  initialValue: null,
  icon: <CreatedAtIcon />,
  description: "Displays the timestamp of when the row was created. Read-only.",
  TableCell: withTableCell(DisplayCell, null),
  SideDrawerField,
  settings: Settings,
};
export default config;
