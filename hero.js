(() => {
  const d = document;
  const hero = d.querySelector('.hero');
  if (!hero) return;
  const slides = [...hero.querySelectorAll('.hs')];
  const dots = [...hero.querySelectorAll('.hd')];
  if (slides.length < 2) return;
  const DUR = 6500;
  let i = 0;
  let t0 = 0;
  let paused = false;
  let raf = 0;
  let timer = 0;

  // load the other slides only after the page (and the first photo) finished loading
  const fill = () => slides.forEach((s) => s.querySelectorAll('[data-srcset],[data-src]').forEach((el) => {
    if (el.dataset.srcset) { el.srcset = el.dataset.srcset; el.removeAttribute('data-srcset'); }
    if (el.dataset.src) { el.src = el.dataset.src; el.removeAttribute('data-src'); }
  }));
  if (d.readyState === 'complete') setTimeout(fill, 300); else addEventListener('load', () => setTimeout(fill, 300), { once: true });

  const show = (n) => {
    const next = (n + slides.length) % slides.length;
    if (next === i) return;
    const prev = slides[i];
    i = next;
    slides.forEach((s, k) => s.classList.toggle('is-on', k === i));
    slides.forEach((s) => s.classList.remove('is-prev'));
    prev.classList.add('is-prev');
    dots.forEach((b, k) => { b.classList.toggle('is-on', k === i); b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    restart();
  };

  const tick = (now) => {
    if (!t0) t0 = now;
    const p = Math.min(1, (now - t0) / DUR);
    const bar = dots[i] && dots[i].querySelector('i');
    if (bar) bar.style.transform = `scaleX(${p})`;
    dots.forEach((b, k) => { if (k !== i) { const x = b.querySelector('i'); if (x) x.style.transform = `scaleX(${k < i ? 1 : 0})`; } });
    raf = requestAnimationFrame(tick);
  };

  const restart = () => {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    t0 = 0;
    if (paused) return;
    raf = requestAnimationFrame(tick);
    timer = setTimeout(() => show(i + 1), DUR);
  };

  dots.forEach((b, k) => b.addEventListener('click', () => show(k)));
  d.addEventListener('visibilitychange', () => { paused = d.hidden; restart(); });
  new IntersectionObserver((e) => { paused = !e[0].isIntersecting; restart(); }, { threshold: 0.2 }).observe(hero);

  let sx = null;
  hero.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
    sx = null;
  });

  restart();
})();
