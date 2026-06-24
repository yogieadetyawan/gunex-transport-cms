(function () {
  let content = null;
  let dirty = false;
  let currentSection = 'hero';
  const iframe = document.getElementById('previewFrame');
  let iframeReady = false;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function escHtml(str) { return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(str) { return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  function showToast(msg, isError) {
    const toast = $('#toast');
    const icon = isError
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>';
    toast.innerHTML = icon + '<span>' + msg + '</span>';
    toast.classList.toggle('error', !!isError);
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function markDirty() {
    dirty = true;
    const status = $('#saveStatus');
    status.innerHTML = '<span class="dot"></span> Ada perubahan belum disimpan';
    status.classList.add('unsaved');
    sendPreviewUpdate();
  }
  function markSaved() {
    dirty = false;
    const status = $('#saveStatus');
    status.innerHTML = '<span class="dot"></span> Semua tersimpan';
    status.classList.remove('unsaved');
  }

  // ---------- Live preview lewat iframe ----------
  let previewDebounce = null;
  function sendPreviewUpdate() {
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(() => {
      if (!iframe || !iframe.contentWindow) return;
      iframe.contentWindow.postMessage({ type: 'GUNEX_PREVIEW_UPDATE', content }, '*');
    }, 250);
  }
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'GUNEX_PREVIEW_HEIGHT') {
      iframe.style.height = Math.max(e.data.height, 800) + 'px';
    }
  });
  iframe.addEventListener('load', () => {
    iframeReady = true;
    sendPreviewUpdate();
  });

  // ---------- Auth ----------
  async function checkSession() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.ok && data.loggedIn) {
      showAdmin();
      await loadContent();
      maybeShowTour();
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
  function maybeShowTour() {
    if (localStorage.getItem('gunex_admin_tour_seen')) return;
    $('#tourOverlay').classList.add('show');
  }
  $('#tourCloseBtn').addEventListener('click', () => {
    localStorage.setItem('gunex_admin_tour_seen', '1');
    $('#tourOverlay').classList.remove('show');
  });

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
        showAdmin();
        await loadContent();
        maybeShowTour();
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
    if (dirty && !confirm('Ada perubahan yang belum disimpan. Tetap keluar tanpa menyimpan?')) return;
    await fetch('/api/auth/logout', { method: 'POST' });
    location.reload();
  });

  // ---------- Load content & render sidebar selection ----------
  async function loadContent() {
    const res = await fetch('/api/content');
    const data = await res.json();
    if (!data.ok) { showToast('Gagal memuat isi website.', true); return; }
    content = data.content;

    // Jika ada draft tersimpan dari sesi yang habis sebelumnya, tawarkan untuk dipulihkan.
    try {
      const draft = localStorage.getItem('gunex_admin_draft_backup');
      if (draft) {
        const draftContent = JSON.parse(draft);
        const wantsRestore = confirm('Ditemukan perubahan yang belum tersimpan dari sesi sebelumnya. Pulihkan perubahan tersebut sekarang?');
        if (wantsRestore) {
          content = draftContent;
          markDirty();
          showToast('Perubahan sebelumnya berhasil dipulihkan. Jangan lupa klik Simpan.');
        }
        localStorage.removeItem('gunex_admin_draft_backup');
      }
    } catch (e) { /* draft korup, abaikan saja */ }

    renderSection(currentSection);
  }

  $all('.section-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $all('.section-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSection = btn.getAttribute('data-section');
      renderSection(currentSection);
    });
  });

  // ---------- Section renderers (bahasa sederhana, satu per "halaman" sidebar) ----------
  const SECTION_META = {
    hero: { title: 'Halaman Depan', desc: 'Ini bagian paling atas yang pertama dilihat pengunjung website Anda.' },
    about: { title: 'Tentang Kami', desc: 'Cerita singkat tentang perusahaan dan data ringkas perusahaan.' },
    services: { title: 'Layanan', desc: 'Daftar jasa yang ditawarkan perusahaan Anda.' },
    fleet: { title: 'Armada / Kendaraan', desc: 'Jenis-jenis kendaraan yang dimiliki perusahaan.' },
    flow: { title: 'Cara Kerja Sama', desc: 'Langkah-langkah ketika ada klien baru yang ingin bekerja sama.' },
    coverage: { title: 'Wilayah Layanan', desc: 'Daerah yang dilayani, lengkap dengan titik lokasi di peta.' },
    clients: { title: 'Daftar Klien', desc: 'Nama-nama perusahaan yang menjadi pelanggan Anda.' },
    contact: { title: 'Kontak', desc: 'Informasi supaya calon klien bisa menghubungi Anda.' },
    footer: { title: 'Footer', desc: 'Teks kecil di bagian paling bawah halaman.' },
    account: { title: 'Kata Sandi', desc: 'Ganti kata sandi untuk masuk ke halaman kelola ini.' }
  };

  function paneHeader(key) {
    const m = SECTION_META[key];
    return `<h2>${m.title}</h2><p class="edit-desc">${m.desc}</p>`;
  }

  function simpleField(label, value, onInput, opts) {
    opts = opts || {};
    const id = 'f_' + Math.random().toString(36).slice(2, 9);
    const isTextarea = !!opts.multiline;
    const tag = isTextarea ? 'textarea' : 'input';
    const valAttr = isTextarea ? '' : `value="${escAttr(value)}"`;
    const inner = isTextarea ? escHtml(value) : '';
    const help = opts.help ? `<div class="help">${opts.help}</div>` : '';
    const html = `
      <div class="simple-field">
        <label>${label}</label>
        <${tag} id="${id}" ${valAttr}>${inner}</${tag}>
        ${help}
      </div>`;
    setTimeout(() => {
      const el = document.getElementById(id);
      el.addEventListener('input', () => onInput(el.value));
    }, 0);
    return html;
  }

  function renderSection(key) {
    const pane = $('#editPane');
    if (key === 'account') { pane.innerHTML = renderAccount(); return; }
    if (!content) { pane.innerHTML = paneHeader(key); return; }

    const renderers = {
      hero: renderHero, about: renderAbout, services: renderServices,
      fleet: renderFleet, flow: renderFlow, coverage: renderCoverage,
      clients: renderClients, contact: renderContact, footer: renderFooter
    };
    pane.innerHTML = paneHeader(key) + (renderers[key] ? renderers[key]() : '');
    bindRepeatHandlers(key);
  }

  function renderHero() {
    const h = content.hero;
    let html = '';
    html += simpleField('Kalimat kecil di atas judul', h.eyebrow, v => { h.eyebrow = v; markDirty(); });
    html += simpleField('Judul utama', h.headline, v => { h.headline = v; markDirty(); });
    html += simpleField('Lanjutan judul (warna terang)', h.headlineAccent, v => { h.headlineAccent = v; markDirty(); });
    html += simpleField('Kalimat penjelasan', h.lead, v => { h.lead = v; markDirty(); }, { multiline: true });
    html += simpleField('Tulisan tombol pertama', h.ctaPrimary, v => { h.ctaPrimary = v; markDirty(); });
    html += simpleField('Tulisan tombol kedua', h.ctaSecondary, v => { h.ctaSecondary = v; markDirty(); });
    html += `<div class="simple-field"><label>Angka-angka pencapaian (4 kotak)</label></div>`;
    html += `<div id="rep_heroStats"></div>`;
    return html;
  }

  function renderAbout() {
    const a = content.about;
    let html = '';
    html += simpleField('Judul bagian', a.headline, v => { a.headline = v; markDirty(); });
    html += simpleField('Kalimat pembuka', a.lede, v => { a.lede = v; markDirty(); }, { multiline: true });
    html += `<div class="simple-field"><label>Cerita perusahaan (per paragraf)</label></div>`;
    html += `<div id="rep_aboutParagraphs"></div>`;
    html += `<div class="simple-field"><label>Tabel data singkat perusahaan</label></div>`;
    html += `<div id="rep_aboutProfile"></div>`;
    return html;
  }

  function renderServices() {
    const s = content.services;
    let html = '';
    html += simpleField('Judul bagian', s.headline, v => { s.headline = v; markDirty(); });
    html += simpleField('Kalimat pembuka', s.lede, v => { s.lede = v; markDirty(); }, { multiline: true });
    html += `<div id="rep_services"></div>`;
    return html;
  }

  function renderFleet() {
    const f = content.fleet;
    let html = '';
    html += simpleField('Judul bagian', f.headline, v => { f.headline = v; markDirty(); });
    html += simpleField('Kalimat pembuka', f.lede, v => { f.lede = v; markDirty(); }, { multiline: true });
    html += simpleField('Jumlah total kendaraan', f.totalUnit, v => { f.totalUnit = v; markDirty(); }, { help: 'Angka ini ditampilkan besar di bagian bawah daftar armada.' });
    html += `<div id="rep_fleet"></div>`;
    return html;
  }

  function renderFlow() {
    const f = content.flow;
    let html = '';
    html += simpleField('Judul bagian', f.headline, v => { f.headline = v; markDirty(); });
    html += simpleField('Kalimat pembuka', f.lede, v => { f.lede = v; markDirty(); }, { multiline: true });
    html += `<div id="rep_flow"></div>`;
    return html;
  }

  function renderCoverage() {
    const c = content.coverage;
    let html = '';
    html += simpleField('Judul bagian', c.headline, v => { c.headline = v; markDirty(); });
    html += simpleField('Kalimat pembuka', c.lede, v => { c.lede = v; markDirty(); }, { multiline: true });
    html += `<div class="pos-hint">💡 Untuk memindah <b>posisi titik lokasi di peta</b>, geser angka "Posisi di peta" pada tiap wilayah di bawah. Lihat hasilnya langsung di pratinjau sebelah kanan.</div>`;
    html += `<div id="rep_coverage"></div>`;
    return html;
  }

  function renderClients() {
    const c = content.clients;
    let html = '';
    html += simpleField('Judul bagian', c.headline, v => { c.headline = v; markDirty(); });
    html += simpleField('Kalimat pembuka', c.lede, v => { c.lede = v; markDirty(); }, { multiline: true });
    html += `<div class="simple-field"><label>Nama-nama klien</label></div>`;
    html += `<div id="rep_clients"></div>`;
    return html;
  }

  function renderContact() {
    const c = content.contact;
    let html = '';
    html += simpleField('Judul bagian', c.headline, v => { c.headline = v; markDirty(); });
    html += simpleField('Kalimat pembuka', c.lede, v => { c.lede = v; markDirty(); }, { multiline: true });
    html += simpleField('Alamat kantor', c.address, v => { c.address = v; markDirty(); }, { multiline: true });
    html += simpleField('Nomor Telepon / WhatsApp', c.phone, v => { c.phone = v; markDirty(); });
    html += simpleField('Alamat email', c.email, v => { c.email = v; markDirty(); });
    html += simpleField('Jam operasional', c.hours, v => { c.hours = v; markDirty(); });
    return html;
  }

  function renderFooter() {
    const f = content.footer;
    return simpleField('Teks hak cipta di paling bawah halaman', f.text, v => { f.text = v; markDirty(); }, { multiline: true });
  }

  function renderAccount() {
    return `
      ${paneHeader('account')}
      <div class="simple-field">
        <label>Kata Sandi Lama</label>
        <input type="password" id="curPass">
      </div>
      <div class="simple-field">
        <label>Kata Sandi Baru (minimal 6 huruf/angka)</label>
        <input type="password" id="newPass">
      </div>
      <button class="btn-top primary" id="changePassBtn" style="margin-top:6px;">Ganti Kata Sandi</button>
      <div id="passMsg" style="font-size:.85rem;margin-top:12px;line-height:1.5;"></div>
      <hr style="margin:32px 0;border:none;border-top:1px solid var(--line)">
      <div class="simple-field">
        <label style="color:var(--danger)">Kembalikan semua isi ke awal</label>
        <div class="help" style="margin-bottom:12px;">Gunakan ini jika ingin membatalkan semua perubahan dan mengembalikan isi website seperti semula.</div>
        <button class="btn-top" id="resetBtnInline" style="background:#fdeceb;color:var(--danger);border-color:#f3c9c4;">Kembalikan ke Isi Awal</button>
      </div>
    `;
  }

  // ---------- Repeatable items: dirender setelah innerHTML dipasang ----------
  function bindRepeatHandlers(section) {
    if (section === 'hero') renderHeroStats();
    if (section === 'about') { renderAboutParagraphs(); renderAboutProfile(); }
    if (section === 'services') renderServicesList();
    if (section === 'fleet') renderFleetList();
    if (section === 'flow') renderFlowList();
    if (section === 'coverage') renderCoverageList();
    if (section === 'clients') renderClientsList();
  }

  function addCardBtn(label) {
    return `<button class="btn-add-card" type="button"><svg><use href="#ic-plus"/></svg> ${label}</button>`;
  }

  function renderHeroStats() {
    const wrap = $('#rep_heroStats');
    if (!wrap) return;
    wrap.innerHTML = content.hero.stats.map((s, i) => `
      <div class="card-item">
        <div class="card-item-head">
          <span class="num-badge">${i + 1}</span>
          <button class="btn-remove" data-i="${i}">✕ Hapus</button>
        </div>
        <div class="simple-field" style="margin-bottom:10px;"><label>Angka</label><input data-k="num" value="${escAttr(s.num)}"></div>
        <div class="simple-field" style="margin-bottom:0;"><label>Tulisan di bawah angka</label><input data-k="label" value="${escAttr(s.label)}"></div>
      </div>`).join('') + addCardBtn('Tambah Kotak Angka');
    $all('[data-k="num"]', wrap).forEach((el, i) => el.oninput = () => { content.hero.stats[i].num = el.value; markDirty(); });
    $all('[data-k="label"]', wrap).forEach((el, i) => el.oninput = () => { content.hero.stats[i].label = el.value; markDirty(); });
    $all('.btn-remove', wrap).forEach(btn => btn.onclick = () => { content.hero.stats.splice(+btn.dataset.i, 1); renderHeroStats(); markDirty(); });
    $('.btn-add-card', wrap).onclick = () => { content.hero.stats.push({ num: '0', label: 'Tulisan baru' }); renderHeroStats(); markDirty(); };
  }

  function renderAboutParagraphs() {
    const wrap = $('#rep_aboutParagraphs');
    if (!wrap) return;
    wrap.innerHTML = content.about.paragraphs.map((p, i) => `
      <div class="card-item">
        <div class="card-item-head">
          <span class="num-badge">${i + 1}</span>
          <button class="btn-remove" data-i="${i}">✕ Hapus</button>
        </div>
        <textarea data-k="p" style="min-height:90px;width:100%;padding:12px 14px;border:1.5px solid var(--line);border-radius:8px;font-family:inherit;font-size:.95rem;">${escHtml(p)}</textarea>
      </div>`).join('') + addCardBtn('Tambah Paragraf');
    $all('[data-k="p"]', wrap).forEach((el, i) => el.oninput = () => { content.about.paragraphs[i] = el.value; markDirty(); });
    $all('.btn-remove', wrap).forEach(btn => btn.onclick = () => { content.about.paragraphs.splice(+btn.dataset.i, 1); renderAboutParagraphs(); markDirty(); });
    $('.btn-add-card', wrap).onclick = () => { content.about.paragraphs.push('Tulis cerita baru di sini.'); renderAboutParagraphs(); markDirty(); };
  }

  function renderAboutProfile() {
    const wrap = $('#rep_aboutProfile');
    if (!wrap) return;
    wrap.innerHTML = content.about.profile.map((row, i) => `
      <div class="card-item">
        <div class="card-item-head">
          <span class="num-badge">${i + 1}</span>
          <button class="btn-remove" data-i="${i}">✕ Hapus</button>
        </div>
        <div class="simple-field" style="margin-bottom:10px;"><label>Nama data</label><input data-k="label" value="${escAttr(row.label)}"></div>
        <div class="simple-field" style="margin-bottom:0;"><label>Isi data</label><input data-k="value" value="${escAttr(row.value)}"></div>
      </div>`).join('') + addCardBtn('Tambah Baris Data');
    $all('[data-k="label"]', wrap).forEach((el, i) => el.oninput = () => { content.about.profile[i].label = el.value; markDirty(); });
    $all('[data-k="value"]', wrap).forEach((el, i) => el.oninput = () => { content.about.profile[i].value = el.value; markDirty(); });
    $all('.btn-remove', wrap).forEach(btn => btn.onclick = () => { content.about.profile.splice(+btn.dataset.i, 1); renderAboutProfile(); markDirty(); });
    $('.btn-add-card', wrap).onclick = () => { content.about.profile.push({ label: 'Data Baru', value: 'Isi' }); renderAboutProfile(); markDirty(); };
  }

  function renderServicesList() {
    const wrap = $('#rep_services');
    if (!wrap) return;
    wrap.innerHTML = content.services.items.map((s, i) => `
      <div class="card-item">
        <div class="card-item-head">
          <span class="num-badge">${i + 1}</span>
          <button class="btn-remove" data-i="${i}">✕ Hapus</button>
        </div>
        <div class="simple-field" style="margin-bottom:10px;"><label>Nama layanan</label><input data-k="title" value="${escAttr(s.title)}"></div>
        <div class="simple-field" style="margin-bottom:0;"><label>Penjelasan singkat</label><textarea data-k="desc" style="min-height:70px;">${escHtml(s.desc)}</textarea></div>
      </div>`).join('') + addCardBtn('Tambah Layanan');
    $all('[data-k="title"]', wrap).forEach((el, i) => el.oninput = () => { content.services.items[i].title = el.value; markDirty(); });
    $all('[data-k="desc"]', wrap).forEach((el, i) => el.oninput = () => { content.services.items[i].desc = el.value; markDirty(); });
    $all('.btn-remove', wrap).forEach(btn => btn.onclick = () => { content.services.items.splice(+btn.dataset.i, 1); renderServicesList(); markDirty(); });
    $('.btn-add-card', wrap).onclick = () => { content.services.items.push({ title: 'Layanan Baru', desc: 'Penjelasan layanan.' }); renderServicesList(); markDirty(); };
  }

  function renderFleetList() {
    const wrap = $('#rep_fleet');
    if (!wrap) return;
    wrap.innerHTML = content.fleet.items.map((f, i) => `
      <div class="card-item">
        <div class="card-item-head">
          <span class="num-badge">${i + 1}</span>
          <button class="btn-remove" data-i="${i}">✕ Hapus</button>
        </div>
        <div class="simple-field" style="margin-bottom:10px;"><label>Nama jenis kendaraan</label><input data-k="name" value="${escAttr(f.name)}"></div>
        <div class="simple-field" style="margin-bottom:10px;"><label>Penjelasan</label><textarea data-k="desc" style="min-height:70px;">${escHtml(f.desc)}</textarea></div>
        <div class="simple-field" style="margin-bottom:0;"><label>Label kecil (contoh: BOX TERTUTUP)</label><input data-k="tag" value="${escAttr(f.tag)}"></div>
      </div>`).join('') + addCardBtn('Tambah Jenis Kendaraan');
    $all('[data-k="name"]', wrap).forEach((el, i) => el.oninput = () => { content.fleet.items[i].name = el.value; markDirty(); });
    $all('[data-k="desc"]', wrap).forEach((el, i) => el.oninput = () => { content.fleet.items[i].desc = el.value; markDirty(); });
    $all('[data-k="tag"]', wrap).forEach((el, i) => el.oninput = () => { content.fleet.items[i].tag = el.value; markDirty(); });
    $all('.btn-remove', wrap).forEach(btn => btn.onclick = () => { content.fleet.items.splice(+btn.dataset.i, 1); renderFleetList(); markDirty(); });
    $('.btn-add-card', wrap).onclick = () => { content.fleet.items.push({ name: 'Jenis Baru', desc: 'Penjelasan.', tag: 'LABEL' }); renderFleetList(); markDirty(); };
  }

  function renderFlowList() {
    const wrap = $('#rep_flow');
    if (!wrap) return;
    wrap.innerHTML = content.flow.steps.map((s, i) => `
      <div class="card-item">
        <div class="card-item-head">
          <span class="num-badge">${i + 1}</span>
          <button class="btn-remove" data-i="${i}">✕ Hapus</button>
        </div>
        <div class="simple-field" style="margin-bottom:10px;"><label>Judul langkah</label><input data-k="title" value="${escAttr(s.title)}"></div>
        <div class="simple-field" style="margin-bottom:0;"><label>Penjelasan</label><textarea data-k="desc" style="min-height:70px;">${escHtml(s.desc)}</textarea></div>
      </div>`).join('') + addCardBtn('Tambah Langkah');
    $all('[data-k="title"]', wrap).forEach((el, i) => el.oninput = () => { content.flow.steps[i].title = el.value; markDirty(); });
    $all('[data-k="desc"]', wrap).forEach((el, i) => el.oninput = () => { content.flow.steps[i].desc = el.value; markDirty(); });
    $all('.btn-remove', wrap).forEach(btn => btn.onclick = () => { content.flow.steps.splice(+btn.dataset.i, 1); renderFlowList(); markDirty(); });
    $('.btn-add-card', wrap).onclick = () => { content.flow.steps.push({ title: 'Langkah Baru', desc: 'Penjelasan langkah.' }); renderFlowList(); markDirty(); };
  }

  function renderCoverageList() {
    const wrap = $('#rep_coverage');
    if (!wrap) return;
    wrap.innerHTML = content.coverage.areas.map((a, i) => `
      <div class="card-item">
        <div class="card-item-head">
          <span class="num-badge">${i + 1}</span>
          <button class="btn-remove" data-i="${i}">✕ Hapus</button>
        </div>
        <div class="simple-field" style="margin-bottom:10px;"><label>Nama wilayah</label><input data-k="name" value="${escAttr(a.name)}"></div>
        <div class="simple-field" style="margin-bottom:10px;"><label>Keterangan singkat</label><input data-k="desc" value="${escAttr(a.desc)}"></div>
        <div style="display:flex;gap:10px;margin-bottom:10px;">
          <div class="simple-field" style="margin-bottom:0;flex:1;"><label>Posisi di peta: Kiri-Kanan (%)</label><input type="number" step="0.5" data-k="mapX" value="${a.mapX}"></div>
          <div class="simple-field" style="margin-bottom:0;flex:1;"><label>Posisi di peta: Atas-Bawah (%)</label><input type="number" step="0.5" data-k="mapY" value="${a.mapY}"></div>
        </div>
      </div>`).join('') + addCardBtn('Tambah Wilayah');
    $all('[data-k="name"]', wrap).forEach((el, i) => el.oninput = () => { content.coverage.areas[i].name = el.value; markDirty(); });
    $all('[data-k="desc"]', wrap).forEach((el, i) => el.oninput = () => { content.coverage.areas[i].desc = el.value; markDirty(); });
    $all('[data-k="mapX"]', wrap).forEach((el, i) => el.oninput = () => { content.coverage.areas[i].mapX = parseFloat(el.value) || 0; markDirty(); });
    $all('[data-k="mapY"]', wrap).forEach((el, i) => el.oninput = () => { content.coverage.areas[i].mapY = parseFloat(el.value) || 0; markDirty(); });
    $all('.btn-remove', wrap).forEach(btn => btn.onclick = () => { content.coverage.areas.splice(+btn.dataset.i, 1); renderCoverageList(); markDirty(); });
    $('.btn-add-card', wrap).onclick = () => { content.coverage.areas.push({ name: 'Wilayah Baru', desc: 'Keterangan', mapX: 50, mapY: 50, labelPos: 'above' }); renderCoverageList(); markDirty(); };
  }

  function renderClientsList() {
    const wrap = $('#rep_clients');
    if (!wrap) return;
    wrap.innerHTML = content.clients.items.map((name, i) => `
      <div class="simple-list-row">
        <input value="${escAttr(name)}" data-i="${i}">
        <button class="btn-remove" data-i="${i}">✕</button>
      </div>`).join('') + addCardBtn('Tambah Klien');
    $all('input[data-i]', wrap).forEach(el => el.oninput = () => { content.clients.items[+el.dataset.i] = el.value; markDirty(); });
    $all('.btn-remove', wrap).forEach(btn => btn.onclick = () => { content.clients.items.splice(+btn.dataset.i, 1); renderClientsList(); markDirty(); });
    $('.btn-add-card', wrap).onclick = () => { content.clients.items.push('Nama Perusahaan Baru'); renderClientsList(); markDirty(); };
  }

  // ---------- Save / Reset ----------
  let isSaving = false;
  $('#saveBtn').addEventListener('click', async () => {
    if (isSaving) return;
    isSaving = true;
    const btn = $('#saveBtn');
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (res.status === 401) {
        try { localStorage.setItem('gunex_admin_draft_backup', JSON.stringify(content)); } catch (e2) { /* abaikan jika storage penuh */ }
        showToast('Sesi Anda sudah habis. Perubahan disimpan sementara — silakan masuk lagi.', true);
        btn.disabled = false;
        btn.textContent = 'Simpan Perubahan';
        isSaving = false;
        setTimeout(() => location.reload(), 2200);
        return;
      }
      const data = await res.json();
      if (data.ok) {
        markSaved();
        showToast('Perubahan berhasil disimpan. Semua pengunjung sekarang melihat versi baru ini.');
      } else {
        showToast(data.error || 'Gagal menyimpan perubahan.', true);
      }
    } catch (e) {
      showToast('Tidak dapat terhubung ke server.', true);
    }
    btn.disabled = false;
    btn.textContent = 'Simpan Perubahan';
    isSaving = false;
  });

  async function doReset() {
    try {
      const res = await fetch('/api/content/reset', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        content = data.content;
        renderSection(currentSection);
        sendPreviewUpdate();
        showToast('Isi website dikembalikan ke awal.');
      } else {
        showToast(data.error || 'Gagal mengembalikan isi awal.', true);
      }
    } catch (e) {
      showToast('Tidak dapat terhubung ke server.', true);
    }
  }
  $('#cancelReset').addEventListener('click', () => $('#resetModal').classList.remove('show'));
  $('#confirmReset').addEventListener('click', () => { $('#resetModal').classList.remove('show'); doReset(); });

  // tombol reset di dalam panel akun (didelegasikan karena dirender ulang)
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'resetBtnInline') $('#resetModal').classList.add('show');
    if (e.target && e.target.id === 'changePassBtn') doChangePassword();
  });

  async function doChangePassword() {
    const cur = $('#curPass').value;
    const next = $('#newPass').value;
    const msg = $('#passMsg');
    msg.textContent = '';
    if (!cur || !next) { msg.style.color = '#c0392b'; msg.textContent = 'Isi kata sandi lama dan baru terlebih dahulu.'; return; }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: cur, newPassword: next })
      });
      const data = await res.json();
      if (data.ok) {
        msg.style.color = '#1e8e5a';
        msg.textContent = 'Kata sandi berhasil diganti.';
        $('#curPass').value = ''; $('#newPass').value = '';
      } else {
        msg.style.color = '#c0392b';
        msg.textContent = data.error || 'Gagal mengganti kata sandi.';
      }
    } catch (e) {
      msg.style.color = '#c0392b';
      msg.textContent = 'Tidak dapat terhubung ke server.';
    }
  }

  window.addEventListener('beforeunload', (e) => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  checkSession();
})();
