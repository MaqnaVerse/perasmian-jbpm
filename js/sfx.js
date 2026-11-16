/* =========================================================
   BOMBA 50 · Futuristic Sound Engine (Web Audio, tiada fail)
   Semua bunyi dijana secara sintesis: power-up, drone, radar
   ping, data chatter, chirp terminal, impak "AKSES DIBENARKAN",
   dan kesan hologram.
   ========================================================= */
(function () {
  'use strict';

  function BombaSFX(ctx, opts = {}) {
    const vol = opts.volume == null ? 0.9 : opts.volume;

    /* ---------- Rantaian master: bus -> compressor -> speaker ---------- */
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4;
    comp.attack.value = 0.003; comp.release.value = 0.2;
    comp.connect(ctx.destination);
    const master = ctx.createGain(); master.gain.value = vol; master.connect(comp);

    // Reverb (impulse dijana dari noise yang mereput) — rasa "ruang kawalan" luas
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(2.6, 2.6);
    const revWet = ctx.createGain(); revWet.gain.value = 0.32;
    conv.connect(revWet).connect(master);

    // Delay ping-pong ringkas — gema digital
    const dly = ctx.createDelay(1.0); dly.delayTime.value = 0.19;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const dlyWet = ctx.createGain(); dlyWet.gain.value = 0.22;
    const dlyLP = ctx.createBiquadFilter(); dlyLP.type = 'lowpass'; dlyLP.frequency.value = 3800;
    dly.connect(dlyLP).connect(fb).connect(dly);
    dlyLP.connect(dlyWet).connect(master);

    let noiseBuf = null;
    function makeImpulse(sec, decay) {
      const len = Math.floor(ctx.sampleRate * sec);
      const b = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = b.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return b;
    }
    function getNoise() {
      if (noiseBuf) return noiseBuf;
      const len = ctx.sampleRate * 2;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return noiseBuf;
    }
    const now = () => ctx.currentTime;

    // Hantar node ke dry/reverb/delay
    function route(node, bus, { rev = 0, dl = 0, pan = 0 } = {}) {
      let n = node;
      if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; n.connect(p); n = p; }
      n.connect(bus || master);
      if (rev) { const g = ctx.createGain(); g.gain.value = rev; n.connect(g).connect(conv); }
      if (dl) { const g = ctx.createGain(); g.gain.value = dl; n.connect(g).connect(dly); }
    }

    // Oscillator serba guna dengan envelope + optional filter sweep
    function tone({ t = now(), f = 440, f2, dur = 0.1, type = 'sine', v = 0.1, a = 0.004, curve = 'exp',
      lp, lp2, q = 1, detune = 0, bus, rev, dl, pan } = {}) {
      const o = ctx.createOscillator(); o.type = type; o.detune.value = detune;
      o.frequency.setValueAtTime(f, t);
      if (f2) curve === 'lin' ? o.frequency.linearRampToValueAtTime(f2, t + dur) : o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let n = o;
      if (lp) {
        const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = q;
        fl.frequency.setValueAtTime(lp, t);
        if (lp2) fl.frequency.exponentialRampToValueAtTime(lp2, t + dur);
        n.connect(fl); n = fl;
      }
      n.connect(g);
      route(g, bus, { rev, dl, pan });
      o.start(t); o.stop(t + dur + 0.05);
      return o;
    }

    // Noise berfilter (whoosh, klik, impak)
    function noise({ t = now(), dur = 0.2, v = 0.1, type = 'bandpass', f = 1000, f2, q = 1, a = 0.01, bus, rev, dl, pan } = {}) {
      const s = ctx.createBufferSource(); s.buffer = getNoise(); s.loop = true;
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q;
      fl.frequency.setValueAtTime(f, t);
      if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(fl).connect(g);
      route(g, bus, { rev, dl, pan });
      s.start(t, Math.random()); s.stop(t + dur + 0.05);
    }

    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    /* ================= BUNYI KEYPAD ================= */
    function key(t = now()) {
      tone({ t, f: 1760, f2: 1320, dur: 0.07, type: 'sine', v: 0.09, rev: 0.15 });
      tone({ t, f: 3520, dur: 0.025, type: 'square', v: 0.018 });
      noise({ t, dur: 0.02, v: 0.04, type: 'highpass', f: 6000 });
    }
    function tick(t = now()) {
      tone({ t, f: rnd(3200, 4600), dur: 0.014, type: 'square', v: 0.012 });
    }
    function del(t = now()) {
      tone({ t, f: 900, f2: 300, dur: 0.12, type: 'triangle', v: 0.07, rev: 0.1 });
    }
    // "Mengesahkan" — imbasan naik
    function verify(t = now(), dur = 0.65) {
      tone({ t, f: 320, f2: 1400, dur, type: 'sine', v: 0.04, rev: 0.25 });
      noise({ t, dur, v: 0.03, type: 'bandpass', f: 600, f2: 5000, q: 6, rev: 0.3 });
      for (let i = 0; i < 5; i++) tone({ t: t + i * (dur / 5), f: 2093, dur: 0.03, type: 'square', v: 0.012, dl: 0.2 });
    }
    function err(t = now()) {
      [0, 0.17].forEach((d) => {
        tone({ t: t + d, f: 150, dur: 0.18, type: 'sawtooth', v: 0.09, lp: 900 });
        tone({ t: t + d, f: 153, dur: 0.18, type: 'square', v: 0.04, lp: 700 });
      });
      noise({ t, dur: 0.3, v: 0.05, type: 'lowpass', f: 1500 });
      tone({ t: t + 0.36, f: 300, f2: 120, dur: 0.25, type: 'sine', v: 0.06, rev: 0.2 });
    }

    /* ================= SEKUENS LOADING (AKSES DIBENARKAN) ================= */
    // doneAt  = saat (relatif) bila tick ✓ muncul
    // lineAts = array saat (relatif) bila setiap baris log ditaip
    function successSequence({ t = now(), doneAt = 2.9, lineAts = [] } = {}) {
      const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(master);
      const T = t, END = T + doneAt;

      // 1) POWER-UP: saw naik + filter terbuka + whoosh
      tone({ t: T, f: 45, f2: 180, dur: 1.1, type: 'sawtooth', v: 0.11, lp: 120, lp2: 2600, q: 6, bus, rev: 0.3 });
      tone({ t: T, f: 45.5, f2: 181, dur: 1.1, type: 'sawtooth', v: 0.08, lp: 120, lp2: 2600, q: 6, bus, detune: 8 });
      noise({ t: T, dur: 1.0, v: 0.07, type: 'bandpass', f: 250, f2: 7000, q: 2, a: 0.6, bus, rev: 0.5 });
      tone({ t: T + 0.05, f: 2637, dur: 0.6, type: 'sine', v: 0.02, bus, rev: 0.6, dl: 0.4 });

      // 2) DRONE: dengung berlapis dengan LFO, pic naik ikut progres
      const dg = ctx.createGain();
      dg.gain.setValueAtTime(0.0001, T);
      dg.gain.exponentialRampToValueAtTime(0.06, T + 0.6);
      dg.gain.setValueAtTime(0.06, END - 0.25);
      dg.gain.exponentialRampToValueAtTime(0.0001, END + 0.05);
      const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.Q.value = 8;
      dlp.frequency.setValueAtTime(300, T);
      dlp.frequency.exponentialRampToValueAtTime(1800, END);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5.5;
      const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 180;
      lfo.connect(lfoAmt).connect(dlp.frequency);
      dlp.connect(dg); route(dg, bus, { rev: 0.25 });
      [[55, 0], [55, 9], [110, -6]].forEach(([f, det]) => {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.detune.value = det;
        o.frequency.setValueAtTime(f, T);
        o.frequency.exponentialRampToValueAtTime(f * 2, END);
        o.connect(dlp); o.start(T); o.stop(END + 0.1);
      });
      lfo.start(T); lfo.stop(END + 0.1);

      // 3) RISER halus: ketegangan naik sampai saat ✓
      tone({ t: T + 0.3, f: 220, f2: 1760, dur: doneAt - 0.3, type: 'sine', v: 0.022, bus, rev: 0.4 });
      noise({ t: T + doneAt * 0.55, dur: doneAt * 0.45, v: 0.05, type: 'highpass', f: 2000, f2: 9000, a: doneAt * 0.4, bus, rev: 0.3 });

      // 4) RADAR PING: ikut pusingan sweep radar (1.4s)
      for (let p = T + 0.35; p < END - 0.4; p += 1.4) {
        tone({ t: p, f: 1568, dur: 0.35, type: 'sine', v: 0.06, a: 0.002, bus, rev: 0.6, dl: 0.55, pan: -0.2 });
        tone({ t: p, f: 3136, dur: 0.12, type: 'sine', v: 0.015, bus, dl: 0.3, pan: 0.2 });
      }

      // 5) DATA CHATTER: blip komputer rawak (kiri/kanan)
      const scale = [1975, 2349, 2637, 3136, 3520, 4186, 4699];
      for (let c = T + 0.45; c < END - 0.35; c += rnd(0.035, 0.11)) {
        tone({ t: c, f: pick(scale), dur: rnd(0.01, 0.03), type: 'square', v: rnd(0.008, 0.016), bus, dl: 0.15, pan: rnd(-0.7, 0.7) });
        if (Math.random() < 0.08) { // burst "pemprosesan"
          for (let k = 0; k < 4; k++) tone({ t: c + k * 0.022, f: pick(scale) / 2, dur: 0.018, type: 'square', v: 0.01, bus, pan: rnd(-0.5, 0.5) });
        }
      }

      // 6) BARIS LOG: chirp + bip pengesahan [ OK ]
      lineAts.forEach((la) => {
        const lt = T + la;
        tone({ t: lt, f: 700, f2: 2100, dur: 0.08, type: 'sine', v: 0.055, bus, rev: 0.2 });
        noise({ t: lt, dur: 0.05, v: 0.025, type: 'highpass', f: 5000, bus });
        tone({ t: lt + 0.24, f: 1760, dur: 0.05, type: 'triangle', v: 0.05, bus, dl: 0.25 });
        tone({ t: lt + 0.30, f: 2637, dur: 0.07, type: 'triangle', v: 0.045, bus, dl: 0.25, rev: 0.2 });
      });

      // 7) Loading siap: bip pengesahan (impak besar disimpan untuk paparan "50")
      tone({ t: END, f: 1318.5, dur: 0.09, type: 'triangle', v: 0.06, bus, rev: 0.3 });
      tone({ t: END + 0.1, f: 1760, dur: 0.16, type: 'triangle', v: 0.06, bus, rev: 0.4, dl: 0.3 });
      noise({ t: END, dur: 0.25, v: 0.04, type: 'highpass', f: 4000, bus, rev: 0.3 });

      return {
        stop() {
          try {
            bus.gain.cancelScheduledValues(now());
            bus.gain.setValueAtTime(bus.gain.value, now());
            bus.gain.linearRampToValueAtTime(0, now() + 0.15);
          } catch (_) {}
        },
      };
    }

    function granted(t = now(), bus) {
      // Impak
      tone({ t, f: 150, f2: 36, dur: 0.75, type: 'sine', v: 0.55, a: 0.003, bus });
      noise({ t, dur: 0.6, v: 0.22, type: 'lowpass', f: 2400, f2: 90, a: 0.003, bus, rev: 0.4 });
      noise({ t, dur: 0.08, v: 0.08, type: 'highpass', f: 7000, bus });
      // Akord terbuka (A add9) — rasa "sistem online"
      [440, 554.37, 659.25, 880, 987.77, 1318.5].forEach((f, i) => {
        tone({ t: t + 0.02 + i * 0.025, f, dur: 1.9, type: 'triangle', v: 0.035, a: 0.03, bus, rev: 0.7, pan: (i % 2 ? 0.25 : -0.25) });
        tone({ t: t + 0.02 + i * 0.025, f, dur: 1.9, type: 'sine', v: 0.02, a: 0.05, detune: 7, bus, rev: 0.5 });
      });
      // Kilauan arpeggio
      [2637, 3520, 4186, 5274, 4186, 5274].forEach((f, i) =>
        tone({ t: t + 0.12 + i * 0.055, f, dur: 0.22, type: 'sine', v: 0.022, bus, dl: 0.5, rev: 0.4, pan: i % 2 ? 0.5 : -0.5 }));
    }


    /* ================= PAPARAN "50" FUTURISTIK ================= */
    // Garis dilukis (zip data) -> glitch -> isi emas "terkunci" dengan impak
    function reveal50(t = now()) {
      tone({ t, f: 3000, f2: 600, dur: 0.65, type: 'sine', v: 0.03, rev: 0.4, dl: 0.3 });   // laser imbasan
      tone({ t, f: 140, f2: 2600, dur: 0.6, type: 'sawtooth', v: 0.035, lp: 400, lp2: 6000, q: 4, rev: 0.3 });
      noise({ t, dur: 0.6, v: 0.04, type: 'bandpass', f: 500, f2: 8000, q: 5, a: 0.4, rev: 0.3 });
      for (let i = 0; i < 12; i++) tone({ t: t + i * 0.05, f: 1800 + i * 160, dur: 0.02, type: 'square', v: 0.012, pan: -0.8 + i * 0.14 });
      [0.55, 0.62, 0.7].forEach((d) => {                      // glitch
        tone({ t: t + d, f: rnd(70, 140), dur: 0.035, type: 'square', v: 0.06, lp: 1500 });
        noise({ t: t + d, dur: 0.03, v: 0.05, type: 'bandpass', f: rnd(2000, 5000), q: 3 });
      });
      granted(t + 0.6);                                       // impak + akord bila emas terkunci
      tone({ t: t + 1.0, f: 98, dur: 1.6, type: 'sawtooth', v: 0.025, lp: 500, rev: 0.4 });   // dengung stabil
    }
    // Pintu HUD tertutup: hentakan mekanikal berat
    function doorClose(t = now()) {
      noise({ t, dur: 0.42, v: 0.05, type: 'bandpass', f: 300, f2: 1800, q: 2, a: 0.35, rev: 0.2 });
      tone({ t, f: 80, f2: 160, dur: 0.42, type: 'sawtooth', v: 0.03, lp: 400 });
      const h = t + 0.42;
      tone({ t: h, f: 70, f2: 32, dur: 0.5, type: 'sine', v: 0.55, a: 0.002 });
      noise({ t: h, dur: 0.25, v: 0.25, type: 'lowpass', f: 1200, f2: 120, a: 0.002, rev: 0.5 });
      tone({ t: h, f: 2093, dur: 0.18, type: 'square', v: 0.02, rev: 0.4 });          // denting logam
      tone({ t: h + 0.06, f: 1568, dur: 0.12, type: 'square', v: 0.015, rev: 0.4 });
    }
    // Pintu terbuka: desisan hidraulik + dengung sistem naik
    function doorOpen(t = now()) {
      noise({ t, dur: 0.75, v: 0.09, type: 'highpass', f: 7000, f2: 1500, a: 0.01, rev: 0.3 });
      tone({ t, f: 55, f2: 110, dur: 0.9, type: 'sawtooth', v: 0.035, lp: 300, lp2: 1400, rev: 0.4 });
      tone({ t: t + 0.25, f: 1318.5, dur: 0.5, type: 'sine', v: 0.03, rev: 0.6, dl: 0.4 });
      tone({ t: t + 0.32, f: 1975.5, dur: 0.6, type: 'sine', v: 0.025, rev: 0.6, dl: 0.4 });
    }
    function exit50(t = now()) {
      noise({ t, dur: 0.45, v: 0.08, type: 'bandpass', f: 400, f2: 7000, q: 2, a: 0.3, rev: 0.4 });
      tone({ t, f: 300, f2: 2400, dur: 0.4, type: 'sawtooth', v: 0.03, lp: 800, lp2: 6000 });
      [0.05, 0.14, 0.22].forEach((d) => tone({ t: t + d, f: rnd(90, 160), dur: 0.03, type: 'square', v: 0.05, lp: 1200 }));
    }


    /* ================= IMBASAN BIOMETRIK (2 kali: bawah, atas, bawah, atas) ================= */
    function bioScan(t = now(), dur = 3.2, legs = 4) {
      const q = dur / legs;
      for (let i = 0; i < legs; i++) {
        const st = t + i * q, down = i % 2 === 0;
        tone({ t: st, f: down ? 1800 : 500, f2: down ? 500 : 1800, dur: q, type: 'sine', v: 0.035, rev: 0.4, dl: 0.25 });
        noise({ t: st, dur: q, v: 0.03, type: 'bandpass', f: down ? 5000 : 900, f2: down ? 900 : 5000, q: 6, rev: 0.3 });
        for (let k = 0; k < 8; k++) tone({ t: st + k * (q / 8), f: 2600 + Math.random() * 1400, dur: 0.015, type: 'square', v: 0.01, pan: rnd(-0.6, 0.6) });
      }
      tone({ t, f: 82, dur: dur, type: 'sawtooth', v: 0.02, lp: 400, rev: 0.3 });
    }
    function idOk(t = now()) {
      tone({ t, f: 987.77, dur: 0.12, type: 'triangle', v: 0.07, rev: 0.3 });
      tone({ t: t + 0.12, f: 1318.5, dur: 0.12, type: 'triangle', v: 0.07, rev: 0.3 });
      tone({ t: t + 0.24, f: 1975.5, dur: 0.35, type: 'triangle', v: 0.06, rev: 0.5, dl: 0.3 });
    }

    /* ================= PROJECT LAUNCH ================= */
    function blip(t = now()) {
      tone({ t, f: 2349, dur: 0.035, type: 'square', v: 0.018, pan: rnd(-0.4, 0.4) });
      tone({ t: t + 0.03, f: 1175, dur: 0.03, type: 'square', v: 0.012 });
    }
    function launchStart(t = now()) {
      tone({ t, f: 60, f2: 260, dur: 0.6, type: 'sawtooth', v: 0.06, lp: 200, lp2: 3000, q: 5, rev: 0.3 });
      noise({ t, dur: 0.5, v: 0.05, type: 'bandpass', f: 400, f2: 6000, q: 3, a: 0.3, rev: 0.3 });
      tone({ t: t + 0.45, f: 1760, dur: 0.12, type: 'triangle', v: 0.05, dl: 0.3 });
    }
    // Kuasa dimatikan -> gelap
    function launchDark(t = now()) {
      tone({ t, f: 420, f2: 35, dur: 1.2, type: 'sawtooth', v: 0.07, lp: 3000, lp2: 90, q: 3, rev: 0.4 });
      tone({ t, f: 90, f2: 30, dur: 1.0, type: 'sine', v: 0.25 });
      noise({ t, dur: 0.9, v: 0.06, type: 'lowpass', f: 3000, f2: 100, rev: 0.4 });
      tone({ t: t + 1.0, f: 45, dur: 0.5, type: 'sine', v: 0.2, a: 0.01 });           // denyut senyap
    }
    // Riser semasa decode
    function decodeRun(t = now(), dur = 1.9) {
      tone({ t, f: 110, f2: 880, dur, type: 'sawtooth', v: 0.03, lp: 300, lp2: 4000, q: 6, rev: 0.4 });
      noise({ t, dur, v: 0.04, type: 'highpass', f: 1500, f2: 9000, a: dur * 0.8, rev: 0.3 });
    }
    // Impak akhir + ekor gema panjang
    function launchHit(t = now()) {
      granted(t);
      tone({ t, f: 55, dur: 4.5, type: 'sine', v: 0.18, a: 0.01 });
      tone({ t, f: 55, dur: 4.5, type: 'sawtooth', v: 0.03, lp: 300, rev: 0.6 });
      noise({ t, dur: 3.5, v: 0.05, type: 'lowpass', f: 1800, f2: 200, a: 0.01, rev: 0.8 });
    }

    /* ================= HOLOGRAM / MASUK SKRIN UTAMA ================= */
    function holoIn(t = now()) {
      // whoosh turun
      noise({ t, dur: 0.7, v: 0.07, type: 'bandpass', f: 6000, f2: 300, q: 3, a: 0.05, rev: 0.4 });
      tone({ t, f: 2400, f2: 180, dur: 0.6, type: 'sawtooth', v: 0.035, lp: 3000, lp2: 400, rev: 0.3 });
      // glitch berkelip (selari dengan animasi holoIn)
      [0.42, 0.5, 0.55, 0.66, 0.72].forEach((d) => {
        tone({ t: t + d, f: rnd(80, 160), dur: 0.035, type: 'square', v: 0.05, lp: 1200 });
        noise({ t: t + d, dur: 0.03, v: 0.04, type: 'bandpass', f: rnd(1500, 4000), q: 4 });
      });
      // hum hologram stabil
      tone({ t: t + 0.75, f: 98, dur: 1.2, type: 'sawtooth', v: 0.03, lp: 600, rev: 0.3 });
      tone({ t: t + 0.8, f: 1975, dur: 0.6, type: 'sine', v: 0.02, rev: 0.6, dl: 0.4 });
    }

    function lock(t = now()) {
      tone({ t, f: 1200, f2: 200, dur: 0.35, type: 'sawtooth', v: 0.04, lp: 2500, lp2: 300 });
      tone({ t: t + 0.05, f: 880, dur: 0.06, type: 'square', v: 0.03 });
      tone({ t: t + 0.13, f: 587, dur: 0.1, type: 'square', v: 0.03, rev: 0.2 });
    }

    return { key, tick, del, verify, err, successSequence, granted, holoIn, lock, reveal50, exit50, doorClose, doorOpen, bioScan, idOk, blip, launchStart, launchDark, decodeRun, launchHit, master };
  }

  window.BombaSFX = BombaSFX;
})();
