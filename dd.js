(() => {
  const dds = [...document.querySelectorAll('.dd')];
  if (!dds.length) return;
  const closeAll = (except) => dds.forEach((d) => { if (d !== except) { d.classList.remove('is-open'); const b = d.querySelector('.dd-btn'); if (b) b.setAttribute('aria-expanded', 'false'); } });
  dds.forEach((d) => {
    const b = d.querySelector('.dd-btn');
    if (!b) return;
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !d.classList.contains('is-open');
      closeAll(d);
      d.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.dd')) closeAll(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
  addEventListener('scroll', () => closeAll(), { passive: true });
})();
