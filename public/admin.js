(function () {
  function $(sel) { return document.querySelector(sel); }

  function showLogin() {
    $('#loginScreen').style.display = 'flex';
    $('#portalShell').classList.remove('active');
  }
  function showPortal() {
    $('#loginScreen').style.display = 'none';
    $('#portalShell').classList.add('active');
  }

  async function checkSession() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.ok && data.loggedIn) {
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

  checkSession();
})();
