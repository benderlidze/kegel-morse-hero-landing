// Workout section: /workouts/ hub, one page per program and one page per exercise, in English and in every language that has
// content/workouts/i18n/<lang>.json. Source: content/workouts/workouts.json ("publish": false = noindex prototype).
// Pictures: assets/workouts/<character>/<id>.webp (anatomy = grey figure with red muscles, woman = flat vector woman;
// made with scripts/make-workout-images.py from the carousel factory in E:/kmh-video-gen).
// Chrome: English pages borrow header/footer from a built article (so they follow build-blog.mjs); localized pages
// get their nav labels from scripts/i18n/<lang>.mjs. Run after build-blog.mjs (it reads urls.json, and the article chrome).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { data, PUBLISH, loadTr, programPath, exercisePath, hubPath, prefix } from './lib/workouts-data.mjs';
import { site, LANGS, hreflangTags, langRow, LANG_MENU } from './i18n/routes.mjs';
import ru from './i18n/ru.mjs';
import pl from './i18n/pl.mjs';
import de from './i18n/de.mjs';
import es from './i18n/es.mjs';
import fr from './i18n/fr.mjs';
import uk from './i18n/uk.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODS = { ru, pl, de, es, fr, uk };
const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));

// English UI strings; every language file content/workouts/i18n/<lang>.json has the same keys under "ui".
export const EN_UI = {
  navWorkouts: 'Workouts',
  hubTitle: 'Pelvic Floor Workouts with Pictures',
  hubDescription: 'Pelvic floor and Kegel workouts for men and women with pictures: every move shows the start and finish position, the muscles it works and the reps.',
  hubH1: 'Pelvic floor workouts with pictures',
  hubLede: "Short routines you can do at home, for men and for women. Every exercise has a start and finish picture, three cues and the reps; the men's routines show the working muscles highlighted.",
  groupMen: 'For men', groupWomen: 'For women', allExercises: 'All exercises',
  cardMeta: '{n} exercises · ~{m} min · {level}',
  eyebrowMen: 'Workout for men · {n} exercises · ~{m} min', eyebrowWomen: 'Workout for women · {n} exercises · ~{m} min',
  levels: { Beginner: 'Beginner', Easy: 'Easy', Intermediate: 'Intermediate' },
  equipmentNone: 'No equipment', equipmentBall: 'A small ball or pillow', atHome: 'At home', minutes: '{m} minutes',
  theWorkout: 'The workout', sliderAria: 'Workout slides, use arrow keys', slideLabel: '{i} of {n}: {name}',
  prevExercise: 'Previous exercise', nextExercise: 'Next exercise', details: 'Details ↓',
  works: 'Works', start: 'Start', finish: 'Finish', mistake: 'Common mistake:', instead: 'Instead:',
  howRoutine: 'How to do this routine',
  appH2: 'Time your Kegels with Kegel Morse Hero',
  appP: 'The app guides each squeeze and release with a ring and haptics, so you can train the Kegel part of this routine eyes-free. No account, no ads.',
  safety: 'Not medical advice. Stop if anything hurts. If you have pain, leaking or other symptoms, or have had pelvic surgery, see a doctor or a pelvic floor physiotherapist first.',
  safetyLink: 'Medical disclaimer',
  prev: '← Previous', next: 'Next →', moreAria: 'More workouts', beforeStart: 'Before you start:', breadcrumbAria: 'Breadcrumb',
  exerciseEyebrow: 'Exercise · {reps}', exerciseH1: '{name}: how to do it (with pictures)', exerciseTitle: '{name}: How to Do It (With Pictures)',
  exerciseDesc: '{name}: {short}. Three technique cues, the muscles it works, reps and a common mistake, with pictures.',
  howToDo: 'How to do it', inThese: 'In these workouts', howToName: 'How to do the {nameLower}',
  altPair: 'start and finish position', altSingle: 'position', altAnatomy: '{name}: {pos}, {works} highlighted', altFlat: '{name}: {pos}',
  std: ['Do the moves in order, once through.', 'Rest about 30 seconds between moves.', 'Three to four times a week is a good start; quality beats speed.'],
  muscles: {},
};

