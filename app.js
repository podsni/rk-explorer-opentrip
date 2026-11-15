(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const packages = {
    bromo: { name: 'Planet Bromo', price: 550000, card: 'bromo' },
    tumpak: { name: 'Tumpak Sewu', price: 375000, card: 'tumpak-sewu' },
    bukit: { name: 'Bukit Premium', price: 250000, card: 'bukit-premium' },
    ijen: { name: 'Ijen Crater', price: 399000, card: 'ijen' }
  };
  const cart = new Map();
  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  const money = n => formatter.format(n);
  const safeQty = (value, min = 1) => Math.min(20, Math.max(min, Number.parseInt(value, 10) || min));
  const variantText = (id, value) => id === 'tumpak' ? (value === 'private' ? 'Paket privat' : 'Open trip') : id === 'bukit' ? `Dari ${value === 'surabaya' ? 'Surabaya' : 'Malang'}` : 'Paket reguler';
  const config = id => {
    const card = document.getElementById(packages[id].card);
    const input = $('.participant-count', card);
    const select = $('.price-choice', card);
    const option = select?.selectedOptions[0];
    const variant = select?.value || 'regular';
    return { id, card, input, select, variant, price: option ? Number(option.dataset.price) : packages[id].price, min: Number(option?.dataset.min || 1), key: `${id}:${variant}` };
  };
  const toast = (text, showReceipt = false) => {
    const el = $('#toast');
    el.replaceChildren(document.createTextNode(text));
    if (showReceipt) {
      const link = document.createElement('a');
      link.href = '#struk'; link.textContent = 'Lihat struk';
      link.addEventListener('click', () => el.classList.remove('show'));
      el.append(link);
    }
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 4500);
  };
  const people = () => [...cart.values()].reduce((n, item) => n + item.qty, 0);
  const total = () => [...cart.values()].reduce((n, item) => n + item.qty * item.price, 0);
  const refreshCard = (id, normalize = true) => {
    const c = config(id);
    const qty = safeQty(c.input.value, c.min);
    if (normalize) c.input.value = String(qty);
    c.input.min = String(c.min);
    $('[data-step="decrease"]', c.card).disabled = qty <= c.min;
    $('[data-step="increase"]', c.card).disabled = qty >= 20;
    $('.minimum-note', c.card).textContent = `Min. ${c.min} · maks. 20 orang`;
    $('[data-preview-label]', c.card).textContent = `Estimasi ${qty} orang`;
    $('[data-preview-total]', c.card).textContent = money(qty * c.price);
    const unit = $('.price small', c.card);
    const priceEl = $('[data-card-price]', c.card);
    if (c.select) {
      priceEl.replaceChildren(document.createTextNode(`${money(c.price)} `));
      const suffix = document.createElement('small');
      suffix.textContent = id === 'bukit' ? `/ ${c.variant === 'surabaya' ? 'Surabaya' : 'Malang'}` : '/ orang';
      priceEl.append(suffix);
      const alt = $('[data-price-alt]', c.card);
      if (id === 'tumpak') alt.textContent = c.variant === 'private' ? 'Paket privat · minimum 5 peserta' : 'Privat Rp425.000 / orang · min. 5 peserta';
      if (id === 'bukit') alt.textContent = c.variant === 'surabaya' ? 'Dari Malang Rp250.000 / orang' : 'Dari Surabaya Rp280.000 / orang';
    }
    const button = $('[data-add]', c.card);
    button.innerHTML = `${cart.has(c.key) ? 'Perbarui struk' : 'Tambah ke struk'} <span aria-hidden="true">${cart.has(c.key) ? '↻' : '＋'}</span>`;
    button.setAttribute('aria-label', `${cart.has(c.key) ? 'Perbarui' : 'Tambahkan'} ${packages[id].name}, ${variantText(id, c.variant)}, ${qty} peserta ke struk estimasi`);
  };
  const refreshCards = () => Object.keys(packages).forEach(id => refreshCard(id));
  const renderCart = (focusTarget) => {
    const list = $('#receipt-items');
    list.replaceChildren();
    const entries = [...cart.entries()];
    const count = people(), amount = total();
    $('#receipt-empty').hidden = !!entries.length;
    $('#receipt-count').textContent = `${count} peserta`;
    $('#summary-people').textContent = `${count} peserta`;
    $('#summary-total').textContent = money(amount);
    $('#mobile-count').textContent = entries.length ? `${entries.length} pilihan · ${count} peserta` : 'Jawa Timur, langkah berikutnya';
    $('#mobile-total').textContent = entries.length ? money(amount) : 'Temukan tripmu';
    $('.mobile-bar').classList.toggle('has-items', !!entries.length);
    const mobileAction = $('#mobile-receipt-link');
    mobileAction.href = entries.length ? '#struk' : '#trip';
    mobileAction.innerHTML = entries.length ? 'Lihat struk <span aria-hidden="true">↗</span>' : 'Jelajahi trip <span aria-hidden="true">↗</span>';
    mobileAction.setAttribute('aria-label', entries.length ? `Lihat struk, ${count} peserta, total estimasi ${money(amount)}` : 'Jelajahi semua paket trip');
    $('#clear-cart').hidden = !entries.length;
    const ask = $('#ask-schedule');
    if (entries.length) {
      ask.textContent = 'Tanyakan jadwal via WhatsApp ↗';
      const lines = entries.map(([, i]) => `• ${i.name} (${i.variantText}), ${i.qty} peserta × ${money(i.price)} = ${money(i.qty * i.price)}`).join('\n');
      const message = `Halo RK Explorer, saya ingin menanyakan jadwal aktual dan ketersediaan paket berikut.\n\n${lines}\n\nTotal estimasi dari website: ${money(amount)}. Mohon konfirmasi tanggal, slot, titik kumpul, harga final, serta syarat paket. Ini baru pertanyaan; belum merupakan booking dan belum ada pembayaran.`;
      ask.href = `https://wa.me/6282330748620?text=${encodeURIComponent(message)}`;
      ask.target = '_blank'; ask.rel = 'noopener';
    } else {
      ask.href = '#trip'; ask.textContent = 'Jelajahi dan pilih paket ↗';
      ask.removeAttribute('target'); ask.removeAttribute('rel');
    }
    ask.removeAttribute('aria-disabled');
    for (const [key, item] of entries) {
      const line = document.createElement('div');
      line.className = 'receipt-item';
      line.dataset.key = key;
      line.innerHTML = '<div><div class="receipt-item-name"></div><div class="receipt-item-note"></div></div><strong class="receipt-subtotal"></strong><div class="receipt-controls"><button class="qty-btn" type="button" data-action="decrease">−</button><span class="qty-display"></span><button class="qty-btn" type="button" data-action="increase">+</button><button class="remove-line" type="button" data-action="remove">Hapus</button></div>';
      $('.receipt-item-name', line).textContent = item.name;
      $('.receipt-item-note', line).textContent = `${item.variantText} · ${money(item.price)} / orang · min. ${item.min}`;
      $('.receipt-subtotal', line).textContent = money(item.price * item.qty);
      $('.qty-display', line).textContent = `${item.qty} orang`;
      const lower = $('[data-action="decrease"]', line), upper = $('[data-action="increase"]', line), remove = $('[data-action="remove"]', line);
      lower.disabled = item.qty <= item.min; upper.disabled = item.qty >= 20;
      const name = `${item.name}, ${item.variantText}`;
      lower.setAttribute('aria-label', `Kurangi peserta ${name}`);
      upper.setAttribute('aria-label', `Tambah peserta ${name}`);
      remove.setAttribute('aria-label', `Hapus ${name} dari struk`);
      const change = (delta, action) => {
        item.qty = safeQty(item.qty + delta, item.min);
        const c = config(item.id);
        if (c.key === key) c.input.value = String(item.qty);
        renderCart({ key, action });
        toast(`${item.name}: ${item.qty} peserta. Total estimasi ${money(total())}.`);
      };
      lower.addEventListener('click', () => change(-1, 'decrease'));
      upper.addEventListener('click', () => change(1, 'increase'));
      remove.addEventListener('click', () => {
        const nextKey = entries.find(([k]) => k !== key)?.[0];
        cart.delete(key); renderCart(nextKey ? { key: nextKey, action: 'remove' } : null);
        if (!nextKey) $('#ask-schedule').focus({ preventScroll: true });
        toast(`${item.name} dihapus dari struk.`);
      });
      list.append(line);
    }
    refreshCards();
    if (focusTarget) {
      const row = $$('.receipt-item').find(el => el.dataset.key === focusTarget.key);
      if (row) {
        let target = $(`[data-action="${focusTarget.action}"]`, row);
        if (target.disabled) target = $('[data-action="remove"]', row);
        target.focus({ preventScroll: true });
      }
    }
  };
  Object.keys(packages).forEach(id => {
    const c = config(id);
    const field = c.input.closest('.field');
    field.classList.add('qty-field');
    const stepper = document.createElement('div'); stepper.className = 'qty-stepper';
    const down = document.createElement('button'), up = document.createElement('button');
    for (const [button, action, text, label] of [[down, 'decrease', '−', 'Kurangi'], [up, 'increase', '+', 'Tambah']]) {
      button.type = 'button'; button.dataset.step = action; button.textContent = text;
      button.setAttribute('aria-label', `${label} peserta ${packages[id].name}`);
      button.setAttribute('aria-controls', c.input.id);
      button.addEventListener('click', () => {
        const current = config(id);
        current.input.value = String(safeQty(safeQty(current.input.value, current.min) + (action === 'increase' ? 1 : -1), current.min));
        refreshCard(id);
      });
    }
    c.input.before(stepper); stepper.append(down, c.input, up);
    const note = document.createElement('small'); note.className = 'minimum-note'; note.id = `min-${id}`;
    field.append(note); c.input.setAttribute('aria-describedby', note.id);
    const preview = document.createElement('div'); preview.className = 'estimate-preview'; preview.setAttribute('aria-live', 'polite'); preview.setAttribute('aria-atomic', 'true');
    preview.innerHTML = '<span data-preview-label></span><strong data-preview-total></strong>';
    $('.estimate-box', c.card).insertBefore(preview, $('[data-add]', c.card));
    c.input.addEventListener('input', () => refreshCard(id, false));
    c.input.addEventListener('change', () => refreshCard(id));
    c.select?.addEventListener('change', () => {
      refreshCard(id);
      if (id === 'tumpak' && config(id).min === 5) toast('Paket privat membutuhkan minimal 5 peserta.');
    });
    $('[data-add]', c.card).addEventListener('click', () => {
      const current = config(id);
      const qty = safeQty(current.input.value, current.min);
      const exists = cart.has(current.key);
      cart.set(current.key, { id, name: packages[id].name, variantText: variantText(id, current.variant), variant: current.variant, price: current.price, min: current.min, qty });
      renderCart();
      toast(`${packages[id].name}: ${qty} peserta ${exists ? 'diperbarui' : 'ditambahkan'}.`, true);
    });
  });
  const clearDialog = $('#clear-dialog');
  $('#clear-cart').addEventListener('click', () => { clearDialog.returnValue = 'cancel'; clearDialog.showModal(); });
  clearDialog.addEventListener('close', () => {
    if (clearDialog.returnValue === 'clear') {
      cart.clear(); renderCart(); $('#ask-schedule').focus({ preventScroll: true });
      toast('Struk estimasi dikosongkan. Pilih trip untuk mulai lagi.');
    }
  });
  clearDialog.addEventListener('click', e => { if (e.target === clearDialog) {
    const r = clearDialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) clearDialog.close('cancel');
  } });

  let activeFilter = 'all';
  const search = $('#trip-search');
  const cards = $$('.trip-card');
  const searchable = new Map(cards.map(card => [card, `${card.textContent} ${card.dataset.tags}`.toLocaleLowerCase('id-ID')]));
  const applyFilters = () => {
    const words = search.value.trim().toLocaleLowerCase('id-ID').split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach(card => {
      const matches = words.every(word => searchable.get(card).includes(word));
      card.hidden = !(matches && (activeFilter === 'all' || card.dataset.tags.split(/\s+/).includes(activeFilter)));
      if (!card.hidden) shown++;
    });
    $('#results-label').textContent = `${shown} dari 4 paket${words.length || activeFilter !== 'all' ? ' cocok' : ' untuk dijelajahi'}`;
    $('#no-results').hidden = shown > 0;
    $('#no-results').style.display = shown ? 'none' : 'block';
    $('.search-clear').hidden = !search.value;
    $('#reset-filters').hidden = !words.length && activeFilter === 'all';
    $$('.filter-chip').forEach(button => {
      const active = button.dataset.filter === activeFilter;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
  };
  const resetFilters = () => { search.value = ''; activeFilter = 'all'; applyFilters(); };
  search.addEventListener('input', applyFilters);
  $('.search-clear').addEventListener('click', () => { search.value = ''; applyFilters(); search.focus(); });
  $$('.reset-filters').forEach(button => button.addEventListener('click', resetFilters));
  $$('.filter-chip').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter; applyFilters();
    button.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest', inline: 'nearest' });
  }));
  $$('.feature-link').forEach(link => link.addEventListener('click', resetFilters));
  const menuButton = $('.menu-toggle'), nav = $('#primary-nav');
  const mobile = matchMedia('(max-width: 760px)');
  const setBackgroundInert = opening => {
    $$('main, footer, .mobile-bar').forEach(el => el.inert = opening);
  };
  const closeMenu = (returnFocus = false) => {
    nav.classList.remove('open'); document.body.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Buka menu');
    $('.menu-backdrop').hidden = true; setBackgroundInert(false);
    if (returnFocus) menuButton.focus({ preventScroll: true });
  };
  menuButton.addEventListener('click', () => {
    if (nav.classList.contains('open')) return closeMenu(true);
    nav.classList.add('open'); document.body.classList.add('menu-open');
    menuButton.setAttribute('aria-expanded', 'true'); menuButton.setAttribute('aria-label', 'Tutup menu');
    $('.menu-backdrop').hidden = false; setBackgroundInert(true);
    $('a', nav).focus({ preventScroll: true });
  });
  $('.menu-backdrop').addEventListener('click', () => closeMenu(true));
  $$('a', nav).forEach(link => link.addEventListener('click', () => {
    const destination = document.querySelector(link.getAttribute('href'));
    closeMenu();
    if (destination) { destination.setAttribute('tabindex', '-1'); destination.focus({ preventScroll: true }); }
  }));
  document.addEventListener('keydown', e => {
    if (!nav.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); }
    if (e.key === 'Tab') {
      const focusable = [menuButton, ...$$('a, button', nav).filter(el => !el.hidden && !el.disabled)];
      const index = focusable.indexOf(document.activeElement);
      e.preventDefault(); focusable[(index + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
    }
  });
  mobile.addEventListener('change', () => closeMenu());
  $('#mobile-receipt-link').addEventListener('click', () => $('#toast').classList.remove('show'));
  if (window.visualViewport) {
    const updateKeyboard = () => {
      const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      $('.mobile-bar').hidden = typing && window.visualViewport.height < window.innerHeight * .75;
    };
    visualViewport.addEventListener('resize', updateKeyboard);
    document.addEventListener('focusout', () => { $('.mobile-bar').hidden = false; });
  }

  const installButton = $('#install-app');
  const installDialog = $('#install-dialog');
  let installPrompt = null;
  const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (isStandalone) installButton.hidden = true;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
  });
  installButton.addEventListener('click', async () => {
    closeMenu();
    if (isStandalone) return;
    if (installPrompt) {
      const promptEvent = installPrompt;
      installPrompt = null;
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === 'accepted') {
          installButton.hidden = true;
          toast('RK Explorer sedang dipasang di perangkat ini.');
          return;
        }
      } catch { /* Use the manual iOS/Android guide when native install UI is unavailable. */ }
    }
    if (!installDialog.open) installDialog.showModal();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installButton.hidden = true;
    toast('RK Explorer berhasil ditambahkan ke perangkat ini.');
  });
  installDialog.addEventListener('click', event => {
    if (event.target === installDialog) installDialog.close('dismiss');
  });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {}), { once: true });
  }
  renderCart(); applyFilters();
})();
