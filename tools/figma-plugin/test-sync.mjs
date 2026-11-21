#!/usr/bin/env node
/**
 * Runs the generated Figma plugin (build/figma/code.js) against a fake Figma API in Node.
 * The fake enforces the rules that make real runs fail: alias types must match, paints need COLOR
 * variables, numeric bindings need FLOAT variables, fonts must be loaded before text is set,
 * sizes must be > 0, duplicate variable names are rejected, and an optional mode limit
 * (the free plan) makes addMode throw.
 *
 *   node tools/figma-plugin/test-sync.mjs        (also part of `npm run check`)
 *
 * This proves the plugin logic and the token data agree. It cannot prove Figma renders the page
 * nicely: open the file in Figma once after changing the plugin.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CODE = readFileSync(join(ROOT, 'build', 'figma', 'code.js'), 'utf8');
const DATA = JSON.parse(CODE.slice(CODE.indexOf('const NN_DATA = ') + 'const NN_DATA = '.length, CODE.indexOf(';\n\n')));
const NUMERIC_FIELDS = new Set(['width', 'height', 'fontSize', 'lineHeight', 'itemSpacing', 'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']);
const AVAILABLE_FONTS = new Set(['Inter|Regular', 'Inter|Semi Bold', 'Inter|Bold', 'Roboto|Regular', 'Roboto|Bold']);

function createFakeFigma({ modeLimit = Infinity } = {}) {
  let next = 1;
  const newId = (prefix) => `${prefix}:${next++}`;
  const collections = [];
  const variables = [];
  const loadedFonts = new Set();
  const out = { closed: null, notes: [] };

  const collectionOf = (ref) => (typeof ref === 'string' ? collections.find((c) => c.id === ref) : ref);

  function createVariableCollection(name) {
    const c = {
      id: newId('VariableCollectionId'),
      name,
      modes: [{ modeId: newId('mode'), name: 'Mode 1' }],
      get defaultModeId() { return this.modes[0].modeId; },
      renameMode(modeId, modeName) {
        const mode = this.modes.find((m) => m.modeId === modeId);
        if (!mode) throw new Error(`renameMode: unknown mode ${modeId}`);
        mode.name = modeName;
      },
      addMode(modeName) {
        if (this.modes.length >= modeLimit) throw new Error(`in addMode: Limited to ${modeLimit} modes only`);
        const mode = { modeId: newId('mode'), name: modeName };
        this.modes.push(mode);
        return mode.modeId;
      },
    };
    collections.push(c);
    return c;
  }

  function createVariable(name, collectionRef, type) {
    const collection = collectionOf(collectionRef);
    if (!collection) throw new Error('createVariable: unknown collection');
    if (!['COLOR', 'FLOAT', 'STRING', 'BOOLEAN'].includes(type)) throw new Error(`createVariable: bad type ${type}`);
    if (variables.some((v) => v.variableCollectionId === collection.id && v.name === name)) {
      throw new Error(`createVariable: duplicate name "${name}" in ${collection.name}`);
    }
    const v = {
      id: newId('VariableID'),
      name,
      resolvedType: type,
      variableCollectionId: collection.id,
      valuesByMode: {},
      codeSyntax: {},
      scopes: ['ALL_SCOPES'],
      hiddenFromPublishing: false,
      description: '',
      setValueForMode(modeId, value) {
        const own = collections.find((c) => c.id === this.variableCollectionId);
        if (!own.modes.some((m) => m.modeId === modeId)) throw new Error(`setValueForMode: ${this.name} has no mode ${modeId}`);
        if (value && value.type === 'VARIABLE_ALIAS') {
          const target = variables.find((x) => x.id === value.id);
          if (!target) throw new Error(`setValueForMode: ${this.name} aliases a missing variable`);
          if (target.resolvedType !== this.resolvedType) {
            throw new Error(`setValueForMode: ${this.name} (${this.resolvedType}) cannot alias ${target.name} (${target.resolvedType})`);
          }
          if (target === this) throw new Error(`setValueForMode: ${this.name} aliases itself`);
        } else if (this.resolvedType === 'COLOR') {
          const ok = value && ['r', 'g', 'b'].every((k) => typeof value[k] === 'number' && value[k] >= 0 && value[k] <= 1);
          if (!ok) throw new Error(`setValueForMode: ${this.name} needs an RGB(A) color in 0..1`);
        } else if (this.resolvedType === 'FLOAT') {
          if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`setValueForMode: ${this.name} needs a finite number, got ${value}`);
        } else if (this.resolvedType === 'STRING') {
          if (typeof value !== 'string') throw new Error(`setValueForMode: ${this.name} needs a string`);
        }
        this.valuesByMode[modeId] = value;
      },
      setVariableCodeSyntax(platform, syntax) { this.codeSyntax[platform] = syntax; },
      remove() { variables.splice(variables.indexOf(this), 1); },
    };
    variables.push(v);
    return v;
  }

  function makeNode(type) {
    const node = {
      type,
      name: '',
      parent: null,
      children: [],
      fills: [],
      strokes: [],
      boundVariables: {},
      explicitModes: {},
      appendChild(child) {
        if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1);
        child.parent = this;
        this.children.push(child);
      },
      remove() {
        if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1);
        this.parent = null;
      },
      resize(w, h) {
        if (!(w > 0 && h > 0)) throw new Error(`resize: ${this.name || type} needs sizes > 0, got ${w}x${h}`);
        this.width = w;
        this.height = h;
      },
      setBoundVariable(field, variable) {
        if (!variables.includes(variable)) throw new Error(`setBoundVariable: unknown variable for ${field}`);
        if (NUMERIC_FIELDS.has(field) && variable.resolvedType !== 'FLOAT') {
          throw new Error(`setBoundVariable: ${field} needs a FLOAT variable, got ${variable.name} (${variable.resolvedType})`);
        }
        this.boundVariables[field] = { type: 'VARIABLE_ALIAS', id: variable.id };
      },
      setExplicitVariableModeForCollection(ref, modeId) {
        const c = collectionOf(ref);
        if (!c || !c.modes.some((m) => m.modeId === modeId)) throw new Error('setExplicitVariableModeForCollection: bad collection or mode');
        this.explicitModes[c.id] = modeId;
      },
      async loadAsync() {},
    };
    if (type === 'TEXT') {
      let chars = '';
      node.fontName = { family: 'Inter', style: 'Regular' };
      Object.defineProperty(node, 'characters', {
        get: () => chars,
        set: (value) => {
          const key = `${node.fontName.family}|${node.fontName.style}`;
          if (!loadedFonts.has(key)) throw new Error(`characters: font ${key} is not loaded`);
          chars = value;
        },
      });
    }
    return node;
  }

  const firstPage = makeNode('PAGE');
  firstPage.name = 'Page 1';
  const root = { children: [firstPage] };

  const figma = {
    root,
    variables: {
      getLocalVariableCollectionsAsync: async () => [...collections],
      getLocalVariablesAsync: async () => [...variables],
      createVariableCollection,
      createVariable,
      createVariableAlias: (v) => ({ type: 'VARIABLE_ALIAS', id: v.id }),
      setBoundVariableForPaint(paint, field, v) {
        if (field !== 'color') throw new Error(`setBoundVariableForPaint: unsupported field ${field}`);
        if (v.resolvedType !== 'COLOR') throw new Error(`setBoundVariableForPaint: ${v.name} is ${v.resolvedType}, paints need COLOR`);
        return { ...paint, boundVariables: { color: { type: 'VARIABLE_ALIAS', id: v.id } } };
      },
    },
    createPage() {
      const p = makeNode('PAGE');
      root.children.push(p);
      return p;
    },
    createFrame: () => makeNode('FRAME'),
    createRectangle: () => makeNode('RECTANGLE'),
    createText: () => makeNode('TEXT'),
    async loadFontAsync(font) {
      const key = `${font.family}|${font.style}`;
      if (!AVAILABLE_FONTS.has(key)) throw new Error(`loadFontAsync: ${key} not available`);
      loadedFonts.add(key);
    },
    async setCurrentPageAsync(page) { figma.currentPage = page; },
    viewport: { scrollAndZoomIntoView() {} },
    notify: (msg) => out.notes.push(msg),
    closePlugin: (msg) => { out.closed = msg; },
  };
  return { figma, collections, variables, out };
}

async function runPlugin(fake, label) {
  try {
    const module = { exports: {} };
    vm.runInContext(CODE, vm.createContext({ figma: fake.figma, module, console }));
    const message = await module.exports.run();
    return { message, report: module.exports.report };
  } catch (err) {
    // In Figma this would end the run with "NamNam sync failed: ...".
    console.log(`FAIL figma plugin (${label}): the plugin threw: ${err.message}`);
    process.exit(1);
  }
}

// ------------------------------------------------------------------ checks

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const byName = (fake, collectionName, variableName) => {
  const c = fake.collections.find((x) => x.name === collectionName);
  return c && fake.variables.find((v) => v.variableCollectionId === c.id && v.name === variableName);
};
const tokenCount = (key) => DATA.collections[key].tokens.length;
const totalTokens = Object.keys(DATA.collections).reduce((n, k) => n + tokenCount(k), 0);

function checkVariables(fake, label, { multiMode }) {
  const names = fake.collections.map((c) => c.name);
  for (const [key, name] of [['primitive', 'NN · Primitives'], ['base', 'NN · Base'], ['component', 'NN · Components']]) {
    const c = fake.collections.find((x) => x.name === name);
    check(c, `${label}: collection "${name}" missing (have: ${names.join(', ')})`);
    if (c) check(fake.variables.filter((v) => v.variableCollectionId === c.id).length === tokenCount(key), `${label}: ${name} has the wrong number of variables`);
  }
  for (const v of fake.variables) {
    const c = fake.collections.find((x) => x.id === v.variableCollectionId);
    for (const m of c.modes) check(m.modeId in v.valuesByMode, `${label}: ${c.name} / ${v.name} has no value for mode "${m.name}"`);
    if (c.name.startsWith('NN · Primitives')) {
      check(v.hiddenFromPublishing && v.scopes.length === 0, `${label}: primitive ${v.name} should be hidden and unscoped`);
    } else {
      check(/^var\(--nn-[a-z0-9-]+\)$/.test(v.codeSyntax.WEB || ''), `${label}: ${v.name} has no WEB code syntax`);
    }
  }
  if (multiMode) {
    const theme = fake.collections.find((x) => x.name === 'NN · Theme');
    const platform = fake.collections.find((x) => x.name === 'NN · Platform');
    check(theme && theme.modes.map((m) => m.name).join(',') === DATA.themes.join(','), `${label}: theme modes should be ${DATA.themes}`);
    check(platform && platform.modes.map((m) => m.name).join(',') === DATA.platforms.join(','), `${label}: platform modes should be ${DATA.platforms}`);
    check(fake.variables.length === totalTokens, `${label}: expected ${totalTokens} variables, got ${fake.variables.length}`);
  } else {
    for (const mode of [...DATA.themes.map((t) => `NN · Theme · ${t}`), ...DATA.platforms.map((p) => `NN · Platform · ${p}`)]) {
      check(names.includes(mode), `${label}: fallback collection "${mode}" missing`);
    }
  }
  // Aliases keep the token layering: component -> theme -> primitive.
  const buttonBg = byName(fake, 'NN · Components', 'button/primary/bg');
  const accent = byName(fake, multiMode ? 'NN · Theme' : `NN · Theme · ${DATA.defaults.theme}`, 'accent/default');
  const blue = byName(fake, 'NN · Primitives', 'color/blue/600');
  check(buttonBg && accent && Object.values(buttonBg.valuesByMode)[0].id === accent.id, `${label}: button/primary/bg should alias accent/default`);
  check(accent && blue && Object.values(accent.valuesByMode)[0].id === blue.id, `${label}: accent/default should alias color/blue/600`);
}

function checkPage(fake, label, columns) {
  const page = fake.figma.root.children.find((p) => p.name === 'NamNam · Foundations');
  check(page, `${label}: Foundations page missing`);
  if (!page) return;
  check(page.children.length === 1, `${label}: Foundations page should hold exactly one root frame, has ${page.children.length}`);
  const root = page.children[0];
  check(root && root.children.length === columns, `${label}: expected ${columns} theme column(s), got ${root ? root.children.length : 0}`);
  if (columns > 1) {
    const theme = fake.collections.find((x) => x.name === 'NN · Theme');
    const modes = root.children.map((col) => theme.modes.find((m) => m.modeId === col.explicitModes[theme.id]));
    check(modes.every(Boolean) && modes.map((m) => m.name).join(',') === DATA.themes.join(','), `${label}: columns should pin theme modes ${DATA.themes}`);
  }
  let texts = 0;
  const walk = (n) => { if (n.type === 'TEXT') texts += 1; (n.children || []).forEach(walk); };
  walk(page);
  check(texts > 50, `${label}: Foundations page looks empty (${texts} text nodes)`);
}

const full = createFakeFigma();
const first = await runPlugin(full, 'full');
check(first.report.unresolved.length === 0, `full: unresolved aliases: ${first.report.unresolved.join(', ')}`);
check(first.report.bindingFailures === 0, `full: ${first.report.bindingFailures} variable bindings failed`);
check(first.report.created === totalTokens, `full: expected ${totalTokens} created, got ${first.report.created}`);
checkVariables(full, 'full', { multiMode: true });
checkPage(full, 'full', DATA.themes.length);

const second = await runPlugin(full, 'rerun');
check(second.report.created === 0 && second.report.updated === totalTokens, `rerun: expected 0 created / ${totalTokens} updated, got ${second.report.created} / ${second.report.updated}`);
check(full.variables.length === totalTokens, `rerun: variable count changed to ${full.variables.length}`);
checkPage(full, 'rerun', DATA.themes.length);

const limited = createFakeFigma({ modeLimit: 1 });
const fallback = await runPlugin(limited, 'free-plan');
check(fallback.report.fallback.length === 2, `free-plan: expected theme + platform fallbacks, got ${fallback.report.fallback.join(', ')}`);
check(fallback.report.unresolved.length === 0, `free-plan: unresolved aliases: ${fallback.report.unresolved.join(', ')}`);
checkVariables(limited, 'free-plan', { multiMode: false });
checkPage(limited, 'free-plan', 1);

for (const f of failures) console.log(`     ${f}`);
console.log(`${failures.length ? 'FAIL' : 'ok  '} figma plugin: ${totalTokens} variables; full modes, idempotent re-run, free-plan fallback (${failures.length} problem(s))`);
if (!failures.length) console.log(`     ${first.message}`);
process.exit(failures.length ? 1 : 0);
