// cleanupOrphans.js — Limpiar nodos huerfanos por identificador
// Usar con: use_figma(fileKey, code, "Cleanup orphan nodes")
// Parametros: reemplazar RUN_ID o NODE_IDS antes de ejecutar

// Metodo 1: Por run_id en sharedPluginData (seguro, recomendado)
const RUN_ID = "REPLACE_ME"; // <-- ID del build run

// Metodo 2: Por IDs especificos (cuando se conocen los nodos a limpiar)
const NODE_IDS = []; // <-- array de IDs, ej: ["123:456", "123:457"]

const removed = [];

if (NODE_IDS.length > 0) {
  // Metodo 2: eliminar por IDs especificos
  for (const id of NODE_IDS) {
    const node = await figma.getNodeByIdAsync(id);
    if (node) {
      removed.push({ id: node.id, name: node.name, type: node.type });
      node.remove();
    }
  }
} else if (RUN_ID !== "REPLACE_ME") {
  // Metodo 1: buscar por sharedPluginData
  await figma.loadAllPagesAsync();
  for (const page of figma.root.children) {
    for (const child of page.children) {
      const nodeRunId = child.getSharedPluginData("dsb", "run_id");
      if (nodeRunId === RUN_ID) {
        removed.push({ id: child.id, name: child.name, type: child.type, page: page.name });
        child.remove();
      }
    }
  }
}

return { removed, count: removed.length };
