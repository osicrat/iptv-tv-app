export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value != null) node.setAttribute(key, value);
  });
  (Array.isArray(children) ? children : [children]).forEach((child) => {
    if (child == null) return;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  });
  return node;
}

function getTabLabel(tab) {
  if (tab === 'Live') return 'Ao vivo';
  if (tab === 'Config') return 'Configurações';
  return tab;
}

export function renderTabs(container, tabs, activeTab) {
  container.innerHTML = '';
  tabs.forEach((tab) => {
    container.append(
      el('button', { className: `tab-btn ${tab === activeTab ? 'is-active' : ''}`, 'data-tab': tab, type: 'button' }, getTabLabel(tab)),
    );
  });
}

export function renderList(container, items, focusIndex = 0, renderer = (item) => item.name || item.title) {
  container.innerHTML = '';
  const visibleCount = 10;
  const topPadding = 2;
  const safeFocus = Math.max(0, Math.min(focusIndex, Math.max(0, items.length - 1)));
  const start = Math.max(0, safeFocus - topPadding);
  const visible = items.slice(start, start + visibleCount);

  visible.forEach((item, idx) => {
    const realIndex = start + idx;
    const content = renderer(item, realIndex);
    const node = el('div', {
      className: `list-item ${realIndex === safeFocus ? 'is-focused' : ''}`,
      'data-index': String(realIndex),
    });
    if (content?.nodeType) node.append(content);
    else node.textContent = String(content ?? '');
    container.append(node);
  });
}

function shouldHideDuplicateSubtitle(title, subtitle) {
  const t = String(title || '').trim();
  const s = String(subtitle || '').trim();

  if (!s) return true;

  const yearMatch = s.match(/^(19|20)\d{2}$/);
  if (yearMatch && t.includes(`(${s})`)) return true;

  if (t.toLowerCase() === s.toLowerCase()) return true;

  return false;
}

export function renderPosterGrid(container, items, focusIndex = 0, opts = {}) {
  container.innerHTML = '';
  const columns = Math.max(1, Number(opts.columns) || 4);
  const visibleRows = Math.max(2, Number(opts.visibleRows) || 2);
  const safeFocus = Math.max(0, Math.min(focusIndex, Math.max(0, items.length - 1)));
  const focusRow = Math.floor(safeFocus / columns);
  const startRow = Math.max(0, focusRow - 1);
  const renderRows = visibleRows;
  const start = startRow * columns;
  const end = Math.min(items.length, start + renderRows * columns);
  const visible = items.slice(start, end);

  container.style.setProperty('--poster-columns', String(columns));

  visible.forEach((item, idx) => {
    const realIndex = start + idx;
    const title = opts.getTitle ? opts.getTitle(item, realIndex) : (item?.name || item?.title || 'Item');
    const subtitle = opts.getSubtitle ? opts.getSubtitle(item, realIndex) : '';
    const image = opts.getImage ? opts.getImage(item, realIndex) : (item?.stream_icon || item?.cover || '');
    const focused = realIndex === safeFocus;

    const card = el('div', {
      className: `poster-card ${focused ? 'is-focused' : ''}`,
      'data-index': String(realIndex),
      tabindex: '-1',
    });

    const media = el('div', { className: 'poster-media' });
    if (image) {
      const img = el('img', {
        className: 'poster-image',
        src: image,
        alt: title,
        loading: 'lazy',
        referrerpolicy: 'no-referrer',
      });
      img.onerror = () => {
        img.remove();
        media.classList.add('is-fallback');
        media.append(el('div', { className: 'poster-fallback' }, title?.slice?.(0, 1) || '•'));
      };
      media.append(img);
    } else {
      media.classList.add('is-fallback');
      media.append(el('div', { className: 'poster-fallback' }, title?.slice?.(0, 1) || '•'));
    }

    const bodyChildren = [
      el('div', { className: 'poster-title' }, title),
    ];

    if (!shouldHideDuplicateSubtitle(title, subtitle)) {
      bodyChildren.push(el('div', { className: 'poster-subtitle' }, subtitle));
    }

    const body = el('div', { className: 'poster-body' }, bodyChildren);

    card.append(media, body);
    container.append(card);
  });
}

export function showToast(message) {
  const toast = el('div', { className: 'toast' }, message);
  document.body.append(toast);
  setTimeout(() => toast.remove(), 2500);
}
