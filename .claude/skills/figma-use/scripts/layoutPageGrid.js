/**
 * layoutPageGrid.js
 *
 * Organiza todos los nodos de una pagina en un grid limpio
 * sin traslapes, respetando la altura maxima de cada fila.
 *
 * Uso con use_figma:
 *   - Copiar este patron dentro del codigo de use_figma
 *   - Ajustar pageId, GAP_X, GAP_Y, MAX_ROW_WIDTH segun necesidad
 *
 * Parametros:
 *   pageId       - ID de la pagina a organizar
 *   GAP_X        - Espacio horizontal entre nodos (default: 80)
 *   GAP_Y        - Espacio vertical entre filas (default: 120)
 *   MAX_ROW_WIDTH - Ancho maximo antes de saltar a nueva fila (default: 6000)
 *   groupBy      - Funcion opcional para agrupar nodos (agrega espacio extra entre grupos)
 *   GROUP_GAP    - Espacio extra entre grupos (default: 300)
 */

// === COPIAR DESDE AQUI EN use_figma ===

const PAGE_ID = "TARGET_PAGE_ID"; // Reemplazar con el ID real
const GAP_X = 80;
const GAP_Y = 120;
const MAX_ROW_WIDTH = 6000;
const GROUP_GAP = 300;

const targetPage = figma.root.children.find(p => p.id === PAGE_ID);
await figma.setCurrentPageAsync(targetPage);

// Ordenar: COMPONENT_SET primero, luego COMPONENT, luego SECTION, por nombre
const nodes = [...targetPage.children].sort((a, b) => {
  const typeOrder = { COMPONENT_SET: 0, COMPONENT: 1, SECTION: 2, FRAME: 3 };
  const ao = typeOrder[a.type] ?? 4;
  const bo = typeOrder[b.type] ?? 4;
  if (ao !== bo) return ao - bo;
  return a.name.localeCompare(b.name);
});

// Layout en grid respetando alturas
let x = 0;
let y = 0;
let rowMaxHeight = 0;
let currentRow = [];

function commitRow() {
  for (const item of currentRow) {
    item.node.y = y;
  }
  y += rowMaxHeight + GAP_Y;
  rowMaxHeight = 0;
  currentRow = [];
  x = 0;
}

for (const node of nodes) {
  // Si excede el ancho maximo, nueva fila
  if (x > 0 && x + node.width > MAX_ROW_WIDTH) {
    commitRow();
  }

  node.x = x;
  node.y = y;
  currentRow.push({ node });
  rowMaxHeight = Math.max(rowMaxHeight, node.height);
  x += node.width + GAP_X;
}

if (currentRow.length > 0) commitRow();

return {
  arranged: nodes.length,
  totalHeight: y,
  nodes: nodes.map(c => ({ name: c.name, x: Math.round(c.x), y: Math.round(c.y) }))
};

// === FIN DEL PATRON ===
