(function () {
  let content = null;
  let dirty = false;

  // ---------- Helpers ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }
  function setPath(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
    cur[keys[keys.length - 1]] = value;
  }

  function showToast(msg, isError) {
    const toast = $('#toast');
    toast.textContent = msg;
    toast.classList.toggle('error', !!isError);
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function markDirty() {
    dirty = true;
    const status = $('#saveStatus');
    status.textContent = 'Belum disimpan';
    status.style.color = '#c0392b';
    status.classList.add('show');
  }
  function markSaved() {
    dirty = false;
    const status = $('#saveStatus');
    status.textContent = 'Tersimpan ✓';
    status.style.color = '#1e8e5a';
    status.classList.add('show');
    setTimeout(() => status.classList.remove('show'), 2000);
  }

  // ---------- Auth ----------
  async function checkSession() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.ok && data.loggedIn) {
      $('#meUsername').textContent = data.username;
      showAdmin();
      await loadContent();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    $('#loginScreen').style.display = 'flex';
    $('#adminShell').classList.remove('active');
  }
  function showAdmin() {
    $('#loginScreen').style.display = 'none';
    $('#adminShell').classList.add('active');
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
        body: JSON.stringify({
          username: $('#username').value.trim(),
          password: $('#password').value
        })
      });
      const data = await res.json();
      if (data.ok) {
        $('#meUsername').textContent = data.username;
        showAdmin();
        await loadContent();
      } else {
        errBox.textContent = data.error || 'Login gagal.';
        errBox.style.display = 'block';
      }
    } catch (err) {
      errBox.textContent = 'Tidak dapat terhubung ke server.';
      errBox.style.display = 'block';
    }
    btn.disabled = false;
    btn.textContent = 'Masuk';
  });

  $('#logoutBtn').addEventListener('click', async () => {
    if (dirty && !confirm('Ada perubahan belum disimpan. Tetap keluar?')) return;
    await fetch('/api/auth/logout', { method: 'POST' });
    location.reload();
  });

  // ---------- Load & bind content ----------
  async function loadContent() {
    const res = await fetch('/api/content');
    const data = await res.json();
    if (!data.ok) { showToast('Gagal memuat konten', true); return; }
    content = data.content;
    bindSimpleFields();
    renderHeroStats();
    renderAboutParagraphs();
    renderAboutProfile();
    renderServices();
    renderFleet();
    renderFlow();
    renderCoverage();
    renderClients();
  }

  function bindSimpleFields() {
    $all('[data-bind]').forEach(el => {
      const path = el.getAttribute('data-bind');
      const val = getPath(content, path);
      el.value = val == null ? '' : val;
      el.oninput = () => {
        setPath(content, path, el.value);
        markDirty();
      };
    });
  }

  // ---------- Repeatable list renderers ----------
  function renderHeroStats() {
    const wrap = $('#heroStatsList');
    wrap.innerHTML = '';
    content.hero.stats.forEach((stat, i) => {
      const item = document.createElement('div');
      item.className = 'repeat-item';
      item.innerHTML = `
        <div class="repeat-item-head">
          <span class="idx">Statistik ${i + 1}</span>
          <button class="icon-btn del-stat">✕ Hapus</button>
        </div>
        <div class="field-grid two">
          <div class="f"><label>Angka</label><input value="${escAttr(stat.num)}" data-k="num"></div>
          <div class="f"><label>Label</label><input value="${escAttr(stat.label)}" data-k="label"></div>
        </div>`;
      item.querySelector('[data-k="num"]').oninput = e => { content.hero.stats[i].num = e.target.value; markDirty(); };
      item.querySelector('[data-k="label"]').oninput = e => { content.hero.stats[i].label = e.target.value; markDirty(); };
      item.querySelector('.del-stat').onclick = () => { content.hero.stats.splice(i, 1); renderHeroStats(); markDirty(); };
      wrap.appendChild(item);
    });
    addBtnIfMissing(wrap, 'Tambah Statistik', () => {
      content.hero.stats.push({ num: '0', label: 'Label Baru' });
      renderHeroStats(); markDirty();
    });
  }

  function renderAboutParagraphs() {
    const wrap = $('#aboutParagraphsList');
    wrap.innerHTML = '';
    content.about.paragraphs.forEach((p, i) => {
      const item = document.createElement('div');
      item.className = 'repeat-item';
      item.innerHTML = `
        <div class="repeat-item-head">
          <span class="idx">Paragraf ${i + 1}</span>
          <button class="icon-btn del">✕ Hapus</button>
        </div>
        <div class="f"><textarea style="min-height:90px">${escHtml(p)}</textarea></div>`;
      item.querySelector('textarea').oninput = e => { content.about.paragraphs[i] = e.target.value; markDirty(); };
      item.querySelector('.del').onclick = () => { content.about.paragraphs.splice(i, 1); renderAboutParagraphs(); markDirty(); };
      wrap.appendChild(item);
    });
    addBtnIfMissing(wrap, 'Tambah Paragraf', () => {
      content.about.paragraphs.push('Tulis paragraf baru di sini.');
      renderAboutParagraphs(); markDirty();
    });
  }

  function renderAboutProfile() {
    const wrap = $('#aboutProfileList');
    wrap.innerHTML = '';
    content.about.profile.forEach((row, i) => {
      const item = document.createElement('div');
      item.className = 'repeat-item';
      item.innerHTML = `
        <div class="repeat-item-head">
          <span class="idx">Baris ${i + 1}</span>
          <button class="icon-btn del">✕ Hapus</button>
        </div>
        <div class="field-grid two">
          <div class="f"><label>Label</label><input value="${escAttr(row.label)}" data-k="label"></div>
          <div class="f"><label>Nilai</label><input value="${escAttr(row.value)}" data-k="value"></div>
        </div>`;
      item.querySelector('[data-k="label"]').oninput = e => { content.about.profile[i].label = e.target.value; markDirty(); };
      item.querySelector('[data-k="value"]').oninput = e => { content.about.profile[i].value = e.target.value; markDirty(); };
      item.querySelector('.del').onclick = () => { content.about.profile.splice(i, 1); renderAboutProfile(); markDirty(); };
      wrap.appendChild(item);
    });
    addBtnIfMissing(wrap, 'Tambah Baris Profil', () => {
      content.about.profile.push({ label: 'Label Baru', value: 'Nilai' });
      renderAboutProfile(); markDirty();
    });
  }

  function renderServices() {
    const wrap = $('#servicesList');
    wrap.innerHTML = '';
    content.services.items.forEach((s, i) => {
      const item = document.createElement('div');
      item.className = 'repeat-item';
      item.innerHTML = `
        <div class="repeat-item-head">
          <span class="idx">Layanan ${i + 1}</span>
          <button class="icon-btn del">✕ Hapus</button>
        </div>
        <div class="field-grid">
          <div class="f"><label>Judul</label><input value="${escAttr(s.title)}" data-k="title"></div>
          <div class="f"><label>Deskripsi</label><textarea data-k="desc">${escHtml(s.desc)}</textarea></div>
        </div>`;
      item.querySelector('[data-k="title"]').oninput = e => { content.services.items[i].title = e.target.value; markDirty(); };
      item.querySelector('[data-k="desc"]').oninput = e => { content.services.items[i].desc = e.target.value; markDirty(); };
      item.querySelector('.del').onclick = () => { content.services.items.splice(i, 1); renderServices(); markDirty(); };
      wrap.appendChild(item);
    });
    addBtnIfMissing(wrap, 'Tambah Layanan', () => {
      content.services.items.push({ title: 'Layanan Baru', desc: 'Deskripsi layanan.' });
      renderServices(); markDirty();
    });
  }

  function renderFleet() {
    const wrap = $('#fleetList');
    wrap.innerHTML = '';
    content.fleet.items.forEach((f, i) => {
      const item = document.createElement('div');
      item.className = 'repeat-item';
      item.innerHTML = `
        <div class="repeat-item-head">
          <span class="idx">Armada ${i + 1}</span>
          <button class="icon-btn del">✕ Hapus</button>
        </div>
        <div class="field-grid">
          <div class="field-grid two">
            <div class="f"><label>Nama Tipe Armada</label><input value="${escAttr(f.name)}" data-k="name"></div>
            <div class="f"><label>Tag (label kecil)</label><input value="${escAttr(f.tag)}" data-k="tag"></div>
          </div>
          <div class="f"><label>Deskripsi</label><textarea data-k="desc">${escHtml(f.desc)}</textarea></div>
        </div>`;
      item.querySelector('[data-k="name"]').oninput = e => { content.fleet.items[i].name = e.target.value; markDirty(); };
      item.querySelector('[data-k="tag"]').oninput = e => { content.fleet.items[i].tag = e.target.value; markDirty(); };
      item.querySelector('[data-k="desc"]').oninput = e => { content.fleet.items[i].desc = e.target.value; markDirty(); };
      item.querySelector('.del').onclick = () => { content.fleet.items.splice(i, 1); renderFleet(); markDirty(); };
      wrap.appendChild(item);
    });
    addBtnIfMissing(wrap, 'Tambah Tipe Armada', () => {
      content.fleet.items.push({ name: 'Tipe Baru', desc: 'Deskripsi armada.', tag: 'TAG' });
      renderFleet(); markDirty();
    });
  }

  function renderFlow() {
    const wrap = $('#flowList');
    wrap.innerHTML = '';
    content.flow.steps.forEach((s, i) => {
      const item = document.createElement('div');
      item.className = 'repeat-item';
      item.innerHTML = `
        <div class="repeat-item-head">
          <span class="idx">Langkah ${i + 1}</span>
          <button class="icon-btn del">✕ Hapus</button>
        </div>
        <div class="field-grid">
          <div class="f"><label>Judul Langkah</label><input value="${escAttr(s.title)}" data-k="title"></div>
          <div class="f"><label>Deskripsi</label><textarea data-k="desc">${escHtml(s.desc)}</textarea></div>
        </div>`;
      item.querySelector('[data-k="title"]').oninput = e => { content.flow.steps[i].title = e.target.value; markDirty(); };
      item.querySelector('[data-k="desc"]').oninput = e => { content.flow.steps[i].desc = e.target.value; markDirty(); };
      item.querySelector('.del').onclick = () => { content.flow.steps.splice(i, 1); renderFlow(); markDirty(); };
      wrap.appendChild(item);
    });
    addBtnIfMissing(wrap, 'Tambah Langkah', () => {
      content.flow.steps.push({ title: 'Langkah Baru', desc: 'Deskripsi langkah.' });
      renderFlow(); markDirty();
    });
  }

  function renderCoverage() {
    const wrap = $('#coverageList');
    wrap.innerHTML = '';
    content.coverage.areas.forEach((a, i) => {
      const item = document.createElement('div');
      item.className = 'repeat-item';
      item.innerHTML = `
        <div class="repeat-item-head">
          <span class="idx">Wilayah ${i + 1}</span>
          <button class="icon-btn del">✕ Hapus</button>
        </div>
        <div class="field-grid">
          <div class="field-grid two">
            <div class="f"><label>Nama Wilayah</label><input value="${escAttr(a.name)}" data-k="name"></div>
            <div class="f"><label>Deskripsi Singkat</label><input value="${escAttr(a.desc)}" data-k="desc"></div>
          </div>
          <div class="field-grid two">
            <div class="f"><label>Posisi X (%)</label><input type="number" step="0.1" value="${a.mapX}" data-k="mapX"></div>
            <div class="f"><label>Posisi Y (%)</label><input type="number" step="0.1" value="${a.mapY}" data-k="mapY"></div>
          </div>
          <div class="f"><label>Posisi Label</label>
            <select data-k="labelPos">
              <option value="above" ${a.labelPos === 'above' ? 'selected' : ''}>Di atas pin</option>
              <option value="below" ${a.labelPos === 'below' ? 'selected' : ''}>Di bawah pin</option>
            </select>
          </div>
        </div>`;
      item.querySelector('[data-k="name"]').oninput = e => { content.coverage.areas[i].name = e.target.value; markDirty(); };
      item.querySelector('[data-k="desc"]').oninput = e => { content.coverage.areas[i].desc = e.target.value; markDirty(); };
      item.querySelector('[data-k="mapX"]').oninput = e => { content.coverage.areas[i].mapX = parseFloat(e.target.value) || 0; markDirty(); };
      item.querySelector('[data-k="mapY"]').oninput = e => { content.coverage.areas[i].mapY = parseFloat(e.target.value) || 0; markDirty(); };
      item.querySelector('[data-k="labelPos"]').onchange = e => { content.coverage.areas[i].labelPos = e.target.value; markDirty(); };
      item.querySelector('.del').onclick = () => { content.coverage.areas.splice(i, 1); renderCoverage(); markDirty(); };
      wrap.appendChild(item);
    });
    addBtnIfMissing(wrap, 'Tambah Wilayah', () => {
      content.coverage.areas.push({ name: 'Wilayah Baru', desc: 'Deskripsi', mapX: 50, mapY: 50, labelPos: 'above' });
      renderCoverage(); markDirty();
    });
  }

  function renderClients() {
    const wrap = $('#clientsList');
    wrap.innerHTML = '';
    content.clients.items.forEach((name, i) => {
      const row = document.createElement('div');
      row.className = 'simple-list-item';
      row.innerHTML = `<input value="${escAttr(name)}"><button class="icon-btn del">✕</button>`;
      row.querySelector('input').oninput = e => { content.clients.items[i] = e.target.value; markDirty(); };
      row.querySelector('.del').onclick = () => { content.clients.items.splice(i, 1); renderClients(); markDirty(); };
      wrap.appendChild(row);
    });
    addBtnIfMissing(wrap, 'Tambah Klien', () => {
      content.clients.items.push('PT. Nama Perusahaan Baru');
      renderClients(); markDirty();
    });
  }

  function addBtnIfMissing(wrap, label, onClick) {
    const btn = document.createElement('button');
    btn.className = 'add-btn';
    btn.textContent = '+ ' + label;
    btn.onclick = onClick;
    wrap.appendChild(btn);
  }

  function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  // ---------- Sidebar navigation ----------
  const titles = {
    hero: 'Hero / Beranda', about: 'Tentang Kami', services: 'Layanan',
    fleet: 'Armada', flow: 'Alur Kerja Sama', coverage: 'Wilayah Layanan',
    clients: 'Klien', contact: 'Kontak', footer: 'Footer', account: 'Akun Admin'
  };
  $all('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.getAttribute('data-panel');
      $all('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $all('.panel').forEach(p => p.classList.remove('active'));
      $(`.panel[data-panel="${panel}"]`).classList.add('active');
      $('#topbarTitle').textContent = titles[panel] || panel;
    });
  });

  // ---------- Save / Reset ----------
  $('#saveBtn').addEventListener('click', async () => {
    const btn = $('#saveBtn');
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (data.ok) {
        markSaved();
        showToast('Perubahan berhasil disimpan.');
      } else {
        showToast(data.error || 'Gagal menyimpan.', true);
      }
    } catch (e) {
      showToast('Tidak dapat terhubung ke server.', true);
    }
    btn.disabled = false;
    btn.textContent = 'Simpan Perubahan';
  });

  $('#resetBtn').addEventListener('click', () => $('#resetModal').classList.add('show'));
  $('#cancelReset').addEventListener('click', () => $('#resetModal').classList.remove('show'));
  $('#confirmReset').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/content/reset', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        content = data.content;
        bindSimpleFields();
        renderHeroStats(); renderAboutParagraphs(); renderAboutProfile();
        renderServices(); renderFleet(); renderFlow(); renderCoverage(); renderClients();
        showToast('Konten berhasil dikembalikan ke default.');
      } else {
        showToast(data.error || 'Gagal mereset.', true);
      }
    } catch (e) {
      showToast('Tidak dapat terhubung ke server.', true);
    }
    $('#resetModal').classList.remove('show');
  });

  // ---------- Change password ----------
  $('#changePassBtn').addEventListener('click', async () => {
    const cur = $('#curPass').value;
    const next = $('#newPass').value;
    const msg = $('#passMsg');
    msg.textContent = '';
    if (!cur || !next) { msg.style.color = '#c0392b'; msg.textContent = 'Isi password lama dan baru.'; return; }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: cur, newPassword: next })
      });
      const data = await res.json();
      if (data.ok) {
        msg.style.color = '#1e8e5a';
        msg.textContent = 'Password berhasil diganti.';
        $('#curPass').value = ''; $('#newPass').value = '';
      } else {
        msg.style.color = '#c0392b';
        msg.textContent = data.error || 'Gagal mengganti password.';
      }
    } catch (e) {
      msg.style.color = '#c0392b';
      msg.textContent = 'Tidak dapat terhubung ke server.';
    }
  });

  // warn before leaving with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  checkSession();
})();
