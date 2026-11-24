/* APK ZONE – data-driven 3D site. Apps apps.json se aati hain. */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mb = b => b ? (b / 1048576).toFixed(1) + ' MB' : '—';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let SITE = {}, APPS = [];

function repoInfo() {
  let { user, repo } = SITE.github || {};
  const h = location.hostname;
  if ((!user || !repo) && h.endsWith('.github.io')) {
    user = user || h.split('.')[0];
    repo = repo || location.pathname.split('/')[1] || h;
  }
  return { user, repo };
}
function dlUrl(a) {
  const { user, repo } = repoInfo();
  if (!user || !repo) return null;
  return `https://github.com/${user}/${repo}/releases/download/${encodeURIComponent(a.releaseTag)}/${encodeURIComponent(a.file)}`;
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.append(t); setTimeout(() => t.remove(), 4500);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-dl]'); if (!b) return;
  e.preventDefault();
  const a = APPS.find(x => x.slug === b.dataset.dl);
  const u = a && dlUrl(a);
  if (u) location.href = u; else toast('Download link tab chalega jab site GitHub Pages par ho.');
});

/* ---- 3D helpers ---- */
function tilt(root = document) {
  if (reduce) return;
  root.querySelectorAll('.card:not([data-t]),.d-logo:not([data-t])').forEach(el => {
    el.dataset.t = 1;
    const tgt = el.classList.contains('d-logo') ? $('.in3d', el) : el;
    el.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      tgt.style.setProperty('--cy', ((x - .5) * 26) + 'deg');
      tgt.style.setProperty('--cx', ((.5 - y) * 22) + 'deg');
      el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { tgt.style.setProperty('--cx', '0deg'); tgt.style.setProperty('--cy', '0deg'); });
  });
}
let io;
function reveal(root = document, sel = '.grid>*,.feat>*,section .box,ol.steps li,.info>div,.sec-head') {
  if (!('IntersectionObserver' in window)) return;
  io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  root.querySelectorAll(sel).forEach((el, i) => {
    if (el.classList.contains('rv')) return;
    el.classList.add('rv'); el.style.transitionDelay = (i % 6) * 70 + 'ms'; io.observe(el);
  });
}
function initRig() {
  const rig = $('#rig'), st = $('#stage'); if (!rig) return;
  let tx = -4, ty = -16, cx = tx, cy = ty, active = false, gyro = false, vis = true, t0 = performance.now(), timer;
  st.addEventListener('pointermove', e => {
    const r = st.getBoundingClientRect();
    ty = ((e.clientX - r.left) / r.width - .5) * 70; tx = -((e.clientY - r.top) / r.height - .5) * 34;
    active = true; clearTimeout(timer); timer = setTimeout(() => active = false, 2500);
  });
  addEventListener('deviceorientation', e => {
    if (e.gamma == null) return; gyro = true;
    ty = Math.max(-35, Math.min(35, e.gamma)) * 1.3; tx = -Math.max(-20, Math.min(20, (e.beta || 45) - 50)) * .7;
  });
  new IntersectionObserver(es => vis = es[0].isIntersecting).observe(st);
  (function loop(now) {
    if (vis && !reduce) {
      if (!active && !gyro) { const t = (now - t0) / 1000; ty = Math.sin(t * .7) * 26 - 8; tx = Math.cos(t * .5) * 8 - 3; }
      cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      rig.style.setProperty('--rx', cx.toFixed(2) + 'deg'); rig.style.setProperty('--ry', cy.toFixed(2) + 'deg');
    }
    requestAnimationFrame(loop);
  })(t0);
}

