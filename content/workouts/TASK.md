# Task: build the /workouts/ section (26 programs + 30 exercise pages)

Work in E:\kegel-morse-hero-landing (static site, deployed on push: do NOT commit or push, the owner decides).
Reply to the owner in Russian, short. Prototype stays `noindex` and out of the sitemap (PUBLISH = false in the build script).

## What already exists (read first)
- scripts/build-workouts.mjs: builds /workouts/ hub + program pages from content/workouts/workouts.json. Program page = hero, slider (assets/workouts/slider.js), one section per exercise, "How to do this routine", app block, safety line, HowTo JSON-LD.
- assets/workouts/workouts.css: styles (dark site, figures on a dark radial background).
- assets/workouts/anatomy/<id>.webp: 34 pictures of the male "anatomy" character (grey figure, red muscles).
- content/workouts/workouts.json: 6 exercises + 1 program (pelvic-floor-exercises-for-men-beginner). Use it as the pattern.
- Exercise names / cues / reps: E:\kmh-video-gen\catalog.js (`const CATALOG = {...}`, load it with `new Function(src + ';return CATALOG')()`).
- Woman pictures (flat vector, transparent PNG): E:\kmh-video-gen\assets\raw\ex\woman\<id>.png (two poses side by side; kegelLying, kegelSitting, kegelStanding, breathing are single poses).
- Preview: local server on http://localhost:5196 (launch config "kmh-site" in E:\drypage-videos\.claude\launch.json; or `python -m http.server 5196 -d E:/kegel-morse-hero-landing`).
- Full-page screenshots: `node C:\Users\S\AppData\Local\Temp\claude\E--drypage-videos\8a63435b-591c-4917-856e-6ec6ae2d6439\scratchpad\shot.js <url> <out.png> <width> [height]` (width 390 = phone emulation). If that file is gone: puppeteer-core from E:\kmh-video-gen\node_modules with Edge at C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe.

## Steps
1. Pictures for women: convert E:\kmh-video-gen\assets\raw\ex\woman\<id>.png for the 30 exercise ids into assets/workouts/woman/<id>.webp the same way the anatomy ones were made (trim transparent border + 20 px, longest side 1100, WebP quality 80, keep alpha; use method=4, method=6 is very slow).
2. workouts.json:
   - `exercises`: all 30 ids below. For each: name, short, cues (3), reps from catalog.js; `works` (2-3 muscle groups, plain words: Pelvic floor, Glutes, Hamstrings, Inner thighs, Deep core, Abdominals, Back muscles, Hips, Thighs); `single: true` for kegelLying, kegelSitting, kegelStanding, breathing; `mistake` where catalog.js has one; optional short `tip`. Wording: technique only, no health promises.
   - `programs`: the 26 below. Each: slug, title (<= 60 chars, the given title), h1, description (140-160 chars, starts with the search phrase), lede (1-2 sentences), level, minutes, equipment, `character` ("anatomy" for men, "woman" for women), items, howTo (3-4 lines). Postpartum page: add a `note` shown at the top: "Get your doctor's or midwife's OK first, especially after a C-section or a hard birth." (render it).
3. build-workouts.mjs:
   - picture path from the program's `character` (assets/workouts/<character>/<id>.webp); alt text names the exercise and position.
   - hub: two groups "For men" and "For women", cards with the first non-kegel picture, title, "N exercises · ~M min · level".
   - exercise pages: /workouts/exercises/<kebab-id>/ (e.g. glute-bridge): h1 "<Name>: how to do it (with pictures)", picture (anatomy), works chips, cues, reps, mistake, and "In these workouts" = links to every program that uses it. HowTo JSON-LD. Program exercise sections link their h2 to these pages.
   - breadcrumbs everywhere; prev/next program links at the bottom of program pages.
4. Build (`node scripts/build-workouts.mjs`), open several pages locally, check: no broken images (JS: every img complete && naturalWidth > 0 after scrolling), slider works (arrows, tabs, counter), phone width 390 has no horizontal overflow (document.documentElement.scrollWidth == innerWidth). Screenshot the hub, one men's page and one women's page (desktop + phone) and show them to the owner.
5. Do not touch build-blog.mjs, sitemap.xml, the nav or other pages. Report: what was built, page count, anything you skipped.

