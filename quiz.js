/* Quiz-style booking form */
(() => {
  const form = document.querySelector('.qz');
  if (!form) return;
  const en = (document.documentElement.lang || 'es').startsWith('en');
  const steps = [...form.querySelectorAll('.qz-step')];
  const byName = n => steps.find(s => s.dataset.step === n);
  const bar = form.querySelector('.qz-bar i');
  const countEl = form.querySelector('[data-qcount]');
  const totalEl = form.querySelector('[data-qtotal]');
  const back = form.querySelector('[data-back]');
  const err = form.querySelector('[data-err]');
  const QUESTIONS = steps.map(x => x.dataset.step).filter(n => !['intro', 'resumen', 'listo'].includes(n));
  const XMAS = form.dataset.kind === 'xmas';
  let history = ['intro'];
  let xmas = false;

  const sesKey = () => { const p = form.querySelector('input[name="sesion"]:checked'); return p ? p.closest('.qz-opt').dataset.k : ''; };
  const fits = q => {
    if (xmas && q === 'donde') return false;
    if ((q === 'cuidado' || q === 'carino') && (() => { const w = form.querySelector('input[name="quienes"]:checked'); return w && /^(Solo yo|Just me)$/.test(w.value); })()) return false;
    const st = byName(q), k = sesKey();
    if (!st || !k) return true;
    if (st.dataset.only && !st.dataset.only.split(',').includes(k)) return false;
    if (st.dataset.not && st.dataset.not.split(',').includes(k)) return false;
    return true;
  };
  const flow = () => QUESTIONS.filter(fits);
  const val = n => { const el = form.elements[n]; return el ? (el.value || '').trim() : ''; };
  const nice = v => (v === v.toUpperCase() || v === v.toLowerCase()) ? v.toLowerCase().replace(/(^|\s)(\S)/g, (m, sp, c) => sp + c.toUpperCase()) : v.replace(/^./, c => c.toUpperCase());
  const picked = n => form.querySelector(`input[name="${n}"]:checked`);

  function setNames() {
    const raw = val('nombre'); const n = raw ? nice(raw) : (en ? 'friend' : 'amig@');
    form.querySelectorAll('[data-name]').forEach(b => { b.textContent = n; });
  }

  function progress(name) {
    const f = flow();
    const i = f.indexOf(name);
    totalEl.textContent = f.length;
    const done = name === 'resumen' || name === 'listo';
    countEl.textContent = done ? f.length : Math.max(1, i + 1);
    const pct = name === 'intro' ? 0 : done ? 100 : ((i + 1) / (f.length + 1)) * 100;
    bar.style.width = pct + '%';
    form.classList.toggle('is-started', name !== 'intro');
    form.classList.toggle('is-done', name === 'listo');
    back.hidden = name === 'intro' || name === 'listo';
  }

  function show(name, dir = 1) {
    const cur = steps.find(s => s.classList.contains('is-on'));
    const nxt = byName(name);
    if (!nxt || cur === nxt) return;
    setNames();
    if (name === 'resumen') buildSummary();
    if (name === 'listo') buildTips();
    cur.classList.remove('is-on');
    nxt.classList.add('is-on');
    const g = window.gsap;
    if (g) {
      g.fromTo(nxt, { autoAlpha: 0, x: 40 * dir }, { autoAlpha: 1, x: 0, duration: .5, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
      g.fromTo(nxt.querySelectorAll('.qz-opt, .qz-field, .qz-toggle, .qz-date, .qz-msg, .qz-send'), { y: 14, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: .45, stagger: .04, delay: .08, ease: 'power2.out', clearProps: 'all' });
    }
    const side = form.querySelectorAll('.qz-side img');
    if (side.length) { const si = Math.max(0, steps.indexOf(nxt) - 1) % side.length; side.forEach((im, j) => im.classList.toggle('is-on', j === si)); }
    const qn = nxt.querySelector('[data-qn]');
    if (qn) qn.textContent = (en ? 'Question ' : 'Pregunta ') + (flow().indexOf(name) + 1);
    progress(name);
    const r = form.getBoundingClientRect();
    if (r.top < 0 || r.top > innerHeight * .5) {
      const y = scrollY + r.top - 90;
      window.__lenis ? window.__lenis.scrollTo(y) : scrollTo({ top: y, behavior: 'smooth' });
    }
    const focusEl = nxt.querySelector('input[type=text], input[type=tel]');
    if (focusEl && matchMedia('(min-width: 720px)').matches) setTimeout(() => focusEl.focus({ preventScroll: true }), 350);
  }

  const preset = (() => { try { return new URLSearchParams(location.search).get('s'); } catch (e) { return null; } })();
  if (preset && !XMAS) { const pi = form.querySelector(`.qz-opt[data-k="${preset}"] input[name="sesion"]`); if (pi) pi.checked = true; }
  function nextOf(name) {
    if (name === 'intro') return 'nombre';
    if (name === 'nombre' && preset && picked('sesion')) { const f = flow(); return f[f.indexOf('sesion') + 1] || 'resumen'; }
    if (name === 'contacto') return byName('web') ? 'web' : 'resumen';
    const f = flow();
    return f[f.indexOf(name) + 1] || 'resumen';
  }

  function go(from) {
    const to = nextOf(from);
    history.push(to);
    show(to, 1);
  }

  function shake(el) {
    el.classList.remove('qz-shake'); void el.offsetWidth; el.classList.add('qz-shake');
  }

  function validate(name) {
    const step = byName(name);
    if (name === 'nombre') {
      if (!val('nombre')) { shake(step.querySelector('.qz-field')); form.elements.nombre.focus(); return false; }
    }
    if (name === 'contacto') {
      const ok = val('whatsapp').replace(/\D/g, '').length >= 8 || /\S+@\S+\.\S+/.test(val('email'));
      err.hidden = ok;
      if (!ok) { shake(step.querySelector('.qz-grid')); return false; }
    }
    if (name === 'cuando' && !picked('cuando') && !val('fecha')) return false;
    if (name === 'quienes' && XMAS) {
      const tot = ['adultos', 'adolescentes', 'ninos', 'bebes'].reduce((a, n) => a + (parseInt(val(n), 10) || 0), 0);
      if (!tot) { shake(step.querySelector('.qz-stps')); return false; }
    }
    return true;
  }

  form.addEventListener('click', e => {
    const nx = e.target.closest('[data-next]');
    if (nx) {
      const name = nx.closest('.qz-step').dataset.step;
      if (nx.hasAttribute('data-date-next')) form.querySelectorAll('input[name="cuando"]').forEach(r => { r.checked = false; });
      if (validate(name)) go(name);
      return;
    }
    if (e.target.closest('[data-back]')) {
      if (history.length > 1) { history.pop(); show(history[history.length - 1], -1); }
      return;
    }
    if (e.target.closest('[data-restart]')) {
      history = ['intro', 'nombre'];
      show('nombre', -1);
    }
  });

  // Pills auto-advance
  form.addEventListener('change', e => {
    const r = e.target;
    if (r.type === 'radio' && r.closest('.qz-det')) { const c = r.closest('.qz-chip'); if (c) { c.classList.add('is-pop'); setTimeout(() => c.classList.remove('is-pop'), 300); } return; }
    if (r.type === 'radio') {
      const step = r.closest('.qz-step').dataset.step;
      if (step === 'sesion') {
        xmas = !!r.closest('[data-xmas]');
        if (xmas) { const c = form.querySelector('input[name="donde"][value="Cuauhtémoc"]'); if (c) c.checked = true; }
      }
      if (step === 'cuando') form.elements.fecha.value = '';
      const fs = r.closest('.qz-step');
      const when = fs.querySelector(`[data-when="${r.name}"]`);
      if (when) {
        const open = r.hasAttribute('data-stay');
        when.classList.toggle('is-on', open);
        if (open) {
          if (window.gsap) gsap.fromTo(when, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .4, clearProps: 'all' });
          const inp = when.querySelector('input[type=text]');
          if (inp) setTimeout(() => inp.focus({ preventScroll: true }), 200);
          return;
        }
        when.querySelectorAll('input[type=radio]').forEach(x => { x.checked = false; });
        when.querySelectorAll('input[type=text]').forEach(x => { x.value = ''; });
      }
      if (r.hasAttribute('data-stay')) { r.closest('.qz-opt').classList.add('is-pop'); setTimeout(() => r.closest('.qz-opt').classList.remove('is-pop'), 320); return; }
      const need = (fs.dataset.need || '').split(',').filter(Boolean);
      if (need.length && !need.every(n => picked(n))) return;
      const lbl = r.closest('.qz-opt');
      lbl.classList.add('is-pop');
      setTimeout(() => { lbl.classList.remove('is-pop'); go(step); }, 320);
    }
    if (r.name === 'fecha') form.querySelector('[data-date-next]').hidden = !r.value;
    if (r.type === 'checkbox') {
      const grp = form.querySelectorAll(`input[type=checkbox][name="${r.name}"]`);
      if (r.checked && r.hasAttribute('data-none')) grp.forEach(x => { if (x !== r) x.checked = false; });
      else if (r.checked) grp.forEach(x => { if (x.hasAttribute('data-none')) x.checked = false; });
    }
  });

  form.addEventListener('click', e => {
    const b = e.target.closest('[data-inc],[data-dec]');
    if (!b) return;
    const inp = b.parentElement.querySelector('input');
    const v = Math.max(0, Math.min(20, (parseInt(inp.value, 10) || 0) + (b.hasAttribute('data-inc') ? 1 : -1)));
    inp.value = v;
    if (window.gsap) gsap.fromTo(inp, { scale: 1.25 }, { scale: 1, duration: .3, ease: 'back.out(3)' });
  });

  form.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    const step = e.target.closest('.qz-step');
    if (!step) return;
    const nx = step.querySelector('[data-next]:not([hidden])');
    if (nx) nx.click();
  });

  function fmtDate(v) {
    if (!v) return '';
    const d = new Date(v + 'T12:00:00');
    return d.toLocaleDateString(en ? 'en-US' : 'es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function messageXmas() {
    const p = picked('paquete');
    const name = nice(val('nombre'));
    const L = [];
    const num = n => parseInt(val(n), 10) || 0;
    const parts = en
      ? [[num('adultos'), 'adult', 'adults'], [num('adolescentes'), 'teen', 'teens'], [num('ninos'), 'kid', 'kids'], [num('bebes'), 'baby', 'babies']]
      : [[num('adultos'), 'adulto', 'adultos'], [num('adolescentes'), 'adolescente', 'adolescentes'], [num('ninos'), 'niño', 'niños'], [num('bebes'), 'bebé', 'bebés']];
    const who = parts.filter(x => x[0]).map(x => `${x[0]} ${x[0] === 1 ? x[1] : x[2]}`).join(', ');
    const dates = ['fecha1', 'fecha2', 'fecha3'].map(n => fmtDate(val(n))).filter(Boolean);
    const h = picked('horario');
    if (en) {
      L.push(`Hi Aivé! I'm ${name} 🎄`);
      L.push(`I'd love a Christmas session in Cuauhtémoc${p ? ', ' + p.dataset.say : ''}.`);
      if (who) L.push(`We are: ${who}.`);
    } else {
      L.push(`¡Hola Aivé! Soy ${name} 🎄`);
      L.push(`Quiero una sesión navideña en Cuauhtémoc${p ? ', ' + p.dataset.say : ''}.`);
      if (who) L.push(`Somos: ${who}.`);
    }
    extras().forEach(l => L.push(l));
    if (dates.length || h) L.push((en ? 'Dates that work: ' : 'Fechas que me laten: ') + (dates.join(', ') || (en ? 'flexible' : 'flexibles')) + (h ? (en ? ' · ' + h.dataset.say : ' · ' + h.dataset.say) : '') + '.');
    if (val('mensaje')) L.push(val('mensaje'));
    const c = [val('whatsapp') && `WhatsApp: ${val('whatsapp')}`, val('email') && `${en ? 'Email' : 'Correo'}: ${val('email')}`].filter(Boolean).join(' · ');
    if (c) L.push(c);
    const pf = picked('prefiere'); if (pf) L.push(pf.dataset.say + '.');
    return L;
  }

  function message() {
    if (XMAS) return messageXmas();
    const say = n => { const p = picked(n); return p ? p.dataset.say : ''; };
    const name = nice(val('nombre'));
    const when = val('fecha') ? (en ? 'on ' : 'el ') + fmtDate(val('fecha')) : say('cuando');
    const where = say('donde');
    const lines = [];
    if (en) {
      lines.push(`Hi Aivé! I'm ${name} ✦`);
      lines.push(`I'd love ${say('sesion') || 'a session'}${where ? ' ' + where : ''}${when ? ', ' + when : ''}.`);
      if (say('quienes')) lines.push(`${say('quienes')}.`);
      extras().forEach(l => lines.push(l));
      if (val('mensaje')) lines.push(val('mensaje'));
      const c = [val('whatsapp') && `WhatsApp: ${val('whatsapp')}`, val('email') && `Email: ${val('email')}`].filter(Boolean).join(' · ');
      if (c) lines.push(c);
      { const pf = picked('prefiere'); if (pf) lines.push(pf.dataset.say + '.'); }
    } else {
      lines.push(`¡Hola Aivé! Soy ${name} ✦`);
      lines.push(`Quiero ${say('sesion') || 'una sesión'}${where ? ' ' + where : ''}${when ? ', ' + when : ''}.`);
      if (say('quienes')) lines.push(`${say('quienes')}.`);
      extras().forEach(l => lines.push(l));
      if (val('mensaje')) lines.push(val('mensaje'));
      const c = [val('whatsapp') && `WhatsApp: ${val('whatsapp')}`, val('email') && `Correo: ${val('email')}`].filter(Boolean).join(' · ');
      if (c) lines.push(c);
      { const pf = picked('prefiere'); if (pf) lines.push(pf.dataset.say + '.'); }
    }
    return lines;
  }

  function extras() {
    const f = flow();
    const sayIn = (step, n) => { const p = picked(n); return p && f.includes(step) ? p.dataset.say : ''; };
    const out = [];
    const list = n => [...form.querySelectorAll(`input[name="${n}"]:checked`)].filter(x => !x.hasAttribute('data-none')).map(x => x.value);
    if (f.includes('cuidado')) {
      const ed = list('edad_opt'), cu = list('cuidado_opt');
      form.elements.edades.value = ed.join(', ');
      form.elements.cuidados.value = cu.join(', ');
      if (ed.length) out.push((en ? 'Kids coming: ' : 'Peques que vienen: ') + ed.join(', ') + '.');
      if (cu.length) out.push((en ? 'Good to know: ' : 'Para tener en cuenta: ') + cu.join(', ') + '.');
    }
    const cp = [sayIn('pareja', 'pareja'), sayIn('pareja', 'energia')].filter(Boolean);
    if (cp.length) out.push(cp.join('. ') + '.');
    ['personalidad', 'carino'].forEach(n => { const v = sayIn(n, n); if (v) out.push(v + '.'); });
    if (f.includes('vibe')) { const vs = [...form.querySelectorAll('input[name="vibe_opt"]:checked')].map(x => x.value); if (vs.length) out.push((document.documentElement.lang === 'en' ? 'Session style: ' : 'Estilo de sesión: ') + vs.join(', ') + '.'); }
    const m = sayIn('mascotas', 'mascotas');
    if (m) { const sz = sayIn('mascotas', 'mascota_tamano'); const ot = form.elements.mascota_otra ? val('mascota_otra') : ''; out.push(m + (sz ? ', ' + sz : '') + (ot ? ': ' + ot : '') + (m.match(/^(No|Sin)/) ? '.' : ' 🐾.')); }
    steps.filter(s => s.classList.contains('qz-det') && f.includes(s.dataset.step)).forEach(s => {
      s.querySelectorAll('.qz-dg').forEach(g => {
        const v = [...g.querySelectorAll('input:checked')].map(x => x.value)
          .concat([...g.querySelectorAll('input[type=text], input[type=date], textarea')].map(x => x.type === 'date' ? fmtDate(x.value.trim()) : x.value.trim()).filter(Boolean));
        if (v.length) out.push(g.dataset.q + ': ' + v.join(', ') + '.');
      });
    });
    const rl = sayIn('religion', 'religion');
    if (rl) { const nota = val('religion_nota'); out.push(rl + (nota ? ': ' + nota : '') + '.'); }
    return out;
  }

  function buildTips() {
    const box = form.querySelector('[data-tips]');
    if (!box) return;
    const num = n => parseInt(val(n), 10) || 0;
    const kids = num('ninos') + num('bebes');
    const babies = num('bebes');
    const total = num('adultos') + num('adolescentes') + num('ninos');
    const dog = (picked('mascotas') || {}).value;
    const E = en;
    const groups = [];
    if (kids) {
      const k = [
        E ? 'Their favorite book or toy, in soft colors, so they feel at ease.' : 'Su libro o juguete favorito, de colores suaves, para que se sientan en confianza.',
        E ? 'Comfy clothes in soft tones: cream, camel, burgundy or deep green.' : 'Ropa cómoda en tonos suaves: crema, camel, rojo vino o verde oscuro.',
        E ? 'Their favorite snack and a spare outfit, just in case.' : 'Su snack favorito y una mudita extra, por si acaso.',
      ];
      if (babies) k.push(E ? 'For babies: their blanket, pacifier or whatever soothes them.' : 'Para los bebés: su cobijita, chupón o lo que los calme.');
      groups.push([E ? 'For the little ones' : 'Para los peques', '🧸', k]);
    }
    groups.push([E ? 'For the grown ups' : 'Para los adultos', '🧣', [
      E ? 'Cozy textures and soft colors: knits, wool, suede.' : 'Texturas calientitas y colores suaves: tejidos, lana, gamuza.',
      E ? 'No loud colors, unless it is themed (Grinch is welcome!).' : 'Nada de colores chillones, a menos que sea temático (¡el Grinch es bienvenido!).',
      E ? 'No brand names or non Christmas prints, so the focus stays on you.' : 'Sin marcas ni dibujos que no sean navideños, para que el foco sean ustedes.',
      E ? 'Coordinate a 2 or 3 color palette without matching exactly.' : 'Coordinen una paleta de 2 o 3 colores, sin ir igualitos.',
    ]]);
    const extra = [];
    if (total >= 5) extra.push(E ? 'Arrive 10 minutes early so we can settle in calmly.' : 'Lleguen 10 minutitos antes para acomodarnos sin prisa.');
    if (dog && dog !== 'No') extra.push(E ? 'For your pup: a Christmas sweater or bow, and treats.' : 'Para tu perrito: su suéter navideño o moñito, y premios.');
    if (extra.length) groups.push([E ? 'Good to know' : 'Bueno que sepan', '✨', extra]);
    box.innerHTML = '<p class="qz-tips-h">' + (E ? 'Little tips for your session' : 'Tips para su sesión') + '</p>' + groups.map(g =>
      '<div class="qz-tip"><span class="qz-tip-ic">' + g[1] + '</span><div><b>' + g[0] + '</b><ul>' + g[2].map(x => '<li>' + x + '</li>').join('') + '</ul></div></div>').join('');
  }

  function buildSummary() {
    const lines = message();
    const box = form.querySelector('[data-summary]');
    box.innerHTML = '';
    lines.forEach(l => { const s = document.createElement('span'); s.textContent = l; box.appendChild(s); });
    const txt = lines.join('\n');
    form.elements.resumen.value = txt;
    if (form.elements.subject) {
      const who = nice(val('nombre')) || 'Alguien';
      const ses = XMAS ? ('Navidad · ' + ((picked('paquete') || {}).value || 'paquete por definir')) : ((picked('sesion') || {}).value || 'sesión');
      form.elements.subject.value = '✦ ' + who + ' quiere una sesión: ' + ses;
    }
    const href = `https://wa.me/${form.dataset.waNum}?text=${encodeURIComponent(txt)}`;
    form.querySelectorAll('[data-send-wa]').forEach(a => { a.href = href; });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    buildSummary();
    const btn = form.querySelector('[data-send-form]');
    btn.disabled = true; btn.classList.add('is-busy');
    let ok = false;
    try {
      if (form.dataset.endpoint) {
        const fd = new FormData(form);
        if (form.dataset.cc) fd.append('_cc', form.dataset.cc);
        fd.append('_subject', form.dataset.subject || 'Nueva solicitud de sesión');
        fd.append('_template', 'table'); fd.append('_captcha', 'false');
        const r = await fetch(form.dataset.endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
        ok = r.ok;
      } else {
        const body = new URLSearchParams(new FormData(form)).toString();
        const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        ok = r.ok;
      }
    } catch (_) { ok = false; }
    btn.disabled = false; btn.classList.remove('is-busy');
    const fail = form.querySelector('[data-fail]');
    fail.hidden = ok;
    if (!ok) { shake(fail); return; }
    history.push('listo');
    show('listo', 1);
    confetti();
  });

  function confetti() {
    const g = window.gsap, host = form.querySelector('.qz-done');
    if (!g || !host) return;
    const cols = ['#F2A07B', '#E7B7A3', '#2EC4C6', '#F6D58E', '#FFFFFF'];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('i');
      p.className = 'qz-confetti';
      p.style.background = cols[i % cols.length];
      host.appendChild(p);
      g.fromTo(p, { x: 0, y: 0, rotation: 0, opacity: 1 },
        { x: (Math.random() - .5) * 520, y: -120 - Math.random() * 220, rotation: Math.random() * 540, duration: 1.1 + Math.random() * .6, ease: 'power2.out',
          onComplete: () => g.to(p, { y: '+=260', opacity: 0, duration: 1, ease: 'power1.in', onComplete: () => p.remove() }) });
    }
  }

  form.querySelectorAll('.qz-sum [data-send-wa]').forEach(a => a.addEventListener('click', () => {
    setTimeout(() => { if (!history.includes('listo')) { history.push('listo'); show('listo', 1); confetti(); } }, 500);
  }));

  // Booking links just scroll to the quiz; the intro screen explains it before starting.

  form.addEventListener('change', e => {
    if (e.target.name !== 'Le gustó la web') return;
    const yes = /^(Sí|Yes)$/.test(e.target.value);
    form.querySelectorAll('.qz-webmsg').forEach(m => { const on = m.dataset.web === (yes ? 'si' : 'no'); m.hidden = !on; if (on && window.gsap) gsap.fromTo(m, { opacity: 0, y: 14, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'back.out(2)' }); });
  });

  progress('intro');
})();
