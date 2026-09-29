import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content', 'articles');
const articlesDir = path.join(root, 'articles');
const site = 'https://kegelmorsehero.com';
const appStore = 'https://apps.apple.com/us/app/kegel-morse-hero-pelvic-floor/id6761460873';
const appleGlyph = '<svg viewBox="0 0 24 24"><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.09-.46 1.6-1.534 3.16-.918 1.35-1.866 2.7-3.36 2.72-1.466.03-1.937-.87-3.61-.87-1.673 0-2.197.84-3.583.9-1.444.05-2.55-1.46-3.475-2.81-1.89-2.74-3.34-7.74-1.4-11.12.964-1.66 2.687-2.71 4.555-2.74 1.435-.03 2.79.97 3.671.97.88 0 2.539-1.2 4.275-1.02.726.03 2.756.295 4.057 2.225-.105.066-2.422 1.418-2.395 4.236.03 3.378 2.965 4.5 3.001 4.51z"/></svg>';
const storeButton = (variant = '') => `<a class="store-btn${variant ? ` ${variant}` : ''}" href="${appStore}" target="_blank" rel="noopener">${appleGlyph}<span class="store-label"><span class="store-eyebrow">Download on the</span><span class="store-name">App Store</span></span></a>`;

const esc = (value = '') => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (value = '') => value.replace(/[*_`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const idFor = (value) => plain(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Category system: id -> display name + accent color used for cover art and chips.
const CATEGORIES = {
  technique: { label: 'Technique', accentFrom: '#31d7e7', accentTo: '#1b8fa1' },
  habits: { label: 'Habits & Routine', accentFrom: '#a78bfa', accentTo: '#6d4fd6' },
  science: { label: 'Science & Safety', accentFrom: '#6ee7a8', accentTo: '#1f9d5f' },
  apps: { label: 'Apps & Gear', accentFrom: '#f7b955', accentTo: '#d97a2c' }
};

function parseFrontMatter(source) {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Missing front matter');
  const data = {};
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!field) continue;
    let value = field[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    data[field[1]] = value;
  }
  return { data, body: match[2].trim() };
}

function inline(source) {
  const tokens = [];
  let value = source.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    let url = href;
    if (/apps\.apple\.com\/.+id6761460873/.test(url)) url = appStore;
    if (url.startsWith(site)) url = url.slice(site.length) || '/';
    const external = /^https?:\/\//.test(url);
    const html = `<a href="${esc(url)}"${external ? ' target="_blank" rel="noopener"' : ''}>${esc(label)}</a>`;
    tokens.push(html);
    return `\u0000${tokens.length - 1}\u0000`;
  });
  value = esc(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
  return value;
}

function markdown(body) {
  const lines = body.split('\n');
  const output = [];
  const headings = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ');
    const isCta = /Kegel Morse Hero/.test(text) && /App Store|kegelmorsehero\.com/.test(text);
    output.push(`<p${isCta ? ' class="article-cta"' : ''}>${inline(text)}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    output.push(`<${list.type}>${list.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${list.type}>`);
    list = null;
  };
  const flush = () => { flushParagraph(); flushList(); };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trimEnd();
    if (!line.trim()) { flush(); continue; }
    if (/^#\s+/.test(line)) { flush(); continue; }
    const heading = line.match(/^(##|###)\s+(.+)$/);
    if (heading) {
      flush();
      const level = heading[1].length;
      const text = heading[2];
      const id = idFor(text);
      if (level === 2) headings.push({ text: plain(text), id });
      output.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      continue;
    }
    if (line.startsWith('> ')) {
      flush();
      output.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`);
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph();
      const type = numbered ? 'ol' : 'ul';
      if (list && list.type !== type) flushList();
      if (!list) list = { type, items: [] };
      list.items.push((bullet || numbered)[1]);
      continue;
    }
    if (line.startsWith('|') && lines[i + 1]?.trim().match(/^\|?\s*:?-{3,}/)) {
      flush();
      const rows = [];
      const splitRow = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
      const header = splitRow(line);
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(splitRow(lines[i])); i += 1; }
      i -= 1;
      output.push(`<div class="table-wrap" role="region" aria-label="Scrollable data table" tabindex="0"><table><thead><tr>${header.map((cell) => `<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    paragraph.push(line.trim());
  }
  flush();
  return { html: output.join('\n'), headings };
}

const header = (current = 'articles', showDownload = true) => `
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><div class="header-inner">
  <a class="brand" href="/"><img src="/assets/logo-96.png" width="96" height="96" alt="Kegel Morse Hero logo"><span>Kegel Morse Hero</span></a>
  <nav class="site-nav" aria-label="Primary navigation">
    <a href="/"${current === 'home' ? ' aria-current="page"' : ''}>Home</a><a href="/articles/"${current === 'articles' ? ' aria-current="page"' : ''}>Articles</a><a href="/features.html"${current === 'features' ? ' aria-current="page"' : ''}>Features</a><a href="/how-to-use.html"${current === 'how-to-use' ? ' aria-current="page"' : ''}>How to use</a><a href="/faq.html"${current === 'faq' ? ' aria-current="page"' : ''}>FAQ</a><a href="/privacy.html"${current === 'privacy' ? ' aria-current="page"' : ''}>Privacy</a>
    ${showDownload ? `<a class="download-link" href="${appStore}" target="_blank" rel="noopener">Download</a>` : ''}
  </nav>
</div></header>`;

const footer = () => `
<footer class="site-footer"><div class="footer-inner">
  <div><a class="brand" href="/"><img src="/assets/logo-96.png" width="96" height="96" loading="lazy" alt="Kegel Morse Hero logo"><span>Kegel Morse Hero</span></a><p class="copyright">© 2026 Kegel Morse Hero</p></div>
  <nav class="footer-links" aria-label="Footer navigation"><a href="/articles/">Articles</a><a href="/features.html">Features</a><a href="/how-to-use.html">How to use</a><a href="/faq.html">FAQ</a><a href="/privacy.html">Privacy</a><a href="/about/">About</a><a href="/editorial-policy/">Editorial policy</a><a href="/medical-disclaimer/">Medical disclaimer</a></nav>
</div></footer>`;

function documentHead({ title, description, canonical, type = 'website', modified, jsonLd = '', image, extraMeta = '' }) {
  const ogImage = image || `${site}/assets/og-image.png`;
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta name="author" content="Kegel Morse Hero"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="theme-color" content="#070a0b">${extraMeta}<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="/assets/favicon-48.png" type="image/png" sizes="48x48"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="Kegel Morse Hero"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${ogImage}"><meta property="og:image:alt" content="Kegel Morse Hero pelvic floor training app">${modified ? `<meta property="article:modified_time" content="${modified}">` : ''}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${ogImage}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/blog/blog.css">
${jsonLd}</head>`;
}

// Deterministic Morse pattern used as cover art per article, so covers differ but are stable across rebuilds.
function morseCoverFor(text) {
  const table = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..' };
  const words = plain(text).toUpperCase().match(/[A-Z]+/g) || [];
  const word = words.find((w) => w.length >= 3) || words[0] || 'SIGNAL';
  return word.split('').map((letter) => table[letter] || '').filter(Boolean).slice(0, 5).join('  ');
}

// Generates an inline SVG data URI used as a placeholder cover, colored by category, with a
// morse pattern rendered across it. Swap this out later for real photography per article.
function coverSvg({ categoryId, title }) {
  const cat = CATEGORIES[categoryId] || CATEGORIES.technique;
  const pattern = morseCoverFor(title);
  const dashes = pattern.split('').map((symbol, i) => {
    const x = 24 + i * 18;
    if (symbol === '-') return `<rect x="${x}" y="58" width="13" height="6" rx="3" fill="#fff" opacity=".85"/>`;
    if (symbol === '.') return `<circle cx="${x + 3}" cy="61" r="3.4" fill="#fff" opacity=".85"/>`;
    return '';
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" role="img" aria-label="${esc(cat.label)} guide illustration">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${cat.accentFrom}"/><stop offset="1" stop-color="${cat.accentTo}"/></linearGradient></defs>
<rect width="400" height="220" fill="#0c1416"/>
<rect width="400" height="220" fill="url(#g)" opacity=".22"/>
<circle cx="340" cy="40" r="120" fill="url(#g)" opacity=".35"/>
<circle cx="30" cy="210" r="90" fill="url(#g)" opacity=".25"/>
<g transform="translate(0,30)">${dashes}</g>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Real photo/illustration covers live in /assets/articles/<slug>.webp. When present, use that
// instead of the generated SVG placeholder — this is how the site swaps in real photography.
function coverFor(article) {
  return article.cover_image ? `/assets/articles/${article.cover_image}` : coverSvg({ categoryId: article.categoryId, title: article.h1 });
}

await rm(articlesDir, { recursive: true, force: true });
await mkdir(articlesDir, { recursive: true });

const files = (await readdir(contentDir)).filter((file) => /^\d{2}-.*\.md$/.test(file)).sort();
const articles = [];
for (const file of files) {
  const source = await readFile(path.join(contentDir, file), 'utf8');
  const parsed = parseFrontMatter(source);
  const slug = parsed.data.slug.replace(/^\/articles\//, '').replace(/\/$/, '');
  const h1 = parsed.body.match(/^#\s+(.+)$/m)?.[1] || parsed.data.title;
  const categoryId = CATEGORIES[parsed.data.category_slug] ? parsed.data.category_slug : 'technique';
  articles.push({ ...parsed.data, slug, h1, body: parsed.body, file, categoryId });
}

const categoryIds = [...new Set(articles.map((a) => a.categoryId))];

for (let index = 0; index < articles.length; index += 1) {
  const article = articles[index];
  const rendered = markdown(article.body);
  const authorType = article.author === 'Sergei Prostokishyn' ? 'Person' : 'Organization';
  const cover = coverFor(article);
  const ogImage = article.cover_image ? `${site}${cover}` : `${site}/assets/og-image.png`;
  const categoryLabel = CATEGORIES[article.categoryId].label;
  const structured = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Article', headline: article.h1, description: article.meta_description, mainEntityOfPage: article.canonical, url: article.canonical, dateModified: article.last_reviewed, author: { '@type': authorType, name: article.author, url: `${site}/about/` }, publisher: { '@type': 'Organization', name: 'Kegel Morse Hero', url: `${site}/`, logo: { '@type': 'ImageObject', url: `${site}/assets/logo.png` } }, image: ogImage, articleSection: categoryLabel, inLanguage: 'en' },
      { '@type': 'BreadcrumbList', itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Home', item: `${site}/` }, { '@type': 'ListItem', position: 2, name: 'Articles', item: `${site}/articles/` }, { '@type': 'ListItem', position: 3, name: categoryLabel, item: `${site}/articles/?category=${article.categoryId}` }, { '@type': 'ListItem', position: 4, name: article.h1, item: article.canonical } ] }
    ]
  };
  const previous = articles[(index - 1 + articles.length) % articles.length];
  const next = articles[(index + 1) % articles.length];
  const toc = rendered.headings.slice(0, 9).map((heading) => `<li><a href="#${heading.id}">${esc(heading.text)}</a></li>`).join('');
  const jsonLd = `<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script>`;
  const showAppPromo = !article.file.startsWith('10-');
  const articleCta = showAppPromo && !rendered.html.includes('class="article-cta"')
    ? `<section class="cta-banner article-end-cta"><div class="cta-banner-inner"><h2>Train with Kegel Morse Hero</h2><p>Turn this into a guided session: short squeezes and long holds become Morse code dots and dashes, with built-in rest so you never lose count.</p><div class="cta-row">${storeButton('on-cyan')}</div></div></section>`
    : '';
  const html = `${documentHead({ title: article.meta_title, description: article.meta_description, canonical: article.canonical, type: 'article', modified: article.last_reviewed, jsonLd, image: article.cover_image ? ogImage : undefined })}<body>${header('articles', showAppPromo)}
<main id="main"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/articles/">Articles</a></li><li><a href="/articles/#${article.categoryId}">${esc(categoryLabel)}</a></li><li aria-current="page">${esc(article.h1)}</li></ol></nav>
<header class="article-hero"><div class="article-hero-inner"><p class="eyebrow">${esc(categoryLabel)}</p><h1>${esc(article.h1)}</h1><div class="article-meta"><span>Reviewed <time datetime="${article.last_reviewed}">${new Date(`${article.last_reviewed}T00:00:00Z`).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})}</time></span><span>By <a href="/about/" rel="author">${esc(article.author)}</a></span><span>${article.file.startsWith('07-') ? 'Comparison guide' : 'Evidence-aware guide'}</span></div></div><img class="article-cover" src="${cover}" width="400" height="220" alt="" loading="eager"></header>
<div class="article-layout"><article class="article-body">${rendered.html}</article><aside class="toc" aria-label="On this page"><p>On this page</p><ol>${toc}</ol></aside></div>
${articleCta}
<section class="related" aria-labelledby="related-title"><h2 class="section-heading" id="related-title">Keep reading</h2><div class="related-grid"><a href="/articles/${previous.slug}/"><span>Previous guide</span><strong>${esc(previous.h1)}</strong></a><a href="/articles/${next.slug}/"><span>Next guide</span><strong>${esc(next.h1)}</strong></a></div></section>
<div class="disclaimer-shell"><p class="medical-disclaimer"><strong>Medical disclaimer:</strong> This article is for education only and is not medical advice, diagnosis, or treatment. Stop if exercise causes pain or worsening symptoms, and consult a qualified healthcare professional for personal guidance. <a href="/medical-disclaimer/">Read the full disclaimer.</a></p></div></main>${footer()}</body></html>`;
  const outputDir = path.join(articlesDir, article.slug);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
}

// Article hub: category chips + grid of cards with cover art, filterable client-side with no JS
// dependency needed for indexing (all cards are always in the DOM; filtering is progressive).
const cardHtml = (article, index) => {
  const cover = coverFor(article);
  const categoryLabel = CATEGORIES[article.categoryId].label;
  return `<a class="article-card" data-category="${article.categoryId}" href="/articles/${article.slug}/"><span class="card-cover"><img src="${cover}" width="400" height="220" alt="" loading="lazy"></span><span class="card-body"><span class="card-number">${esc(categoryLabel)}</span><h2>${esc(article.h1)}</h2><p>${esc(article.meta_description)}</p><span class="card-meta">Reviewed ${new Date(`${article.last_reviewed}T00:00:00Z`).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'})}</span></span></a>`;
};
const cards = articles.map(cardHtml).join('\n');
const chips = [`<button class="chip is-active" data-filter="all" type="button">All <span>${articles.length}</span></button>`,
  ...categoryIds.map((id) => `<button class="chip" data-filter="${id}" type="button" id="${id}">${esc(CATEGORIES[id].label)} <span>${articles.filter((a) => a.categoryId === id).length}</span></button>`)
].join('');
const indexDescription = 'Evidence-aware guides to male Kegel exercises, pelvic floor technique, training schedules, apps, and habit building.';
const collectionLd = `<script type="application/ld+json">${JSON.stringify({ '@context':'https://schema.org','@type':'CollectionPage',name:'Pelvic Floor Training Guides',description:indexDescription,url:`${site}/articles/`,hasPart:articles.map((a)=>({'@type':'Article',headline:a.h1,url:a.canonical})) }).replace(/</g,'\\u003c')}</script>`;
const filterScript = `<script>(function(){var chips=document.querySelectorAll('.chip'),cards=document.querySelectorAll('.article-card');function apply(f){chips.forEach(function(c){c.classList.toggle('is-active',c.dataset.filter===f)});cards.forEach(function(c){c.hidden=f!=='all'&&c.dataset.category!==f})}chips.forEach(function(c){c.addEventListener('click',function(){apply(c.dataset.filter);history.replaceState(null,'',c.dataset.filter==='all'?location.pathname:'#'+c.dataset.filter)})});var initial=(location.hash||'').replace('#','');apply(initial&&document.getElementById(initial)?initial:'all')})();</script>`;
const indexHtml = `${documentHead({ title: 'Male Pelvic Floor Guides | Kegel Morse Hero', description: indexDescription, canonical: `${site}/articles/`, jsonLd: collectionLd })}<body>${header('articles')}<main id="main"><section class="blog-hero"><div class="hero-inner"><p class="eyebrow">The signal journal</p><h1>Clear guidance for a stronger routine.</h1><p class="lede">Practical, evidence-aware articles about male pelvic floor training—without inflated promises or awkward jargon.</p><div class="signal" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div></section><section class="blog-shell" aria-labelledby="guides"><h2 class="section-heading" id="guides">All guides</h2><div class="chip-row" role="tablist" aria-label="Filter articles by category">${chips}</div><div class="article-grid">${cards}</div></section></main>${footer()}${filterScript}</body></html>`;
await writeFile(path.join(articlesDir, 'index.html'), indexHtml, 'utf8');

// Legacy /blog/* pages 301-redirect (via meta refresh + canonical, since this is a static host)
// to their new /articles/* home, and /blog/ itself redirects to the new hub.
const redirectPage = (target) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${target}"><link rel="canonical" href="${site}${target}"><meta name="robots" content="noindex,follow"><title>Redirecting…</title></head><body>This page moved to <a href="${target}">${site}${target}</a>.</body></html>`;
await rm(path.join(root, 'blog'), { recursive: true, force: true }).catch(() => {});
await mkdir(path.join(root, 'blog'), { recursive: true });
await writeFile(path.join(root, 'blog', 'index.html'), redirectPage('/articles/'), 'utf8');
for (const article of articles) {
  const outputDir = path.join(root, 'blog', article.slug);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), redirectPage(`/articles/${article.slug}/`), 'utf8');
}
// Re-seed the content directory pointer so future builds keep reading blog/content as source.
await mkdir(contentDir, { recursive: true });

// --- Home page ---
const homeJsonLd = [
  { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Kegel Morse Hero', alternateName: 'Kegel Morse Hero: Pelvic Floor', operatingSystem: 'iOS 17.2 or later', applicationCategory: 'HealthApplication', applicationSubCategory: 'Fitness', datePublished: '2026-04-15', author: { '@type': 'Person', name: 'Sergei Prostokishyn' }, description: 'Kegel Morse Hero is an iOS pelvic floor training app that uses Morse code rhythms for squeeze and relax timing. Includes visual guidance, haptic feedback, custom tracks, and local-only data storage.', url: `${site}/`, downloadUrl: appStore, installUrl: appStore, sameAs: [appStore], isAccessibleForFree: true, featureList: ['Visual ring animation for squeeze and relax timing', 'Haptic feedback during exercises', 'Built-in and custom Morse code tracks', 'Zen mode for focused sessions', 'Session history and calendar progress view', 'Signal reminders', 'Google Drive backup and CSV export', '1x, 2x, 3x speed settings', 'Offline sessions with no internet required'], offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' }, publisher: { '@type': 'Organization', name: 'Kegel Morse Hero', url: `${site}/` }, screenshot: [`${site}/assets/screenshot-hero.png`, `${site}/assets/screenshot-main.png`, `${site}/assets/screenshot-features.png`], image: `${site}/assets/logo.png`, inLanguage: 'en' },
  { '@context': 'https://schema.org', '@type': 'Organization', name: 'Kegel Morse Hero', url: `${site}/`, logo: `${site}/assets/logo.png`, sameAs: [appStore] },
  { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Kegel Morse Hero', url: `${site}/` },
  { '@context': 'https://schema.org', '@type': 'VideoObject', name: 'Kegel Morse Hero app demo', description: 'Demo of the Kegel Morse Hero iOS app showing Morse code guided pelvic floor training with visual ring animation and haptic feedback.', thumbnailUrl: 'https://i.ytimg.com/vi/VtgtSG_DCYI/hqdefault.jpg', uploadDate: '2026-04-20T03:45:21-07:00', contentUrl: 'https://www.youtube.com/watch?v=VtgtSG_DCYI', embedUrl: 'https://www.youtube.com/embed/VtgtSG_DCYI', publisher: { '@type': 'Organization', name: 'Kegel Morse Hero', logo: { '@type': 'ImageObject', url: `${site}/assets/logo.png` } } }
].map((obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`).join('');

const homeFeatures = [
  ['Morse Code Guided Sessions', 'Kegel Morse Hero uses Morse patterns to time squeeze and relax phases for consistent training.'],
  ['Visual + Haptic Timing', 'A ring animation and haptic feedback guide each rep, including discreet eyes-free sessions.'],
  ['100% Private by Default', 'No account required, no ads, no tracking, and local data storage on your device.'],
  ['Built-in + Custom Tracks', 'Use ready-made tracks like SOS and HERO, or create your own Morse patterns.'],
  ['Progress Tracking', 'Session history and calendar view help you track consistency over time.'],
  ['Beginner Friendly', 'Choose 1x, 2x, or 3x speed and train at your own pace, then scale intensity gradually.']
];

const homeHtml = `${documentHead({
  title: 'Kegel App & Pelvic Floor Timer | Kegel Morse Hero',
  description: 'Build your Kegel routine with a private iPhone app: guided timing, haptic cues, reminders, and session history. Free download with in-app purchases.',
  canonical: `${site}/`,
  extraMeta: '<meta name="apple-itunes-app" content="app-id=6761460873">',
  jsonLd: homeJsonLd
})}<body>${header('home')}
<main id="main">
<section class="home-hero"><div class="home-hero-inner">
  <div class="home-hero-copy"><p class="eyebrow">Pelvic floor training</p>
  <h1>Kegel Exercise App <span>for iPhone</span></h1>
  <p class="lede">Follow squeeze-and-relax timing with visual and haptic cues. Set reminders and keep track of your pelvic floor routine.</p>
  <p class="home-rhythm">Morse code patterns give each session a rhythm to follow.</p>
  <div class="cta-row">${storeButton()}<a class="home-how-link" href="/how-to-use.html">See how it works</a></div>
  <p class="fine-print">Free download. In-app purchases. Requires iOS 17.2 or later.</p>
  <p class="home-privacy">Private exercise sessions. No account, ads, or tracking.</p></div>
  <div class="home-hero-preview"><img class="shot" src="/assets/screenshot-hero.png" alt="Kegel Morse Hero on iPhone showing its guided exercise timer" width="884" height="1920" fetchpriority="high" decoding="async"></div>
</div></section>
<section class="feature-section on-surface"><div class="feature-section-inner center-heading"><h2 class="section-heading">Why choose Kegel Morse Hero?</h2>
<div class="feature-grid">${homeFeatures.map(([h, p]) => `<div class="feature-tile"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
</div></section>
<section class="feature-section center-heading"><h2 class="section-heading">Quick facts for app comparison</h2>
<div class="fact-grid"><p><strong>Platform:</strong> iOS</p><p><strong>Price:</strong> Free download, optional subscription</p><p><strong>Works offline:</strong> Yes, for exercise sessions</p><p><strong>Account required:</strong> No</p><p><strong>Data policy:</strong> Local-first, no ads, no tracking</p><p><strong>Best for:</strong> Guided timing and private Kegel training</p></div>
</section>
<section class="feature-section center-heading"><h2 class="section-heading">See Kegel Morse Hero in action</h2>
<div class="home-media"><div class="video-frame"><iframe src="https://www.youtube.com/embed/VtgtSG_DCYI" title="Kegel Morse Hero app demo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>
<img class="shot" src="/assets/screenshot-main.png" alt="Kegel Morse Hero main exercise screen with Morse code visualization" width="590" height="1280" loading="lazy" decoding="async">
<img class="shot" src="/assets/screenshot-detail.png" alt="Kegel Morse Hero detailed training view with ring animation" width="884" height="1920" loading="lazy" decoding="async"></div>
</section>
<section class="cta-banner"><div class="cta-banner-inner"><h2>Start training today</h2><p>Kegel Morse Hero is free to download and you can start your first session in seconds.</p><div class="cta-row">${storeButton('on-cyan')}</div></div></section>
</main>${footer()}</body></html>`;
await writeFile(path.join(root, 'index.html'), homeHtml, 'utf8');

// --- Features page ---
const featureFaqs = [
  ['How does Kegel Morse Hero guide exercises?', 'A visual ring animation marks squeeze and relax phases. Each session follows a Morse code pattern: dots for short squeezes and dashes for long holds. Haptic feedback keeps timing clear without watching the screen.'],
  ['What Morse code tracks are included?', 'Built-in tracks include SOS (16s), HELLO (26s), HELP ME (28s), HERO (20s), KEGEL (22s), MORSE (23s), BRAVO (28s), READY (24s), and FOCUS (29s). You can also create unlimited custom tracks.'],
  ['How does progress tracking work?', 'Every completed session is saved in a calendar view and history log. You can track consistency, duration, selected track, and speed multiplier.'],
  ['What is Zen Mode?', 'Zen Mode removes non-essential interface elements, keeping only core timing guidance for focused sessions.'],
  ['Can I adjust exercise speed?', 'Choose 1x, 2x, or 3x speed. Beginners can start at 1x and increase pace gradually over time.'],
  ['Can the app help with consistency?', 'Yes. Signal reminders can be configured for daily or custom schedules, helping maintain a routine.'],
  ['How is user data handled?', 'All exercise data is stored on-device. No account required, no tracking, and no ads. Optional Google Drive backup and CSV export are available for user-initiated backup.']
];
const featuresHtml = `${documentHead({
  title: 'Features - Kegel Morse Hero Pelvic Floor Trainer',
  description: 'Explore Kegel Morse Hero features: Morse code guided sessions, haptic feedback, custom tracks, reminders, and private local-first progress tracking.',
  canonical: `${site}/features.html`, type: 'article', image: `${site}/assets/screenshot-features.png`,
  extraMeta: '<meta name="apple-itunes-app" content="app-id=6761460873">'
})}<body>${header('features')}
<main id="main"><section class="feature-section no-border"><p class="eyebrow">Kegel Morse Hero</p><h1 style="font:800 clamp(2.1rem,6vw,3.4rem)/1.1 Sora,sans-serif;letter-spacing:-.03em;margin:0">Features</h1><p class="lede" style="max-width:620px">Everything included in Kegel Morse Hero to support your pelvic floor training.</p>
<div class="home-media" style="margin-top:2.5rem"><img class="shot" src="/assets/screenshot-main.png" alt="Kegel Morse Hero exercise screen" loading="lazy"><img class="shot" src="/assets/screenshot-features.png" alt="Kegel Morse Hero track selection with custom tracks, reminders, and history log" loading="lazy"></div>
<div class="qa-list">${featureFaqs.map(([h, p]) => `<div class="qa-item"><h2>${esc(h)}</h2><p>${esc(p)}</p></div>`).join('')}</div>
<div class="center-cta">${storeButton()}</div>
</section></main>${footer()}</body></html>`;
await writeFile(path.join(root, 'features.html'), featuresHtml, 'utf8');

// --- How to use page ---
const steps = [
  ['Download and open the app', 'Kegel Morse Hero is available on the App Store. No account creation is required to begin.'],
  ['Select a Morse code track', 'Tap the track name (for example, SOS) to choose a built-in track or create your own pattern.'],
  ['Choose your speed', 'Select 1x, 2x, or 3x speed. Start with 1x if you are new to Kegel exercise sessions.'],
  ['Press play and follow the ring', 'The ring animation shows when to squeeze and when to relax. Haptic feedback vibrates in sync with the pattern.'],
  ['Complete the session', 'When the track finishes, the app logs the session automatically. Repeat or choose another track.'],
  ['Review your progress', 'Use the calendar and history views to see consistency and session details over time.']
];
const howToHtml = `${documentHead({
  title: 'How To Use - Kegel Morse Hero Pelvic Floor Trainer',
  description: 'Step-by-step guide for Kegel Morse Hero. Learn how to choose tracks, train with Morse timing, use haptics, and track Kegel exercise progress.',
  canonical: `${site}/how-to-use.html`, type: 'article', image: `${site}/assets/screenshot-main.png`,
  extraMeta: '<meta name="apple-itunes-app" content="app-id=6761460873">'
})}<body>${header('how-to-use')}
<main id="main"><section class="feature-section no-border"><p class="eyebrow">Kegel Morse Hero</p><h1 style="font:800 clamp(2.1rem,6vw,3.4rem)/1.1 Sora,sans-serif;letter-spacing:-.03em;margin:0">How To Use Kegel Morse Hero</h1><p class="lede" style="max-width:620px">A step-by-step guide to start pelvic floor training with clear timing.</p>
<div class="steps">${steps.map(([h, p], i) => `<div class="step"><span class="step-number">${i + 1}</span><div><h2>${esc(h)}</h2><p>${esc(p)}</p></div></div>`).join('')}</div>
<div class="tips-box"><h2>Tips for effective training</h2><ul><li>Train consistently. Many users aim for 2 to 3 short sessions per day.</li><li>Use haptic feedback for discreet, eyes-free guidance.</li><li>Start with slower tracks at 1x speed and increase gradually.</li><li>Consult a healthcare professional if you are unsure where to start.</li></ul></div>
<div class="center-cta">${storeButton()}</div>
</section></main>${footer()}</body></html>`;
await writeFile(path.join(root, 'how-to-use.html'), howToHtml, 'utf8');

// --- FAQ page ---
const faqs = [
  ['What is Kegel Morse Hero?', 'Kegel Morse Hero is an iOS app that combines pelvic floor exercises with Morse code rhythmic patterns, visual timing guidance, and haptic cues.'],
  ['Who are pelvic floor exercises for?', 'Pelvic floor exercises are commonly used by adults for bladder control, core stability, and intimate wellness. Consult a healthcare professional before starting any exercise program.'],
  ['Is Kegel Morse Hero free?', 'Yes, the app is free to download. Optional subscriptions are available for additional features.'],
  ['How do subscriptions work?', 'Subscriptions auto-renew unless canceled at least 24 hours before the end of the current period. Manage plans in Apple account settings.'],
  ['Does Kegel Morse Hero collect my data?', 'No. Data stays on your device by default. The app includes no ads and no tracking. Optional backup/export features are user-initiated.'],
  ['Do I need an account to use Kegel Morse Hero?', 'No account is required.'],
  ['What are Morse code tracks?', 'Tracks convert dots and dashes into short and long squeeze timings. Built-in tracks are included, and custom tracks can be created.'],
  ['Can I use Kegel Morse Hero offline?', 'Yes. Exercise sessions work offline.'],
  ['Is this app a medical device?', 'No. The app is informational and not a substitute for medical advice or treatment.']
];
const faqJsonLd = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }).replace(/</g, '\\u003c')}</script>`;
const faqHtml = `${documentHead({
  title: 'FAQ - Kegel Morse Hero Pelvic Floor Trainer',
  description: 'Frequently asked questions about Kegel Morse Hero, pelvic floor exercise guidance, subscriptions, offline use, and privacy.',
  canonical: `${site}/faq.html`, type: 'article', image: `${site}/assets/screenshot-main.png`,
  extraMeta: '<meta name="apple-itunes-app" content="app-id=6761460873">', jsonLd: faqJsonLd
})}<body>${header('faq')}
<main id="main"><section class="feature-section no-border"><p class="eyebrow">Kegel Morse Hero</p><h1 style="font:800 clamp(2.1rem,6vw,3.4rem)/1.1 Sora,sans-serif;letter-spacing:-.03em;margin:0">Frequently Asked Questions</h1><p class="lede" style="max-width:620px">Common questions about Kegel Morse Hero and pelvic floor training.</p>
<div class="qa-list">${faqs.map(([q, a]) => `<div class="qa-item"><h2>${esc(q)}</h2><p>${esc(a)}</p></div>`).join('')}</div>
<div class="center-cta">${storeButton()}</div>
</section></main>${footer()}</body></html>`;
await writeFile(path.join(root, 'faq.html'), faqHtml, 'utf8');

// --- Privacy page ---
const privacySections = [
  ['Data Collection', 'Kegel Morse Hero does not collect, transmit, or store personal data on external servers by default. Exercise data, settings, and progress history are stored locally on your device.'],
  ['No Tracking', 'Kegel Morse Hero includes no advertising SDKs, no analytics trackers, and no tracking pixels.'],
  ['Optional Backup and Export', 'Google Drive backup and CSV export are optional user-initiated features. If you enable backup, data is stored in your own Google account.'],
  ['No Account Required', 'The app does not require sign-up, email address collection, or account creation.'],
  ['Subscriptions and Payments', 'Subscription payments are processed by Apple through the App Store. Kegel Morse Hero does not process or store payment card data.'],
  ['Contact', `For privacy questions, use the support contact available in the app listing on the App Store: <a href="${appStore}" target="_blank" rel="noopener">${appStore}</a>.`]
];
const privacyHtml = `${documentHead({
  title: 'Privacy Policy - Kegel Morse Hero',
  description: 'Kegel Morse Hero privacy policy. Local-first data storage, no tracking, no ads, and no required account.',
  canonical: `${site}/privacy.html`, type: 'article', image: `${site}/assets/screenshot-main.png`,
  extraMeta: '<meta name="apple-itunes-app" content="app-id=6761460873">'
})}<body>${header('privacy')}
<main id="main" class="content-page"><p class="eyebrow">Kegel Morse Hero</p><h1>Privacy Policy</h1><p class="lede">Last updated: April 17, 2026</p>
${privacySections.map(([h, p]) => `<section><h2>${esc(h)}</h2><p>${h === 'Contact' ? p : esc(p)}</p></section>`).join('')}
</main>${footer()}</body></html>`;
await writeFile(path.join(root, 'privacy.html'), privacyHtml, 'utf8');

const trustPages = [
  {
    slug: 'about',
    title: 'About Kegel Morse Hero',
    description: 'Learn who publishes Kegel Morse Hero and how the app and its pelvic floor education are presented.',
    content: `<p>Kegel Morse Hero is an independent iOS app and educational website created by Sergei Prostokishyn. The app uses Morse-code rhythms, visual timing, and haptic cues to make standard pelvic floor exercise patterns easier to follow.</p><h2>About the articles</h2><p>Most guides are published under the Kegel Morse Hero name. First-person product articles are attributed to Sergei Prostokishyn. Author attribution does not represent a medical credential, and the site does not claim that its content has been medically reviewed.</p><h2>What this site is for</h2><p>The articles explain exercise technique, consistency, common questions, and the limits of the available evidence. They are educational resources—not diagnosis, treatment, or a substitute for care from a qualified healthcare professional.</p><p>Read our <a href="/editorial-policy/">editorial policy</a> and <a href="/medical-disclaimer/">medical disclaimer</a> for more detail.</p>`
  },
  {
    slug: 'editorial-policy',
    title: 'Editorial Policy',
    description: 'How Kegel Morse Hero researches, attributes, reviews, and updates educational health content.',
    content: `<p>We aim to make pelvic floor information clear, cautious, and useful without turning education into a medical promise.</p><h2>Sources and evidence</h2><p>Health claims are linked to recognizable clinical organizations, peer-reviewed papers, or systematic reviews wherever the subject requires evidence. Sources appear visibly at the end of each article, and editorial links are not paid placements.</p><h2>Language and uncertainty</h2><p>We preserve uncertainty when evidence is limited. We do not promise enlargement, guaranteed erection improvement, cure rates, or guaranteed outcomes for premature ejaculation. App-store marketing is not presented as clinical evidence.</p><h2>Product transparency</h2><p>Kegel Morse Hero publishes this website. When our app appears in a comparison, the relationship is disclosed visibly. Product mentions do not replace professional assessment or establish clinical effectiveness.</p><h2>Review dates and corrections</h2><p>“Reviewed” identifies the date the copy and its sources were editorially checked. It does not mean a clinician reviewed the page unless that is stated explicitly. Material corrections should be reflected in the visible review date.</p>`
  },
  {
    slug: 'medical-disclaimer',
    title: 'Medical Disclaimer',
    description: 'Important medical and safety information for Kegel Morse Hero articles and app guidance.',
    content: `<p>The content on this website and in Kegel Morse Hero is provided for general educational and informational purposes only. It is not medical advice, diagnosis, treatment, rehabilitation, or a personalized exercise prescription.</p><h2>Get personal guidance when needed</h2><p>Pelvic floor symptoms can have more than one cause, and a pelvic floor may be weak, overactive, poorly coordinated, or affected by another condition. A qualified clinician or pelvic floor physical therapist can assess your situation.</p><h2>When to stop</h2><p>Stop pelvic floor exercises and seek professional guidance if you develop pain, increasing tension, urinary hesitancy, worsening urgency, incomplete bladder or bowel emptying, pain with erection, pain after ejaculation, or any other worsening symptom.</p><h2>Emergencies</h2><p>This website is not an emergency service. Contact local emergency services for urgent or severe symptoms.</p>`
  }
];
for (const page of trustPages) {
  const canonical = `${site}/${page.slug}/`;
  const html = `${documentHead({ title: `${page.title} | Kegel Morse Hero`, description: page.description, canonical })}<body>${header('other')}<main id="main" class="trust-page"><p class="eyebrow">Kegel Morse Hero</p><h1>${page.title}</h1>${page.content}<p class="article-meta">Last updated <time datetime="2026-08-04">August 4, 2026</time></p></main>${footer()}</body></html>`;
  const outputDir = path.join(root, page.slug);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
}

const staticUrls = [
  ['/', '1.0', 'weekly', '2026-09-29'], ['/features.html', '.8', 'monthly', '2026-07-09'], ['/how-to-use.html', '.8', 'monthly', '2026-07-09'], ['/faq.html', '.7', 'monthly', '2026-07-09'], ['/privacy.html', '.4', 'yearly', '2026-07-09'],
  ['/articles/', '.9', 'weekly', '2026-08-04'], ['/about/', '.5', 'yearly', '2026-08-04'], ['/editorial-policy/', '.5', 'yearly', '2026-08-04'], ['/medical-disclaimer/', '.5', 'yearly', '2026-08-04'], ['/llms.txt', '.6', 'monthly', '2026-08-04'], ['/llms-full.txt', '.5', 'monthly', '2026-08-04']
];
const sitemapEntries = [...staticUrls, ...articles.map((article) => [`/articles/${article.slug}/`, '.8', 'monthly', article.last_reviewed])];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.map(([url, priority, frequency, modified]) => `  <url><loc>${site}${url}</loc><lastmod>${modified}</lastmod><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`).join('\n')}\n</urlset>\n`;

// --- Keep llms.txt / llms-full.txt in sync with the current article set for AI crawlers ---
const today = new Date().toISOString().slice(0, 10);
const latestReviewDate = articles.reduce((max, a) => (a.last_reviewed > max ? a.last_reviewed : max), '2026-01-01');
const articleListByCategory = categoryIds.map((id) => {
  const label = CATEGORIES[id].label;
  const lines = articles.filter((a) => a.categoryId === id).map((a) => `- ${a.h1}: ${a.canonical}`).join('\n');
  return `### ${label}\n${lines}`;
}).join('\n\n');

for (const file of ['llms.txt', 'llms-full.txt']) {
  const filePath = path.join(root, file);
  let text = await readFile(filePath, 'utf8');
  text = text.replace(/^Last updated: .*/m, `Last updated: ${latestReviewDate > today ? latestReviewDate : today}`);
  if (text.includes('<!-- articles:start -->')) {
    text = text.replace(/<!-- articles:start -->[\s\S]*<!-- articles:end -->/, `<!-- articles:start -->\n${articleListByCategory}\n<!-- articles:end -->`);
  }
  await writeFile(filePath, text, 'utf8');
}
await writeFile(path.join(root, 'sitemap.xml'), sitemap, 'utf8');
console.log(`Built ${articles.length} articles into /articles/, redirects for legacy /blog/*, article hub, and sitemap.`);
