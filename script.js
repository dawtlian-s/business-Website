/* =========================================================
   Luxora Cart — persistent, toast-driven cart system
   Drop-in replacement for the single addToCart(name, price)
   alert function. Degrades gracefully if optional DOM hooks
   (#cartCount, #cartItems, #cartTotal, #cartDrawer) aren't
   present on the page.
   ========================================================= */

const Cart = (() => {
  const STORAGE_KEY = 'luxora_cart';
  let items = load();

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    render();
  }

  function add(productName, price, qty = 1) {
    const existing = items.find(i => i.name === productName);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ name: productName, price: Number(price), qty });
    }
    save();
    toast(`${productName} added to cart`);
  }

  function remove(productName) {
    items = items.filter(i => i.name !== productName);
    save();
  }

  function setQty(productName, qty) {
    const item = items.find(i => i.name === productName);
    if (!item) return;
    if (qty <= 0) return remove(productName);
    item.qty = qty;
    save();
  }

  function clear() {
    items = [];
    save();
  }

  function total() {
    return items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function count() {
    return items.reduce((sum, i) => sum + i.qty, 0);
  }

  function render() {
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = count();

    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = '$' + total().toFixed(2);

    const listEl = document.getElementById('cartItems');
    if (!listEl) return;

    if (items.length === 0) {
      listEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      return;
    }

    listEl.innerHTML = items.map(i => `
      <div class="cart-item" data-name="${escapeHtml(i.name)}">
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(i.name)}</div>
          <div class="cart-item-price">$${i.price.toFixed(2)} × ${i.qty}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-action="dec" aria-label="Decrease quantity">−</button>
          <span class="qty-value">${i.qty}</span>
          <button class="qty-btn" data-action="inc" aria-label="Increase quantity">+</button>
          <button class="remove-btn" data-action="remove" aria-label="Remove item">✕</button>
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Event delegation for qty/remove controls inside #cartItems
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const row = btn.closest('.cart-item');
    if (!row) return;
    const name = row.dataset.name;
    const item = items.find(i => i.name === name);
    if (!item) return;

    if (btn.dataset.action === 'inc') setQty(name, item.qty + 1);
    if (btn.dataset.action === 'dec') setQty(name, item.qty - 1);
    if (btn.dataset.action === 'remove') remove(name);
  });

  render(); // initial paint on load

  return { add, remove, setQty, clear, total, count, get items() { return [...items]; } };
})();

/* ---------- Toast notifications (replaces alert()) ---------- */

function toast(message, duration = 2400) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    Object.assign(container.style, {
      position: 'fixed', bottom: '24px', right: '24px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      zIndex: 9999, pointerEvents: 'none'
    });
    document.body.appendChild(container);
  }

  const el = document.createElement('div');
  el.textContent = message;
  Object.assign(el.style, {
    background: '#111', color: '#fff', padding: '12px 18px',
    borderRadius: '4px', fontSize: '14px', fontFamily: 'Arial, sans-serif',
    boxShadow: '0 10px 24px rgba(0,0,0,.25)', opacity: '0',
    transform: 'translateY(10px)', transition: 'opacity .25s ease, transform .25s ease'
  });
  container.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    setTimeout(() => el.remove(), 250);
  }, duration);
}

/* ---------- Public function, same call signature as before ---------- */

function addToCart(productName, price) {
  Cart.add(productName, price);
}
