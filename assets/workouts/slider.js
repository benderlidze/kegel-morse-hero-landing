// Workout slider: arrows, counter, thumbnail tabs and arrow keys on top of a native scroll-snap track (swipe works without JS).
document.querySelectorAll('.wk-slider').forEach((slider) => {
  const track = slider.querySelector('.wk-track');
  const slides = [...track.children];
  const tabs = [...slider.querySelectorAll('.wk-tab')];
  const counter = slider.querySelector('.wk-counter b');
  const prev = slider.querySelector('.wk-prev');
  const next = slider.querySelector('.wk-next');
  let current = 0;

  const go = (i) => {
    i = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: 'smooth' });
  };
  const mark = (i) => {
    current = i;
    counter.textContent = i + 1;
    tabs.forEach((t, k) => {
      t.classList.toggle('is-active', k === i);
      t.classList.toggle('is-done', k < i);
      if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
    slider.style.setProperty('--progress', `${((i + 1) / slides.length) * 100}%`);
  };

  // the slide that fills most of the track is the current one
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting && e.intersectionRatio > 0.6) mark(slides.indexOf(e.target)); });
  }, { root: track, threshold: [0.6] });
  slides.forEach((s) => io.observe(s));

  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  tabs.forEach((t, k) => t.addEventListener('click', () => go(k)));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
  });
  mark(0);
});
