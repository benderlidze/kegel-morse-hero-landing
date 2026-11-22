# SEO + GEO аудит kegelmorsehero.com — 22.11.2026

Что проверено:
- Google Search Console: отчёты «Эффективность» (3 месяца и 28 дней), «Индексирование страниц», «Файлы Sitemap».
- 797 HTML-файлов репозитория (рабочая копия = `main` 9f4c7f3 + 4 незакоммиченных файла).
- Живой сайт через curl: редиректы, 404, доступ AI-ботов.
- Веб-поиск по бренду и запросу «best kegel app for men».

Что не проверено: Bing Webmaster, обратные ссылки, Core Web Vitals, отчёт GSC о генеративном AI.

Предыдущий аудит: `reports/seo-2026-11-16/` (SEO-AUDIT-RU.md + FIX-LIST-RU.md, номера K1–K23). Ниже отмечено, что из него сделано.

## Цифры из Search Console

| Период | Клики | Показы | CTR | Позиция |
|---|---:|---:|---:|---:|
| 3 месяца | 433 | 17 100 | 2,5 % | 12,9 |
| Последние 28 дней | **331** | **13 800** | 2,4 % | 13,7 |
| Предыдущие 28 дней | 82 | 2 010 | 4,1 % | 9,7 |

**Трафик вырос в 4 раза за месяц.** Средняя позиция упала, потому что начали показываться новые страницы с дальних позиций. Это нормально.

**Индекс: 504 страницы в индексе, 191 нет.** Из них 176 со статусом «Обнаружена, не проиндексирована»: Google знает URL, но ни разу его не сканировал.

**Клики по языкам (3 мес.):** EN 227 · RU 80 · PL 44 · UK 29 · FR 22 · DE 18 · ES 17.
**Клики по странам:** US 79 · PL 44 · RU 38 · UA 37 · DE 26 (позиция 24) · GB 17 · FR 17 · ES 13 (позиция 33).

**Клики по разделам:**

| Раздел | Страниц с показами | Клики | Показы |
|---|---:|---:|---:|
| Статьи (все языки) | 203 | 330 | 19 578 |
| Workouts | 102 | 19 | 1 233 |
| Упражнения `/workouts/exercises/` | 101 | 12 | 893 |
| Старые `/blog/` (редирект-страницы) | 13 | 33 | 6 560 |

**Топ страниц:**

| Страница | Клики | Показы | CTR | Позиция |
|---|---:|---:|---:|---:|
| /articles/best-kegel-apps-for-men/ | 89 | 2 743 | 3,2 % | 7,4 |
| /articles/dr-kegel-app-review/ | 48 | 2 306 | 2,1 % | 7,4 |
| /ru/articles/obratnye-uprazhneniya-kegelya-dlya-muzhchin/ | 37 | 786 | 4,7 % | 5,3 |
| / (главная) | 35 | 151 | 23 % | 2,8 |
| /blog/best-kegel-apps-for-men/ (старый URL) | 32 | 1 360 | 2,4 % | 9,0 |
| /pl/articles/odwrocone-cwiczenia-kegla-dla-mezczyzn/ | 22 | 318 | 6,9 % | 5,5 |
| /ru/articles/ya-delayu-kegelya-nepravilno-7-priznakov/ | 16 | 272 | 5,9 % | 5,1 |
| /pl/articles/najlepsze-aplikacje-do-cwiczen-kegla-dla-mezczyzn/ | 11 | 79 | 13,9 % | 5,4 |

**Топ запросов:** `best kegel app for men` 19 кл. / 502 пок. (поз. 6,9) · `dr kegel review` 9/406 (7,9) · `dr kegel app review` 8/253 · `kegel morse hero` 7/14 · `обратный кегель` 5/260 · `best free kegel app for men` 4/217 (8,9).

**Темы:**
- Эджинг (RU/PL): 265 показов, 1 клик.
- Женские запросы: 98 запросов, 369 показов, 0 кликов.
- Простата: 99 показов, 3 клика.
- **ED: 14 показов. PE: 8 показов.** Причина почти нулевых цифр — EN-статьи на эти темы не в индексе (см. P0-1).

## Главное

1. **Ключевые EN-статьи Google не сканировал.** В «Обнаружена, не проиндексирована» лежат:
   - reverse-kegels-for-men (RU- и PL-версии этой статьи — №3 и №6 по кликам);
   - kegels-erectile-dysfunction, do-kegels-help-premature-ejaculation;
   - kegels-after-prostate-surgery (UK-версия в топе);
   - dribbling-after-peeing-men, pain-after-ejaculation-sperm-cramps, edging-and-testosterone, increase-male-sensitivity;
   - am-i-doing-kegels-wrong, lower-belly-pain-after-kegels, kegel-exercises-for-women, constipation-pelvic-floor-dysfunction, core-workouts-for-women;
   - how-long-do-kegels-take-to-work-men (дубль);
   - /faq.html.

   Остальные ~160 URL — workouts и упражнения на всех языках. Google не тратит краулинговый бюджет на сайт с низким авторитетом и 750 страницами, из которых 331 короче 300 слов.
