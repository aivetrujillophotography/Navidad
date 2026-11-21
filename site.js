(() => {
  const d = document;
  const h = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const es = h.lang.startsWith('es');
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const motion = h.classList.contains('motion') && hasGsap;
  const pad = (n) => String(n).padStart(2, '0');
  let lenis = null;
  const MOB = matchMedia('(max-width: 899px)').matches;
  const RV = MOB ? { toggleActions: 'play none none reverse' } : { once: true };

  if (h.classList.contains('motion') && !hasGsap) {
    h.classList.remove('motion');
    h.classList.add('no-motion');
  }

  const nav = $('.nav');
  const hero = $('.hero');
  const bookbar = $('.bookbar');
  const waFloat = $('.wa-float');
  let lastY = scrollY;
  let menuOpen = false;
  let hideBar = false;

  const onScroll = () => {
    const y = scrollY;
    const heroEnd = hero ? hero.offsetHeight - 90 : 200;
    nav.classList.toggle('is-solid', y > heroEnd);
    if (!menuOpen) nav.classList.toggle('is-hidden', y > lastY && y > 240);
    const past = y > (hero ? hero.offsetHeight * 0.8 : 400);
    if (bookbar) bookbar.classList.toggle('is-on', past && !hideBar);
    if (waFloat) waFloat.classList.toggle('is-on', past);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const zones = $$('.closing, .foot');
  if (bookbar && zones.length) {
    const seen = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      hideBar = seen.size > 0;
      onScroll();
    }, { threshold: 0.2 });
    zones.forEach((z) => io.observe(z));
  }

  const menu = $('.menu');
  const burger = $('.burger');
  if (menu && burger) {
    const panel = $('.menu-panel', menu);
    const photo = $('.menu-photo', menu);
    const closeBtn = $('.menu-close', menu);
    const links = $$('.m-link', menu);
    const pics = $$('.menu-pics img', menu);
    const capT = $('.menu-cap-t', menu);
    const capN = $('.menu-cap-n', menu);
    let cur = 0;
    const show = (i) => {
      if (i === cur || !pics[i]) return;
      const prev = pics[cur];
      const next = pics[i];
      cur = i;
      if (capT) capT.textContent = links[i].getAttribute('data-cap') || '';
      if (capN) capN.textContent = `${pad(i + 1)} / ${pad(links.length)}`;
      if (!motion) {
        pics.forEach((p, k) => p.classList.toggle('is-on', k === i));
        return;
      }
      pics.forEach((p) => p.classList.remove('is-top'));
      next.classList.add('is-top');
      gsap.killTweensOf(next);
      gsap.fromTo(next, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.18 }, {
        clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.9, ease: 'power4.out',
        onComplete: () => { pics.forEach((p) => p.classList.remove('is-on')); next.classList.add('is-on'); next.classList.remove('is-top'); },
      });
      gsap.to(prev, { scale: 1.06, duration: 0.9, ease: 'power4.out' });
    };
    links.forEach((a, i) => {
      a.addEventListener('mouseenter', () => show(i));
      a.addEventListener('focus', () => show(i));
    });
    const clocks = $$('.menu-time', menu);
    const tick = () => {
      const now = new Date();
      clocks.forEach((el) => {
        const tz = el.getAttribute('data-tz');
        try {
          const time = new Intl.DateTimeFormat(es ? 'es-MX' : 'en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(now);
          const off = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(now).find((p) => p.type === 'timeZoneName');
          el.innerHTML = `${time} <small>${off ? off.value : ''}</small>`;
        } catch (e) {}
      });
    };
    const wxEls = $$('.tz-wx', menu);
    const wxWord = (c, day) => {
      const m = [
        [[0], es ? (day ? 'Soleado' : 'Despejado') : (day ? 'Sunny' : 'Clear')],
        [[1, 2], es ? 'Medio nublado' : 'Partly cloudy'],
        [[3], es ? 'Nublado' : 'Cloudy'],
        [[45, 48], es ? 'Neblina' : 'Foggy'],
        [[51, 53, 55, 56, 57], es ? 'Llovizna' : 'Drizzle'],
        [[61, 63, 65, 66, 67, 80, 81, 82], es ? 'Lluvia' : 'Rain'],
        [[71, 73, 75, 77, 85, 86], es ? 'Nieve' : 'Snow'],
        [[95, 96, 99], es ? 'Tormenta' : 'Storm'],
      ];
      const hit = m.find(([codes]) => codes.includes(c));
      return hit ? hit[1] : '';
    };
    const paintWx = (data) => {
      wxEls.forEach((el) => {
        const cur = data[+el.getAttribute('data-wx')];
        if (!cur) return;
        el.textContent = `${Math.round(cur.t)}°C · ${wxWord(cur.c, cur.d)}`;
      });
    };
    let wxDone = false;
    const loadWx = () => {
      if (wxDone || !wxEls.length) return;
      wxDone = true;
      try {
        const cached = JSON.parse(sessionStorage.getItem('aive-wx') || 'null');
        if (cached && Date.now() - cached.at < 1800000) { paintWx(cached.data); return; }
      } catch (e) {}
      fetch('https://api.open-meteo.com/v1/forecast?latitude=20.6296,28.4053&longitude=-87.0739,-106.8667&current=temperature_2m,weather_code,is_day')
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j) => {
          const data = (Array.isArray(j) ? j : [j]).map((x) => ({ t: x.current.temperature_2m, c: x.current.weather_code, d: x.current.is_day === 1 }));
          paintWx(data);
          try { sessionStorage.setItem('aive-wx', JSON.stringify({ at: Date.now(), data })); } catch (e) {}
        })
        .catch(() => { wxDone = false; });
    };
    let clockT;
    const open = () => {
      menuOpen = true;
      menu.classList.add('is-open');
      menu.removeAttribute('inert');
      burger.setAttribute('aria-expanded', 'true');
      d.body.style.overflow = 'hidden';
      lenis && lenis.stop();
      tick();
      loadWx();
      clockT = setInterval(tick, 20000);
      if (motion) {
        gsap.killTweensOf([panel, photo]);
        const tl = gsap.timeline();
        tl.fromTo(panel, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power4.inOut' }, 0)
          .fromTo(photo, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power4.inOut' }, 0.08)
          .fromTo($$('.menu-pics img', menu), { scale: 1.25 }, { scale: 1, duration: 1.6, ease: 'power3.out' }, 0.1)
          .fromTo($$('.m-link', menu), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.06, ease: 'power4.out' }, 0.38)
          .fromTo($$('.menu-label, .menu-foot > *, .menu-cap', menu), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'power4.out' }, 0.55);
      }
      if (!matchMedia('(pointer:coarse)').matches) setTimeout(() => links[0] && links[0].focus({ preventScroll: true }), motion ? 500 : 0);
    };
    const close = (returnFocus = true) => {
      if (!menuOpen) return;
      menuOpen = false;
      clearInterval(clockT);
      burger.setAttribute('aria-expanded', 'false');
      d.body.style.overflow = '';
      lenis && lenis.start();
      const done = () => { menu.classList.remove('is-open'); menu.setAttribute('inert', ''); };
      if (motion) {
        const tl = gsap.timeline({ onComplete: done });
        tl.to($$('.m-link', menu), { yPercent: -110, duration: 0.45, stagger: 0.03, ease: 'power3.in' }, 0)
          .to(photo, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.75, ease: 'power4.inOut' }, 0.1)
          .to(panel, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.75, ease: 'power4.inOut' }, 0.2);
      } else done();
      if (returnFocus) burger.focus({ preventScroll: true });
    };
    burger.addEventListener('click', open);
    closeBtn.addEventListener('click', () => close());
    links.forEach((a) => a.addEventListener('click', () => close(false)));
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) close(); });
  }

  const track = $('.track');
  const counterNow = $('.counter-now');
  const counterBar = $('.counter-bar i');
  const cards = track ? $$('.card[data-i]', track) : [];
  const setCounter = (p) => {
    if (!cards.length) return;
    const i = Math.min(cards.length - 1, Math.max(0, Math.round(p * (cards.length - 1))));
    if (counterNow) counterNow.textContent = pad(i + 1);
    if (counterBar) counterBar.style.transform = `scaleX(${(i + 1) / cards.length})`;
  };
  if (track) {
    track.addEventListener('scroll', () => {
      const max = track.scrollWidth - track.clientWidth;
      if (max > 0) setCounter(track.scrollLeft / max);
    }, { passive: true });
  }

  const steps = $$('.step');
  if (!motion) steps.forEach((s) => s.classList.add('is-on'));

  const stage = $('.quotes-stage');
  if (stage) {
    const qs = $$('.quote-card', stage);
    const now = $('.qcount-now');
    let qi = 0;
    let busy = false;
    const go = (n) => {
      if (busy || qs.length < 2) return;
      const next = (n + qs.length) % qs.length;
      const cur = qs[qi];
      const nxt = qs[next];
      qi = next;
      if (now) now.textContent = pad(qi + 1);
      if (!motion) { cur.classList.remove('is-on'); nxt.classList.add('is-on'); return; }
      busy = true;
      gsap.timeline({ onComplete: () => { busy = false; } })
        .to(cur, { autoAlpha: 0, y: -16, duration: 0.45, ease: 'power2.in' })
        .add(() => { cur.classList.remove('is-on'); gsap.set(cur, { y: 0 }); nxt.classList.add('is-on'); })
        .fromTo(nxt, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 })
        .fromTo($('.quote-photo', nxt), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power4.inOut' }, '<')
        .fromTo($('.quote-photo img, .quote-photo .qpi-ini', nxt) || nxt, { scale: 1.15 }, { scale: 1, duration: 1.4, ease: 'power3.out' }, '<')
        .fromTo($$('.quote-mark, .quote, .quote-who, .quote-note', nxt), { opacity: 0, y: 28, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, stagger: 0.08, ease: 'power4.out', clearProps: 'filter' }, '<0.2');
    };
    $('.qprev').addEventListener('click', () => go(qi - 1));
    $('.qnext').addEventListener('click', () => go(qi + 1));
    stage.closest('section').addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') go(qi + 1);
      if (e.key === 'ArrowLeft') go(qi - 1);
    });
    let sx = null;
    stage.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    stage.addEventListener('pointerup', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 50) go(qi + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  const lb = $('.lightbox');
  const shots = $$('[data-lb]');
  if (lb && shots.length) {
    const img = $('.lb-stage img', lb);
    const cnt = $('.lb-count', lb);
    const cap = $('.lb-cap', lb);
    let li = 0;
    const render = (dir = 0) => {
      const b = shots[li];
      const im = $('img', b);
      img.src = b.getAttribute('data-lb');
      img.alt = im ? im.alt : '';
      cnt.textContent = `${pad(li + 1)} / ${pad(shots.length)}`;
      cap.textContent = b.getAttribute('data-cap') || '';
      if (motion) gsap.fromTo(img, { opacity: 0, x: dir * 60, scale: 0.96 }, { opacity: 1, x: 0, scale: 1, duration: 0.7, ease: 'power4.out' });
    };
    shots.forEach((b, i) => b.addEventListener('click', () => { li = i; render(); lb.showModal(); lenis && lenis.stop(); }));
    d.querySelectorAll('[data-dup]').forEach((b) => b.addEventListener('click', () => { const o = shots[+b.getAttribute('data-dup')]; if (o) o.click(); }));
    const step = (n) => { li = (li + n + shots.length) % shots.length; render(n); };
    $('.lb-prev', lb).addEventListener('click', () => step(-1));
    $('.lb-next', lb).addEventListener('click', () => step(1));
    $('.lb-close', lb).addEventListener('click', () => lb.close());
    lb.addEventListener('close', () => { lenis && lenis.start(); shots[li].focus({ preventScroll: true }); });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
    const st = $('.lb-stage', lb);
    let sx = null;
    st.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    st.addEventListener('pointerup', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      sx = null;
    });
  }

  $$('[data-mail]').forEach((a) => {
    const [u, dm] = a.getAttribute('data-mail').split('|');
    a.href = `mailto:${u}@${dm}`;
    if (!a.children.length && !a.textContent.trim()) a.textContent = `${u}@${dm}`;
  });
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  if (!motion) {
    window.__aiveReady = true;
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 }); window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    h.classList.add('lenis');
  }

  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href') || '';
    if (id.length < 2 || id.charAt(0) !== '#') return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: -150, duration: 1.4 });
    else t.scrollIntoView({ behavior: 'smooth' });
  }));

  const pt = $('.pt');
  if (pt) {
    if (h.classList.contains('pt-in')) {
      gsap.fromTo(pt, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'power4.inOut', delay: 0.15, onComplete: () => h.classList.remove('pt-in') });
    }
    d.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.protocol.indexOf('http') !== 0) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      try { sessionStorage.setItem('aive-pt', '1'); } catch (err) {}
      gsap.fromTo(pt, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power4.inOut', onComplete: () => { location.href = url.href; } });
    });
    addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(pt, { clipPath: 'inset(100% 0% 0% 0%)' }); });
  }

  if (fine) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.45);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  const splitLines = (el) => {
    if (!window.SplitText) return [el];
    return SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'ln' }).lines;
  };

  const heroIntro = () => {
    if (!hero) return;
    const title = $('.display', hero);
    const lines = splitLines(title);
    gsap.set(title, { opacity: 1 });
    gsap.timeline()
      .fromTo($('.hero-media', hero), { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.8, ease: 'power3.out' }, 0)
      .fromTo(lines, { yPercent: 110, rotate: 2 }, { yPercent: 0, rotate: 0, duration: 1, stagger: 0.1, ease: 'power4.out' }, 0.15)
      .fromTo($$('[data-hero-fade]', hero), { opacity: 0, y: 32, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, stagger: 0.08, ease: 'power4.out', clearProps: 'filter' }, 0.6)
      .fromTo('.nav .brand', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut' }, 0.4);
  };

  const runLoader = (next) => {
    const ld = $('.loader');
    let seen = false;
    try { seen = !!sessionStorage.getItem('aive-seen'); } catch (e) {}
    if (ld && ld.classList.contains('photo')) {
      try { sessionStorage.setItem('aive-seen', '1'); } catch (e) {}
      let nav = 'navigate';
      try { nav = (performance.getEntriesByType('navigation')[0] || {}).type || 'navigate'; } catch (e) {}
      let internal = false;
      try { internal = !!d.referrer && new URL(d.referrer).origin === location.origin; } catch (e) {}
      if (nav !== 'reload' && internal) { ld.remove(); next(); return; }
      const root = d.documentElement, block = (e) => e.preventDefault();
      root.style.overflow = 'hidden'; d.body.style.overflow = 'hidden';
      try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
      scrollTo(0, 0);
      if (window.__lenis) { __lenis.scrollTo(0, { immediate: true }); __lenis.stop(); }
      addEventListener('wheel', block, { passive: false }); addEventListener('touchmove', block, { passive: false });
      const fam = $('.pf-fam', ld), vf = $('.pf-vf', ld), flash = $('.pf-flash', ld), hud = $('.pf-hud', ld), toast = $('.pf-toast', ld);
      const startC = $('.pf-start', ld), finalC = $('.pf-final', ld);
      const W = () => innerWidth, H = () => innerHeight;
      gsap.set(fam, { x: W() * 0.4, y: H() * 0.66 });
      let wTw = null, speed = 1;
      const wander = () => {
        const fw = fam.getBoundingClientRect().width;
        const nx = W() * 0.04 + Math.random() * (W() * 0.92 - fw);
        const ny = H() * (0.6 + Math.random() * 0.22);
        fam.classList.toggle('is-left', nx < gsap.getProperty(fam, 'x'));
        wTw = gsap.to(fam, { x: nx, y: ny, duration: (1.2 + Math.random() * 2) / speed, ease: 'sine.inOut', onComplete: wander });
      };
      wander();
      const vx = gsap.quickTo(vf, 'x', { duration: 0.35, ease: 'power3.out' }), vy = gsap.quickTo(vf, 'y', { duration: 0.35, ease: 'power3.out' });
      gsap.set(vf, { x: W() / 2, y: H() * 0.5 });
      const move = (e) => { const p = e.touches ? e.touches[0] : e; vx(p.clientX); vy(p.clientY); };
      ld.addEventListener('pointermove', move); ld.addEventListener('touchmove', move, { passive: true });
      let playing = false, shots = 3, stars = 0;
      const msgs = d.documentElement.lang.startsWith('en')
        ? ['They got away! 🏃', 'Almost… the little one moved 😄', 'So close! Nice one', 'Perfect shot! ✦']
        : ['¡Se te escaparon! 🏃', 'Casi… se te movió el peque 😄', '¡Muy cerca! Bien ahí', '¡Foto perfecta! ✦'];
      const shoot = (e) => {
        if (!playing || e.target.closest('button')) return;
        const p = e.touches ? e.changedTouches[0] : e;
        if (e.pointerType !== 'mouse') gsap.set(vf, { x: p.clientX, y: p.clientY });
        gsap.fromTo(flash, { opacity: 0.9 }, { opacity: 0, duration: 0.5, ease: 'power2.out' });
        const a = fam.getBoundingClientRect();
        const cx = gsap.getProperty(vf, 'x'), cy = gsap.getProperty(vf, 'y'), vw = vf.offsetWidth, vh = vf.offsetHeight;
        const b = { left: cx - vw / 2, right: cx + vw / 2, top: cy - vh / 2, bottom: cy + vh / 2 };
        const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        const ratio = (ix * iy) / (a.width * a.height);
        const dist = Math.hypot((a.left + a.width / 2) - cx, (a.top + a.height / 2) - cy) / vw;
        const sc = ratio > 0.85 && dist < 0.3 ? 3 : ratio > 0.55 ? 2 : ratio > 0.15 ? 1 : 0;
        stars += sc; shots--;
        $('.pf-left', ld).textContent = shots; $('.pf-score', ld).textContent = stars;
        const shot = $('.pf-shot', toast); shot.innerHTML = '';
        if (sc > 0) { const c = fam.cloneNode(true); c.style.cssText = 'position:absolute;width:' + (a.width * 200 / vw) + 'px;left:' + ((a.left - b.left) * 200 / vw) + 'px;top:' + ((a.top - b.top) * (200 / vw)) + 'px;transform:none'; shot.appendChild(c); }
        $('.pf-stars', toast).textContent = '★'.repeat(sc) + '☆'.repeat(3 - sc);
        $('.pf-msg', toast).textContent = msgs[sc];
        toast.hidden = false; gsap.fromTo(toast, { opacity: 0, y: 20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' });
        clearTimeout(toast._t); toast._t = setTimeout(() => { toast.hidden = true; }, 1500);
        speed = 1 + (3 - shots) * 0.35;
        if (shots <= 0) {
          playing = false;
          setTimeout(() => {
            hud.hidden = true; toast.hidden = true; ld.classList.add('is-menu'); if (px) px.hidden = true;
            $('.pf-final-h', ld).innerHTML = (d.documentElement.lang.startsWith('en') ? 'You got ' : '¡Sumaste ') + stars + ' ⭐ ' + (d.documentElement.lang.startsWith('en') ? 'of 9!' : 'de 9!');
            finalC.hidden = false; gsap.fromTo(finalC, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' });
          }, 1300);
        }
      };
      ld.addEventListener('pointerup', shoot);
      const px = $('.pf-x', ld);
      const quitPhoto = () => { playing = false; hud.hidden = true; toast.hidden = true; finalC.hidden = true; startC.hidden = false; ld.classList.add('is-menu'); if (px) px.hidden = true; };
      if (px) px.addEventListener('click', (e) => { e.stopPropagation(); quitPhoto(); });
      const play = () => { shots = 3; stars = 0; speed = 1; $('.pf-left', ld).textContent = 3; $('.pf-score', ld).textContent = 0; startC.hidden = true; finalC.hidden = true; hud.hidden = false; ld.classList.remove('is-menu'); if (px) px.hidden = false; setTimeout(() => { playing = true; }, 250); };
      let opened = false;
      const open = () => {
        if (opened) return; opened = true; playing = false;
        if (wTw) wTw.kill();
        gsap.timeline({ onComplete: () => ld.remove() })
          .to(ld, { yPercent: -100, duration: 1.05, ease: 'power4.inOut' }, 0)
          .add(() => {
            removeEventListener('wheel', block); removeEventListener('touchmove', block);
            root.style.overflow = ''; d.body.style.overflow = ''; scrollTo(0, 0);
            if (window.__lenis) { __lenis.scrollTo(0, { immediate: true }); __lenis.start(); }
            next();
          }, 0.35);
      };
      ld.classList.add('is-menu');
      $$('.pf-play', ld).forEach((b) => b.addEventListener('click', play));
      $$('.pf-enter', ld).forEach((b) => b.addEventListener('click', open));
      $('.pf-skip', ld).addEventListener('click', open);
      ld.addEventListener('keydown', (e) => { if (e.key === 'Escape') open(); });
      return;
    }
    if (!ld || seen || h.classList.contains('seen')) { if (ld) ld.remove(); next(); return; }
    try { sessionStorage.setItem('aive-seen', '1'); } catch (e) {}
    if (ld.classList.contains('xmas')) {
      const sky = $('.xm-sky', ld), vil = $('.xm-village', ld), txt = $('.xm-text', ld), santa = $('.xm-santa', ld), go = $('.xm-go', ld);
      const W = innerWidth;
      const root = d.documentElement;
      const block = (e) => e.preventDefault();
      root.style.overflow = 'hidden'; d.body.style.overflow = 'hidden';
      try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
      scrollTo(0, 0);
      if (window.__lenis) { __lenis.scrollTo(0, { immediate: true }); __lenis.stop(); }
      addEventListener('wheel', block, { passive: false }); addEventListener('touchmove', block, { passive: false });
      const unlock = () => {
        removeEventListener('wheel', block); removeEventListener('touchmove', block);
        root.style.overflow = ''; d.body.style.overflow = '';
        scrollTo(0, 0);
        if (window.__lenis) { __lenis.scrollTo(0, { immediate: true }); __lenis.start(); }
      };
      gsap.fromTo(sky, { opacity: 0 }, { opacity: 1, duration: 0.6 });
      gsap.fromTo(vil, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.1 });
      gsap.fromTo($$('.xm-text > *', ld), { opacity: 0, y: 30, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, stagger: 0.2, ease: 'power3.out', delay: 0.35, clearProps: 'filter' });
      const flyFrom = () => gsap.fromTo(santa, { x: -0.5 * W, y: 70, rotate: -5 }, { x: 1.15 * W, y: -30, rotate: 3, duration: 9, ease: 'none', repeat: -1, repeatDelay: 1.2 });
      let fly = flyFrom();
      let paused = false;
      const setPaused = (v) => { paused = v; santa.classList.toggle('is-paused', v); };
      const resume = () => {
        const cx = gsap.getProperty(santa, 'x');
        const left = Math.max(0.15, (1.15 * W - cx) / (1.65 * W));
        fly.kill();
        fly = gsap.to(santa, { x: 1.15 * W, y: -30, rotate: 3, duration: 9 * left, ease: 'none', onComplete: () => { fly = flyFrom(); } });
        setPaused(false);
      };
      let drag = null;
      santa.addEventListener('pointerdown', (e) => {
        if (ld.classList.contains('is-playing')) return;
        e.preventDefault(); e.stopPropagation();
        fly.pause();
        drag = { sx: e.clientX, sy: e.clientY, x: gsap.getProperty(santa, 'x'), y: gsap.getProperty(santa, 'y'), moved: false, was: paused };
        santa.setPointerCapture(e.pointerId);
        santa.classList.add('is-drag');
      });
      santa.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
        if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
        if (drag.moved) gsap.set(santa, { x: drag.x + dx, y: drag.y + dy, rotate: 0 });
      });
      const endDrag = () => {
        if (!drag) return;
        const d0 = drag; drag = null; santa.classList.remove('is-drag');
        if (d0.moved) { setPaused(true); return; }
        if (d0.was) resume(); else setPaused(true);
      };
      santa.addEventListener('pointerup', endDrag);
      santa.addEventListener('pointercancel', endDrag);
      let opened = false;
      const open = () => {
        if (opened) return; opened = true;
        fly.kill();
        gsap.timeline({ onComplete: () => ld.remove() })
          .to(go, { scale: 0.9, opacity: 0, duration: 0.3 }, 0)
          .to([sky, txt, santa], { yPercent: -100, duration: 1.1, ease: 'power4.inOut' }, 0.15)
          .to(vil, { yPercent: 100, duration: 1.1, ease: 'power4.inOut' }, 0.15)
          .to(ld, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.6 }, 0.25)
          .add(() => { unlock(); next(); }, 0.4);
      };
      // ---- Mini game: Santa catches snowflakes ----
      const gm = $('.xm-game', ld);
      if (gm) {
        const hud = $('.xm-hud', ld), scEl = $('.xm-score', ld), tmEl = $('.xm-time', ld), endEl = $('.xm-end', ld), field = $('.xm-field', ld);
        const LV = { easy: { every: 520, fall: [5200, 6800], size: 34 }, mid: { every: 380, fall: [3800, 5200], size: 28 }, hard: { every: 260, fall: [2600, 3800], size: 22 } };
        let playing = false, score = 0, lvl = 'easy', spawnT = null, tickT = null, rafId = null, left = 15;
        const best = () => { try { return +localStorage.getItem('xm-best-' + lvl) || 0; } catch (e) { return 0; } };
        const saveBest = (v) => { try { localStorage.setItem('xm-best-' + lvl, String(v)); } catch (e) {} };
        const follow = (e) => {
          if (!playing) return;
          const pt = e.touches ? e.touches[0] : e;
          const r = santa.getBoundingClientRect();
          gsap.to(santa, { x: '+=' + (pt.clientX - (r.left + r.width * 0.62)), y: '+=' + (pt.clientY - (r.top + r.height * 0.45)), rotate: 0, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
        };
        ld.addEventListener('pointermove', follow);
        ld.addEventListener('touchmove', follow, { passive: true });
        const spawn = () => {
          const c = LV[lvl], f = d.createElement('b');
          f.className = 'xm-flake'; f.textContent = '❄';
          const sz = c.size * (0.8 + Math.random() * 0.5);
          f.style.fontSize = sz + 'px'; f.style.left = (4 + Math.random() * 92) + '%';
          field.appendChild(f);
          const dur = (c.fall[0] + Math.random() * (c.fall[1] - c.fall[0])) / 1000;
          f._tw = gsap.fromTo(f, { y: -40, rotate: 0 }, { y: innerHeight + 40, rotate: 360, duration: dur, ease: 'none', onComplete: () => f.remove() });
        };
        const hit = () => {
          if (!playing) return;
          const r = santa.getBoundingClientRect();
          const box = { l: r.left + r.width * 0.08, r: r.right - r.width * 0.02, t: r.top + r.height * 0.1, b: r.bottom - r.height * 0.15 };
          field.querySelectorAll('.xm-flake:not(.got)').forEach((f) => {
            const q = f.getBoundingClientRect(), cx = q.left + q.width / 2, cy = q.top + q.height / 2;
            if (cx > box.l && cx < box.r && cy > box.t && cy < box.b) {
              f.classList.add('got'); if (f._tw) f._tw.kill();
              score++; scEl.textContent = score;
              gsap.fromTo(scEl, { scale: 1.4 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' });
              gsap.to(f, { scale: 2, opacity: 0, duration: 0.35, onComplete: () => f.remove() });
            }
          });
          rafId = requestAnimationFrame(hit);
        };
        const stop = () => {
          playing = false; clearInterval(spawnT); clearInterval(tickT); cancelAnimationFrame(rafId);
          field.querySelectorAll('.xm-flake').forEach((f) => { if (f._tw) f._tw.kill(); gsap.to(f, { opacity: 0, duration: 0.3, onComplete: () => f.remove() }); });
          const b = best(); const rec = score > b; if (rec) saveBest(score);
          $('.xm-end-n', ld).textContent = score;
          $('.xm-end-best', ld).textContent = rec ? ((d.documentElement.lang || '').startsWith('en') ? 'New record! 🎉' : '¡Nuevo récord! 🎉') : (((d.documentElement.lang || '').startsWith('en') ? 'Your best: ' : 'Tu mejor marca: ') + b);
          hud.hidden = true; endEl.hidden = false;
          gsap.fromTo(endEl, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)' });
        };
        const start = (l) => {
          lvl = l; score = 0; left = 15; scEl.textContent = '0'; tmEl.textContent = '15';
          fly.kill(); setPaused(false);
          gsap.to(santa, { x: innerWidth * 0.5 - santa.getBoundingClientRect().width * 0.6, y: innerHeight * 0.45, rotate: 0, duration: 0.6, ease: 'power3.out' });
          gm.hidden = true; endEl.hidden = true; hud.hidden = false; ld.classList.add('is-playing');
          playing = true; spawn();
          spawnT = setInterval(spawn, LV[lvl].every);
          tickT = setInterval(() => { left--; tmEl.textContent = left; if (left <= 3) gsap.fromTo(tmEl, { scale: 1.3 }, { scale: 1, duration: 0.3 }); if (left <= 0) stop(); }, 1000);
          rafId = requestAnimationFrame(hit);
        };
        const quit = () => {
          playing = false; clearInterval(spawnT); clearInterval(tickT); cancelAnimationFrame(rafId);
          field.querySelectorAll('.xm-flake').forEach((f) => { if (f._tw) f._tw.kill(); f.remove(); });
          hud.hidden = true; endEl.hidden = true; gm.hidden = false; ld.classList.remove('is-playing');
          fly = flyFrom();
        };
        const qx = $('.xm-x', ld); if (qx) qx.addEventListener('click', (e) => { e.stopPropagation(); quit(); });
        gm.addEventListener('click', (e) => { const b = e.target.closest('[data-lvl]'); if (b) start(b.dataset.lvl); });
        $('.xm-retry', ld).addEventListener('click', () => start(lvl));
        $('.xm-levels', ld).addEventListener('click', () => { endEl.hidden = true; gm.hidden = false; ld.classList.remove('is-playing'); });
        $('.xm-end-go', ld).addEventListener('click', () => { ld.classList.remove('is-playing'); open(); });
      }
      if (go) { go.addEventListener('click', open); setTimeout(() => go.focus({ preventScroll: true }), 900); }
      else setTimeout(open, 3000);
      ld.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'Escape') open(); });
      return;
    }
    if (ld.classList.contains('iris')) {
      const wrap = $('.iris-blades', ld);
      const N = 8;
      const blades = [];
      for (let i = 0; i < N; i++) {
        const b = d.createElement('i');
        b.className = 'iris-blade';
        wrap.appendChild(b);
        blades.push(b);
      }
      const st = { r: 0, tw: 0 };
      const paint = () => {
        blades.forEach((b, i) => {
          b.style.transform = `rotate(${i * (360 / N) + st.tw}deg) translate(-50%, calc(-100% - ${st.r}vmax))`;
        });
      };
      paint();
      const logo = $('.iris-logo', ld);
      const ring = $('.iris-ring', ld);
      const place = $('.iris-place', ld);
      const tl = gsap.timeline({ onComplete: () => ld.remove() });
      tl.fromTo(logo, { opacity: 0, scale: 0.92, filter: 'blur(6px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }, 0)
        .fromTo(ring, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }, 0)
        .fromTo(place, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, 0.15)
        .to([logo, place], { opacity: 0, scale: 1.08, duration: 0.45, ease: 'power2.in' }, 0.85)
        .to(ring, { scale: 2.6, opacity: 0, duration: 0.9, ease: 'power3.in' }, 0.9)
        .to(st, { r: 75, tw: 38, duration: 1.25, ease: 'power3.inOut', onUpdate: paint }, 0.95)
        .add(next, 1.15);
      return;
    }
    const num = $('.loader-count', ld);
    const logo = $('.loader-logo', ld);
    const o = { v: 0 };
    const tl = gsap.timeline({ onComplete: () => ld.remove() });
    if (logo) tl.fromTo(logo, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'power2.inOut' }, 0);
    tl.to(o, { v: 100, duration: 0.7, ease: 'power2.inOut', onUpdate: () => { num.textContent = String(Math.round(o.v)).padStart(3, '0'); } }, 0)
      .to(ld, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.55, ease: 'power4.inOut' }, 0.65)
      .add(next, 0.72);
  };

  const build = () => {
    const mm = gsap.matchMedia();

    const svcCards = $$('.svc-grid .card');
    if (svcCards.length) {
      gsap.set(svcCards, { opacity: 0, y: 48, filter: 'blur(8px)' });
      ScrollTrigger.batch(svcCards, {
        start: 'top 90%', once: true,
        onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.09, ease: 'power4.out', clearProps: 'filter' }),
      });
      $$('.svc-grid .card-media').forEach((m) => {
        gsap.fromTo(m, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut', scrollTrigger: { trigger: m, start: 'top 90%', ...RV } });
        gsap.fromTo($$('img', m), { scale: 1.15 }, { scale: 1, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: m, start: 'top 90%', ...RV } });
      });
    }

    mm.add('(min-width:900px)', () => {
      const fsec = $('.float');
      if (!fsec) return;
      $$('.fl', fsec).forEach((f) => {
        const sp = parseFloat(f.getAttribute('data-speed')) || 1;
        gsap.fromTo(f, { y: () => innerHeight * 0.35 * sp }, { y: () => -innerHeight * 0.75 * sp, ease: 'none', scrollTrigger: { trigger: fsec, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
      });
      const title = $('.float-stage .h2', fsec);
      gsap.fromTo(title, { scale: 0.86 }, { scale: 1.06, ease: 'none', scrollTrigger: { trigger: fsec, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    mm.add('(max-width:899px)', () => {
      $$('.fl').forEach((f, i) => {
        gsap.fromTo(f, { y: i % 2 ? 50 : 20 }, { y: i % 2 ? -30 : -10, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });

    if (hero) {
      gsap.to($('.hero-media', hero), { yPercent: 18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to($('.hero-in', hero), { yPercent: -12, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: hero, start: '30% top', end: 'bottom top', scrub: true } });
    }

    runLoader(heroIntro);

    $$('[data-split]').forEach((el) => {
      const lines = splitLines(el);
      gsap.set(el, { opacity: 1 });
      gsap.fromTo(lines, { yPercent: 110, rotate: 1.5 }, { yPercent: 0, rotate: 0, duration: 1, stagger: 0.1, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%', ...RV } });
    });

    gsap.set('[data-reveal]', { y: 32, filter: 'blur(8px)' });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: !MOB,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, stagger: 0.08, ease: 'power4.out', clearProps: 'filter', overwrite: true }),
      onLeaveBack: MOB ? (b) => gsap.to(b, { opacity: 0, y: 32, duration: 0.4, ease: 'power2.in', overwrite: true }) : undefined,
    });

    $$('[data-curtain]').forEach((el) => {
      const im = $('img', el);
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', ...RV } });
      tl.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut' });
      if (im) tl.fromTo(im, { scale: 1.15 }, { scale: 1, duration: 1.6, ease: 'power3.out' }, 0);
    });

    $$('[data-parallax]').forEach((im) => {
      const a = parseFloat(im.getAttribute('data-parallax')) || 0.12;
      gsap.fromTo(im, { yPercent: -a * 50 }, { yPercent: a * 50, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    let activeTone = null;
    const setTone = (s) => {
      if (activeTone === s) return;
      activeTone = s;
      const night = s.hasAttribute('data-night');
      gsap.to(h, { '--bg': s.getAttribute('data-tone') || '#F6F1EA', '--fg': night ? '#F6F1EA' : '#141212', '--fg-soft': night ? '#C9C1BB' : '#6B5E57', duration: 0.9, ease: 'power2.out', overwrite: 'auto' });
    };
    $$('[data-tone]').forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => self.isActive && setTone(s) }));

    const man = $('.manifesto');
    if (man && window.SplitText) {
      const s = SplitText.create(man, { type: 'words' });
      gsap.fromTo(s.words, { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: man, start: 'top 80%', end: 'bottom 50%', scrub: true } });
      $$('.mpic', man).forEach((p) => gsap.fromTo(p, { width: 0 }, { width: '1.7em', duration: 1, ease: 'power4.out', scrollTrigger: { trigger: p, start: 'top 75%', ...RV } }));
    }

    $$('[data-count]').forEach((el) => {
      const raw = el.getAttribute('data-count');
      const to = parseFloat(raw);
      const dec = (raw.split('.')[1] || '').length;
      const o = { v: 0 };
      const fmt = (v) => (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US'));
      el.textContent = fmt(0);
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v); } }) });
    });

    $$('[data-wipe]').forEach((el) => {
      gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'power3.inOut', scrollTrigger: { trigger: el, start: 'top 92%', ...RV } });
    });

    $$('.marquee, [data-marquee]').forEach((mq) => {
      const dur = parseFloat(mq.getAttribute('data-speed')) || 30;
      const loop = mq.hasAttribute('data-reverse')
        ? gsap.fromTo(mq, { xPercent: -50 }, { xPercent: 0, repeat: -1, duration: dur, ease: 'none' })
        : gsap.to(mq, { xPercent: -50, repeat: -1, duration: dur, ease: 'none' });
      let base = 1;
      const wrapEl = mq.parentElement;
      wrapEl.addEventListener('pointerenter', () => { base = 0.12; gsap.to(loop, { timeScale: base, duration: 0.6, overwrite: true }); });
      wrapEl.addEventListener('pointerleave', () => { base = 1; gsap.to(loop, { timeScale: base, duration: 0.6, overwrite: true }); });
      // steady loop (no scroll-velocity boost: it made the strip jump)
    });

    const sun = $('.sun');
    if (sun) {
      gsap.timeline({ scrollTrigger: { trigger: sun, start: 'top bottom', end: 'bottom top', scrub: true } })
        .fromTo('.sun-disc', { yPercent: 35, scale: 0.92 }, { yPercent: -8, scale: 1, ease: 'none', duration: 1 })
        .to('.sun-disc', { yPercent: 85, scale: 1.08, ease: 'none', duration: 1.4 })
        .to('.sky-dusk', { opacity: 0.6, ease: 'none', duration: 1.4 }, '<');
      gsap.fromTo('.sun-facts li', { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.9, ease: 'power4.out', scrollTrigger: { trigger: '.sun-facts', start: 'top 92%', ...RV } });
    }
    const dusk = $('.dusk');
    if (dusk) {
      const moon = $('.moon', dusk);
      if (moon) gsap.fromTo(moon, { yPercent: 160, opacity: 0.4 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: dusk, start: 'top bottom', end: 'center center', scrub: true } });
      const disc = $('.dusk-disc', dusk);
      if (disc) gsap.fromTo(disc, { yPercent: 70 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: dusk, start: 'top bottom', end: 'bottom bottom', scrub: true } });
    }
    $$('.pc').forEach((p, i) => {
      gsap.fromTo(p, { rotate: (i % 2 ? 9 : -9), y: 80, opacity: 0 }, { opacity: 1, rotate: () => getComputedStyle(p).getPropertyValue('--tilt') || 0, y: 0, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'top 55%', scrub: true } });
    });

    const line = $('.steps-line i');
    if (line) gsap.to(line, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 78%', end: 'bottom 55%', scrub: true } });
    steps.forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 72%', onEnter: () => s.classList.add('is-on'), onLeaveBack: () => s.classList.remove('is-on') }));

    const cl = $('.closing');
    if (cl) {
      const inset = innerWidth < 700 ? 'inset(12% 8% 12% 8% round 200px)' : 'inset(18% 26% 18% 26% round 400px)';
      gsap.timeline({ scrollTrigger: { trigger: cl, start: 'top 85%', end: 'top top', scrub: true } })
        .fromTo($('.closing-frame', cl), { clipPath: inset }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' }, 0)
        .fromTo($('.closing-frame img', cl), { scale: 1.3 }, { scale: 1, ease: 'none' }, 0);
    }

    const ig = $$('.ig a');
    if (ig.length) gsap.fromTo(ig, { y: 60, opacity: 0, rotate: (i) => (i % 2 ? 4 : -4) }, { y: 0, opacity: 1, rotate: 0, duration: 1, stagger: 0.07, ease: 'power4.out', scrollTrigger: { trigger: '.ig', start: 'top 88%', ...RV } });

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    if (d.readyState === 'complete') setTimeout(() => ScrollTrigger.refresh(), 300);
    else addEventListener('load', () => ScrollTrigger.refresh());
    window.__aiveReady = true;
  };

  const fontsReady = d.fonts && d.fonts.ready ? Promise.race([d.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
  fontsReady.then(build);
})();

/* Translated testimonials: toggle original / translation */
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('.qn-btn');
  if (!b) return;
  var c = b.closest('.quote-body'); if (!c) return;
  var on = b.getAttribute('aria-pressed') !== 'true';
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  var tr = c.querySelector('.q-tr'), or = c.querySelector('.q-or');
  if (tr) tr.hidden = on; if (or) or.hidden = !on;
  var l = b.querySelector('.qn-l'); if (l) l.textContent = on ? b.dataset.back : b.dataset.go;
  var t = b.querySelector('.qn-t'); if (t) t.hidden = on;
});

