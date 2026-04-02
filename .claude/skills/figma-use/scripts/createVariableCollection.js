// createVariableCollection.js — Crear coleccion con modes (idempotente)
// Usar con: use_figma(fileKey, code, "Create variable collection")
// Parametros: reemplazar COLLECTION_NAME y MODE_NAMES antes de ejecutar

const COLLECTION_NAME = "Primitives"; // <-- reemplazar
const MODE_NAMES = ["Default"];       // <-- reemplazar, ej: ["Light", "Dark"]

// Check-before-create
let collection = figma.variables.getLocalVariableCollections()
  .find(c => c.name === COLLECTION_NAME);

if (collection) {
  return {
    existed: true,
    collectionId: collection.id,
    modes: collection.modes.map(m => ({ id: m.modeId, name: m.name }))
  };
}

// Crear nueva
collection = figma.variables.createVariableCollection(COLLECTION_NAME);
collection.renameMode(collection.modes[0].modeId, MODE_NAMES[0]);

// Agregar modes adicionales
const modeIds = [{ id: collection.modes[0].modeId, name: MODE_NAMES[0] }];
for (let i = 1; i < MODE_NAMES.length; i++) {
  const newModeId = collection.addMode(MODE_NAMES[i]);
  modeIds.push({ id: newModeId, name: MODE_NAMES[i] });
}

return {
  existed: false,
  collectionId: collection.id,
  modes: modeIds
};