2. **Решение 20.11 «использовать ED/PE/last longer по максимуму»** пока на сайте не работает: эти статьи не в индексе, а в статье про PE нет ни одной ссылки на App Store.
3. **GEO: бренд неизвестен.** Поиск `"Kegel Morse Hero"` не находит ни сайт, ни App Store. По запросу «best kegel app for men» AI-ответы собираются из страниц App Store и appshunter.io, независимых обзоров нет. Конкуренты в ответах: Dr. Kegel, Better P, Kegel Men, Kegel Gym, StrongCore, Klench. Место в обзорах свободно.
4. Из списка от 16.11 почти ничего не сделано (таблица ниже). Исключение — workouts стали длиннее: медиана 450–570 слов вместо 232.

## Что в порядке (не трогать)

- http → https и www → без www отдают 301. URL без слэша отдаёт 301 на версию со слэшем. Несуществующий URL — 404 со своей страницей.
- GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Googlebot, bingbot, Applebot, meta-externalagent получают 200.
- Sitemap прочитан 16.11: 752 URL, статус Success. Индексируемые страницы совпадают с sitemap, кроме 3 демо-страниц.
- Canonical везде на себя, hreflang взаимный, дублей title нет, H1 по одному.
- `/blog/*`: `noindex` + canonical + meta refresh. Google склеивает их медленно: `/blog/best-kegel-apps-for-men/` ещё даёт 32 клика. Ничего не делать, само уйдёт.

---

## P0 — сделать на этой неделе

### 1. Загнать в индекс ключевые EN-статьи (руками, 15 минут в день)
GSC → строка «Проверка URL» сверху → вставить URL → «Запросить индексирование». Лимит ~10–12 URL в день. Порядок:
1. `https://kegelmorsehero.com/articles/reverse-kegels-for-men/`
2. `https://kegelmorsehero.com/articles/do-kegels-help-premature-ejaculation/`
3. `https://kegelmorsehero.com/articles/kegels-erectile-dysfunction/`
4. `https://kegelmorsehero.com/articles/kegels-after-prostate-surgery/`
5. `https://kegelmorsehero.com/articles/dribbling-after-peeing-men/`
6. `https://kegelmorsehero.com/articles/pain-after-ejaculation-sperm-cramps/` (сначала исправить title, см. P1-5)
7. `https://kegelmorsehero.com/articles/increase-male-sensitivity/`
8. `https://kegelmorsehero.com/articles/edging-and-testosterone/`
9. `https://kegelmorsehero.com/articles/am-i-doing-kegels-wrong/`
10. `https://kegelmorsehero.com/faq.html`

На следующий день: lower-belly-pain-after-kegels, kegel-exercises-for-women, constipation-pelvic-floor-dysfunction, core-workouts-for-women.

### 2. Ссылки на эти статьи с главной
На главной сейчас одна ссылка на статьи — `/articles/`. Нужен блок «Popular guides» на 6–8 ссылок: reverse kegels, PE, ED, after prostate surgery, dribbling, how many kegels a day, best kegel apps. Внутренняя ссылка с главной — самый сильный сигнал для сканирования. Главная собирается в `scripts/build-blog.mjs` (+ `build-i18n.mjs`, `build-ru.mjs` для языков).

### 3. Убрать из индекса то, что тянет сайт вниз (K12)
210 страниц `/workouts/exercises/*` по 141–175 слов. 101 из них Google уже не стал сканировать, а все вместе они дали 12 кликов за 3 месяца.
- `noindex,follow` + убрать из sitemap и hreflang всем упражнениям на DE/ES/FR/UK (120 страниц). Шаблон: `scripts/build-workouts.mjs`, флаг по образцу `:126`.
- EN/PL/RU: дописать до 300+ слов (частые ошибки, как понять, что мышца работает, упрощённый и усложнённый вариант) или тоже `noindex`.
- Плюс 10 коротких переводов статей на каждом языке (60 страниц < 300 слов, K4): `noindex` до полного перевода.

Итог: около 180 страниц меньше в индексе, бюджет сканирования уходит на статьи.

### 4. CTA в ED/PE-статьях
- `articles/do-kegels-help-premature-ejaculation/` — 0 ссылок на App Store. Добавить баннер приложения, как в других статьях, и строку о том, что Morse-ритм тренирует быстрые и медленные сокращения (нужны для контроля).
- В ED-статье 2 ссылки, в порядке.
- Новые статьи под решение 20.11 — только после того, как эти попадут в индекс.

### 5. Удалить 3 демо-страницы (K1, висит с 29.09)
`galaxy.html`, `auroraglow.html`, `falling-particles-controls.html` — живой сайт отдаёт 200. Удалить из репо.

## P1 — GEO (бренд в AI-ответах)

Как для DryPage: AI цитирует обзоры, AlternativeTo, Product Hunt, посты разработчиков. Своей страницы `best-kegel-apps-for-men` (позиция 7,4) мало.

