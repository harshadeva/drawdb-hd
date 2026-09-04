import { useCallback, useEffect, useRef, useState } from "react";
import { Slot } from "../../context/ExtensionsContext";
import {
  Action,
  Cardinality,
  Constraint,
  darkBgTheme,
  ObjectType,
  gridSize,
  gridCircleRadius,
  minAreaSize,
} from "../../data/constants";
import { Toast } from "@douyinfe/semi-ui";
import Table from "./Table";
import Area from "./Area";
import Relationship from "./Relationship";
import Note from "./Note";
import RelationshipToolbar from "./RelationshipToolbar";
import CanvasSearch from "./CanvasSearch";
import {
  useCanvas,
  useSettings,
  useTransform,
  useDiagram,
  useUndoRedo,
  useSelect,
  useAreas,
  useNotes,
  useLayout,
  useSaveState,
  useCollab,
} from "../../hooks";
import { useTranslation } from "react-i18next";
import { useEventListener } from "usehooks-ts";
import { areFieldsCompatible, getTableHeight } from "../../utils/utils";
import { getRectFromEndpoints, isInsideRect } from "../../utils/rect";
import { State, noteWidth } from "../../data/constants";
import { nanoid } from "nanoid";

// Minimum width a table can be resized down to (matches SetTableWidth modal).
const minTableWidth = 180;

// Naive English singularization so a foreign key on a plural parent table
// reads naturally, e.g. "users" -> "user_id" instead of "users_id".
const singularize = (name) => {
  if (!name) return name;
  const lower = name.toLowerCase();
  if (lower.endsWith("ies") && name.length > 3) return name.slice(0, -3) + "y";
  if (
    name.length > 3 &&
    (lower.endsWith("ses") ||
      lower.endsWith("xes") ||
      lower.endsWith("zes") ||
      lower.endsWith("ches") ||
      lower.endsWith("shes"))
  )
    return name.slice(0, -2);
  if (lower.endsWith("ss")) return name;
  if (lower.endsWith("s") && name.length > 1) return name.slice(0, -1);
  return name;
};

