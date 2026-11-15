// Toggle rules for skin_<set>_raccoon_s1.glb (three.js). parts: Set of part ids that are ON, e.g. new Set(['storm_crown','storm_wings'])
export function applyRules(scene, parts) {
  const on = id => parts.has(id); const node = n => scene.getObjectByName(n);
  const root = scene.getObjectByName('body_base').parent;   // skin_<set>_raccoon_s1
  for (const o of root.children) if (o.name.startsWith('part_')) o.visible = on(o.name.slice(5));   // top-level part_<id> nodes only
  const set = (n, v) => { const o = node(n); if (o) o.visible = v; };
  if (node('body_storm')) {          // legendary «Повелитель Грозы»
    set('body_base', !on('storm_body'));
    set('body_storm', on('storm_body'));
    set('body_storm_tail', !on('storm_tail'));
    set('base_tail', !on('storm_tail') && !on('storm_body'));
    set('base_wings', !on('storm_wings'));
  } else set('body_base', true);
}
