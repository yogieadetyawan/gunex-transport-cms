(function () {
  function $(sel) { return document.querySelector(sel); }

  function hideBootLoading() {
    const el = $('#bootLoading');
    if (el) el.classList.remove('show');
  }
  function showLogin() {
    hideBootLoading();
    $('#loginScreen').classList.add('show');
    $('#portalShell').classList.remove('active');
  }
  function showPortal() {
    hideBootLoading();
    $('#loginScreen').classList.remove('show');
    $('#portalShell').classList.add('active');
    loadUnreadMessageCount();
  }

  // Dipanggil saat sesi PIN terbatas kembali ke /admin (misal klik tombol
  // "kembali" di Gunex Fleet). Menampilkan pesan jelas + menyembunyikan kartu
  // yang memang tidak bisa dibuka sesi ini, daripada memantulkan otomatis
  // kembali ke Gunex Fleet (yang membuat tombol "kembali" terlihat tidak
  // bereaksi sama sekali).
  function showFleetOnlyNotice() {
    const notice = $('#fleetOnlyNotice');
    const cardCompany = $('#cardCompanyProfile');
    const cardPo = $('#cardPoMatcher');
    const cardStats = $('#cardStats');
    const cardMessages = $('#cardMessages');
    if (notice) notice.style.display = 'flex';
    if (cardCompany) cardCompany.style.display = 'none';
    if (cardPo) cardPo.style.display = 'none';
    if (cardStats) cardStats.style.display = 'none';
    if (cardMessages) cardMessages.style.display = 'none';
  }

  // Tampilkan jumlah pesan belum dibaca sebagai badge kecil di kartu "Pesan",
  // supaya admin langsung tahu ada permintaan baru tanpa perlu membuka menu
  // itu dulu. Diam-diam diabaikan jika gagal (bukan hal kritis untuk portal).
  async function loadUnreadMessageCount() {
    try {
      const res = await fetch('/api/contact-messages');
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) {
        const unread = data.messages.filter(m => !m.read).length;
        const badge = $('#unreadBadge');
        if (badge && unread > 0) {
          badge.textContent = unread;
          badge.style.display = 'inline-block';
        }
      }
    } catch (e) { /* abaikan, ini bukan hal kritis */ }
  }

  async function checkSession() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.ok && data.loggedIn) {
        if (data.fleetOnly) {
          // Sesi PIN hanya berguna untuk Gunex Fleet. Saat PERTAMA login lewat
          // PIN, langsung arahkan ke sana (lihat handler #pinForm di bawah).
          // TAPI jika pengguna kembali ke /admin secara sengaja (klik tombol
          // "kembali" di Gunex Fleet, atau ketik /admin manual), JANGAN
          // dipantulkan otomatis lagi ke Gunex Fleet — itu membuat tombol
          // "kembali" terlihat tidak bereaksi sama sekali. Sebagai gantinya,
          // tampilkan portal dalam mode terbatas: jelaskan kondisinya dan
          // beri tombol untuk keluar dari sesi PIN.
          showPortal();
          showFleetOnlyNotice();
          return;
        }
        showPortal();
      } else {
        showLogin();
      }
    } catch (e) {
      showLogin();
    }
  }

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#loginBtn');
    const errBox = $('#loginError');
    errBox.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Memproses...';
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: $('#username').value.trim(), password: $('#password').value })
      });
      const data = await res.json();
      if (data.ok) {
        showPortal();
      } else {
        errBox.textContent = data.error || 'Nama pengguna atau kata sandi salah.';
        errBox.style.display = 'block';
      }
    } catch (err) {
      errBox.textContent = 'Tidak dapat terhubung ke server. Coba lagi sebentar.';
      errBox.style.display = 'block';
    }
    btn.disabled = false;
    btn.textContent = 'Masuk';
  });

  $('#logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    location.reload();
  });

  // ---------- Akses cepat PIN (Gunex Fleet) ----------
  const loginCard = document.querySelector('.login-wrap > .login-card:not(.pin-card)');
  const pinCard = $('#pinCard');
  const pinDigits = Array.from(document.querySelectorAll('.pin-digit'));

  $('#pinQuickLink').addEventListener('click', () => {
    loginCard.style.display = 'none';
    pinCard.style.display = 'block';
    pinDigits.forEach(d => d.value = '');
    $('#pinError').style.display = 'none';
    pinDigits[0].focus();
  });
  $('#pinBackLink').addEventListener('click', () => {
    pinCard.style.display = 'none';
    loginCard.style.display = 'block';
  });

  // Auto-advance ke kotak berikutnya saat satu digit terisi, dan mundur saat
  // Backspace ditekan di kotak yang sudah kosong - pola umum input PIN/OTP.
  pinDigits.forEach((input, idx) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 1);
      if (input.value && idx < pinDigits.length - 1) {
        pinDigits[idx + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        pinDigits[idx - 1].focus();
      }
    });
    // Mendukung paste 6 digit sekaligus (misal disalin dari aplikasi pencatat PIN).
    input.addEventListener('paste', (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      if (text.length > 1) {
        e.preventDefault();
        text.slice(0, 6).split('').forEach((ch, i) => { if (pinDigits[i]) pinDigits[i].value = ch; });
        const next = pinDigits[Math.min(text.length, 5)];
        if (next) next.focus();
      }
    });
  });

  $('#pinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = pinDigits.map(d => d.value).join('');
    const errBox = $('#pinError');
    errBox.style.display = 'none';
    if (pin.length !== 6) {
      errBox.textContent = 'Masukkan keenam digit PIN terlebih dahulu.';
      errBox.style.display = 'block';
      return;
    }
    const btn = $('#pinSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Memproses...';
    try {
      const res = await fetch('/api/auth/login-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.ok) {
        window.location.href = '/admin/gunex-fleet';
        return;
      } else {
        errBox.textContent = data.error || 'PIN salah.';
        errBox.style.display = 'block';
        pinDigits.forEach(d => d.value = '');
        pinDigits[0].focus();
      }
    } catch (err) {
      errBox.textContent = 'Tidak dapat terhubung ke server. Coba lagi sebentar.';
      errBox.style.display = 'block';
    }
    btn.disabled = false;
    btn.textContent = 'Masuk ke Gunex Fleet';
  });

  checkSession();
})();
