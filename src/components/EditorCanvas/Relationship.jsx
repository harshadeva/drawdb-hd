import { useMemo, useRef, useState, useEffect } from "react";
import { Cardinality, ObjectType, Tab } from "../../data/constants";
import {
  calcPath,
  calcCompositePath,
  calcAnchors,
  calcWaypointPath,
} from "../../utils/calcPath";
import { useDiagram, useSettings, useLayout, useSelect } from "../../hooks";
import { useTranslation } from "react-i18next";
import { SideSheet } from "@douyinfe/semi-ui";
import RelationshipInfo from "../EditorSidePanel/RelationshipsTab/RelationshipInfo";
import {
  getVisibleFieldIndex,
  getVisibleFields,
  getRelationshipFields,
} from "../../utils/utils";

const labelFontSize = 16;

export default function Relationship({
  data,
  onWaypointDown,
  onSegmentDown,
  onWaypointRemove,
}) {
  const { settings } = useSettings();
  const { tables, relationships } = useDiagram();
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement, setBulkSelectedElements } =
    useSelect();
  const { t } = useTranslation();

  const pathValues = useMemo(() => {
    const startTable = tables.find((t) => t.id === data.startTableId);
    const endTable = tables.find((t) => t.id === data.endTableId);

    if (!startTable || !endTable || startTable.hidden || endTable.hidden)
      return null;

    const startFields = getVisibleFields(startTable, relationships);
    const endFields = getVisibleFields(endTable, relationships);

    const pairs = getRelationshipFields(data);

    return {
      startFieldIndex: getVisibleFieldIndex(
        startTable,
        data.startFieldId,
        relationships,
      ),
      endFieldIndex: getVisibleFieldIndex(
        endTable,
        data.endFieldId,
        relationships,
      ),
      startFieldIndices: pairs.map((p) =>
        getVisibleFieldIndex(startTable, p.startFieldId, relationships),
      ),
      endFieldIndices: pairs.map((p) =>
        getVisibleFieldIndex(endTable, p.endFieldId, relationships),
      ),
      startTableWidth: startTable.width ?? settings.tableWidth,
      endTableWidth: endTable.width ?? settings.tableWidth,
      startTable: {
        x: startTable.x,
        y: startTable.y,
        comment: startTable.comment,
        fields: startFields,
      },
      endTable: {
        x: endTable.x,
        y: endTable.y,
        comment: endTable.comment,
        fields: endFields,
      },
    };
  }, [tables, relationships, data, settings.tableWidth]);

  const isComposite = (pathValues?.startFieldIndices?.length ?? 0) > 1;

  const composite = useMemo(() => {
    if (!pathValues || !isComposite) return null;
    return calcCompositePath(
      {
        startTable: pathValues.startTable,
        endTable: pathValues.endTable,
        startFieldIndices: pathValues.startFieldIndices,
        endFieldIndices: pathValues.endFieldIndices,
      },
      pathValues.startTableWidth,
      1,
      settings.showComments,
      pathValues.endTableWidth,
    );
  }, [pathValues, isComposite, settings.showComments]);

  const points = useMemo(() => data.points ?? [], [data.points]);
  const hasWaypoints = !isComposite && points.length > 0;

  // Anchor points on each table edge when the line is manually routed.
  const waypointGeom = useMemo(() => {
    if (!pathValues || isComposite) return null;
    const swPx = pathValues.startTableWidth;
    const ewPx = pathValues.endTableWidth;
    const firstRef = points[0] ?? {
      x: pathValues.endTable.x + ewPx / 2,
    };
    const lastRef = points[points.length - 1] ?? {
      x: pathValues.startTable.x + swPx / 2,
    };
    return calcAnchors(
      pathValues,
      swPx,
      ewPx,
      settings.showComments,
      firstRef,
      lastRef,
    );
  }, [pathValues, isComposite, points, settings.showComments]);

  const pathRef = useRef();
  const labelRef = useRef();

  let cardinalityStart = "1";
  let cardinalityEnd = "1";

  switch (data.cardinality) {
    // the translated values are to ensure backwards compatibility
    case t(Cardinality.MANY_TO_ONE):
    case Cardinality.MANY_TO_ONE:
      cardinalityStart = data.manyLabel || "n";
      cardinalityEnd = "1";
      break;
    case t(Cardinality.ONE_TO_MANY):
    case Cardinality.ONE_TO_MANY:
      cardinalityStart = "1";
      cardinalityEnd = data.manyLabel || "n";
      break;
    case t(Cardinality.ONE_TO_ONE):
    case Cardinality.ONE_TO_ONE:
      cardinalityStart = "1";
      cardinalityEnd = "1";
      break;
    default:
      break;
  }

  let cardinalityStartX = 0;
  let cardinalityEndX = 0;
  let cardinalityStartY = 0;
  let cardinalityEndY = 0;
  let labelX = 0;
  let labelY = 0;
  let pathMid = null;

  let labelWidth = labelRef.current?.getBBox().width ?? 0;
  let labelHeight = labelRef.current?.getBBox().height ?? 0;

  const cardinalityOffset = 28;

  if (composite) {
    labelX = composite.labelPoint.x - (labelWidth ?? 0) / 2;
    labelY = composite.labelPoint.y + (labelHeight ?? 0) / 2;
    cardinalityStartX = composite.startCardinality.x;
    cardinalityStartY = composite.startCardinality.y;
    cardinalityEndX = composite.endCardinality.x;
    cardinalityEndY = composite.endCardinality.y;
  } else if (pathRef.current) {
    const pathLength = pathRef.current.getTotalLength();

    const labelPoint = pathRef.current.getPointAtLength(pathLength / 2);
    pathMid = { x: labelPoint.x, y: labelPoint.y };
    labelX = labelPoint.x - (labelWidth ?? 0) / 2;
    labelY = labelPoint.y + (labelHeight ?? 0) / 2;

    const point1 = pathRef.current.getPointAtLength(cardinalityOffset);
    cardinalityStartX = point1.x;
    cardinalityStartY = point1.y;
    const point2 = pathRef.current.getPointAtLength(
      pathLength - cardinalityOffset,
    );
    cardinalityEndX = point2.x;
    cardinalityEndY = point2.y;
  }

  const isSelected =
    selectedElement.element === ObjectType.RELATIONSHIP &&
    selectedElement.id === data.id;

  const select = () => {
    setBulkSelectedElements([]);
    setSelectedElement((prev) => ({
      ...prev,
      element: ObjectType.RELATIONSHIP,
      id: data.id,
      open: false,
    }));
  };

  const edit = () => {
    if (!layout.sidebar) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      }));
    } else {
      setSelectedElement((prev) => ({
        ...prev,
        currentTab: Tab.RELATIONSHIPS,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      }));
      if (selectedElement.currentTab !== Tab.RELATIONSHIPS) return;
      document
        .getElementById(`scroll_ref_${data.id}`)
        .scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!pathValues) return null;

  const dPath = composite
    ? composite.path
    : hasWaypoints
      ? calcWaypointPath(waypointGeom.start, points, waypointGeom.end)
      : calcPath(
          pathValues,
          pathValues.startTableWidth,
          1,
          settings.showComments,
          pathValues.endTableWidth,
        );

  const vertices = hasWaypoints
    ? [waypointGeom.start, ...points, waypointGeom.end]
    : null;

  const showEditHandles = isSelected && !composite && !layout.readOnly;

  return (
    <>
      <g
        className="select-none group"
        onDoubleClick={edit}
        onPointerDown={(e) => {
          if (e.isPrimary && e.button === 0) select();
        }}
      >
        {/* invisible wider path for better hover ux */}
        <path
          d={dPath}
          fill="none"
          stroke="transparent"
          strokeWidth={12}
          cursor="pointer"
        />
        <path
          ref={pathRef}
          d={dPath}
          className="relationship-path"
          fill="none"
          cursor="pointer"
          stroke={isSelected ? "#5891db" : undefined}
          strokeWidth={isSelected ? 2.5 : undefined}
        />
        {settings.showRelationshipLabels && (
          <text
            x={labelX}
            y={labelY}
            fill={settings.mode === "dark" ? "lightgrey" : "#333"}
            fontSize={labelFontSize}
            fontWeight={500}
            ref={labelRef}
            className="group-hover:fill-sky-600"
          >
            {data.name}
          </text>
        )}
        {(composite || pathRef.current) && settings.showCardinality && (
          <>
            <CardinalityLabel
              x={cardinalityStartX}
              y={cardinalityStartY}
              text={cardinalityStart}
            />
            <CardinalityLabel
              x={cardinalityEndX}
              y={cardinalityEndY}
              text={cardinalityEnd}
            />
          </>
        )}
        {showEditHandles && (
          <g>
            {/* existing bend points: drag to move, double-click to remove */}
            {points.map((p, i) => (
              <circle
                key={`wp-${i}`}
                cx={p.x}
                cy={p.y}
                r={6}
                fill="#5891db"
                stroke="white"
                strokeWidth={1.5}
                style={{ cursor: "move" }}
                onPointerDown={(e) => {
                  if (!e.isPrimary || e.button !== 0) return;
                  e.stopPropagation();
                  onWaypointDown?.(data.id, i);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onWaypointRemove?.(data.id, i);
                }}
              >
                <title>{t("waypoint_hint")}</title>
              </circle>
            ))}
            {/* add-bend handles at each segment midpoint */}
            {hasWaypoints
              ? vertices.slice(0, -1).map((v, i) => {
                  const mid = {
                    x: (v.x + vertices[i + 1].x) / 2,
                    y: (v.y + vertices[i + 1].y) / 2,
                  };
                  return (
                    <circle
                      key={`add-${i}`}
                      cx={mid.x}
                      cy={mid.y}
                      r={4}
                      fill="white"
                      stroke="#5891db"
                      strokeWidth={1.5}
                      style={{ cursor: "copy" }}
                      onPointerDown={(e) => {
                        if (!e.isPrimary || e.button !== 0) return;
                        e.stopPropagation();
                        onSegmentDown?.(data.id, i, mid);
                      }}
                    />
                  );
                })
              : pathMid && (
                  <circle
                    cx={pathMid.x}
                    cy={pathMid.y}
                    r={4}
                    fill="white"
                    stroke="#5891db"
                    strokeWidth={1.5}
                    style={{ cursor: "copy" }}
                    onPointerDown={(e) => {
                      if (!e.isPrimary || e.button !== 0) return;
                      e.stopPropagation();
                      onSegmentDown?.(data.id, 0, pathMid);
                    }}
                  />
                )}
          </g>
        )}
      </g>
      <SideSheet
        title={t("edit")}
        size="small"
        visible={
          selectedElement.element === ObjectType.RELATIONSHIP &&
          selectedElement.id === data.id &&
          selectedElement.open &&
          !layout.sidebar
        }
        onCancel={() => {
          setSelectedElement((prev) => ({
            ...prev,
            open: false,
          }));
        }}
        style={{ paddingBottom: "16px" }}
      >
        <div className="sidesheet-theme">
          <RelationshipInfo data={data} />
        </div>
      </SideSheet>
    </>
  );
}

function CardinalityLabel({ x, y, text, r = 12, padding = 14 }) {
  const [textWidth, setTextWidth] = useState(0);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      const bbox = textRef.current.getBBox();
      setTextWidth(bbox.width);
    }
  }, [text]);

  return (
    <g>
      <rect
        x={x - textWidth / 2 - padding / 2}
        y={y - r}
        rx={r}
        ry={r}
        width={textWidth + padding}
        height={r * 2}
        fill="grey"
        className="group-hover:fill-sky-600"
      />
      <text
        ref={textRef}
        x={x}
        y={y}
        fill="white"
        strokeWidth="0.5"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {text}
      </text>
    </g>
  );
}
