#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformTalkHtml } from './lib/inline-talk-html.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];

if (!slug || slug.startsWith('-')) {
  console.error('Usage: npm run build:talk -- <slug>');
  console.error('Example: npm run build:talk -- agent-hitl-vs-yolo');
  process.exit(1);
}

const staticRoot = path.join(root, '.vercel/output/static');
const slidesHtmlPath = path.join(staticRoot, 'talks', slug, 'slides', 'index.html');
const outDir = path.join(root, 'dist-talk');
const outFile = path.join(outDir, `${slug}.html`);

console.error(`Building site (astro build) for talk "${slug}"...`);
const build = spawnSync('npx', ['astro', 'build'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (build.status !== 0) {
  console.error('astro build failed');
  process.exit(build.status ?? 1);
}

try {
  await fs.access(slidesHtmlPath);
} catch {
  console.error(`Slides not found for slug "${slug}": ${slidesHtmlPath}`);
  console.error('Check that the talk exists, is not draft, and template built slides.');
  process.exit(1);
}

const html = await fs.readFile(slidesHtmlPath, 'utf8');
const faviconBuf = await fs.readFile(path.join(root, 'public/favicon.png'));
const faviconDataUrl = `data:image/png;base64,${faviconBuf.toString('base64')}`;

let standalone;
try {
  standalone = await transformTalkHtml(html, {
    faviconDataUrl,
    credit: '蘇里',
    staticRoot,
  });
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(outFile, standalone, 'utf8');
console.log(`Wrote ${path.relative(root, outFile)}`);
