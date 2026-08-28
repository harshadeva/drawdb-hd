import { createContext, useCallback, useEffect, useRef, useState } from "react";
import {
  colorTemplatesChangeEvent,
  getColorTemplates,
  resolveColor,
  saveColorTemplates,
} from "../utils/colorTemplates";
import { useAreas, useDiagram, useNotes } from "../hooks";

export const ColorPaletteContext = createContext(null);

export default function ColorPaletteContextProvider({ children }) {
  const [templates, setTemplatesState] = useState(() => getColorTemplates());
  const { tables, setTables } = useDiagram();
  const { areas, setAreas } = useAreas();
  const { notes, setNotes } = useNotes();
  const firstRun = useRef(true);

  // Keep local state in sync with other tabs / other parts of the app that
  // persist the palette directly through the util.
  useEffect(() => {
    const refresh = () => setTemplatesState(getColorTemplates());
    const changeEvent = colorTemplatesChangeEvent();
    window.addEventListener(changeEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(changeEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // When a template's value changes (or it is removed), refresh the cached
  // `color` on every bound element so the canvas repaints and exports stay
  // correct. Deleted templates leave the last resolved color frozen and drop
  // the now-dangling binding.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const byId = new Map(templates.map((tpl) => [tpl.id, tpl]));

    const syncCollection = (collection, setCollection) => {
      let changed = false;
      const next = collection.map((item) => {
        if (!item.colorId) return item;
        const match = byId.get(item.colorId);
        if (match) {
          if (item.color === match.value) return item;
          changed = true;
          return { ...item, color: match.value };
        }
        changed = true;
        return { ...item, colorId: null };
      });
      if (changed) setCollection(next);
    };

    syncCollection(tables, setTables);
    syncCollection(areas, setAreas);
    syncCollection(notes, setNotes);
    // Only react to palette changes; the collections are read fresh each run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates]);

  const setTemplates = useCallback((next) => {
    const value = typeof next === "function" ? next(getColorTemplates()) : next;
    saveColorTemplates(value);
    setTemplatesState(value);
  }, []);

  const resolve = useCallback(
    (data) => resolveColor(data, templates),
    [templates],
  );

  return (
    <ColorPaletteContext.Provider value={{ templates, setTemplates, resolve }}>
      {children}
    </ColorPaletteContext.Provider>
  );
}
