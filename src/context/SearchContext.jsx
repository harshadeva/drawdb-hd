import { createContext, useMemo, useState } from "react";

export const SearchContext = createContext(null);

// Whether the canvas "find table or column" widget is currently open. Kept in
// its own context so the header toggle (ControlPanel) and the widget itself
// (CanvasSearch) can share one piece of state without threading props.
export default function SearchContextProvider({ children }) {
  const [searchOpen, setSearchOpen] = useState(false);

  const value = useMemo(
    () => ({
      searchOpen,
      setSearchOpen,
      openSearch: () => setSearchOpen(true),
      closeSearch: () => setSearchOpen(false),
      toggleSearch: () => setSearchOpen((open) => !open),
    }),
    [searchOpen],
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
