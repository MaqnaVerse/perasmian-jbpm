/**
 * ============================================================
 *  BOMBA 50 — CONFIG (edit fail ini sahaja untuk tukar isi)
 * ============================================================
 */
window.BOMBA_CONFIG = {
  // ---- Login ----
  password: '50',            // kata laluan keypad
  maxLength: 2,              // bilangan digit (kotak dipapar ikut nombor ini)
  scanMs: 1800,              // tempoh imbasan gambar (sekali: atas->bawah->atas)

  // Selepas loading: 'perasmian' = terus ke skrin PERASMIAN | 'main' = skrin utama (versi lama)
  afterLoading: 'perasmian',

  // Tetamu kehormat (sebelah kanan skrin login). Gambar: public/assets/person.png
  guest: {
    title: 'VIP PERASMI',
    name: 'YBHG. DATUK WIR DR. M NOOR AZMAN BIN TAIB',
    role: 'KETUA SETIAUSAHA KEMENTERIAN PERUMAHAN DAN KERAJAAN TEMPATAN',
    // Kotak imbasan muka (peratus daripada tinggi bingkai gambar)
    faceTop: '4%',       // naik = nombor kecil, turun = nombor besar
    faceSize: '31%',     // saiz kotak
    faceLeft: '48.5%',     // kiri/kanan (50% = tengah)
  },
  successDelayMs: 2000,      // tempoh skrin radar + boot log

  // Baris terminal yang ditaip semasa skrin "AKSES DIBENARKAN"
  bootLog: [
    'Menyemak kod akses ........',
    'Pengesahan identiti .......',
    'Sambungan rangkaian JBPM ..',
    'Memuat modul JUBLI EMAS ...',
  ],
  sound: true,               // bunyi futuristik (WebAudio, tiada fail audio)
  volume: 0.9,               // 0.0 – 1.0

  // ---- Paparan "50" futuristik (muncul selepas loading habis) ----
  fifty: {
    enabled: true,
    holdMs: 2400,                         // berapa lama "50" dipapar sebelum masuk skrin utama
    captionTop: '✓ AKSES DIBENARKAN',
    captionBottom: 'JUBLI EMAS · 1976 – 2026',
  },

  // ---- Butang LAUNCH (skrin utama) ----
  // Terminal hacker -> gelap -> tajuk decode -> KEKAL di skrin itu (tiada auto-reset).
  // Operator: tekan Shift + Esc pada papan kekunci untuk keluar (rahsia).
  launch: {
    enabled: true,
    buttonText: 'LAUNCH',
    // Teks skrin PERASMIAN (ikut susunan dari atas)
    pre: 'MAJLIS PERASMIAN PENUTUPAN',
    title: 'PROGRAM JELAJAH WIRA MADANI',
    mid: 'SEMPENA SAMBUTAN',
    title2: 'MINGGU INOVASI DAN HARI INTEGRITI',
    org: 'JABATAN BOMBA DAN PENYELAMAT MALAYSIA',
    year: 'TAHUN 2026',
    // Kotak laluan inovasi (antara tajuk dan jalur logo). \n = baris baharu
    path: {
      fromLabel: 'Tahun 2025 - Asas',
      fromText: 'Luahkan Kreativiti,\nTerjemahkan Inspirasi',
      toLabel: 'Tahun 2026 - Puncak Inovasi',
      toText: 'Bomba Inovatif,\nRespons Efektif',
    },
    typeMs: 20,                // kelajuan taip arahan (ms setiap huruf)
    decodeMs: 700,             // tempoh decode baris 1 (PERASMIAN)
    decode2Ms: 700,            // tempoh decode baris 2 (nama majlis)
    // '$ ' = arahan ditaip | '[OK]' di hujung = tanda OK | '%BAR label' = bar progres
    // '%HEX' = aliran data hex | '!' di depan = baris merah
    script: [
      '$ ssh kp@jbpm-core.gov.my --port 1976',
      'Menyambung ke JBPM-CORE ....................... [OK]',
      '$ sudo auth --tahap=KETUA-PENGARAH',
      'Pengesahan biometrik ......................... [OK]',
      '$ ./jubli_emas --init --tahun=2026',
      '%BAR Memuat 344 nod balai bomba',
      '%BAR Menyelaras 50 tahun data',
      '%HEX',
      'Integriti sistem ............................. [OK]',
      '$ deploy --projek=BOMBA50 --mod=LIVE',
      '!>> SEMUA SISTEM SEDIA. MELANCARKAN ...',
      '$ launch',
    ],
  },

  // ---- Kiosk ----
  idleResetSeconds: 120,     // tiada sentuhan selama ini -> kembali ke login (0 = matikan)
  autoFullscreen: true,      // cuba skrin penuh bila tekan keypad pertama kali

  // ---- Skrin utama ----  (fakta disemak — lihat SUMBER.md)
  eyebrow: 'Jubli Emas · 1976 – 2026',
  // guna <em> untuk emas, <span class="red"> merah, <span class="cy"> cyan neon
  heroTitle: '<em>50 Tahun</em> Penyatuan<br/><span class="red">Bomba</span> Malaysia',
  motto: 'JBPM <b>Berprestasi Tinggi, Cepat dan Mesra</b> · #KitaBomba',

  stats: [
    { value: 50,  suffix: '', label: 'Tahun Penyatuan · 1976–2026', bar: 100 },
    { value: 344, suffix: '', label: 'Balai Bomba Beroperasi (Jun 2026)', bar: 81 },
    { value: 999, suffix: '', label: 'Talian Kecemasan MERS', bar: 92 },
  ],

  tabs: [
    {
      title: 'Sejarah',
      list: [
        '<b>1883</b> — Bomba Sukarela Selangor, 15 anggota diketuai H.F. Bellamy',
        '<b>1895</b> — Menjadi pasukan bomba tetap',
        '<b>1 Jan 1976</b> — Penyatuan di peringkat Persekutuan',
        '<b>1 Jan 1977</b> — KL, Pulau Pinang &amp; Melaka disatukan',
        '<b>15 Mei 1981</b> — Sabah &amp; Sarawak disatukan',
        '<b>21 Feb 1997</b> — Dikenali sebagai JBPM',
      ],
    },
    {
      title: 'Peranan',
      list: [
        'Memadam, mencegah &amp; mengawal kebakaran',
        'Melindungi nyawa &amp; harta benda',
        'Memastikan laluan keluar kecemasan',
        'Menyiasat punca kebakaran',
        'Khidmat kemanusiaan ketika bencana',
        'Tugas di bawah Akta 341 (1988)',
      ],
    },
    {
      title: 'Jubli Emas',
      body: '<p>Sambutan Ulang Tahun Ke-50 Penyatuan JBPM di bawah Kerajaan Persekutuan, bertemakan <b>Memperkukuh Legasi, Memacu Transformasi</b> dengan aspirasi <b>Kita Bomba</b>. Logo rasmi <b>Jubli Emas</b> dan <b>Kita Bomba</b> diwajibkan dalam semua bahan cetakan dan promosi, fizikal mahupun maya, dari <b>1 Januari hingga 31 Disember 2026</b>.</p>',
    },
    {
      title: 'Kita Bomba',
      body: '<p><b>Kita Bomba</b> menyatukan seluruh warga jabatan, dari Ibu Pejabat di Putrajaya, JBPM Negeri, lima kampus Akademi Bomba dan Penyelamat Malaysia (ABPM), Pangkalan Udara dan Pejabat Zon hingga ke setiap Balai Bomba dan Penyelamat. Perkataan <b>"Bomba"</b> berasal daripada bahasa Portugis <i>bombeiros</i>, yang bermaksud anggota bomba.</p>',
    },
  ],

  // ---- Gambar orang (sebelah kanan) ----
  // Letak gambar PNG (latar lutsinar paling cantik) di public/assets/person.png
  // Contoh: 'Datuk Seri Nor Hisham Mohammad' / 'Ketua Pengarah JBPM' (sahkan ejaan rasmi)
  personName: 'Nama Pegawai',
  personRole: 'Jawatan · JBPM',
  showNameplate: true,

  // Label HUD terapung di sebelah gambar
  callouts: [
    { k: 'PENYATUAN', v: '01.01.1976' },
    { k: 'BERMULA', v: 'TAHUN 1883' },
  ],

  // Hashtag Ketua Pengarah JBPM (dipapar pada ticker & skrin PROJECT LAUNCH)
  hashtags: ['#THINKBIGACTSMALL', '#WORKMOREWITHLESS', '#HONOR&INTEGRITY'],

  ticker: [
    'Selamat Menyambut Jubli Emas JBPM',
    '50 Tahun Penyatuan · 1976 – 2026',
    'Memperkukuh Legasi, Memacu Transformasi',
    'Berprestasi Tinggi, Cepat dan Mesra',
    '#KitaBomba',
    '#THINKBIGACTSMALL · #WORKMOREWITHLESS · #HONOR&INTEGRITY',
    'Kecemasan? Hubungi 999',
  ],
};
