import { useState, useRef } from "react";
import { Button, Input, InputNumber } from "@douyinfe/semi-ui";
import ColorPicker from "../ColorPicker";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useAreas, useLayout, useUndoRedo } from "../../../hooks";
import {
  Action,
  ObjectType,
  AreaSubtype,
  defaultBoundaryBorderWidth,
  minBoundaryBorderWidth,
  maxBoundaryBorderWidth,
} from "../../../data/constants";
import { useTranslation } from "react-i18next";

export default function AreaInfo({ data, i }) {
  const { t } = useTranslation();
  const { layout } = useLayout();
  const { deleteArea, updateArea } = useAreas();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const initialColorRef = useRef(data.color);
  const initialColorIdRef = useRef(data.colorId ?? null);

  const handleColorPick = (color, colorId = null) => {
    updateArea(i, { color, colorId });
    setUndoStack((prev) => {
      let undoColor = initialColorRef.current;
      let undoColorId = initialColorIdRef.current;
      const lastColorChange = prev.findLast(
        (e) =>
          e.element === ObjectType.AREA &&
          e.aid === data.id &&
          e.action === Action.EDIT &&
          e.redo?.color,
      );
      if (lastColorChange) {
        undoColor = lastColorChange.redo.color;
        undoColorId = lastColorChange.redo.colorId ?? null;
      }

      if (color === undoColor && colorId === undoColorId) return prev;

      const newStack = [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.AREA,
          aid: i,
          undo: { color: undoColor, colorId: undoColorId },
          redo: { color: color, colorId: colorId },
          message: t("edit_area", {
            areaName: data.name,
            extra: "[color]",
          }),
        },
      ];
      return newStack;
    });
    setRedoStack([]);
  };

  const isBoundary = data.subtype === AreaSubtype.BOUNDARY;

  return (
    <div id={`scroll_area_${data.id}`} className="my-3">
      <div className="flex gap-2 items-center">
        <Input
          value={data.name}
          placeholder={t("name")}
          readonly={layout.readOnly}
          onChange={(value) => updateArea(data.id, { name: value })}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.AREA,
                aid: i,
                undo: editField,
                redo: { name: e.target.value },
                message: t("edit_area", {
                  areaName: e.target.value,
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
          onChange={(color) => updateArea(i, { color, colorId: null })}
          onColorPick={(color, colorId) => handleColorPick(color, colorId)}
        />
        <Button
          type="danger"
          disabled={layout.readOnly}
          icon={<IconDeleteStroked />}
          onClick={() => deleteArea(i, true)}
        />
      </div>
      {isBoundary && (
        <div className="flex gap-2 items-center mt-2">
          <span className="text-xs opacity-70 whitespace-nowrap">
            {t("border_width")}
          </span>
          <InputNumber
            className="grow"
            min={minBoundaryBorderWidth}
            max={maxBoundaryBorderWidth}
            step={1}
            disabled={layout.readOnly}
            value={data.borderWidth ?? defaultBoundaryBorderWidth}
            onChange={(value) => {
              if (typeof value !== "number" || Number.isNaN(value)) return;
              updateArea(i, { borderWidth: value });
            }}
            onFocus={() =>
              setEditField({
                borderWidth: data.borderWidth ?? defaultBoundaryBorderWidth,
              })
            }
            onBlur={() => {
              const next = data.borderWidth ?? defaultBoundaryBorderWidth;
              if (next === editField.borderWidth) return;
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.AREA,
                  aid: i,
                  undo: { borderWidth: editField.borderWidth },
                  redo: { borderWidth: next },
                  message: t("edit_area", {
                    areaName: data.name,
                    extra: "[border width]",
                  }),
                },
              ]);
              setRedoStack([]);
            }}
          />
        </div>
      )}
    </div>
  );
}
