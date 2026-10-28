import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { EN_ARTICLES, LANGS, MD_TRANSLATIONS, localizedSlug } from './i18n/routes.mjs';

const errors = [];
const languages = Object.keys(LANGS);
const expectedAlternates = languages.length + 2; // English, every locale, and x-default.

const fail = (message) => errors.push(message);

for (const article of EN_ARTICLES) {
  const enFile = path.join('articles', article.slug, 'index.html');
  if (!existsSync(enFile)) {
    fail(`Missing English page: ${enFile}`);
    continue;
  }

  const enHtml = readFileSync(enFile, 'utf8');
  const alternateCount = (enHtml.match(/rel="alternate" hreflang=/g) || []).length;
  if (alternateCount !== expectedAlternates) {
    fail(`${enFile}: expected ${expectedAlternates} hreflang links, found ${alternateCount}`);
  }

  for (const language of languages) {
    const slug = localizedSlug(article.slug, language);
    if (!slug) {
      fail(`Missing ${language} route for ${article.slug}`);
      continue;
    }

    const pageFile = path.join(language, 'articles', slug, 'index.html');
    if (!existsSync(pageFile)) {
      fail(`Missing generated page: ${pageFile}`);
      continue;
    }

    const html = readFileSync(pageFile, 'utf8');
    if (!html.includes(`<html lang="${language}">`)) fail(`${pageFile}: incorrect html lang`);
    if (!html.includes(`<link rel="canonical" href="https://kegelmorsehero.com/${language}/articles/${slug}/">`)) {
      fail(`${pageFile}: incorrect canonical URL`);
    }
    if (html.includes('\uFFFD')) fail(`${pageFile}: replacement character found`);

    const localizedAlternates = (html.match(/rel="alternate" hreflang=/g) || []).length;
    if (localizedAlternates !== expectedAlternates) {
      fail(`${pageFile}: expected ${expectedAlternates} hreflang links, found ${localizedAlternates}`);
    }
  }
}

for (const [englishSlug, translations] of Object.entries(MD_TRANSLATIONS)) {
  for (const [language, translation] of Object.entries(translations)) {
    const markdown = readFileSync(translation.file, 'utf8');
    const h1Count = (markdown.match(/^#\s+/gm) || []).length;
    if (h1Count !== 1) fail(`${translation.file}: expected one H1, found ${h1Count}`);
    if (!/^meta_title:\s*".+"$/m.test(markdown)) fail(`${translation.file}: missing meta_title`);
    if (!/^meta_description:\s*".+"$/m.test(markdown)) fail(`${translation.file}: missing meta_description`);
    if (markdown.includes('\uFFFD')) fail(`${translation.file}: replacement character found`);
    if (!localizedSlug(englishSlug, language)) fail(`${translation.file}: route was not registered`);
  }
}

for (const language of languages) {
  const articleRoot = path.join(language, 'articles');
  for (const entry of readdirSync(articleRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pageFile = path.join(articleRoot, entry.name, 'index.html');
    if (!existsSync(pageFile)) continue;
    const html = readFileSync(pageFile, 'utf8');
    for (const match of html.matchAll(/href="\/(ru|pl|de|es|fr|uk)\/articles\/([^"?#]+)\//g)) {
      const target = path.join(match[1], 'articles', match[2], 'index.html');
      if (!existsSync(target)) fail(`${pageFile}: broken localized link /${match[1]}/articles/${match[2]}/`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const localizedCount = languages.length * EN_ARTICLES.length;
console.log(`Validated ${localizedCount}/${localizedCount} localized article routes across ${languages.length} languages.`);
console.log('Checked source metadata, H1s, encoding, generated pages, canonicals, hreflang, and localized internal links.');
