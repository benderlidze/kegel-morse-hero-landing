// Workout section: /workouts/ hub, one page per program and one page per exercise, from content/workouts/workouts.json.
// Pictures: assets/workouts/<character>/<id>.webp  (anatomy = grey figure with red muscles, woman = flat vector woman;
// made with scripts/make-workout-images.py from the carousel factory in E:/kmh-video-gen).
// Header, footer and store buttons are taken from an already built article page, so the section looks like the rest
// of the site without touching build-blog.mjs. While the section is a prototype every page is noindex and stays out
// of the sitemap (set PUBLISH = true when it goes live).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://kegelmorsehero.com';
const data = JSON.parse(await readFile(path.join(root, 'content', 'workouts', 'workouts.json'), 'utf8'));
const PUBLISH = data.publish === true; // "publish": false in workouts.json = noindex prototype
const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// borrow the site chrome from a built article
const sample = await readFile(path.join(root, 'articles', 'best-kegel-apps-for-men', 'index.html'), 'utf8');
const grab = re => { const m = sample.match(re); if (!m) throw new Error('not found in sample page: ' + re); return m[0]; };
const header = grab(/<a class="skip-link"[\s\S]*?<\/header>/).replace(/ aria-current="page"/g, '');
const footer = grab(/<footer class="site-footer">[\s\S]*?<\/footer>/);
const storeButtons = grab(/<span class="store-btns">[\s\S]*?<\/span><\/a><\/span>/);

// exercise page slug from the exercise name: "Child's Pose" -> childs-pose
const slugOf = ex => ex.name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const exSlug = {};
for (const [id, ex] of Object.entries(data.exercises)) {
  exSlug[id] = slugOf(ex);
}
if (new Set(Object.values(exSlug)).size !== Object.keys(exSlug).length) throw new Error('duplicate exercise slugs');
const exUrl = id => `/workouts/exercises/${exSlug[id]}/`;

const GROUPS = [{ character: 'anatomy', title: 'For men' }, { character: 'woman', title: 'For women' }];
const pc = character => (character === 'woman' ? ' pic-woman' : ''); // flat dark-clothed woman needs a light card

const head = ({ title, description, canonical, jsonLd = '' }) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta name="robots" content="${PUBLISH ? 'index,follow,max-image-preview:large' : 'noindex,follow'}">
<meta name="theme-color" content="#070a0b"><link rel="canonical" href="${canonical}">
<link rel="icon" href="/assets/favicon-48.png" type="image/png" sizes="48x48"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/blog/blog.css"><link rel="stylesheet" href="/assets/workouts/workouts.css">
${jsonLd}</head>`;

const src = (id, character) => `/assets/workouts/${character}/${id}.webp`;
const img = (id, ex, character, lazy = true) => {
  const pos = ex.single ? 'position' : 'start and finish position';
  const alt = character === 'woman' ? `${ex.name}: ${pos}` : `${ex.name}: ${pos}, ${ex.works.join(', ').toLowerCase()} highlighted`;
  return `<img src="${src(id, character)}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
};
const safety = `<p class="wk-safety">Not medical advice. Stop if anything hurts. If you have pain, leaking or other symptoms, or have had pelvic surgery, see a doctor or a pelvic floor physiotherapist first. <a href="/medical-disclaimer/">Medical disclaimer</a>.</p>`;
const appBlock = `<section class="wk-app"><h2>Time your Kegels with Kegel Morse Hero</h2><p>The app guides each squeeze and release with a ring and haptics, so you can train the Kegel part of this routine eyes-free. No account, no ads.</p>${storeButtons}</section>`;
const equipmentChip = p => (!p.equipment || p.equipment === 'None' ? 'No equipment' : p.equipment);

const programsOf = id => data.programs.filter(p => p.items.includes(id));

