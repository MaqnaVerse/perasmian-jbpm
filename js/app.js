/* =========================================================
   BOMBA 50 · App logic (Futuristic HUD)
   ========================================================= */
(() => {
  'use strict';
  const C = window.BOMBA_CONFIG || {};
  const PASS = String(C.password || '2026');
  const LEN = Number(C.maxLength || PASS.length);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------------- Screen router ---------------- */
  const screens = { login: $('#screen-login'), success: $('#screen-success'), main: $('#screen-main'), launch: $('#screen-launch') };
  let current = 'login';
  function show(name) {
    Object.entries(screens).forEach(([k, el]) => el.classList.toggle('active', k === name));
    document.body.classList.toggle('in-main', name === 'main');
    document.body.classList.toggle('in-launch', name === 'launch');
    current = name;
  }

  /* ---------------- Sound (enjin futuristik dalam sfx.js) ---------------- */
  let actx = null, S = null;
  function audio() {
    if (!C.sound || !window.BombaSFX) return null;
    try {
      if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); S = window.BombaSFX(actx, { volume: C.volume }); }
      if (actx.state === 'suspended') actx.resume();
      return S;
    } catch (_) { return null; }
  }
  const play = (name, ...args) => { const s = audio(); if (s) try { return s[name](...args); } catch (_) {} };
  const sfx = {
    key: () => play('key'),
    tick: () => play('tick'),
    del: () => play('del'),
    err: () => play('err'),
    verify: (d) => play('verify', undefined, d),
    holo: () => play('holoIn'),
    lock: () => play('lock'),
  };
  let seqSound = null;
  const F = C.fifty || {};
  const vibrate = (p) => navigator.vibrate && navigator.vibrate(p);

  /* ---------------- Fullscreen + Wake Lock ---------------- */
  let fsTried = false;
  async function goFullscreen() {
    if (fsTried || !C.autoFullscreen) return;
    fsTried = true;
    const el = document.documentElement;
    try { await (el.requestFullscreen || el.webkitRequestFullscreen).call(el); } catch (_) {}
  }
  async function keepAwake() {
    try { if ('wakeLock' in navigator) await navigator.wakeLock.request('screen'); } catch (_) {}
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') keepAwake(); });

  /* ---------------- Emblem ticks ---------------- */
  (function buildTicks() {
    const g = $('.emblem .ticks'); if (!g) return;
    let html = '';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, long = i % 5 === 0;
      const r1 = 63, r2 = long ? 58 : 60.5;
      html += `<line x1="${80 + Math.cos(a) * r1}" y1="${80 + Math.sin(a) * r1}" x2="${80 + Math.cos(a) * r2}" y2="${80 + Math.sin(a) * r2}" stroke="${long ? '#22e6ff' : 'rgba(34,230,255,.35)'}" stroke-width="${long ? 1.5 : 1}"/>`;
    }
    g.innerHTML = html;
  })();

  /* ---------------- PIN / Keypad ---------------- */
  $('#pinSlots').innerHTML = '<div class="slot"></div>'.repeat(LEN);   // bilangan kotak ikut panjang kata laluan
  const slots = $$('.slot');
  const pinWrap = $('#pinWrap');
  const status = $('#pinStatus');
  const meter = $('#pinMeter');
  const keypad = $('#keypad');
  let pin = '';
  let busy = false;

  // Kesan "decode": nombor rawak berpusing sekejap, kemudian kunci pada digit sebenar
  function finalize(slot) {
    if (slot._iv) { clearInterval(slot._iv); slot._iv = null; }
    slot.classList.remove('decoding');
    if (slot._digit != null) slot.innerHTML = `<span class="digit">${slot._digit}</span>`;
  }
  function decode(slot, digit) {
    finalize(slot);
    slot._digit = digit;
    slot.classList.add('decoding');
    const end = performance.now() + 200;
    slot._iv = setInterval(() => {
      if (performance.now() >= end) return finalize(slot);
      slot.textContent = Math.floor(Math.random() * 10);
      sfx.tick();
    }, 32);
  }

  function renderPin(newIndex = -1) {
    slots.forEach((s, i) => {
      const filled = i < pin.length;
      s.classList.toggle('filled', filled);
      s.classList.toggle('current', i === pin.length && !busy);
      if (i === newIndex) decode(s, pin[i]);
      else if (!filled) { if (s._iv) clearInterval(s._iv); s._iv = null; s._digit = null; s.classList.remove('decoding'); s.textContent = ''; }
    });
    meter.style.width = (pin.length / LEN) * 100 + '%';
  }

  function setStatus(text, cls = '') {
    status.className = 'pin-status ' + cls;
    status.textContent = text;
  }

  // Kesan visual tekan: kekunci menyala, cincin keluar, kad berdenyut, digit terbang ke kotak
  const card = $('.login-card');
  function pressFx(btn, k) {
    if (!btn) return;
    btn.classList.remove('lit'); void btn.offsetWidth; btn.classList.add('lit');
    card.classList.remove('hit'); void card.offsetWidth; card.classList.add('hit');
    const kr = btn.getBoundingClientRect(), pr = keypad.getBoundingClientRect();
    const ring = document.createElement('i');
    ring.className = 'kp-burst' + (/^\d$/.test(k) ? '' : ' gold');
    const s = Math.max(kr.width, kr.height);
    ring.style.cssText = `--s:${s}px;--x:${kr.left - pr.left + kr.width / 2}px;--y:${kr.top - pr.top + kr.height / 2}px`;
    keypad.appendChild(ring);
    setTimeout(() => ring.remove(), 600);
  }
  function flyDigit(btn, digit, slot) {
    if (!btn || !slot || !slot.animate) return;
    const a = btn.getBoundingClientRect(), b = slot.getBoundingClientRect();
    const f = document.createElement('span');
    f.className = 'kp-fly'; f.textContent = digit;
    f.style.setProperty('--fs', getComputedStyle(btn).fontSize);
    document.body.appendChild(f);
    const fw = f.offsetWidth, fh = f.offsetHeight;
    const x0 = a.left + a.width / 2 - fw / 2, y0 = a.top + a.height / 2 - fh / 2;
    const x1 = b.left + b.width / 2 - fw / 2, y1 = b.top + b.height / 2 - fh / 2;
    f.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 },
      { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 30}px) scale(1.25)`, opacity: 1, offset: .45 },
      { transform: `translate(${x1}px, ${y1}px) scale(.8)`, opacity: .2 },
    ], { duration: 260, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = () => {
      f.remove();
      slot.classList.remove('land'); void slot.offsetWidth; slot.classList.add('land');
    };
  }

  function press(k, btn) {
    if (busy || current !== 'login') return;
    pressFx(btn, k);
    if (/^\d$/.test(k) && pin.length < LEN) flyDigit(btn, k, slots[pin.length]);
    goFullscreen(); keepAwake();
    let added = -1;
    if (k === 'back') { pin = pin.slice(0, -1); sfx.del(); }
    else if (k === 'clear') { pin = ''; sfx.del(); }
    else if (/^\d$/.test(k) && pin.length < LEN) { pin += k; added = pin.length - 1; sfx.key(); vibrate(10); }
    setStatus(pin.length ? `INPUT ${pin.length}/${LEN} …` : 'SEDIA');
    renderPin(added);
    if (pin.length === LEN) verify();
  }

  async function verify() {
    busy = true; keypad.classList.add('locked'); renderPin();
    setStatus('MENGESAHKAN …');
    sfx.verify(0.45);
    await sleep(200);
    slots.forEach(finalize); // pastikan semua digit jelas sebelum keputusan
    await sleep(200);
    pin === PASS ? onSuccess() : onError();
  }

  async function onError() {
    sfx.err(); vibrate([60, 40, 60]);
    pinWrap.classList.add('shake', 'error');
    setStatus('✕ AKSES DITOLAK', 'err');
    await sleep(1000);
    pinWrap.classList.remove('shake', 'error');
    pin = ''; busy = false; keypad.classList.remove('locked');
    setStatus('CUBA LAGI'); renderPin();
  }

  async function onSuccess() {
    vibrate([30, 40, 80]);
    pinWrap.classList.add('success');
    setStatus('✓ KOD SAH', 'ok');
    await sleep(250);
    await scanPerson();
    if (current !== 'login') return;
    runSuccess();
  }

  /* ---------------- Imbasan biometrik tetamu (2 kali, atas -> bawah -> atas) ---------------- */
  const lp = $('#loginPerson');
  async function scanPerson() {
    const dur = C.scanMs || 3200;
    lp.style.setProperty('--scanDur', dur + 'ms');
    lp.classList.remove('verified', 'scanning'); void lp.offsetWidth;
    lp.classList.add('scanning');
    $('#lpState').textContent = 'MENGIMBAS …';
    setStatus('MENGIMBAS BIOMETRIK …');
    play('bioScan', undefined, dur / 1000, 2);
    await sleep(dur);
    lp.classList.remove('scanning'); lp.classList.add('verified');
    $('#lpState').textContent = '✓ IDENTITI DISAHKAN';
    setStatus('✓ IDENTITI DISAHKAN', 'ok');
    play('idOk');
    await sleep(650);
  }
  function resetPerson() {
    lp.classList.remove('scanning', 'verified');
    $('#lpState').textContent = 'MENUNGGU KOD AKSES';
  }

  /* ---------------- Peralihan pintu HUD ---------------- */
  const xfer = document.getElementById('xfer');
  async function doorTransition(swap) {
    xfer.classList.remove('opening', 'sealed');
    void xfer.offsetWidth;
    xfer.classList.add('closing'); play('doorClose');
    await sleep(440);
    xfer.classList.add('sealed'); xfer.classList.remove('closing');
    document.body.classList.add('cut');
    swap();                                  // tukar skrin di sebalik pintu
    await sleep(320);
    document.body.classList.remove('cut');
    xfer.classList.add('opening'); xfer.classList.remove('sealed'); play('doorOpen');
    await sleep(750);
    xfer.classList.remove('opening');
  }

  /* ---------------- Success sequence (radar + boot log) ---------------- */
  async function runSuccess() {
    const total = C.successDelayMs || 3200;
    const scr = screens.success;
    const log = $('#bootLog'), bar = $('#loaderBar'), pct = $('#loaderPct'), prog = $('#rdProgress');
    scr.classList.remove('done', 'show50', 'exit50'); log.innerHTML = '';
    bar.style.transition = 'none'; bar.style.width = '0';
    prog.style.transition = 'none'; prog.style.strokeDashoffset = 578;
    show('success');
    const lines = C.bootLog || [];
    const per = (total - 700) / Math.max(1, lines.length);
    const doneSec = (total - 500) / 1000;
    if (seqSound) seqSound.stop();
    seqSound = play('successSequence', { doneAt: doneSec, lineAts: lines.map((_, i) => (i * per) / 1000) });

    requestAnimationFrame(() => requestAnimationFrame(() => {
      const t = total - 500;
      bar.style.transition = `width ${t}ms linear`; bar.style.width = '100%';
      prog.style.transition = `stroke-dashoffset ${t}ms linear`; prog.style.strokeDashoffset = 0;
    }));
    const t0 = performance.now();
    const pctTimer = setInterval(() => {
      pct.textContent = Math.min(100, Math.round(((performance.now() - t0) / (total - 500)) * 100)) + '%';
    }, 50);

    for (const ln of lines) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="hl">&gt;</span> ${ln} <span class="ok">[ OK ]</span>`;
      li.style.width = '0';
      log.appendChild(li);
      li.animate([{ width: '0ch' }, { width: (ln.length + 10) + 'ch' }], { duration: Math.min(380, per * 0.7), easing: `steps(${ln.length + 10})`, fill: 'forwards' });
      await sleep(per);
    }
    await sleep(Math.max(0, total - 500 - (performance.now() - t0)));
    clearInterval(pctTimer); pct.textContent = '100%';
    scr.classList.add('done');
    if ((C.afterLoading || 'perasmian') === 'perasmian') {
      // Loading habis -> terus ke skrin PERASMIAN (tanpa terminal / "50" / skrin utama)
      await sleep(350); if (current !== 'success') return;
      await doorTransition(enterPerasmian);
      await perasmianTitles();
    } else if (F.enabled !== false) {
      // Loading habis -> tick ✓ sekejap -> paparan "50" futuristik
      $('#fiftyTop').textContent = F.captionTop || '';
      $('#fiftyBottom').textContent = F.captionBottom || '';
      await sleep(450); if (current !== 'success') return;
      scr.classList.add('show50'); play('reveal50');
      await sleep(F.holdMs || 2400); if (current !== 'success') return;
      await doorTransition(enterMain);
    } else {
      await sleep(900);
      enterMain();
    }
  }

  function resetLogin() {
    if (seqSound) { seqSound.stop(); seqSound = null; }
    if (current === 'main') sfx.lock();
    launching = false;
    pin = ''; busy = false;
    pinWrap.classList.remove('success', 'error', 'shake');
    keypad.classList.remove('locked');
    setStatus('SEDIA'); renderPin();
    clearInterval(tabTimer);
    resetPerson();
    show('login');
  }

  keypad.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('button[data-k]');
    if (!b) return;
    e.preventDefault();
    const r = b.getBoundingClientRect();
    b.style.setProperty('--rx', (e.clientX - r.left) + 'px');
    b.style.setProperty('--ry', (e.clientY - r.top) + 'px');
    b.classList.remove('rip'); void b.offsetWidth; b.classList.add('rip');
    press(b.dataset.k, b);
  });

  // Sokongan keyboard fizikal (untuk demo di laptop)
  document.addEventListener('keydown', (e) => {
    if (current !== 'login') return;
    let k = null;
    if (/^\d$/.test(e.key)) k = e.key;
    else if (e.key === 'Backspace') k = 'back';
    else if (e.key === 'Escape' || e.key === 'Delete') k = 'clear';
    if (!k) return;
    const btn = $(`#keypad [data-k="${k}"]`);
    if (btn) { btn.classList.add('pressed'); setTimeout(() => btn.classList.remove('pressed'), 120); }
    press(k, btn);
  });

  /* ---------------- Main screen ---------------- */
  let tabIndex = 0, tabTimer = null;

  function buildMain() {
    $('#eyebrow').textContent = C.eyebrow || '';
    $('#heroTitle').innerHTML = C.heroTitle || '';
    $('#motto').innerHTML = C.motto || '';

    $('#stats').innerHTML = (C.stats || []).map((s, i) =>
      `<div class="stat"><small>DATA.0${i + 1}</small><b data-to="${s.value}" data-suffix="${s.suffix || ''}">0</b><span>${s.label}</span><div class="bar"><i data-w="${s.bar || 100}"></i></div></div>`
    ).join('');

    const tabs = C.tabs || [];
    $('#tabs').innerHTML = tabs.map((t, i) =>
      `<button role="tab" data-i="${i}" aria-selected="${i === 0}">${t.title}</button>`).join('');
    $('#tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (b) { selectTab(+b.dataset.i); restartTabRotate(); }
    });

    $('#personName').textContent = C.personName || '';
    $('#personRole').textContent = C.personRole || '';
    $('#nameplate').classList.toggle('hidden', !C.showNameplate);
    if (C.callouts) {
      const [a, b] = C.callouts;
      if (a) $('.callout.c1').innerHTML = `<b>${a.k}</b><span>${a.v}</span>`;
      if (b) $('.callout.c2').innerHTML = `<b>${b.k}</b><span>${b.v}</span>`;
    }

    const items = (C.ticker || []).map((t) => `${t}<i>◆</i>`).join('');
    $('#ticker').innerHTML = items + items;
  }

  function selectTab(i) {
    const t = (C.tabs || [])[i]; if (!t) return;
    $$('#tabs button').forEach((b) => b.setAttribute('aria-selected', +b.dataset.i === i));
    const inner = t.list
      ? `<ul>${t.list.map((x, n) => `<li data-n="${String(n + 1).padStart(2, '0')}">${x}</li>`).join('')}</ul>`
      : (t.body || '');
    $('#tabBody').innerHTML = `<div class="fade">${inner}</div>`;
    tabIndex = i;
  }

  function restartTabRotate() {
    clearInterval(tabTimer);
    const n = (C.tabs || []).length;
    if (n > 1) tabTimer = setInterval(() => selectTab((tabIndex + 1) % n), 7000);
  }

  function countUp() {
    $$('#stats b').forEach((el, idx) => {
      const to = +el.dataset.to, suf = el.dataset.suffix;
      const from = to > 1000 ? to - 80 : 0;
      const dur = 1500, t0 = performance.now() + 500 + idx * 140;
      el.textContent = from + suf;
      const step = (now) => {
        const p = Math.min(1, Math.max(0, (now - t0) / dur));
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (to - from) * e) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    $$('#stats .bar i').forEach((b) => { b.style.width = '0'; setTimeout(() => (b.style.width = b.dataset.w + '%'), 700); });
  }

  function enterMain() {
    show('main');
    selectTab(0); restartTabRotate(); countUp(); armIdle();
  }

  $('#btnLock').addEventListener('click', resetLogin);


  /* ---------------- PROJECT LAUNCH ---------------- */
  // Terminal hacker -> gelap -> "PROJECT LAUNCH" decode -> KEKAL (tiada auto-reset)
  const L = C.launch || {};
  const lx = $('#screen-launch');
  let launching = false;
  if (L.enabled === false) $('#btnLaunch').style.display = 'none';
  $('#btnLaunchText').textContent = L.buttonText || 'LAUNCH';

  function addLine(cls) {
    const box = $('#lxLines');
    const d = document.createElement('div');
    if (cls) d.className = cls;
    box.appendChild(d);
    while (box.children.length > 60) box.firstChild.remove();
    return d;
  }
  const hexLine = () => {
    const h = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    const addr = '0x' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase();
    return `${addr}  ${Array.from({ length: 16 }, h).join(' ')}`;
  };

  async function runTerminal(lines) {
    const typeMs = L.typeMs || 20;
    for (const raw of lines) {
      if (current !== 'launch') return;
      if (raw === '%HEX') {
        for (let i = 0; i < 14; i++) { addLine('hex').textContent = hexLine(); sfx.tick(); await sleep(26); }
      } else if (raw.startsWith('%BAR')) {
        const label = raw.slice(4).trim();
        const el = addLine('bar');
        for (let p = 0; p <= 100; p += 4 + Math.floor(Math.random() * 7)) {
          const n = Math.round(p / 5);
          el.textContent = `  ${label.padEnd(26)} [${'█'.repeat(n)}${'░'.repeat(20 - n)}] ${String(p).padStart(3)}%`;
          if (p % 3 === 0) sfx.tick();
          await sleep(28);
        }
        el.textContent = `  ${label.padEnd(26)} [${'█'.repeat(20)}] 100%`;
        play('blip');
        await sleep(90);
      } else if (raw.startsWith('$ ')) {
        const el = addLine('cmd');
        for (let i = 1; i <= raw.length; i++) {
          el.innerHTML = '<b>root@jbpm-50</b>:~' + raw.slice(0, i).replace(/&/g, '&amp;').replace(/</g, '&lt;');
          if (i % 2) sfx.tick();
          await sleep(typeMs);
        }
        await sleep(160);
      } else {
        const ok = raw.endsWith('[OK]');
        const el = addLine(raw.startsWith('!') ? 'warn' : '');
        el.textContent = ok ? raw.slice(0, -4).trimEnd() : raw.replace(/^!/, '');
        if (ok) { const s = document.createElement('span'); s.className = 'ok'; s.textContent = 'OK'; el.appendChild(s); }
        play('blip');
        await sleep(ok ? 170 : 110);
      }
    }
  }

  function decodeTitle(el, text, dur, glitch = true) {
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%*/=+[]{}?';
    el.classList.remove('locked', 'glitch');
    return new Promise((res) => {
      const t0 = performance.now();
      (function step() {
        if (current !== 'launch') return res();
        const p = Math.min(1, (performance.now() - t0) / dur);
        const reveal = Math.floor(p * text.length);
        let html = '';
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === '\n') { html += '<br>'; continue; }
          if (ch === ' ' || i < reveal) html += ch === ' ' ? ' ' : ch;
          else html += `<span class="sc">${pool[(Math.random() * pool.length) | 0]}</span>`;
        }
        el.innerHTML = html;
        if (Math.random() < 0.6) sfx.tick();
        if (p < 1) setTimeout(step, 42);
        else {
          el.innerHTML = text.split('\n').map((s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')).join('<br>');
          el.setAttribute('data-text', text);
          el.classList.add('locked');
          if (glitch && !text.includes('\n')) el.classList.add('glitch');
          res();
        }
      })();
    });
  }

  async function launch() {
    if (launching || current !== 'main') return;
    prepLaunch();
    lx.classList.remove('dark');
    show('launch'); play('launchStart');
    await sleep(500);
    await runTerminal(L.script || []);
    if (current !== 'launch') return;
    await sleep(500);
    lx.classList.add('dark'); play('launchDark');
    await sleep(1100);
    await perasmianTitles();
  }

  // Sediakan skrin akhir (gelap) — dipanggil di sebalik pintu HUD
  function prepLaunch() {
    launching = true;
    clearInterval(tabTimer); clearTimeout(idleTimer);
    lx.classList.remove('final', 'locked');
    $('#lxLines').innerHTML = ''; ['#lxTitle', '#lxTitle2', '#lxYear'].forEach((s) => ($(s).textContent = ''));
    $('#lxPre').textContent = L.pre || ''; $('#lxMid').textContent = L.mid || ''; $('#lxOrg').textContent = L.org || '';
  }
  function fillPath() {
    const P = (L.path || {});
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.innerHTML = (v || '').replace(/\n/g, '<br>'); };
    set('p25label', P.fromLabel); set('p25text', P.fromText);
    set('p26label', P.toLabel); set('p26text', P.toText);
  }
  fillPath();
  function enterPerasmian() {
    prepLaunch();
    lx.classList.add('dark');
    show('launch');
  }
  // Tajuk decode: baris 1 (PERASMIAN) kemudian baris 2 (nama majlis). KEKAL selepas itu.
  async function perasmianTitles() {
    if (current !== 'launch') return;
    await sleep(150);
    lx.classList.add('final');
    await sleep(150);
    const d1 = L.decodeMs || 700, d2 = L.decode2Ms || 700;
    play('decodeRun', undefined, (d1 + d2 + 500) / 1000);
    lx.classList.add('s1');                                   // MAJLIS PERASMIAN PENUTUPAN
    await decodeTitle($('#lxTitle'), L.title || '', d1, false);
    if (current !== 'launch') return;
    lx.classList.add('s2'); play('blip');                     // SEMPENA SAMBUTAN
    await decodeTitle($('#lxTitle2'), L.title2 || '', d2, false);
    if (current !== 'launch') return;
    lx.classList.add('s3'); play('blip');                     // JABATAN BOMBA ... (reben)
    await sleep(250);
    await decodeTitle($('#lxYear'), L.year || '', 500, false);
    if (current !== 'launch') return;
    play('launchHit');
    lx.classList.add('locked');
    // KEKAL di sini. Tiada idle reset. (Operator: Shift + Esc untuk keluar)
  }
  $('#btnLaunch').addEventListener('click', launch);

  // Jam LIVE di skrin launch
  setInterval(() => { const c = $('#lxClock'); if (c) c.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false }); }, 1000);

  // Jalan keluar tersembunyi untuk operator sahaja: Shift + Esc (papan kekunci)
  document.addEventListener('keydown', (e) => {
    if (current === 'launch' && e.key === 'Escape' && e.shiftKey) { launching = false; resetLogin(); }
  });

  /* ---------------- Idle reset (mod kiosk) ---------------- */
  let idleTimer = null;
  function armIdle() {
    clearTimeout(idleTimer);
    const s = Number(C.idleResetSeconds || 0);
    if (s > 0 && current === 'main') idleTimer = setTimeout(resetLogin, s * 1000);
  }
  ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach((ev) =>
    document.addEventListener(ev, () => { if (current === 'main') armIdle(); }, { passive: true }));

  /* ---------------- Clock ---------------- */
  function tick() {
    const d = new Date();
    $('#hudClock').textContent = d.toLocaleTimeString('en-GB', { hour12: false });
  }
  tick(); setInterval(tick, 1000);

  /* ---------------- Image fallbacks ---------------- */
  function onImgFail(img, fn) {
    if (img.complete && img.naturalWidth === 0) fn();
    else img.addEventListener('error', fn, { once: true });
  }
  $$('.logos img, .card-logos img').forEach((img) => onImgFail(img, () => {
    const d = document.createElement('div');
    d.className = 'logo-fallback'; d.textContent = img.dataset.fallback || 'LOGO';
    img.replaceWith(d);
  }));

  const person = $('#personImg');
  const setMask = () => $('.holo-scan').style.setProperty('--person-mask', `url("${person.src}")`);
  person.addEventListener('load', setMask);
  if (person.complete && person.naturalWidth) setMask();
  function silhouette() {
    // Siluet hologram anggota bomba (SVG) jika assets/person.png belum diletak
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520">
      <defs>
        <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22e6ff" stop-opacity=".55"/><stop offset="1" stop-color="#0a3a52" stop-opacity=".15"/></linearGradient>
        <linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c2"/><stop offset="1" stop-color="#c8901c"/></linearGradient>
      </defs>
      <g stroke="#22e6ff" stroke-width="2" fill="url(#b)">
        <path d="M40 520c0-110 60-170 160-170s160 60 160 170z"/>
        <ellipse cx="200" cy="250" rx="70" ry="82"/>
      </g>
      <rect x="120" y="420" width="160" height="10" fill="#ffc845" opacity=".9"/>
      <rect x="120" y="440" width="160" height="4" fill="#22e6ff" opacity=".7"/>
      <path d="M110 205c0-62 40-100 90-100s90 38 90 100z" fill="url(#h)"/>
      <path d="M90 205h220c8 0 8 16 0 16H90c-8 0-8-16 0-16z" fill="#c8901c"/>
      <path d="M200 112v90" stroke="#8a6010" stroke-width="10" stroke-linecap="round"/>
      <circle cx="200" cy="168" r="18" fill="#ff2e3a" stroke="#fff2c2" stroke-width="3"/>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  onImgFail(person, () => { person.src = silhouette(); person.style.height = '76%'; });
  const lpImg = $('#lpImg');
  onImgFail(lpImg, () => { lpImg.src = silhouette(); lpImg.style.height = '78%'; });
  const G = C.guest || {};
  if (G.faceTop) lp.style.setProperty('--faceTop', G.faceTop);
  if (G.faceSize) lp.style.setProperty('--faceSize', G.faceSize);
  if (G.faceLeft) lp.querySelector('.lp-face').style.left = G.faceLeft;
  $('#lpTitle').textContent = G.title || 'TETAMU KEHORMAT';
  $('#lpName').textContent = G.name || '';
  $('#lpRole').textContent = G.role || '';

  /* ---------------- Partikel data (cyan + bara) ---------------- */
  const cv = $('#fx'), ctx = cv.getContext('2d');
  let W, H, dpr, parts = [];
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    const n = Math.round(Math.min(80, (innerWidth * innerHeight) / 18000));
    parts = Array.from({ length: n }, () => spawn(true));
  }
  function spawn(anywhere) {
    const ember = Math.random() < 0.35;
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 10 * dpr,
      s: (Math.random() * 2 + 0.8) * dpr,
      vy: (Math.random() * 0.5 + 0.2) * dpr,
      a: Math.random() * 0.5 + 0.3,
      w: Math.random() * Math.PI * 2,
      c: ember ? [255, 90, 50] : [34, 230, 255],
      sq: !ember && Math.random() < 0.6, // segi empat kecil = "data bit"
    };
  }
  function loop() {
    if (current === 'launch') { ctx.clearRect(0, 0, W, H); return requestAnimationFrame(loop); } // jimat kuasa
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      p.w += 0.02; p.y -= p.vy; p.x += Math.sin(p.w) * 0.25 * dpr;
      if (p.y < -10) Object.assign(p, spawn(false));
      const life = Math.max(0.1, p.y / H);
      const flick = p.sq && Math.random() < 0.02 ? 0.2 : 1;
      ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${p.a * life * flick})`;
      ctx.shadowBlur = 10 * dpr; ctx.shadowColor = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},.9)`;
      if (p.sq) ctx.fillRect(p.x, p.y, p.s * 1.3, p.s * 1.3);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill(); }
    }
    requestAnimationFrame(loop);
  }
  addEventListener('resize', resize);
  resize(); loop();

  /* ---------------- Halang gesture yang ganggu kiosk ---------------- */
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  /* ---------------- Init ---------------- */
  buildMain();
  renderPin();
})();
