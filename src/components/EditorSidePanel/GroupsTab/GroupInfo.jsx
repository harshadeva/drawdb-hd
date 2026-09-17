import { useMemo, useRef, useState } from "react";
import { Button, Input, Tooltip } from "@douyinfe/semi-ui";
import {
  IconDeleteStroked,
  IconEyeOpened,
  IconEyeClosed,
} from "@douyinfe/semi-icons";
import ColorPicker from "../ColorPicker";
import {
  useDiagram,
  useGroups,
  useGroupFocus,
  useLayout,
  useSelect,
  useUndoRedo,
} from "../../../hooks";
import { Action, ObjectType } from "../../../data/constants";
import { useTranslation } from "react-i18next";

export default function GroupInfo({ data }) {
  const { t } = useTranslation();
  const { layout } = useLayout();
  const { tables, updateTable } = useDiagram();
  const { deleteGroup, updateGroup } = useGroups();
  const { focusedGroupIds, toggleFocus } = useGroupFocus();
  const { bulkSelectedElements, setBulkSelectedElements } = useSelect();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const initialColorRef = useRef(data.color);
  const initialColorIdRef = useRef(data.colorId ?? null);

  const members = useMemo(
    () => tables.filter((t) => t.groupIds?.includes(data.id)),
    [tables, data.id],
  );

  const selectedTableIds = useMemo(
    () =>
      new Set(
        bulkSelectedElements
          .filter((el) => el.type === ObjectType.TABLE)
          .map((el) => el.id),
      ),
    [bulkSelectedElements],
  );

  const addableSelection = useMemo(
    () =>
      tables.filter(
        (t) => selectedTableIds.has(t.id) && !t.groupIds?.includes(data.id),
      ),
    [tables, selectedTableIds, data.id],
  );

  const removableSelection = useMemo(
    () =>
      tables.filter(
        (t) => selectedTableIds.has(t.id) && t.groupIds?.includes(data.id),
      ),
    [tables, selectedTableIds, data.id],
  );

  const isFocused = focusedGroupIds.has(data.id);

  const handleColorPick = (color, colorId = null) => {
    updateGroup(data.id, { color, colorId });
    setUndoStack((prev) => {
      let undoColor = initialColorRef.current;
      let undoColorId = initialColorIdRef.current;
      const lastColorChange = prev.findLast(
        (e) =>
          e.element === ObjectType.GROUP &&
          e.gid === data.id &&
          e.action === Action.EDIT &&
          e.redo?.color,
      );
      if (lastColorChange) {
        undoColor = lastColorChange.redo.color;
        undoColorId = lastColorChange.redo.colorId ?? null;
      }

      if (color === undoColor && colorId === undoColorId) return prev;

      return [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.GROUP,
          gid: data.id,
          undo: { color: undoColor, colorId: undoColorId },
          redo: { color: color, colorId: colorId },
          message: t("edit_group", { groupName: data.name, extra: "[color]" }),
        },
      ];
    });
    setRedoStack([]);
  };

  const selectMembers = () => {
    setBulkSelectedElements(
      members.map((m) => ({
        id: m.id,
        type: ObjectType.TABLE,
        initialCoords: { x: m.x, y: m.y },
        currentCoords: { x: m.x, y: m.y },
      })),
    );
  };

  const addSelectionToGroup = () => {
    if (addableSelection.length === 0) return;
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        bulk: true,
        message: t("add_to_group", { groupName: data.name }),
        elements: addableSelection.map((tbl) => ({
          id: tbl.id,
          type: ObjectType.TABLE,
          undo: { groupIds: tbl.groupIds ?? [] },
          redo: { groupIds: [...(tbl.groupIds ?? []), data.id] },
        })),
      },
    ]);
    setRedoStack([]);
    addableSelection.forEach((tbl) => {
      updateTable(tbl.id, { groupIds: [...(tbl.groupIds ?? []), data.id] });
    });
  };

  const removeSelectionFromGroup = () => {
    if (removableSelection.length === 0) return;
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        bulk: true,
        message: t("remove_from_group", { groupName: data.name }),
        elements: removableSelection.map((tbl) => ({
          id: tbl.id,
          type: ObjectType.TABLE,
          undo: { groupIds: tbl.groupIds ?? [] },
          redo: {
            groupIds: (tbl.groupIds ?? []).filter((id) => id !== data.id),
          },
        })),
      },
    ]);
    setRedoStack([]);
    removableSelection.forEach((tbl) => {
      updateTable(tbl.id, {
        groupIds: (tbl.groupIds ?? []).filter((id) => id !== data.id),
      });
    });
  };

  return (
    <div className="my-3">
      <div className="flex gap-2 items-center">
        <Input
          value={data.name}
          placeholder={t("name")}
          readonly={layout.readOnly}
          onChange={(value) => updateGroup(data.id, { name: value })}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.GROUP,
                gid: data.id,
                undo: editField,
                redo: { name: e.target.value },
                message: t("edit_group", {
                  groupName: e.target.value,
                  extra: "[name]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
        <ColorPicker
          value={data.color}
          colorId={data.colorId ?? null}
          readOnly={layout.readOnly}
          onChange={(color) => updateGroup(data.id, { color, colorId: null })}
          onColorPick={(color, colorId) => handleColorPick(color, colorId)}
        />
        <Tooltip content={isFocused ? t("focus_group_off") : t("focus_group")}>
          <Button
            type={isFocused ? "primary" : "tertiary"}
            icon={isFocused ? <IconEyeOpened /> : <IconEyeClosed />}
            onClick={() => toggleFocus(data.id)}
          />
        </Tooltip>
        <Button
          type="danger"
          disabled={layout.readOnly}
          icon={<IconDeleteStroked />}
          onClick={() => deleteGroup(data.id)}
        />
      </div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <button
          type="button"
          className="text-xs opacity-70 hover:underline disabled:no-underline disabled:opacity-40"
          disabled={members.length === 0}
          onClick={selectMembers}
        >
          {t("select_members", { count: members.length })}
        </button>
        <div className="flex gap-2">
          {removableSelection.length > 0 && (
            <Button
              size="small"
              type="danger"
              theme="borderless"
              disabled={layout.readOnly}
              onClick={removeSelectionFromGroup}
            >
              {t("remove_from_group", { groupName: data.name })} (
              {removableSelection.length})
            </Button>
          )}
          {addableSelection.length > 0 && (
            <Button
              size="small"
              disabled={layout.readOnly}
              onClick={addSelectionToGroup}
            >
              {t("add_to_group", { groupName: data.name })} (
              {addableSelection.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
