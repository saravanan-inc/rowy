import { useCallback, useState, useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useSnackbar } from "notistack";
import { get, find } from "lodash-es";

import {
  tableScope,
  tableSchemaAtom,
  tableRowsAtom,
  updateFieldAtom,
  SelectedCell,
} from "@src/atoms/tableScope";
import { getFieldProp, getFieldType } from "@src/components/fields";
import { ColumnConfig } from "@src/types/table";

import { FieldType } from "@src/constants/fields";

const SUPPORTED_TYPES = new Set([
  FieldType.shortText,
  FieldType.longText,
  FieldType.number,
  FieldType.email,
  FieldType.percentage,
  FieldType.phone,
  FieldType.richText,
  FieldType.url,
  FieldType.json,
]);

export function useMenuAction(
  selectedCell: SelectedCell | null,
  handleClose?: Function
) {
  const { enqueueSnackbar } = useSnackbar();
  const [tableSchema] = useAtom(tableSchemaAtom, tableScope);
  const [tableRows] = useAtom(tableRowsAtom, tableScope);
  const updateField = useSetAtom(updateFieldAtom, tableScope);
  const [cellValue, setCellValue] = useState<string | undefined>();
  const [selectedCol, setSelectedCol] = useState<ColumnConfig>();

  const handleCopy = useCallback(async () => {
    try {
      if (cellValue !== undefined && cellValue !== null && cellValue !== "") {
        await navigator.clipboard.writeText(
          typeof cellValue === "object" ? JSON.stringify(cellValue) : cellValue
        );
        enqueueSnackbar("Copied");
      } else {
        await navigator.clipboard.writeText("");
      }
    } catch (error) {
      enqueueSnackbar(`Failed to copy:${error}`, { variant: "error" });
    }
    if (handleClose) handleClose();
  }, [cellValue, enqueueSnackbar, handleClose]);

  const handleCut = useCallback(async () => {
    try {
      if (!selectedCell || !selectedCol || !cellValue) return;
      if (cellValue !== undefined && cellValue !== null && cellValue !== "") {
        await navigator.clipboard.writeText(
          typeof cellValue === "object" ? JSON.stringify(cellValue) : cellValue
        );
        enqueueSnackbar("Copied");
      } else {
        await navigator.clipboard.writeText("");
      }
      if (cellValue !== undefined)
        updateField({
          path: selectedCell.path,
          fieldName: selectedCol.fieldName,
          value: undefined,
          deleteField: true,
          arrayTableData: {
            index: selectedCell.arrayIndex ?? 0,
          },
        });
    } catch (error) {
      enqueueSnackbar(`Failed to cut: ${error}`, { variant: "error" });
    }
    if (handleClose) handleClose();
  }, [
    cellValue,
    selectedCell,
    selectedCol,
    updateField,
    enqueueSnackbar,
    handleClose,
  ]);

  const handlePaste = useCallback(async () => {
    try {
      if (!selectedCell || !selectedCol) return;
      let text;
      try {
        text = await navigator.clipboard.readText();
      } catch (e) {
        enqueueSnackbar(`Read clilboard permission denied.`, {
          variant: "error",
        });
        return;
      }
      const cellDataType = getFieldProp("dataType", getFieldType(selectedCol));
      let parsed;
      switch (cellDataType) {
        case "number":
          parsed = Number(text);
          if (isNaN(parsed)) throw new Error(`${text} is not a number`);
          break;
        case "string":
          parsed = text;
          break;
        default:
          parsed = JSON.parse(text);
          break;
      }
      updateField({
        path: selectedCell.path,
        fieldName: selectedCol.fieldName,
        value: parsed,
        arrayTableData: {
          index: selectedCell.arrayIndex ?? 0,
        },
      });
    } catch (error) {
      enqueueSnackbar(
        `${selectedCol?.type} field does not support the data type being pasted`,
        { variant: "error" }
      );
    }
    if (handleClose) handleClose();
  }, [selectedCell, selectedCol, updateField, enqueueSnackbar, handleClose]);

  useEffect(() => {
    if (!selectedCell) return setCellValue("");
    const selectedCol = tableSchema.columns?.[selectedCell.columnKey];
    if (!selectedCol) return setCellValue("");
    setSelectedCol(selectedCol);

    const selectedRow = find(
      tableRows,
      selectedCell.arrayIndex === undefined
        ? ["_rowy_ref.path", selectedCell.path]
        : // if the table is an array table, we need to use the array index to find the row
          ["_rowy_arrayTableData.index", selectedCell.arrayIndex]
    );
    setCellValue(get(selectedRow, selectedCol.fieldName));
  }, [selectedCell, tableSchema, tableRows]);

  const checkEnabled = useCallback(
    (func: Function) => {
      return function () {
        if (SUPPORTED_TYPES.has(selectedCol?.type)) {
          return func();
        } else {
          enqueueSnackbar(
            `${selectedCol?.type} field cannot be copied using keyboard shortcut`,
            {
              variant: "info",
            }
          );
        }
      };
    },
    [enqueueSnackbar, selectedCol?.type]
  );

  return {
    handleCopy: checkEnabled(handleCopy),
    handleCut: checkEnabled(handleCut),
    handlePaste: handlePaste,
    cellValue,
  };
}
