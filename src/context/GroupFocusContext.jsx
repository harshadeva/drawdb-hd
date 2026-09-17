import { createContext, useMemo, useState } from "react";

export const GroupFocusContext = createContext(null);

// Which process groups are currently "focused" (spotlighted) on the canvas.
// Transient UI state only, mirroring SearchContext — never persisted with the
// diagram and not part of the undo stack.
export default function GroupFocusContextProvider({ children }) {
  const [focusedGroupIds, setFocusedGroupIds] = useState(() => new Set());

  const value = useMemo(
    () => ({
      focusedGroupIds,
      toggleFocus: (id) =>
        setFocusedGroupIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        }),
      clearFocus: () => setFocusedGroupIds(new Set()),
    }),
    [focusedGroupIds],
  );

  return (
    <GroupFocusContext.Provider value={value}>
      {children}
    </GroupFocusContext.Provider>
  );
}