1. **dev.to / Medium:** «I built a Kegel trainer that uses Morse code rhythms». Механика уникальная, её легко цитировать. Ссылки на App Store и `/articles/morse-code-kegel-training/`.
2. **AlternativeTo:** добавить KMH как альтернативу Dr. Kegel, Squeezy Men, Kegel Trainer PFM, Better P.
3. **appshunter.io** (страница «Best Kegel App For Men» — его цитирует поиск): проверить, есть ли KMH. Если нет, подать.
4. **Обзоры «best kegel apps for men»:** независимых обзоров почти нет — это возможность для гостевого поста или для обмена «приложение + промокод автору» у men's health блогеров и физиотерапевтов.
5. **Organization в schema:** добавить `@id: https://kegelmorsehero.com/#org`. В `sameAs` сейчас только App Store и Google Play — добавить YouTube (ролик `VtgtSG_DCYI` есть), Bluesky, TikTok, Threads (свои URL). У статей `publisher → {"@id": "#org"}`, `author → Person` (сейчас Person у 1 из 351).
6. **llms.txt:** строки 19 и 35 — «Not a Fit: an Android app», «Platform: iOS» (K18). Исправить на `iOS and Android`. `llms-full.txt` = 7,5 КБ → собирать из всех EN-статей, как на DryPage (~150–300 КБ).
7. **Bing Webmaster:** `BingSiteAuth.xml` в корне есть. Проверить, что сайт подтверждён и sitemap отправлен (ChatGPT Search берёт выдачу из Bing).

## P1 — CTR на страницах, которые уже показываются

| Страница | Сейчас | Что сделать |
|---|---|---|
| dr-kegel-app-review | CTR 2,1 % на 2 306 показах, поз. 7,4 | Title под запрос: **Dr. Kegel App Review 2026: Price, Pros, Cons** (44). Цена в title — запрос `dr kegel app cost` тоже есть |
| best-kegel-apps-for-men | 3,2 % на 2 743 | Title с годом и числом: **7 Best Kegel Apps for Men (Tested, 2026)**. В январе сменить на 2027 |
| best-free-kegel-app-for-men-no-subscription | 3 % на 166, поз. 7,7 | В description — «free / no subscription» в первых 60 символах |
| RU/PL «эджинг» (`edging-and-testosterone`) | 265 показов, 1 клик | Title на RU/PL под вопрос: «Эджинг: вредно ли? Что говорят исследования» |

## P2 — хвосты списка 16.11

| # | Пункт | Статус 22.11 |
|---|---|---|
| K3 | Один формат ссылки на App Store | ❌ 642 стр. `/app/id…`, 107 стр. `/us/app/kegel-morse-hero-pelvic-floor/…` |
| K2 | Campaign links App Store Connect | ❌ нет `ct=`/`pt=` в ссылках |
| K6 | `\"Sperm Cramps\"` в title | ❌ всё ещё `\&quot;Sperm Cramps\&quot;` |
| K7 | «Why They Work Better» в title | ❌ |
| K8 | title > 60 | ❌ 313 страниц |
| K9 | description > 160 / < 70 | ❌ 143 / 34 |
| K10 | og:image в workouts | ❌ og:image у 351 из 754 |
| K11 | width/height у img | ❌ 3 493 картинки |
| K13 | Дубли `…take-to-work-men` и `how-to-remember-to-do-kegels` | ❌ первый ещё и не в индексе — проще слить |
| K14 | YouTube по клику | ❌ iframe на 7 главных |
| K15 | Скриншоты в WebP | не проверял |
| K16 | Person-автор, datePublished | ❌ Person 1/351; datePublished 246/287 статей |
| K17 | Smart App Banner | ❌ 35 из 754 страниц |
| K19 | JSON-LD на служебных | ❌ 54 страницы без разметки |
| K21 | lastmod в sitemap | ❌ 643 URL с `2026-10-18` |
| — | Workouts длиннее | ✅ медиана 450–570 слов |

## Чек-лист по порядку

1. [ ] GSC: «Запросить индексирование» для 10 EN-статей сегодня + 4 завтра (P0-1)
2. [ ] Блок «Popular guides» на главной (P0-2)
3. [ ] noindex упражнениям DE/ES/FR/UK + 60 коротким переводам статей (P0-3)
4. [ ] Баннер App Store в PE-статье (P0-4)
5. [ ] Удалить 3 демо-страницы (P0-5)
6. [ ] Title: dr-kegel-app-review, best-kegel-apps-for-men, sperm cramps, kegel-exercise-game
7. [ ] llms.txt: Android; полный llms-full.txt; Organization @id + sameAs
8. [ ] dev.to-пост, AlternativeTo, appshunter
9. [ ] Единая ссылка на App Store + campaign links (видно, какие страницы дают установки)
10. [ ] Через 2 недели: GSC → Индексирование → сколько осталось в «Обнаружена, не проиндексирована» (база: 176)