## The 30 exercise ids
kegelLying, kegelSitting, kegelStanding, breathing, bridge, bridgeBall, singleLegBridge, bridgeMarch, heelSlides, supineMarch, deadBug, pelvicTilt, kneeFallout, clamshell, sideLegRaise, birdDog, catCow, plank, sidePlank, superman, childPose, happyBaby, butterfly, frogStretch, hipFlexor, squat, sumoSquat, wallSit, lunge, ballSqueeze

## The 26 programs (title | character | items)
Men (character anatomy):
1. Pelvic Floor Exercises for Men: 6-Move Beginner Routine | already built, keep
2. Kegel Exercises for Men: 5-Minute Daily Routine | kegelLying, kegelSitting, kegelStanding, bridge, breathing
3. Evening Kegel Routine for Men: 5 Calm Moves Before Bed | kegelLying, pelvicTilt, butterfly, kneeFallout, childPose
4. Morning Pelvic Floor Workout for Men: 6 Moves | catCow, bridge, birdDog, supineMarch, squat, kegelStanding
5. Kegel Exercises at Your Desk: Office Routine for Men | kegelSitting, ballSqueeze, hipFlexor, squat, kegelStanding
6. Pelvic Floor Exercises for Men Over 40 | kegelLying, bridge, deadBug, clamshell, wallSit, breathing
7. Gentle Pelvic Floor Routine for Men Over 50 | breathing, kegelLying, heelSlides, supineMarch, pelvicTilt, kegelSitting
8. Pelvic Floor Workout for Lifters: Before Heavy Squats | breathing, bridgeMarch, sumoSquat, wallSit, lunge, deadBug
9. Pelvic Floor Exercises for Runners and Cyclists | singleLegBridge, sideLegRaise, hipFlexor, lunge, happyBaby, kegelStanding
10. Pelvic Floor Stretches for Men: 6 Moves for Tight Hips | hipFlexor, butterfly, frogStretch, happyBaby, childPose, catCow
11. Core and Pelvic Floor Workout for Men: No Equipment | plank, sidePlank, deadBug, birdDog, superman, bridgeMarch
12. Pelvic Floor Exercises for Long Drives: Routine for Drivers | kegelSitting, hipFlexor, squat, catCow, childPose
Women (character woman):
13. Kegel Exercises for Women: 6-Move Beginner Routine | kegelLying, bridge, clamshell, pelvicTilt, catCow, kegelSitting
14. Pelvic Floor Exercises for Women: 5-Minute Daily Routine | kegelLying, bridgeBall, heelSlides, kegelSitting, breathing
15. Morning Pelvic Floor Routine for Women | catCow, pelvicTilt, bridge, birdDog, kegelStanding
16. Evening Pelvic Floor Routine for Women: Calm Moves Before Bed | breathing, kegelLying, happyBaby, butterfly, childPose
17. Pelvic Floor Exercises for Women at Home: No Equipment | bridge, clamshell, sideLegRaise, deadBug, squat, kegelLying
18. Pelvic Floor Exercises for Women Over 40 | kegelLying, bridgeBall, birdDog, wallSit, clamshell, breathing
19. Pelvic Floor Exercises for Women Over 50: Gentle Routine | breathing, kegelLying, heelSlides, pelvicTilt, kegelSitting, supineMarch
20. Postpartum Pelvic Floor Exercises: Gentle First Routine | breathing, kegelLying, pelvicTilt, heelSlides, kneeFallout
21. Bladder Control Routine for Women: 6 Pelvic Floor Moves | kegelLying, kegelSitting, kegelStanding, bridgeBall, ballSqueeze, breathing
22. Pelvic Floor Stretches for Women: Relax and Release | happyBaby, butterfly, childPose, frogStretch, catCow, breathing
23. Core and Pelvic Floor Workout for Women | deadBug, birdDog, plank, sidePlank, bridgeMarch, kegelLying
24. Pelvic Floor Exercises for Women Runners | singleLegBridge, sideLegRaise, lunge, clamshell, hipFlexor, kegelStanding
25. Desk Pelvic Floor Routine for Women Who Sit All Day | kegelSitting, ballSqueeze, hipFlexor, squat, catCow
26. Yoga-Style Pelvic Floor Routine for Women | catCow, childPose, happyBaby, butterfly, bridge, breathing

Rules for every text: no libido/ED/"last longer"/size, no cures or exact-day promises, "Not medical advice" safety line stays on every page.
