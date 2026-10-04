(() => {
  const viewer = document.querySelector('.locale-viewer');
  const galleries = [...document.querySelectorAll('.locale-gallery')];
  if (!viewer || !galleries.length) return;

  const allItems = galleries.flatMap(gallery => [...gallery.querySelectorAll('.gallery-thumb')]);
  const photo = viewer.querySelector('.locale-viewer-photo');
  const caption = viewer.querySelector('.locale-viewer-caption');
  const count = viewer.querySelector('.locale-viewer-count');
  let activeItems = allItems;
  let current = 0;
  let trigger = null;
  let touchX = null;

  const show = index => {
    if (!activeItems.length) return;
    current = (index + activeItems.length) % activeItems.length;
    const item = activeItems[current];
    photo.src = item.dataset.full;
    photo.alt = item.querySelector('img').alt;
    caption.textContent = item.dataset.caption;
    count.textContent = `${current + 1} / ${activeItems.length}`;
  };

  allItems.forEach(item => item.addEventListener('click', () => {
    trigger = item;
    const kind = item.dataset.kind;
    activeItems = allItems.filter(candidate => candidate.dataset.kind === kind);
    current = activeItems.indexOf(item);
    show(current);
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
