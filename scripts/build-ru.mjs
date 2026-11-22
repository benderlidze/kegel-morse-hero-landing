// Builds the Russian (/ru/) service pages: home, article hub, about, editorial policy, medical disclaimer.
// The Russian article lives as a hand-written file at ru/articles/<slug>/index.html (not generated here).
// English counterparts get reciprocal hreflang from PAGE_TRANSLATIONS in build-blog.mjs.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hreflangTags, langRow, LANG_MENU, homeGuideLinks } from './i18n/routes.mjs';
import { loadTr as loadWorkoutsTr, PUBLISH as WORKOUTS_PUBLISHED, hubPath as workoutsHub } from './lib/workouts-data.mjs';
const wkLabel = WORKOUTS_PUBLISHED && loadWorkoutsTr('ru') ? loadWorkoutsTr('ru').ui.navWorkouts : null; // /ru/workouts/ section

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://kegelmorsehero.com';
// Neutral storefront URL: Apple redirects to the visitor's own country (the audience spans RU, KZ, UA, PL...).
const appStore = 'https://apps.apple.com/app/id6761460873';
const playStore = 'https://play.google.com/store/apps/details?id=com.serhii.KegelMorseHero&hl=ru';
const playGlyph = '<svg viewBox="0 0 24 24"><path d="M3.6 1.8c-.3.2-.5.6-.5 1.1v18.2c0 .5.2.9.5 1.1l10-10.2zM14.7 11.9l2.8-2.8L5.1 2l9.6 9.9zm0 .2L5.1 22l12.4-7.1zM18.6 9.7l-3 3 3 3 3.4-2c.9-.5.9-1.6 0-2.1z"/></svg>';
const appleGlyph = '<svg viewBox="0 0 24 24"><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.09-.46 1.6-1.534 3.16-.918 1.35-1.866 2.7-3.36 2.72-1.466.03-1.937-.87-3.61-.87-1.673 0-2.197.84-3.583.9-1.444.05-2.55-1.46-3.475-2.81-1.89-2.74-3.34-7.74-1.4-11.12.964-1.66 2.687-2.71 4.555-2.74 1.435-.03 2.79.97 3.671.97.88 0 2.539-1.2 4.275-1.02.726.03 2.756.295 4.057 2.225-.105.066-2.422 1.418-2.395 4.236.03 3.378 2.965 4.5 3.001 4.51z"/></svg>';
const storeBtn = (href, glyph, eyebrow, name, variant) => `<a class="store-btn${variant ? ` ${variant}` : ''}" href="${href}" target="_blank" rel="noopener">${glyph}<span class="store-label"><span class="store-eyebrow">${eyebrow}</span><span class="store-name">${name}</span></span></a>`;
const storeButtons = (variant = '') => `<span class="store-btns">${storeBtn(appStore, appleGlyph, 'Загрузите в', 'App Store', variant)}${storeBtn(playStore, playGlyph, 'Доступно в', 'Google Play', variant)}</span>`;

const esc = (value = '') => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function head({ title, description, path: pagePath, enPath, type = 'website', image, extraMeta = '', jsonLd = '' }) {
  const canonical = `${site}${pagePath}`;
  const ogImage = image || `${site}/assets/og-image.png`;
  return `<!doctype html><html lang="ru"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta name="author" content="Kegel Morse Hero"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="theme-color" content="#070a0b">${extraMeta}<link rel="canonical" href="${canonical}">
${hreflangTags(enPath)}
<link rel="icon" href="/assets/favicon-48.png" type="image/png" sizes="48x48"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:type" content="${type}"><meta property="og:locale" content="ru_RU"><meta property="og:site_name" content="Kegel Morse Hero"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${ogImage}"><meta property="og:image:alt" content="Приложение Kegel Morse Hero для тренировки мышц тазового дна">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${ogImage}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/blog/blog.css">
${jsonLd}</head>`;
}

