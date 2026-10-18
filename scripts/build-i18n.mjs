// Builds localized pages for every language in scripts/i18n/<code>.mjs (all except ru, which has scripts/build-ru.mjs):
// home, article hub, features, how-to-use, faq, privacy, about, editorial-policy, medical-disclaimer and the translated article.
// Usage: node scripts/build-i18n.mjs [pl de ...]   (no args = all)
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { site, LANGS, ARTICLE_SLUGS, EN_ARTICLE, EN_ARTICLES, MD_TRANSLATIONS, HAND_BUILT_ARTICLE, alternatesFor, hreflangTags, langRow } from './i18n/routes.mjs';
import { createRenderer, parseFrontMatter } from './lib/markdown.mjs';
import uiExtra from './i18n/ui-extra.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Neutral storefront URL: Apple redirects to the visitor's own country.
const appStore = 'https://apps.apple.com/app/id6761460873';
const playBase = 'https://play.google.com/store/apps/details?id=com.serhii.KegelMorseHero';
const playGlyph = '<svg viewBox="0 0 24 24"><path d="M3.6 1.8c-.3.2-.5.6-.5 1.1v18.2c0 .5.2.9.5 1.1l10-10.2zM14.7 11.9l2.8-2.8L5.1 2l9.6 9.9zm0 .2L5.1 22l12.4-7.1zM18.6 9.7l-3 3 3 3 3.4-2c.9-.5.9-1.6 0-2.1z"/></svg>';
const appleGlyph = '<svg viewBox="0 0 24 24"><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.09-.46 1.6-1.534 3.16-.918 1.35-1.866 2.7-3.36 2.72-1.466.03-1.937-.87-3.61-.87-1.673 0-2.197.84-3.583.9-1.444.05-2.55-1.46-3.475-2.81-1.89-2.74-3.34-7.74-1.4-11.12.964-1.66 2.687-2.71 4.555-2.74 1.435-.03 2.79.97 3.671.97.88 0 2.539-1.2 4.275-1.02.726.03 2.756.295 4.057 2.225-.105.066-2.422 1.418-2.395 4.236.03 3.378 2.965 4.5 3.001 4.51z"/></svg>';

const esc = (value = '') => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const h1Style = 'font:800 clamp(2.1rem,6vw,3.4rem)/1.1 Sora,sans-serif;letter-spacing:-.03em;margin:0';
const itunes = '<meta name="apple-itunes-app" content="app-id=6761460873">';

async function write(pagePath, html) {
  const dir = path.join(root, pagePath);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), html, 'utf8');
}

