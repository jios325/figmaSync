// inspectFileStructure.js — Descubrir estructura completa del archivo Figma (read-only)
// Usar con: use_figma(fileKey, code, "Inspect file structure")

const pages = figma.root.children.map(p => ({
  id: p.id,
  name: p.name,
  childCount: p.children?.length || 0
}));

const collections = figma.variables.getLocalVariableCollections().map(c => ({
  id: c.id,
  name: c.name,
  modes: c.modes.map(m => ({ id: m.modeId, name: m.name })),
  variableCount: c.variableIds.length
}));

const components = figma.root.findAllWithCriteria({
  types: ['COMPONENT', 'COMPONENT_SET']
}).map(c => ({
  id: c.id,
  name: c.name,
  type: c.type,
  key: c.type === 'COMPONENT' ? c.key : undefined,
  page: c.parent?.parent?.name || c.parent?.name
}));

const colorVars = figma.variables.getLocalVariables("COLOR").length;
const floatVars = figma.variables.getLocalVariables("FLOAT").length;
const stringVars = figma.variables.getLocalVariables("STRING").length;

return {
  pages,
  collections,
  components: components.slice(0, 50), // limit to avoid overflow
  componentCount: components.length,
  variableCounts: { color: colorVars, float: floatVars, string: stringVars }
};
