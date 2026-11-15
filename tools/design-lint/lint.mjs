#!/usr/bin/env node
/**
 * NamNam design lint: static checks for the rules in docs/PLAYBOOK.md §15.1. Zero dependencies.
 *
 *   node tools/design-lint/lint.mjs
 *
 * Checks
 *   raw-value     no hex colors or px/ms/s/em/rem literals in widget CSS (values come from tokens)
 *   token-ref     every var(--nn-*) used in design/ exists in build/web/tokens.css
 *   naming        widget CSS classes use the nn- prefix; no state words in class names
 *   spec          every widget block has a <block>.spec.json that matches its CSS, tokens, factory and specimen
 *   english       docs and code are English; Vietnamese only inside locale catalogs / DS.L({ vi })
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPECIMEN = join(ROOT, 'design', 'specimen');
const COMPONENTS = join(SPECIMEN, 'components');
const PREFIX = 'nn';
const SHARED_CSS = new Set(['base.css']);
const FOREIGN_CLASSES = new Set(['material-symbols-rounded']);
const STATE_WORDS = ['hover', 'pressed', 'active', 'focused', 'focus', 'disabled', 'loading', 'pending', 'selected', 'checked', 'on', 'off', 'error', 'offline'];
const VIETNAMESE = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

const problems = [];
const rel = (p) => relative(ROOT, p).replaceAll('\\', '/');
const report = (rule, file, message, line) => problems.push({ rule, file: rel(file), line, message });
const read = (p) => readFileSync(p, 'utf8');
const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const listFiles = (dir, ext) => readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => join(dir, f));
const baseName = (p) => p.split(/[\\/]/).pop();

const componentCss = listFiles(COMPONENTS, '.css');
const specFiles = listFiles(COMPONENTS, '.spec.json');

// ---------------------------------------------------------------- raw-value
for (const file of componentCss) {
  const css = stripCssComments(read(file));
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) report('raw-value', file, `hex color ${m[0]}: use a color token`, lineOf(css, m.index));
  // 1em is allowed as the unit multiplier in calc(token * 1em); percentages and unitless numbers are layout math.
  for (const m of css.matchAll(/(?<![\w-])(\d*\.?\d+)(px|ms|s|rem|em)\b/g)) {
    if (m[2] === 'em' && m[1] === '1') continue;
    report('raw-value', file, `literal ${m[0]}: use a token`, lineOf(css, m.index));
  }
}

// ---------------------------------------------------------------- token-ref
const tokensCssPath = join(ROOT, 'build', 'web', 'tokens.css');
let definedTokens = null;
if (!existsSync(tokensCssPath)) {
  report('token-ref', tokensCssPath, 'missing: run "npm run tokens" first');
} else {
  definedTokens = new Set([...read(tokensCssPath).matchAll(/(--nn-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  const sources = [...componentCss, ...listFiles(SPECIMEN, '.css'), ...listFiles(SPECIMEN, '.html'), ...listFiles(SPECIMEN, '.js'), ...listFiles(COMPONENTS, '.js')];
  for (const file of sources) {
    const text = file.endsWith('.css') ? stripCssComments(read(file)) : read(file);
    for (const m of text.matchAll(/var\((--nn-[a-z0-9-]+)/g)) {
      if (!definedTokens.has(m[1])) report('token-ref', file, `unknown token ${m[1]}`, lineOf(text, m.index));
    }
  }
}

// ---------------------------------------------------------------- naming
const blocksInCss = new Map(); // block -> { file, elements:Set, modifiers:Set }
for (const file of componentCss) {
  const css = stripCssComments(read(file));
  for (const m of css.matchAll(/\.(?=[a-zA-Z_])([\w-]+)/g)) {
    const cls = m[1];
    if (FOREIGN_CLASSES.has(cls)) continue;
    const line = lineOf(css, m.index);
    if (!cls.startsWith(`${PREFIX}-`)) {
      report('naming', file, `class .${cls} lacks the ${PREFIX}- prefix`, line);
      continue;
    }
    const parsed = /^nn-([a-z0-9]+(?:-[a-z0-9]+)*?)(?:__([a-z0-9-]+))?(?:--([a-z0-9-]+))?$/.exec(cls);
    if (!parsed) {
      report('naming', file, `class .${cls} is not BEM (nn-block[__element][--modifier])`, line);
      continue;
    }
    const [, block, element, modifier] = parsed;
    if (modifier && STATE_WORDS.includes(modifier)) {
      report('naming', file, `.${cls}: "${modifier}" is a state; use :disabled / aria-* / data-* instead of a class`, line);
    }
    if (SHARED_CSS.has(baseName(file))) continue;
    const entry = blocksInCss.get(block) ?? { file, elements: new Set(), modifiers: new Set() };
    if (element) entry.elements.add(element);
    if (modifier && !element) entry.modifiers.add(modifier);
    blocksInCss.set(block, entry);
  }
}

// ---------------------------------------------------------------- spec
const REQUIRED = ['name', 'block', 'layer', 'purpose', 'css', 'specimen', 'factory', 'elements', 'modifiers', 'defaults', 'states', 'tokens', 'a11y'];
const widgetsJs = read(join(COMPONENTS, 'widgets.js'));
const specimenJs = read(join(SPECIMEN, 'specimen.js'));
const specs = new Map();
for (const file of specFiles) {
  let spec;
  try {
    spec = JSON.parse(read(file));
  } catch (err) {
    report('spec', file, `invalid JSON: ${err.message}`);
    continue;
  }
  const missing = REQUIRED.filter((k) => !(k in spec));
  if (missing.length) {
    report('spec', file, `missing fields: ${missing.join(', ')}`);
    continue;
  }
  if (`${spec.block}.spec.json` !== baseName(file)) report('spec', file, `file name must be ${spec.block}.spec.json`);
  specs.set(spec.block, spec);

  const cssPath = join(COMPONENTS, spec.css);
  if (!existsSync(cssPath)) report('spec', file, `css file ${spec.css} not found`);
  if (!existsSync(join(SPECIMEN, spec.specimen))) report('spec', file, `specimen ${spec.specimen} not found`);
  else if (!specimenJs.includes(`'${spec.specimen}'`)) report('spec', file, `specimen ${spec.specimen} is not in PAGES (specimen.js)`);
  if (!new RegExp(`function ${spec.factory}\\(`).test(widgetsJs)) report('spec', file, `factory ${spec.factory}() not found in widgets.js`);

  const inCss = blocksInCss.get(spec.block);
  if (!inCss) {
    report('spec', file, `block .nn-${spec.block} has no rules in ${spec.css}`);
    continue;
  }
  const specElements = new Set(Object.keys(spec.elements));
  for (const e of specElements) if (!inCss.elements.has(e)) report('spec', file, `element "${e}" is in the spec but .nn-${spec.block}__${e} is not styled`);
  for (const e of inCss.elements) if (!specElements.has(e)) report('spec', file, `.nn-${spec.block}__${e} is styled but missing from the spec`);

  const defaults = new Set(Object.values(spec.defaults));
  const specModifiers = new Set(Object.values(spec.modifiers).flat());
  for (const mod of specModifiers) {
    if (!defaults.has(mod) && !inCss.modifiers.has(mod)) report('spec', file, `modifier "${mod}" is in the spec but .nn-${spec.block}--${mod} is not styled`);
  }
  for (const mod of inCss.modifiers) if (!specModifiers.has(mod)) report('spec', file, `.nn-${spec.block}--${mod} is styled but missing from the spec`);

  if (existsSync(cssPath)) {
    const css = stripCssComments(read(cssPath));
    for (const [state, hook] of Object.entries(spec.states)) {
      if (!css.includes(hook)) report('spec', file, `state "${state}" expects ${hook} in ${spec.css}`);
    }
  }
  if (definedTokens) {
    for (const prefix of spec.tokens) {
      if (![...definedTokens].some((name) => name.startsWith(`--nn-${prefix}-`))) report('spec', file, `no tokens found for prefix "${prefix}" (tokens/component/)`);
    }
  }
  for (const dep of spec.dependsOn ?? []) if (!existsSync(join(COMPONENTS, `${dep}.spec.json`))) report('spec', file, `dependsOn "${dep}" has no spec`);
}
for (const [block, entry] of blocksInCss) {
  if (!specs.has(block)) report('spec', entry.file, `block .nn-${block} has no ${block}.spec.json`);
}
// every component token group must be owned by a spec
const componentDir = join(ROOT, 'tokens', 'component');
const owned = new Set([...specs.values()].flatMap((s) => s.tokens));
for (const file of listFiles(componentDir, '.json')) {
  for (const group of Object.keys(JSON.parse(read(file)).component ?? {})) {
    if (!owned.has(group)) report('spec', file, `token group component.${group} is not claimed by any spec ("tokens")`);
  }
}

// ---------------------------------------------------------------- english
const englishTargets = [
  join(ROOT, 'README.md'), join(ROOT, 'AGENTS.md'), join(ROOT, 'docs', 'PLAYBOOK.md'),
  ...listFiles(SPECIMEN, '.html'), ...listFiles(SPECIMEN, '.js'), ...listFiles(SPECIMEN, '.css'),
  ...componentCss, ...listFiles(COMPONENTS, '.js'), ...specFiles,
  ...listFiles(join(ROOT, 'tokens'), '.json'), ...listFiles(componentDir, '.json'),
];
for (const file of englishTargets) {
  if (!existsSync(file)) continue;
  let inViCatalog = false;
  read(file).split('\n').forEach((text, i) => {
    if (/^\s*vi:\s*\{\s*$/.test(text)) inViCatalog = true; // locale catalog block in widgets.js
    else if (inViCatalog && /^\s*\},?\s*$/.test(text)) inViCatalog = false;
    if (inViCatalog || !VIETNAMESE.test(text)) return;
    // allowed: sample copy passed as the vi entry of DS.L({ en, vi })
    const withoutViCopy = text.replace(/vi:\s*'(?:[^'\\]|\\.)*'/g, '');
    if (VIETNAMESE.test(withoutViCopy)) report('english', file, 'Vietnamese text outside a locale catalog / DS.L({ vi })', i + 1);
  });
}

// ---------------------------------------------------------------- output
const RULES = ['raw-value', 'token-ref', 'naming', 'spec', 'english'];
for (const rule of RULES) {
  const found = problems.filter((p) => p.rule === rule);
  console.log(`${found.length ? 'FAIL' : 'ok  '} ${rule}${found.length ? `: ${found.length} problem(s)` : ''}`);
  for (const p of found) console.log(`     ${p.file}${p.line ? `:${p.line}` : ''}  ${p.message}`);
}
console.log(`${problems.length ? 'FAIL' : 'ok  '} design lint: ${specs.size} widget specs, ${componentCss.length} CSS files, ${problems.length} problem(s)`);
process.exit(problems.length ? 1 : 0);
