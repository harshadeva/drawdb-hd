// Forgiving name matching for the canvas search widget.
//
// Case, separators (space, _, -, .), camelCase boundaries and naive English
// plurals are all folded away before comparing, so a query like
// "program Evaluations" matches a table named "program_evaluation". When none
// of those normalised forms line up we fall back to an in-order subsequence
// match ("usr" -> "users") so partial and abbreviated queries still land.

const singularize = (word) => {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (/(ss|ches|shes|xes|zes|ses)$/.test(word)) {
    return word.endsWith("ss") ? word : word.slice(0, -2);
  }
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
};

const tokenize = (value) =>
  String(value ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((token) => token.toLowerCase());

// "program_evaluations" / "Program Evaluations" -> "programevaluation"
const normalize = (value) => tokenize(value).map(singularize).join("");
const collapse = (value) => tokenize(value).join("");

function subsequenceScore(query, target) {
  if (!query) return 0;
  let cursor = 0;
  let score = 0;
  let streak = 0;
  let firstMatch = -1;

  for (const char of query) {
    const found = target.indexOf(char, cursor);
    if (found === -1) return 0;
    if (firstMatch === -1) firstMatch = found;
    if (found === cursor) {
      streak += 1;
      score += 2 + streak; // reward runs of adjacent characters
    } else {
      streak = 0;
      score += 1;
    }
    cursor = found + 1;
  }

  score += Math.max(0, 12 - firstMatch); // reward matching near the start
  score += Math.max(0, 12 - (target.length - query.length)); // and tight matches
  return score;
}

/**
 * Match score for how well `query` describes `target` (higher is better, 0 is
 * no match). Only meaningful for ranking, it is not a distance.
 */
export function fuzzyScore(query, target) {
  const q = normalize(query);
  if (!q) return 0;
  const t = normalize(target);

  if (q === t) return 1000;
  if (t.startsWith(q)) return 900 - (t.length - q.length);
  if (t.includes(q)) return 750 - (t.length - q.length);

  const qRaw = collapse(query);
  const tRaw = collapse(target);
  if (qRaw && tRaw.includes(qRaw)) return 650 - (tRaw.length - qRaw.length);

  if (q.length < 2) return 0;
  const score = subsequenceScore(q, t);
  return score > 0 ? score : 0;
}

/** Which parts of the diagram {@link searchDiagram} looks at. */
export const SearchScope = {
  ALL: "all",
  TABLES: "tables",
  COLUMNS: "columns",
};

/**
 * Searches table names and/or column names in the diagram.
 * Returns navigation targets, best match first, then in diagram order.
 *
 * @param {SearchScope[keyof SearchScope]} [scope] restrict to tables, columns
 *   or both (default).
 * @returns {{ key: string, type: "table" | "field", tableId: (string|number),
 *   fieldId?: (string|number), tableName: string, label: string }[]}
 */
export function searchDiagram(tables, query, scope = SearchScope.ALL) {
  const trimmed = (query ?? "").trim();
  if (!trimmed || !Array.isArray(tables)) return [];

  const includeTables = scope !== SearchScope.COLUMNS;
  const includeColumns = scope !== SearchScope.TABLES;
  const results = [];

  tables.forEach((table, tableIndex) => {
    if (includeTables) {
      const tableScore = fuzzyScore(trimmed, table.name);
      if (tableScore > 0) {
        results.push({
          key: `table-${table.id}`,
          type: "table",
          tableId: table.id,
          tableName: table.name,
          label: table.name,
          score: tableScore + 40, // keep a table above its own columns
          order: tableIndex * 1000,
        });
      }
    }

    if (includeColumns) {
      (table.fields ?? []).forEach((field, fieldIndex) => {
        const fieldScore = fuzzyScore(trimmed, field.name);
        if (fieldScore > 0) {
          results.push({
            key: `field-${table.id}-${field.id ?? fieldIndex}`,
            type: "field",
            tableId: table.id,
            fieldId: field.id ?? fieldIndex,
            tableName: table.name,
            label: `${table.name}.${field.name}`,
            score: fieldScore,
            order: tableIndex * 1000 + fieldIndex + 1,
          });
        }
      });
    }
  });

  results.sort((a, b) => b.score - a.score || a.order - b.order);
  return results;
}