let currentEn = '/';
const header = (current, enPath) => (currentEn = enPath, `
<a class="skip-link" href="#main">Перейти к содержимому</a>
<header class="site-header"><div class="header-inner">
  <a class="brand" href="/ru/"><img src="/assets/logo-96.png" width="96" height="96" alt="Логотип Kegel Morse Hero"><span>Kegel Morse Hero</span></a>
  <nav class="site-nav" aria-label="Основная навигация">
    ${[['home', '/ru/', 'Главная'], ['articles', '/ru/articles/', 'Статьи'], ...(wkLabel ? [['workouts', workoutsHub('ru'), wkLabel]] : []), ['features', '/ru/features/', 'Возможности'], ['how-to-use', '/ru/how-to-use/', 'Как пользоваться'], ['faq', '/ru/faq/', 'FAQ'], ['privacy', '/ru/privacy/', 'Конфиденциальность']].map(([id, href, label]) => `<a href="${href}"${current === id ? ' aria-current="page"' : ''}>${label}</a>`).join('')}<a href="${enPath}" hreflang="en" lang="en">English</a>
    <a class="download-link" href="${appStore}" target="_blank" rel="noopener">App Store</a><a class="download-link download-link-android" href="${playStore}" target="_blank" rel="noopener">Google Play</a>
    ${LANG_MENU}
  </nav>
</div></header>`);

const footerHtml = (enPath) => `
<footer class="site-footer"><div class="footer-inner">
  <div><a class="brand" href="/ru/"><img src="/assets/logo-96.png" width="96" height="96" loading="lazy" alt="Логотип Kegel Morse Hero"><span>Kegel Morse Hero</span></a><p class="copyright">© 2026 Kegel Morse Hero</p>${langRow(enPath, 'ru')}</div>
  <nav class="footer-links" aria-label="Навигация в подвале"><a href="/ru/articles/">Статьи</a>${wkLabel ? `<a href="${workoutsHub('ru')}">${wkLabel}</a>` : ''}<a href="/ru/features/">Возможности</a><a href="/ru/how-to-use/">Как пользоваться</a><a href="/ru/faq/">FAQ</a><a href="/ru/privacy/">Конфиденциальность</a><a href="/ru/about/">О проекте</a><a href="/ru/editorial-policy/">Редакционная политика</a><a href="/ru/medical-disclaimer/">Медицинский отказ от ответственности</a></nav>
</div></footer>`;
// Template literals call toString() lazily, so ${footer} renders with the enPath set by the page's header() call.
const footer = { toString: () => footerHtml(currentEn) };

async function write(pagePath, html) {
  const dir = path.join(root, pagePath);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), html, 'utf8');
}

