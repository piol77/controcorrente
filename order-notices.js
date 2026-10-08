(function () {
  'use strict';
  let request = 0;
  async function refreshDishNotices() {
    const container = document.querySelector('[data-dish-notices]');
    if (!container) return;
    const currentRequest = ++request;
    container.replaceChildren();
    container.hidden = true;
    try {
      const response = await fetch('menu-data.json', {cache: 'no-store'});
      if (!response.ok) return;
      const menu = await response.json();
      if (currentRequest !== request) return;
      const dishes = [
        ...Object.values(menu.dinner || {}).flat(),
        ...(menu.lunch || []), ...(menu.offers || []),
        ...(menu.fixed?.dishes || [])
      ];
      const notices = new Set();
      dishes.forEach(dish => {
        if (!dish || typeof dish.name !== 'string' || !dish.name.trim()) return;
        const details = [];
        if (Number.isInteger(dish.minPortions) && dish.minPortions > 1) {
          details.push('Minimo ' + dish.minPortions + ' porzioni.');
        }
        if (typeof dish.orderNotice === 'string' && dish.orderNotice.trim()) {
          details.push(dish.orderNotice.trim());
        }
        if (details.length) notices.add(dish.name.trim() + ': ' + details.join(' '));
      });
      notices.forEach(text => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        container.append(paragraph);
      });
      container.hidden = !notices.size;
    } catch (_) {
      // Never restore old dish notices when the current menu cannot be loaded.
    }
  }
  window.addEventListener('pageshow', refreshDishNotices);
})();
