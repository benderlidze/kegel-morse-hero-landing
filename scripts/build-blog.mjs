import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'blog', 'content');
const site = 'https://kegelmorsehero.com';
const appStore = 'https://apps.apple.com/us/app/kegel-morse-hero-pelvic-floor/id6761460873';

const esc = (value = '') => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (value = '') => value.replace(/[*_`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const idFor = (value) => plain(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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

const header = (current = 'blog', showDownload = true) => `
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><div class="header-inner">
  <a class="brand" href="/"><img src="/assets/logo-96.png" width="96" height="96" alt="Kegel Morse Hero logo"><span>Kegel Morse Hero</span></a>
  <nav class="site-nav" aria-label="Primary navigation">
    <a href="/">Home</a><a href="/features.html">Features</a><a href="/how-to-use.html">How to use</a><a href="/blog/"${current === 'blog' ? ' aria-current="page"' : ''}>Blog</a>
    ${showDownload ? `<a class="download-link" href="${appStore}" target="_blank" rel="noopener">Download</a>` : ''}
  </nav>
</div></header>`;

const footer = () => `
<footer class="site-footer"><div class="footer-inner">
  <div><a class="brand" href="/"><img src="/assets/logo-96.png" width="96" height="96" loading="lazy" alt="Kegel Morse Hero logo"><span>Kegel Morse Hero</span></a><p class="copyright">© 2026 Kegel Morse Hero</p></div>
  <nav class="footer-links" aria-label="Footer navigation"><a href="/blog/">Blog</a><a href="/about/">About</a><a href="/editorial-policy/">Editorial policy</a><a href="/medical-disclaimer/">Medical disclaimer</a><a href="/privacy.html">Privacy</a></nav>
</div></footer>`;

function documentHead({ title, description, canonical, type = 'website', modified, jsonLd = '' }) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta name="author" content="Kegel Morse Hero"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="theme-color" content="#070a0b"><link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="/assets/favicon-48.png" type="image/png" sizes="48x48"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="Kegel Morse Hero"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${site}/assets/og-image.png"><meta property="og:image:alt" content="Kegel Morse Hero pelvic floor training app">${modified ? `<meta property="article:modified_time" content="${modified}">` : ''}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${site}/assets/og-image.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/blog/blog.css">
${jsonLd}</head>`;
}

const files = (await readdir(contentDir)).filter((file) => /^\d{2}-.*\.md$/.test(file)).sort();
const articles = [];
for (const file of files) {
  const source = await readFile(path.join(contentDir, file), 'utf8');
  const parsed = parseFrontMatter(source);
  const slug = parsed.data.slug.replace(/^\/blog\//, '').replace(/\/$/, '');
  const h1 = parsed.body.match(/^#\s+(.+)$/m)?.[1] || parsed.data.title;
  articles.push({ ...parsed.data, slug, h1, body: parsed.body, file });
}

for (let index = 0; index < articles.length; index += 1) {
  const article = articles[index];
  const rendered = markdown(article.body);
  const authorType = article.author === 'Sergei Prostokishyn' ? 'Person' : 'Organization';
  const structured = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Article', headline: article.h1, description: article.meta_description, mainEntityOfPage: article.canonical, url: article.canonical, dateModified: article.last_reviewed, author: { '@type': authorType, name: article.author, url: `${site}/about/` }, publisher: { '@type': 'Organization', name: 'Kegel Morse Hero', url: `${site}/`, logo: { '@type': 'ImageObject', url: `${site}/assets/logo.png` } }, image: `${site}/assets/og-image.png`, inLanguage: 'en' },
      { '@type': 'BreadcrumbList', itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Home', item: `${site}/` }, { '@type': 'ListItem', position: 2, name: 'Blog', item: `${site}/blog/` }, { '@type': 'ListItem', position: 3, name: article.h1, item: article.canonical } ] }
    ]
  };
  const previous = articles[(index - 1 + articles.length) % articles.length];
  const next = articles[(index + 1) % articles.length];
  const toc = rendered.headings.slice(0, 9).map((heading) => `<li><a href="#${heading.id}">${esc(heading.text)}</a></li>`).join('');
  const jsonLd = `<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script>`;
  const html = `${documentHead({ title: article.meta_title, description: article.meta_description, canonical: article.canonical, type: 'article', modified: article.last_reviewed, jsonLd })}<body>${header('blog', !article.file.startsWith('10-'))}
<main id="main"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/blog/">Blog</a></li><li aria-current="page">${esc(article.h1)}</li></ol></nav>
<header class="article-hero"><div class="article-hero-inner"><p class="eyebrow">Pelvic floor guide</p><h1>${esc(article.h1)}</h1><div class="article-meta"><span>Reviewed <time datetime="${article.last_reviewed}">${new Date(`${article.last_reviewed}T00:00:00Z`).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})}</time></span><span>By <a href="/about/" rel="author">${esc(article.author)}</a></span><span>${article.file.startsWith('07-') ? 'Comparison guide' : 'Evidence-aware guide'}</span></div></div></header>
<div class="article-layout"><article class="article-body">${rendered.html}</article><aside class="toc" aria-label="On this page"><p>On this page</p><ol>${toc}</ol></aside></div>
<section class="related" aria-labelledby="related-title"><h2 class="section-heading" id="related-title">Keep reading</h2><div class="related-grid"><a href="/blog/${previous.slug}/"><span>Previous guide</span><strong>${esc(previous.h1)}</strong></a><a href="/blog/${next.slug}/"><span>Next guide</span><strong>${esc(next.h1)}</strong></a></div></section>
<div class="related"><p class="medical-disclaimer"><strong>Medical disclaimer:</strong> This article is for education only and is not medical advice, diagnosis, or treatment. Stop if exercise causes pain or worsening symptoms, and consult a qualified healthcare professional for personal guidance. <a href="/medical-disclaimer/">Read the full disclaimer.</a></p></div></main>${footer()}</body></html>`;
  const outputDir = path.join(root, 'blog', article.slug);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
}

const cards = articles.map((article, index) => `<a class="article-card" href="/blog/${article.slug}/"><span class="card-number">GUIDE ${String(index + 1).padStart(2, '0')}</span><h2>${esc(article.h1)}</h2><p>${esc(article.meta_description)}</p><span class="card-meta">Reviewed ${new Date(`${article.last_reviewed}T00:00:00Z`).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'})}</span></a>`).join('\n');
const indexDescription = 'Evidence-aware guides to male Kegel exercises, pelvic floor technique, training schedules, apps, and habit building.';
const collectionLd = `<script type="application/ld+json">${JSON.stringify({ '@context':'https://schema.org','@type':'CollectionPage',name:'Pelvic Floor Training Guides',description:indexDescription,url:`${site}/blog/`,hasPart:articles.map((a)=>({'@type':'Article',headline:a.h1,url:a.canonical})) }).replace(/</g,'\\u003c')}</script>`;
const indexHtml = `${documentHead({ title: 'Male Pelvic Floor Guides | Kegel Morse Hero', description: indexDescription, canonical: `${site}/blog/`, jsonLd: collectionLd })}<body>${header()}<main id="main"><section class="blog-hero"><div class="hero-inner"><p class="eyebrow">The signal journal</p><h1>Clear guidance for a stronger routine.</h1><p class="lede">Practical, evidence-aware articles about male pelvic floor training—without inflated promises or awkward jargon.</p><div class="signal" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div></section><section class="blog-shell" aria-labelledby="guides"><h2 class="section-heading" id="guides">All guides</h2><div class="article-grid">${cards}</div></section></main>${footer()}</body></html>`;
await writeFile(path.join(root, 'blog', 'index.html'), indexHtml, 'utf8');

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
  ['/', '1.0', 'weekly', '2026-08-04'], ['/features.html', '.8', 'monthly', '2026-07-09'], ['/how-to-use.html', '.8', 'monthly', '2026-07-09'], ['/faq.html', '.7', 'monthly', '2026-07-09'], ['/privacy.html', '.4', 'yearly', '2026-07-09'],
  ['/blog/', '.9', 'weekly', '2026-08-04'], ['/about/', '.5', 'yearly', '2026-08-04'], ['/editorial-policy/', '.5', 'yearly', '2026-08-04'], ['/medical-disclaimer/', '.5', 'yearly', '2026-08-04'], ['/llms.txt', '.6', 'monthly', '2026-08-04'], ['/llms-full.txt', '.5', 'monthly', '2026-08-04']
];
const sitemapEntries = [...staticUrls, ...articles.map((article) => [`/blog/${article.slug}/`, '.8', 'monthly', article.last_reviewed])];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.map(([url, priority, frequency, modified]) => `  <url><loc>${site}${url}</loc><lastmod>${modified}</lastmod><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(root, 'sitemap.xml'), sitemap, 'utf8');
console.log(`Built ${articles.length} articles, blog index, and sitemap.`);
