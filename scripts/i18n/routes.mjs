// Single source of truth for localized URLs. Used by build-blog.mjs (hreflang on English pages + sitemap),
// build-ru.mjs and build-i18n.mjs (hreflang + language switcher on localized pages).
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const site = 'https://kegelmorsehero.com';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const LANGS = {
  ru: { name: 'Русский', locale: 'ru-RU', og: 'ru_RU' },
  pl: { name: 'Polski', locale: 'pl-PL', og: 'pl_PL' },
  de: { name: 'Deutsch', locale: 'de-DE', og: 'de_DE' },
  es: { name: 'Español', locale: 'es-ES', og: 'es_ES' },
  fr: { name: 'Français', locale: 'fr-FR', og: 'fr_FR' },
  uk: { name: 'Українська', locale: 'uk-UA', og: 'uk_UA' }
};

// Localized slug of the hand-built translation of "how many kegels a day" (ASCII, primary keyword first).
export const ARTICLE_SLUGS = {
  ru: 'uprazhneniya-kegelya-muzhchinam-skolko-v-den',
  pl: 'cwiczenia-kegla-dla-mezczyzn-ile-razy-dziennie',
  de: 'kegel-uebungen-fuer-maenner-wie-oft-taeglich',
  es: 'ejercicios-de-kegel-para-hombres-cuantas-veces-al-dia',
  fr: 'exercices-de-kegel-homme-combien-par-jour',
  uk: 'vpravy-kegelya-dlya-cholovikiv-skilky-raziv-na-den'
};

export const EN_ARTICLE = '/articles/how-many-kegels-a-day-for-men/';
export const HAND_BUILT_ARTICLE = 'how-many-kegels-a-day-for-men';

const frontMatter = (file) => {
  const text = readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  const data = {};
  for (const line of (match ? match[1] : '').split('\n')) {
    const field = line.match(/^([a-z_]+):\s*(.*)$/);
    if (field) data[field[1]] = field[2].trim().replace(/^["']|["']$/g, '');
  }
  return data;
};

// English source articles in order (content/articles/NN-*.md).
export const EN_ARTICLES = readdirSync(path.join(root, 'content', 'articles')).filter((f) => /^\d{2}-.*\.md$/.test(f)).sort().map((file) => {
  const data = frontMatter(path.join(root, 'content', 'articles', file));
  return { ...data, file, slug: data.slug.replace(/^\/articles\//, '').replace(/\/$/, '') };
});

// Translated markdown articles: content/i18n/<lang>/*.md with front matter "en: <english slug>" and "slug: <localized slug>".
export const MD_TRANSLATIONS = {}; // enSlug -> { lang: { slug, file } }
for (const lang of Object.keys(LANGS)) {
  const dir = path.join(root, 'content', 'i18n', lang);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const data = frontMatter(path.join(dir, file));
    if (!data.en || !data.slug) continue;
    (MD_TRANSLATIONS[data.en] ||= {})[lang] = { slug: data.slug, file: path.join(dir, file) };
  }
}
export const localizedSlug = (enSlug, lang) => (enSlug === HAND_BUILT_ARTICLE ? ARTICLE_SLUGS[lang] : MD_TRANSLATIONS[enSlug]?.[lang]?.slug);

// English path -> function(lang) returning the localized path (or undefined when that language has no version).
const PAGES = {
  '/': (l) => `/${l}/`,
  '/articles/': (l) => `/${l}/articles/`,
  '/about/': (l) => `/${l}/about/`,
  '/editorial-policy/': (l) => `/${l}/editorial-policy/`,
  '/medical-disclaimer/': (l) => `/${l}/medical-disclaimer/`,
  '/features.html': (l) => `/${l}/features/`,
  '/how-to-use.html': (l) => `/${l}/how-to-use/`,
  '/faq.html': (l) => `/${l}/faq/`,
  '/privacy.html': (l) => `/${l}/privacy/`
};
for (const article of EN_ARTICLES) {
  PAGES[`/articles/${article.slug}/`] = (l) => (localizedSlug(article.slug, l) ? `/${l}/articles/${localizedSlug(article.slug, l)}/` : undefined);
}

export const alternatesFor = (enPath) => {
  if (!PAGES[enPath]) return null;
  const entries = Object.keys(LANGS).map((l) => [l, PAGES[enPath](l)]).filter(([, href]) => href);
  return entries.length ? Object.fromEntries(entries) : null;
};

export const hreflangTags = (enPath) => {
  const alt = alternatesFor(enPath);
  if (!alt) return '';
  return `<link rel="alternate" hreflang="en" href="${site}${enPath}">`
    + Object.entries(alt).map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${site}${p}">`).join('')
    + `<link rel="alternate" hreflang="x-default" href="${site}${enPath}">`;
};

// Footer language switcher for a localized page: links to the same page in every other language.
export const langRow = (enPath, current) => {
  const alt = alternatesFor(enPath) || {};
  const items = [['en', 'English', enPath], ...Object.entries(LANGS).map(([l, v]) => [l, v.name, alt[l]])]
    .filter(([l, , href]) => l !== current && href);
  return `<p class="lang-row" style="display:flex;flex-wrap:wrap;gap:.35rem .9rem;margin:.6rem 0 0;font-size:.85rem">${items.map(([l, name, href]) => `<a href="${href}" hreflang="${l}" lang="${l}">${name}</a>`).join('')}</p>`;
};

export const localizedPaths = () => Object.keys(LANGS).flatMap((l) => Object.values(PAGES).map((f) => f(l))).filter(Boolean);
