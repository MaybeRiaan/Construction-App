#!/usr/bin/env node
/**
 * Builds the web version of Playdar into one self-contained HTML page that
 * can be published as a claude.ai artifact (or opened from disk).
 *
 *   npm run build:artifact            # export + inline
 *   npm run build:artifact -- --skip-export   # inline an existing dist/web
 *
 * Output: dist/artifact/playdar.html
 *
 * Artifact pages are wrapped in a <!doctype html><head><body> skeleton when
 * published, so this file holds only the page content: title, styles, the
 * root element and the inlined bundle.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webDir = path.join(root, 'dist', 'web');
const outDir = path.join(root, 'dist', 'artifact');
const outFile = path.join(outDir, 'playdar.html');

const FONTS =
  'https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil:wght@700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400;500;600;700;800&display=swap';

if (!process.argv.includes('--skip-export')) {
  execSync(`npx expo export --platform web --output-dir ${JSON.stringify(webDir)}`, { cwd: root, stdio: 'inherit' });
}

const html = fs.readFileSync(path.join(webDir, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="\/?([^"]+\.js)"[^>]*><\/script>/g)].map((m) => m[1]);
if (!scripts.length) throw new Error('No bundle script found in dist/web/index.html');

let js = scripts.map((s) => fs.readFileSync(path.join(webDir, s), 'utf8')).join('\n;\n');
// Keep the HTML parser from ending or re-entering the script element early.
js = js.replace(/<\/script/gi, '\\x3C/script').replace(/<script/gi, '\\x3Cscript').replace(/<!--/g, '\\x3C!--');

const assetRefs = js.match(/["'`]\/assets\/[^"'`]+["'`]/g) ?? [];
if (assetRefs.length) {
  console.warn(`Note: bundle references ${assetRefs.length} static asset(s) that are not inlined:`, [...new Set(assetRefs)].slice(0, 5));
}

const page = `<title>Playdar</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>
/* Layout: one-screen app; on wide screens the app draws its own phone frame. */
:root { --page: #DCE1E8; --ink: #101216; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --page: #141619; --ink: #F3F4F6; color-scheme: dark; } }
:root[data-theme="dark"] { --page: #141619; --ink: #F3F4F6; color-scheme: dark; }
html, body { height: 100%; }
body { margin: 0; background: var(--page); color: var(--ink); overflow: hidden; overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
#root { display: flex; height: 100%; flex: 1; }
#boot { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; font: 600 15px Figtree, system-ui, sans-serif; color: var(--ink); opacity: 0.6; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
</style>
<div id="root"><div id="boot">Loading Playdar…</div></div>
<script>${js}</script>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, page);
console.log(`Wrote ${path.relative(root, outFile)} (${(page.length / 1024 / 1024).toFixed(2)} MB)`);