async function buildLang(code, L) {
  const meta = LANGS[code];
  const u = L.ui;
  const play = `${playBase}&hl=${code}`;
  const base = `/${code}`;
  const articlePath = `${base}/articles/${ARTICLE_SLUGS[code]}/`;
  const storeBtn = (href, glyph, eyebrow, name, variant) => `<a class="store-btn${variant ? ` ${variant}` : ''}" href="${href}" target="_blank" rel="noopener">${glyph}<span class="store-label"><span class="store-eyebrow">${eyebrow}</span><span class="store-name">${name}</span></span></a>`;
  const storeButtons = (variant = '') => `<span class="store-btns">${storeBtn(appStore, appleGlyph, u.storeApple, 'App Store', variant)}${storeBtn(play, playGlyph, u.storePlay, 'Google Play', variant)}</span>`;
  const store = `<div class="center-cta">${storeButtons()}</div>`;

  const head = ({ title, description, path: pagePath, enPath, type = 'website', image, extraMeta = '', jsonLd = '', modified = '' }) => {
    const canonical = `${site}${pagePath}`;
    const ogImage = image || `${site}/assets/og-image.png`;
    return `<!doctype html><html lang="${code}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta name="author" content="Kegel Morse Hero"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="theme-color" content="#070a0b">${extraMeta}<link rel="canonical" href="${canonical}">
${hreflangTags(enPath)}
<link rel="icon" href="/assets/favicon-48.png" type="image/png" sizes="48x48"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:type" content="${type}"><meta property="og:locale" content="${meta.og}"><meta property="og:site_name" content="Kegel Morse Hero"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${ogImage}"><meta property="og:image:alt" content="${esc(u.ogAlt)}">${modified ? `<meta property="article:modified_time" content="${modified}">` : ''}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${ogImage}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/blog/blog.css">
${jsonLd}</head>`;
  };

  const navItems = [['home', `${base}/`, u.nav.home], ['articles', `${base}/articles/`, u.nav.articles], ['features', `${base}/features/`, u.nav.features], ['how-to-use', `${base}/how-to-use/`, u.nav.howto], ['faq', `${base}/faq/`, u.nav.faq], ['privacy', `${base}/privacy/`, u.nav.privacy]];
  const header = (current, enPath) => `
<a class="skip-link" href="#main">${esc(u.skip)}</a>
<header class="site-header"><div class="header-inner">
  <a class="brand" href="${base}/"><img src="/assets/logo-96.png" width="96" height="96" alt="${esc(u.logoAlt)}"><span>Kegel Morse Hero</span></a>
  <nav class="site-nav" aria-label="${esc(u.navAria)}">
    ${navItems.map(([id, href, label]) => `<a href="${href}"${current === id ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('')}<a href="${enPath}" hreflang="en" lang="en">English</a>
    <a class="download-link" href="${appStore}" target="_blank" rel="noopener">App Store</a><a class="download-link download-link-android" href="${play}" target="_blank" rel="noopener">Google Play</a>
  </nav>
</div></header>`;
  const footer = (enPath) => `
<footer class="site-footer"><div class="footer-inner">
  <div><a class="brand" href="${base}/"><img src="/assets/logo-96.png" width="96" height="96" loading="lazy" alt="${esc(u.logoAlt)}"><span>Kegel Morse Hero</span></a><p class="copyright">© 2026 Kegel Morse Hero</p>${langRow(enPath, code)}</div>
  <nav class="footer-links" aria-label="${esc(u.footerAria)}"><a href="${base}/articles/">${esc(u.nav.articles)}</a><a href="${base}/features/">${esc(u.nav.features)}</a><a href="${base}/how-to-use/">${esc(u.nav.howto)}</a><a href="${base}/faq/">${esc(u.nav.faq)}</a><a href="${base}/privacy/">${esc(u.nav.privacy)}</a><a href="${base}/about/">${esc(u.nav.about)}</a><a href="${base}/editorial-policy/">${esc(u.nav.editorial)}</a><a href="${base}/medical-disclaimer/">${esc(u.nav.disclaimer)}</a></nav>
</div></footer>`;

  const intro = (h1, lede) => `<p class="eyebrow">Kegel Morse Hero</p><h1 style="${h1Style}">${esc(h1)}</h1><p class="lede" style="max-width:620px">${esc(lede)}</p>`;
  const qa = (items) => `<div class="qa-list">${items.map(([q, a]) => `<div class="qa-item"><h2>${esc(q)}</h2><p>${esc(a)}</p></div>`).join('')}</div>`;
  const faqLd = (items) => ld({ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: code, mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

  if (!L.mdOnly) {
  // --- Home ---
  const H = L.home;
  const homeLd = ld({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Kegel Morse Hero', alternateName: 'Kegel Morse Hero: Pelvic Floor', operatingSystem: 'iOS 17.2 or later', applicationCategory: 'HealthApplication', applicationSubCategory: 'Fitness', author: { '@type': 'Person', name: 'Sergei Prostokishyn' }, description: H.ldDesc, url: `${site}${base}/`, downloadUrl: appStore, installUrl: appStore, isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' }, publisher: { '@type': 'Organization', name: 'Kegel Morse Hero', url: `${site}/` }, image: `${site}/assets/logo.png`, inLanguage: code });
  await write(code, `${head({ title: H.title, description: H.description, path: `${base}/`, enPath: '/', extraMeta: itunes, jsonLd: homeLd })}<body>${header('home', '/')}
<main id="main">
<section class="home-hero"><div class="home-hero-inner">
  <div class="home-hero-copy"><p class="eyebrow">${esc(H.eyebrow)}</p>
  <h1>${esc(H.h1)} <span>${esc(H.h1span)}</span></h1>
  <p class="lede">${esc(H.lede)}</p>
  <p class="home-rhythm">${esc(H.rhythm)}</p>
  <div class="cta-row">${storeButtons()}<a class="home-how-link" href="${base}/how-to-use/">${esc(H.how)}</a></div>
  <p class="fine-print">${esc(H.fine)}</p>
  <p class="home-privacy">${esc(H.priv)}</p></div>
  <div class="home-hero-preview"><img class="shot" src="/assets/screenshot-hero.png" alt="${esc(H.heroAlt)}" width="884" height="1920" fetchpriority="high" decoding="async"></div>
</div></section>
<section class="feature-section on-surface"><div class="feature-section-inner center-heading"><h2 class="section-heading">${esc(H.whyTitle)}</h2>
<div class="feature-grid">${H.features.map(([h, p]) => `<div class="feature-tile"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
</div></section>
<section class="feature-section center-heading"><h2 class="section-heading">${esc(H.factsTitle)}</h2>
<div class="fact-grid">${H.facts.map(([k, v]) => `<p><strong>${esc(k)}</strong> ${esc(v)}</p>`).join('')}</div>
</section>
<section class="feature-section center-heading"><h2 class="section-heading">${esc(H.actionTitle)}</h2>
<div class="home-media"><div class="video-frame"><iframe src="https://www.youtube.com/embed/VtgtSG_DCYI" title="${esc(H.videoTitle)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>
<img class="shot" src="/assets/screenshot-main.png" alt="${esc(H.mainAlt)}" width="590" height="1280" loading="lazy" decoding="async">
<img class="shot" src="/assets/screenshot-detail.png" alt="${esc(H.detailAlt)}" width="884" height="1920" loading="lazy" decoding="async"></div>
</section>
<section class="feature-section center-heading"><h2 class="section-heading">${esc(H.usefulTitle)}</h2>
<p><a href="${articlePath}">${esc(L.article.h1)}</a></p>
<p><a href="${base}/articles/">${esc(H.allArticles)}</a></p></section>
<section class="cta-banner"><div class="cta-banner-inner"><h2>${esc(H.ctaTitle)}</h2><p>${esc(H.ctaText)}</p><div class="cta-row">${storeButtons('on-cyan')}</div></div></section>
</main>${footer('/')}</body></html>`);

  // --- Article ---
  const A = L.article;
  const articleUrl = `${site}${articlePath}`;
  const cover = `${site}/assets/articles/how-many-kegels-a-day-for-men.webp`;
  const articleLd = ld({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: A.h1, description: A.description, mainEntityOfPage: articleUrl, url: articleUrl, datePublished: '2026-10-18', dateModified: '2026-10-18', author: { '@type': 'Organization', name: 'Kegel Morse Hero', url: `${site}${base}/about/` }, publisher: { '@type': 'Organization', name: 'Kegel Morse Hero', url: `${site}/`, logo: { '@type': 'ImageObject', url: `${site}/assets/logo.png` } }, image: cover, articleSection: A.category, inLanguage: code },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: u.nav.home, item: `${site}${base}/` }, { '@type': 'ListItem', position: 2, name: u.nav.articles, item: `${site}${base}/articles/` }, { '@type': 'ListItem', position: 3, name: A.h1, item: articleUrl }] },
    { '@type': 'FAQPage', inLanguage: code, mainEntity: A.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ] });
  const faqHtml = A.faqs.map(([q, a], i) => `<h3 id="faq-${i + 1}">${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n');
  const body = A.body.replace('{{FAQ}}', faqHtml).split('{{APPSTORE}}').join(appStore);
  await write(`${code}/articles/${ARTICLE_SLUGS[code]}`, `${head({ title: A.title, description: A.description, path: articlePath, enPath: EN_ARTICLE, type: 'article', image: cover, modified: '2026-10-18', jsonLd: articleLd })}<body>${header('articles', EN_ARTICLE)}
<main id="main"><nav class="breadcrumbs" aria-label="${esc(u.crumbAria)}"><ol><li><a href="${base}/">${esc(u.nav.home)}</a></li><li><a href="${base}/articles/">${esc(u.nav.articles)}</a></li><li aria-current="page">${esc(A.crumb)}</li></ol></nav>
<header class="article-hero"><div class="article-hero-inner"><p class="eyebrow">${esc(A.category)}</p><h1>${esc(A.h1)}</h1><div class="article-meta"><span>${esc(A.reviewed)} <time datetime="2026-08-04">${esc(A.reviewedDate)}</time></span><span>${esc(A.by)} <a href="${base}/about/" rel="author">Kegel Morse Hero</a></span><span>${esc(A.evidence)}</span></div></div><img class="article-cover" src="/assets/articles/how-many-kegels-a-day-for-men.webp" width="400" height="220" alt="${esc(A.coverAlt)}" loading="eager"></header>
<div class="article-layout"><article class="article-body"><blockquote><p><strong>${esc(A.quickLabel)}</strong> ${esc(A.quick)}</p></blockquote>
${body}</article><aside class="toc" aria-label="${esc(u.tocTitle)}"><p>${esc(u.tocTitle)}</p><ol>${A.toc.map(([id, label]) => `<li><a href="#${id}">${esc(label)}</a></li>`).join('')}</ol></aside></div>

<div class="disclaimer-shell"><p class="medical-disclaimer"><strong>${esc(A.disclaimerLabel)}</strong> ${esc(A.disclaimerText)} <a href="${base}/medical-disclaimer/">${esc(A.disclaimerLink)}</a></p></div></main>${footer(EN_ARTICLE)}</body></html>`);

  // --- Features ---
  const F = L.features;
  await write(`${code}/features`, `${head({ title: F.title, description: F.description, path: `${base}/features/`, enPath: '/features.html', type: 'article', image: `${site}/assets/screenshot-features.png`, extraMeta: itunes })}<body>${header('features', '/features.html')}
<main id="main"><section class="feature-section no-border">${intro(F.h1, F.lede)}
<div class="home-media" style="margin-top:2.5rem"><img class="shot" src="/assets/screenshot-main.png" alt="${esc(F.alt1)}" loading="lazy"><img class="shot" src="/assets/screenshot-features.png" alt="${esc(F.alt2)}" loading="lazy"></div>
${qa(F.faqs)}
${store}
</section></main>${footer('/features.html')}</body></html>`);

  // --- How to use ---
  const T = L.howto;
  await write(`${code}/how-to-use`, `${head({ title: T.title, description: T.description, path: `${base}/how-to-use/`, enPath: '/how-to-use.html', type: 'article', image: `${site}/assets/screenshot-main.png`, extraMeta: itunes })}<body>${header('how-to-use', '/how-to-use.html')}
<main id="main"><section class="feature-section no-border">${intro(T.h1, T.lede)}
<div class="steps">${T.steps.map(([h, p], i) => `<div class="step"><span class="step-number">${i + 1}</span><div><h2>${esc(h)}</h2><p>${esc(p)}</p></div></div>`).join('')}</div>
<div class="tips-box"><h2>${esc(T.tipsTitle)}</h2><ul>${T.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
${store}
</section></main>${footer('/how-to-use.html')}</body></html>`);

  // --- FAQ ---
  const Q = L.faq;
  await write(`${code}/faq`, `${head({ title: Q.title, description: Q.description, path: `${base}/faq/`, enPath: '/faq.html', type: 'article', image: `${site}/assets/screenshot-main.png`, extraMeta: itunes, jsonLd: faqLd(Q.faqs) })}<body>${header('faq', '/faq.html')}
<main id="main"><section class="feature-section no-border">${intro(Q.h1, Q.lede)}
${qa(Q.faqs)}
${store}
</section></main>${footer('/faq.html')}</body></html>`);

  // --- Privacy ---
  const P = L.privacy;
  await write(`${code}/privacy`, `${head({ title: P.title, description: P.description, path: `${base}/privacy/`, enPath: '/privacy.html', type: 'article', image: `${site}/assets/screenshot-main.png`, extraMeta: itunes })}<body>${header('privacy', '/privacy.html')}
<main id="main" class="content-page"><p class="eyebrow">Kegel Morse Hero</p><h1>${esc(P.h1)}</h1><p class="lede">${esc(P.updated)}</p>
${P.sections.map(([h, p]) => `<section><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join('')}
<section><h2>${esc(P.contactTitle)}</h2><p>${esc(P.contactText)} <a href="${appStore}" target="_blank" rel="noopener">${appStore}</a>.</p></section>
<p><em>${esc(P.note)} <a href="/privacy.html" hreflang="en">${esc(P.noteLink)}</a>.</em></p>
</main>${footer('/privacy.html')}</body></html>`);

  // --- Trust pages ---
  for (const [slug, enPath, page] of [['about', '/about/', L.about], ['editorial-policy', '/editorial-policy/', L.editorial], ['medical-disclaimer', '/medical-disclaimer/', L.disclaimer]]) {
    const content = page.content.split('{{BASE}}').join(base);
    await write(`${code}/${slug}`, `${head({ title: `${page.title} | Kegel Morse Hero`, description: page.description, path: `${base}/${slug}/`, enPath })}<body>${header('other', enPath)}<main id="main" class="trust-page"><p class="eyebrow">Kegel Morse Hero</p><h1>${esc(page.title)}</h1>${content}<p class="article-meta">${L.trustUpdated}</p></main>${footer(enPath)}</body></html>`);
  }
  }

  // --- Translated markdown articles + article hub (all languages, including ru) ---
  const extra = uiExtra[code];
  const renderer = createRenderer({
    site, appStore, tableLabel: extra.tableLabel,
    mapHref: (url) => alternatesFor(url)?.[code] || url
  });
  const fmtDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(meta.locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const AR = L.article;
  const cards = [];
  let mdCount = 0;
  for (const en of EN_ARTICLES) {
    const cover = `/assets/articles/${en.cover_image}`;
    const categoryLabel = extra.categories[en.category_slug] || extra.categories.technique;
    if (en.slug === HAND_BUILT_ARTICLE) {
      cards.push({ href: `${base}/articles/${ARTICLE_SLUGS[code]}/`, cover, category: AR.category, title: AR.h1, description: AR.description, reviewed: `${AR.reviewed} ${AR.reviewedDate}` });
      continue;
    }
    const translation = MD_TRANSLATIONS[en.slug]?.[code];
    if (!translation) continue;
    const parsed = parseFrontMatter(readFileSync(translation.file, 'utf8'));
    const h1 = parsed.body.match(/^#\s+(.+)$/m)?.[1] || parsed.data.meta_title;
    const rendered = renderer.markdown(parsed.body);
    const slug = translation.slug;
    const pagePath = `${base}/articles/${slug}/`;
    const url = `${site}${pagePath}`;
    const enPath = `/articles/${en.slug}/`;
    const reviewedText = `${AR.reviewed} ${fmtDate(en.last_reviewed)}`;
    const coverUrl = `${site}${cover}`;
    const toc = rendered.headings.slice(0, 9).map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('');
    const articleLd = ld({ '@context': 'https://schema.org', '@graph': [
      { '@type': 'Article', headline: h1, description: parsed.data.meta_description, mainEntityOfPage: url, url, datePublished: '2026-10-18', dateModified: '2026-10-18', author: { '@type': 'Organization', name: 'Kegel Morse Hero', url: `${site}${base}/about/` }, publisher: { '@type': 'Organization', name: 'Kegel Morse Hero', url: `${site}/`, logo: { '@type': 'ImageObject', url: `${site}/assets/logo.png` } }, image: coverUrl, articleSection: categoryLabel, inLanguage: code },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: u.nav.home, item: `${site}${base}/` }, { '@type': 'ListItem', position: 2, name: u.nav.articles, item: `${site}${base}/articles/` }, { '@type': 'ListItem', position: 3, name: h1, item: url }] }
    ] });
    await write(`${code}/articles/${slug}`, `${head({ title: parsed.data.meta_title, description: parsed.data.meta_description, path: pagePath, enPath, type: 'article', image: coverUrl, modified: '2026-10-18', jsonLd: articleLd })}<body>${header('articles', enPath)}
<main id="main"><nav class="breadcrumbs" aria-label="${esc(u.crumbAria)}"><ol><li><a href="${base}/">${esc(u.nav.home)}</a></li><li><a href="${base}/articles/">${esc(u.nav.articles)}</a></li><li aria-current="page">${esc(h1)}</li></ol></nav>
<header class="article-hero"><div class="article-hero-inner"><p class="eyebrow">${esc(categoryLabel)}</p><h1>${esc(h1)}</h1><div class="article-meta"><span>${esc(AR.reviewed)} <time datetime="${en.last_reviewed}">${esc(fmtDate(en.last_reviewed))}</time></span><span>${esc(AR.by)} <a href="${base}/about/" rel="author">Kegel Morse Hero</a></span><span>${esc(AR.evidence)}</span></div></div><img class="article-cover" src="${cover}" width="400" height="220" alt="" loading="eager"></header>
<div class="article-layout"><article class="article-body">${rendered.html}</article><aside class="toc" aria-label="${esc(u.tocTitle)}"><p>${esc(u.tocTitle)}</p><ol>${toc}</ol></aside></div>

<div class="disclaimer-shell"><p class="medical-disclaimer"><strong>${esc(AR.disclaimerLabel)}</strong> ${esc(AR.disclaimerText)} <a href="${base}/medical-disclaimer/">${esc(AR.disclaimerLink)}</a></p></div></main>${footer(enPath)}</body></html>`);
    cards.push({ href: pagePath, cover, category: categoryLabel, title: h1, description: parsed.data.meta_description, reviewed: reviewedText });
    mdCount += 1;
  }

  const B = L.hub;
  const hubLd = ld({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: B.title, description: B.description, url: `${site}${base}/articles/`, inLanguage: code, hasPart: cards.map((c) => ({ '@type': 'Article', headline: c.title, url: `${site}${c.href}` })) });
  await write(`${code}/articles`, `${head({ title: B.title, description: B.description, path: `${base}/articles/`, enPath: '/articles/', jsonLd: hubLd })}<body>${header('articles', '/articles/')}<main id="main"><section class="blog-hero"><div class="hero-inner"><p class="eyebrow">${esc(B.eyebrow)}</p><h1>${esc(B.h1)}</h1><p class="lede">${esc(B.lede)}</p><div class="signal" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div></section><section class="blog-shell" aria-labelledby="guides"><h2 class="section-heading" id="guides">${esc(B.allTitle)}</h2><div class="article-grid">${cards.map((c) => `<a class="article-card" href="${c.href}"><span class="card-cover"><img src="${c.cover}" width="400" height="220" alt="" loading="lazy"></span><span class="card-body"><span class="card-number">${esc(c.category)}</span><h2>${esc(c.title)}</h2><p>${esc(c.description)}</p><span class="card-meta">${esc(c.reviewed)}</span></span></a>`).join('\n')}</div><p>${esc(B.moreEn)} <a href="/articles/" hreflang="en">${esc(B.moreEnLink)}</a>.</p></section></main>${footer('/articles/')}</body></html>`);

  console.log(`Built ${code} (${meta.name}): ${L.mdOnly ? 'hub' : '10 pages + hub'} + ${mdCount} markdown articles.`);
}

const wanted = process.argv.slice(2);
for (const code of Object.keys(LANGS)) {
  if (wanted.length && !wanted.includes(code)) continue;
  let L;
  try { L = (await import(`./i18n/${code}.mjs`)).default; } catch (error) { console.log(`Skipping ${code}: ${error.code === 'ERR_MODULE_NOT_FOUND' ? 'no data file' : error.message}`); continue; }
  await buildLang(code, L);
}
