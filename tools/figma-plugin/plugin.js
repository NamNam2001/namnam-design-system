/*
 * NamNam -> Figma sync (phase 1: variables + Foundations page).
 *
 * Source file. `npm run tokens` prepends the token data (const NN_DATA = ...) and writes the runnable
 * plugin to build/figma/code.js. Run it in Figma desktop: Plugins > Development > Import plugin from
 * manifest > build/figma/manifest.json.
 *
 * Re-running is safe: collections and variables are matched by name and updated in place; the
 * "NamNam · Foundations" page is regenerated. Never edit the generated variables by hand in Figma:
 * change tokens/ and re-run.
 *
 * Written for the Figma plugin sandbox: no optional chaining or nullish coalescing.
 */
/* global figma, NN_DATA */

var GROUPS = [
  { key: 'primitive', name: 'NN · Primitives' },
  { key: 'base', name: 'NN · Base' },
  { key: 'theme', name: 'NN · Theme' },
  { key: 'platform', name: 'NN · Platform' },
  { key: 'component', name: 'NN · Components' },
];
var FIGMA_TYPE = {
  color: 'COLOR',
  dimension: 'FLOAT',
  number: 'FLOAT',
  fontWeight: 'FLOAT',
  duration: 'FLOAT',
  fontFamily: 'STRING',
  cubicBezier: 'STRING',
};
var ALIAS = /^\{([^}]+)\}$/;
var PAGE_NAME = 'NamNam · Foundations';
var report = { created: 0, updated: 0, retyped: 0, unresolved: [], fallback: [], bindings: 0, bindingFailures: 0 };

function publicName(id) { return id.replace(/^component\./, ''); }
function variableName(id) { return publicName(id).split('.').join('/'); }
function cssVar(id) { return 'var(--' + NN_DATA.system.css + '-' + publicName(id).split('.').join('-') + ')'; }

