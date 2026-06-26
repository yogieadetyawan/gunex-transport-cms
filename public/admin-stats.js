(function () {
  function $(sel) { return document.querySelector(sel); }

  $('#logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin';
  });

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  // Menghasilkan daftar 14 tanggal terakhir (format YYYY-MM-DD), urut dari
  // yang paling lama ke yang paling baru, supaya grafik batang terbaca
  // secara kronologis dari kiri ke kanan.
  function lastNDates(n) {
    const out = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }

  function formatDateLabel(iso) {
    const [y, m, d] = iso.split('-');
    const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    return `${d} ${bulan[parseInt(m, 10) - 1]}`;
  }

  function render(stats) {
    const byDate = stats.byDate || {};
    const today = todayStr();
    const todayCount = byDate[today] || 0;

    // 7 hari terakhir TERMASUK hari ini.
    const last7 = lastNDates(7);
    const totalLast7 = last7.reduce((sum, d) => sum + (byDate[d] || 0), 0);

    const last14 = lastNDates(14);
    const maxVal = Math.max(1, ...last14.map(d => byDate[d] || 0));

    const bars = last14.map(d => {
      const val = byDate[d] || 0;
      const heightPct = Math.max(2, Math.round((val / maxVal) * 100));
      return `
        <div class="bar-col">
          <div class="bar-val">${val}</div>
          <div class="bar" style="height:${heightPct}%"></div>
          <div class="bar-date">${formatDateLabel(d)}</div>
        </div>`;
    }).join('');

    $('#statsMain').innerHTML = `
      <div class="stat-cards">
        <div class="stat-card accent-purple">
          <div class="num">${todayCount}</div>
          <div class="lbl">Pengunjung Hari Ini</div>
        </div>
        <div class="stat-card accent-purple">
          <div class="num">${totalLast7}</div>
          <div class="lbl">7 Hari Terakhir</div>
        </div>
        <div class="stat-card accent-purple">
          <div class="num">${stats.totalAllTime || 0}</div>
          <div class="lbl">Total Sepanjang Waktu</div>
        </div>
      </div>

      <div class="chart-card">
        <h3>Kunjungan 14 Hari Terakhir</h3>
        <div class="sub">Setiap kali halaman utama website dibuka dihitung satu kunjungan. Kunjungan dari bot/crawler mesin pencari tidak dihitung.</div>
        <div class="bar-chart">${bars}</div>
      </div>
    `;
  }

  async function init() {
    try {
      const res = await fetch('/api/stats');
      if (res.status === 401) { window.location.href = '/admin'; return; }
      const data = await res.json();
      if (data.ok) {
        render(data.stats);
      } else {
        $('#statsMain').innerHTML = '<div class="empty-note">Gagal memuat statistik.</div>';
      }
    } catch (e) {
      $('#statsMain').innerHTML = '<div class="empty-note">Tidak dapat terhubung ke server.</div>';
    }
  }

  init();
})();
