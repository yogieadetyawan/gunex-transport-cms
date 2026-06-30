(function () {
  const app = document.getElementById('app');

  function esc(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function nl2p(str) {
    return esc(str);
  }

  const FLEET_ICONS = [
    `<svg class="ficon" viewBox="0 0 80 80" fill="none"><rect x="6" y="28" width="40" height="26" rx="3" fill="#3f7fd6"/><path d="M46 28h16l10 12v14H46z" fill="#cfe0f5" stroke="#fff" stroke-width="1.5"/><circle cx="22" cy="58" r="7" fill="#152744" stroke="#cfe0f5" stroke-width="1.5"/><circle cx="60" cy="58" r="7" fill="#152744" stroke="#cfe0f5" stroke-width="1.5"/></svg>`,
    `<svg class="ficon" viewBox="0 0 80 80" fill="none"><rect x="2" y="28" width="52" height="26" rx="3" fill="#3f7fd6"/><path d="M54 28h14l10 12v14H54z" fill="#cfe0f5" stroke="#fff" stroke-width="1.5"/><circle cx="18" cy="58" r="7" fill="#152744" stroke="#cfe0f5" stroke-width="1.5"/><circle cx="66" cy="58" r="7" fill="#152744" stroke="#cfe0f5" stroke-width="1.5"/></svg>`,
    `<svg class="ficon" viewBox="0 0 80 80" fill="none"><rect x="2" y="30" width="50" height="22" fill="#3f7fd6"/><rect x="2" y="30" width="50" height="6" fill="#1d3d87" opacity=".5"/><path d="M52 28h16l10 14v12H52z" fill="#cfe0f5" stroke="#fff" stroke-width="1.5"/><circle cx="16" cy="56" r="8" fill="#152744" stroke="#cfe0f5" stroke-width="1.5"/><circle cx="66" cy="56" r="8" fill="#152744" stroke="#cfe0f5" stroke-width="1.5"/></svg>`,
    `<svg class="ficon" viewBox="0 0 80 80" fill="none"><rect x="2" y="26" width="50" height="26" fill="none" stroke="#cfe0f5" stroke-width="2"/><path d="M2 26h50" stroke="#3f7fd6" stroke-width="3"/><path d="M52 28h16l10 14v10H52z" fill="#cfe0f5" stroke="#fff" stroke-width="1.5"/><circle cx="16" cy="56" r="8" fill="#152744" stroke="#cfe0f5" stroke-width="1.5"/><circle cx="66" cy="56" r="8" fill="#152744" stroke="#cfe0f5" stroke-width="1.5"/></svg>`
  ];

  const SVC_ICONS = [
    `<svg class="svc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="7" width="13" height="10" rx="1"/><path d="M15 10h4l3 3v4h-7z"/><circle cx="6" cy="19" r="2"/><circle cx="17.5" cy="19" r="2"/></svg>`,
    `<svg class="svc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2v6"/><path d="M5 9h14l-1 11H6L5 9z"/><circle cx="12" cy="14" r="2.4"/></svg>`,
    `<svg class="svc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="14" rx="1"/><path d="M3 9h18"/><path d="M8 4v5"/></svg>`,
    `<svg class="svc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 11l18-7-7 18-3-7-8-4z"/></svg>`,
    `<svg class="svc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4h16v4H4z"/><path d="M4 12h16v8H4z"/><path d="M9 16h6"/></svg>`,
    `<svg class="svc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z"/></svg>`
  ];

  // Ikon DEFAULT untuk klien yang belum mengunggah logo perusahaannya -
  // siluet bangunan pabrik dengan cerobong asap (representasi umum untuk
  // "perusahaan/industri"), BUKAN ikon dokumen seperti sebelumnya.
  const CLIENT_DEFAULT_ICON = `<svg class="ci" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V11l5 3v-3l5 3V8l5 3v10z"/><path d="M16 8V4M16 4h2v3"/><path d="M3 21h18"/></svg>`;
  const PIN_SVG = `<svg class="pin-ic" viewBox="0 0 24 24"><path d="M12 23s8-8.1 8-13.3A8 8 0 1 0 4 9.7C4 14.9 12 23 12 23z" fill="#1d3d87" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="9.4" r="3" fill="#fff"/></svg>`;
  const PIN_OUTLINE = `<svg class="pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.4"/></svg>`;

  function renderHero(hero) {
    const stats = (hero.stats || []).map(s => `
      <div class="stat"><div class="num">${esc(s.num)}</div><div class="label">${esc(s.label)}</div></div>
    `).join('');
    return `
    <section class="hero" id="km00">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow">${esc(hero.eyebrow)}</div>
          <h1>${esc(hero.headline)} <span>${esc(hero.headlineAccent)}</span></h1>
          <p class="lead">${esc(hero.lead)}</p>
          <div class="hero-cta">
            <a href="#kontak" class="btn btn-primary">${esc(hero.ctaPrimary)}</a>
            <a href="#armada" class="btn btn-ghost">${esc(hero.ctaSecondary)}</a>
          </div>
        </div>
        <div class="stat-strip reveal">${stats}</div>
      </div>
    </section>`;
  }

  function renderAbout(about) {
    const paragraphs = (about.paragraphs || []).map(p => `<p>${esc(p)}</p>`).join('');
    const profile = (about.profile || []).map(item => `
      <li><span>${esc(item.label)}</span><span>${esc(item.value)}</span></li>
    `).join('');
    return `
    <section class="section section-light reveal" id="tentang">
      <div class="wrap">
        <div class="km-tag">${esc(about.kicker)}</div>
        <h2 class="headline">${esc(about.headline)}</h2>
        <p class="lede">${esc(about.lede)}</p>
        <div class="about-grid">
          <div class="about-text">${paragraphs}</div>
          <div class="about-panel">
            <h3>Profil Singkat</h3>
            <ul>${profile}</ul>
          </div>
        </div>
      </div>
    </section>`;
  }

  function renderServices(services) {
    const items = (services.items || []).map((item, i) => `
      <div class="svc-card">
        ${SVC_ICONS[i % SVC_ICONS.length]}
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.desc)}</p>
      </div>
    `).join('');
    return `
    <section class="section section-soft" id="layanan">
      <div class="wrap">
        <div class="km-tag">${esc(services.kicker)}</div>
        <h2 class="headline">${esc(services.headline)}</h2>
        <p class="lede">${esc(services.lede)}</p>
        <div class="svc-grid reveal">${items}</div>
      </div>
    </section>`;
  }

  function renderFleet(fleet) {
    const items = (fleet.items || []).map((item, i) => `
      <div class="fleet-card">
        ${FLEET_ICONS[i % FLEET_ICONS.length]}
        <div>
          <h3>${esc(item.name)}</h3>
          <p>${esc(item.desc)}</p>
          <span class="tag">${esc(item.tag)}</span>
        </div>
      </div>
    `).join('');
    return `
    <section class="section section-dark" id="armada">
      <div class="wrap">
        <div class="km-tag">${esc(fleet.kicker)}</div>
        <h2 class="headline">${esc(fleet.headline)}</h2>
        <p class="lede">${esc(fleet.lede)}</p>
        <div class="fleet-grid reveal">${items}</div>
        <div class="fleet-total">TOTAL ARMADA OPERASIONAL&nbsp; <b>${esc(fleet.totalUnit)}</b>&nbsp; UNIT KENDARAAN</div>
      </div>
    </section>`;
  }

  function renderGallery(gallery) {
    const images = gallery.images || [];
    if (images.length === 0) return ''; // tidak render section sama sekali jika belum ada foto diunggah
    const slides = images.map((url, i) => `
      <div class="gallery-slide${i === 0 ? ' active' : ''}" data-slide="${i}">
        <img src="${esc(url)}" alt="Dokumentasi armada ${i + 1}" loading="lazy">
      </div>
    `).join('');
    const dots = images.map((_, i) => `
      <button type="button" class="gallery-dot${i === 0 ? ' active' : ''}" data-dot="${i}" aria-label="Foto ke-${i + 1}"></button>
    `).join('');
    // Tombol navigasi & dot HANYA ditampilkan jika lebih dari 1 foto - dengan
    // 1 foto saja, galeri cukup tampil statis tanpa kontrol slideshow apapun.
    const controls = images.length > 1 ? `
      <button type="button" class="gallery-nav prev" aria-label="Foto sebelumnya">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button type="button" class="gallery-nav next" aria-label="Foto berikutnya">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      <div class="gallery-dots">${dots}</div>
    ` : '';
    return `
    <section class="section section-soft" id="galeri">
      <div class="wrap">
        <div class="km-tag">${esc(gallery.kicker)}</div>
        <h2 class="headline">${esc(gallery.headline)}</h2>
        <p class="lede">${esc(gallery.lede)}</p>
        <div class="gallery-frame reveal">
          <div class="gallery-track">${slides}</div>
          ${controls}
        </div>
      </div>
    </section>`;
  }

  function renderFlow(flow) {
    const steps = (flow.steps || []).map((s, i) => `
      <div class="flow-step">
        <div class="km">${String(i + 1).padStart(2, '0')}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.desc)}</p>
      </div>
    `).join('');
    return `
    <section class="section section-light" id="alur">
      <div class="wrap">
        <div class="km-tag">${esc(flow.kicker)}</div>
        <h2 class="headline">${esc(flow.headline)}</h2>
        <p class="lede">${esc(flow.lede)}</p>
        <div class="flow reveal">
          <div class="flow-line"></div>
          <div class="flow-steps">${steps}</div>
        </div>
      </div>
    </section>`;
  }

  function renderCoverage(coverage) {
    const list = (coverage.areas || []).map(a => `
      <div class="cov-item">
        ${PIN_OUTLINE}
        <div><h4>${esc(a.name)}</h4><span>${esc(a.desc)}</span></div>
      </div>
    `).join('');
    const pins = (coverage.areas || []).map(a => {
      const belowCls = a.labelPos === 'below' ? ' below' : '';
      return `<span class="mp${belowCls}" style="left:${a.mapX}%;top:${a.mapY}%">${PIN_SVG}<span class="lbl">${esc(a.name).toUpperCase()}</span></span>`;
    }).join('');
    return `
    <section class="section section-dark" id="wilayah">
      <div class="wrap">
        <div class="km-tag">${esc(coverage.kicker)}</div>
        <h2 class="headline">${esc(coverage.headline)}</h2>
        <p class="lede">${esc(coverage.lede)}</p>
        <div class="cov-wrap reveal">
          <div class="cov-list">${list}</div>
          <div class="cov-map">
            <div class="java-map">
              <img src="/assets/java-map.png" alt="Peta Pulau Jawa - wilayah layanan PT Gunex Transport Indonesia" width="768" height="263">
              ${pins}
            </div>
          </div>
        </div>
      </div>
    </section>`;
  }

  function renderClients(clients) {
    const items = (clients.items || []).map(item => {
      // Kompatibilitas data lama: items dulunya array of string (nama saja),
      // sekarang array of object {name, logoUrl}. Kedua bentuk ditangani di
      // sini supaya konten yang tersimpan SEBELUM fitur logo ditambahkan
      // tetap tampil benar tanpa perlu migrasi manual oleh admin.
      const name = typeof item === 'string' ? item : (item.name || '');
      const logoUrl = typeof item === 'string' ? '' : (item.logoUrl || '');
      const visual = logoUrl
        ? `<img class="ci-logo" src="${esc(logoUrl)}" alt="">`
        : CLIENT_DEFAULT_ICON;
      return `<div class="client-card">${visual}<span>${esc(name)}</span></div>`;
    }).join('');
    return `
    <section class="section section-light" id="klien">
      <div class="wrap">
        <div class="km-tag">${esc(clients.kicker)}</div>
        <h2 class="headline">${esc(clients.headline)}</h2>
        <p class="lede">${esc(clients.lede)}</p>
        <div class="client-strip"><div class="client-grid reveal">${items}</div></div>
      </div>
    </section>`;
  }

  function renderContact(contact) {
    return `
    <section class="section section-dark" id="kontak">
      <div class="wrap">
        <div class="km-tag">${esc(contact.kicker)}</div>
        <h2 class="headline">${esc(contact.headline)}</h2>
        <p class="lede">${esc(contact.lede)}</p>
        <div class="contact-wrap reveal">
          <div class="contact-info">
            <div class="contact-item">
              ${PIN_OUTLINE.replace('class="pin"', 'class="ic"')}
              <div><h4>Alamat Kantor</h4><p>${esc(contact.address)}</p></div>
            </div>
            <div class="contact-item">
              <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 5h4l2 5-2.5 1.5a11 11 0 0 0 5 5L13 14l5 2v4a2 2 0 0 1-2 2C9.5 22 2 14.5 2 7a2 2 0 0 1 1-2z"/></svg>
              <div><h4>Telepon / WhatsApp</h4><p>${esc(contact.phone)}</p></div>
            </div>
            <div class="contact-item">
              <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
              <div><h4>Email</h4><p>${esc(contact.email)}</p></div>
            </div>
            <div class="contact-item">
              <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
              <div><h4>Jam Operasional</h4><p>${esc(contact.hours)}</p></div>
            </div>
          </div>
          <form class="contact-form" id="contactForm">
            <div class="frow"><label>Nama Perusahaan</label><input type="text" id="cfCompany" placeholder="PT. Nama Perusahaan Anda" required></div>
            <div class="frow"><label>Nama Penanggung Jawab</label><input type="text" id="cfContactName" placeholder="Nama lengkap" required></div>
            <div class="frow"><label>Email / No. Telepon</label><input type="text" id="cfContactInfo" placeholder="email@perusahaan.com" required></div>
            <div class="frow"><label>Kebutuhan Armada</label>
              <select id="cfFleetNeed">
                <option>CDD Standard</option><option>CDD Long</option><option>Fuso Bak</option><option>Fuso Losbak</option><option>Belum yakin, perlu konsultasi</option>
              </select>
            </div>
            <div class="frow"><label>Detail Kebutuhan</label><textarea id="cfDetail" placeholder="Ceritakan rute, volume, dan frekuensi pengiriman yang dibutuhkan"></textarea></div>
            <div id="cfError" style="display:none;font-size:.82rem;color:#d44;margin-bottom:10px;"></div>
            <button type="submit" class="btn btn-primary" id="cfSubmitBtn" style="width:100%;justify-content:center;">Kirim Permintaan</button>
          </form>
        </div>
      </div>
    </section>`;
  }

  function render(content) {
    app.innerHTML = [
      renderHero(content.hero),
      renderAbout(content.about),
      renderServices(content.services),
      renderFleet(content.fleet),
      renderGallery(content.gallery || { images: [] }),
      renderFlow(content.flow),
      renderCoverage(content.coverage),
      renderClients(content.clients),
      renderContact(content.contact)
    ].join('\n');

    document.title = `${content.brand.companyName} — Mitra Logistik Darat B2B Sejak 2008`;
    const footerText = document.getElementById('footerText');
    if (footerText) footerText.textContent = content.footer.text;

    const form = document.getElementById('contactForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('cfSubmitBtn');
        const errBox = document.getElementById('cfError');
        errBox.style.display = 'none';

        const payload = {
          company: document.getElementById('cfCompany').value.trim(),
          contactName: document.getElementById('cfContactName').value.trim(),
          contactInfo: document.getElementById('cfContactInfo').value.trim(),
          fleetNeed: document.getElementById('cfFleetNeed').value,
          detail: document.getElementById('cfDetail').value.trim()
        };
        if (!payload.company || !payload.contactName || !payload.contactInfo) {
          errBox.textContent = 'Mohon lengkapi nama perusahaan, nama penanggung jawab, dan kontak.';
          errBox.style.display = 'block';
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Mengirim...';
        try {
          const res = await fetch('/api/contact-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.ok) {
            btn.textContent = 'Terkirim ✓';
            form.reset();
            setTimeout(() => { btn.textContent = 'Kirim Permintaan'; btn.disabled = false; }, 3000);
          } else {
            errBox.textContent = data.error || 'Gagal mengirim permintaan. Coba lagi sebentar.';
            errBox.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Kirim Permintaan';
          }
        } catch (err) {
          errBox.textContent = 'Tidak dapat terhubung ke server. Coba lagi sebentar.';
          errBox.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Kirim Permintaan';
        }
      });
    }

    initScrollAnimations();
    initGallery();
    addParallaxLayers();
    initParallax();
  }

  // ---------- Boot loader: layar pembuka singkat saat website pertama dibuka ----------
  const bootLoader = document.getElementById('bootLoader');
  const bootFill = document.getElementById('bootFill');
  function setBootProgress(pct) {
    if (bootFill) bootFill.style.width = pct + '%';
  }
  function hideBootLoader() {
    if (!bootLoader) {
      document.body.classList.add('page-ready');
      return;
    }
    setBootProgress(100);
    // beri sedikit waktu agar progres 100% sempat terlihat sebelum fade-out,
    // supaya transisinya terasa selesai dengan tuntas, bukan terpotong.
    setTimeout(() => {
      bootLoader.classList.add('boot-hide');
      document.body.classList.add('page-ready');
      setTimeout(() => { if (bootLoader && bootLoader.parentNode) bootLoader.remove(); }, 650);
    }, 220);
  }

  // ---------- Scroll reveal: section/kartu masuk halus saat pertama terlihat ----------
  let scrollObserver = null;
  function initScrollAnimations() {
    if (scrollObserver) scrollObserver.disconnect();
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const inIframe = window.self !== window.top;
    const targets = document.querySelectorAll('.reveal');
    if (reduceMotion || inIframe || !('IntersectionObserver' in window)) {
      // Di mode pratinjau admin, tampilkan langsung tanpa animasi scroll —
      // pratinjau harus mencerminkan tampilan akhir secara instan.
      targets.forEach(el => el.classList.add('in-view'));
      return;
    }
    scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          scrollObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(el => scrollObserver.observe(el));
  }

  // ---------- Parallax: layer dekoratif halus bergerak beda kecepatan saat scroll ----------
  // addParallaxLayers() menyisipkan elemen dekoratif (orb blur + garis
  // diagonal tipis) ke SETIAP <section> (termasuk Hero) secara otomatis -
  // satu titik sentral, supaya tidak perlu menambah markup manual ke 9
  // fungsi renderXxx() yang berbeda (rawan lupa/tidak konsisten). Dipanggil
  // ulang setiap render() selesai, karena app.innerHTML dibangun dari nol -
  // section lama beserta layer lamanya sudah tidak ada lagi di DOM.
  function addParallaxLayers() {
    const sections = document.querySelectorAll('.hero, .section');
    sections.forEach((section, i) => {
      // Dua orb (besar di kanan-atas, lebih kecil di kiri-bawah) + satu blok
      // garis diagonal yang menutupi area lebih luas - posisi diselang-seling
      // (genap/ganjil) supaya antar section yang berdekatan tidak terlihat
      // berulang dengan pola yang persis sama.
      const flip = i % 2 === 0;
      const orbA = document.createElement('div');
      orbA.className = 'parallax-layer parallax-orb';
      orbA.dataset.parallaxSpeed = '0.15';
      orbA.style.cssText = flip
        ? 'width:420px;height:420px;top:-120px;right:-100px;'
        : 'width:420px;height:420px;top:-120px;left:-100px;';
      section.appendChild(orbA);

      const orbB = document.createElement('div');
      orbB.className = 'parallax-layer parallax-orb';
      orbB.dataset.parallaxSpeed = '0.08';
      orbB.style.cssText = flip
        ? 'width:260px;height:260px;bottom:-80px;left:-60px;'
        : 'width:260px;height:260px;bottom:-80px;right:-60px;';
      section.appendChild(orbB);

      const lines = document.createElement('div');
      lines.className = 'parallax-layer parallax-line';
      lines.dataset.parallaxSpeed = '0.05';
      lines.style.cssText = 'width:60%;height:140%;top:-20%;' + (flip ? 'right:0;' : 'left:0;');
      section.appendChild(lines);
    });
  }

  // initParallax() menggerakkan seluruh layer yang sudah disisipkan di atas,
  // setiap layer bergerak vertikal sebesar (jarak section dari tengah
  // viewport) x (kecepatannya sendiri, lihat data-parallax-speed) - layer
  // dengan kecepatan lebih kecil bergerak lebih lambat dari konten normal,
  // menciptakan kesan KEDALAMAN antar lapisan (efek parallax klasik), TANPA
  // memakai background-attachment:fixed yang terkenal bermasalah/tidak
  // berfungsi di iOS Safari - pendekatan transform:translateY ini bekerja
  // konsisten di semua browser modern termasuk mobile.
  let parallaxLayers = [];
  let parallaxTicking = false;
  function updateParallax() {
    const viewportCenter = window.innerHeight / 2;
    parallaxLayers.forEach(({ el, speed }) => {
      const rect = el.parentElement.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const distanceFromCenter = sectionCenter - viewportCenter;
      el.style.transform = `translateY(${distanceFromCenter * speed}px)`;
    });
    parallaxTicking = false;
  }
  function onParallaxScroll() {
    if (parallaxTicking) return;
    parallaxTicking = true;
    requestAnimationFrame(updateParallax);
  }
  function initParallax() {
    window.removeEventListener('scroll', onParallaxScroll);
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const inIframe = window.self !== window.top;
    // Dimatikan total di mode pratinjau admin (iframe) dan saat pengunjung
    // meminta gerakan dikurangi - konsisten dengan initScrollAnimations().
    if (reduceMotion || inIframe) return;
    parallaxLayers = Array.from(document.querySelectorAll('.parallax-layer')).map(el => ({
      el, speed: parseFloat(el.dataset.parallaxSpeed) || 0.1
    }));
    if (parallaxLayers.length === 0) return;
    updateParallax(); // posisi awal langsung benar, tidak menunggu scroll pertama
    window.addEventListener('scroll', onParallaxScroll, { passive: true });
  }

  // ---------- Header: tampilan halus saat halaman mulai di-scroll ----------
  function initHeaderScrollState() {
    const header = document.querySelector('header');
    if (!header) return;
    const update = () => {
      header.classList.toggle('scrolled', window.scrollY > 12);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }
  initHeaderScrollState();

  // ---------- Hamburger menu: navigasi mobile/tablet (di bawah 820px) ----------
  // Sebelumnya layar sempit sama sekali tidak punya cara mengakses menu
  // Tentang/Layanan/Armada/dst selain men-scroll manual sepanjang halaman.
  function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const closeBtn = document.getElementById('navClose');
    const panel = document.getElementById('mobileNav');
    const overlay = document.getElementById('navOverlay');
    if (!toggle || !panel || !overlay) return;

    function openNav() {
      panel.classList.add('open');
      overlay.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeNav() {
      panel.classList.remove('open');
      overlay.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', openNav);
    closeBtn.addEventListener('click', closeNav);
    overlay.addEventListener('click', closeNav);
    // Menutup otomatis saat salah satu link di panel diklik, supaya smooth
    // scroll ke section tujuan tidak terhalang panel yang masih terbuka.
    panel.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
    // Jika layar diperbesar melewati breakpoint desktop saat panel masih
    // terbuka (misal rotasi tablet), tutup otomatis supaya tidak nyangkut.
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 820) closeNav();
    });
  }
  initMobileNav();

  // ---------- Galeri/slideshow Armada: navigasi panah, dot, auto-play, swipe ----------
  // Dipanggil ulang setiap kali render() selesai (lihat init()), karena
  // app.innerHTML dibangun ulang dari nol setiap render - elemen galeri lama
  // (jika ada) sudah tidak ada lagi di DOM, sehingga listener juga harus
  // dipasang ulang dari awal. Tidak menimbulkan listener menumpuk karena
  // elemen lamanya sudah benar-benar dibuang oleh innerHTML sebelumnya.
  let galleryAutoplayTimer = null;
  function initGallery() {
    const frame = document.querySelector('.gallery-frame');
    if (!frame) return;
    const slides = Array.from(frame.querySelectorAll('.gallery-slide'));
    const dots = Array.from(frame.querySelectorAll('.gallery-dot'));
    const prevBtn = frame.querySelector('.gallery-nav.prev');
    const nextBtn = frame.querySelector('.gallery-nav.next');
    if (slides.length <= 1) return; // statis, tidak perlu logic apapun

    let current = 0;
    let slideCleanupTimer = null;
    // goTo() menambahkan kelas arah (slide-in-left/slide-in-right) pada slide
    // yang BARU AKTIF, dan slide-out-left/slide-out-right pada slide yang
    // baru saja DITINGGALKAN - sehingga transisi terasa seperti bergeser ke
    // arah yang sesuai (mengikuti tombol prev/next yang ditekan), bukan
    // sekadar fade datar di tempat. PENTING: kelas slide-in-* HARUS dilepas
    // dari slide aktif setelah transisi selesai (lewat setTimeout di bawah),
    // karena .slide-in-right{transform:translateX(28px)} punya spesifisitas
    // CSS yang SAMA dengan .active{transform:translateX(0)} - tanpa dilepas,
    // urutan deklarasi di file CSS yang menentukan pemenangnya, dan transform
    // slide jadi tertahan permanen di posisi pergeseran awal (bug nyata yang
    // sempat lolos sebelum ditemukan lewat pemeriksaan computed style).
    function goTo(idx, direction) {
      const prevIdx = current;
      current = (idx + slides.length) % slides.length;
      if (prevIdx === current) return;
      direction = direction || (current > prevIdx ? 'next' : 'prev');

      const outgoing = slides[prevIdx];
      const incoming = slides[current];
      clearTimeout(slideCleanupTimer);
      slides.forEach(s => s.classList.remove('slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right'));

      incoming.classList.add('active', direction === 'next' ? 'slide-in-right' : 'slide-in-left');
      outgoing.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');
      // Beri jeda satu frame sebelum melepas 'active' dari slide lama, supaya
      // browser sempat mendaftarkan kelas slide-out sebelum opacity berubah -
      // tanpa ini transisi keluarnya langsung terpotong tanpa animasi.
      requestAnimationFrame(() => { outgoing.classList.remove('active'); });

      // Setelah durasi transisi CSS selesai (.55s, beri sedikit margin jadi
      // 600ms), lepas kelas slide-in-* dari slide yang sekarang aktif supaya
      // hanya .active{transform:translateX(0)} yang berlaku - slide kembali
      // diam tepat di tengah, siap untuk transisi berikutnya kapan pun.
      slideCleanupTimer = setTimeout(() => {
        incoming.classList.remove('slide-in-left', 'slide-in-right');
      }, 600);

      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }
    function next() { goTo(current + 1, 'next'); }
    function prev() { goTo(current - 1, 'prev'); }

    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });
    dots.forEach(d => d.addEventListener('click', () => { goTo(parseInt(d.dataset.dot, 10)); restartAutoplay(); }));

    // Dukungan swipe geser jari di perangkat sentuh (mobile/tablet).
    let touchStartX = null;
    frame.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    frame.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) { dx > 0 ? prev() : next(); restartAutoplay(); }
      touchStartX = null;
    }, { passive: true });

    // Auto-play pelan (6 detik/slide), berhenti sementara saat pointer di atas
    // galeri supaya tidak berpindah sendiri ketika pengunjung sedang melihat
    // detail satu foto, dan dihormati prefers-reduced-motion.
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function restartAutoplay() {
      clearInterval(galleryAutoplayTimer);
      if (reduceMotion) return;
      galleryAutoplayTimer = setInterval(next, 6000);
    }
    frame.addEventListener('mouseenter', () => clearInterval(galleryAutoplayTimer));
    frame.addEventListener('mouseleave', restartAutoplay);
    restartAutoplay();
  }

  // ---------- Mode preview: dengarkan pesan dari admin panel ----------
  // Jika halaman ini dibuka di dalam iframe oleh /admin, admin.js akan mengirim
  // konten terbaru lewat postMessage setiap kali admin mengetik, supaya pratinjau
  // berubah langsung tanpa perlu reload halaman atau panggil API berulang.
  let isPreviewMode = false;
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'GUNEX_PREVIEW_UPDATE') return;
    isPreviewMode = true;
    try {
      render(e.data.content);
      // beri tahu parent tinggi konten saat ini supaya iframe bisa menyesuaikan
      requestAnimationFrame(() => {
        const h = document.body.scrollHeight;
        window.parent.postMessage({ type: 'GUNEX_PREVIEW_HEIGHT', height: h }, '*');
      });
    } catch (err) {
      // diamkan; render ulang berikutnya akan mencoba lagi
    }
  });

  async function init() {
    // Jika halaman ini dimuat di dalam iframe (mode pratinjau admin), boot loader
    // langsung disingkirkan tanpa animasi — pratinjau harus terasa instan, bukan
    // menunggu layar pembuka setiap kali admin mengetik.
    const inIframe = window.self !== window.top;
    if (inIframe && bootLoader) {
      bootLoader.remove();
      document.body.classList.add('page-ready');
    } else {
      setBootProgress(35);
    }

    try {
      const res = await fetch('/api/content');
      if (!inIframe) setBootProgress(75);
      const data = await res.json();
      if (data.ok) {
        render(data.content);
        requestAnimationFrame(() => {
          const h = document.body.scrollHeight;
          window.parent.postMessage({ type: 'GUNEX_PREVIEW_HEIGHT', height: h }, '*');
        });
        // Catat kunjungan HANYA untuk pemuatan halaman publik sungguhan -
        // bukan saat dimuat di iframe pratinjau admin (yang akan terpicu
        // berulang kali setiap admin mengetik, dan bukan kunjungan pengunjung
        // sesungguhnya). Kegagalan mencatat tidak ditampilkan ke pengunjung
        // sama sekali - statistik adalah hal sekunder, bukan boleh mengganggu
        // pengalaman memuat halaman.
        if (!inIframe) {
          fetch('/api/stats/visit', { method: 'POST' }).catch(() => {});
        }
      } else {
        app.innerHTML = '<div class="wrap" style="padding:140px 0;text-align:center;color:#5f7290;">Gagal memuat konten. Silakan refresh halaman.</div>';
      }
    } catch (e) {
      app.innerHTML = '<div class="wrap" style="padding:140px 0;text-align:center;color:#5f7290;">Tidak dapat terhubung ke server.</div>';
    }

    if (!inIframe) hideBootLoader();
  }

  init();
})();
