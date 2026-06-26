(function () {
  function $(sel) { return document.querySelector(sel); }
  let messages = [];

  $('#logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin';
  });

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
      const jam = String(d.getHours()).padStart(2, '0');
      const menit = String(d.getMinutes()).padStart(2, '0');
      return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}, ${jam}:${menit}`;
    } catch (e) { return iso; }
  }

  function renderList() {
    const unreadCount = messages.filter(m => !m.read).length;
    if (messages.length === 0) {
      $('#msgMain').innerHTML = `
        <div class="empty-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7l9 6 9-6"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>
          <div>Belum ada pesan masuk dari formulir "Hubungi Kami".</div>
        </div>`;
      return;
    }
    const countBar = `<div class="msg-count-bar"><b>${messages.length}</b> pesan diterima${unreadCount > 0 ? `, <b>${unreadCount}</b> belum dibaca` : ''}</div>`;
    const cards = messages.map(m => `
      <div class="msg-card ${m.read ? '' : 'unread'}" data-id="${esc(m.id)}">
        <div class="msg-card-top">
          <div class="msg-card-company">${m.read ? '' : '<span class="msg-unread-dot"></span>'}${esc(m.company)}</div>
          <div class="msg-card-date">${formatDate(m.createdAt)}</div>
        </div>
        <div class="msg-card-name">${esc(m.contactName)} — ${esc(m.contactInfo)}${m.fleetNeed ? ' · ' + esc(m.fleetNeed) : ''}</div>
        ${m.detail ? `<div class="msg-card-preview">${esc(m.detail)}</div>` : ''}
      </div>
    `).join('');
    $('#msgMain').innerHTML = countBar + cards + `
      <div class="msg-overlay" id="msgOverlay">
        <div class="msg-detail" id="msgDetail"></div>
      </div>`;

    document.querySelectorAll('.msg-card').forEach(card => {
      card.addEventListener('click', () => openDetail(card.getAttribute('data-id')));
    });
  }

  async function openDetail(id) {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    const overlay = $('#msgOverlay');
    const detail = $('#msgDetail');
    detail.innerHTML = `
      <div class="msg-detail-head">
        <h2>${esc(msg.company)}</h2>
        <button class="msg-detail-close" id="msgCloseBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="msg-detail-row"><div class="dl">Penanggung Jawab</div><div class="dv">${esc(msg.contactName)}</div></div>
      <div class="msg-detail-row"><div class="dl">Kontak</div><div class="dv">${esc(msg.contactInfo)}</div></div>
      ${msg.fleetNeed ? `<div class="msg-detail-row"><div class="dl">Kebutuhan Armada</div><div class="dv">${esc(msg.fleetNeed)}</div></div>` : ''}
      ${msg.detail ? `<div class="msg-detail-row"><div class="dl">Detail Kebutuhan</div><div class="dv">${esc(msg.detail)}</div></div>` : ''}
      <div class="msg-detail-row"><div class="dl">Diterima</div><div class="dv">${formatDate(msg.createdAt)}</div></div>
      <div class="msg-detail-actions">
        <button class="btn-top btn-danger" id="msgDeleteBtn">Hapus Pesan</button>
      </div>
    `;
    overlay.classList.add('show');
    $('#msgCloseBtn').addEventListener('click', closeDetail);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDetail(); });
    $('#msgDeleteBtn').addEventListener('click', () => deleteMessage(id));

    // Tandai dibaca otomatis saat detail dibuka, supaya admin tidak perlu
    // langkah ekstra - membuka pesan SECARA WAJAR berarti sudah membacanya.
    // PENTING: update tampilan kartu yang relevan secara LANGSUNG di DOM
    // (bukan panggil renderList() ulang), karena renderList() membangun ulang
    // SELURUH html termasuk #msgOverlay dari nol - itu akan menghapus class
    // "show" yang baru ditambahkan di atas, membuat modal yang baru terbuka
    // langsung tertutup sendiri sesaat setelah muncul.
    if (!msg.read) {
      msg.read = true;
      updateCardReadState(id);
      try {
        await fetch(`/api/contact-messages/${id}/read`, { method: 'POST' });
      } catch (e) { /* abaikan - status baca bukan hal kritis jika gagal sesaat */ }
    }
  }

  // Update tampilan SATU kartu (hapus tanda belum-dibaca) dan hitungan jumlah
  // belum dibaca, tanpa membangun ulang seluruh daftar/overlay.
  function updateCardReadState(id) {
    const card = document.querySelector(`.msg-card[data-id="${id}"]`);
    if (card) {
      card.classList.remove('unread');
      const dot = card.querySelector('.msg-unread-dot');
      if (dot) dot.remove();
    }
    const countBar = $('.msg-count-bar');
    if (countBar) {
      const unreadCount = messages.filter(m => !m.read).length;
      countBar.innerHTML = `<b>${messages.length}</b> pesan diterima${unreadCount > 0 ? `, <b>${unreadCount}</b> belum dibaca` : ''}`;
    }
  }

  function closeDetail() {
    const overlay = $('#msgOverlay');
    if (overlay) overlay.classList.remove('show');
  }

  async function deleteMessage(id) {
    if (!confirm('Hapus pesan ini secara permanen? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      const res = await fetch(`/api/contact-messages/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        messages = messages.filter(m => m.id !== id);
        closeDetail();
        renderList();
      } else {
        alert(data.error || 'Gagal menghapus pesan.');
      }
    } catch (e) {
      alert('Tidak dapat terhubung ke server.');
    }
  }

  async function init() {
    try {
      const res = await fetch('/api/contact-messages');
      if (res.status === 401) { window.location.href = '/admin'; return; }
      const data = await res.json();
      if (data.ok) {
        messages = data.messages;
        renderList();
      } else {
        $('#msgMain').innerHTML = '<div class="empty-note">Gagal memuat pesan.</div>';
      }
    } catch (e) {
      $('#msgMain').innerHTML = '<div class="empty-note">Tidak dapat terhubung ke server.</div>';
    }
  }

  init();
})();