function hexToRgba(hex) {
  var n = parseInt(String(hex).slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
}

function rawValue(type, value) {
  switch (type) {
    case 'color': return hexToRgba(value);
    case 'dimension': return parseFloat(value);
    case 'duration': return /ms$/.test(String(value)) ? parseFloat(value) : parseFloat(value) * 1000;
    case 'number':
    case 'fontWeight': return Number(value);
    case 'fontFamily': return Array.isArray(value) ? value[0] : String(value);
    case 'cubicBezier': return 'cubic-bezier(' + value.join(', ') + ')';
    default: throw new Error('Unsupported token type "' + type + '"');
  }
}

// ------------------------------------------------------------------ collections & modes

async function findCollection(name) {
  var all = await figma.variables.getLocalVariableCollectionsAsync();
  for (var i = 0; i < all.length; i++) if (all[i].name === name) return all[i];
  return null;
}

async function getOrCreateCollection(name) {
  var existing = await findCollection(name);
  return existing || figma.variables.createVariableCollection(name);
}

/** Returns { modeName: modeId }, or null when the plan's mode limit prevents adding a mode. */
function ensureModes(collection, modes) {
  var ids = {};
  var first = collection.modes[0];
  if (first.name !== modes[0]) collection.renameMode(first.modeId, modes[0]);
  ids[modes[0]] = first.modeId;
  for (var i = 1; i < modes.length; i++) {
    var found = null;
    for (var j = 0; j < collection.modes.length; j++) if (collection.modes[j].name === modes[i]) found = collection.modes[j];
    if (found) { ids[modes[i]] = found.modeId; continue; }
    try {
      ids[modes[i]] = collection.addMode(modes[i]);
    } catch (err) {
      return null;
    }
  }
  return ids;
}

/**
 * Plan where each group's variables live. Normal case: one collection, one mode per theme/platform.
 * Fallback (plan limits modes): one single-mode collection per mode, e.g. "NN · Theme · dark".
 */
async function planTargets(group, def) {
  var modes = def.modes;
  var collection = await getOrCreateCollection(group.name);
  var modeIds = ensureModes(collection, modes);
  if (modeIds) return { multiMode: true, targets: [{ collection: collection, modes: modes, modeIds: modeIds }] };

  report.fallback.push(group.name);
  var targets = [];
  for (var i = 0; i < modes.length; i++) {
    var name = group.name + ' · ' + modes[i];
    var single = i === 0 ? collection : await getOrCreateCollection(name);
    if (i === 0 && single.name !== name) single.name = name;
    var ids = {};
    if (single.modes[0].name !== modes[i]) single.renameMode(single.modes[0].modeId, modes[i]);
    ids[modes[i]] = single.modes[0].modeId;
    targets.push({ collection: single, modes: [modes[i]], modeIds: ids });
  }
  return { multiMode: false, targets: targets };
}

// ------------------------------------------------------------------ variables

async function variablesByName(collection) {
  var all = await figma.variables.getLocalVariablesAsync();
  var map = {};
  for (var i = 0; i < all.length; i++) if (all[i].variableCollectionId === collection.id) map[all[i].name] = all[i];
  return map;
}

function upsertVariable(existing, collection, name, type) {
  var v = existing[name];
  if (v && v.resolvedType !== type) {
    v.remove();
    report.retyped += 1;
    v = null;
  }
  if (v) {
    report.updated += 1;
    return v;
  }
  report.created += 1;
  return figma.variables.createVariable(name, collection, type);
}

function isDefaultMode(modeName) {
  return modeName === NN_DATA.defaults.theme || modeName === NN_DATA.defaults.platform;
}

async function syncVariables() {
  var ctx = { byId: {}, groups: {} };
  var pending = [];

  // Pass 1: make sure every variable exists, so aliases can point forward and across collections.
  for (var g = 0; g < GROUPS.length; g++) {
    var group = GROUPS[g];
    var def = NN_DATA.collections[group.key];
    var plan = await planTargets(group, def);
    ctx.groups[group.key] = plan;
    for (var t = 0; t < plan.targets.length; t++) {
      var target = plan.targets[t];
      var existing = await variablesByName(target.collection);
      target.variables = {};
      for (var k = 0; k < def.tokens.length; k++) {
        var token = def.tokens[k];
        var type = FIGMA_TYPE[token.type];
        if (!type) throw new Error('No Figma type for token ' + token.id + ' (' + token.type + ')');
        var variable = upsertVariable(existing, target.collection, variableName(token.id), type);
        target.variables[token.id] = variable;
        // In the fallback layout, aliases point at the default theme/platform's collection.
        if (!ctx.byId[token.id] || (!plan.multiMode && isDefaultMode(target.modes[0]))) ctx.byId[token.id] = variable;
        pending.push({ group: group, token: token, target: target, variable: variable });
      }
    }
  }

  // Pass 2: values, aliases, code syntax, publishing rules.
  for (var p = 0; p < pending.length; p++) {
    var item = pending[p];
    var tk = item.token;
    var v = item.variable;
    var perMode = item.group.key === 'theme' || item.group.key === 'platform';
    for (var m = 0; m < item.target.modes.length; m++) {
      var modeName = item.target.modes[m];
      var raw = tk.values[perMode ? modeName : 'value'];
      var match = typeof raw === 'string' ? raw.match(ALIAS) : null;
      if (match) {
        var targetVar = ctx.byId[match[1]];
        if (!targetVar) {
          report.unresolved.push(tk.id + ' -> ' + match[1]);
          continue;
        }
        v.setValueForMode(item.target.modeIds[modeName], figma.variables.createVariableAlias(targetVar));
      } else {
        v.setValueForMode(item.target.modeIds[modeName], rawValue(tk.type, raw));
      }
    }
    if (tk.description) v.description = tk.description;
    if (item.group.key === 'primitive') {
      // Primitives are never used directly (playbook 4.1): hidden from pickers and from publishing.
      v.scopes = [];
      v.hiddenFromPublishing = true;
    } else {
      v.setVariableCodeSyntax('WEB', cssVar(tk.id));
    }
  }
  return ctx;
}

// ------------------------------------------------------------------ Foundations page

var FONT = { family: 'Inter', regular: 'Regular', strong: 'Semi Bold' };

async function loadFonts() {
  var wanted = NN_DATA.resolved[NN_DATA.defaults.theme + '/' + NN_DATA.defaults.platform]['font.family'];
  var family = String(wanted || 'Inter').split(',')[0].replace(/"/g, '').trim();
  var candidates = [family, 'Inter', 'Roboto'];
  for (var i = 0; i < candidates.length; i++) {
    try {
      await figma.loadFontAsync({ family: candidates[i], style: 'Regular' });
      var strong = 'Semi Bold';
      try {
        await figma.loadFontAsync({ family: candidates[i], style: strong });
      } catch (err) {
        strong = 'Bold';
        await figma.loadFontAsync({ family: candidates[i], style: strong });
      }
      FONT = { family: candidates[i], regular: 'Regular', strong: strong };
      return;
    } catch (err) {
      // try the next family
    }
  }
  throw new Error('Could not load a font (tried ' + candidates.join(', ') + ')');
}

function bind(node, field, variable) {
  if (!variable) return false;
  try {
    node.setBoundVariable(field, variable);
    report.bindings += 1;
    return true;
  } catch (err) {
    report.bindingFailures += 1;
    return false;
  }
}

function solidBound(variable) {
  var paint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
  if (!variable) return paint;
  report.bindings += 1;
  return figma.variables.setBoundVariableForPaint(paint, 'color', variable);
}

function autoFrame(name, direction, gap, padding) {
  var f = figma.createFrame();
  f.name = name;
  f.layoutMode = direction;
  f.itemSpacing = gap;
  f.paddingTop = padding;
  f.paddingBottom = padding;
  f.paddingLeft = padding;
  f.paddingRight = padding;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = [];
  return f;
}

function label(chars, size, strong, colorVar) {
  var t = figma.createText();
  t.fontName = { family: FONT.family, style: strong ? FONT.strong : FONT.regular };
  t.characters = chars;
  t.fontSize = size;
  t.fills = [solidBound(colorVar)];
  return t;
}

function setExplicitMode(node, collection, modeId) {
  try {
    node.setExplicitVariableModeForCollection(collection, modeId);
  } catch (err) {
    node.setExplicitVariableModeForCollection(collection.id, modeId);
  }
}

function section(title, v) {
  var s = autoFrame(title, 'VERTICAL', 16, 0);
  s.appendChild(label(title, 18, true, v('text.primary')));
  return s;
}

var CORNERS = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'];

function colorSection(v, resolved) {
  var groups = {};
  var order = [];
  var tokens = NN_DATA.collections.theme.tokens;
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== 'color') continue;
    var g = tokens[i].id.split('.')[0];
    if (!groups[g]) { groups[g] = []; order.push(g); }
    groups[g].push(tokens[i]);
  }
  var s = section('Color', v);
  for (var o = 0; o < order.length; o++) {
    s.appendChild(label(order[o].toUpperCase(), 12, true, v('text.secondary')));
    var row = autoFrame('row/' + order[o], 'HORIZONTAL', 12, 0);
    row.layoutWrap = 'WRAP';
    row.counterAxisSpacing = 12;
    row.primaryAxisSizingMode = 'FIXED';
    row.resize(960, 10);
    var list = groups[order[o]];
    for (var k = 0; k < list.length; k++) {
      var id = list[k].id;
      var sw = autoFrame(id, 'VERTICAL', 6, 0);
      var chip = figma.createRectangle();
      chip.name = 'chip';
      chip.resize(144, 56);
      chip.fills = [solidBound(v(id))];
      chip.strokes = [solidBound(v('border.subtle'))];
      chip.strokeWeight = 1;
      for (var c = 0; c < CORNERS.length; c++) bind(chip, CORNERS[c], v('radius.md'));
      sw.appendChild(chip);
      sw.appendChild(label(id, 12, true, v('text.primary')));
      sw.appendChild(label(String(resolved[id] || ''), 11, false, v('text.secondary')));
      row.appendChild(sw);
    }
    s.appendChild(row);
  }
  return s;
}

