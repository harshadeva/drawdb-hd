import { Validator } from "jsonschema";
import { nanoid } from "nanoid";
import { tableTemplateSchema } from "../data/schemas";
import { getRelationshipFields } from "./utils";

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

export function buildTemplateFields(table, tables, relationships) {
  const referencesByFieldId = new Map();

  relationships
    .filter((r) => r.startTableId === table.id)
    .forEach((relationship, fkGroup) => {
      const endTable = tables.find((t) => t.id === relationship.endTableId);
      if (!endTable) return;
      getRelationshipFields(relationship).forEach(
        ({ startFieldId, endFieldId }) => {
          const endField = endTable.fields.find((f) => f.id === endFieldId);
          referencesByFieldId.set(startFieldId, {
            table: endTable.name,
            field: endField?.name,
            cardinality: relationship.cardinality,
            updateConstraint: relationship.updateConstraint,
            deleteConstraint: relationship.deleteConstraint,
            fkGroup,
          });
        },
      );
    });

  return table.fields.map((field) => {
    const references = referencesByFieldId.get(field.id);
    return references ? { ...field, references } : field;
  });
}
