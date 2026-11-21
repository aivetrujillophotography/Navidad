/* Grid gallery "show more" + night timeline line + entrances */
(() => {
  const btn = document.querySelector('[data-gg-more]');
  if (btn) {
    btn.addEventListener('click', () => {
      const hid = [...document.querySelectorAll('.gg-item[hidden]')].slice(0, 9);
      hid.forEach((el, i) => {
        el.hidden = false;
        if (window.gsap) gsap.fromTo(el, { autoAlpha: 0, y: 40, scale: .96 }, { autoAlpha: 1, y: 0, scale: 1, duration: .8, delay: i * .05, ease: 'power3.out', clearProps: 'all' });
      });
      const cnt = document.querySelector('[data-gg-count]');
      if (cnt) { const all = document.querySelectorAll('.gg-item').length; const shown = all - document.querySelectorAll('.gg-item[hidden]').length; cnt.textContent = cnt.dataset.tpl.replace('{n}', shown).replace('{t}', all); }
      if (!document.querySelector('.gg-item[hidden]')) btn.parentElement.remove();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }
  document.querySelectorAll('.fory').forEach((ul) => {
    const hint = ul.parentElement.querySelector('.swipe-hint');
    if (!hint) return;
    const cards = [...ul.children];
    const dots = document.createElement('span');
    dots.className = 'swipe-dots';
    cards.forEach((c, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', String(k + 1));
      b.addEventListener('click', () => ul.scrollTo({ left: c.offsetLeft - ul.offsetLeft - 16, behavior: 'smooth' }));
      dots.appendChild(b);
    });
    const bar = hint.querySelector('.swipe-bar');
    if (bar) bar.replaceWith(dots); else hint.prepend(dots);
    const upd = () => {
      const mid = ul.scrollLeft + ul.clientWidth / 2;
      let act = 0, best = 1e9;
      cards.forEach((c, k) => { const cx = c.offsetLeft - ul.offsetLeft + c.offsetWidth / 2; const d = Math.abs(cx - mid); if (d < best) { best = d; act = k; } });
      [...dots.children].forEach((b, k) => b.classList.toggle('is-on', k === act));
      hint.classList.toggle('is-end', act === cards.length - 1);
    };
    ul.addEventListener('scroll', upd, { passive: true });
    upd();
    // swipe anywhere in the section (title, cards, dots) moves the cards sideways; vertical swipes scroll the page
    const zone = ul.closest('section') || ul.parentElement;
    let sx = 0, sy = 0, sl = 0, mode = '';
    zone.addEventListener('touchstart', (e) => {
      if (e.target.closest('.mid-cta, a, button')) { mode = 'off'; return; }
      const t = e.touches[0]; sx = t.clientX; sy = t.clientY; sl = ul.scrollLeft; mode = '';
    }, { passive: true });
    zone.addEventListener('touchmove', (e) => {
      if (mode === 'off' || ul.scrollWidth <= ul.clientWidth + 4) return;
      const t = e.touches[0]; const dx = t.clientX - sx; const dy = t.clientY - sy;
      if (!mode && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) mode = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (mode === 'x' && !ul.contains(e.target)) { e.preventDefault(); ul.style.scrollSnapType = 'none'; ul.scrollLeft = sl - dx; }
    }, { passive: false });
    zone.addEventListener('touchend', () => {
      if (mode === 'x') {
        ul.style.scrollSnapType = '';
        const mid = ul.scrollLeft + ul.clientWidth / 2;
        let tgt = cards[0], best = 1e9;
        cards.forEach((c) => { const cx = c.offsetLeft - ul.offsetLeft + c.offsetWidth / 2; const d = Math.abs(cx - mid); if (d < best) { best = d; tgt = c; } });
        ul.scrollTo({ left: tgt.offsetLeft - ul.offsetLeft - 16, behavior: 'smooth' });
      }
      mode = '';
    }, { passive: true });
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting && ul.scrollWidth > ul.clientWidth + 10) {
          io.disconnect();
          setTimeout(() => { ul.scrollTo({ left: 70, behavior: 'smooth' }); setTimeout(() => ul.scrollTo({ left: 0, behavior: 'smooth' }), 650); }, 400);
        }
      });
    }, { threshold: .6 });
    io.observe(ul);
  });
  const ready = () => {
    if (!window.gsap || !window.ScrollTrigger || !document.documentElement.classList.contains('motion')) return;
    gsap.utils.toArray('.gg-item:not([hidden])').forEach((el, i) => {
      gsap.fromTo(el, { autoAlpha: 0, y: 50, scale: .95 }, { autoAlpha: 1, y: 0, scale: 1, duration: .9, delay: (i % 3) * .08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none reverse' } });
    });
    document.querySelectorAll('.ns-list').forEach((ol) => {
      gsap.fromTo(ol, { '--ns-fill': '0%' }, { '--ns-fill': '100%', ease: 'none', scrollTrigger: { trigger: ol, start: 'top 75%', end: 'bottom 60%', scrub: true } });
    });
    const bg = document.querySelector('.fbanner-bg img');
    if (bg) gsap.fromTo(bg, { yPercent: -12, scale: 1.15 }, { yPercent: 12, scale: 1.15, ease: 'none', scrollTrigger: { trigger: '.fbanner', start: 'top bottom', end: 'bottom top', scrub: true } });
  };
  if (document.readyState === 'complete') setTimeout(ready, 200); else addEventListener('load', () => setTimeout(ready, 200));
})();

/* Sobre mí: el avioncito recorre la ruta con el scroll */
(() => {
  const w = document.querySelector('.ab-route-wrap');
  if (!w) return;
  const fill = w.querySelector('.ab-route-fill'), plane = w.querySelector('.ab-plane'), stops = [...w.querySelectorAll('.ab-stop')];
  let raf = 0;
  const upd = () => {
    raf = 0;
    const r = w.getBoundingClientRect(), H = r.height - 20, mark = innerHeight * 0.62;
    const p = Math.max(0, Math.min(1, (mark - r.top - 10) / H));
    const y = p * H;
    fill.style.height = y + 'px';
    plane.style.top = (y - 5) + 'px';
    stops.forEach(s => { const d = s.querySelector('.ab-dot'); s.classList.toggle('is-on', d.getBoundingClientRect().top - r.top <= y + 12); });
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(upd); };
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); upd();
})();
