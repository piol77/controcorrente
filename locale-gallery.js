(() => {
  const viewer = document.querySelector('.locale-viewer');
  const gallery = document.querySelector('.locale-gallery');
  if (!viewer || !gallery) return;
  const items = [...gallery.querySelectorAll('.gallery-thumb')];
  const photo = viewer.querySelector('.locale-viewer-photo');
  const caption = viewer.querySelector('.locale-viewer-caption');
  const count = viewer.querySelector('.locale-viewer-count');
  let current = 0;
  let trigger = null;
  let touchX = null;
  const show = index => {
    current = (index + items.length) % items.length;
    const item = items[current];
    photo.src = item.dataset.full;
    photo.alt = item.querySelector('img').alt;
    caption.textContent = item.dataset.caption;
    count.textContent = `${current + 1} / ${items.length}`;
  };
  items.forEach((item, index) => item.addEventListener('click', () => {
    trigger = item;
    show(index);
    viewer.showModal();
  }));
  viewer.querySelector('.locale-viewer-close').addEventListener('click', () => viewer.close());
  viewer.querySelector('.locale-viewer-prev').addEventListener('click', () => show(current - 1));
  viewer.querySelector('.locale-viewer-next').addEventListener('click', () => show(current + 1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
  });
  viewer.addEventListener('click', event => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('touchstart', event => {
    touchX = event.changedTouches[0].screenX;
  }, { passive: true });
  viewer.addEventListener('touchend', event => {
    if (touchX === null) return;
    const delta = event.changedTouches[0].screenX - touchX;
    if (Math.abs(delta) > 45) show(current + (delta < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });
  viewer.addEventListener('close', () => {
    photo.removeAttribute('src');
    trigger?.focus();
  });
})();
