// createSemanticTokens.js — Crear variables semanticas con aliases a primitivas
// Usar con: use_figma(fileKey, code, "Create semantic tokens")
// Parametros: reemplazar SEMANTIC_COLLECTION_ID, MODE_ID, y TOKENS antes de ejecutar

const SEMANTIC_COLLECTION_ID = "REPLACE_ME"; // <-- ID de coleccion Semantic
const MODE_ID = "REPLACE_ME";                // <-- ID del mode target

// Formato: { name, aliasVariableId } para aliases, o { name, value } para directos
const TOKENS = [
  // Ejemplo aliases (apuntan a primitivas):
  // { name: "color/bg/page", aliasVariableId: "PRIM_VAR_ID" },
  // { name: "color/text/primary", aliasVariableId: "PRIM_VAR_ID" },
  // Ejemplo directos:
  // { name: "color/bg/sidebar", value: { r: 0.21, g: 0.27, b: 0.28 } },
];

const collection = await figma.variables.getVariableCollectionByIdAsync(SEMANTIC_COLLECTION_ID);
if (!collection) return { error: "Collection not found" };

const created = [];
const skipped = [];

for (const token of TOKENS) {
  // Check if exists
  const existing = figma.variables.getLocalVariables("COLOR")
    .find(v => v.name === token.name && v.variableCollectionId === collection.id);

  if (existing) {
    skipped.push(token.name);
    continue;
  }

  const variable = figma.variables.createVariable(token.name, collection, "COLOR");

  if (token.aliasVariableId) {
    variable.setValueForMode(MODE_ID, {
      type: 'VARIABLE_ALIAS',
      id: token.aliasVariableId
    });
  } else if (token.value) {
    variable.setValueForMode(MODE_ID, token.value);
  }

  created.push({ name: token.name, id: variable.id });
}

return { created, skipped, total: TOKENS.length };