function layout(active) {
  const name = SITE.name || 'APK ZONE';
  const [w1, ...w2] = name.split(' ');
  document.body.insertAdjacentHTML('afterbegin', `
  <div class="bgfx"><i></i></div>
  <header class="nav"><div class="wrap nav-in">
    <a class="brand" href="index.html"><img src="logo.svg" alt="${esc(name)} logo"><span>${esc(w1)} <b>${esc(w2.join(' '))}</b></span></a>
    <button class="icon-btn burger" id="burger" aria-label="Menu" aria-expanded="false">☰</button>
    <nav class="links" id="links">
      <a href="index.html" class="${active==='home'?'active':''}">🏠 Home</a>
      <a href="index.html#apps">📱 Top Apps</a>
      <a href="index.html#install">✅ Install</a>
      <a href="index.html#about">ℹ️ About</a>
      <a href="index.html#contact">💬 Contact</a>
      <button class="icon-btn" id="theme" aria-label="Theme">🌙</button>
    </nav></div></header>`);
  document.body.insertAdjacentHTML('beforeend', `
  <footer><div class="wrap f-in"><div>© ${new Date().getFullYear()} ${esc(name)} — ${esc(SITE.tagline||'')}</div>
  <div>100% Free • 100% Secure • 100% Offline</div></div></footer>`);
  const root = document.documentElement;
  const saved = (() => { try { return localStorage.getItem('theme'); } catch { return null; } })();
  if (saved) root.dataset.theme = saved;
  const tb = $('#theme'); const setIcon = () => tb.innerHTML = root.dataset.theme === 'light' ? '☀️<span class="lb"> Light mode</span>' : '🌙<span class="lb"> Dark mode</span>';
  setIcon();
  tb.onclick = () => { root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light'; try { localStorage.setItem('theme', root.dataset.theme); } catch {} setIcon(); };
  const nav = $('#links'), bg = $('#burger');
  bg.onclick = () => { const o = nav.classList.toggle('open'); bg.textContent = o ? '✕' : '☰'; bg.setAttribute('aria-expanded', o); };
  nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); bg.textContent = '☰'; } });
}

const cardHTML = a => `
  <article class="card">
    <a class="lg" href="app.html?app=${encodeURIComponent(a.slug)}"><img src="${esc(a.logo)}" alt="${esc(a.name)} logo" loading="lazy" width="92" height="92"></a>
    <h3><a href="app.html?app=${encodeURIComponent(a.slug)}">${esc(a.name)}</a></h3>
    <span class="cat">${esc(a.category)}</span>
    <div class="meta">v${esc(a.version)} • ${mb(a.sizeBytes)}</div>
    <button class="dl" data-dl="${esc(a.slug)}">⬇ Download</button>
  </article>`;

function renderHome() {
  const g = $('#grid');
  const draw = (q, first) => {
    q = (q || '').trim().toLowerCase();
    const list = APPS.filter(a => !q || (a.name + ' ' + a.category + ' ' + a.tagline).toLowerCase().includes(q));
    g.innerHTML = list.length ? list.map(cardHTML).join('') : '<div class="empty" style="grid-column:1/-1">Koi app nahi mili. Dosra naam try karein.</div>';
    tilt(g); if (first) reveal(g); else g.querySelectorAll('.card').forEach(c => c.classList.add('rv', 'in'));
  };
  draw('', true);
  $('#q').addEventListener('input', e => draw(e.target.value));
  $('#sform').addEventListener('submit', e => { e.preventDefault(); draw($('#q').value); $('#apps').scrollIntoView(); });

  // 3D phone
  const layers = Array.from({ length: 12 }, (_, i) => `<i class="pl" style="--z:${-(i + 1) * 2}px"></i>`).join('');
  const icons = APPS.map(a => `<div><img src="${esc(a.logo)}" alt="">${esc(a.name.split(' ')[0])}</div>`).join('');
  $('#phone').innerHTML = `${layers}<div class="pf"><div class="screen"><div class="sb"><span>9:41</span><span>📶 🔋</span></div>
    <div class="mini-search">🔍 Search apps…</div><div class="icons">${icons}</div><div class="dock">⬇ APK ZONE</div></div></div>`;
  const n = APPS.length;
  $('#orbit').innerHTML = `<div class="ringline"></div><div class="ringline r2"></div><div class="spin">` +
    APPS.map((a, i) => `<div class="it" style="--a:${Math.round(360 / n * i)}deg;--na:-${Math.round(360 / n * i)}deg"><img src="${esc(a.logo)}" alt="${esc(a.name)}"></div>`).join('') + `</div>`;
  initRig();

  const c = SITE.contact || {};
  const links = [];
  if (c.whatsapp) links.push(`<a class="dl big" href="https://wa.me/${esc(c.whatsapp.replace(/\D/g,''))}">💬 WhatsApp</a>`);
  if (c.email) links.push(`<a class="dl big" href="mailto:${esc(c.email)}">✉️ Email</a>`);
  $('#contact-links').innerHTML = links.join(' ') || '<p class="note">Contact details site.json mein add karein.</p>';
  $('#contact-note').textContent = c.note || '';
  reveal(document, 'section .box,ol.steps li,.feat>*,.sec-head');
}

