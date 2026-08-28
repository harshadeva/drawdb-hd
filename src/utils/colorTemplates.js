import { Validator } from "jsonschema";
import { nanoid } from "nanoid";
import { colorTemplateSchema } from "../data/schemas";
import { defaultBlue } from "../data/constants";

const STORAGE_KEY = "color_templates";
const CHANGE_EVENT = "color-templates-changed";
const validator = new Validator();

function isValidTemplate(entry) {
  return validator.validate(entry, colorTemplateSchema).valid;
}

export function getColorTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidTemplate);
  } catch {
    return [];
  }
}

export function saveColorTemplates(templates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: templates }));
}

export function colorTemplatesChangeEvent() {
  return CHANGE_EVENT;
}

export function addColorTemplate(name, value = defaultBlue) {
  const template = { id: nanoid(), name, value };
  saveColorTemplates([...getColorTemplates(), template]);
  return template;
}

export function updateColorTemplate(id, patch) {
  saveColorTemplates(
    getColorTemplates().map((tpl) =>
      tpl.id === id ? { ...tpl, ...patch } : tpl,
    ),
  );
}

export function deleteColorTemplate(id) {
  saveColorTemplates(getColorTemplates().filter((tpl) => tpl.id !== id));
}

/**
 * Add incoming templates that we don't already have (matched by id).
 * Never overwrites an existing local template.
 */
export function mergeColorTemplates(incoming) {
  if (!Array.isArray(incoming)) return;
  const existing = getColorTemplates();
  const knownIds = new Set(existing.map((tpl) => tpl.id));
  const additions = incoming.filter(
    (tpl) => isValidTemplate(tpl) && !knownIds.has(tpl.id),
  );
  if (additions.length === 0) return;
  saveColorTemplates([...existing, ...additions]);
}

/**
 * Collect every color-template id referenced by the given diagram collections.
 * `sources` may contain `tables`, `areas`, `notes` arrays and a `customTypes`
 * map shaped like `{ [db]: { [NAME]: { colorId } } }`.
 */
export function collectUsedColorTemplateIds(sources = {}) {
  const ids = new Set();
  const scan = (list) => {
    if (!Array.isArray(list)) return;
    for (const item of list) if (item?.colorId) ids.add(item.colorId);
  };
  scan(sources.tables);
  scan(sources.areas);
  scan(sources.notes);
  if (sources.customTypes && typeof sources.customTypes === "object") {
    for (const types of Object.values(sources.customTypes)) {
      if (!types || typeof types !== "object") continue;
      for (const entry of Object.values(types)) {
        if (entry?.colorId) ids.add(entry.colorId);
      }
    }
  }
  return ids;
}

/**
 * The subset of saved templates actually referenced by `sources`. Used to keep
 * shared / exported diagrams self-contained without leaking the whole palette.
 */
export function getUsedColorTemplates(sources) {
  const ids = collectUsedColorTemplateIds(sources);
  if (ids.size === 0) return [];
  return getColorTemplates().filter((tpl) => ids.has(tpl.id));
}

/**
 * Resolve the effective color for an element that may be bound to a template.
 * Falls back to the element's cached `color` hex when it has no binding or the
 * bound template no longer exists.
 */
export function resolveColor(data, templates) {
  if (!data) return undefined;
  if (data.colorId && Array.isArray(templates)) {
    const match = templates.find((tpl) => tpl.id === data.colorId);
    if (match) return match.value;
  }
  return data.color;
}