function typeSection(v, resolved) {
  var s = section('Typography', v);
  var roles = [];
  var tokens = NN_DATA.collections.platform.tokens;
  for (var i = 0; i < tokens.length; i++) {
    var m = tokens[i].id.match(/^type\.([a-z-]+)\.size$/);
    if (m) roles.push(m[1]);
  }
  for (var r = 0; r < roles.length; r++) {
    var role = roles[r];
    var row = autoFrame('type/' + role, 'HORIZONTAL', 24, 0);
    row.counterAxisAlignItems = 'CENTER';
    var meta = autoFrame('meta', 'VERTICAL', 2, 0);
    meta.appendChild(label(role, 12, true, v('text.primary')));
    meta.appendChild(label(resolved['type.' + role + '.size'] + ' / ' + resolved['type.' + role + '.line-height'], 11, false, v('text.secondary')));
    row.appendChild(meta);
    var strong = role !== 'body' && role !== 'caption';
    var sample = label('Meeting room AC · 26°C · Điều hoà phòng họp', parseFloat(resolved['type.' + role + '.size']), strong, v('text.primary'));
    bind(sample, 'fontSize', v('type.' + role + '.size'));
    if (!bind(sample, 'lineHeight', v('type.' + role + '.line-height'))) {
      sample.lineHeight = { value: parseFloat(resolved['type.' + role + '.line-height']), unit: 'PIXELS' };
    }
    row.appendChild(sample);
    s.appendChild(row);
  }
  return s;
}