function renderApp() {
  const slug = new URLSearchParams(location.search).get('app');
  const a = APPS.find(x => x.slug === slug);
  const m = $('#main');
  if (!a) { m.innerHTML = '<div class="wrap"><div class="empty" style="margin-top:40px">App nahi mili. <a href="index.html" style="color:var(--cyan)">Home par wapas jayein</a></div></div>'; return; }
  document.title = `${a.name} APK Download – ${SITE.name}`;
  const others = APPS.filter(x => x.slug !== a.slug);
  m.innerHTML = `<div class="wrap">
    <div class="crumb"><a href="index.html">Home</a> › ${esc(a.name)}</div>
    <div class="d-head"><div class="d-logo"><span class="halo"></span><span class="halo h2"></span><div class="in3d"><img src="${esc(a.logo)}" alt="${esc(a.name)} logo"></div></div>
      <div><h1>${esc(a.name)}</h1><p class="tl">${esc(a.tagline)}</p>
      <div class="row"><button class="dl big" data-dl="${esc(a.slug)}">⬇ Download APK (${mb(a.sizeBytes)})</button>
      <span class="note">v${esc(a.version)} • Android ${esc(a.minAndroid)}+</span></div></div></div>
    <section><div class="info">
      <div><small>Version</small><b>${esc(a.version)}</b></div><div><small>Size</small><b>${mb(a.sizeBytes)}</b></div>
      <div><small>Android</small><b>${esc(a.minAndroid)}+</b></div><div><small>Category</small><b>${esc(a.category)}</b></div>
      <div><small>Updated</small><b>${esc(a.updated)}</b></div></div></section>
    <section><div class="sec-head"><div><h2>Screenshots</h2></div></div>
      ${a.screenshots?.length ? `<div class="shots">${a.screenshots.map(s => `<img src="${esc(s)}" alt="${esc(a.name)} screenshot" loading="lazy">`).join('')}</div>` : '<div class="empty">Screenshots jald add kiye jayenge.</div>'}</section>
    <section class="two"><div class="box"><h3>About ${esc(a.name)}</h3>${a.description.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      <div class="box"><h3>Features</h3><ul>${a.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      <h3 style="margin-top:18px">Security</h3><p class="note">SHA-256:</p><p class="hash">${esc(a.sha256 || '—')}</p><p class="note" style="margin-top:6px">Package: ${esc(a.package)}</p></div></section>
    <section><div class="sec-head"><div><h2>Install kaise karein</h2></div></div>${installSteps()}</section>
    <section><div class="sec-head"><div><h2>Aur Apps</h2></div><a class="more" href="index.html#apps">View All →</a></div>
      <div class="grid">${others.slice(0, 4).map(cardHTML).join('')}</div></section></div>
    <div class="lightbox" id="lb"><img alt=""></div>`;
  const lb = $('#lb');
  m.addEventListener('click', e => { const i = e.target.closest('.shots img'); if (i) { $('img', lb).src = i.src; lb.classList.add('on'); } });
  lb.onclick = () => lb.classList.remove('on');
  tilt(m); reveal(m);
}
const installSteps = () => `<ol class="steps">
  <li>“Download” button dabayein, APK file download ho jayegi.</li>
  <li>File kholein. Agar phone puchay to <b>Settings → Install unknown apps</b> allow karein.</li>
  <li><b>Install</b> dabayein aur kaam mukammal hone par app kholein.</li></ol>`;

(async () => {
  const page = document.body.dataset.page;
  try {
    [SITE, { apps: APPS }] = await Promise.all([fetch('site.json').then(r => r.json()), fetch('apps.json').then(r => r.json())]);
  } catch { document.body.innerHTML = '<p style="padding:30px;color:#fff">Data load nahi hua. Site ko GitHub Pages ya local server par kholein.</p>'; return; }
  layout(page);
  if (page === 'home') { $('#steps').innerHTML = installSteps(); renderHome(); } else renderApp();
})();