function programPage(p) {
  const canonical = `${site}/workouts/${p.slug}/`;
  const ch = p.character;
  const items = p.items.map(id => [id, data.exercises[id]]);
  const n = items.length;
  // workout slider: one slide per exercise, arrows, counter, thumbnail switches; swipe = native scroll-snap
  const slides = items.map(([id, ex], i) => `<div class="wk-slide" id="slide-${id}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}: ${esc(ex.name)}">
    <div class="wk-slide-pic${pc(ch)}">${img(id, ex, ch, i > 0)}</div>
    <div class="wk-slide-text"><p class="wk-slide-count">${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</p><h3>${esc(ex.name)}</h3><p class="wk-slide-reps">${esc(ex.reps)}</p>
      <p class="wk-works">${ex.works.map(w => `<em>${esc(w)}</em>`).join('')}</p>
      <ol class="wk-cues">${ex.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ol><a class="wk-more" href="#${id}">Details ↓</a></div></div>`).join('');
  const tabs = items.map(([id, ex], i) => `<button type="button" class="wk-tab${pc(ch)}${i ? '' : ' is-active'}" data-i="${i}" aria-label="${esc(ex.name)}"${i ? '' : ' aria-current="true"'}>${img(id, ex, ch, false)}<span>${i + 1}</span><i></i></button>`).join('');
  const slider = `<div class="wk-slider" data-n="${n}">
  <div class="wk-track" tabindex="0" aria-label="Workout slides, use arrow keys">${slides}</div>
  <div class="wk-controls"><button type="button" class="wk-arrow wk-prev" aria-label="Previous exercise">←</button><span class="wk-counter"><b>1</b> / ${n}</span><button type="button" class="wk-arrow wk-next" aria-label="Next exercise">→</button></div>
  <div class="wk-tabs">${tabs}</div>
</div>`;
  const steps = items.map(([id, ex], i) => `
<section class="wk-ex" id="${id}">
  <div class="wk-ex-head"><span class="wk-num">${i + 1}</span><div><h2><a href="${exUrl(id)}">${esc(ex.name)}</a></h2><p>${esc(ex.short)}</p></div><span class="wk-reps">${esc(ex.reps)}</span></div>
  <figure class="wk-figure${pc(ch)}">${img(id, ex, ch)}${ex.single ? '' : '<figcaption><span>Start</span><span>Finish</span></figcaption>'}</figure>
  <p class="wk-works"><span>Works</span>${ex.works.map(w => `<em>${esc(w)}</em>`).join('')}</p>
  <ol class="wk-cues">${ex.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ol>
  ${ex.mistake ? `<p class="wk-mistake"><b>Common mistake:</b> ${esc(ex.mistake.wrong)}. <b>Instead:</b> ${esc(ex.mistake.right)}.</p>` : ''}
  ${ex.tip ? `<p class="wk-tip">${esc(ex.tip)}</p>` : ''}
</section>`).join('');
  const jsonLd = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'HowTo', name: p.title, description: p.description, totalTime: `PT${p.minutes}M`,
    step: items.map(([id, ex], i) => ({ '@type': 'HowToStep', position: i + 1, name: ex.name, text: `${ex.cues.join('. ')}. ${ex.reps}.`, image: `${site}${src(id, ch)}`, url: `${canonical}#${id}` })),
  })}</script>`;
  const sib = data.programs.filter(q => q.character === ch);
  const at = sib.findIndex(q => q.slug === p.slug);
  const prev = sib[(at - 1 + sib.length) % sib.length], next = sib[(at + 1) % sib.length];
  const pn = sib.length > 1 ? `<nav class="wk-pn" aria-label="More workouts"><a href="/workouts/${prev.slug}/"><span>← Previous</span>${esc(prev.title)}</a><a href="/workouts/${next.slug}/"><span>Next →</span>${esc(next.title)}</a></nav>` : '';
  const group = GROUPS.find(g => g.character === ch).title.toLowerCase();
  return `${head({ title: `${p.title} | Kegel Morse Hero`, description: p.description, canonical, jsonLd })}<body>${header}
<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/workouts/">Workouts</a> › ${esc(p.title.split(':')[0])}</nav>
<main id="main" class="wk">
<header class="wk-hero"><p class="eyebrow">Workout ${group} · ${items.length} exercises · ~${p.minutes} min</p><h1>${esc(p.h1)}</h1><p class="lede">${esc(p.lede)}</p>
${p.note ? `<p class="wk-note"><b>Before you start:</b> ${esc(p.note)}</p>` : ''}
<p class="wk-chips"><span>${esc(p.level)}</span><span>${esc(equipmentChip(p))}</span><span>At home</span><span>${p.minutes} minutes</span></p></header>
<section class="wk-glance" aria-label="Workout slides"><h2>The workout</h2>${slider}</section>
${steps}
<section class="wk-how"><h2>How to do this routine</h2><ul>${p.howTo.map(h => `<li>${esc(h)}</li>`).join('')}</ul></section>
${appBlock}
${pn}
${safety}
</main>${footer}<script src="/assets/workouts/slider.js" defer></script></body></html>`;
}

function exercisePage(id) {
  const ex = data.exercises[id];
  const canonical = `${site}${exUrl(id)}`;
  const title = `${ex.name}: How to Do It (With Pictures)`;
  const description = `${ex.name}: ${ex.short.charAt(0).toLowerCase()}${ex.short.slice(1)}. Three technique cues, the muscles it works, reps and a common mistake, with pictures.`;
  const used = programsOf(id);
  const jsonLd = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'HowTo', name: `How to do the ${ex.name.toLowerCase()}`, description,
    image: `${site}${src(id, 'anatomy')}`,
    step: ex.cues.map((c, i) => ({ '@type': 'HowToStep', position: i + 1, text: c })),
  })}</script>`;
  const list = GROUPS.map(g => {
    const ps = used.filter(p => p.character === g.character);
    return ps.length ? `<h3>${g.title}</h3><ul>${ps.map(p => `<li><a href="/workouts/${p.slug}/">${esc(p.title)}</a></li>`).join('')}</ul>` : '';
  }).join('');
  return `${head({ title: `${title} | Kegel Morse Hero`, description, canonical, jsonLd })}<body>${header}
<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/workouts/">Workouts</a> › ${esc(ex.name)}</nav>
<main id="main" class="wk">
<header class="wk-hero"><p class="eyebrow">Exercise · ${esc(ex.reps)}</p><h1>${esc(ex.name)}: how to do it (with pictures)</h1><p class="lede">${esc(ex.short)}.</p></header>
<figure class="wk-figure big">${img(id, ex, 'anatomy', false)}${ex.single ? '' : '<figcaption><span>Start</span><span>Finish</span></figcaption>'}</figure>
<p class="wk-works"><span>Works</span>${ex.works.map(w => `<em>${esc(w)}</em>`).join('')}</p>
<section class="wk-how"><h2>How to do it</h2><ol class="wk-cues">${ex.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ol><p class="wk-slide-reps">${esc(ex.reps)}</p>
${ex.mistake ? `<p class="wk-mistake"><b>Common mistake:</b> ${esc(ex.mistake.wrong)}. <b>Instead:</b> ${esc(ex.mistake.right)}.</p>` : ''}
${ex.tip ? `<p class="wk-tip">${esc(ex.tip)}</p>` : ''}</section>
<section class="wk-how wk-in"><h2>In these workouts</h2>${list}</section>
${appBlock}
${safety}
</main>${footer}</body></html>`;
}

