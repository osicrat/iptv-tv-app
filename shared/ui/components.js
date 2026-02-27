export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') node.className = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  });
  (Array.isArray(children) ? children : [children]).forEach((child) => {
    if (child == null) return;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  });
  return node;
}

export function renderTabs(container, tabs, activeTab) {
  container.innerHTML = '';
  tabs.forEach((tab) => {
    container.append(
      el('button', { className: `tab-btn ${tab === activeTab ? 'is-active' : ''}`, 'data-tab': tab }, tab),
    );
  });
}

export function renderList(container, items, focusIndex = 0, renderer = (item) => item.name || item.title) {
  container.innerHTML = '';
  const windowSize = 120;
  const start = Math.max(0, focusIndex - 40);
  const visible = items.slice(start, start + windowSize);
  visible.forEach((item, idx) => {
    const realIndex = start + idx;
    const node = el('div', { className: `list-item ${realIndex === focusIndex ? 'is-focused' : ''}`, 'data-index': String(realIndex) }, renderer(item));
    container.append(node);
  });
}

export function showToast(message) {
  const toast = el('div', { className: 'toast' }, message);
  document.body.append(toast);
  setTimeout(() => toast.remove(), 2500);
}
