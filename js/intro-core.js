"use strict";
/* ═══ js/intro-core.js — v5.2 intro saf mantığı (DOM yok, test edilebilir) ═══
   • STYLES      → tarz kayıt defteri (editör + kılavuz buradan okur)
   • normalizeIntro → config'i güvenli, sınırlı değerlere çevirir
   • planVideo   → video kaynaklarını tarayıcının çözebildiği sıraya dizer
   • lock        → video açık + oynatılabilir + "diğerlerini kilitle" ise
                   tarz/satır/gecikme/arka plan ayarları yok sayılır
   UMD: tarayıcıda window.SenkiIntroCore, Node'da module.exports. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SenkiIntroCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {

  const STYLES = [
    { id: "boot",       label: "Önyükleme",     group: "klasik",   desc: "Terminal satırları yazılır, öğeler sırayla belirir." },
    { id: "cinematic",  label: "Sinematik",     group: "klasik",   desc: "Harf kutusu açılır, kart bulanıktan netleşir." },
    { id: "assembly",   label: "Montaj",        group: "klasik",   desc: "Öğeler yönlü kayarak yerine oturur." },
    { id: "glitch",     label: "Glitch",        group: "klasik",   desc: "Öğeler bozulup sarsılarak görünür." },
    { id: "terminal",   label: "Terminal",      group: "klasik",   desc: "Rastgele karakter şelalesi ve çözülme." },
    { id: "summon",     label: "Çağırma",       group: "klasik",   desc: "Rün halkaları ve büyü efekti." },
    { id: "minimal",    label: "Minimal",       group: "klasik",   desc: "Sadece yavaş bir solma." },
    { id: "matrix",     label: "Matrix yağmuru", group: "yeni",    desc: "Düşen karakter sütunları, sonra açılış." },
    { id: "iris",       label: "İris açılışı",  group: "yeni",     desc: "Dairesel bir perde kapanarak sahneyi açar." },
    { id: "typewriter", label: "Daktilo",       group: "yeni",     desc: "Her satır imleçle yazılır, öğeler karşılar." },
    { id: "scanline",   label: "Tarama çizgisi", group: "yeni",    desc: "CRT tarzı yatay tarama çizgisi her şeyi açar." },
    { id: "particles",  label: "Parçacık toplama", group: "yeni",  desc: "Parçacıklar merkeze toplanıp patlar." },
    { id: "zoom",       label: "Yakınlaşma",    group: "yeni",     desc: "Kart büyük ve bulanık başlar, yerine oturur." },
    { id: "flicker",    label: "Neon titreme",  group: "yeni",     desc: "Öğeler neon gibi titreyerek yanar." },
    { id: "curtains",   label: "Perde",         group: "yeni",     desc: "İki perde açılır, sahne ortaya çıkar." },
    { id: "ekg",        label: "EKG hattı",     group: "yeni",     desc: "Kalp atışı çizgisi çizilir, sonra açılır." },
  ];
  const STYLE_IDS = STYLES.map((s) => s.id);
  const BG_REVEALS = ["blur", "fade", "frames", "wipe", "none"];
  const VIDEO_EXT = ["mp4", "m4v", "mov", "webm"];
  const IMAGE_EXT = ["webp", "gif"];
  const LOCKED_FIELDS = ["style", "lines", "elementDelay", "bgReveal"];

  /* Her kodek için tek bir MIME/codec dizgisi. Kaynağın kodeği ya açıkça
     verilir ({src, codec}) ya da dosya adından okunur (…hevc…, …h264…, …av1…, …vp9…).
     Böylece "mp4 oynayabilir mi?" yerine "bu kodek oynayabilir mi?" sorulur. */
  const CODEC_MIME = {
    hevc: 'video/mp4; codecs="hvc1.1.6.L93.B0, mp4a.40.2"',
    h264: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    av1:  'video/webm; codecs="av01.0.05M.08, opus"',
    vp9:  'video/webm; codecs="vp9, opus"',
  };
  /* Kodek ipucu yoksa kapsayıcıya göre denenecek kodekler (öncelik sırasıyla). */
  const GENERIC_CODECS = { mp4: ["hevc", "h264"], m4v: ["hevc", "h264"], mov: ["hevc", "h264"], webm: ["av1", "vp9"] };

  function extOf(src) {
    const m = /\.([a-z0-9]+)([?#]|$)/i.exec(String(src || ""));
    return m ? m[1].toLowerCase() : "";
  }

  /* "video" | "image" | null */
  function kindOf(src) {
    const e = extOf(src);
    if (VIDEO_EXT.includes(e)) return "video";
    if (IMAGE_EXT.includes(e)) return "image";
    return null;
  }

  /* Kaynağın kodeği: açık ipucu → dosya adı → null (bilinmiyor). */
  function codecOf(src, hint) {
    if (hint && CODEC_MIME[hint]) return hint;
    const s = String(src || "").toLowerCase();
    if (/h265|hevc/.test(s)) return "hevc";
    if (/h264|avc/.test(s)) return "h264";
    if (/av1/.test(s)) return "av1";
    if (/vp9/.test(s)) return "vp9";
    return null;
  }

  /* Bir kaynak için denenecek MIME dizisi (öncelik sırasıyla). */
  function candidateMimes(src, hint) {
    const known = codecOf(src, hint);
    if (known) return [CODEC_MIME[known]];
    return (GENERIC_CODECS[extOf(src)] || []).map((k) => CODEC_MIME[k]);
  }

  /* canPlay(mime) → "" | "maybe" | "probably". Kaynak listesini tarayıcı
     yeteneğine göre sıralar; desteklenmeyenler sona gider (silinmez). */
  function planVideo(sources, canPlay, hints) {
    const check = typeof canPlay === "function" ? canPlay : () => "";
    const h = hints || {};
    const plan = (sources || []).map((src) => {
      const kind = kindOf(src);
      if (kind === "image") return { src, kind, supported: true };
      const supported = candidateMimes(src, h[src]).some((m) => !!check(m));
      return { src, kind, supported };
    });
    return plan.map((p, i) => ({ ...p, _i: i }))
      .sort((a, b) => (Number(b.supported) - Number(a.supported)) || (a._i - b._i))
      .map(({ _i, ...rest }) => rest);
  }

  function clampInt(v, lo, hi, dflt) {
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return dflt;
    return Math.min(hi, Math.max(lo, n));
  }

  function cleanLines(lines) {
    const arr = Array.isArray(lines) ? lines : [];
    const out = arr.map((l) => String(l == null ? "" : l).trim()).filter(Boolean)
      .map((l) => l.slice(0, 80)).slice(0, 12);
    return out.length ? out : ["SYSTEM READY"];
  }

  /* raw: config.intro · canPlay: tarayıcı yetenek fonksiyonu (opsiyonel) */
  function normalizeIntro(raw, canPlay) {
    const r = raw || {};
    const warnings = [];
    const v = r.video || {};

    let sources = [];
    const hints = {};
    const pushSrc = (entry) => {
      const isObj = entry && typeof entry === "object";
      const s = isObj ? entry.src : entry;
      if (typeof s !== "string" || !s.trim()) return;
      const src = s.trim();
      if (!kindOf(src)) { warnings.push("tanınmayan video türü: " + src); return; }
      if (sources.includes(src)) return;
      sources.push(src);
      if (isObj && typeof entry.codec === "string") hints[src] = entry.codec.toLowerCase();
    };
    pushSrc(v.src);
    (Array.isArray(v.sources) ? v.sources : []).forEach(pushSrc);

    let mode = r.mode === "video" ? "video" : "style";
    if (mode === "video" && sources.length === 0) {
      warnings.push("video modu seçili ama video kaynağı yok — tarz moduna dönüldü");
      mode = "style";
    }

    let style = STYLE_IDS.includes(r.style) ? r.style : "boot";
    if (r.style && !STYLE_IDS.includes(r.style)) warnings.push("bilinmeyen tarz: " + r.style + " → boot");

    const bgReveal = BG_REVEALS.includes(r.bgReveal) ? r.bgReveal : "blur";

    const normalized = {
      enabled: r.enabled !== false,
      mode,
      style,
      lines: cleanLines(r.lines),
      elementDelay: clampInt(r.elementDelay, 30, 800, 120),
      bgReveal,
      skipOnReload: r.skipOnReload !== false,
      sound: r.sound !== false,
      video: {
        sources,
        poster: typeof v.poster === "string" ? v.poster : "",
        maxMs: Math.min(60000, Math.max(0, clampInt(v.maxMs, 0, 1e9, 0))),
        lockOthers: v.lockOthers === true,
      },
      locked: false,
      ignoredFields: [],
      playable: [],
      warnings,
    };

    if (sources.length) normalized.playable = planVideo(sources, canPlay, hints);
    const hasPlayable = normalized.playable.some((p) => p.supported);

    if (normalized.video.lockOthers && hasPlayable && mode === "video") {
      normalized.locked = true;
      normalized.ignoredFields = LOCKED_FIELDS.slice();
    }
    return normalized;
  }

  return {
    STYLES, STYLE_IDS, BG_REVEALS, LOCKED_FIELDS,
    kindOf, codecOf, candidateMimes, planVideo, normalizeIntro, CODEC_MIME,
  };
});