function hubPage() {
  const canonical = `${site}/workouts/`;
  const card = p => {
    const first = p.items[0] === 'kegelLying' ? p.items[1] : p.items[0];
    return `<a class="wk-card" href="/workouts/${p.slug}/">${img(first, data.exercises[first], p.character).replace('<img ', `<img class="${pc(p.character).trim()}" `)}<b>${esc(p.title)}</b><span>${p.items.length} exercises · ~${p.minutes} min · ${esc(p.level)}</span></a>`;
  };
  const groups = GROUPS.map(g => `<section class="wk-group"><h2>${g.title}</h2><div class="wk-cards">${data.programs.filter(p => p.character === g.character).map(card).join('')}</div></section>`).join('');
  const all = Object.keys(data.exercises).sort((a, b) => data.exercises[a].name.localeCompare(data.exercises[b].name))
    .map(id => `<li><a href="${exUrl(id)}">${esc(data.exercises[id].name)}</a></li>`).join('');
  return `${head({ title: 'Pelvic Floor Workouts with Pictures | Kegel Morse Hero', description: 'Pelvic floor and Kegel workouts for men and women with pictures: every move shows the start and finish position, the muscles it works and the reps.', canonical })}<body>${header}
<main id="main" class="wk"><header class="wk-hero"><p class="eyebrow">Workouts</p><h1>Pelvic floor workouts with pictures</h1><p class="lede">Short routines you can do at home, for men and for women. Every exercise has a start and finish picture, three cues and the reps; the men's routines show the working muscles highlighted.</p></header>
${groups}
<section class="wk-group"><h2>All exercises</h2><ul class="wk-links">${all}</ul></section></main>${footer}</body></html>`;
}

await mkdir(path.join(root, 'workouts'), { recursive: true });
await writeFile(path.join(root, 'workouts', 'index.html'), hubPage(), 'utf8');
for (const p of data.programs) {
  await mkdir(path.join(root, 'workouts', p.slug), { recursive: true });
  await writeFile(path.join(root, 'workouts', p.slug, 'index.html'), programPage(p), 'utf8');
}
for (const id of Object.keys(data.exercises)) {
  await mkdir(path.join(root, 'workouts', 'exercises', exSlug[id]), { recursive: true });
  await writeFile(path.join(root, 'workouts', 'exercises', exSlug[id], 'index.html'), exercisePage(id), 'utf8');
}
// URL list for the sitemap (build-blog.mjs reads it; empty while the section is a noindex prototype)
const sitemapUrls = PUBLISH ? [['/workouts/', '.8', 'weekly', data.updated],
  ...data.programs.map(p => [`/workouts/${p.slug}/`, '.7', 'monthly', data.updated]),
  ...Object.keys(data.exercises).map(id => [exUrl(id), '.6', 'monthly', data.updated])] : [];
await writeFile(path.join(root, 'content', 'workouts', 'urls.json'), JSON.stringify(sitemapUrls) + '\n', 'utf8');
console.log(`Built /workouts/ hub + ${data.programs.length} programs + ${Object.keys(data.exercises).length} exercise pages${PUBLISH ? '' : ' (noindex prototype, not in sitemap)'}.`);
