// Shared by scripts/build-workouts.mjs and scripts/i18n/routes.mjs: workout data, slugs, translations.
//   content/workouts/workouts.json            English source (exercises, programs, "publish" flag)
//   content/workouts/i18n/<lang>.json         translation per language (ui strings + exercises + programs)
// URLs: English /workouts/<slug>/ and /workouts/exercises/<slug>/; localized /<lang>/workouts/<localized slug>/ ...
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const data = JSON.parse(readFileSync(path.join(root, 'content', 'workouts', 'workouts.json'), 'utf8'));
export const PUBLISH = data.publish === true;

const CYR = {
  а: 'a', б: 'b', в: 'v', г: 'g', ґ: 'g', д: 'd', е: 'e', є: 'ye', ё: 'e', ж: 'zh', з: 'z', и: 'i', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};
// ASCII slug: Cyrillic transliterated, accents stripped, everything else -> "-"
export function slugify(text) {
  let s = String(text).toLowerCase().replace(/['’`]/g, '').replace(/ß/g, 'ss').replace(/ł/g, 'l').replace(/œ/g, 'oe').replace(/æ/g, 'ae');
  s = [...s].map((ch) => (CYR[ch] !== undefined ? CYR[ch] : ch)).join('');
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return s.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const cut = (slug, max = 70) => (slug.length <= max ? slug : slug.slice(0, max).replace(/-[^-]*$/, ''));

// English exercise slug from the exercise name: "Child's Pose" -> childs-pose
export const exSlugEn = (id) => slugify(data.exercises[id].name);

const trCache = {};
export function loadTr(lang) {
  if (lang === 'en') return null;
  if (!(lang in trCache)) {
    const file = path.join(root, 'content', 'workouts', 'i18n', `${lang}.json`);
    trCache[lang] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  }
  return trCache[lang];
}

// Pixel size of a WebP file (VP8 / VP8L / VP8X headers), so <img> tags can carry width/height (no layout shift).
const sizeCache = {};
export function webpSize(webPath) {
  if (webPath in sizeCache) return sizeCache[webPath];
  const file = path.join(root, webPath.replace(/^\//, ''));
  let size = null;
  if (existsSync(file)) {
    const b = readFileSync(file);
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8X') size = { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    else if (kind === 'VP8 ') size = { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    else if (kind === 'VP8L') { const bits = b.readUInt32LE(21); size = { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 }; }
  }
  return (sizeCache[webPath] = size);
}

// Long-form exercise guide: content/workouts/guides/<lang>/<exerciseId>.json (optional, per language).
export function loadGuide(lang, id) {
  const file = path.join(root, 'content', 'workouts', 'guides', lang, `${id}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

// Localized slugs: from the translated title (part before ":"), full title when two programs would collide.
const slugCache = {};
function slugsFor(lang) {
  if (slugCache[lang]) return slugCache[lang];
  const tr = loadTr(lang);
  const out = { programs: {}, exercises: {} };
  if (tr) {
    const short = {}, full = {}, count = {};
    for (const p of data.programs) {
      const t = tr.programs[p.slug].title;
      short[p.slug] = cut(slugify(t.split(':')[0])); full[p.slug] = cut(slugify(t), 90);
      count[short[p.slug]] = (count[short[p.slug]] || 0) + 1;
    }
    for (const p of data.programs) out.programs[p.slug] = count[short[p.slug]] > 1 ? full[p.slug] : short[p.slug];
    for (const id of Object.keys(data.exercises)) out.exercises[id] = slugify(tr.exercises[id].name);
    for (const kind of ['programs', 'exercises']) {
      const vals = Object.values(out[kind]);
      if (new Set(vals).size !== vals.length || vals.some((v) => !v)) throw new Error(`workouts i18n ${lang}: duplicate or empty ${kind} slugs`);
    }
  }
  return (slugCache[lang] = out);
}
export const programSlug = (lang, slug) => (lang === 'en' ? slug : slugsFor(lang).programs[slug]);
export const exerciseSlug = (lang, id) => (lang === 'en' ? exSlugEn(id) : slugsFor(lang).exercises[id]);
export const prefix = (lang) => (lang === 'en' ? '' : `/${lang}`);
export const hubPath = (lang) => `${prefix(lang)}/workouts/`;
export const programPath = (lang, slug) => `${prefix(lang)}/workouts/${programSlug(lang, slug)}/`;
export const exercisePath = (lang, id) => `${prefix(lang)}/workouts/exercises/${exerciseSlug(lang, id)}/`;