// ---------- chrome ----------
const sample = await readFile(path.join(root, 'articles', 'best-kegel-apps-for-men', 'index.html'), 'utf8');
const grab = (re) => { const m = sample.match(re); if (!m) throw new Error('not found in sample page: ' + re); return m[0]; };
const EN_HEADER = grab(/<a class="skip-link"[\s\S]*?<\/header>/).replace(/ aria-current="page"/g, '');
const EN_FOOTER = grab(/<footer class="site-footer">[\s\S]*?<\/footer>/);
const EN_STORE = grab(/<span class="store-btns">[\s\S]*?<\/span><\/a><\/span>/);

const appStore = 'https://apps.apple.com/app/id6761460873';
const playBase = 'https://play.google.com/store/apps/details?id=com.serhii.KegelMorseHero';
const playGlyph = '<svg viewBox="0 0 24 24"><path d="M3.6 1.8c-.3.2-.5.6-.5 1.1v18.2c0 .5.2.9.5 1.1l10-10.2zM14.7 11.9l2.8-2.8L5.1 2l9.6 9.9zm0 .2L5.1 22l12.4-7.1zM18.6 9.7l-3 3 3 3 3.4-2c.9-.5.9-1.6 0-2.1z"/></svg>';
const appleGlyph = '<svg viewBox="0 0 24 24"><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.09-.46 1.6-1.534 3.16-.918 1.35-1.866 2.7-3.36 2.72-1.466.03-1.937-.87-3.61-.87-1.673 0-2.197.84-3.583.9-1.444.05-2.55-1.46-3.475-2.81-1.89-2.74-3.34-7.74-1.4-11.12.964-1.66 2.687-2.71 4.555-2.74 1.435-.03 2.79.97 3.671.97.88 0 2.539-1.2 4.275-1.02.726.03 2.756.295 4.057 2.225-.105.066-2.422 1.418-2.395 4.236.03 3.378 2.965 4.5 3.001 4.51z"/></svg>';

function chrome(lang, T) {
  if (lang === 'en') return { header: EN_HEADER, footer: EN_FOOTER, store: EN_STORE, home: 'Home' };
  const u = MODS[lang].ui, base = `/${lang}`, play = `${playBase}&hl=${lang}`;
  const btn = (href, glyph, eyebrow, name) => `<a class="store-btn" href="${href}" target="_blank" rel="noopener">${glyph}<span class="store-label"><span class="store-eyebrow">${esc(eyebrow)}</span><span class="store-name">${name}</span></span></a>`;
  const store = `<span class="store-btns">${btn(appStore, appleGlyph, u.storeApple, 'App Store')}${btn(play, playGlyph, u.storePlay, 'Google Play')}</span>`;
  const nav = [[`${base}/`, u.nav.home], [`${base}/articles/`, u.nav.articles], [hubPath(lang), T.navWorkouts], [`${base}/features/`, u.nav.features], [`${base}/how-to-use/`, u.nav.howto], [`${base}/faq/`, u.nav.faq], [`${base}/privacy/`, u.nav.privacy]];
  return {
    home: u.nav.home, enHub: '/workouts/',
    header: (enPath) => `
<a class="skip-link" href="#main">${esc(u.skip)}</a>
<header class="site-header"><div class="header-inner">
  <a class="brand" href="${base}/"><img src="/assets/logo-96.png" width="96" height="96" alt="${esc(u.logoAlt)}"><span>Kegel Morse Hero</span></a>
  <nav class="site-nav" aria-label="${esc(u.navAria)}">
    ${nav.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('')}<a href="${enPath}" hreflang="en" lang="en">English</a>
    <a class="download-link" href="${appStore}" target="_blank" rel="noopener">App Store</a><a class="download-link download-link-android" href="${play}" target="_blank" rel="noopener">Google Play</a>
    ${LANG_MENU}
  </nav>
</div></header>`,
    footer: (enPath) => `
<footer class="site-footer"><div class="footer-inner">
  <div><a class="brand" href="${base}/"><img src="/assets/logo-96.png" width="96" height="96" loading="lazy" alt="${esc(u.logoAlt)}"><span>Kegel Morse Hero</span></a><p class="copyright">© 2026 Kegel Morse Hero</p>${langRow(enPath, lang)}</div>
  <nav class="footer-links" aria-label="${esc(u.footerAria)}"><a href="${base}/articles/">${esc(u.nav.articles)}</a><a href="${hubPath(lang)}">${esc(T.navWorkouts)}</a><a href="${base}/features/">${esc(u.nav.features)}</a><a href="${base}/how-to-use/">${esc(u.nav.howto)}</a><a href="${base}/faq/">${esc(u.nav.faq)}</a><a href="${base}/privacy/">${esc(u.nav.privacy)}</a><a href="${base}/about/">${esc(u.nav.about)}</a><a href="${base}/editorial-policy/">${esc(u.nav.editorial)}</a><a href="${base}/medical-disclaimer/">${esc(u.nav.disclaimer)}</a></nav>
</div></footer>`,
    store,
  };
}