const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// --- Home ---
const homeFeatures = [
  ['Занятия по азбуке Морзе', 'Kegel Morse Hero использует паттерны азбуки Морзе, чтобы задавать фазы сокращения и расслабления для стабильной тренировки.'],
  ['Визуальные и тактильные подсказки', 'Кольцо-анимация и вибрация ведут каждое повторение, в том числе в незаметных занятиях без взгляда на экран.'],
  ['Готовые и собственные треки', 'Используйте готовые треки вроде SOS и HERO или создавайте собственные паттерны Морзе.'],
  ['История занятий', 'История сессий и календарь помогают отслеживать регулярность занятий.'],
  ['Подходит новичкам', 'Выбирайте скорость 1x, 2x или 3x, тренируйтесь в своём темпе и постепенно повышайте нагрузку.']
];
const homeDescription = 'Упражнения Кегеля для мужчин в приложении для iPhone: таймер с подсказками, вибрация, напоминания и история занятий. Бесплатная загрузка.';
const homeLd = ld({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Kegel Morse Hero', alternateName: 'Kegel Morse Hero: Pelvic Floor', operatingSystem: 'iOS 17.2 or later, Android', applicationCategory: 'HealthApplication', applicationSubCategory: 'Fitness', author: { '@type': 'Person', name: 'Sergei Prostokishyn' }, description: 'Приложение для тренировки мышц тазового дна, которое использует ритм азбуки Морзе для сокращения и расслабления. Визуальные подсказки, вибрация, собственные треки и хранение данных только на устройстве.', url: `${site}/ru/`, downloadUrl: appStore, installUrl: appStore, isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' }, publisher: { '@type': 'Organization', name: 'Kegel Morse Hero', url: `${site}/` }, image: `${site}/assets/logo.png`, inLanguage: 'ru' });
await write('ru', `${head({ title: 'Упражнения Кегеля для мужчин — приложение для iPhone', description: homeDescription, path: '/ru/', enPath: '/', extraMeta: '<meta name="apple-itunes-app" content="app-id=6761460873">', jsonLd: homeLd })}<body>${header('home', '/')}
<main id="main">
<section class="home-hero"><div class="home-hero-inner">
  <div class="home-hero-copy"><p class="eyebrow">Тренировка мышц тазового дна</p>
  <h1>Приложение для упражнений Кегеля <span>для iPhone</span></h1>
  <p class="lede">Следуйте ритму сокращения и расслабления с визуальными и тактильными подсказками. Настройте напоминания и отслеживайте свои занятия.</p>
  <p class="home-rhythm">Паттерны азбуки Морзе задают каждому занятию ритм.</p>
  <div class="cta-row">${storeButtons()}<a class="home-how-link" href="/ru/how-to-use/">Как это работает</a></div>
  <p class="fine-print">Бесплатная загрузка. Есть покупки в приложении. Требуется iOS 17.2 или новее.</p>
  <p class="home-privacy">Приватные занятия. Без аккаунта, рекламы и отслеживания.</p></div>
  <div class="home-hero-preview"><img class="shot" src="/assets/screenshot-hero.png" alt="Kegel Morse Hero на iPhone: таймер упражнений Кегеля с подсказками" width="884" height="1920" fetchpriority="high" decoding="async"></div>
</div></section>
<section class="feature-section on-surface"><div class="feature-section-inner center-heading"><h2 class="section-heading">Почему Kegel Morse Hero?</h2>
<div class="feature-grid">${homeFeatures.map(([h, p]) => `<div class="feature-tile"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
</div></section>
<section class="feature-section center-heading"><h2 class="section-heading">Коротко о приложении</h2>
<div class="fact-grid"><p><strong>Платформа:</strong> iOS и Android</p><p><strong>Цена:</strong> бесплатная загрузка, подписка по желанию</p><p><strong>Работает офлайн:</strong> да, занятия не требуют интернета</p><p><strong>Нужен аккаунт:</strong> нет</p><p><strong>Данные:</strong> хранятся на устройстве, без рекламы и отслеживания</p><p><strong>Подходит для:</strong> приватных упражнений Кегеля с таймером</p></div>
</section>
<section class="feature-section center-heading"><h2 class="section-heading">Kegel Morse Hero в действии</h2>
<div class="home-media"><div class="video-frame"><iframe src="https://www.youtube.com/embed/VtgtSG_DCYI" title="Демонстрация приложения Kegel Morse Hero" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>
<img class="shot" src="/assets/screenshot-main.png" alt="Основной экран Kegel Morse Hero с визуализацией азбуки Морзе" width="590" height="1280" loading="lazy" decoding="async">
<img class="shot" src="/assets/screenshot-detail.png" alt="Экран тренировки Kegel Morse Hero с кольцом-анимацией" width="884" height="1920" loading="lazy" decoding="async"></div>
</section>
<section class="feature-section center-heading"><h2 class="section-heading">Полезные статьи</h2>
${homeGuideLinks('ru', 'Упражнения Кегеля для мужчин: сколько раз в день делать').map((g) => `<p><a href="${g.href}">${esc(g.title)}</a></p>`).join('')}
<p><a href="/ru/articles/">Все статьи на русском</a></p></section>
<section class="cta-banner"><div class="cta-banner-inner"><h2>Начните тренироваться сегодня</h2><p>Kegel Morse Hero можно скачать бесплатно, а первое занятие начнётся за считаные секунды.</p><div class="cta-row">${storeButtons('on-cyan')}</div></div></section>
</main>${footer}</body></html>`);

// (the article hub for ru is built by scripts/build-i18n.mjs together with the markdown articles)

// --- Trust pages ---
const trustPages = [
  {
    slug: 'about', enPath: '/about/', title: 'О проекте Kegel Morse Hero',
    description: 'Кто публикует Kegel Morse Hero и как представлены приложение и образовательные материалы о мышцах тазового дна.',
    content: '<p>Kegel Morse Hero — независимое приложение для iPhone и Android и образовательный сайт, созданные независимым разработчиком приложений Sergei Prostokishyn. Приложение использует ритмы азбуки Морзе, визуальный тайминг и тактильные подсказки, чтобы стандартные схемы упражнений для мышц тазового дна было проще выполнять.</p><h2>Зачем существует приложение</h2><p>Упражнения для мышц тазового дна просты, но большинство людей бросают их через несколько недель: считать секунды в тишине скучно, и легко сбиться, когда сжимать, а когда расслабляться. В азбуке Морзе уже есть сочетание, которое нужно для тренировки мышц тазового дна, — короткие точки, длинные тире и паузы, — поэтому слово может стать ритмом, за которым легко следовать. Цель — понятный, приватный и менее монотонный режим занятий, а не обещание медицинского результата.</p><h2>Что приложение делает и чего не делает</h2><p>Приложение подсказывает ритм с помощью анимации кольца и вибрации, предлагает встроенные и собственные треки, три скорости, напоминания и историю занятий. Оно не измеряет активность мышц, не диагностирует и не лечит никакие состояния и не является медицинским изделием. Аккаунт не нужен, рекламы нет, отслеживания нет, а данные занятий хранятся на вашем устройстве.</p><h2>О статьях</h2><p>Руководства на этом сайте пишет и редактирует Sergei Prostokishyn. В каждой статье о здоровье указаны источники, такие как NHS, NIDDK, Mayo Clinic и рецензируемые исследования в PubMed, и дата последней проверки. Указание автора не означает медицинской квалификации, и сайт не заявляет, что его содержание прошло проверку врача. Если наше приложение упоминается в сравнении, эта связь указывается на странице.</p><h2>Для чего нужен этот сайт</h2><p>Статьи и тренировки объясняют технику упражнений, регулярность, частые вопросы и границы имеющихся данных. Это образовательные материалы, а не диагностика, лечение или замена помощи квалифицированного медицинского специалиста.</p><h2>Контакты</h2><p>По вопросам о приложении или этом сайте используйте контакт поддержки на странице приложения в App Store или Google Play.</p><p>Подробнее читайте в нашей <a href="/ru/editorial-policy/">редакционной политике</a> и <a href="/ru/medical-disclaimer/">медицинском отказе от ответственности</a>.</p>'
  },
  {
    slug: 'editorial-policy', enPath: '/editorial-policy/', title: 'Редакционная политика',
    description: 'Как Kegel Morse Hero изучает, подписывает, проверяет и обновляет образовательные материалы о здоровье.',
    content: '<p>Мы стремимся излагать информацию о мышцах тазового дна ясно, осторожно и полезно, не превращая образование в медицинское обещание.</p><h2>Источники и доказательства</h2><p>Утверждения о здоровье подкрепляются ссылками на известные клинические организации, рецензируемые исследования или систематические обзоры, если тема требует доказательств. Источники указаны в конце каждой статьи, а редакционные ссылки не являются платным размещением.</p><h2>Язык и неопределённость</h2><p>Если данных мало, мы прямо об этом говорим. Мы не обещаем увеличения размера, гарантированного улучшения эрекции, вероятности излечения или гарантированных результатов при преждевременной эякуляции. Реклама в магазинах приложений не выдаётся за клиническое доказательство.</p><h2>Прозрачность в отношении продукта</h2><p>Этот сайт публикует Kegel Morse Hero. Если наше приложение упоминается в сравнении, эта связь указывается явно. Упоминания продукта не заменяют профессиональную оценку и не подтверждают клиническую эффективность.</p><h2>Даты проверки и исправления</h2><p>Слово «Проверено» обозначает дату, когда текст и его источники были проверены редакцией. Это не означает, что страницу проверял врач, если об этом не сказано прямо. Существенные исправления должны отражаться в видимой дате проверки.</p>'
  },
  {
    slug: 'medical-disclaimer', enPath: '/medical-disclaimer/', title: 'Медицинский отказ от ответственности',
    description: 'Важная медицинская информация и правила безопасности для статей и подсказок в приложении Kegel Morse Hero.',
    content: '<p>Материалы на этом сайте и в приложении Kegel Morse Hero предоставляются только в общеобразовательных и информационных целях. Они не являются медицинской рекомендацией, диагнозом, лечением, реабилитацией или индивидуальным назначением упражнений.</p><h2>Когда нужна персональная консультация</h2><p>Симптомы со стороны мышц тазового дна могут иметь разные причины: мышцы могут быть ослаблены, находиться в гипертонусе, плохо координироваться или страдать из-за другого заболевания. Оценить вашу ситуацию может квалифицированный врач или физиотерапевт по тазовому дну.</p><h2>Когда прекратить</h2><p>Прекратите упражнения для мышц тазового дна и обратитесь за профессиональной помощью, если появились боль, нарастающее напряжение, затруднённое начало мочеиспускания, усиливающиеся позывы, неполное опорожнение мочевого пузыря или кишечника, боль при эрекции, боль после эякуляции или любое другое ухудшение состояния.</p><h2>Экстренные случаи</h2><p>Этот сайт не является экстренной службой. При острых или тяжёлых симптомах обратитесь в местные экстренные службы.</p>'
  }
];
for (const page of trustPages) {
  await write(`ru/${page.slug}`, `${head({ title: `${page.title} | Kegel Morse Hero`, description: page.description, path: `/ru/${page.slug}/`, enPath: page.enPath })}<body>${header('other', page.enPath)}<main id="main" class="trust-page"><p class="eyebrow">Kegel Morse Hero</p><h1>${page.title}</h1>${page.content}<p class="article-meta">Последнее обновление: <time datetime="2026-08-04">4 августа 2026</time></p></main>${footer}</body></html>`);
}


// --- Features / How to use / FAQ / Privacy ---
const store = `<div class="center-cta">${storeButtons()}</div>`;
const h1Style = 'font:800 clamp(2.1rem,6vw,3.4rem)/1.1 Sora,sans-serif;letter-spacing:-.03em;margin:0';
const intro = (h1, lede) => `<p class="eyebrow">Kegel Morse Hero</p><h1 style="${h1Style}">${h1}</h1><p class="lede" style="max-width:620px">${lede}</p>`;
const qa = (items) => `<div class="qa-list">${items.map(([q, a]) => `<div class="qa-item"><h2>${esc(q)}</h2><p>${esc(a)}</p></div>`).join('')}</div>`;
const itunes = '<meta name="apple-itunes-app" content="app-id=6761460873">';

const featureFaqs = [
  ['Как Kegel Morse Hero ведёт упражнения?', 'Кольцо-анимация отмечает каждое сокращение и каждое расслабление. Каждое занятие следует паттерну азбуки Морзе: точка — короткое быстрое сокращение, тире — более долгое удержание, а паузы между сигналами — ваш отдых. Вибрация пульсирует в такт паттерну, поэтому ритм понятен, даже когда вы не смотрите на экран.'],
  ['Почему азбука Морзе?', 'Тренировка мышц тазового дна обычно сочетает быстрые сокращения, более долгие удержания и полное расслабление. В азбуке Морзе уже есть именно такое сочетание: короткие точки, длинные тире и паузы. Если превратить слово в ритм, у каждого занятия появляется узнаваемый рисунок — за ним проще следить, и он менее монотонен, чем молчаливый счёт секунд.'],
  ['Какие треки азбуки Морзе есть в приложении?', 'Встроенные треки: SOS (16 с), HELLO (26 с), HELP ME (28 с), HERO (20 с), KEGEL (22 с), MORSE (23 с), BRAVO (28 с), READY (24 с) и FOCUS (29 с). Короткие треки, такие как SOS и HERO, — хорошее начало; более длинные добавляют больше удержаний и повторений.'],
  ['Можно ли создавать собственные треки?', 'Да. Введите любое слово или короткую фразу, и приложение превратит каждую букву в точки и тире. Чем длиннее слово, тем дольше занятие, поэтому начните с короткого слова и наращивайте. Собственные треки — простой способ разнообразить тренировки, когда встроенные уже стали привычными.'],
  ['Можно ли заниматься незаметно?', 'Да. Благодаря вибрации не нужны ни звук, ни видимый экран: телефон может лежать на столе или в руке, а вы следуете за вибрацией. Упражнение Кегеля снаружи незаметно, поэтому заниматься можно за рабочим столом, в очереди или перед сном.'],
  ['Можно ли менять скорость упражнений?', 'Доступны скорости 1x, 2x и 3x. На 1x удержания и паузы самые долгие — это самый щадящий вариант для начала. На более высоких скоростях каждый сигнал и каждая пауза короче, поэтому требуются более быстрые сокращения и более быстрое расслабление; переходите на них, только когда медленный темп уже под контролем.'],
  ['Что такое режим Zen?', 'Режим Zen убирает лишние элементы интерфейса и оставляет только подсказки по ритму, чтобы во время занятия ничто не отвлекало. Он хорошо сочетается с вибрацией для занятий, не глядя на экран.'],
  ['Помогает ли приложение заниматься регулярно?', 'Да. Напоминания можно настроить на ежедневное или своё расписание. Для тренировки мышц тазового дна регулярность важнее интенсивности, а напоминание в одно и то же время каждый день — один из самых простых способов закрепить привычку.'],
  ['Как работает отслеживание прогресса?', 'Каждое завершённое занятие автоматически сохраняется в календаре и журнале истории — с датой, треком, длительностью и скоростью. В календаре легко заметить пропуски, а история показывает, как меняются ваши занятия на протяжении недель.'],
  ['Как обрабатываются данные пользователя?', 'Все данные занятий хранятся на вашем устройстве. Аккаунта нет, рекламы и отслеживания тоже. Необязательные резервное копирование в Google Drive и экспорт в CSV доступны, если вы решите ими воспользоваться; резервная копия попадает в ваш собственный аккаунт Google.'],
  ['Работает ли приложение без интернета?', 'Да. Занятия, треки, напоминания и история работают без подключения к интернету.'],
  ['Какие устройства и языки поддерживаются?', 'Kegel Morse Hero доступно для iPhone (iOS 17.2 или новее) в App Store и для Android в Google Play. Приложение доступно на английском, французском, немецком, японском, корейском, польском, русском, испанском и украинском языках.'],
  ['Чего приложение не делает', 'Приложение подсказывает ритм, но не измеряет активность мышц: в телефоне нет для этого датчика. Если вы не уверены, что сокращаете нужные мышцы, это может проверить физиотерапевт по тазовому дну. Kegel Morse Hero не является медицинским изделием и не диагностирует и не лечит никакие состояния.']
];
await write('ru/features', `${head({ title: 'Возможности Kegel Morse Hero: тренажёр Кегеля', description: 'Возможности Kegel Morse Hero: занятия по азбуке Морзе, вибрация, собственные треки, напоминания и приватная история занятий на устройстве.', path: '/ru/features/', enPath: '/features.html', type: 'article', image: `${site}/assets/screenshot-features.png`, extraMeta: itunes })}<body>${header('features', '/features.html')}
<main id="main"><section class="feature-section no-border">${intro('Возможности', 'Всё, что есть в Kegel Morse Hero для тренировки мышц тазового дна.')}
<div class="home-media" style="margin-top:2.5rem"><img class="shot" src="/assets/screenshot-main.png" alt="Экран упражнений Kegel Morse Hero" loading="lazy"><img class="shot" src="/assets/screenshot-features.png" alt="Выбор трека в Kegel Morse Hero: собственные треки, напоминания и журнал истории" loading="lazy"></div>
${qa(featureFaqs)}
${store}
</section></main>${footer}</body></html>`);

const steps = [
  ['Сначала найдите нужные мышцы', 'Аккуратно подтяните и сожмите мышцы так, как если бы вы останавливали поток мочи или удерживали газы, а затем полностью расслабьтесь. Живот, ягодицы и бёдра должны оставаться расслабленными, дыхание — обычным. Используйте это только для того, чтобы почувствовать нужные мышцы: не тренируйтесь, регулярно прерывая струю мочи.'],
  ['Скачайте и откройте приложение', 'Kegel Morse Hero доступно в App Store для iPhone и в Google Play для Android. Аккаунт не нужен: откройте приложение — и можно сразу начинать первое занятие.'],
  ['Выберите трек азбуки Морзе', 'Нажмите на название трека (например, SOS), чтобы выбрать встроенный трек или создать собственный из любого слова. Короткие треки, такие как SOS (16 с) или HERO (20 с), — самый простой способ начать.'],
  ['Выберите скорость', 'Выберите 1x, 2x или 3x. Если вы новичок, начните с 1x: удержания и паузы самые долгие, поэтому у вас есть время сжимать мышцы с контролем и полностью расслабляться.'],
  ['Примите удобное положение', 'Проще всего начинать лёжа на спине с согнутыми коленями, потому что мышцам тазового дна не нужно работать против силы тяжести. По мере того как контроль улучшается, занимайтесь сидя, а затем стоя.'],
  ['Нажмите play и следуйте за кольцом', 'Анимация кольца показывает, когда сжимать мышцы, а когда расслабляться, а вибрация идёт в такт. Точка — быстрое сокращение и расслабление, тире — более долгое удержание, а каждая пауза — полное расслабление. Всё время продолжайте дышать.'],
  ['Завершите занятие', 'Когда трек закончится, занятие автоматически запишется. От одного до трёх коротких треков — вполне достаточно для одного занятия; повторите трек или выберите другой.'],
  ['Настройте напоминание и следите за прогрессом', 'Включите напоминания на удобное для вас время, а по календарю и истории смотрите, насколько регулярно вы занимались в последние недели.']
];
await write('ru/how-to-use', `${head({ title: 'Как пользоваться Kegel Morse Hero: инструкция', description: 'Пошаговая инструкция по Kegel Morse Hero: как выбрать трек, заниматься по ритму азбуки Морзе, использовать вибрацию и следить за прогрессом.', path: '/ru/how-to-use/', enPath: '/how-to-use.html', type: 'article', image: `${site}/assets/screenshot-main.png`, extraMeta: itunes })}<body>${header('how-to-use', '/how-to-use.html')}
<main id="main"><section class="feature-section no-border">${intro('Как пользоваться Kegel Morse Hero', 'Пошаговая инструкция, как начать тренировку мышц тазового дна с чётким ритмом.')}
<div class="steps">${steps.map(([h, p], i) => `<div class="step"><span class="step-number">${i + 1}</span><div><h2>${esc(h)}</h2><p>${esc(p)}</p></div></div>`).join('')}</div>
<div class="tips-box"><h2>Советы для эффективной тренировки</h2><ul><li>Занимайтесь регулярно. Многие стремятся делать 2–3 коротких занятия в день; регулярность важнее длительных занятий.</li><li>Качество важнее силы: мягкое подтягивание, которое вы можете контролировать, лучше максимального сжатия.</li><li>Полное расслабление между сигналами — часть упражнения, а не перерыв в нём.</li><li>Дышите обычно. Никогда не задерживайте дыхание и не натуживайтесь.</li><li>Используйте вибрацию и режим Zen для незаметных подсказок, не глядя на экран.</li><li>Начинайте с коротких треков на скорости 1x и постепенно переходите к более длинным трекам, более высоким скоростям и занятиям стоя.</li><li>Прекратите занятия и обратитесь к врачу или физиотерапевту по тазовому дну, если почувствуете боль, мочиться станет труднее или симптомы усилятся.</li></ul></div>
${store}
</section></main>${footer}</body></html>`);

const faqs = [
  ['Что такое Kegel Morse Hero?', 'Kegel Morse Hero — приложение для iPhone и Android, которое сочетает упражнения для мышц тазового дна (Кегеля) с ритмами азбуки Морзе, визуальными подсказками и вибрацией. Точки — быстрые сокращения, тире — более долгие удержания, а паузы — отдых.'],
  ['Чем оно отличается от обычного таймера для упражнений Кегеля?', 'Обычный таймер раз за разом отсчитывает одно и то же сокращение. Kegel Morse Hero сочетает быстрые сокращения и долгие удержания в узнаваемых ритмах, позволяет создавать собственные треки из любого слова, вибрирует в такт каждому сигналу и хранит приватную историю ваших занятий.'],
  ['Кому подходят упражнения для мышц тазового дна?', 'Упражнения для мышц тазового дна обычно используют взрослые для контроля мочевого пузыря, стабильности корпуса и интимного здоровья: например, мужчины при подкапывании после мочеиспускания или недержании после операции на простате, а женщины — после родов или в период менопаузы. Если у вас есть симптомы, боль или недавняя операция, проконсультируйтесь со специалистом в области здравоохранения, прежде чем начинать.'],
  ['Приложение для мужчин или для женщин?', 'Для всех. Мышцы тазового дна есть у каждого, и подсказки по ритму работают одинаково для всех. На сайте есть руководства и бесплатные тренировки с картинками для мужчин и для женщин.'],
  ['Как часто нужно заниматься?', 'Многие занимаются короткими занятиями в большинство дней недели, часто по два-три раза в день. Начните с одного-двух коротких треков, наращивайте нагрузку постепенно и оставляйте хотя бы один лёгкий или выходной день, если мышцы устали или напряжены.'],
  ['Через какое время заметна разница?', 'По-разному. Обычно для заметных изменений тренировке мышц тазового дна требуется несколько недель регулярных занятий, а многие структурированные программы длятся около трёх месяцев. Регулярные короткие занятия важнее долгих.'],
  ['Можно ли делать слишком много упражнений Кегеля?', 'Да. Больше — не значит лучше: постоянное напряжение может оставить мышцы тазового дна напряжёнными и уставшими, а гиперактивным мышцам тазового дна нужно расслабление, а не дополнительное укрепление. Если вы заметили боль, императивные позывы или затруднённое мочеиспускание, прекратите занятия и обратитесь к врачу.'],
  ['Проверяет ли приложение, правильно ли я выполняю упражнение?', 'Нет. В телефоне нет датчика, который мог бы измерять активность мышц тазового дна, поэтому приложение подсказывает только ритм. Если вы не уверены, что задействуете нужные мышцы, вас может обследовать физиотерапевт по тазовому дну.'],
  ['Kegel Morse Hero бесплатное?', 'Да, скачать приложение можно бесплатно. Необязательные недельная и годовая подписки, а также разовая покупка «навсегда» открывают дополнительные функции.'],
  ['Как работают подписки?', 'Подписки продлеваются автоматически, если не отменить их минимум за 24 часа до окончания текущего периода. На iPhone управлять подписками и отменять их можно в настройках учётной записи Apple, на Android — в подписках Google Play.'],
  ['Можно ли пользоваться приложением незаметно?', 'Да. Вибрация позволяет заниматься без звука и без взгляда на экран, а режим Zen скрывает всё, кроме подсказок по ритму. Упражнение Кегеля со стороны никто не увидит.'],
  ['Какие устройства и языки поддерживаются?', 'iPhone с iOS 17.2 или новее и телефоны на Android через Google Play. Приложение доступно на английском, французском, немецком, японском, корейском, польском, русском, испанском и украинском языках.'],
  ['Собирает ли Kegel Morse Hero мои данные?', 'Нет. По умолчанию данные остаются на вашем устройстве. В приложении нет рекламы и отслеживания. Необязательные функции резервного копирования и экспорта запускаются самим пользователем.'],
  ['Нужен ли аккаунт для Kegel Morse Hero?', 'Аккаунт не нужен.'],
  ['Что такое треки азбуки Морзе?', 'Треки превращают точки и тире в короткие и долгие сокращения. Есть встроенные треки, а также можно создавать собственные.'],
  ['Можно ли пользоваться Kegel Morse Hero без интернета?', 'Да. Занятия работают офлайн.'],
  ['Это медицинское изделие?', 'Нет. Приложение носит информационный характер и не заменяет консультацию врача или лечение.']
];
const faqLd = ld({ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: 'ru', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
await write('ru/faq', `${head({ title: 'Частые вопросы о Kegel Morse Hero', description: 'Ответы на частые вопросы о Kegel Morse Hero: упражнения для мышц тазового дна, подписки, работа офлайн и конфиденциальность.', path: '/ru/faq/', enPath: '/faq.html', type: 'article', image: `${site}/assets/screenshot-main.png`, extraMeta: itunes, jsonLd: faqLd })}<body>${header('faq', '/faq.html')}
<main id="main"><section class="feature-section no-border">${intro('Частые вопросы', 'Ответы на частые вопросы о Kegel Morse Hero и тренировке мышц тазового дна.')}
${qa(faqs)}
${store}
</section></main>${footer}</body></html>`);

const privacySections = [
  ['Сбор данных', 'Kegel Morse Hero по умолчанию не собирает, не передаёт и не хранит персональные данные на внешних серверах. Данные упражнений, настройки и история прогресса хранятся локально на вашем устройстве.'],
  ['Без отслеживания', 'В Kegel Morse Hero нет рекламных SDK, аналитических трекеров и пикселей отслеживания.'],
  ['Резервное копирование и экспорт', 'Резервное копирование в Google Drive и экспорт в CSV — необязательные функции, которые запускает сам пользователь. Если вы включите резервное копирование, данные будут храниться в вашем собственном аккаунте Google.'],
  ['Аккаунт не нужен', 'Приложение не требует регистрации, сбора адреса электронной почты или создания аккаунта.'],
  ['Подписки и платежи', 'Платежи по подпискам обрабатывает Apple через App Store. Kegel Morse Hero не обрабатывает и не хранит данные платёжных карт.'],
  ['Контакты', `По вопросам конфиденциальности используйте контакт поддержки на странице приложения в App Store: <a href="${appStore}" target="_blank" rel="noopener">${appStore}</a>.`]
];
await write('ru/privacy', `${head({ title: 'Политика конфиденциальности | Kegel Morse Hero', description: 'Политика конфиденциальности Kegel Morse Hero: данные хранятся на устройстве, нет отслеживания, нет рекламы и не нужен аккаунт.', path: '/ru/privacy/', enPath: '/privacy.html', type: 'article', image: `${site}/assets/screenshot-main.png`, extraMeta: itunes })}<body>${header('privacy', '/privacy.html')}
<main id="main" class="content-page"><p class="eyebrow">Kegel Morse Hero</p><h1>Политика конфиденциальности</h1><p class="lede">Последнее обновление: 17 апреля 2026</p>
${privacySections.map(([h, p]) => `<section><h2>${esc(h)}</h2><p>${h === 'Контакты' ? p : esc(p)}</p></section>`).join('')}
<p><em>Перевод сделан для удобства. При расхождениях приоритет имеет <a href="/privacy.html" hreflang="en">английская версия</a>.</em></p>
</main>${footer}</body></html>`);

console.log('Built Russian pages: home, articles hub, features, how-to-use, faq, privacy, about, editorial-policy, medical-disclaimer.');
