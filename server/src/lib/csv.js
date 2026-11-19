// Cells starting with = + - @ can run as formulas in Excel, so text cells get a leading '
const cell = (v) => {
  if (v == null) return "";
  let s = typeof v === "number" ? String(v) : String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows, columns) =>
  "\uFEFF" +
  [columns.map((c) => cell(c.label)).join(",")]
    .concat(rows.map((r) => columns.map((c) => cell(r[c.key])).join(",")))
    .join("\r\n");

export function parseCsv(text) {
  const s = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  const endRow = () => {
    row.push(field);
    field = "";
    if (row.some((x) => x.trim() !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      endRow();
    } else field += c;
  }
  endRow();

  const [head, ...body] = rows;
  if (!head) return [];
  const keys = head.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}