function spaceSection(v, resolved) {
  var s = section('Spacing', v);
  var tokens = NN_DATA.collections.base.tokens;
  for (var i = 0; i < tokens.length; i++) {
    var id = tokens[i].id;
    if (id.indexOf('space.') !== 0) continue;
    var row = autoFrame(id, 'HORIZONTAL', 16, 0);
    row.counterAxisAlignItems = 'CENTER';
    row.appendChild(label(id + '  ' + resolved[id], 12, false, v('text.secondary')));
    var size = parseFloat(resolved[id]);
    if (size > 0) {
      var bar = figma.createRectangle();
      bar.name = 'bar';
      bar.resize(size, 12);
      bar.fills = [solidBound(v('accent.default'))];
      bind(bar, 'width', v(id));
      row.appendChild(bar);
    }
    s.appendChild(row);
  }
  return s;
}

function radiusSection(v, resolved) {
  var s = section('Radius', v);
  var row = autoFrame('radius', 'HORIZONTAL', 24, 0);
  var tokens = NN_DATA.collections.base.tokens;
  for (var i = 0; i < tokens.length; i++) {
    var id = tokens[i].id;
    if (id.indexOf('radius.') !== 0) continue;
    var cell = autoFrame(id, 'VERTICAL', 8, 0);
    var box = figma.createRectangle();
    box.name = 'box';
    box.resize(96, 96);
    box.fills = [solidBound(v('bg.surface-3'))];
    box.strokes = [solidBound(v('border.default'))];
    box.strokeWeight = 1;
    for (var c = 0; c < CORNERS.length; c++) bind(box, CORNERS[c], v(id));
    cell.appendChild(box);
    cell.appendChild(label(id + '  ' + resolved[id], 12, false, v('text.secondary')));
    row.appendChild(cell);
  }
  s.appendChild(row);
  return s;
}

