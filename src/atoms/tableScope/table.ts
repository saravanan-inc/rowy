import { atom } from "jotai";
import { atomWithReducer } from "jotai/utils";
import {
  uniqBy,
  sortBy,
  findIndex,
  cloneDeep,
  unset,
  orderBy,
} from "lodash-es";

import {
  TableSettings,
  TableSchema,
  ColumnConfig,
  TableFilter,
  TableOrder,
  TableRow,
  UpdateDocFunction,
  UpdateCollectionDocFunction,
  DeleteCollectionDocFunction,
} from "@src/types/table";
import { updateRowData } from "@src/utils/table";

/** Root atom from which others are derived */
export const tableIdAtom = atom("");
/** Store tableSettings from project settings document */
export const tableSettingsAtom = atom<TableSettings>({
  id: "",
  collection: "",
  name: "",
  roles: [],
  section: "",
  tableType: "primaryCollection",
});
/** Store tableSchema from schema document */
export const tableSchemaAtom = atom<TableSchema>({});
/** Store function to update tableSchema */
export const updateTableSchemaAtom = atom<
  UpdateDocFunction<TableSchema> | undefined
>(undefined);
/** Store the table columns as an ordered array */
export const tableColumnsOrderedAtom = atom<ColumnConfig[]>((get) => {
  const tableSchema = get(tableSchemaAtom);
  if (!tableSchema || !tableSchema.columns) return [];
  return orderBy(Object.values(tableSchema?.columns ?? {}), "index");
});
/** Reducer function to convert from array of columns to columns object */
export const tableColumnsReducer = (
  a: Record<string, ColumnConfig>,
  c: ColumnConfig,
  index: number
) => {
  a[c.key] = { ...c, index };
  return a;
};

/** Filters applied to the local view */
export const tableFiltersAtom = atom<TableFilter[]>([]);
/** Orders applied to the local view */
export const tableOrdersAtom = atom<TableOrder[]>([]);
/** Latest page in the infinite scroll */
export const tablePageAtom = atom(0);

type TableRowsLocalAction =
  /** Overwrite all rows */
  | { type: "set"; rows: TableRow[] }
  /** Add a row or multiple rows */
  | { type: "add"; row: TableRow | TableRow[] }
  /** Update a row */
  | {
      type: "update";
      path: string;
      row: Partial<TableRow>;
      deleteFields?: string[];
    }
  /** Delete a row or multiple rows */
  | { type: "delete"; path: string | string[] };
const tableRowsLocalReducer = (
  prev: TableRow[],
  action: TableRowsLocalAction
): TableRow[] => {
  if (action.type === "set") {
    return [...action.rows];
  }
  if (action.type === "add") {
    if (Array.isArray(action.row)) return [...action.row, ...prev];
    return [action.row, ...prev];
  }
  if (action.type === "update") {
    const index = findIndex(prev, ["_rowy_ref.path", action.path]);
    if (index > -1) {
      const updatedRows = [...prev];
      if (Array.isArray(action.deleteFields)) {
        updatedRows[index] = cloneDeep(prev[index]);
        for (const field of action.deleteFields) {
          unset(updatedRows[index], field);
        }
      }
      updatedRows[index] = updateRowData(updatedRows[index], action.row);
      return updatedRows;
    }
    // If not found, add to start
    if (index === -1)
      return [
        {
          ...action.row,
          _rowy_ref: {
            path: action.path,
            id: action.path.split("/").pop() || action.path,
          },
        },
        ...prev,
      ];
  }
  if (action.type === "delete") {
    return prev.filter((row) => {
      if (Array.isArray(action.path)) {
        return !action.path.includes(row._rowy_ref.path);
      } else {
        return row._rowy_ref.path !== action.path;
      }
    });
  }
  throw new Error("Invalid action");
};
/**
 * Store rows that are out of order or not ready to be written to the db.
 * See {@link TableRowsLocalAction} for reducer actions.
 */
export const tableRowsLocalAtom = atomWithReducer(
  [] as TableRow[],
  tableRowsLocalReducer
);

/** Store rows from the db listener */
export const tableRowsDbAtom = atom<TableRow[]>([]);
/** Combine tableRowsLocal and tableRowsDb */
export const tableRowsAtom = atom<TableRow[]>((get) =>
  sortBy(
    uniqBy(
      [...get(tableRowsLocalAtom), ...get(tableRowsDbAtom)],
      "_rowy_ref.path"
    ),
    "_rowy_ref.path"
  )
);
/** Store loading more state for infinite scroll */
export const tableLoadingMoreAtom = atom(false);

/**
 * Store function to add or update row in db directly.
 * Has same behaviour as Firestore setDoc with merge.
 * @see
 * - {@link updateRowData} implementation
 * - https://stackoverflow.com/a/47554197/3572007
 * @internal Use {@link addRowAtom} or {@link updateRowAtom} instead
 */
export const _updateRowDbAtom = atom<UpdateCollectionDocFunction | undefined>(
  undefined
);
/**
 * Store function to delete row in db directly
 * @internal Use {@link deleteRowAtom} instead
 */
export const _deleteRowDbAtom = atom<DeleteCollectionDocFunction | undefined>(
  undefined
);

export type AuditChangeFunction = (
  type: "ADD_ROW" | "UPDATE_CELL" | "DELETE_ROW",
  rowId: string,
  data?:
    | {
        updatedField?: string | undefined;
      }
    | undefined
) => Promise<any>;
/**
 * Store function to write auditing logs when user makes changes to the table.
 * Silently fails if auditing is disabled for the table or Rowy Run version
 * not compatible.
 *
 * @param type - Action type: "ADD_ROW" | "UPDATE_CELL" | "DELETE_ROW"
 * @param rowId - ID of row updated
 * @param data - Optional additional data to log
 */
export const auditChangeAtom = atom<AuditChangeFunction | undefined>(undefined);