export default function Canvas() {
  const { t } = useTranslation();

  const canvasRef = useRef(null);
  const canvasContextValue = useCanvas();
  const {
    canvas: { viewBox },
    pointer,
  } = canvasContextValue;

  const {
    tables,
    updateTable,
    relationships,
    addRelationship,
    updateRelationship,
    database,
  } = useDiagram();
  const { setSaveState } = useSaveState();
  const { areas, updateArea } = useAreas();
  const { notes, updateNote } = useNotes();
  const { layout } = useLayout();
  const { settings } = useSettings();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { transform, setTransform } = useTransform();
  const {
    selectedElement,
    setSelectedElement,
    bulkSelectedElements,
    setBulkSelectedElements,
  } = useSelect();
  const notDragging = {
    id: -1,
    type: ObjectType.NONE,
    grabOffset: { x: 0, y: 0 },
  };
  const [dragging, setDragging] = useState(notDragging);
  // relationship creation tool: selected cardinality (null = tool off)
  // and the first (parent) table that was clicked
  const [relationshipMode, setRelationshipMode] = useState(null);
  const [pendingRelTable, setPendingRelTable] = useState(null);
  const [linking, setLinking] = useState(false);
  const [linkingLine, setLinkingLine] = useState({
    startTableId: -1,
    startFieldId: -1,
    endTableId: -1,
    endFieldId: -1,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });
  const { emitAwareness } = useCollab();
  const lastLinkingRef = useRef(false);
  const rightClickPanned = useRef(false);

  // Canvas search: the table currently flashed by a "jump to match" — a
  // one-shot glow, cleared again after the animation so nothing persists.
  const [searchFocus, setSearchFocus] = useState(null);

  useEffect(() => {
    if (!searchFocus) return;
    const timeout = setTimeout(() => setSearchFocus(null), 1200);
    return () => clearTimeout(timeout);
  }, [searchFocus]);

  const focusSearchResult = useCallback(
    (result) => {
      if (!result) return;
      const table = tables.find((tb) => tb.id === result.tableId);
      if (!table) return;

      const w = table.width ?? settings.tableWidth;
      const h = getTableHeight(table, w, settings.showComments, relationships);

      setTransform((prev) => ({
        ...prev,
        pan: { x: table.x + w / 2, y: table.y + h / 2 },
      }));
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.TABLE,
        id: table.id,
        open: false,
      }));
      setSearchFocus({ nonce: Date.now(), x: table.x, y: table.y, w, h });
    },
    [
      tables,
      relationships,
      settings.tableWidth,
      settings.showComments,
      setTransform,
      setSelectedElement,
    ],
  );

  useEffect(() => {
    if (linking) {
      emitAwareness({
        linking: {
          startX: linkingLine.startX,
          startY: linkingLine.startY,
          endX: linkingLine.endX,
          endY: linkingLine.endY,
        },
      });
      lastLinkingRef.current = true;
    } else if (lastLinkingRef.current) {
      emitAwareness({ linking: null });
      lastLinkingRef.current = false;
    }
  }, [
    linking,
    linkingLine.startX,
    linkingLine.startY,
    linkingLine.endX,
    linkingLine.endY,
    emitAwareness,
  ]);
  const [hoveredTable, setHoveredTable] = useState({
    tableId: null,
    fieldId: null,
  });
  const [panning, setPanning] = useState({
    isPanning: false,
    panStart: { x: 0, y: 0 },
    cursorStart: { x: 0, y: 0 },
  });
  const [areaResize, setAreaResize] = useState({ id: -1, dir: "none" });
  const notResizingTable = {
    id: -1,
    dir: "none",
    startX: 0,
    startWidth: 0,
    startTableX: 0,
  };
  const [tableResize, setTableResize] = useState(notResizingTable);
  // manual routing: which relationship waypoint is being dragged
  const [waypointDrag, setWaypointDrag] = useState(null);
  const [areaInitDimensions, setAreaInitDimensions] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [bulkSelectRect, setBulkSelectRect] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    show: false,
    ctrlKey: false,
    metaKey: false,
  });
  // this is used to store the element that is clicked on
  // at the moment, and shouldn't be a part of the state
  let elementPointerDown = null;

  const isSameElement = (el1, el2) => {
    return el1.id === el2.id && el1.type === el2.type;
  };

  const collectSelectedElements = () => {
    const rect = getRectFromEndpoints(bulkSelectRect);
    const elements = [];
    const shouldAddElement = (elementRect, element) => {
      // if ctrl key is pressed, only add the elements that are not already selected
      // can theoretically be optimized later if the selected elements is
      // a map from id to element (after the ids are made unique)
      return (
        isInsideRect(elementRect, rect) &&
        ((!bulkSelectRect.ctrlKey && !bulkSelectRect.metaKey) ||
          !bulkSelectedElements.some((el) => isSameElement(el, element)))
      );
    };

    tables.forEach((table) => {
      if (table.locked) return;

      const element = {
        id: table.id,
        type: ObjectType.TABLE,
        currentCoords: { x: table.x, y: table.y },
        initialCoords: { x: table.x, y: table.y },
      };
      const tableWidth = table.width ?? settings.tableWidth;
      const tableRect = {
        x: table.x,
        y: table.y,
        width: tableWidth,
        height: getTableHeight(
          table,
          tableWidth,
          settings.showComments,
          relationships,
        ),
      };
      if (shouldAddElement(tableRect, element)) {
        elements.push(element);
      }
    });

    areas.forEach((area) => {
      if (area.locked) return;

      const element = {
        id: area.id,
        type: ObjectType.AREA,
        currentCoords: { x: area.x, y: area.y },
        initialCoords: { x: area.x, y: area.y },
      };
      const areaRect = {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      };
      if (shouldAddElement(areaRect, element)) {
        elements.push(element);
      }
    });

    notes.forEach((note) => {
      if (note.locked) return;

      const element = {
        id: note.id,
        type: ObjectType.NOTE,
        currentCoords: { x: note.x, y: note.y },
        initialCoords: { x: note.x, y: note.y },
      };
      const noteRect = {
        x: note.x,
        y: note.y,
        width: note.width ?? noteWidth,
        height: note.height,
      };
      if (shouldAddElement(noteRect, element)) {
        elements.push(element);
      }
    });

    if (bulkSelectRect.ctrlKey || bulkSelectRect.metaKey) {
      setBulkSelectedElements([...bulkSelectedElements, ...elements]);
    } else {
      setBulkSelectedElements(elements);
      // A plain click (or marquee) on empty canvas that hit nothing also
      // clears the single selection, so an element — area, table, note —
      // doesn't stay highlighted until something else is picked.
      if (elements.length === 0) {
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.NONE,
          id: -1,
          open: false,
        }));
      }
    }
  };

  const handlePointerDownOnElement = (e, { element, type }) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (!element.locked || !(e.ctrlKey || e.metaKey)) {
      setSelectedElement((prev) => ({
        ...prev,
        element: type,
        id: element.id,
        open: false,
      }));
    }

    if (element.locked) {
      if (!(e.ctrlKey || e.metaKey)) {
        setBulkSelectedElements([]);
      }
      return;
    }

    setBulkSelectRect((prev) => ({
      ...prev,
      show: false,
    }));

    // this is the object that will be added to the bulk selected elements
    // if necessary
    const elementInBulk = {
      id: element.id,
      type,
      currentCoords: { x: element.x, y: element.y },
      initialCoords: { x: element.x, y: element.y },
    };

    const isSelected = bulkSelectedElements.some((el) =>
      isSameElement(el, elementInBulk),
    );

    if (e.ctrlKey || e.metaKey) {
      if (isSelected) {
        if (bulkSelectedElements.length > 1) {
          setBulkSelectedElements(
            bulkSelectedElements.filter(
              (el) => !isSameElement(el, elementInBulk),
            ),
          );
          setSelectedElement({
            ...selectedElement,
            element: ObjectType.NONE,
            id: -1,
            open: false,
          });
        }
      } else {
        setBulkSelectedElements([...bulkSelectedElements, elementInBulk]);
      }
      setDragging(notDragging);
      return;
    }

    if (!isSelected) {
      // dragging an area (or boundary) carries the tables, notes and nested
      // areas inside it along with it
      if (type === ObjectType.AREA) {
        setBulkSelectedElements([
          elementInBulk,
          ...getElementsInsideArea(element),
        ]);
      } else {
        setBulkSelectedElements([elementInBulk]);
      }
    }
    setDragging({
      id: element.id,
      type,
      grabOffset: {
        x: pointer.spaces.diagram.x - element.x,
        y: pointer.spaces.diagram.y - element.y,
      },
    });
  };

  // Tables, notes and nested areas whose center lies within an area — used so
  // moving the area (a boundary in particular) moves its whole contents along
  // with it, regardless of the type of element inside.
  const getElementsInsideArea = (area) => {
    const withinArea = (x, y) =>
      x >= area.x &&
      x <= area.x + area.width &&
      y >= area.y &&
      y <= area.y + area.height;

    const contained = [];

    tables.forEach((table) => {
      if (table.locked) return;
      const w = table.width ?? settings.tableWidth;
      const h = getTableHeight(table, w, settings.showComments, relationships);
      if (withinArea(table.x + w / 2, table.y + h / 2)) {
        contained.push({
          id: table.id,
          type: ObjectType.TABLE,
          currentCoords: { x: table.x, y: table.y },
          initialCoords: { x: table.x, y: table.y },
        });
      }
    });

    areas.forEach((other) => {
      if (other.id === area.id || other.locked) return;
      if (withinArea(other.x + other.width / 2, other.y + other.height / 2)) {
        contained.push({
          id: other.id,
          type: ObjectType.AREA,
          currentCoords: { x: other.x, y: other.y },
          initialCoords: { x: other.x, y: other.y },
        });
      }
    });

    notes.forEach((note) => {
      if (note.locked) return;
      const w = note.width ?? noteWidth;
      const h = note.height ?? 0;
      if (withinArea(note.x + w / 2, note.y + h / 2)) {
        contained.push({
          id: note.id,
          type: ObjectType.NOTE,
          currentCoords: { x: note.x, y: note.y },
          initialCoords: { x: note.x, y: note.y },
        });
      }
    });

    return contained;
  };

  const coordinatesAfterSnappingToGrid = ({ x, y }) => {
    if (settings.snapToGrid) {
      return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize,
      };
    }
    return { x, y };
  };

  /**
   * @param {PointerEvent} e
   */
  const handlePointerMove = (e) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (panning.isPanning) {
      setTransform((prev) => ({
        ...prev,
        pan: {
          x:
            panning.panStart.x +
            (panning.cursorStart.x - pointer.spaces.screen.x) / transform.zoom,
          y:
            panning.panStart.y +
            (panning.cursorStart.y - pointer.spaces.screen.y) / transform.zoom,
        },
      }));
      return;
    }

    if (layout.readOnly) return;

    if (linking) {
      setLinkingLine({
        ...linkingLine,
        endX: pointer.spaces.diagram.x,
        endY: pointer.spaces.diagram.y,
      });
      return;
    }

    if (waypointDrag) {
      const rel = relationships.find((r) => r.id === waypointDrag.relId);
      if (rel) {
        const points = [...(rel.points ?? [])];
        points[waypointDrag.index] = coordinatesAfterSnappingToGrid(
          pointer.spaces.diagram,
        );
        updateRelationship(waypointDrag.relId, { points });
      }
      return;
    }

    if (tableResize.id !== -1 && tableResize.dir !== "none") {
      const dx = pointer.spaces.diagram.x - tableResize.startX;
      const rawWidth =
        tableResize.dir === "r"
          ? tableResize.startWidth + dx
          : tableResize.startWidth - dx;
      const newWidth = Math.max(minTableWidth, Math.round(rawWidth));
      if (tableResize.dir === "l") {
        // keep the right edge of the dragged table anchored in place
        updateTable(tableResize.id, {
          width: newWidth,
          x: tableResize.startTableX + (tableResize.startWidth - newWidth),
        });
      } else {
        updateTable(tableResize.id, { width: newWidth });
      }
      return;
    }

    if (isDragging()) {
      const { x: mainElementFinalX, y: mainElementFinalY } =
        coordinatesAfterSnappingToGrid({
          x: pointer.spaces.diagram.x - dragging.grabOffset.x,
          y: pointer.spaces.diagram.y - dragging.grabOffset.y,
        });

      const { currentCoords } = bulkSelectedElements.find((el) =>
        isSameElement(el, dragging),
      );

      const deltaX = mainElementFinalX - currentCoords.x;
      const deltaY = mainElementFinalY - currentCoords.y;

      const newBulkSelectedElements = [];
      bulkSelectedElements.forEach((el) => {
        const elementFinalCoords = {
          x: el.currentCoords.x + deltaX,
          y: el.currentCoords.y + deltaY,
        };
        if (el.type === ObjectType.TABLE) {
          updateTable(el.id, { ...elementFinalCoords });
        }
        if (el.type === ObjectType.AREA) {
          updateArea(el.id, { ...elementFinalCoords });
        }
        if (el.type === ObjectType.NOTE) {
          updateNote(el.id, { ...elementFinalCoords });
        }
        newBulkSelectedElements.push({
          ...el,
          currentCoords: elementFinalCoords,
        });
      });

      setBulkSelectedElements(newBulkSelectedElements);
      return;
    }

    if (areaResize.id !== -1) {
      if (areaResize.dir === "none") return;
      let newDims = { ...areaInitDimensions };
      setPanning((old) => ({ ...old, isPanning: false }));
      const { x, y } = coordinatesAfterSnappingToGrid(pointer.spaces.diagram);

      switch (areaResize.dir) {
        case "br":
          newDims.width = x - areaInitDimensions.x;
          newDims.height = y - areaInitDimensions.y;
          break;
        case "tl":
          newDims.x = x;
          newDims.y = y;
          newDims.width = areaInitDimensions.width - (x - areaInitDimensions.x);
          newDims.height =
            areaInitDimensions.height - (y - areaInitDimensions.y);
          break;
        case "tr":
          newDims.y = y;
          newDims.width = x - areaInitDimensions.x;
          newDims.height =
            areaInitDimensions.height - (y - areaInitDimensions.y);
          break;
        case "bl":
          newDims.x = x;
          newDims.width = areaInitDimensions.width - (x - areaInitDimensions.x);
          newDims.height = y - areaInitDimensions.y;
          break;
      }

      if (newDims.width <= minAreaSize) {
        newDims.width = minAreaSize;
        if (areaResize.dir === "tl" || areaResize.dir === "bl") {
          newDims.x =
            areaInitDimensions.x + areaInitDimensions.width - minAreaSize;
        }
      }

      if (newDims.height <= minAreaSize) {
        newDims.height = minAreaSize;
        if (areaResize.dir === "tl" || areaResize.dir === "tr") {
          newDims.y =
            areaInitDimensions.y + areaInitDimensions.height - minAreaSize;
        }
      }

      updateArea(areaResize.id, { ...newDims });
      return;
    }

    if (bulkSelectRect.show) {
      setBulkSelectRect((prev) => ({
        ...prev,
        x2: pointer.spaces.diagram.x,
        y2: pointer.spaces.diagram.y,
      }));
    }
  };

  /**
   * @param {PointerEvent} e
   */
  const handlePointerDown = (e) => {
    if (!e.isPrimary) return;

    // don't pan if the sidesheet for editing a table is open
    if (
      selectedElement.element === ObjectType.TABLE &&
      selectedElement.open &&
      !layout.sidebar
    )
      return;

    const isMouseLeftButton = e.button === 0;
    const isMouseMiddleButton = e.button === 1;
    const isMouseRightButton = e.button === 2;

    // Relationship tool: left-clicking tables picks the two endpoints
    // instead of selecting/dragging them.
    if (relationshipMode && isMouseLeftButton) {
      if (elementPointerDown && elementPointerDown.type === ObjectType.TABLE) {
        handleRelationshipTableClick(elementPointerDown.element);
      } else {
        setPendingRelTable(null);
      }
      return;
    }

    if (isMouseLeftButton) {
      setBulkSelectRect({
        x1: pointer.spaces.diagram.x,
        y1: pointer.spaces.diagram.y,
        x2: pointer.spaces.diagram.x,
        y2: pointer.spaces.diagram.y,
        show: elementPointerDown === null || !elementPointerDown.element.locked,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
      });
      if (elementPointerDown !== null) {
        handlePointerDownOnElement(e, elementPointerDown);
      }
      pointer.setStyle("crosshair");
    } else if (isMouseMiddleButton || isMouseRightButton) {
      if (isMouseRightButton) rightClickPanned.current = false;
      setPanning({
        isPanning: true,
        panStart: transform.pan,
        // Diagram space depends on the current panning.
        // Use screen space to avoid circular dependencies and undefined behavior.
        cursorStart: pointer.spaces.screen,
      });
      pointer.setStyle("grabbing");
    }
  };

  const isDragging = () => {
    return dragging.type !== ObjectType.NONE && dragging.id !== -1;
  };

  const didDrag = () => {
    if (!isDragging()) return false;
    // checking any element is sufficient
    const { currentCoords, initialCoords } = bulkSelectedElements[0];
    return (
      currentCoords.x !== initialCoords.x || currentCoords.y !== initialCoords.y
    );
  };

  const didResize = (id) => {
    return !(
      areas[id].x === areaInitDimensions.x &&
      areas[id].y === areaInitDimensions.y &&
      areas[id].width === areaInitDimensions.width &&
      areas[id].height === areaInitDimensions.height
    );
  };

  const didPan = () =>
    !(
      transform.pan.x === panning.panStart.x &&
      transform.pan.y === panning.panStart.y
    );

  /**
   * @param {PointerEvent} e
   */
  const handlePointerUp = (e) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (didDrag()) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.MOVE,
          bulk: true,
          message: t("bulk_update"),
          elements: bulkSelectedElements.map((el) => ({
            id: el.id,
            type: el.type,
            undo: el.initialCoords,
            redo: el.currentCoords,
          })),
        },
      ]);
      setRedoStack([]);
      setBulkSelectedElements((prev) =>
        prev.map((el) => ({
          ...el,
          initialCoords: { ...el.currentCoords },
        })),
      );
    }

    if (bulkSelectRect.show) {
      setBulkSelectRect((prev) => ({
        ...prev,
        x2: pointer.spaces.diagram.x,
        y2: pointer.spaces.diagram.y,
        show: false,
      }));
      if (!isDragging()) {
        collectSelectedElements();
      }
    }
    setDragging(notDragging);

    if (panning.isPanning && didPan()) {
      setSaveState(State.SAVING);
      if (e.button === 2) rightClickPanned.current = true;
    }
    setPanning((old) => ({ ...old, isPanning: false }));
    pointer.setStyle("default");

    if (linking) handleLinking();
    setLinking(false);

    if (tableResize.id !== -1) {
      const table = tables.find((tb) => tb.id === tableResize.id);
      if (table && (table.width ?? settings.tableWidth) !== tableResize.startWidth) {
        setUndoStack((prev) => [
          ...prev,
          {
            action: Action.EDIT,
            element: ObjectType.TABLE,
            component: "self",
            tid: tableResize.id,
            undo: { width: tableResize.startWidth, x: tableResize.startTableX },
            redo: { width: table.width, x: table.x },
            message: t("edit_table", {
              tableName: table.name,
              extra: "[resize]",
            }),
          },
        ]);
        setRedoStack([]);
      }
      setTableResize(notResizingTable);
      setSaveState(State.SAVING);
    }

    if (waypointDrag) {
      const rel = relationships.find((r) => r.id === waypointDrag.relId);
      if (rel) {
        setUndoStack((prev) => [
          ...prev,
          {
            action: Action.EDIT,
            element: ObjectType.RELATIONSHIP,
            rid: waypointDrag.relId,
            undo: { points: waypointDrag.origPoints },
            redo: { points: rel.points ?? [] },
            message: t("edit_relationship", {
              refName: rel.name,
              extra: "[waypoint]",
            }),
          },
        ]);
        setRedoStack([]);
      }
      setWaypointDrag(null);
      setSaveState(State.SAVING);
    }

    if (areaResize.id !== -1 && didResize(areaResize.id)) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.AREA,
          aid: areaResize.id,
          undo: {
            ...areas[areaResize.id],
            x: areaInitDimensions.x,
            y: areaInitDimensions.y,
            width: areaInitDimensions.width,
            height: areaInitDimensions.height,
          },
          redo: areas[areaResize.id],
          message: t("edit_area", {
            areaName: areas[areaResize.id].name,
            extra: "[resize]",
          }),
        },
      ]);
      setRedoStack([]);
    }
    setAreaResize({ id: -1, dir: "none" });
    setAreaInitDimensions({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  };

  const handleGripField = () => {
    setPanning((old) => ({ ...old, isPanning: false }));
    setDragging(notDragging);
    setLinking(true);
  };

  const getCardinality = (startField, endField) => {
    const startIsUnique = startField.unique || startField.primary;
    const endIsUnique = endField.unique || endField.primary;

    if (startIsUnique && endIsUnique) {
      return Cardinality.ONE_TO_ONE;
    }

    if (startIsUnique && !endIsUnique) {
      return Cardinality.ONE_TO_MANY;
    }

    if (!startIsUnique && endIsUnique) {
      return Cardinality.MANY_TO_ONE;
    }

    return Cardinality.ONE_TO_ONE;
  };

  const handleLinking = () => {
    if (hoveredTable.tableId === null) return;
    if (hoveredTable.fieldId === null) return;

    const { fields: startTableFields, name: startTableName } = tables.find(
      (t) => t.id === linkingLine.startTableId,
    );
    const startField = startTableFields.find(
      (f) => f.id === linkingLine.startFieldId,
    );
    const { fields: endTableFields, name: endTableName } = tables.find(
      (t) => t.id === hoveredTable.tableId,
    );
    const endField = endTableFields.find((f) => f.id === hoveredTable.fieldId);

    if (!areFieldsCompatible(database, startField.type, endField.type)) {
      Toast.info(t("cannot_connect"));
      return;
    }
    if (
      linkingLine.startTableId === hoveredTable.tableId &&
      linkingLine.startFieldId === hoveredTable.fieldId
    )
      return;

    const cardinality = getCardinality(startField, endField);

    const newRelationship = {
      ...linkingLine,
      cardinality,
      endTableId: hoveredTable.tableId,
      endFieldId: hoveredTable.fieldId,
      fields: [
        {
          startFieldId: linkingLine.startFieldId,
          endFieldId: hoveredTable.fieldId,
        },
      ],
      updateConstraint: Constraint.NONE,
      deleteConstraint: Constraint.NONE,
      name: `fk_${startTableName}_${startField.name}_${endTableName}`,
      id: nanoid(),
    };
    delete newRelationship.startX;
    delete newRelationship.startY;
    delete newRelationship.endX;
    delete newRelationship.endY;
    addRelationship(newRelationship);
  };

  const selectRelationshipMode = (value) => {
    setRelationshipMode(value);
    setPendingRelTable(null);
  };

  // Begins a horizontal resize of a single table's width by dragging its
  // left ("l") or right ("r") edge.
  const startTableResize = (tableId, dir, tableX, currentWidth) => {
    if (layout.readOnly) return;
    setPanning((old) => ({ ...old, isPanning: false }));
    setDragging(notDragging);
    pointer.setStyle("ew-resize");
    setTableResize({
      id: tableId,
      dir,
      startX: pointer.spaces.diagram.x,
      startWidth: currentWidth ?? settings.tableWidth,
      startTableX: tableX,
    });
  };

  // The toolbar cardinality is read as parent -> child (parent is clicked
  // first). A stored relationship is start -> end, and here start = child (FK)
  // and end = parent (PK), so the value must be inverted. This matches what
  // dragging from a child FK field to a parent PK field already produces.
  const toStoredCardinality = (toolbarValue) => {
    if (toolbarValue === Cardinality.ONE_TO_MANY) return Cardinality.MANY_TO_ONE;
    if (toolbarValue === Cardinality.MANY_TO_ONE) return Cardinality.ONE_TO_MANY;
    return Cardinality.ONE_TO_ONE;
  };

  // Creates a relationship (and the foreign key column) from two tables.
  // parent = the referenced/primary-key side (clicked first),
  // child = the side that receives the new foreign key (clicked second).
  const createRelationshipFromTables = (parent, child, toolbarCardinality) => {
    if (layout.readOnly) return;

    const parentPk = parent.fields.find((f) => f.primary) ?? parent.fields[0];
    if (!parentPk) {
      Toast.info(t("parent_needs_pk"));
      return;
    }

    const cardinality = toStoredCardinality(toolbarCardinality);

    const baseName = `${singularize(parent.name)}_${parentPk.name}`;
    const existingNames = new Set(child.fields.map((f) => f.name));
    let fieldName = baseName;
    let suffix = 1;
    while (existingNames.has(fieldName)) fieldName = `${baseName}_${suffix++}`;

    const newField = {
      name: fieldName,
      type: parentPk.type,
      size: parentPk.size ?? "",
      default: "",
      check: "",
      primary: false,
      unique: toolbarCardinality === Cardinality.ONE_TO_ONE,
      unsigned: parentPk.unsigned ?? false,
      notNull: false,
      increment: false,
      comment: "",
      id: nanoid(),
    };

    const newRelationship = {
      startTableId: child.id,
      startFieldId: newField.id,
      endTableId: parent.id,
      endFieldId: parentPk.id,
      cardinality,
      fields: [{ startFieldId: newField.id, endFieldId: parentPk.id }],
      updateConstraint: Constraint.NONE,
      deleteConstraint: Constraint.NONE,
      name: `fk_${child.name}_${fieldName}_${parent.name}`,
      // marks the FK column as one this tool created, so deleting the
      // relationship can also remove that column (see del() in ControlPanel)
      autoCreatedFk: true,
      id: nanoid(),
    };

    updateTable(child.id, { fields: [...child.fields, newField] });
    addRelationship(
      { relationship: newRelationship, index: relationships.length },
      false,
    );
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.ADD,
        element: ObjectType.RELATIONSHIP,
        data: { relationship: newRelationship, index: relationships.length },
        createdField: { tableId: child.id, field: newField },
        message: t("add_relationship"),
      },
    ]);
    setRedoStack([]);
  };

  // --- manual relationship routing (drag bend points) ---
  const startWaypointDrag = (relId, index) => {
    if (layout.readOnly) return;
    const rel = relationships.find((r) => r.id === relId);
    setPanning((old) => ({ ...old, isPanning: false }));
    setDragging(notDragging);
    pointer.setStyle("grabbing");
    setWaypointDrag({ relId, index, origPoints: rel?.points ?? [] });
  };

  const insertWaypointAndDrag = (relId, insertIndex, point) => {
    if (layout.readOnly) return;
    const rel = relationships.find((r) => r.id === relId);
    const origPoints = rel?.points ?? [];
    const points = [...origPoints];
    points.splice(insertIndex, 0, point);
    updateRelationship(relId, { points });
    setPanning((old) => ({ ...old, isPanning: false }));
    setDragging(notDragging);
    pointer.setStyle("grabbing");
    setWaypointDrag({ relId, index: insertIndex, origPoints });
  };

  const removeWaypoint = (relId, index) => {
    if (layout.readOnly) return;
    const rel = relationships.find((r) => r.id === relId);
    if (!rel) return;
    const origPoints = rel.points ?? [];
    const points = origPoints.filter((_, i) => i !== index);
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        rid: relId,
        undo: { points: origPoints },
        redo: { points },
        message: t("edit_relationship", {
          refName: rel.name,
          extra: "[waypoint]",
        }),
      },
    ]);
    setRedoStack([]);
    updateRelationship(relId, { points });
  };

  const handleRelationshipTableClick = (table) => {
    if (!pendingRelTable) {
      setPendingRelTable(table.id);
      return;
    }

    // clicking the same table twice creates a self-referencing relationship
    const parent =
      pendingRelTable === table.id
        ? table
        : tables.find((tb) => tb.id === pendingRelTable);
    if (parent) createRelationshipFromTables(parent, table, relationshipMode);

    // one relationship per selection: reset back to the default mouse tool
    setPendingRelTable(null);
    setRelationshipMode(null);
  };

  useEventListener("keydown", (e) => {
    if (e.key === "Escape" && relationshipMode) {
      setRelationshipMode(null);
      setPendingRelTable(null);
    }
  });

  useEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const eagernessFactor = 0.05;
        setTransform((prev) => ({
          pan: {
            x:
              prev.pan.x -
              (pointer.spaces.diagram.x - prev.pan.x) *
                eagernessFactor *
                Math.sign(e.deltaY),
            y:
              prev.pan.y -
              (pointer.spaces.diagram.y - prev.pan.y) *
                eagernessFactor *
                Math.sign(e.deltaY),
          },
          zoom: e.deltaY <= 0 ? prev.zoom * 1.05 : prev.zoom / 1.05,
        }));
      } else if (e.shiftKey) {
        setTransform((prev) => ({
          ...prev,
          pan: {
            ...prev.pan,
            x: prev.pan.x + e.deltaY / prev.zoom,
          },
        }));
      } else {
        setTransform((prev) => ({
          ...prev,
          pan: {
            ...prev.pan,
            y: prev.pan.y + e.deltaY / prev.zoom,
          },
        }));
      }
    },
    canvasRef,
    { passive: false },
  );

  return (
    <div className="grow h-full touch-none relative" id="canvas">
      {!layout.readOnly &&
        (layout.header || layout.sidebar || layout.toolbar) && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start pointer-events-none">
            <div className="pointer-events-auto">
              <RelationshipToolbar
                mode={relationshipMode}
                onSelect={selectRelationshipMode}
                disabled={layout.readOnly}
              />
            </div>
            {relationshipMode && (
              <div className="px-3 py-1.5 rounded-md text-sm popover-theme shadow-md">
                {pendingRelTable ? t("rel_pick_child") : t("rel_pick_parent")}
              </div>
            )}
          </div>
        )}
      {(layout.header || layout.sidebar || layout.toolbar) && (
        <CanvasSearch tables={tables} onNavigate={focusSearchResult} />
      )}
      <div
        className="w-full h-full"
        style={{
          cursor: relationshipMode ? "crosshair" : pointer.style,
          backgroundColor: settings.mode === "dark" ? darkBgTheme : "white",
        }}
      >
        <svg
          id="diagram"
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onContextMenu={(e) => {
            if (rightClickPanned.current) {
              e.preventDefault();
              rightClickPanned.current = false;
            }
          }}
          className="absolute w-full h-full touch-none"
          viewBox={`${viewBox.left} ${viewBox.top} ${viewBox.width} ${viewBox.height}`}
        >
          {settings.showGrid && (
            <>
              <defs>
                <pattern
                  id="pattern-grid"
                  x={-gridCircleRadius}
                  y={-gridCircleRadius}
                  width={gridSize}
                  height={gridSize}
                  patternUnits="userSpaceOnUse"
                  patternContentUnits="userSpaceOnUse"
                >
                  <circle
                    cx={gridCircleRadius}
                    cy={gridCircleRadius}
                    r={gridCircleRadius}
                    fill="rgb(201, 184, 170)"
                    opacity="1"
                  />
                </pattern>
              </defs>
              <rect
                x={viewBox.left}
                y={viewBox.top}
                width={viewBox.width}
                height={viewBox.height}
                fill="url(#pattern-grid)"
              />
            </>
          )}
          {areas.map((a) => (
            <Area
              key={a.id}
              data={a}
              setResize={setAreaResize}
              setInitDimensions={setAreaInitDimensions}
              onPointerDown={() => {
                elementPointerDown = {
                  element: a,
                  type: ObjectType.AREA,
                };
              }}
            />
          ))}
          {relationships.map((e) => (
            <Relationship
              key={e.id}
              data={e}
              onWaypointDown={startWaypointDrag}
              onSegmentDown={insertWaypointAndDrag}
              onWaypointRemove={removeWaypoint}
            />
          ))}
          {tables.map((table) => (
            <Table
              key={table.id}
              tableData={table}
              setHoveredTable={setHoveredTable}
              handleGripField={handleGripField}
              setLinkingLine={setLinkingLine}
              relationshipMode={relationshipMode}
              isRelationshipSource={pendingRelTable === table.id}
              startTableResize={startTableResize}
              onPointerDown={() => {
                elementPointerDown = {
                  element: table,
                  type: ObjectType.TABLE,
                };
              }}
            />
          ))}
          {linking && (
            <path
              d={`M ${linkingLine.startX} ${linkingLine.startY} L ${linkingLine.endX} ${linkingLine.endY}`}
              stroke="red"
              strokeDasharray="8,8"
              className="pointer-events-none touch-none"
            />
          )}
          {searchFocus && (
            <rect
              key={searchFocus.nonce}
              className="canvas-focus-glow"
              x={searchFocus.x - 8}
              y={searchFocus.y - 8}
              width={searchFocus.w + 16}
              height={searchFocus.h + 16}
              rx={10}
              ry={10}
            />
          )}
          <Slot name="svg-overlay" />
          {notes.map((n) => (
            <Note
              key={n.id}
              data={n}
              onPointerDown={() => {
                elementPointerDown = {
                  element: n,
                  type: ObjectType.NOTE,
                };
              }}
            />
          ))}
          {bulkSelectRect.show && (
            <rect
              {...getRectFromEndpoints(bulkSelectRect)}
              stroke="grey"
              fill="grey"
              fillOpacity={0.15}
              strokeDasharray={10}
            />
          )}
        </svg>
      </div>
      {settings.showDebugCoordinates && (
        <div className="fixed flex flex-col flex-wrap gap-6 bg-[rgba(var(--semi-grey-1),var(--tw-bg-opacity))]/40 border border-color bottom-4 right-4 p-4 rounded-xl backdrop-blur-xs pointer-events-none select-none">
          <table className="table-auto grow">
            <thead>
              <tr>
                <th className="text-left" colSpan={3}>
                  {t("transform")}
                </th>
              </tr>
              <tr className="italic [&_th]:font-normal [&_th]:text-right">
                <th>pan x</th>
                <th>pan y</th>
                <th>scale</th>
              </tr>
            </thead>
            <tbody className="[&_td]:text-right [&_td]:min-w-[8ch]">
              <tr>
                <td>{transform.pan.x.toFixed(2)}</td>
                <td>{transform.pan.y.toFixed(2)}</td>
                <td>{transform.zoom.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
          <table className="table-auto grow [&_th]:text-left [&_th:not(:first-of-type)]:text-right [&_td:not(:first-of-type)]:text-right [&_td]:min-w-[8ch]">
            <thead>
              <tr>
                <th colSpan={4}>{t("viewbox")}</th>
              </tr>
              <tr className="italic [&_th]:font-normal">
                <th>left</th>
                <th>top</th>
                <th>width</th>
                <th>height</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{viewBox.left.toFixed(2)}</td>
                <td>{viewBox.top.toFixed(2)}</td>
                <td>{viewBox.width.toFixed(2)}</td>
                <td>{viewBox.height.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <table className="table-auto grow [&_th]:text-left [&_th:not(:first-of-type)]:text-right [&_td:not(:first-of-type)]:text-right [&_td]:min-w-[8ch]">
            <thead>
              <tr>
                <th colSpan={3}>{t("cursor_coordinates")}</th>
              </tr>
              <tr className="italic [&_th]:font-normal">
                <th>{t("coordinate_space")}</th>
                <th>x</th>
                <th>y</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t("coordinate_space_screen")}</td>
                <td>{pointer.spaces.screen.x.toFixed(2)}</td>
                <td>{pointer.spaces.screen.y.toFixed(2)}</td>
              </tr>
              <tr>
                <td>{t("coordinate_space_diagram")}</td>
                <td>{pointer.spaces.diagram.x.toFixed(2)}</td>
                <td>{pointer.spaces.diagram.y.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
