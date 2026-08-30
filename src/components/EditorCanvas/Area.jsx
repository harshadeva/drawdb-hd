import { useMemo, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Popover,
  Input,
  InputNumber,
  Divider,
} from "@douyinfe/semi-ui";
import ColorPicker from "../EditorSidePanel/ColorPicker";
import {
  IconEdit,
  IconDeleteStroked,
  IconLock,
  IconUnlock,
} from "@douyinfe/semi-icons";
import {
  Tab,
  Action,
  ObjectType,
  State,
  AreaSubtype,
  defaultBoundaryBorderWidth,
  minBoundaryBorderWidth,
  maxBoundaryBorderWidth,
} from "../../data/constants";
import {
  useLayout,
  useSettings,
  useUndoRedo,
  useSelect,
  useAreas,
  useSaveState,
  useColorPalette,
} from "../../hooks";
import { useTranslation } from "react-i18next";
import { useHover } from "usehooks-ts";

export default function Area({
  data,
  onPointerDown,
  setResize,
  setInitDimensions,
}) {
  const ref = useRef(null);
  const isHovered = useHover(ref);
  const { layout } = useLayout();
  const { settings } = useSettings();
  const { setSaveState } = useSaveState();
  const { updateArea } = useAreas();
  const { resolve: resolveColor } = useColorPalette();
  const areaColor = resolveColor(data);
  const {
    selectedElement,
    setSelectedElement,
    bulkSelectedElements,
    setBulkSelectedElements,
  } = useSelect();

  const handleResize = (e, dir) => {
    setResize({ id: data.id, dir: dir });
    setInitDimensions({
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
    });
  };

  const lockUnlockArea = (e) => {
    const locking = !data.locked;
    updateArea(data.id, { locked: locking });

    const lockArea = () => {
      setSelectedElement({
        ...selectedElement,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      });
      setBulkSelectedElements((prev) =>
        prev.filter((el) => el.id !== data.id || el.type !== ObjectType.AREA),
      );
    };

    const unlockArea = () => {
      const elementInBulk = {
        id: data.id,
        type: ObjectType.AREA,
        initialCoords: { x: data.x, y: data.y },
        currentCoords: { x: data.x, y: data.y },
      };
      if (e.ctrlKey || e.metaKey) {
        setBulkSelectedElements((prev) => [...prev, elementInBulk]);
      } else {
        setBulkSelectedElements([elementInBulk]);
      }
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.AREA,
        id: data.id,
        open: false,
      }));
    };

    if (locking) {
      lockArea();
    } else {
      unlockArea();
    }
  };

  const edit = () => {
    if (layout.sidebar) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.AREA,
        id: data.id,
        currentTab: Tab.AREAS,
        open: true,
      }));
      if (selectedElement.currentTab !== Tab.AREAS) return;
      document
        .getElementById(`scroll_area_${data.id}`)
        .scrollIntoView({ behavior: "smooth" });
    } else {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.AREA,
        id: data.id,
        open: true,
      }));
    }
  };

  const onClickOutSide = () => {
    if (selectedElement.editFromToolbar) {
      setSelectedElement((prev) => ({
        ...prev,
        editFromToolbar: false,
      }));
      return;
    }
    setSelectedElement((prev) => ({
      ...prev,
      open: false,
    }));
    setSaveState(State.SAVING);
  };

  const areaIsOpen = () =>
    selectedElement.element === ObjectType.AREA &&
    selectedElement.id === data.id &&
    selectedElement.open;

  const isSelected = useMemo(() => {
    return (
      (selectedElement.id === data.id &&
        selectedElement.element === ObjectType.AREA) ||
      bulkSelectedElements.some(
        (e) => e.type === ObjectType.AREA && e.id === data.id,
      )
    );
  }, [selectedElement, data, bulkSelectedElements]);

  const isBoundary = data.subtype === AreaSubtype.BOUNDARY;
  const boundaryBorderWidth = data.borderWidth ?? defaultBoundaryBorderWidth;

  return (
    <g ref={ref}>
      <foreignObject
        key={data.id}
        x={data.x}
        y={data.y}
        width={data.width > 0 ? data.width : 0}
        height={data.height > 0 ? data.height : 0}
        onPointerDown={onPointerDown}
        // The area body is inert: only the title (which opts back in below) and
        // the border hit-band <rect> after this <foreignObject> select/drag the
        // area, so tables and nested areas inside it stay individually clickable.
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`w-full h-full p-2 rounded border-2 ${
            isHovered
              ? "border-dashed border-[#ff6a3d]"
              : isSelected
                ? `${isBoundary ? "border-dashed" : ""} border-[#ff6a3d] opacity-100`
                : isBoundary
                  ? "border-dashed opacity-100"
                  : "border-slate-400 opacity-100"
          }`}
          style={{
            backgroundColor: isBoundary ? "transparent" : `${areaColor}66`,
            borderColor:
              isBoundary && !isHovered && !isSelected
                ? areaColor
                : undefined,
            borderWidth: isBoundary ? boundaryBorderWidth : undefined,
            pointerEvents: "none",
          }}
          onDoubleClick={edit}
        >
          <div className="flex justify-between gap-1 w-full">
            {isBoundary ? (
              <div
                className="font-bold uppercase tracking-wide text-[15px] leading-tight px-2 py-[2px] rounded select-none overflow-hidden text-ellipsis whitespace-nowrap max-w-full cursor-move"
                style={{
                  color: areaColor,
                  backgroundColor: `${areaColor}1f`,
                  pointerEvents: "auto",
                }}
                title={data.name}
                onPointerDown={onPointerDown}
                onDoubleClick={edit}
              >
                {data.name}
              </div>
            ) : (
              <div
                className="text-color select-none overflow-hidden text-ellipsis cursor-move"
                style={{ pointerEvents: "auto" }}
                title={data.name}
                onPointerDown={onPointerDown}
                onDoubleClick={edit}
              >
                {data.name}
              </div>
            )}
            {(isHovered || (areaIsOpen() && !layout.sidebar)) && (
              <div style={{ pointerEvents: "auto" }}>
                <ButtonGroup
                  type="tertiary"
                  size="small"
                  aria-label="Area actions"
                >
                  <Button
                    size="small"
                    type="tertiary"
                    icon={
                      data.locked ? (
                        <IconLock size="small" />
                      ) : (
                        <IconUnlock size="small" />
                      )
                    }
                    onClick={lockUnlockArea}
                    disabled={layout.readOnly}
                  />
                  <Popover
                    visible={areaIsOpen() && !layout.sidebar}
                    onClickOutSide={onClickOutSide}
                    stopPropagation
                    content={<EditPopoverContent data={data} />}
                    trigger="custom"
                    position="rightTop"
                    showArrow
                  >
                    <Button
                      size="small"
                      type="tertiary"
                      icon={<IconEdit size="small" />}
                      onClick={edit}
                    />
                  </Popover>
                </ButtonGroup>
              </div>
            )}
          </div>
        </div>
      </foreignObject>
      {data.width > 0 && data.height > 0 && (
        <rect
          x={data.x}
          y={data.y}
          width={data.width}
          height={data.height}
          rx={4}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max((data.borderWidth ?? 2) + 8, 12)}
          pointerEvents="stroke"
          style={{ cursor: "move" }}
          onPointerDown={onPointerDown}
        />
      )}
      {isHovered && (
        <>
          <circle
            cx={data.x}
            cy={data.y}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#ff6a3d"
            strokeWidth={2}
            cursor="nwse-resize"
            onPointerDown={(e) => e.isPrimary && handleResize(e, "tl")}
          />
          <circle
            cx={data.x + data.width}
            cy={data.y}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#ff6a3d"
            strokeWidth={2}
            cursor="nesw-resize"
            onPointerDown={(e) => e.isPrimary && handleResize(e, "tr")}
          />
          <circle
            cx={data.x}
            cy={data.y + data.height}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#ff6a3d"
            strokeWidth={2}
            cursor="nesw-resize"
            onPointerDown={(e) => e.isPrimary && handleResize(e, "bl")}
          />
          <circle
            cx={data.x + data.width}
            cy={data.y + data.height}
            r={6}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#ff6a3d"
            strokeWidth={2}
            cursor="nwse-resize"
            onPointerDown={(e) => e.isPrimary && handleResize(e, "br")}
          />
        </>
      )}
    </g>
  );
}

function EditPopoverContent({ data }) {
  const [editField, setEditField] = useState({});
  const { updateArea, deleteArea } = useAreas();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { t } = useTranslation();
  const { layout } = useLayout();
  const initialColorRef = useRef(data.color);
  const initialColorIdRef = useRef(data.colorId ?? null);
  const isBoundary = data.subtype === AreaSubtype.BOUNDARY;

  const handleColorPick = (color, colorId = null) => {
    updateArea(data.id, { color, colorId });
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
          aid: data.id,
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

  return (
    <div className="popover-theme">
      <div className="font-semibold mb-2 ms-1">{t("edit")}</div>
      <div className="w-[280px] flex items-center mb-2">
        <Input
          value={data.name}
          placeholder={t("name")}
          className="me-2"
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
                aid: data.id,
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
          readOnly={layout.readOnly}
          value={data.color}
          colorId={data.colorId ?? null}
          onChange={(color) => updateArea(data.id, { color, colorId: null })}
          onColorPick={(color, colorId) => handleColorPick(color, colorId)}
        />
      </div>
      {isBoundary && (
        <div className="w-[280px] mb-2">
          <div className="text-xs font-medium mb-1 ms-1">
            {t("border_width")}
          </div>
          <InputNumber
            className="w-full"
            min={minBoundaryBorderWidth}
            max={maxBoundaryBorderWidth}
            step={1}
            disabled={layout.readOnly}
            value={data.borderWidth ?? defaultBoundaryBorderWidth}
            onChange={(value) => {
              if (typeof value !== "number" || Number.isNaN(value)) return;
              updateArea(data.id, { borderWidth: value });
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
                  aid: data.id,
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
      <Divider />
      <Button
        icon={<IconDeleteStroked />}
        type="danger"
        theme="borderless"
        block
        onClick={() => deleteArea(data.id, true)}
        disabled={layout.readOnly}
      >
        {t("delete")}
      </Button>
    </div>
  );
}