function buildColumn(ctx, theme, platform) {
  var themePlan = ctx.groups.theme;
  var platformPlan = ctx.groups.platform;
  // Variable lookup for this column: in the fallback layout, use the collection that holds this theme/platform.
  function v(id) {
    var plans = [themePlan, platformPlan];
    for (var i = 0; i < plans.length; i++) {
      if (plans[i].multiMode) continue;
      for (var t = 0; t < plans[i].targets.length; t++) {
        var target = plans[i].targets[t];
        if ((target.modes[0] === theme || target.modes[0] === platform) && target.variables[id]) return target.variables[id];
      }
    }
    return ctx.byId[id] || null;
  }
  var resolved = NN_DATA.resolved[theme + '/' + platform];
  var col = autoFrame(theme + ' · ' + platform, 'VERTICAL', 48, 48);
  col.fills = [solidBound(v('bg.canvas'))];
  if (themePlan.multiMode) setExplicitMode(col, themePlan.targets[0].collection, themePlan.targets[0].modeIds[theme]);
  if (platformPlan.multiMode) setExplicitMode(col, platformPlan.targets[0].collection, platformPlan.targets[0].modeIds[platform]);

  var header = autoFrame('header', 'VERTICAL', 6, 0);
  header.appendChild(label(NN_DATA.system.name + ' · ' + theme + ' · ' + platform, 28, true, v('text.primary')));
  header.appendChild(label('Generated from tokens/ by the NamNam Figma plugin. Do not edit by hand: change tokens and re-run the plugin.', 14, false, v('text.secondary')));
  col.appendChild(header);
  col.appendChild(colorSection(v, resolved));
  col.appendChild(typeSection(v, resolved));
  col.appendChild(spaceSection(v, resolved));
  col.appendChild(radiusSection(v, resolved));
  return col;
}

async function renderFoundations(ctx) {
  await loadFonts();
  var page = null;
  for (var i = 0; i < figma.root.children.length; i++) if (figma.root.children[i].name === PAGE_NAME) page = figma.root.children[i];
  if (!page) {
    page = figma.createPage();
    page.name = PAGE_NAME;
  }
  await page.loadAsync();
  while (page.children.length) page.children[0].remove();
  await figma.setCurrentPageAsync(page);

  var root = autoFrame('NamNam Foundations', 'HORIZONTAL', 48, 0);
  page.appendChild(root);
  var platform = NN_DATA.defaults.platform;
  var themes = ctx.groups.theme.multiMode ? NN_DATA.themes : [NN_DATA.defaults.theme];
  for (var t = 0; t < themes.length; t++) root.appendChild(buildColumn(ctx, themes[t], platform));
  figma.viewport.scrollAndZoomIntoView([root]);
  return root;
}

// ------------------------------------------------------------------ main

async function run() {
  figma.notify('NamNam: syncing variables…');
  var ctx = await syncVariables();
  await renderFoundations(ctx);
  var parts = [report.created + ' created', report.updated + ' updated'];
  if (report.retyped) parts.push(report.retyped + ' recreated (type changed)');
  if (report.unresolved.length) parts.push(report.unresolved.length + ' unresolved aliases');
  if (report.fallback.length) parts.push('one collection per mode (plan limit): ' + report.fallback.join(', '));
  if (report.bindingFailures) parts.push(report.bindingFailures + ' bindings fell back to fixed values');
  return 'NamNam: variables ' + parts.join(', ') + '. Foundations page regenerated.';
}

if (typeof module !== 'undefined' && module.exports) {
  // Node test harness (tools/figma-plugin/test-sync.mjs) drives the plugin with a fake figma API.
  module.exports = { run: run, report: report };
} else {
  run().then(
    function (message) { figma.closePlugin(message); },
    function (err) { figma.closePlugin('NamNam sync failed: ' + (err && err.message ? err.message : String(err))); }
  );
}
