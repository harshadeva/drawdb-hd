import { Validator } from "jsonschema";
import { nanoid } from "nanoid";
import { tableTemplateSchema } from "../data/schemas";

const STORAGE_KEY = "table_templates";
const validator = new Validator();

function isValidTemplate(entry) {
  return validator.validate(entry, tableTemplateSchema).valid;
}

export function getTableTemplates() {
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

export function saveTableTemplates(templates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function addTableTemplate(name, fields) {
  const template = {
    id: nanoid(),
    name,
    fields: fields.map((field) => {
      const clone = { ...field };
      delete clone.id;
      return clone;
    }),
  };
  saveTableTemplates([...getTableTemplates(), template]);
  return template;
}

export function deleteTableTemplate(id) {
  saveTableTemplates(getTableTemplates().filter((t) => t.id !== id));
}
