import { createContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";
import { Action, ObjectType, defaultGroupColor } from "../data/constants";
import { useDiagram, useUndoRedo, useCollab } from "../hooks";

export const GroupsContext = createContext(null);

export default function GroupsContextProvider({ children }) {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const { tables, setTables } = useDiagram();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { emitDelta, isApplyingRemoteRef } = useCollab();
  const shouldEmit = () => !isApplyingRemoteRef?.current;

  const addGroup = (data, addToHistory = true) => {
    const created = data ?? {
      id: nanoid(),
      name: `group_${groups.length}`,
      color: defaultGroupColor,
      colorId: null,
    };

    setGroups((prev) => [...prev, created]);

    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.GROUP,
          data: created,
          message: t("add_group"),
        },
      ]);
      setRedoStack([]);
    }
    if (shouldEmit()) {
      emitDelta({
        target: "group",
        action: "create",
        entityId: created.id,
        data: [created],
      });
    }
    return created;
  };

  const deleteGroup = (id, addToHistory = true) => {
    const deletedGroup = groups.find((g) => g.id === id);
    const taggedTables = tables
      .filter((t) => t.groupIds?.includes(id))
      .map((t) => ({ id: t.id, groupIds: t.groupIds }));

    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.GROUP,
          data: { group: deletedGroup, tables: taggedTables },
          message: t("delete_group", { groupName: deletedGroup?.name }),
        },
      ]);
      setRedoStack([]);
    }

    setGroups((prev) => prev.filter((g) => g.id !== id));
    if (taggedTables.length > 0) {
      setTables((prev) =>
        prev.map((t) =>
          t.groupIds?.includes(id)
            ? { ...t, groupIds: t.groupIds.filter((gid) => gid !== id) }
            : t,
        ),
      );
    }

    if (shouldEmit()) {
      emitDelta({
        target: "group",
        action: "delete",
        entityId: id,
        data: [id],
      });
    }
  };

  const updateGroup = (id, values) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...values } : g)),
    );
    if (shouldEmit()) {
      emitDelta({
        target: "group",
        action: "update",
        entityId: id,
        data: [id, values],
      });
    }
  };

  return (
    <GroupsContext.Provider
      value={{
        groups,
        setGroups,
        addGroup,
        deleteGroup,
        updateGroup,
        groupsCount: groups.length,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
}
