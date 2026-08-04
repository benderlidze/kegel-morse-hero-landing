import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'blog', 'content');
const errors = [];
const files = (await readdir(contentDir)).filter((file) => /^\d{2}-.*\.md$/.test(file)).sort();

const resolveInternal = (href) => {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return path.join(root, 'index.html');
  const relative = clean.replace(/^\//, '');
  if (path.extname(relative)) return path.join(root, relative);
  return path.join(root, relative, 'index.html');
};

for (const file of files) {
  const markdown = await readFile(path.join(contentDir, file), 'utf8');
  const slug = markdown.match(/^slug:\s*["']?\/blog\/([^"'\r\n]+)/m)?.[1]?.replace(/\/$/, '');
  if (!slug) { errors.push(`${file}: missing slug`); continue; }
  const outputPath = path.join(root, 'blog', slug, 'index.html');
  let html;
  try { html = await readFile(outputPath, 'utf8'); } catch { errors.push(`${file}: missing generated page`); continue; }

  const check = (condition, message) => { if (!condition) errors.push(`${file}: ${message}`); };
  check((html.match(/<h1\b/g) || []).length === 1, 'must contain exactly one H1');
  check(/<meta name="description" content="[^"]+">/.test(html), 'missing meta description');
  check(new RegExp(`<link rel="canonical" href="https://kegelmorsehero\\.com/blog/${slug}/">`).test(html), 'canonical mismatch');
  check(/<time datetime="2026-08-04">/.test(html), 'missing visible reviewed date');
  check(/rel="author"/.test(html), 'missing author link');
  check(/id="sources(?:-and-listings)?"/.test(html), 'missing sources heading');
  check(/not medical advice/i.test(html), 'missing visible medical disclaimer');
  const articleBody = html.match(/<article class="article-body">([\s\S]*?)<\/article>/)?.[1] || '';
  check((markdown.match(/^#{2,3}\s+/gm) || []).length === (articleBody.match(/<h[23]\b/g) || []).length, 'heading count changed during rendering');
  check((markdown.match(/^\|.+\|\r?$/gm) || []).length === 0 || html.includes('<table>'), 'table was not rendered');
  check(!html.includes('nofollow'), 'editorial links must not use nofollow');
  check(!html.includes('[['), 'raw malformed Markdown remains');

  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  check(scripts.length === 1, 'expected one JSON-LD block');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script[1]);
      const types = data['@graph']?.map((item) => item['@type']) || [];
      check(types.includes('Article'), 'JSON-LD missing Article');
      check(types.includes('BreadcrumbList'), 'JSON-LD missing BreadcrumbList');
    } catch { errors.push(`${file}: invalid JSON-LD`); }
  }

  for (const match of html.matchAll(/href="(\/[^"#]*)"/g)) {
    try { await access(resolveInternal(match[1])); } catch { errors.push(`${file}: unresolved internal link ${match[1]}`); }
  }
}

const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
for (const file of files) {
  const markdown = await readFile(path.join(contentDir, file), 'utf8');
  const canonical = markdown.match(/^canonical:\s*["']?([^"'\r\n]+)/m)?.[1];
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`${file}: absent from sitemap`);
}

const pe = await readFile(path.join(root, 'blog', 'do-kegels-help-premature-ejaculation', 'index.html'), 'utf8');
if (pe.includes('apps.apple.com') || pe.includes('article-cta')) errors.push('Premature-ejaculation article contains injected app promotion');

if (files.length !== 10) errors.push(`expected 10 Markdown files, found ${files.length}`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Validated 10 article pages: metadata, headings, sources, disclaimers, internal links, sitemap, and JSON-LD.');
}
