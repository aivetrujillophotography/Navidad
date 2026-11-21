/* "Lo que reciben": accordion rows that also swap the photo */
(() => {
  document.querySelectorAll('.recibes').forEach((box) => {
    const imgs = [...box.querySelectorAll('.rec-frame img')];
    const rows = [...box.querySelectorAll('.rec-row')];
    const set = (k) => {
      rows.forEach((r, i) => { const on = i === k; r.classList.toggle('active', on); r.setAttribute('aria-expanded', on ? 'true' : 'false'); });
      if (imgs.length > 1) imgs.forEach((im, i) => im.classList.toggle('in', i === k));
    };
    rows.forEach((r, i) => r.addEventListener('click', () => set(i)));
  });
})();