/* Contact: build the email link on the client */
document.querySelectorAll('.ct-mail[data-u]').forEach(function (a) {
  var e = a.dataset.u + String.fromCharCode(64) + a.dataset.d;
  a.href = 'mailto:' + e;
  var t = a.querySelector('.ct-mail-t'); if (t) t.textContent = e;
});

/* When & where: Riviera Maya / Cuauhtémoc switch */
document.querySelectorAll('.ww-place').forEach(function (bar) {
  var box = bar.parentElement;
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('.ww-pl'); if (!b) return;
    bar.querySelectorAll('.ww-pl').forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    box.querySelectorAll('.ww-plp').forEach(function (p) {
      var show = p.dataset.plp === b.dataset.pl; p.hidden = !show;
      if (show) { p.querySelectorAll('[data-reveal]').forEach(function (r) { r.removeAttribute('data-reveal'); r.style.opacity = 1; }); if (window.gsap) gsap.fromTo(p.querySelectorAll('.ww-loc, .ww-lead'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .5, stagger: .04, ease: 'power2.out', clearProps: 'transform' }); }
    });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
});

/* Focal points: keep people centered in any crop (data-focus="x,y" in 0..1) */
(function () {
  var imgs = [].slice.call(document.querySelectorAll('img[data-focus]'));
  if (!imgs.length) return;
  function place(im) {
    var f = im.dataset.focus.split(',').map(parseFloat), W = im.clientWidth, H = im.clientHeight, iw = im.naturalWidth, ih = im.naturalHeight;
    if (!W || !H || !iw || !ih) return;
    var s = Math.max(W / iw, H / ih), sw = iw * s, sh = ih * s;
    var px = sw - W > 1 ? Math.min(1, Math.max(0, (f[0] * sw - W / 2) / (sw - W))) : .5;
    var py = sh - H > 1 ? Math.min(1, Math.max(0, (f[1] * sh - H / 2) / (sh - H))) : .5;
    im.style.setProperty('object-position', (px * 100).toFixed(1) + '% ' + (py * 100).toFixed(1) + '%', 'important');
  }
  function all() { imgs.forEach(function (im) { if (im.complete) place(im); else im.addEventListener('load', function () { place(im); }, { once: true }); }); }
  all();
  var t; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(all, 150); });
  if (window.ResizeObserver) { var ro = new ResizeObserver(function (es) { es.forEach(function (e) { if (e.target.tagName === 'IMG') place(e.target); }); }); imgs.forEach(function (im) { ro.observe(im); }); }
})();

/* Event albums: card opens a popup grid, a thumb opens big, click again to close */
(function () {
  document.querySelectorAll('.alb-card').forEach(function (c) {
    c.addEventListener('click', function () {
      var d = document.getElementById(c.dataset.alb); if (!d) return;
      if (d.showModal) d.showModal(); else d.setAttribute('open', '');
      document.documentElement.classList.add('alb-open');
      if (window.__lenis) __lenis.stop();
    });
  });
  document.querySelectorAll('.alb-dlg').forEach(function (d) {
    var view = d.querySelector('.alb-view'), vim = view.querySelector('img');
    function close() { view.hidden = true; if (d.close) d.close(); else d.removeAttribute('open'); }
    d.addEventListener('close', function () { view.hidden = true; document.documentElement.classList.remove('alb-open'); if (window.__lenis) __lenis.start(); });
    d.querySelector('.alb-x').addEventListener('click', close);
    d.addEventListener('click', function (e) {
      var th = e.target.closest('.alb-th');
      if (th) { vim.src = th.dataset.full; view.hidden = false; return; }
      if (e.target.closest('.alb-view')) { view.hidden = true; return; }
      if (e.target === d) close();
    });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !view.hidden) { e.preventDefault(); view.hidden = true; } });
  });
})();
