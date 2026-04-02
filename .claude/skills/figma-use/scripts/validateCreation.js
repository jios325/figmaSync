// validateCreation.js — Verificar que nodos creados coinciden con expectativas
// Usar con: use_figma(fileKey, code, "Validate created nodes")
// Parametros: reemplazar EXPECTED_NODES antes de ejecutar

// Formato: array de { id, name, type, childCount? }
const EXPECTED_NODES = [
  // { id: "123:456", name: "My Frame", type: "FRAME", childCount: 3 },
  // { id: "123:457", name: "Button", type: "COMPONENT" },
];

const results = [];

for (const expected of EXPECTED_NODES) {
  const node = await figma.getNodeByIdAsync(expected.id);

  if (!node) {
    results.push({ ...expected, status: "MISSING", error: "Node not found" });
    continue;
  }

  const issues = [];
  if (node.name !== expected.name) issues.push(`name: "${node.name}" != "${expected.name}"`);
  if (node.type !== expected.type) issues.push(`type: "${node.type}" != "${expected.type}"`);
  if (expected.childCount !== undefined && 'children' in node) {
    if (node.children.length !== expected.childCount) {
      issues.push(`children: ${node.children.length} != ${expected.childCount}`);
    }
  }

  results.push({
    id: expected.id,
    name: node.name,
    type: node.type,
    status: issues.length === 0 ? "OK" : "MISMATCH",
    issues: issues.length > 0 ? issues : undefined
  });
}

const ok = results.filter(r => r.status === "OK").length;
const missing = results.filter(r => r.status === "MISSING").length;
const mismatch = results.filter(r => r.status === "MISMATCH").length;

return { summary: { ok, missing, mismatch, total: results.length }, details: results };