const GROUPS = [{ character: 'anatomy', key: 'groupMen', eyebrow: 'eyebrowMen' }, { character: 'woman', key: 'groupWomen', eyebrow: 'eyebrowWomen' }];
const pc = (character) => (character === 'woman' ? ' pic-woman' : ''); // the flat woman wears dark clothes: light card
const src = (id, character) => `/assets/workouts/${character}/${id}.webp`;
const programsOf = (id) => data.programs.filter((p) => p.items.includes(id));

// ---------- one language ----------
async function buildLang(lang) {
  const tr = loadTr(lang);
  const T = lang === 'en' ? EN_UI : tr.ui;
  const C = chrome(lang, T);
  const meta = LANGS[lang];
  const homeHref = `${prefix(lang)}/`;
  const hubHref = hubPath(lang);
  const medHref = lang === 'en' ? '/medical-disclaimer/' : `/${lang}/medical-disclaimer/`;

  const ex = (id) => {
    const e = data.exercises[id];
    if (lang === 'en') return e;
    return { ...e, ...tr.exercises[id], works: e.works.map((w) => T.muscles[w] || w) };
  };
  const prog = (p) => {
    if (lang === 'en') return p;
    const t = tr.programs[p.slug];
    return { ...p, title: t.title, h1: t.h1, description: t.description, lede: t.lede, note: t.note, howTo: [T.std[0], T.std[1], t.howTo, T.std[2]] };
  };
  const equipmentChip = (p) => (!p.equipment || p.equipment === 'None' ? T.equipmentNone : T.equipmentBall);
  const hdr = (enPath) => (lang === 'en' ? C.header : C.header(enPath));
  const ftr = (enPath) => (lang === 'en' ? C.footer : C.footer(enPath));

  const head = ({ title, description, path: pagePath, enPath, jsonLd = '' }) => {
    const canonical = `${site}${pagePath}`;
    return `<!doctype html><html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta name="robots" content="${PUBLISH ? 'index,follow,max-image-preview:large' : 'noindex,follow'}">
<meta name="theme-color" content="#070a0b"><link rel="canonical" href="${canonical}">${hreflangTags(enPath)}
<link rel="icon" href="/assets/favicon-48.png" type="image/png" sizes="48x48"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:type" content="article">${meta ? `<meta property="og:locale" content="${meta.og}">` : ''}<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/blog/blog.css"><link rel="stylesheet" href="/assets/workouts/workouts.css">
${jsonLd}</head>`;
  };

  const img = (id, e, character, lazy = true) => {
    const pos = e.single ? T.altSingle : T.altPair;
    const works = lang === 'en' ? e.works.join(', ').toLowerCase() : e.works.join(', ');
    const alt = character === 'woman' ? fill(T.altFlat, { name: e.name, pos }) : fill(T.altAnatomy, { name: e.name, pos, works });
    return `<img src="${src(id, character)}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
  };
  const safety = `<p class="wk-safety">${esc(T.safety)} <a href="${medHref}">${esc(T.safetyLink)}</a>.</p>`;
  const appBlock = `<section class="wk-app"><h2>${esc(T.appH2)}</h2><p>${esc(T.appP)}</p>${C.store}</section>`;
  const crumbs = (last) => `<nav class="breadcrumbs" aria-label="${esc(T.breadcrumbAria)}"><a href="${homeHref}">${esc(C.home)}</a> › ${last ? `<a href="${hubHref}">${esc(T.navWorkouts)}</a> › ${esc(last)}` : esc(T.navWorkouts)}</nav>`;
  const works = (e) => `<p class="wk-works"><span>${esc(T.works)}</span>${e.works.map((w) => `<em>${esc(w)}</em>`).join('')}</p>`;
  const mistake = (e) => (e.mistake ? `<p class="wk-mistake"><b>${esc(T.mistake)}</b> ${esc(e.mistake.wrong)}. <b>${esc(T.instead)}</b> ${esc(e.mistake.right)}.</p>` : '');
  const tip = (e) => (e.tip ? `<p class="wk-tip">${esc(e.tip)}</p>` : '');

  function programPage(p0) {
    const p = prog(p0), ch = p0.character, path_ = programPath(lang, p0.slug), enPath = programPath('en', p0.slug);
    const items = p0.items.map((id) => [id, ex(id)]);
    const n = items.length;
    const slides = items.map(([id, e], i) => `<div class="wk-slide" id="slide-${id}" role="group" aria-roledescription="slide" aria-label="${esc(fill(T.slideLabel, { i: i + 1, n, name: e.name }))}">
    <div class="wk-slide-pic${pc(ch)}">${img(id, e, ch, i > 0)}</div>
    <div class="wk-slide-text"><p class="wk-slide-count">${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</p><h3>${esc(e.name)}</h3><p class="wk-slide-reps">${esc(e.reps)}</p>
      <p class="wk-works">${e.works.map((w) => `<em>${esc(w)}</em>`).join('')}</p>
      <ol class="wk-cues">${e.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ol><a class="wk-more" href="#${id}">${esc(T.details)}</a></div></div>`).join('');
    const tabs = items.map(([id, e], i) => `<button type="button" class="wk-tab${pc(ch)}${i ? '' : ' is-active'}" data-i="${i}" aria-label="${esc(e.name)}"${i ? '' : ' aria-current="true"'}>${img(id, e, ch, false)}<span>${i + 1}</span><i></i></button>`).join('');
    const slider = `<div class="wk-slider" data-n="${n}">
  <div class="wk-track" tabindex="0" aria-label="${esc(T.sliderAria)}">${slides}</div>
  <div class="wk-controls"><button type="button" class="wk-arrow wk-prev" aria-label="${esc(T.prevExercise)}">←</button><span class="wk-counter"><b>1</b> / ${n}</span><button type="button" class="wk-arrow wk-next" aria-label="${esc(T.nextExercise)}">→</button></div>
  <div class="wk-tabs">${tabs}</div>
</div>`;
    const steps = items.map(([id, e], i) => `
<section class="wk-ex" id="${id}">
  <div class="wk-ex-head"><span class="wk-num">${i + 1}</span><div><h2><a href="${exercisePath(lang, id)}">${esc(e.name)}</a></h2><p>${esc(e.short)}</p></div><span class="wk-reps">${esc(e.reps)}</span></div>
  <figure class="wk-figure${pc(ch)}">${img(id, e, ch)}${e.single ? '' : `<figcaption><span>${esc(T.start)}</span><span>${esc(T.finish)}</span></figcaption>`}</figure>
  ${works(e)}
  <ol class="wk-cues">${e.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>
  ${mistake(e)}
  ${tip(e)}
</section>`).join('');
    const jsonLd = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'HowTo', inLanguage: lang, name: p.title, description: p.description, totalTime: `PT${p0.minutes}M`,
      step: items.map(([id, e], i) => ({ '@type': 'HowToStep', position: i + 1, name: e.name, text: `${e.cues.join('. ')}. ${e.reps}.`, image: `${site}${src(id, ch)}`, url: `${site}${path_}#${id}` })),
    }).replace(/</g, '\\u003c')}</script>`;
    const sib = data.programs.filter((q) => q.character === ch);
    const at = sib.findIndex((q) => q.slug === p0.slug);
    const pv = sib[(at - 1 + sib.length) % sib.length], nx = sib[(at + 1) % sib.length];
    const pn = sib.length > 1 ? `<nav class="wk-pn" aria-label="${esc(T.moreAria)}"><a href="${programPath(lang, pv.slug)}"><span>${esc(T.prev)}</span>${esc(prog(pv).title)}</a><a href="${programPath(lang, nx.slug)}"><span>${esc(T.next)}</span>${esc(prog(nx).title)}</a></nav>` : '';
    const g = GROUPS.find((x) => x.character === ch);
    return `${head({ title: `${p.title} | Kegel Morse Hero`, description: p.description, path: path_, enPath, jsonLd })}<body>${hdr(enPath)}
${crumbs(p.title.split(':')[0])}
<main id="main" class="wk">
<header class="wk-hero"><p class="eyebrow">${esc(fill(T[g.eyebrow], { n, m: p0.minutes }))}</p><h1>${esc(p.h1)}</h1><p class="lede">${esc(p.lede)}</p>
${p.note ? `<p class="wk-note"><b>${esc(T.beforeStart)}</b> ${esc(p.note)}</p>` : ''}
<p class="wk-chips"><span>${esc(T.levels[p0.level] || p0.level)}</span><span>${esc(equipmentChip(p0))}</span><span>${esc(T.atHome)}</span><span>${esc(fill(T.minutes, { m: p0.minutes }))}</span></p></header>
<section class="wk-glance" aria-label="${esc(T.theWorkout)}"><h2>${esc(T.theWorkout)}</h2>${slider}</section>
${steps}
<section class="wk-how"><h2>${esc(T.howRoutine)}</h2><ul>${p.howTo.map((h) => `<li>${esc(h)}</li>`).join('')}</ul></section>
${appBlock}
${pn}
${safety}
</main>${ftr(enPath)}<script src="/assets/workouts/slider.js" defer></script></body></html>`;
  }

  function exercisePage(id) {
    const e = ex(id), path_ = exercisePath(lang, id), enPath = exercisePath('en', id);
    const short = lang === 'en' ? `${e.short.charAt(0).toLowerCase()}${e.short.slice(1)}` : e.short;
    const title = fill(T.exerciseTitle, { name: e.name });
    const description = fill(T.exerciseDesc, { name: e.name, short });
    const jsonLd = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'HowTo', inLanguage: lang, name: fill(T.howToName, { name: e.name, nameLower: e.name.toLowerCase() }), description,
      image: `${site}${src(id, 'anatomy')}`, step: e.cues.map((c, i) => ({ '@type': 'HowToStep', position: i + 1, text: c })),
    }).replace(/</g, '\\u003c')}</script>`;
    const list = GROUPS.map((g) => {
      const ps = programsOf(id).filter((p) => p.character === g.character);
      return ps.length ? `<h3>${esc(T[g.key])}</h3><ul>${ps.map((p) => `<li><a href="${programPath(lang, p.slug)}">${esc(prog(p).title)}</a></li>`).join('')}</ul>` : '';
    }).join('');
    return `${head({ title: `${title} | Kegel Morse Hero`, description, path: path_, enPath, jsonLd })}<body>${hdr(enPath)}
${crumbs(e.name)}
<main id="main" class="wk">
<header class="wk-hero"><p class="eyebrow">${esc(fill(T.exerciseEyebrow, { reps: e.reps }))}</p><h1>${esc(fill(T.exerciseH1, { name: e.name }))}</h1><p class="lede">${esc(e.short)}.</p></header>
<figure class="wk-figure big">${img(id, e, 'anatomy', false)}${e.single ? '' : `<figcaption><span>${esc(T.start)}</span><span>${esc(T.finish)}</span></figcaption>`}</figure>
${works(e)}
<section class="wk-how"><h2>${esc(T.howToDo)}</h2><ol class="wk-cues">${e.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ol><p class="wk-slide-reps">${esc(e.reps)}</p>
${mistake(e)}
${tip(e)}</section>
<section class="wk-how wk-in"><h2>${esc(T.inThese)}</h2>${list}</section>
${appBlock}
${safety}
</main>${ftr(enPath)}</body></html>`;
  }

  function hubPage() {
    const enPath = hubPath('en');
    const card = (p0) => {
      const p = prog(p0), first = p0.items[0] === 'kegelLying' ? p0.items[1] : p0.items[0];
      return `<a class="wk-card" href="${programPath(lang, p0.slug)}">${img(first, ex(first), p0.character).replace('<img ', `<img class="${pc(p0.character).trim()}" `)}<b>${esc(p.title)}</b><span>${esc(fill(T.cardMeta, { n: p0.items.length, m: p0.minutes, level: T.levels[p0.level] || p0.level }))}</span></a>`;
    };
    const groups = GROUPS.map((g) => `<section class="wk-group"><h2>${esc(T[g.key])}</h2><div class="wk-cards">${data.programs.filter((p) => p.character === g.character).map(card).join('')}</div></section>`).join('');
    const all = Object.keys(data.exercises).map((id) => [id, ex(id).name]).sort((a, b) => a[1].localeCompare(b[1], lang))
      .map(([id, name]) => `<li><a href="${exercisePath(lang, id)}">${esc(name)}</a></li>`).join('');
    return `${head({ title: `${T.hubTitle} | Kegel Morse Hero`, description: T.hubDescription, path: hubHref, enPath })}<body>${hdr(enPath)}
<main id="main" class="wk"><header class="wk-hero"><p class="eyebrow">${esc(T.navWorkouts)}</p><h1>${esc(T.hubH1)}</h1><p class="lede">${esc(T.hubLede)}</p></header>
${groups}
<section class="wk-group"><h2>${esc(T.allExercises)}</h2><ul class="wk-links">${all}</ul></section></main>${ftr(enPath)}</body></html>`;
  }

  const out = async (urlPath, html) => {
    const dir = path.join(root, urlPath);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), html, 'utf8');
  };
  await out(hubHref, hubPage());
  for (const p of data.programs) await out(programPath(lang, p.slug), programPage(p));
  for (const id of Object.keys(data.exercises)) await out(exercisePath(lang, id), exercisePage(id));
  return 1 + data.programs.length + Object.keys(data.exercises).length;
}

const langs = ['en', ...Object.keys(LANGS).filter((l) => loadTr(l))];
let total = 0;
for (const l of langs) total += await buildLang(l);

// URL list for the sitemap (build-blog.mjs reads it; localized URLs come from scripts/i18n/routes.mjs)
const enUrl = (id) => exercisePath('en', id);
const sitemapUrls = PUBLISH ? [['/workouts/', '.8', 'weekly', data.updated],
  ...data.programs.map((p) => [programPath('en', p.slug), '.7', 'monthly', data.updated]),
  ...Object.keys(data.exercises).map((id) => [enUrl(id), '.6', 'monthly', data.updated])] : [];
await writeFile(path.join(root, 'content', 'workouts', 'urls.json'), JSON.stringify(sitemapUrls) + '\n', 'utf8');
console.log(`Built /workouts/: ${total} pages in ${langs.join(', ')}${PUBLISH ? '' : ' (noindex prototype, not in sitemap)'}.`);
