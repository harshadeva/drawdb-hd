import { useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";
import { Select } from "@douyinfe/semi-ui";
import {
  IconSearch,
  IconChevronUp,
  IconChevronDown,
  IconClose,
} from "@douyinfe/semi-icons";
import { useSearch } from "../../hooks";
import { searchDiagram, SearchScope } from "../../utils/fuzzySearch";

const SCOPE_STORAGE_KEY = "drawdb:canvasSearchScope";

const readStoredScope = () => {
  try {
    const value = localStorage.getItem(SCOPE_STORAGE_KEY);
    return Object.values(SearchScope).includes(value) ? value : SearchScope.ALL;
  } catch {
    return SearchScope.ALL;
  }
};

// A VS Code style "find" widget for the canvas: fuzzy-search table and column
// names, narrow the hunt to tables / columns / both, step through the hits with
// the carets (or Enter / Shift+Enter) and let the parent pan + flash the match.
//
// It is only mounted while open (toggled from the header button or Ctrl/Cmd+F),
// so it never sits on top of the canvas during normal editing.
export default function CanvasSearch({ tables, onNavigate }) {
  const { t } = useTranslation();
  const { searchOpen, openSearch, closeSearch } = useSearch();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState(readStoredScope);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasNavigated, setHasNavigated] = useState(false);

  const results = useMemo(
    () => (searchOpen ? searchDiagram(tables, query, scope) : []),
    [searchOpen, tables, query, scope],
  );

  // A fresh query or a changed scope restarts the walk from the top.
  useEffect(() => {
    setActiveIndex(0);
    setHasNavigated(false);
  }, [query, scope]);

  // Keep the cursor in range if the diagram changes under an active search.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, results.length - 1)));
  }, [results.length]);

  useEffect(() => {
    try {
      localStorage.setItem(SCOPE_STORAGE_KEY, scope);
    } catch {
      /* ignore unavailable storage */
    }
  }, [scope]);

  // Focus (and preselect) the field whenever the widget opens.
  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [searchOpen]);

  useHotkeys(
    "mod+f",
    () => {
      if (searchOpen) {
        inputRef.current?.focus();
        inputRef.current?.select();
      } else {
        openSearch();
      }
    },
    { preventDefault: true, enableOnFormTags: true },
    [searchOpen],
  );

  const go = (dir) => {
    const count = results.length;
    if (!count) return;
    let next;
    if (!hasNavigated) {
      next = dir === "next" ? 0 : count - 1;
      setHasNavigated(true);
    } else {
      next =
        dir === "next"
          ? (activeIndex + 1) % count
          : (activeIndex - 1 + count) % count;
    }
    setActiveIndex(next);
    onNavigate(results[next]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      go(e.shiftKey ? "prev" : "next");
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeSearch();
    }
  };

  if (!searchOpen) return null;

  const count = results.length;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="absolute top-4 right-4 z-20 pointer-events-auto">
      <div className="popover-theme flex items-center gap-1 rounded-lg border border-color shadow-lg ps-2 pe-1 py-1">
        <IconSearch className="shrink-0 opacity-50" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("search_tables_columns")}
          aria-label={t("search_tables_columns")}
          className="w-44 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-zinc-400"
        />
        <Select
          size="small"
          value={scope}
          onChange={setScope}
          className="shrink-0"
          style={{ width: 108 }}
          aria-label={t("search_scope")}
          optionList={[
            { value: SearchScope.ALL, label: t("search_scope_all") },
            { value: SearchScope.TABLES, label: t("search_scope_tables") },
            { value: SearchScope.COLUMNS, label: t("search_scope_columns") },
          ]}
        />
        {hasQuery && (
          <span
            className={`shrink-0 whitespace-nowrap px-1 text-xs tabular-nums ${
              count ? "opacity-60" : "text-rose-500"
            }`}
          >
            {count === 0
              ? t("no_results")
              : hasNavigated
                ? `${activeIndex + 1}/${count}`
                : t("results_found", { count })}
          </span>
        )}
        <button
          type="button"
          title={t("previous_match")}
          aria-label={t("previous_match")}
          disabled={!count}
          onClick={() => go("prev")}
          className="rounded p-1 hover-1 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <IconChevronUp size="small" />
        </button>
        <button
          type="button"
          title={t("next_match")}
          aria-label={t("next_match")}
          disabled={!count}
          onClick={() => go("next")}
          className="rounded p-1 hover-1 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <IconChevronDown size="small" />
        </button>
        <button
          type="button"
          title={t("close")}
          aria-label={t("close")}
          onClick={closeSearch}
          className="rounded p-1 hover-1"
        >
          <IconClose size="small" />
        </button>
      </div>
    </div>
  );
}
