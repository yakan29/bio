"use strict";
/* ═══════════════════════════════════════════════════════════════════
   SENKI BIO v5.1 — EDİTÖR RÖNESANSI
   Modern kabuk default + EDITOR_LEGACY=true → legacy drawer.
   Bölümler: Kimlik(+giriş perdesi+favicon+İNTERAKTİF İNTRO),
   Avatar·Çerçeveler(+şekil), Rozetler, Shader FX(HAZIR+ÖZEL+dosya
   derleme), Linkler, Tema(+4 renk), Arka Plan, Kart, Gelişmiş,
   Sekmeler, Menüler, Bölgeler(+şeritler+ses), Aksiyon testi, Efektler,
   Ses, Performans, Koruma, Debug, Canlı. SIFIR/V1/DEF şablonları. ═══ */
/* v5.2: intro yardımcıları — tarz listesi kayıt defterinden gelir */
function introStyleOptions() {
  const list = (window.SenkiIntroCore && SenkiIntroCore.STYLES) || [{ id: "boot", label: "Önyükleme", group: "klasik" }];
  const groups = {};
  list.forEach(s => { (groups[s.group] = groups[s.group] || []).push(s); });
  const names = { klasik: "Klasik", yeni: "Yeni (v5.2)" };
  return Object.keys(groups).map(g =>
    `<optgroup label="${names[g] || g}">` +
    groups[g].map(s => `<option value="${s.id}">${s.label} — ${s.desc}</option>`).join("") +
    `</optgroup>`).join("");
}
function introCanPlay(mime) {
  try { return document.createElement("video").canPlayType(mime); } catch (_) { return ""; }
}
/* kilit: video oynatılabiliyorsa ve "kilitle" açıksa görsel intro ayarları devre dışı */
function applyIntroLock(root) {
  const q2 = (id) => root.querySelector("#" + id);
  const cfg = (window.SenkiApp && SenkiApp.CONFIG && SenkiApp.CONFIG.intro) || {};
  if (!window.SenkiIntroCore) return;
  const n = SenkiIntroCore.normalizeIntro(cfg, introCanPlay);
  ["ed-intro-style", "ed-intro-lines", "ed-intro-delay", "ed-intro-bg"].forEach(id => {
    const el = q2(id); if (el) el.disabled = n.locked;
  });
  const hint = q2("ed-intro-vhint");
  if (hint) {
    const ok = n.playable.filter(p => p.supported).map(p => p.src.split("/").pop());
    hint.textContent = n.video.sources.length === 0
      ? "MP4 (H.264 / H.265 + AAC), WebM (AV1 / VP9 + Opus), animasyonlu WebP/GIF."
      : ok.length ? "Oynatılabilir: " + ok[0] + (n.locked ? " — diğer intro ayarları kilitli." : "")
                  : "Bu tarayıcı listedeki kaynakların hiçbirini oynatamıyor — tarz moduna düşülür.";
  }
  (n.warnings || []).forEach(w => console.info("[senki-editör] intro:", w));
}

window.SenkiEditor = (function () {

  let shell = null, badge = null, inited = false, modern = true;
  let q = (id) => null;
  let dirty = new Set(), railBtns = {};
  let selMenu = 0, sfxSel = "explosion";
  let emergencyFrames = false, lastOpen = null;

  const App = () => window.SenkiApp;
  const esc = (s) => window.SenkiApp ? SenkiApp.util.escapeHtml(String(s ?? "")) : "";
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const opt = (v, l, sel) => `<option value="${esc(v)}"${sel === v ? " selected" : ""}>${esc(l)}</option>`;
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const safeRender = (name, fn) => { try { fn(); } catch (err) { console.error("[senki-editör] render '" + name + "':", err); } };
  const box = (id) => { const el = q(id); if (!el) console.info("[senki-editör] konteyner yok: #" + id); return el; };
  const safeApply = (fn) => { try { fn(); } catch (_) { } };

  const SVG = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };
  const ic = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const RIC = {
    identity: ic('<circle cx="12" cy="8" r="3.6"/><path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5"/>'),
    avatar: ic('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4 4 3 3-2 4 3"/>'),
    badges: ic('<circle cx="12" cy="9" r="5"/><path d="M9 13.5L7.5 21l4.5-2.5L16.5 21 15 13.5"/>'),
    shader: ic('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"/>'),
    links: ic('<path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07L11.5 5.4"/><path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.47"/>'),
    theme: ic('<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.4-2.1-.8-1.4.2-2.9 1.8-2.9H17a4 4 0 0 0 4-4c0-5-4-9-9-9z"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/>'),
    bg: ic('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M8 4.5v15M16 4.5v15M3.5 9h4.5M3.5 15h4.5M16 9h4.5M16 15h4.5"/>'),
    card: ic('<rect x="4" y="5" width="16" height="14" rx="2.5"/><path d="M4 9.5h16"/>'),
    adv: ic('<path d="M5 6h14M5 12h14M5 18h14"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="7" cy="18" r="2"/>'),
    tabs: ic('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M3.5 10h17M9.5 5.5V10"/>'),
    menus: ic('<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
    zones: ic('<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 2.4"/><path d="M13 10.5l6 2.4-2.6 1 1.5 2.9-1.8.9-1.5-2.9-2 1.9z"/>'),
    actions: ic('<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>'),
    fx: ic('<path d="M3 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M3 16c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>'),
    audio: ic('<path d="M4 10v4h3l4 4V6l-4 4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/>'),
    perf: ic('<path d="M5 19a9 9 0 1 1 14 0"/><path d="M12 13.5L15.5 10"/><circle cx="12" cy="14" r="1.4"/>'),
    protect: ic('<path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z"/>'),
    debug: ic('<circle cx="12" cy="13" r="5"/><path d="M12 8V5M8 9L5.5 6.5M16 9l2.5-2.5M7 13H3.5M20.5 13H17M8.5 17l-2.5 2M15.5 17l2.5 2"/>'),
    live: ic('<circle cx="12" cy="12" r="2"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2"/>'),
  };

  const ACT_LIST = ["shader", "quote", "toast", "menu-open", "menu-close", "menu-toggle", "blur-set",
    "toggle-blur", "bg-next", "bg-prev", "theme-random", "frame-next",
    "sound-toggle", "audio-duck", "tab-goto", "dock-show", "dock-hide",
    "fullscreen", "sparks-storm", "copy-domain", "scroll-top"];
  const SFX_BUILTIN = ["explosion", "ripple", "warp", "glitch", "aurora", "summon", "timestop", "crt", "snowfall", "pulse"];
  const FX_H = ["none", "mp4", "glow", "scan", "shake"];
  const FX_C = ["none", "mp4", "glow", "scan", "shake", "burst"];
  const AMB_LIST = ["none", "float", "glow", "shine", "liquid-glass", "hue"];
  const INT_LIST = ["none", "parallax", "tilt", "magnetic", "spotlight"];
  const EL_KEYS = ["card", "avatar", "username", "bio", "links"];
  const EMOJI_PICKS = ["⭐", "💀", "🔥", "✨", "🎮", "👑", "⚡", "🎧"];
  const EL_RESET = {
    card: { w: 400, radius: 18, rot: 0, x: 0, y: 0, scale: 1 },
    avatar: { w: 112, h: 112, rot: 0, x: 0, y: 0, scale: 1 },
    username: { size: 33, rot: 0, x: 0, y: 0, scale: 1 },
    bio: { size: 14.5, rot: 0, x: 0, y: 0, scale: 1 },
    links: { w: 100, rot: 0, x: 0, y: 0, scale: 1 },
  };
  const GLSL_PLACEHOLDER = `#version 300 es
precision highp float;
uniform float u_time; uniform vec2 u_res; uniform float u_progress;
uniform vec2 u_origin; uniform float u_intensity; uniform vec3 u_accent;
out vec4 fragColor;
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float d = distance(uv, u_origin / u_res);
  float ring = smoothstep(0.02, 0.0, abs(d - u_progress * 0.6));
  fragColor = vec4(u_accent * ring * u_intensity, ring * u_intensity);
}`;

  /* ═══ CONFIG ŞEKLİ (v5.1) ═══ */
  function ensureShape(C) {
    if (Array.isArray(C.tabs)) C.tabs = { style: "animated", list: C.tabs };
    C.tabs = Object.assign({ style: "animated", list: [{ label: "Bağlantılar", type: "links" }] }, C.tabs || {});
    if (!Array.isArray(C.tabs.list) || !C.tabs.list.length) C.tabs.list = [{ label: "Bağlantılar", type: "links" }];
    C.meta = Object.assign({ title: "yakan12 | Bio", description: "", favicon: "assets/favicon.svg" }, C.meta || {});
    C.entry = Object.assign({ hint: "CLICK TO ENTER", note: "ses açık önerilir", showCube: true, cubeSize: 72, cubeSpeed: 10, cubeColor: "" }, C.entry || {});
    /* v5.0: intro */
    C.intro = Object.assign({
      enabled: true, mode: "style", style: "boot", lines: ["SYSTEM READY"],
      elementDelay: 120, bgReveal: "blur", skipOnReload: true, sound: true,
    }, C.intro || {});
    C.intro.video = Object.assign({ sources: [], poster: "", maxMs: 0, lockOthers: false }, C.intro.video || {});
    if (!Array.isArray(C.intro.lines)) C.intro.lines = ["SYSTEM READY"];
    C.profile = C.profile || {};
    C.profile.badges = C.profile.badges || [];
    C.profile.chips = C.profile.chips || [];
    C.profile.avatarShape = ["circle", "rounded", "square", "hex"].includes(C.profile.avatarShape) ? C.profile.avatarShape : "circle";
    delete C.profile.avatar;  /* artefakt temizliği */
    C.avatar = Object.assign({ src: "assets/avatar.jpg", anim: "none" }, C.avatar || {});
    /* v5.1: genişletilmiş theme */
    C.theme = Object.assign({ accent: "#e6b34d", text: "", background: "", icon: "", cardBg: "" }, C.theme || {});
    C.font = Object.assign({ mode: "local", googleFamily: "Cinzel", weights: "400;600" }, C.font || {});
    C.bg = Object.assign({ mode: "video", blur: 6, index: 0, particleStyle: "dust", list: [] }, C.bg || {});
    C.bg.list = C.bg.list || [];
    C.layout = Object.assign({ autofit: true, minScale: .5, maxScale: 1.2, marginY: 84, marginX: 36 }, C.layout || {});
    C.card = Object.assign({ width: 400, radius: 18, blur: 20, opacity: .58 }, C.card || {});
    C.elements = C.elements || {};
    EL_KEYS.forEach(k => {
      C.elements[k] = Object.assign({}, EL_RESET[k], C.elements[k] || {});
      C.elements[k].fx = Object.assign({ ambient: "none", interactive: "none" }, C.elements[k].fx || {});
      C.elements[k].media = Object.assign({ src: "", opacity: .3, blend: "screen" }, C.elements[k].media || {});
    });
    C.fx = Object.assign({ sparks: true, cursor: true, parallax: true, tilt: true, typewriter: true, blips: true, shortcuts: true }, C.fx || {});
    C.perf = Object.assign({ quality: "auto", particleCap: 120, dprCap: 2, renderer: "auto" }, C.perf || {});
    C.debug = Object.assign({ triggers: false, zones: false }, C.debug || {});
    C.audio = Object.assign({ source: "video", defaultVolume: .35 }, C.audio || {});
    C.sounds = Object.assign({ enabled: true, volume: .4, hover: "assets/sounds/hover.mp3", click: "assets/sounds/click.mp3" }, C.sounds || {});
    C.links = C.links || [];
    C.shaders = (Array.isArray(C.shaders) ? C.shaders : []).filter(s => s && s.name && (s.src || s.file));
    C.antiDebug = Object.assign({ rightClick: true, shortcuts: true, debuggerTrap: false, consoleWarn: true }, C.antiDebug || {});
    C.menus = Array.isArray(C.menus) ? C.menus : [];
    C.contextMenu = Object.assign({ enabled: false, menu: "main" }, C.contextMenu || {});
    C.dock = C.dock || { buttons: [] }; C.dock.buttons = C.dock.buttons || [];
    C.zones = (C.zones || []).map(z => {
      if (z.sound) z.sound = {
        files: (Array.isArray(z.sound.files) ? z.sound.files : []).filter(f => typeof f === "string" && f.trim()),
        mode: ["once", "loop", "random"].includes(z.sound.mode) ? z.sound.mode : "once", volume: clampN(z.sound.volume ?? .5, 0, 1)
      };
      if (z.action && z.action.type === "shader" && z.action.params && !z.action.params.mode) z.action.params.mode = "oneshot";
      return z;
    });
    C.triggers = C.triggers || []; C.quotes = C.quotes || [];
    C.lanyard = Object.assign({ enabled: false, discordId: "", showSpotify: true }, C.lanyard || {});
    C.greeting = Object.assign({ enabled: true, template: "{selam} — İmparatorluk saati {saat}" }, C.greeting || {});
    C.cursor = C.cursor || { image: "" }; C.stats = C.stats || { url: "" };
    return C;
  }

  function replaceConfig(src) {
    const C = App().CONFIG;
    Object.keys(C).forEach(k => delete C[k]);
    SenkiApp.util.deepMerge(C, src);
    ensureShape(C);
  }

  function grabObject(text, name) {
    try {
      const m = new RegExp("window\\." + name + "\\s*=").exec(text);
      if (!m) return null;
      const start = text.indexOf("{", m.index + m[0].length);
      if (start < 0) return null;
      let depth = 0, inStr = false, escp = false;
      for (let j = start; j < text.length; j++) {
        const c = text[j];
        if (inStr) { if (escp) escp = false; else if (c === "\\") escp = true; else if (c === '"') inStr = false; continue; }
        if (c === '"') inStr = true;
        else if (c === "{") depth++;
        else if (c === "}") { depth--; if (depth === 0) return JSON.parse(text.slice(start, j + 1)); }
      }
    } catch (_) { }
    return null;
  }

  function auditConfig() {
    const C = App().CONFIG;
    const NS = ["meta", "entry", "intro", "profile", "avatar", "theme", "font", "bg", "layout", "card", "elements", "fx", "perf", "debug",
      "audio", "sounds", "tabs", "links", "shaders", "antiDebug", "contextMenu", "menus", "dock", "zones", "triggers",
      "quotes", "lanyard", "greeting", "cursor", "stats"];
    const missing = NS.filter(k => C[k] === undefined);
    JSON.parse(JSON.stringify(C));
    const deep = {
      chips: Array.isArray(C.profile.chips),
      particleStyle: !!C.bg.particleStyle,
      shortcuts: "shortcuts" in C.fx,
      tabsList: Array.isArray(C.tabs.list),
      zonesSound: (C.zones || []).every(z => !z.sound || Array.isArray(z.sound.files)),
      shadersShape: (C.shaders || []).every(s => s.src || s.file),
      elementsFx: EL_KEYS.every(k => C.elements[k] && C.elements[k].fx && C.elements[k].media),
      antiDebug: !!C.antiDebug, contextMenu: !!C.contextMenu, menus: Array.isArray(C.menus),
      entryShape: !!(C.entry && "hint" in C.entry && "showCube" in C.entry),
      favicon: typeof (C.meta && C.meta.favicon) === "string",
      introShape: !!(C.intro && "style" in C.intro && "lines" in C.intro),
      avatarShape: typeof (C.profile && C.profile.avatarShape) === "string",
      themeShape: typeof (C.theme && C.theme.text) === "string",
    };
    const ok = missing.length === 0 && Object.values(deep).every(Boolean);
    console.info("[senki-audit] ad alanları:", `${NS.length - missing.length}/${NS.length}`,
      "· roundtrip:", ok ? "PASS" : "FAIL", "· eksik:", missing.join(",") || "—", "· detay:", deep);
    return { ok, missing, deep };
  }

  /* ═══ ÇERÇEVE ACİL SİSTEMİ — tesseract canvas ═══ */
  function injectEmergencyFrames() {
    let n = 0;
    try { n = window.SenkiFrames && SenkiFrames.list ? SenkiFrames.list().length : 0; } catch (_) { n = 0; }
    if (n > 0) return false;
    emergencyFrames = true;
    window.SenkiFrames = {
      reg: {
        none: { html: `` },
        ring: { html: `<div class="frx fr-ring"></div>` },
        square: { html: `<div class="frx fr-sq"><i class="d a"></i><i class="d b"></i></div>` },
        hex: { html: `<div class="frx fr-hex"><svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible"><polygon class="h1" points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5"/><polygon class="h2" points="50,22 74,36 74,64 50,78 26,64 26,36"/></svg></div>` },
        orbit: { html: `<div class="frx fr-orbit"><div class="ob o1"><i class="pl"></i></div><div class="ob o2"><i class="pl p2"></i></div></div>` },
        tesseract: {
          front: `<div class="frx fr-full fr-tess4" style="inset:calc(var(--av-sz,112px)*-.42)"></div>`,
          init(slot, front) {
            const host = front && front.querySelector(".fr-tess4"); if (!host) return null;
            const cv = document.createElement("canvas");
            cv.className = "fr-cv";
            host.appendChild(cv);
            const ctx = cv.getContext("2d");
            const dpr = Math.min(devicePixelRatio || 1, 2);
            const fit = () => {
              const W = host.clientWidth || 112, H = host.clientHeight || 112;
              cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
              cv.style.width = W + "px"; cv.style.height = H + "px";
              ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
              return [W, H];
            };
            let W, H;
            const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
            const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
            const accent = (getComputedStyle(host).color || "").trim() || "#e6b34d";
            let raf = 0;
            const frame = (ts) => {
              const t = ts / 1000;
              [W, H] = fit();
              ctx.clearRect(0, 0, W, H);
              for (const c of [{ s: .40, sp: .3, dir: 1, tilt: -.38, a0: 0, base: .34 }, { s: .30, sp: .5, dir: -1, tilt: .46, a0: 1.2, base: .58 }]) {
                const ry = c.a0 + t * c.sp * c.dir, rx = c.tilt;
                const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
                const s = W * c.s, F = 9;
                const P = V.map(([x, y, z]) => {
                  const X = x * cy + z * sy, Z1 = -x * sy + z * cy;
                  const Y = y * cx - Z1 * sx, Z2 = y * sx + Z1 * cx;
                  const p = F / (F + Z2);
                  return { x: W / 2 + X * s * p, y: W / 2 + Y * s * p, z: Z2 };
                });
                for (const [a, b] of E) {
                  const near = Math.max(0, Math.min(1, (1.8 - (P[a].z + P[b].z) / 2) / 3.6));
                  ctx.globalAlpha = c.base * (.35 + .65 * near);
                  ctx.strokeStyle = accent;
                  ctx.lineWidth = (c.s > .35 ? 1.6 : 1.3) * (.75 + .55 * near);
                  ctx.lineCap = "round";
                  ctx.beginPath(); ctx.moveTo(P[a].x, P[a].y); ctx.lineTo(P[b].x, P[b].y); ctx.stroke();
                }
              }
              ctx.globalAlpha = 1;
              raf = requestAnimationFrame(frame);
            };
            raf = requestAnimationFrame(frame);
            return { destroy() { cancelAnimationFrame(raf); cv.remove(); } };
          }
        },
      },
      list: function () { return Object.keys(this.reg); },
    };
    console.error("[senki-editör] ⚠ js/frames.js YÜKLENEMEDİ — 6 ACİL çerçeve devrede.",
      "Doğrula: node --check js/frames.js · Ctrl+F5.");
    return true;
  }

  /* ═══ AÇ/KAPA ═══ */
  function setOpen(v) {
    if (!shell) return;
    const open = !!v;
    shell.classList.toggle("open", open);
    if (badge) badge.style.display = open ? "none" : "";
    if (lastOpen !== open) {
      lastOpen = open;
      setTimeout(() => { safeApply(() => { if (App() && App().fit) App().fit(true); }); }, 400);
    }
  }

  /* ═══════════ BÖLÜM GÖVDELERİ ═══════════ */
  const SECTIONS = [];

  /* ---- KİMLİK (+ giriş perdesi + favicon + intro) ---- */
  SECTIONS.push({
    id: "identity", icon: RIC.identity, title: "Kimlik",
    html: () => `
      <label>Sayfa başlığı<input id="ed-title" type="text"></label>
      <label>Açıklama (SEO/OG)<input id="ed-desc" type="text" placeholder="meta description"></label>
      <label>Kullanıcı adı<input id="ed-username" type="text"></label>
      <label>Etiket (division)<input id="ed-divanc" type="text"></label>
      <label>Bio<textarea id="ed-bio" rows="3"></textarea></label>
      <label>Chips (ad altı satır)<div id="ed-chip-rows"></div></label>
      <button id="ed-chip-add" class="ed-mini" style="width:100%">+ Chip</button>
      <p class="ed-hint">Chip metni: serbest, <code>{time}</code> ziyaretçi lokal saati, <code>{stats}</code> dış sayaç.</p>
      <hr class="ed-hr">
      <div class="ed-sfx-cap">GİRİŞ PERDESİ</div>
      <label>Hint metni<input id="ed-entry-hint" type="text" placeholder="CLICK TO ENTER"></label>
      <label>Not metni<input id="ed-entry-note" type="text" placeholder="ses açık önerilir"></label>
      <label class="ed-switch"><input type="checkbox" id="ed-entry-cube"><i></i><span>Dönen küpü göster</span></label>
      <label><span class="ed-lt">Küp boyutu <b id="v-cube-sz"></b></span><input id="ed-cube-sz" type="range" min="28" max="140" step="4"></label>
      <label><span class="ed-lt">Küp hızı (sn/tur) <b id="v-cube-sp"></b></span><input id="ed-cube-sp" type="range" min="3" max="40" step="1"></label>
      <label>Küp rengi<span class="ed-inline"><input id="ed-cube-color" type="color"><code id="ed-cube-hex"></code></span></label>
      <hr class="ed-hr">
      <div class="ed-sfx-cap">FAVICON</div>
      <div class="ed-inline" style="margin-bottom:6px">
        <img id="ed-favicon-prev" class="ed-favicon-prev" alt="favicon önizleme">
        <input id="ed-favicon" type="text" placeholder="assets/favicon.svg">
      </div>
      <p class="ed-hint">Boş bırakılırsa varsayılan <code>assets/favicon.svg</code>.</p>
      <hr class="ed-hr">
      <div class="ed-sfx-cap">İNTERAKTİF İNTRO</div>
      <label class="ed-switch"><input type="checkbox" id="ed-intro-en"><i></i><span>İntro açılış animasyonu</span></label>
      <label class="ed-switch"><input type="checkbox" id="ed-intro-lock"><i></i><span>Video varsa diğer intro ayarlarını kilitle</span></label>
      <label>Mod<select id="ed-intro-mode">
        <option value="style">Tarz — hazır efektlerden biri</option>
        <option value="video">Video / animasyonlu WebP</option>
      </select></label>
      <label>Video kaynakları (her satır bir dosya; tarayıcı çözebildiğini seçer)<textarea id="ed-intro-vsrc" rows="3" placeholder="assets/intro-av1.webm&#10;assets/intro-hevc.mp4&#10;assets/intro-h264.mp4"></textarea></label>
      <p class="ed-hint" id="ed-intro-vhint">MP4 (H.264 / H.265 + AAC), WebM (AV1 / VP9 + Opus), animasyonlu WebP/GIF.</p>
      <label>Tarz<select id="ed-intro-style">${introStyleOptions()}</select></label>
      <label>Metinler (her satır ayrı)<textarea id="ed-intro-lines" rows="3" placeholder="Her satır tek tek yazılır"></textarea></label>
      <label><span class="ed-lt">Element gecikmesi <b id="v-intro-delay"></b></span><input id="ed-intro-delay" type="range" min="50" max="500" step="10"></label>
      <label>Arka plan açılışı<select id="ed-intro-bg">
        <option value="blur">Blur'dan netleş</option>
        <option value="fade">Fade</option>
        <option value="frames">Kare kare</option>
        <option value="wipe">Wipe (yukarıdan)</option>
        <option value="none">Yok — arka plan hemen görünür</option>
      </select></label>
      <label class="ed-switch"><input type="checkbox" id="ed-intro-reload"><i></i><span>Yenilemede atla (bir kez oynar)</span></label>
      <label class="ed-switch"><input type="checkbox" id="ed-intro-sound"><i></i><span>Ses efektleri</span></label>
      <button id="ed-intro-test" class="ed-btn" style="width:100%">▶ Intro'yu Test Et</button>`,
    bind() {
      q("ed-title").addEventListener("input", e => { App().CONFIG.meta.title = e.target.value; App().applyTexts(); });
      q("ed-desc").addEventListener("input", e => { App().CONFIG.meta.description = e.target.value; App().applyTexts(); });
      q("ed-username").addEventListener("input", e => { App().CONFIG.profile.username = e.target.value; App().applyTexts(); });
      q("ed-divanc").addEventListener("input", e => { App().CONFIG.profile.division = e.target.value; App().applyTexts(); });
      q("ed-bio").addEventListener("input", e => { App().CONFIG.profile.bio = e.target.value; App().applyBio(); });
      /* giriş perdesi */
      q("ed-entry-hint").addEventListener("input", e => { App().CONFIG.entry.hint = e.target.value; safeApply(() => App().applyEntry && App().applyEntry()); });
      q("ed-entry-note").addEventListener("input", e => { App().CONFIG.entry.note = e.target.value; safeApply(() => App().applyEntry && App().applyEntry()); });
      q("ed-entry-cube").addEventListener("change", e => { App().CONFIG.entry.showCube = e.target.checked; safeApply(() => App().applyEntry && App().applyEntry()); });
      q("ed-cube-sz").addEventListener("input", e => { App().CONFIG.entry.cubeSize = parseInt(e.target.value, 10); q("v-cube-sz").textContent = e.target.value + "px"; safeApply(() => App().applyEntry && App().applyEntry()); });
      q("ed-cube-sp").addEventListener("input", e => { App().CONFIG.entry.cubeSpeed = parseInt(e.target.value, 10); q("v-cube-sp").textContent = e.target.value + "s"; safeApply(() => App().applyEntry && App().applyEntry()); });
      q("ed-cube-color").addEventListener("input", e => { App().CONFIG.entry.cubeColor = e.target.value; q("ed-cube-hex").textContent = e.target.value; safeApply(() => App().applyEntry && App().applyEntry()); });
      /* favicon */
      q("ed-favicon").addEventListener("input", e => {
        const v = e.target.value.trim();
        App().CONFIG.meta.favicon = v;
        safeApply(() => App().applyMeta && App().applyMeta());
        const p = q("ed-favicon-prev");
        if (p) { p.src = v || "assets/favicon.svg"; p.style.opacity = ""; }
      });
      /* v5.0: intro */
      q("ed-intro-en").addEventListener("change", e => { App().CONFIG.intro.enabled = e.target.checked; });
      q("ed-intro-style").addEventListener("change", e => { App().CONFIG.intro.style = e.target.value; });
      q("ed-intro-mode").addEventListener("change", e => { App().CONFIG.intro.mode = e.target.value; applyIntroLock(document); });
      q("ed-intro-vsrc").addEventListener("input", e => {
        App().CONFIG.intro.video = Object.assign({}, App().CONFIG.intro.video || {}, {
          sources: e.target.value.split("\n").map(l => l.trim()).filter(Boolean) });
        applyIntroLock(document);
      });
      q("ed-intro-lock").addEventListener("change", e => {
        App().CONFIG.intro.video = Object.assign({}, App().CONFIG.intro.video || {}, { lockOthers: e.target.checked });
        applyIntroLock(document);
      });
      q("ed-intro-lines").addEventListener("input", e => {
        App().CONFIG.intro.lines = e.target.value.split("\n").filter(l => l.trim());
      });
      q("ed-intro-delay").addEventListener("input", e => {
        App().CONFIG.intro.elementDelay = parseInt(e.target.value, 10);
        q("v-intro-delay").textContent = e.target.value + "ms";
      });
      q("ed-intro-bg").addEventListener("change", e => { App().CONFIG.intro.bgReveal = e.target.value; });
      q("ed-intro-reload").addEventListener("change", e => { App().CONFIG.intro.skipOnReload = e.target.checked; });
      q("ed-intro-sound").addEventListener("change", e => { App().CONFIG.intro.sound = e.target.checked; });
      q("ed-intro-test").addEventListener("click", () => {
        if (window.SenkiIntro) {
          document.body.classList.add("intro-active");
          SenkiIntro.start(App().CONFIG.intro);
        } else { App().toast("intro.js yüklenmemiş", "err"); }
      });
      /* chips */
      const rows = q("ed-chip-rows");
      rows.addEventListener("input", (e) => {
        const row = e.target.closest(".ed-row"); if (!row) return;
        const c = App().CONFIG.profile.chips[+row.dataset.i]; if (!c) return;
        if (e.target.classList.contains("ed-cic")) c.icon = e.target.value;
        if (e.target.classList.contains("ed-ctx")) c.text = e.target.value;
        App().applyChips();
      });
      rows.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-act]"); if (!btn) return;
        App().CONFIG.profile.chips.splice(+e.target.closest(".ed-row").dataset.i, 1);
        renderChipRows(); App().applyChips();
      });
      q("ed-chip-add").addEventListener("click", () => {
        App().CONFIG.profile.chips.push({ icon: "⭐", text: "yeni" });
        renderChipRows(); App().applyChips();
      });
    }
  });
  function renderChipRows() {
    const rows = box("ed-chip-rows"); if (!rows) return;
    rows.innerHTML = "";
    (App().CONFIG.profile.chips || []).forEach((c, i) => {
      const row = document.createElement("div");
      row.className = "ed-row"; row.dataset.i = i;
      row.innerHTML = `
        <div class="ed-r1" style="grid-template-columns:56px 1fr auto">
          <input class="ed-cic" value="${esc(c.icon || "")}" placeholder="📍">
          <input class="ed-ctx" value="${esc(c.text || "")}" placeholder="metin / {time} / {stats}">
          <span class="ed-acts"><button data-act="del" class="danger">${SVG.cross}</button></span>
        </div>`;
      rows.appendChild(row);
    });
  }

  /* ---- AVATAR & ÇERÇEVELER ---- */
  SECTIONS.push({
    id: "avatar", icon: RIC.avatar, title: "Avatar · Çerçeveler",
    html: () => `
      <div id="ed-fr-warn" class="ed-warn" hidden>
        ⚠ <span><b>js/frames.js yüklenemedi</b> — 6 ACİL çerçeve devrede (tanı amaçlı).
        <code>node --check js/frames.js</code>, <b>Ctrl+F5</b>, sonra ↻.
      </div>
      <label>Görsel / video yolu<input id="ed-avatar" type="text" placeholder="assets/avatar.jpg · .gif · .mp4 · .webm"></label>
      <label>Avatar animasyonu<select id="ed-av-anim">
        <option value="none">Yok</option><option value="breathe">Nefes (ölçek)</option>
        <option value="float">Süzülme</option><option value="glowpulse">Parlama</option>
        <option value="kenburns">Yavaş pan (Ken Burns)</option></select></label>
      <label>Avatar şekli<select id="ed-avatar-shape">
        <option value="circle">Daire (varsayılan)</option>
        <option value="rounded">Yuvarlatılmış köşe</option>
        <option value="square">Kare</option>
        <option value="hex">Altıgen</option>
      </select></label>
      <div class="ed-fr-head"><span>ÇERÇEVELER (<b id="ed-fr-count">…</b>)</span>
        <button id="ed-fr-refresh" class="ed-sfx-mini" title="Listeyi yenile">↻</button></div>
      <div id="ed-frgal" class="fr-gal"></div>
      <p class="ed-hint"><b>B</b>=arka · <b>F</b>=ön · <b>O</b>=overlay. Partiküllüler PRNG canvas. .gif avatar: animasyonlu img, ses YOK.</p>`,
    bind() {
      q("ed-avatar").addEventListener("input", e => { App().CONFIG.avatar.src = e.target.value.trim(); App().Avatar.setMedia(App().CONFIG.avatar.src); });
      q("ed-av-anim").addEventListener("change", e => { App().CONFIG.avatar.anim = e.target.value; App().Avatar.setAnim(e.target.value); });
      q("ed-avatar-shape").addEventListener("change", e => {
        App().CONFIG.profile.avatarShape = e.target.value;
        App().Avatar.setFrame(App().CONFIG.profile.avatarFrame || "ring");
      });
      q("ed-fr-refresh").addEventListener("click", () => { renderFrameGallery(); App().toast("çerçeve listesi yenilendi"); });
    }
  });
  function layersOf(name) {
    const d = (window.SenkiFrames && SenkiFrames.reg && SenkiFrames.reg[name]) || {};
    return (d.html ? "B" : "") + (d.front ? "F" : "") + (d.overlay ? "O" : "");
  }
  function renderFrameGallery() {
    const g = box("ed-frgal"); if (!g) return;
    let F = [];
    try { F = App().frames(); } catch (_) { F = []; }
    const cnt = q("ed-fr-count"); if (cnt) cnt.textContent = F.length;
    const warn = q("ed-fr-warn"); if (warn) warn.hidden = !(emergencyFrames || F.length === 0);
    g.innerHTML = "";
    if (!F.length) return;
    const cur = App().CONFIG.profile.avatarFrame || "ring";
    F.forEach(name => {
      const L = layersOf(name);
      const b = document.createElement("button");
      b.className = name === cur ? "on" : "";
      b.innerHTML = `<span class="frp${name === "orrery" || name === "summon" ? " orr" : ""}"></span>${esc(name)}
        <span class="frp-badges">${[...L].map(l => `<i class="frp-b${l.toLowerCase()}">${l}</i>`).join("")}</span>`;
      b.title = "Çerçeve: " + name + " · katman: " + (L || "—");
      b.addEventListener("click", () => {
        App().CONFIG.profile.avatarFrame = name;
        if (App().Avatar) App().Avatar.setFrame(name);
        renderFrameGallery();
      });
      g.appendChild(b);
    });
  }

  /* ---- ROZETLER ---- */
  SECTIONS.push({
    id: "badges", icon: RIC.badges, title: "Rozetler",
    html: () => `
      <div id="ed-badge-rows"></div>
      <button id="ed-badge-add" class="ed-btn" style="width:100%">+ Rozet ekle</button>
      <p class="ed-hint">◆ gömülü ikon ızgarası; yoksa emoji/metin VEYA <code>assets/badges/x.png</code>. Anim: none|pulse|spin|shine|bounce.</p>`,
    bind() {
      const rows = q("ed-badge-rows");
      rows.addEventListener("input", (e) => {
        const row = e.target.closest(".ed-row"); if (!row) return;
        const b = App().CONFIG.profile.badges[+row.dataset.i]; if (!b) return;
        const cl = e.target.classList;
        if (cl.contains("ed-bic")) b.icon = e.target.value.trim() || "shield";
        if (cl.contains("ed-bti")) b.title = e.target.value;
        if (cl.contains("ed-bcol")) b.color = e.target.value;
        App().applyBadges();
      });
      rows.addEventListener("change", (e) => {
        if (!e.target.classList.contains("ed-ban")) return;
        const b = App().CONFIG.profile.badges[+e.target.closest(".ed-row").dataset.i];
        if (b) { b.anim = e.target.value; App().applyBadges(); }
      });
      rows.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-act]"); if (!btn) return;
        const row = e.target.closest(".ed-row");
        const b = App().CONFIG.profile.badges[+row.dataset.i]; if (!b) return;
        if (btn.dataset.act === "del") { App().CONFIG.profile.badges.splice(+row.dataset.i, 1); renderBadgeRows(); App().applyBadges(); return; }
        if (btn.dataset.act === "icons") {
          const bx = row.querySelector(".ed-big");
          bx.hidden = !bx.hidden;
          if (!bx.hidden) bx.innerHTML = iconGridHTML(b.icon);
        }
        const icb = e.target.closest("button[data-ic]");
        if (icb) { b.icon = icb.dataset.ic; App().applyBadges(); renderBadgeRows(); }
      });
      q("ed-badge-add").addEventListener("click", () => {
        App().CONFIG.profile.badges.push({ icon: "⭐", title: "Yeni rozet", anim: "pulse", color: "" });
        renderBadgeRows(); App().applyBadges();
      });
    }
  });
  function iconGridHTML(cur) {
    const keys = App().iconKeys ? App().iconKeys() : [];
    return `<div class="ed-icons">${keys.map(k => `<button data-ic="${esc(k)}" title="${esc(k)}" class="${k === cur ? "on" : ""}">${App().icons[k]}</button>`).join("")}${EMOJI_PICKS.map(e => `<button data-ic="${esc(e)}" title="emoji">${e}</button>`).join("")}</div>`;
  }
  function renderBadgeRows() {
    const rows = box("ed-badge-rows"); if (!rows) return;
    rows.innerHTML = "";
    (App().CONFIG.profile.badges || []).forEach((b, i) => {
      const row = document.createElement("div");
      row.className = "ed-row"; row.dataset.i = i;
      row.innerHTML = `
        <div class="ed-r1">
          <input class="ed-bic" value="${esc(b.icon)}" placeholder="⭐/anahtar/png">
          <input class="ed-bti" value="${esc(b.title || "")}" placeholder="Başlık (tooltip)">
          <span class="ed-acts">
            <button data-act="icons" title="İkon seç">◆</button>
            <button data-act="del" class="danger">${SVG.cross}</button>
          </span>
        </div>
        <div class="ed-r2">
          <select class="ed-ban">${opt("none", "Anim: yok", b.anim)}${opt("pulse", "Anim: nabız", b.anim)}${opt("spin", "Anim: dönüş", b.anim)}${opt("shine", "Anim: parlama", b.anim)}${opt("bounce", "Anim: zıplama", b.anim)}</select>
          <input class="ed-bcol" type="color" value="${/^#[0-9a-f]{6}$/i.test(b.color || "") ? b.color : "#e6b34d"}" title="Renk (boş = tema)">
        </div>
        <div class="ed-big" hidden></div>`;
      rows.appendChild(row);
    });
  }

  /* ---- SHADER FX ---- */
  SECTIONS.push({
    id: "shader", icon: RIC.shader, title: "Shader FX",
    html: () => `
      <div class="ed-sfx">
        <div>
          <div class="ed-sfx-cap">HAZIR EFEKTLER (<b id="ed-sfx-count">…</b>)</div>
          <div class="ed-sfx-list" id="ed-sfx-list"></div>
          <div class="ed-sfx-cap" style="margin-top:12px">ÖZEL SHADERLAR (<b id="ed-sfx-ccount">…</b>)</div>
          <div class="ed-sfx-list" id="ed-sfx-custom-list"></div>
        </div>
        <div class="ed-sfx-custom">
          <label>Mod (önizleme)<select id="ed-sfx-mode">
            <option value="oneshot">oneshot — süreyi oynar, biter</option>
            <option value="toggle">toggle — zone oturumu</option>
            <option value="switch">switch — kalıcı aç/kapa</option></select></label>
          <label><span class="ed-lt">Duration <b id="v-sfx-d"></b></span><input id="ed-sfx-d" type="range" min="0.5" max="10" step="0.5"></label>
          <label><span class="ed-lt">Intensity <b id="v-sfx-i"></b></span><input id="ed-sfx-i" type="range" min="0" max="1" step="0.05"></label>
          <button id="ed-sfx-play" class="ed-btn" style="width:100%">▶ Uygula</button>
          <p class="ed-sfx-note">Sol: gömülü 10 efekt (GLSL+WGSL). Tek shader aynı anda.</p>
          <hr class="ed-hr">
          <label>Özel shader adı<input id="ed-sfx-name" type="text" placeholder="benimEfektim"></label>
          <textarea id="ed-sfx-src" rows="7" placeholder="${esc(GLSL_PLACEHOLDER)}"></textarea>
          <label>VEYA dosya (own-origin)<input id="ed-sfx-file" type="text" placeholder="assets/shaders/deneme.frag"></label>
          <button id="ed-sfx-compile" class="ed-btn primary" style="width:100%">Derle ve Kaydet</button>
          <p class="ed-sfx-note">Inline: GLSL veya WGSL; Shadertoy mainImage() de kabul edilir. Dosya: yalnız <code>assets/shaders/</code>. Kaydet'te dosya da derlenir.</p>
        </div>
      </div>`,
    bind() {
      q("ed-sfx-d").addEventListener("input", fillSfxSliders);
      q("ed-sfx-i").addEventListener("input", fillSfxSliders);
      q("ed-sfx-play").addEventListener("click", () => playShader(sfxSel));
      q("ed-sfx-compile").addEventListener("click", saveCustomShader);
    }
  });
  function shaderNames() { return [...SFX_BUILTIN, ...(App().CONFIG.shaders || []).map(s => s.name)]; }
  function renderSfxList() {
    const list = box("ed-sfx-list"); if (!list) return;
    list.innerHTML = "";
    const cnt = q("ed-sfx-count"); if (cnt) cnt.textContent = SFX_BUILTIN.length;
    SFX_BUILTIN.forEach(name => {
      const row = document.createElement("div");
      row.className = "ed-sfx-row" + (name === sfxSel ? " on" : "");
      row.innerHTML = `<span>${esc(name)}</span>`;
      const pb = document.createElement("button");
      pb.className = "ed-sfx-mini"; pb.textContent = "▶"; pb.title = "Önizle";
      pb.addEventListener("click", (e) => { e.stopPropagation(); playShader(name); });
      row.appendChild(pb);
      row.addEventListener("click", () => { sfxSel = name; renderSfxList(); });
      list.appendChild(row);
    });
  }
  function renderSfxCustomList() {
    const bx = box("ed-sfx-custom-list"); if (!bx) return;
    const S = (App().CONFIG.shaders || []);
    const cnt = q("ed-sfx-ccount"); if (cnt) cnt.textContent = S.length;
    bx.innerHTML = S.length ? "" : `<span class="ed-hint">henüz özel shader yok — sağdan derleyip ekle</span>`;
    S.forEach((s) => {
      const row = document.createElement("div");
      row.className = "ed-sfx-row";
      row.innerHTML = `<span>${esc(s.name)}${s.file ? " <small style='opacity:.5'>(dosya)</small>" : ""}</span>`;
      const play = document.createElement("button");
      play.className = "ed-sfx-mini"; play.textContent = "▶"; play.title = "Oynat";
      play.addEventListener("click", () => playShader(s.name));
      const del = document.createElement("button");
      del.className = "ed-sfx-mini"; del.textContent = "✕"; del.title = "Sil";
      del.addEventListener("click", () => {
        const ix = App().CONFIG.shaders.findIndex(x => x.name === s.name);
        if (ix >= 0) App().CONFIG.shaders.splice(ix, 1);
        if (sfxSel === s.name) { sfxSel = "explosion"; renderSfxList(); }
        renderSfxCustomList();
      });
      row.append(play, del);
      bx.appendChild(row);
    });
  }
  function playShader(name) {
    if (!App().ShaderFX) { App().toast("ShaderFX modülü yok — main.js v5 yüklenmemiş", "err"); return; }
    App().runAction({
      type: "shader", params: {
        name, duration: parseFloat((q("ed-sfx-d") || {}).value) || 3,
        intensity: parseFloat((q("ed-sfx-i") || {})).value ?? 1,
        at: "center", mode: (q("ed-sfx-mode") || {}).value || "oneshot"
      }
    });
  }
  function fillSfxSliders() {
    const d = q("ed-sfx-d"), i = q("ed-sfx-i");
    if (q("v-sfx-d") && d) q("v-sfx-d").textContent = d.value + "s";
    if (q("v-sfx-i") && i) q("v-sfx-i").textContent = Math.round(parseFloat(i.value) * 100) + "%";
  }
  function saveCustomShader() {
    const name = q("ed-sfx-name").value.trim().replace(/\s+/g, "-");
    const src = q("ed-sfx-src").value;
    const file = q("ed-sfx-file").value.trim();
    if (!name) { App().toast("Shader adı gerekli", "err"); return; }
    if (!src.trim() && !file) { App().toast("GLSL kaynak veya dosya yolu gerekli", "err"); return; }
    if (file && (/^(https?:)?\/\//i.test(file) || /^data:/i.test(file) || /^[a-z]+:\/\//i.test(file))) {
      App().toast("Dosya yolu yalnız aynı-kökenli olabilir", "err"); return;
    }
    const C = App().CONFIG.shaders;
    const put = (entry) => { const ix = C.findIndex(s => s.name === name); if (ix >= 0) C[ix] = entry; else C.push(entry); };
    if (src.trim()) {
      if (!App().ShaderFX) { App().toast("ShaderFX yok — derleme kontrolü yapılamadı", "err"); return; }
      const verdict = App().ShaderFX.compileCheck(name, src);
      if (verdict === true) { put({ name, src }); App().toast(`Shader '${name}' kaydedildi`); renderSfxCustomList(); renderSfxList(); }
      else { console.info("[shader]", name, verdict); App().toast("Shader derlenemedi — konsol loguna bak", "err"); }
    } else {
      put({ name, file });
      App().toast(`'${name}' kaydedildi — dosya derleniyor…`);
      fetch(file)
        .then(r => { if (!r.ok) throw 0; return r.text(); })
        .then(txt => {
          const verdict = App().ShaderFX.compileCheck(name, txt);
          if (verdict === true) App().toast(`Shader '${name}' derlendi ✓`);
          else { console.info("[shader]", name, verdict); App().toast(`'${name}' derlenemedi — konsola bak`, "err"); }
          renderSfxCustomList(); renderSfxList();
        })
        .catch(() => App().toast(`'${name}' dosyası okunamadı`, "err"));
    }
  }

  /* ---- LİNKLER ---- */
  SECTIONS.push({
    id: "links", icon: RIC.links, title: "Linkler & Aksiyonlar",
    html: () => `
      <div id="ed-link-rows"></div>
      <button id="ed-add-link" class="ed-btn" style="width:100%">+ Buton ekle</button>
      <p class="ed-hint">fx yalnız görseldir (.mp4 VEYA .gif). 'Aksiyon: shader' → mod/name/duration/intensity. menu-open → menü kimliği.</p>`,
    bind() { bindLinkRows(); }
  });
  function linkBehavior(l) { if (l.action) return "a:" + (typeof l.action === "object" ? l.action.type : l.action); if (l.url) return "url"; if (l.copy) return "copy"; return "url"; }
  function linkParamValue(l) {
    if (l.url) return l.url; if (l.copy) return l.copy;
    if (typeof l.action === "object") { const p = l.action.params || {}; return p.url || p.menu || p.text || p.index || p.name || ""; }
    return "";
  }
  function renderLinkRows() {
    const rows = box("ed-link-rows"); if (!rows) return;
    const L = App().CONFIG.links;
    rows.innerHTML = "";
    L.forEach((l, i) => {
      const b = linkBehavior(l);
      const isShader = b === "a:shader";
      if (!l.fx) l.fx = { hover: { type: "none" }, click: { type: "none" } };
      const shp = (isShader && l.action.params) || {};
      const row = document.createElement("div");
      row.className = "ed-row"; row.dataset.i = i;
      row.innerHTML = `
        <div class="ed-r1">
          <input class="ed-ic" value="${esc(l.icon || l.type || "")}" title="İkon anahtarı VEYA emoji" placeholder="🔗">
          <input class="ed-lb" value="${esc(l.label)}" placeholder="Etiket">
          <span class="ed-acts">
            <button data-act="up" ${i === 0 ? "disabled" : ""}>${SVG.up}</button>
            <button data-act="down" ${i === L.length - 1 ? "disabled" : ""}>${SVG.down}</button>
            <button data-act="del" class="danger">${SVG.cross}</button>
          </span>
        </div>
        <div class="ed-r2">
          <select class="ed-kind">${opt("url", "URL açar", b)}${opt("copy", "Panoya kopyalar", b)}${ACT_LIST.map(a => opt("a:" + a, "Aksiyon: " + a, b)).join("")}</select>
          <input class="ed-val" value="${esc(linkParamValue(l))}" placeholder="https://… / metin / menü / shader adı">
        </div>
        ${isShader ? `
        <div class="ed-grid2">
          <label>Mod<select class="ed-shmode">${opt("oneshot", "oneshot", shp.mode || "oneshot")}${opt("toggle", "toggle", shp.mode || "oneshot")}${opt("switch", "switch", shp.mode || "oneshot")}</select></label>
          <label>Shader<select class="ed-shn">${shaderNames().map(n => opt(n, n, shp.name)).join("")}</select></label>
        </div>
        <div class="ed-grid2">
          <label><span class="ed-lt">Duration <b class="v-shd">${shp.duration ?? 3}s</b></span><input class="ed-shd" type="range" min="0.5" max="10" step="0.5" value="${shp.duration ?? 3}"></label>
          <label><span class="ed-lt">Intensity <b class="v-shi">${Math.round((shp.intensity ?? 1) * 100)}%</b></span><input class="ed-shi" type="range" min="0" max="1" step="0.05" value="${shp.intensity ?? 1}"></label>
        </div>` : ""}
        <div class="ed-r2">
          <select class="ed-fxh">${FX_H.map(t => opt(t, "hover: " + t, l.fx.hover.type)).join("")}</select>
          <input class="ed-fxhs" value="${esc(l.fx.hover.src || "")}" placeholder="assets/fx/hover.mp4 VEYA .gif">
        </div>
        <div class="ed-r2">
          <select class="ed-fxc">${FX_C.map(t => opt(t, "click: " + t, l.fx.click.type)).join("")}</select>
          <input class="ed-fxcs" value="${esc(l.fx.click.src || "")}" placeholder="assets/fx/click.mp4 VEYA .gif">
        </div>`;
      rows.appendChild(row);
    });
  }
  function bindLinkRows() {
    const rows = q("ed-link-rows");
    rows.addEventListener("input", (e) => {
      const row = e.target.closest(".ed-row"); if (!row) return;
      const l = App().CONFIG.links[+row.dataset.i]; if (!l) return;
      const cl = e.target.classList;
      if (cl.contains("ed-ic")) { l.icon = e.target.value.trim() || "link"; delete l.type; }
      if (cl.contains("ed-lb")) l.label = e.target.value;
      if (cl.contains("ed-val")) {
        const v = e.target.value, b = linkBehavior(l);
        if (b === "url") l.url = v;
        else if (b === "copy") l.copy = v;
        else if (typeof l.action === "object") {
          l.action.params = l.action.params || {};
          const t = l.action.type;
          if (t === "link" || "url" in l.action.params) l.action.params.url = v;
          else if (t === "shader") l.action.params.name = v;
          else if (t === "menu-open" || t === "menu-toggle" || t === "menu-close") l.action.params.menu = v;
          else if (t === "tab-goto") l.action.params.index = v;
          else l.action.params.text = v;
        }
      }
      if (cl.contains("ed-shd")) { l.action.params = l.action.params || {}; l.action.params.duration = parseFloat(e.target.value); row.querySelector(".v-shd").textContent = e.target.value + "s"; }
      if (cl.contains("ed-shi")) { l.action.params = l.action.params || {}; l.action.params.intensity = parseFloat(e.target.value); row.querySelector(".v-shi").textContent = Math.round(e.target.value * 100) + "%"; }
      if (cl.contains("ed-fxhs")) { l.fx = l.fx || { hover: {}, click: {} }; l.fx.hover = Object.assign({}, l.fx.hover, { src: e.target.value.trim() }); }
      if (cl.contains("ed-fxcs")) { l.fx = l.fx || { hover: {}, click: {} }; l.fx.click = Object.assign({}, l.fx.click, { src: e.target.value.trim() }); }
      App().rebuildLinks(); App().fit();
    });
    rows.addEventListener("change", (e) => {
      const row = e.target.closest(".ed-row"); if (!row) return;
      const l = App().CONFIG.links[+row.dataset.i]; if (!l) return;
      const cl = e.target.classList;
      if (cl.contains("ed-kind")) {
        const v = e.target.value, val = row.querySelector(".ed-val").value;
        if (!l.icon && l.type) l.icon = l.type;
        delete l.url; delete l.copy; delete l.action; delete l.type;
        if (v === "url") l.url = val || "https://";
        else if (v === "copy") l.copy = val || "kullanıcı";
        else l.action = { type: v.slice(2), params: v === "a:link" ? { url: val } : (v === "a:shader" ? { name: (shaderNames()[0] || "explosion"), duration: 3, intensity: 1, mode: "oneshot" } : (v === "a:tab-goto" ? { index: val || "0" } : (val ? { menu: val, text: val } : {}))) };
        renderLinkRows();
      }
      if (cl.contains("ed-shmode")) { l.action.params = l.action.params || {}; l.action.params.mode = e.target.value; }
      if (cl.contains("ed-shn")) { l.action.params = l.action.params || {}; l.action.params.name = e.target.value; }
      if (cl.contains("ed-fxh")) { l.fx = l.fx || { hover: {}, click: {} }; l.fx.hover = { type: e.target.value, src: (l.fx.hover && l.fx.hover.src) || "" }; renderLinkRows(); }
      if (cl.contains("ed-fxc")) { l.fx = l.fx || { hover: {}, click: {} }; l.fx.click = { type: e.target.value, src: (l.fx.click && l.fx.click.src) || "" }; renderLinkRows(); }
      App().rebuildLinks(); App().fit();
    });
    rows.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]"); if (!btn) return;
      const i = +e.target.closest(".ed-row").dataset.i, L = App().CONFIG.links;
      if (btn.dataset.act === "up" && i > 0) [L[i - 1], L[i]] = [L[i], L[i - 1]];
      if (btn.dataset.act === "down" && i < L.length - 1) [L[i + 1], L[i]] = [L[i], L[i + 1]];
      if (btn.dataset.act === "del") L.splice(i, 1);
      renderLinkRows(); App().rebuildLinks(); App().fit();
    });
    q("ed-add-link").addEventListener("click", () => {
      App().CONFIG.links.push({ label: "Yeni Buton", icon: "✨", action: { type: "toast", params: { text: "merhaba" }, fx: { hover: { type: "none" }, click: { type: "burst" } } } });
      renderLinkRows(); App().rebuildLinks(); App().fit();
    });
  }

  /* ---- TEMA (+v5.1 renkler) ---- */
  SECTIONS.push({
    id: "theme", icon: RIC.theme, title: "Tema & Yazı Tipi",
    html: () => `
      <label>Vurgu rengi<span class="ed-inline"><input id="ed-accent" type="color"><code id="ed-accent-hex"></code></span></label>
      <label>Metin rengi<span class="ed-inline"><input id="ed-theme-text" type="color"><code id="ed-theme-text-hex"></code></span></label>
      <label>Arka plan zemini<span class="ed-inline"><input id="ed-theme-bg" type="color"><code id="ed-theme-bg-hex"></code></span></label>
      <label>İkon rengi<span class="ed-inline"><input id="ed-theme-icon" type="color"><code id="ed-theme-icon-hex"></code></span></label>
      <label>Kart zemini<span class="ed-inline"><input id="ed-theme-cardbg" type="color"><code id="ed-theme-cardbg-hex"></code></span></label>
      <p class="ed-hint">Boş = varsayılan kullanılır. Kart zemini doluysa cam efekti düz renge döner.</p>
      <hr class="ed-hr">
      <label>Kaynak<select id="ed-font-mode"><option value="local">Yerel (assets/fonts/Senki.woff2)</option><option value="google">Google Fonts</option></select></label>
      <label>Google aile adı<input id="ed-font-family" type="text" placeholder="Cinzel"></label>`,
    bind() {
      q("ed-accent").addEventListener("input", e => { App().CONFIG.theme.accent = e.target.value; q("ed-accent-hex").textContent = e.target.value; App().applyTheme(); });
      const themeBind = (id, key, out) => {
        q(id).addEventListener("input", e => {
          App().CONFIG.theme[key] = e.target.value;
          q(out).textContent = e.target.value;
          App().applyTheme();
        });
      };
      themeBind("ed-theme-text", "text", "ed-theme-text-hex");
      themeBind("ed-theme-bg", "background", "ed-theme-bg-hex");
      themeBind("ed-theme-icon", "icon", "ed-theme-icon-hex");
      themeBind("ed-theme-cardbg", "cardBg", "ed-theme-cardbg-hex");
      q("ed-font-mode").addEventListener("change", e => { App().CONFIG.font.mode = e.target.value; App().applyFont(); App().fit(true); });
      q("ed-font-family").addEventListener("input", e => { App().CONFIG.font.googleFamily = e.target.value; App().applyFont(); });
    }
  });

  /* ---- ARKA PLAN ---- */
  SECTIONS.push({
    id: "bg", icon: RIC.bg, title: "Arka Plan",
    html: () => `
      <label><span class="ed-lt">Blur <b id="v-bg-blur"></b></span><input id="ed-bg-blur" type="range" min="0" max="20" step="1"></label>
      <label>Partikül stili<select id="ed-ps">
        <option value="dust">Altın tozu</option><option value="snow">Kar</option>
        <option value="rain">Yağmur</option><option value="embers">Kor</option></select></label>
      <div id="ed-bg-rows"></div>
      <div class="ed-row2"><button id="ed-bg-add" class="ed-btn">+ Arka plan</button><button id="ed-bg-test" class="ed-btn">Sıradaki</button></div>
      <label>Mod (liste boşsa)<select id="ed-bg">
        <option value="video">Video (webm → mp4 → jpg)</option><option value="image">Görsel + Ken Burns</option>
        <option value="particles">Partiküller</option><option value="none">Düz koyu zemin</option></select></label>`,
    bind() {
      q("ed-bg-blur").addEventListener("input", e => { App().CONFIG.bg.blur = parseFloat(e.target.value); q("v-bg-blur").textContent = e.target.value + "px"; App().applyBlur(); });
      q("ed-ps").addEventListener("change", e => { App().CONFIG.bg.particleStyle = e.target.value; App().applyBg(); });
      q("ed-bg").addEventListener("change", e => { App().CONFIG.bg.mode = e.target.value; App().applyBg(); });
      const rows = q("ed-bg-rows");
      rows.addEventListener("input", (e) => {
        const row = e.target.closest(".ed-row"); if (!row) return;
        const b = App().CONFIG.bg.list[+row.dataset.i]; if (!b) return;
        if (e.target.classList.contains("ed-bgl")) b.label = e.target.value;
        if (e.target.classList.contains("ed-bgs")) b.src = e.target.value;
      });
      rows.addEventListener("change", (e) => {
        if (!e.target.classList.contains("ed-bgt")) return;
        const b = App().CONFIG.bg.list[+e.target.closest(".ed-row").dataset.i]; if (!b) return;
        b.type = e.target.value; App().applyBg(); renderBgRows();
      });
      rows.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-act]"); if (!btn) return;
        App().CONFIG.bg.list.splice(+e.target.closest(".ed-row").dataset.i, 1);
        renderBgRows(); App().applyBg();
      });
      q("ed-bg-add").addEventListener("click", () => { App().CONFIG.bg.list.push({ type: "video", label: "Yeni bg", src: "assets/bg2.mp4" }); renderBgRows(); });
      q("ed-bg-test").addEventListener("click", () => { App().bgNext(); renderBgRows(); });
    }
  });
  function renderBgRows() {
    const rows = box("ed-bg-rows"); if (!rows) return;
    const L = App().CONFIG.bg.list;
    rows.innerHTML = "";
    const act = L.length ? ((App().CONFIG.bg.index || 0) % L.length + L.length) % L.length : -1;
    L.forEach((b, i) => {
      const row = document.createElement("div");
      row.className = "ed-row"; row.dataset.i = i;
      row.innerHTML = `
        <div class="ed-r1" style="grid-template-columns:1fr auto auto">
          <input class="ed-bgl" value="${esc(b.label)}" placeholder="Etiket">
          <span class="ed-hint" style="align-self:center">${i === act ? "● aktif" : ""}</span>
          <span class="ed-acts"><button data-act="del" class="danger">${SVG.cross}</button></span>
        </div>
        <div class="ed-r2">
          <select class="ed-bgt">${opt("video", "video", b.type)}${opt("image", "görsel", b.type)}${opt("particles", "partikül", b.type)}${opt("none", "yok", b.type)}</select>
          <input class="ed-bgs" value="${esc(b.src || "")}" placeholder="assets/bg2.mp4">
        </div>`;
      rows.appendChild(row);
    });
  }

  /* ---- KART ---- */
  SECTIONS.push({
    id: "card", icon: RIC.card, title: "Kart",
    html: () => `
      <label><span class="ed-lt">Genişlik <b id="v-card-w"></b></span><input id="ed-card-w" type="range" min="280" max="560" step="10"></label>
      <label><span class="ed-lt">Köşe <b id="v-card-r"></b></span><input id="ed-card-r" type="range" min="0" max="28" step="1"></label>
      <label><span class="ed-lt">Cam blur <b id="v-card-blur"></b></span><input id="ed-card-blur" type="range" min="0" max="40" step="1"></label>
      <label><span class="ed-lt">Opaklık <b id="v-card-op"></b></span><input id="ed-card-op" type="range" min="0.2" max="0.9" step="0.01"></label>`,
    bind() {
      const cb = (id, key, unit, out) => q(id).addEventListener("input", e => {
        App().CONFIG.card[key] = parseFloat(e.target.value);
        q(out).textContent = e.target.value + unit;
        App().applyCard(); App().fit();
      });
      cb("ed-card-w", "width", "px", "v-card-w");
      cb("ed-card-r", "radius", "px", "v-card-r");
      cb("ed-card-blur", "blur", "px", "v-card-blur");
      cb("ed-card-op", "opacity", "", "v-card-op");
    }
  });

  /* ---- GELİŞMİŞ ---- */
  SECTIONS.push({
    id: "adv", icon: RIC.adv, title: "Gelişmiş (element)",
    html: () => `
      <label>Element<select id="ed-el-sel">
        <option value="card">Kart</option><option value="avatar">Avatar</option>
        <option value="username">Kullanıcı adı</option><option value="bio">Bio</option><option value="links">Link alanı</option></select></label>
      <label><span class="ed-lt">Boyut <b id="v-el-w"></b></span><input id="ed-el-w" type="range"></label>
      <label><span class="ed-lt">Döndürme <b id="v-el-rot"></b></span><input id="ed-el-rot" type="range" min="-15" max="15" step="0.5"></label>
      <div class="ed-grid2">
        <label><span class="ed-lt">X <b id="v-el-x"></b></span><input id="ed-el-x" type="range" min="-60" max="60" step="1"></label>
        <label><span class="ed-lt">Y <b id="v-el-y"></b></span><input id="ed-el-y" type="range" min="-60" max="60" step="1"></label>
      </div>
      <label><span class="ed-lt">Ölçek <b id="v-el-s"></b></span><input id="ed-el-s" type="range" min="0.7" max="1.4" step="0.01"></label>
      <div class="ed-grid2">
        <label>Ambient fx<select id="ed-el-amb">${AMB_LIST.map(a => opt(a, a, "none")).join("")}</select></label>
        <label>İnteraktif fx<select id="ed-el-int">${INT_LIST.map(a => opt(a, a, "none")).join("")}</select></label>
      </div>
      <label>Medya katmanı (jpg/gif/mp4)<input id="ed-el-media" type="text" placeholder="assets/fx/card-bg.mp4 (boş = kapalı)"></label>
      <div class="ed-grid2">
        <label><span class="ed-lt">Medya op. <b id="v-el-mop"></b></span><input id="ed-el-mop" type="range" min="0" max="1" step="0.01"></label>
        <label>Harman<select id="ed-el-mblend"><option value="normal">normal</option><option value="screen">screen</option><option value="overlay">overlay</option></select></label>
      </div>
      <button id="ed-el-reset" class="ed-btn" style="width:100%">Bu elementi sıfırla</button>`,
    bind() {
      q("ed-el-sel").addEventListener("change", elFill);
      const elApply = () => { App().applyElements(); App().fit(); };
      q("ed-el-w").addEventListener("input", e => {
        const sel = q("ed-el-sel").value, v = parseFloat(e.target.value);
        const E = App().CONFIG.elements[sel];
        if (sel === "username" || sel === "bio") E.size = v; else E.w = v;
        q("v-el-w").textContent = v; elApply();
      });
      q("ed-el-rot").addEventListener("input", e => { App().CONFIG.elements[q("ed-el-sel").value].rot = parseFloat(e.target.value); q("v-el-rot").textContent = e.target.value + "°"; elApply(); });
      q("ed-el-x").addEventListener("input", e => { App().CONFIG.elements[q("ed-el-sel").value].x = parseFloat(e.target.value); q("v-el-x").textContent = e.target.value + "px"; elApply(); });
      q("ed-el-y").addEventListener("input", e => { App().CONFIG.elements[q("ed-el-sel").value].y = parseFloat(e.target.value); q("v-el-y").textContent = e.target.value + "px"; elApply(); });
      q("ed-el-s").addEventListener("input", e => { App().CONFIG.elements[q("ed-el-sel").value].scale = parseFloat(e.target.value); q("v-el-s").textContent = "×" + e.target.value; elApply(); });
      q("ed-el-amb").addEventListener("change", e => { App().CONFIG.elements[q("ed-el-sel").value].fx.ambient = e.target.value; elApply(); });
      q("ed-el-int").addEventListener("change", e => { App().CONFIG.elements[q("ed-el-sel").value].fx.interactive = e.target.value; elApply(); });
      q("ed-el-media").addEventListener("input", e => { App().CONFIG.elements[q("ed-el-sel").value].media.src = e.target.value.trim(); elApply(); });
      q("ed-el-mop").addEventListener("input", e => { App().CONFIG.elements[q("ed-el-sel").value].media.opacity = parseFloat(e.target.value); q("v-el-mop").textContent = Math.round(e.target.value * 100) + "%"; elApply(); });
      q("ed-el-mblend").addEventListener("change", e => { App().CONFIG.elements[q("ed-el-sel").value].media.blend = e.target.value; elApply(); });
      q("ed-el-reset").addEventListener("click", () => {
        const sel = q("ed-el-sel").value;
        App().CONFIG.elements[sel] = Object.assign(clone(EL_RESET[sel]),
          { fx: { ambient: "none", interactive: "none" }, media: { src: "", opacity: .3, blend: "screen" } });
        elFill(); elApply();
      });
    }
  });
  function elFill() {
    const selE = q("ed-el-sel"); if (!selE) return;
    const sel = selE.value;
    const E = App().CONFIG.elements[sel] || {};
    const wR = q("ed-el-w");
    let w;
    if (sel === "username") w = E.size || 33;
    else if (sel === "bio") w = E.size || 14.5;
    else w = E.w || (sel === "avatar" ? 112 : sel === "links" ? 100 : 400);
    if (sel === "username") { wR.min = 18; wR.max = 48; wR.step = 1; }
    else if (sel === "bio") { wR.min = 10; wR.max = 22; wR.step = .5; }
    else if (sel === "links") { wR.min = 60; wR.max = 100; wR.step = 1; }
    else if (sel === "avatar") { wR.min = 80; wR.max = 180; wR.step = 2; }
    else { wR.min = 240; wR.max = 560; wR.step = 2; }
    wR.value = w;
    q("ed-el-rot").value = E.rot || 0; q("ed-el-x").value = E.x || 0;
    q("ed-el-y").value = E.y || 0; q("ed-el-s").value = E.scale ?? 1;
    q("v-el-w").textContent = w; q("v-el-rot").textContent = (E.rot || 0) + "°";
    q("v-el-x").textContent = (E.x || 0) + "px"; q("v-el-y").textContent = (E.y || 0) + "px";
    q("v-el-s").textContent = "×" + (E.scale ?? 1);
    q("ed-el-amb").value = (E.fx && E.fx.ambient) || "none";
    q("ed-el-int").value = (E.fx && E.fx.interactive) || "none";
    const m = E.media || {};
    q("ed-el-media").value = m.src || "";
    q("ed-el-mop").value = m.opacity ?? .3;
    q("v-el-mop").textContent = Math.round((m.opacity ?? .3) * 100) + "%";
    q("ed-el-mblend").value = m.blend || "screen";
  }

  /* ---- SEKMELER ---- */
  SECTIONS.push({
    id: "tabs", icon: RIC.tabs, title: "Sekmeler",
    html: () => `
      <label>Geçiş tipi<select id="ed-tab-style">
        <option value="animated">Animasyonlu</option><option value="plain">Düz</option>
        <option value="collapsible">Katlanabilir</option>
        <option value="parallax">Parallax</option><option value="anti">Anti</option></select></label>
      <div id="ed-tab-rows"></div>
      <button id="ed-tab-add" class="ed-btn" style="width:100%">+ Sekme</button>
      <p class="ed-hint">İçerik: oyunlar <code>🎮 | ad | not</code> · galeri: URL · parçalar: <code>🎵 | parça | sanatçı</code>.</p>`,
    bind() {
      q("ed-tab-style").addEventListener("change", e => { App().CONFIG.tabs.style = e.target.value; App().Tabs.render(); App().applyFx(); });
      const rows = q("ed-tab-rows");
      rows.addEventListener("input", (e) => {
        const row = e.target.closest(".ed-row"); if (!row) return;
        const t = App().CONFIG.tabs.list[+row.dataset.i]; if (!t) return;
        if (e.target.classList.contains("ed-tlb")) t.label = e.target.value;
        if (e.target.classList.contains("ed-tct")) {
          const v = e.target.value;
          if (t.type === "games") t.games = v.split("\n").filter(Boolean).map(ln => {
            const [emoji, name, note] = ln.split("|").map(s => (s || "").trim());
            return { emoji: emoji || "🎮", name: name || "?", note: note || "" };
          });
          else if (t.type === "gallery") t.items = v.split("\n").map(s => s.trim()).filter(Boolean);
          else if (t.type === "tracks") t.tracks = v.split("\n").filter(Boolean).map(ln => {
            const [emoji, track, artist] = ln.split("|").map(s => (s || "").trim());
            return { emoji: emoji || "🎵", track: track || "?", artist: artist || "" };
          });
          else t.text = v;
        }
        App().Tabs.render();
      });
      rows.addEventListener("change", (e) => {
        if (!e.target.classList.contains("ed-tty")) return;
        const t = App().CONFIG.tabs.list[+e.target.closest(".ed-row").dataset.i]; if (!t) return;
        t.type = e.target.value;
        if (t.type === "games" && !t.games) t.games = [];
        if (t.type === "gallery" && !t.items) t.items = [];
        if (t.type === "tracks" && !t.tracks) t.tracks = [];
        if (t.type === "text" && t.text == null) t.text = "";
        renderTabRows(); App().Tabs.render();
      });
      rows.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-act]"); if (!btn) return;
        const i = +e.target.closest(".ed-row").dataset.i, T = App().CONFIG.tabs.list;
        if (btn.dataset.act === "up" && i > 0) [T[i - 1], T[i]] = [T[i], T[i - 1]];
        if (btn.dataset.act === "down" && i < T.length - 1) [T[i + 1], T[i]] = [T[i], T[i + 1]];
        if (btn.dataset.act === "del") T.splice(i, 1);
        renderTabRows(); App().Tabs.render();
      });
      q("ed-tab-add").addEventListener("click", () => {
        App().CONFIG.tabs.list.push({ label: "Yeni Sekme", type: "text", text: "" });
        renderTabRows(); App().Tabs.render();
      });
    }
  });
  function tabContentText(t) {
    if (t.type === "games") return (t.games || []).map(g => `${g.emoji || "🎮"} | ${g.name || ""} | ${g.note || ""}`).join("\n");
    if (t.type === "gallery") return (t.items || []).join("\n");
    if (t.type === "tracks") return (t.tracks || []).map(x => `${x.emoji || "🎵"} | ${x.track || ""} | ${x.artist || ""}`).join("\n");
    if (t.type === "text") return t.text || "";
    return "";
  }
  function renderTabRows() {
    const rows = box("ed-tab-rows"); if (!rows) return;
    const T = App().CONFIG.tabs.list;
    rows.innerHTML = "";
    T.forEach((t, i) => {
      const ph = t.type === "games" ? "🎮 | CS2 | rekabetçi" : t.type === "gallery" ? "assets/og.jpg" : t.type === "tracks" ? "🎵 | Parça | Sanatçı" : "serbest metin…";
      const row = document.createElement("div");
      row.className = "ed-row"; row.dataset.i = i;
      row.innerHTML = `
        <div class="ed-r1">
          <input class="ed-tlb" value="${esc(t.label)}" placeholder="Sekme adı" style="grid-column:1/3">
          <span class="ed-acts">
            <button data-act="up" ${i === 0 ? "disabled" : ""}>${SVG.up}</button>
            <button data-act="down" ${i === T.length - 1 ? "disabled" : ""}>${SVG.down}</button>
            <button data-act="del" class="danger">${SVG.cross}</button>
          </span>
        </div>
        <div class="ed-r2">
          <select class="ed-tty">${opt("links", "Bağlantılar", t.type)}${opt("games", "Oyunlar", t.type)}${opt("tracks", "Parçalar", t.type)}${opt("text", "Metin", t.type)}${opt("gallery", "Galeri", t.type)}</select>
          <span class="ed-hint" style="align-self:center">${t.type === "links" ? "genel Linkler listesi" : "içerik →"}</span>
        </div>
        ${t.type !== "links" ? `<textarea class="ed-tct" rows="3" placeholder="${esc(ph)}">${esc(tabContentText(t))}</textarea>` : ""}`;
      rows.appendChild(row);
    });
  }

  /* ---- MENÜLER ---- */
  SECTIONS.push({
    id: "menus", icon: RIC.menus, title: "Menüler",
    html: () => `
      <div class="ed-split">
        <div class="ed-mlist" id="ed-menu-list"></div>
        <div id="ed-menu-items"></div>
      </div>
      <div class="ed-row2" style="margin-top:8px">
        <button id="ed-menu-add" class="ed-btn">+ Menü</button>
        <button id="ed-menu-preview" class="ed-btn">👁 Önizle</button>
      </div>
      <label class="ed-switch" style="margin-top:8px"><input type="checkbox" id="ed-cm-en"><i></i><span>Sağ tık menüsü (bağlam)</span></label>
      <label>Sağ tıkta açılacak menü<select id="ed-cm-menu"></select></label>
      <p class="ed-hint">Öğe tipleri: link · copy · action (gömülü + shader) · menu (alt menü). Zone-enter <code>menu-open</code> → imleçte; leave'de Sessions kapatır.</p>`,
    bind() { bindMenus(); }
  });
  function menuIds() { return (App().CONFIG.menus || []).map(m => m.id); }
  function curMenu() { const M = App().CONFIG.menus || []; return M[selMenu] || M[0] || null; }
  function renameMenu(oldId, newId) {
    (App().CONFIG.zones || []).forEach(z => {
      if (z.action && typeof z.action === "object" && z.action.params && z.action.params.menu === oldId) z.action.params.menu = newId;
    });
    (App().CONFIG.menus || []).forEach(m => (m.items || []).forEach(it => { if (it.menuId === oldId) it.menuId = newId; }));
    if (App().CONFIG.contextMenu && App().CONFIG.contextMenu.menu === oldId) App().CONFIG.contextMenu.menu = newId;
  }
  function renderMenuList() {
    const list = box("ed-menu-list"); if (!list) return;
    const M = App().CONFIG.menus || [];
    if (selMenu >= M.length) selMenu = Math.max(0, M.length - 1);
    list.innerHTML = "";
    M.forEach((m, i) => {
      const b = document.createElement("button");
      b.className = i === selMenu ? "on" : "";
      b.dataset.mi = i;
      b.textContent = (m.title || m.id || "?") + "  (" + (m.id || "?") + ")";
      list.appendChild(b);
    });
    if (!M.length) list.innerHTML = `<span class="ed-hint">menü yok</span>`;
    renderMenuItems();
  }
  function renderMenuItems() {
    const items = box("ed-menu-items"); if (!items) return;
    const m = curMenu();
    if (!m) { items.innerHTML = `<span class="ed-hint">soldan bir menü seç veya + Menü</span>`; return; }
    items.innerHTML = `
      <div class="ed-grid2">
        <label>Kimlik<input class="ed-mid" value="${esc(m.id)}" placeholder="main"></label>
        <label>Başlık<input class="ed-mti" value="${esc(m.title || "")}" placeholder="HIZLI ERİŞİM"></label>
      </div>
      <div id="ed-mitem-rows">${(m.items || []).map((it, i) => itemRowHTML(it, i)).join("")}</div>
      <button id="ed-mitem-add" class="ed-mini" style="width:100%;margin-top:6px">+ Öğe</button>`;
  }
  function itemRowHTML(it, i) {
    const t = it.type || "action";
    let tgt;
    if (t === "link") tgt = `<input class="ed-mtg" data-k="url" value="${esc(it.url || "")}" placeholder="https://…">`;
    else if (t === "copy") tgt = `<input class="ed-mtg" data-k="text" value="${esc(it.text || "")}" placeholder="panoya kopyalanacak metin">`;
    else if (t === "menu") tgt = `<select class="ed-mtg" data-k="menuId">${menuIds().map(id => opt(id, "→ " + id, it.menuId)).join("")}</select>`;
    else tgt = `<select class="ed-mtg" data-k="action">${ACT_LIST.map(a => opt(a, a, typeof it.action === "string" ? it.action : (it.action && it.action.type))).join("")}</select>`;
    return `
      <div class="ed-row" data-i="${i}">
        <div class="ed-r1">
          <input class="ed-mic" value="${esc(it.icon || "")}" placeholder="🔗">
          <input class="ed-mlb" value="${esc(it.label || "")}" placeholder="Etiket">
          <span class="ed-acts">
            <button data-act="up" ${i === 0 ? "disabled" : ""}>${SVG.up}</button>
            <button data-act="down" ${i === (curMenu().items || []).length - 1 ? "disabled" : ""}>${SVG.down}</button>
            <button data-act="del" class="danger">${SVG.cross}</button>
          </span>
        </div>
        <div class="ed-r2">
          <select class="ed-mty">${opt("link", "URL", t)}${opt("copy", "Kopyala", t)}${opt("action", "Aksiyon", t)}${opt("menu", "Alt menü", t)}</select>
          ${tgt}
        </div>
      </div>`;
  }
  function bindMenus() {
    q("ed-menu-list").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-mi]"); if (!b) return;
      selMenu = +b.dataset.mi; renderMenuList();
    });
    const items = q("ed-menu-items");
    items.addEventListener("input", (e) => {
      const m = curMenu(); if (!m) return;
      const cl = e.target.classList;
      if (cl.contains("ed-mid")) {
        const v = e.target.value.trim().replace(/\s+/g, "-");
        if (v && v !== m.id && !menuIds().includes(v)) { renameMenu(m.id, v); m.id = v; renderZoneRows(); }
      }
      if (cl.contains("ed-mti")) m.title = e.target.value;
      if (cl.contains("ed-mic") || cl.contains("ed-mlb")) {
        const row = e.target.closest(".ed-row"); if (!row) return;
        const it = m.items[+row.dataset.i]; if (!it) return;
        if (cl.contains("ed-mic")) it.icon = e.target.value.trim();
        if (cl.contains("ed-mlb")) it.label = e.target.value;
      }
      if (cl.contains("ed-mtg")) {
        const row = e.target.closest(".ed-row"); if (!row) return;
        const it = m.items[+row.dataset.i]; if (!it) return;
        const k = e.target.dataset.k;
        if (k === "url") it.url = e.target.value;
        if (k === "text") it.text = e.target.value;
      }
    });
    items.addEventListener("change", (e) => {
      const m = curMenu(); if (!m) return;
      const cl = e.target.classList;
      if (cl.contains("ed-mty")) {
        const row = e.target.closest(".ed-row"); if (!row) return;
        const it = m.items[+row.dataset.i]; if (!it) return;
        it.type = e.target.value;
        delete it.url; delete it.text; delete it.action; delete it.menuId;
        if (it.type === "link") it.url = "https://";
        if (it.type === "copy") it.text = "";
        if (it.type === "action") it.action = "toast";
        if (it.type === "menu") it.menuId = (menuIds().filter(id => id !== m.id)[0] || "");
        renderMenuItems();
      }
      if (cl.contains("ed-mtg")) {
        const row = e.target.closest(".ed-row"); if (!row) return;
        const it = m.items[+row.dataset.i]; if (!it) return;
        const k = e.target.dataset.k;
        if (k === "menuId") it.menuId = e.target.value;
        if (k === "action") it.action = e.target.value;
      }
    });
    items.addEventListener("click", (e) => {
      const m = curMenu(); if (!m) return;
      if (e.target.id === "ed-mitem-add") {
        m.items = m.items || [];
        m.items.push({ label: "Yeni Öğe", icon: "✨", type: "action", action: "toast" });
        renderMenuItems(); return;
      }
      const btn = e.target.closest("button[data-act]"); if (!btn) return;
      const row = e.target.closest(".ed-row"); if (!row) return;
      const i = +row.dataset.i, its = m.items;
      if (btn.dataset.act === "up" && i > 0) [its[i - 1], its[i]] = [its[i], its[i - 1]];
      if (btn.dataset.act === "down" && i < its.length - 1) [its[i + 1], its[i]] = [its[i], its[i + 1]];
      if (btn.dataset.act === "del") its.splice(i, 1);
      renderMenuItems();
    });
    q("ed-menu-add").addEventListener("click", () => {
      let id = "menu1", n = 1;
      while (menuIds().includes(id)) id = "menu" + (++n);
      App().CONFIG.menus.push({
        id, title: "YENİ MENÜ", items: [{ label: "Öğe", icon: "✨", type: "action", action: "toast" }]
      });
      selMenu = App().CONFIG.menus.length - 1;
      renderMenuList(); fillCMMenu();
    });
    q("ed-menu-preview").addEventListener("click", () => {
      const m = curMenu();
      if (!m) { App().toast("Önce bir menü oluşturun", "err"); return; }
      App().PopupMenu.open({ menu: m.id, at: "center" });
    });
    q("ed-cm-en").addEventListener("change", (e) => { App().CONFIG.contextMenu.enabled = e.target.checked; });
  }
  function fillCMMenu() {
    const s = box("ed-cm-menu"); if (!s) return;
    const cur = App().CONFIG.contextMenu.menu;
    s.innerHTML = menuIds().map(id => opt(id, id, cur)).join("");
    if (!menuIds().includes(cur)) s.value = menuIds()[0] || "";
  }

  /* ---- BÖLGELER ---- */
  SECTIONS.push({
    id: "zones", icon: RIC.zones, title: "Bölgeler (AABB)",
    html: () => `
      <label class="ed-switch"><input type="checkbox" id="ed-zone-show"><i></i><span>Bölgeleri göster (kesikli overlay)</span></label>
      <div id="ed-zone-rows"></div>
      <div class="ed-grid2">
        <button id="ed-zone-add" class="ed-mini">+ Bölge</button>
        <button id="ed-strip-top" class="ed-mini">+ Üst şerit</button>
        <button id="ed-strip-bot" class="ed-mini">+ Alt şerit</button>
        <button id="ed-zone-clear" class="ed-mini">Tümünü sil</button>
      </div>
      <p class="ed-hint">x/y/w/h viewport %. <b>Ses efekti</b>: bölgeye girince çalar — <code>once</code> · <code>loop</code> · <code>random</code>. Dosyalar: <code>assets/sounds/</code>, her satır bir yol. hoverUnblur / autoRevisit destekli. Global olaylar config.js'te.</p>`,
    bind() { bindZoneRows(); }
  });
  function renderZoneRows() {
    const rows = box("ed-zone-rows"); if (!rows) return;
    const Z = App().CONFIG.zones;
    rows.innerHTML = "";
    Z.forEach((z, i) => {
      const aType = z.action && z.action.type;
      const isShader = aType === "shader";
      const isMenu = aType === "menu-open";
      const snd = z.sound;
      const shp = (isShader && z.action.params) || {};
      const row = document.createElement("div");
      row.className = "ed-row"; row.dataset.i = i;
      row.innerHTML = `
        <div class="ed-r1" style="grid-template-columns:1fr 92px auto">
          <input class="ed-zid" value="${esc(z.id)}" placeholder="bölge kimliği">
          <select class="ed-zev">${opt("enter", "girişte", z.event)}${opt("leave", "çıkışta", z.event)}</select>
          <span class="ed-acts"><button data-act="del" class="danger">${SVG.cross}</button></span>
        </div>
        <div class="ed-r2">
          <select class="ed-zac">${opt("none", "aksiyon: yok", "")}${ACT_LIST.map(a => opt(a, a, aType)).join("")}</select>
          ${isMenu ? `<select class="ed-zmid">${menuIds().map(id => opt(id, "menü: " + id, z.action.params && z.action.params.menu)).join("")}</select>`
          : (isShader ? `<select class="ed-zshn">${shaderNames().map(n => opt(n, "shader: " + n, shp.name)).join("")}</select>`
            : `<input class="ed-zcd" type="number" value="${z.cooldownMs || 0}" title="cooldown (ms)">`)}
        </div>
        ${isShader ? `
        <div class="ed-grid2">
          <label>Mod<select class="ed-zshmode">${opt("oneshot", "oneshot", shp.mode || "oneshot")}${opt("toggle", "toggle (zone)", shp.mode || "oneshot")}${opt("switch", "switch", shp.mode || "oneshot")}</select></label>
          <label><span class="ed-lt">Intensity <b class="v-zshi">${Math.round((shp.intensity ?? .8) * 100)}%</b></span><input class="ed-zshi" type="range" min="0" max="1" step="0.05" value="${shp.intensity ?? .8}"></label>
        </div>
        <label><span class="ed-lt">Duration <b class="v-zshd">${shp.duration ?? 2}s</b></span><input class="ed-zshd" type="range" min="0.5" max="10" step="0.5" value="${shp.duration ?? 2}"></label>` : ""}
        <label class="ed-chk"><input type="checkbox" class="ed-zsnd" ${snd ? "checked" : ""}> ses efekti (bölgeye girince)</label>
        ${snd ? `
        <div class="ed-r2">
          <select class="ed-zsmode">${opt("once", "tek sefer", snd.mode)}${opt("loop", "döngü (leave'de durur)", snd.mode)}${opt("random", "rastgele (2+ dosya)", snd.mode)}</select>
          <label style="margin:0"><span class="ed-lt">Ses <b class="v-zsvol">${Math.round((snd.volume ?? .5) * 100)}%</b></span><input class="ed-zsvol" type="range" min="0" max="1" step="0.05" value="${snd.volume ?? .5}"></label>
        </div>
        <textarea class="ed-zsfiles" rows="2" placeholder="assets/sounds/click.mp4&#10;assets/sounds/hover.mp4 (her satır bir dosya)">${esc((snd.files || []).join("\n"))}</textarea>` : ""}
        <label class="ed-chk"><input type="checkbox" class="ed-zun" ${z.hoverUnblur ? "checked" : ""}> hoverUnblur — bölgede blur açılır</label>
        <label class="ed-chk"><input type="checkbox" class="ed-zar" ${z.autoRevert !== false ? "checked" : ""}> autoRevert — leave'de efekt geri alınır</label>
        <div class="ed-grid2">
          <label>x% <b class="v-zx">${z.x}</b><input class="ed-zx" type="range" min="0" max="100" value="${z.x}"></label>
          <label>y% <b class="v-zy">${z.y}</b><input class="ed-zy" type="range" min="0" max="100" value="${z.y}"></label>
          <label>w% <b class="v-zw">${z.w}</b><input class="ed-zw" type="range" min="2" max="100" value="${z.w}"></label>
          <label>h% <b class="v-zh">${z.h}</b><input class="ed-zh" type="range" min="2" max="100" value="${z.h}"></label>
        </div>`;
      rows.appendChild(row);
    });
  }
  function bindZoneRows() {
    const rows = q("ed-zone-rows");
    rows.addEventListener("input", (e) => {
      const row = e.target.closest(".ed-row"); if (!row) return;
      const z = App().CONFIG.zones[+row.dataset.i]; if (!z) return;
      const cl = e.target.classList;
      if (cl.contains("ed-zid")) z.id = e.target.value.trim() || ("zone" + (Date.now() % 1000));
      if (cl.contains("ed-zcd")) z.cooldownMs = parseInt(e.target.value, 10) || 0;
      if (cl.contains("ed-zx")) { z.x = +e.target.value; row.querySelector(".v-zx").textContent = z.x; }
      if (cl.contains("ed-zy")) { z.y = +e.target.value; row.querySelector(".v-zy").textContent = z.y; }
      if (cl.contains("ed-zw")) { z.w = +e.target.value; row.querySelector(".v-zw").textContent = z.w; }
      if (cl.contains("ed-zh")) { z.h = +e.target.value; row.querySelector(".v-zh").textContent = z.h; }
      if (cl.contains("ed-zun")) z.hoverUnblur = e.target.checked;
      if (cl.contains("ed-zar")) z.autoRevert = e.target.checked;
      if (cl.contains("ed-zshd")) { z.action.params = z.action.params || {}; z.action.params.duration = parseFloat(e.target.value); row.querySelector(".v-zshd").textContent = e.target.value + "s"; }
      if (cl.contains("ed-zshi")) { z.action.params = z.action.params || {}; z.action.params.intensity = parseFloat(e.target.value); row.querySelector(".v-zshi").textContent = Math.round(e.target.value * 100) + "%"; }
      if (cl.contains("ed-zsfiles") && z.sound) { z.sound.files = e.target.value.split("\n").map(s => s.trim()).filter(Boolean); }
      if (cl.contains("ed-zsvol") && z.sound) { z.sound.volume = parseFloat(e.target.value); row.querySelector(".v-zsvol").textContent = Math.round(e.target.value * 100) + "%"; }
      App().Zones.renderOverlay();
    });
    rows.addEventListener("change", (e) => {
      const row = e.target.closest(".ed-row"); if (!row) return;
      const z = App().CONFIG.zones[+row.dataset.i]; if (!z) return;
      const cl = e.target.classList;
      if (cl.contains("ed-zev")) z.event = e.target.value;
      if (cl.contains("ed-zac")) {
        const v = e.target.value;
        z.action = v === "none" ? null : { type: v, params: v === "menu-open" ? { menu: (menuIds()[0] || ""), at: "pointer" } : (v === "shader" ? { name: (shaderNames()[0] || "ripple"), duration: 2, intensity: .8, at: "pointer", mode: "oneshot" } : {}) };
        renderZoneRows();
      }
      if (cl.contains("ed-zmid")) { z.action.params = z.action.params || {}; z.action.params.menu = e.target.value; }
      if (cl.contains("ed-zshn")) { z.action.params = z.action.params || {}; z.action.params.name = e.target.value; }
      if (cl.contains("ed-zshmode")) { z.action.params = z.action.params || {}; z.action.params.mode = e.target.value; }
      if (cl.contains("ed-zsmode") && z.sound) z.sound.mode = e.target.value;
      if (cl.contains("ed-zsnd")) {
        if (e.target.checked) z.sound = { files: ["assets/sounds/click.mp3"], mode: "once", volume: .5 };
        else delete z.sound;
        renderZoneRows();
      }
    });
    rows.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]"); if (!btn) return;
      App().CONFIG.zones.splice(+e.target.closest(".ed-row").dataset.i, 1);
      renderZoneRows(); App().Zones.renderOverlay();
    });
    const strip = (top) => ({
      id: top ? "strip-top" : "strip-bottom", x: 0, y: top ? 0 : 95, w: 100, h: 5,
      event: "enter", cooldownMs: 250, autoRevert: true, hoverUnblur: false,
      action: { type: "toggle-blur", params: {} },
    });
    q("ed-zone-add").addEventListener("click", () => {
      App().CONFIG.zones.push({ id: "zone" + (App().CONFIG.zones.length + 1), x: 30, y: 40, w: 40, h: 20, event: "enter", cooldownMs: 0, autoRevert: true, hoverUnblur: false, action: { type: "toast", params: { text: "bölge!" } } });
      renderZoneRows(); App().Zones.renderOverlay();
    });
    q("ed-strip-top").addEventListener("click", () => { App().CONFIG.zones.push(strip(true)); renderZoneRows(); App().Zones.renderOverlay(); });
    q("ed-strip-bot").addEventListener("click", () => { App().CONFIG.zones.push(strip(false)); renderZoneRows(); App().Zones.renderOverlay(); });
    q("ed-zone-clear").addEventListener("click", () => { App().CONFIG.zones.length = 0; renderZoneRows(); App().Zones.renderOverlay(); });
    q("ed-zone-show").addEventListener("change", e => { App().CONFIG.debug.zones = e.target.checked; App().Zones.renderOverlay(); });
  }

  /* ---- AKSİYON TEST ---- */
  SECTIONS.push({
    id: "actions", icon: RIC.actions, title: "Aksiyon Test Paneli",
    html: () => `<div class="ed-actgrid" id="ed-actgrid"></div>`,
    bind() {
      const grid = q("ed-actgrid");
      ACT_LIST.forEach(a => {
        const b = document.createElement("button");
        b.textContent = a;
        b.addEventListener("click", () => App().runAction({ type: a }));
        grid.appendChild(b);
      });
    }
  });

  /* ---- EFEKTLER ---- */
  SECTIONS.push({
    id: "fx", icon: RIC.fx, title: "Efektler",
    html: () => `
      <label class="ed-switch"><input type="checkbox" id="ed-fx-sparks"><i></i><span>Tıklama kıvılcımları</span></label>
      <label class="ed-switch"><input type="checkbox" id="ed-fx-cursor"><i></i><span>Özel imleç</span></label>
      <label class="ed-switch"><input type="checkbox" id="ed-fx-parallax"><i></i><span>Arka plan parallax</span></label>
      <label class="ed-switch"><input type="checkbox" id="ed-fx-tilt"><i></i><span>Kart 3D tilt</span></label>
      <label class="ed-switch"><input type="checkbox" id="ed-fx-typewriter"><i></i><span>Daktilo bio</span></label>
      <label class="ed-switch"><input type="checkbox" id="ed-fx-blips"><i></i><span>Arayüz sesleri (blip)</span></label>
      <label class="ed-switch"><input type="checkbox" id="ed-sc"><i></i><span>Klavye kısayolları (M/F/B/T/H)</span></label>`,
    bind() {
      [["ed-fx-sparks", "sparks"], ["ed-fx-cursor", "cursor"], ["ed-fx-parallax", "parallax"],
      ["ed-fx-tilt", "tilt"], ["ed-fx-typewriter", "typewriter"], ["ed-fx-blips", "blips"], ["ed-sc", "shortcuts"]].forEach(([id, key]) => {
        q(id).addEventListener("change", e => { App().CONFIG.fx[key] = e.target.checked; if (key === "shortcuts") return; App().applyFx(); if (key === "typewriter") App().applyBio(); });
      });
    }
  });

  /* ---- SES ---- */
  SECTIONS.push({
    id: "audio", icon: RIC.audio, title: "Ses",
    html: () => `
      <label>Kaynak<select id="ed-audio-src"><option value="video">Videonun ses pisti</option><option value="music">assets/music.mp3 (loop)</option></select></label>
      <label><span class="ed-lt">Varsayılan seviye <b id="v-audio-vol"></b></span><input id="ed-audio-vol" type="range" min="0" max="1" step="0.01"></label>
      <p class="ed-hint">Zone ses efektleri Bölgeler bölümünde; dosyalar <code>assets/sounds/</code>.</p>`,
    bind() {
      q("ed-audio-src").addEventListener("change", e => { App().CONFIG.audio.source = e.target.value; App().AudioSys.apply(); });
      q("ed-audio-vol").addEventListener("input", e => {
        const v = parseFloat(e.target.value);
        App().CONFIG.audio.defaultVolume = v;
        q("v-audio-vol").textContent = Math.round(v * 100) + "%";
        App().AudioSys.setVolume(v);
      });
    }
  });

  /* ---- PERFORMANS ---- */
  SECTIONS.push({
    id: "perf", icon: RIC.perf, title: "Yerleşim & Performans",
    html: () => `
      <label class="ed-switch"><input type="checkbox" id="ed-autofit"><i></i><span>Otomatik sığdır (FitScale)</span></label>
      <label><span class="ed-lt">Dikey pay <b id="v-fit-my"></b></span><input id="ed-fit-my" type="range" min="40" max="160" step="4"></label>
      <label><span class="ed-lt">Yatay pay <b id="v-fit-mx"></b></span><input id="ed-fit-mx" type="range" min="16" max="120" step="4"></label>
      <label>Kalite<select id="ed-perf-q"><option value="auto">Otomatik</option><option value="high">Yüksek</option><option value="low">Düşük</option></select></label>
      <label>GPU renderer<select id="ed-perf-renderer"><option value="auto">Otomatik</option><option value="css">CSS / canvas2d</option><option value="webgl2">WebGL2</option><option value="webgpu">WebGPU</option></select></label>
      <div class="ed-grid2">
        <label>Partikül tavanı<input id="ed-perf-cap" type="number" min="20" max="400" step="10"></label>
        <label>DPR tavanı<input id="ed-perf-dpr" type="number" min="1" max="3" step="0.5"></label>
      </div>
      <p class="ed-hint">Kenar payları arttıkça kart küçülür (varsayılan 84/36.</p>`,
    bind() {
      q("ed-autofit").addEventListener("change", e => { App().CONFIG.layout.autofit = e.target.checked; App().fit(true); });
      const mg = (id, key, out) => q(id).addEventListener("input", e => {
        App().CONFIG.layout[key] = parseInt(e.target.value, 10);
        q(out).textContent = e.target.value + "px";
        App().fit(true);
      });
      mg("ed-fit-my", "marginY", "v-fit-my");
      mg("ed-fit-mx", "marginX", "v-fit-mx");
      q("ed-perf-q").addEventListener("change", e => { App().CONFIG.perf.quality = e.target.value; App().applyPerf(); });
      q("ed-perf-renderer").addEventListener("change", e => { App().CONFIG.perf.renderer = e.target.value; App().applyPerf(); });
      q("ed-perf-cap").addEventListener("input", e => { App().CONFIG.perf.particleCap = parseInt(e.target.value, 10) || 120; });
      q("ed-perf-dpr").addEventListener("input", e => { App().CONFIG.perf.dprCap = parseFloat(e.target.value) || 2; App().applyPerf(); });
    }
  });

  /* ---- KORUMA ---- */
  SECTIONS.push({
    id: "protect", icon: RIC.protect, title: "Koruma (soft anti-debug)",
    html: () => `
      <label class="ed-switch"><input type="checkbox" id="ed-ad-rc"><i></i><span>Sağ tık engelle</span></label>
      <label class="ed-switch"><input type="checkbox" id="ed-ad-sc"><i></i><span>F12 / Ctrl+Shift+I / Ctrl+U / Ctrl+S engelle</span></label>
      <label class="ed-switch"><input type="checkbox" id="ed-ad-cw"><i></i><span>Konsol uyarısı</span></label>
      <label class="ed-switch"><input type="checkbox" id="ed-ad-dt"><i></i><span>debuggerTrap (ÖNERİLMEZ)</span></label>
      <p class="ed-hint">F12 açıldığında sayfa NORMAL ÇALIŞIR; yalnız kısayollar engellenir. Pages'te kaynak zaten görünür; bu yalnız ziyaretçinin kendi tarayıcısını korur.</p>`,
    bind() {
      const A = () => App().CONFIG.antiDebug;
      const upd = () => { if (App().applyAntiDebug) App().applyAntiDebug(); };
      q("ed-ad-rc").addEventListener("change", e => { A().rightClick = e.target.checked; upd(); });
      q("ed-ad-sc").addEventListener("change", e => { A().shortcuts = e.target.checked; upd(); });
      q("ed-ad-cw").addEventListener("change", e => { A().consoleWarn = e.target.checked; });
      q("ed-ad-dt").addEventListener("change", e => { A().debuggerTrap = e.target.checked; upd(); });
    }
  });

  /* ---- HATA AYIKLAMA ---- */
  SECTIONS.push({
    id: "debug", icon: RIC.debug, title: "Hata Ayıklama",
    html: () => `
      <label class="ed-switch"><input type="checkbox" id="ed-dbg-trig"><i></i><span>Olay + oturum günlüğü</span></label>
      <p class="ed-hint">Zone enter/leave, shader oturumları ve global tetik olayları canlı listelenir.</p>`,
    bind() {
      q("ed-dbg-trig").addEventListener("change", e => {
        App().CONFIG.debug.triggers = e.target.checked;
        if (!e.target.checked) { const d = document.querySelector("#dbg"); if (d) { d.hidden = true; d.innerHTML = ""; } }
      });
    }
  });

  /* ---- CANLI & ARAŞTIRMA ---- */
  SECTIONS.push({
    id: "live", icon: RIC.live, title: "Canlı & Araştırma",
    html: () => `
      <label class="ed-switch"><input type="checkbox" id="ed-lan-en"><i></i><span>Lanyard (canlı Discord)</span></label>
      <label>Discord ID<input id="ed-lan-id" type="text"></label>
      <label class="ed-switch"><input type="checkbox" id="ed-lan-sp"><i></i><span>"Şu an çalıyor" satırı</span></label>
      <label class="ed-switch"><input type="checkbox" id="ed-greet"><i></i><span>Saat dilimi selamı (LOKAL)</span></label>
      <label>Selam şablonu<input id="ed-greet-tpl" type="text" placeholder="{selam} — İmparatorluk saati {saat}"></label>
      <label>Özel imleç görseli<input id="ed-cursor" type="text" placeholder="assets/cursor.png"></label>
      <label>Dış sayaç URL (ops.)<input id="ed-stats" type="text" placeholder="boş = kapalı"></label>`,
    bind() {
      q("ed-lan-en").addEventListener("change", e => { App().CONFIG.lanyard.enabled = e.target.checked; App().Lanyard.start(); });
      q("ed-lan-id").addEventListener("input", e => { App().CONFIG.lanyard.discordId = e.target.value.trim(); });
      q("ed-lan-sp").addEventListener("change", e => { App().CONFIG.lanyard.showSpotify = e.target.checked; });
      q("ed-greet").addEventListener("change", e => { App().CONFIG.greeting.enabled = e.target.checked; });
      q("ed-greet-tpl").addEventListener("input", e => { App().CONFIG.greeting.template = e.target.value; });
      q("ed-cursor").addEventListener("input", e => { App().CONFIG.cursor.image = e.target.value.trim(); App().applyCursor(); });
      q("ed-stats").addEventListener("input", e => { App().CONFIG.stats.url = e.target.value.trim(); App().applyStats(); });
    }
  });

  /* ═══════════ KABUKLAR ═══════════ */
  function injectStyles() {
    if (document.getElementById("ed-shared-style")) return;
    const st = document.createElement("style");
    st.id = "ed-shared-style";
    st.textContent = `
      .frp-badges{display:flex;gap:2px;justify-content:center;margin-top:2px}
      .frp-b{font:8px/1 monospace;font-style:normal;color:#8f8266;border:1px solid rgba(255,255,255,.15);border-radius:3px;padding:1px 3px}
      .frp-b.f{color:#8fd49a;border-color:rgba(143,212,154,.4)}
      .frp-b.o{color:#d4a48f;border-color:rgba(212,164,143,.4)}
      .ed2 .ed-body{flex:none;overflow:visible;padding:4px 12px 14px}
      .ed2 .ed-body section{border:0;padding:0}
      .ed-sfx-cap{font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent,#e6b34d);margin:2px 0 6px;opacity:.9}
      .ed-fr-head{display:flex;align-items:center;justify-content:space-between;margin:10px 0 6px}
      .ed-fr-head span{font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent,#e6b34d);opacity:.9}
      .ed-close-fab{position:absolute;top:11px;left:11px;z-index:40;width:32px;height:32px;border-radius:9px;display:grid;place-items:center;color:#bfae8a;font-size:14px;line-height:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18)}
      .ed-close-fab:hover{color:var(--accent,#e6b34d);border-color:rgba(230,179,77,.6);background:rgba(230,179,77,.12)}
      .ed2-top{flex-wrap:wrap;padding-left:52px;row-gap:6px}
      .ed-drawer .ed-head{padding-left:52px}
      .ed-warn{display:flex;gap:8px;align-items:flex-start;padding:9px 11px;border-radius:10px;border:1px solid rgba(224,122,95,.55);background:rgba(224,122,95,.1);color:#e8b4a3;font-size:11px;line-height:1.55;margin-bottom:10px}
      .ed-warn code{color:#f0c4b4}
      .ed-hr{border:0;border-top:1px solid rgba(255,255,255,.08);margin:12px 0 8px}
      .ed-favicon-prev{width:22px;height:22px;border-radius:5px;flex:none;border:1px solid rgba(230,179,77,.35);background:rgba(255,255,255,.04);object-fit:contain}`;
    document.head.appendChild(st);
  }

  function buildBadge() {
    badge = document.createElement("div");
    badge.className = "ed-badge"; badge.textContent = "EDITÖR AÇIK";
    badge.title = "Düzenleme panelini aç / kapat";
    document.body.appendChild(badge);
    badge.addEventListener("click", () => setOpen(!shell.classList.contains("open")));
  }

  function buildModern() {
    shell = document.createElement("aside");
    shell.className = "ed2";
    shell.setAttribute("aria-label", "Profil düzenleyici");
    shell.innerHTML = `
      <button class="ed-close-fab" id="ed-fab-close" title="Editörü kapat (Esc)">✕</button>
      <div class="ed2-top">
        <span class="ed2-logo">SENKİ</span>
        <input id="ed2-search" type="text" placeholder="ara…" title="Ayar ara">
        <button id="ed2-save" class="ed2-tbtn primary">Kaydet</button>
        <button id="ed2-import" class="ed2-tbtn">İçe Aktar</button>
        <button id="ed-tpl-new" class="ed2-tbtn" title="Sıfırdan Başla — boş bio">SIFIR</button>
        <button id="ed2-tpl-v1" class="ed2-tbtn" title="Şablon: V1 Klasik">V1</button>
        <button id="ed2-tpl-def" class="ed2-tbtn" title="Şablon: Varsayılan">DEF</button>
      </div>
      <div class="ed2-mid">
        <nav class="ed2-rail" id="ed2-rail"></nav>
        <div class="ed2-acc" id="ed2-acc"></div>
      </div>
      <input id="ed-file" type="file" accept=".js,text/javascript" hidden>`;
    document.body.appendChild(shell);
    q = (id) => shell.querySelector("#" + id);
    const rail = q("ed2-rail"), acc = q("ed2-acc");
    railBtns = {};
    SECTIONS.forEach((sec, ix) => {
      const rb = document.createElement("button");
      rb.title = sec.title; rb.innerHTML = sec.icon + '<span class="dot"></span>';
      rb.addEventListener("click", () => {
        const el = acc.querySelector(`[data-sec="${sec.id}"]`);
        if (el && !el.classList.contains("open")) el.classList.add("open");
        if (el) el.scrollIntoView({ block: "start" });
      });
      rail.appendChild(rb);
      railBtns[sec.id] = rb;
      const s = document.createElement("div");
      s.className = "ed2-sec" + (ix === 0 ? " open" : "");
      s.dataset.sec = sec.id;
      s.innerHTML = `<button type="button">${esc(sec.title)} <i>▾</i></button><div class="ed2-body ed-body"></div>`;
      s.querySelector("button").addEventListener("click", () => s.classList.toggle("open"));
      s.querySelector(".ed2-body").innerHTML = sec.html();
      acc.appendChild(s);
    });
    q("ed2-search").addEventListener("input", (e) => {
      const v = e.target.value.trim().toLowerCase();
      [...acc.children].forEach(s => {
        s.hidden = !!v && !(s.dataset.searchable || "").includes(v);
        if (v && !s.hidden) s.classList.add("open");
      });
    });
    q("ed-fab-close").addEventListener("click", () => setOpen(false));
    q("ed2-save").addEventListener("click", saveConfig);
    q("ed2-import").addEventListener("click", () => q("ed-file").click());
    q("ed-file").addEventListener("change", importConfig);
    q("ed-tpl-new").addEventListener("click", () => {
      App().toast("Sıfır bio yüklendi — hayırlı olsun :p");
      loadTemplate("scratch");
    });
    q("ed2-tpl-v1").addEventListener("click", () => loadTemplate("classic"));
    q("ed2-tpl-def").addEventListener("click", () => loadTemplate("def"));
    shell.addEventListener("input", onMaybeDirty);
    shell.addEventListener("change", onMaybeDirty);
  }

  function onMaybeDirty(e) {
    const sec = e.target.closest("[data-sec]"); if (!sec) return;
    const id = sec.dataset.sec;
    dirty.add(id);
    if (railBtns[id]) railBtns[id].classList.add("dirty");
    const sv = shell.querySelector("#ed2-save, #ed-save");
    if (sv) sv.classList.add("dirty");
  }

  function clearDirty() {
    dirty.clear();
    Object.values(railBtns).forEach(b => b.classList.remove("dirty"));
    const sv = shell && shell.querySelector("#ed2-save, #ed-save");
    if (sv) sv.remove("dirty");
  }

  function buildLegacy() {
    shell = document.createElement("aside");
    shell.className = "ed-drawer";
    shell.setAttribute("aria-label", "Profil düzenleyici");
    shell.innerHTML = `
      <button class="ed-close-fab" id="ed-fab-close" title="Editörü kapat (Esc)">✕</button>
      <header class="ed-head"><span>PROFİL DÜZENLEYİCİ</span></header>
      <div class="ed-body" id="ed-legacy-body"></div>
      <footer class="ed-foot">
        <button id="ed-save" class="ed-btn primary">Kaydet — config.js indir</button>
        <button id="ed-import" class="ed-btn">İçe Aktar</button>
        <div class="ed-row2">
          <button id="ed-tpl-new" class="ed-btn">SIFIR</button>
          <button id="ed-tpl-classic" class="ed-btn">V1</button>
          <button id="ed-tpl-default" class="ed-btn">DEF</button>
        </div>
        <input id="ed-file" type="file" accept=".js,text/javascript" hidden>
      </footer>`;
    document.body.appendChild(shell);
    q = (id) => shell.querySelector("#" + id);
    const body = q("ed-legacy-body");
    SECTIONS.forEach(sec => {
      const s = document.createElement("section");
      s.dataset.sec = sec.id;
      s.innerHTML = `<h3>${esc(sec.title)}</h3>` + sec.html();
      body.appendChild(s);
    });
    q("ed-fab-close").addEventListener("click", () => setOpen(false));
    q("ed-save").addEventListener("click", saveConfig);
    q("ed-import").addEventListener("click", () => q("ed-file").click());
    q("ed-file").addEventListener("change", importConfig);
    q("ed-tpl-new").addEventListener("click", () => { App().toast("Sıfır bio yüklendi :p"); loadTemplate("scratch"); });
    q("ed-tpl-classic").addEventListener("click", () => loadTemplate("classic"));
    q("ed-tpl-default").addEventListener("click", () => loadTemplate("def"));
    shell.addEventListener("input", onMaybeDirty);
    shell.addEventListener("change", onMaybeDirty);
  }

  function refreshSearchIndex() {
    if (!modern || !shell) return;
    shell.querySelectorAll(".ed2-sec").forEach(s => {
      s.dataset.searchable = (s.querySelector("button").textContent + " " + s.textContent).toLowerCase();
    });
  }

  /* ═══ DEĞERLER + DİNAMİK RENDER ═══ */
  function fillStaticValues() {
    const C = App().CONFIG;
    const set = (id, val) => { const el = q(id); if (el) el.value = val; };
    const chk = (id, val) => { const el = q(id); if (el) el.checked = !!val; };
    const o = (id, txt) => { const el = q(id); if (el) el.textContent = txt; };
    set("ed-title", C.meta.title || ""); set("ed-desc", C.meta.description || "");
    set("ed-username", C.profile.username || ""); set("ed-divanc", C.profile.division || "");
    set("ed-bio", C.profile.bio || "");
    set("ed-avatar", C.avatar.src || ""); set("ed-av-anim", C.avatar.anim || "none");
    set("ed-avatar-shape", C.profile.avatarShape || "circle");
    set("ed-accent", C.theme.accent); const hx = q("ed-accent-hex"); if (hx) hx.textContent = C.theme.accent;
    /* v5.1: genişletilmiş renkler */
    set("ed-theme-text", C.theme.text || "#ece3d0"); const thx = q("ed-theme-text-hex"); if (thx) thx.textContent = C.theme.text || "varsayılan";
    set("ed-theme-bg", C.theme.background || "#070604"); const tbx = q("ed-theme-bg-hex"); if (tbx) tbx.textContent = C.theme.background || "varsayılan";
    set("ed-theme-icon", C.theme.icon || "#a1916f"); const tix = q("ed-theme-icon-hex"); if (tix) tix.textContent = C.theme.icon || "varsayılan";
    set("ed-theme-cardbg", C.theme.cardBg || "#120f0a"); const tcx = q("ed-theme-cardbg-hex"); if (tcx) tcx.textContent = C.theme.cardBg || "varsayılan";
    set("ed-font-mode", C.font.mode || "local"); set("ed-font-family", C.font.googleFamily || "");
    set("ed-bg", C.bg.mode || "video"); set("ed-bg-blur", C.bg.blur);
    const vb = q("v-bg-blur"); if (vb) vb.textContent = (C.bg.blur ?? 6) + "px";
    set("ed-ps", C.bg.particleStyle || "dust");
    set("ed-card-w", C.card.width); set("ed-card-r", C.card.radius);
    set("ed-card-blur", C.card.blur); set("ed-card-op", C.card.opacity);
    o("v-card-w", C.card.width + "px"); o("v-card-r", C.card.radius + "px");
    o("v-card-blur", C.card.blur + "px"); o("v-card-op", String(C.card.opacity));
    set("ed-tab-style", C.tabs.style || "animated");
    chk("ed-fx-sparks", C.fx.sparks); chk("ed-fx-cursor", C.fx.cursor);
    chk("ed-fx-parallax", C.fx.parallax); chk("ed-fx-tilt", C.fx.tilt);
    chk("ed-fx-typewriter", C.fx.typewriter); chk("ed-fx-blips", C.fx.blips); chk("ed-sc", C.fx.shortcuts);
    set("ed-audio-src", C.audio.source || "video"); set("ed-audio-vol", C.audio.defaultVolume);
    o("v-audio-vol", Math.round((C.audio.defaultVolume ?? .35) * 100) + "%");
    chk("ed-autofit", C.layout.autofit);
    set("ed-fit-my", C.layout.marginY ?? 84); o("v-fit-my", (C.layout.marginY ?? 84) + "px");
    set("ed-fit-mx", C.layout.marginX ?? 36); o("v-fit-mx", (C.layout.marginX ?? 36) + "px");
    set("ed-perf-q", C.perf.quality || "auto"); set("ed-perf-renderer", C.perf.renderer || "auto");
    set("ed-perf-cap", C.perf.particleCap || 120); set("ed-perf-dpr", C.perf.dprCap || 2);
    chk("ed-dbg-trig", C.debug.triggers); chk("ed-zone-show", C.debug.zones);
    chk("ed-cm-en", C.contextMenu && C.contextMenu.enabled);
    chk("ed-ad-rc", C.antiDebug && C.antiDebug.rightClick);
    chk("ed-ad-sc", C.antiDebug && C.antiDebug.shortcuts);
    chk("ed-ad-cw", C.antiDebug && C.antiDebug.consoleWarn);
    chk("ed-ad-dt", C.antiDebug && C.antiDebug.debuggerTrap);
    /* giriş perdesi + küp */
    set("ed-entry-hint", (C.entry && C.entry.hint) || "CLICK TO ENTER");
    set("ed-entry-note", (C.entry && C.entry.note) || "ses açık önerilir");
    chk("ed-entry-cube", C.entry && C.entry.showCube);
    set("ed-cube-sz", (C.entry && C.entry.cubeSize) || 72); o("v-cube-sz", ((C.entry && C.entry.cubeSize) || 72) + "px");
    set("ed-cube-sp", (C.entry && C.entry.cubeSpeed) || 10); o("v-cube-sp", ((C.entry && C.entry.cubeSpeed) || 10) + "s");
    set("ed-cube-color", (C.entry && C.entry.cubeColor) || "#e6b34d");
    const chx = q("ed-cube-hex"); if (chx) chx.textContent = (C.entry && C.entry.cubeColor) || "#e6b34d";
    /* favicon */
    set("ed-favicon", (C.meta && C.meta.favicon) || "assets/favicon.svg");
    const fav = (C.meta && C.meta.favicon) || "assets/favicon.svg";
    set("ed-favicon", fav);
    const prev = q("ed-favicon-prev"); if (prev) prev.src = fav;
    /* v5.0: intro */
    chk("ed-intro-en", C.intro && C.intro.enabled);
    set("ed-intro-style", (C.intro && C.intro.style) || "boot");
    set("ed-intro-lines", ((C.intro && C.intro.lines) || []).join("\n"));
    set("ed-intro-delay", (C.intro && C.intro.elementDelay) || 120); o("v-intro-delay", ((C.intro && C.intro.elementDelay) || 120) + "ms");
    set("ed-intro-bg", (C.intro && C.intro.bgReveal) || "blur");
    chk("ed-intro-reload", C.intro ? C.intro.skipOnReload !== false : true);
    chk("ed-intro-sound", (C.intro && C.intro.sound) !== false);
    set("ed-intro-mode", (C.intro && C.intro.mode) || "style");
    set("ed-intro-vsrc", (((C.intro && C.intro.video) || {}).sources || []).join("\n"));
    chk("ed-intro-lock", !!((C.intro && C.intro.video) || {}).lockOthers);
    applyIntroLock(document);
    set("ed-sfx-d", 3); set("ed-sfx-i", 1); set("ed-sfx-mode", "oneshot");
    set("ed-sfx-name", ""); set("ed-sfx-src", ""); set("ed-sfx-file", "");
    /* Lanyard */
    chk("ed-lan-en", C.lanyard.enabled); set("ed-lan-id", C.lanyard.discordId || "");
    chk("ed-lan-sp", C.lanyard.showSpotify); chk("ed-greet", C.greeting.enabled);
    set("ed-greet-tpl", C.greeting.template || "");
    set("ed-cursor", C.cursor.image || ""); set("ed-stats", C.stats.url || "");
    elFill(); fillSfxSliders();
  }

  function renderAllDynamic() {
    safeRender("links", renderLinkRows);
    safeRender("badges", renderBadgeRows);
    safeRender("chips", renderChipRows);
    safeRender("tabs", renderTabRows);
    safeRender("zones", renderZoneRows);
    safeRender("bgList", renderBgRows);
    safeRender("frameGallery", renderFrameGallery);
    safeRender("menus", renderMenuList);
    safeRender("cmMenu", fillCMMenu);
    safeRender("sfxBuiltins", renderSfxList);
    safeRender("sfxCustom", renderSfxCustomList);
    safeRender("searchIndex", refreshSearchIndex);
  }

  function fillValues() {
    safeRender("staticValues", fillStaticValues);
    renderAllDynamic();
  }

  function syncAudio() { if (shell) { const el = q("ed-audio-src"); if (el) el.value = App().CONFIG.audio.source || "video"; } }

  /* ═══ KAYDET / İÇE AKTAR / ŞABLON ═══ */
  function buildFile() {
    const dt = new Date().toISOString();
    return (
      "/* SENKI BIO v5.1 — otomatik üretilen ayar dosyası (" + dt + ") */\n" +
      "/* Kullanım: repo'daki js/config.js ile değiştir, commit + push. */\n" +
      "/* EDIT_MODE'i false bırakmayı unutma. */\n\n" +
      '"use strict";\n\n' +
      "window.CONFIG = " + JSON.stringify(App().CONFIG, null, 2) + ";\n\n" +
      "window.CONFIG_TEMPLATES = " + JSON.stringify(window.CONFIG_TEMPLATES || {}, null, 2) + ";\n"
    );
  }
  function saveConfig() {
    try {
      auditConfig();
      try { localStorage.setItem("senki:config-preview", JSON.stringify(App().CONFIG)); } catch (_) { }
      const blob = new Blob([buildFile()], { type: "text/javascript" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "config.js";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      clearDirty();
      App().toast("config.js indirildi — js/ klasörüne atıp push'la");
    } catch (err) { App().toast("Kaydedilemedi: " + err.message, "err"); }
  }
  function importConfig(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const imported = grabObject(r.result, "CONFIG");
        if (!imported || typeof imported !== "object") throw new Error("CONFIG bulunamadı");
        const tpls = grabObject(r.result, "CONFIG_TEMPLATES");
        replaceConfig(clone(imported));
        if (tpls) window.CONFIG_TEMPLATES = tpls;
        auditConfig();
        App().applyAll(); App().applyBio(); App().Lanyard.start();
        if (App().applyAntiDebug) App().applyAntiDebug();
        if (App().applyEntry) App().applyEntry();
        fillValues(); clearDirty();
        App().toast("Yapılandırma içe aktarıldı");
      } catch (err) { App().toast("İçe aktarılamadı: " + err.message, "err"); }
      e.target.value = "";
    };
    r.readAsText(f);
  }
  function loadTemplate(key) {
    const tpl = window.CONFIG_TEMPLATES && window.CONFIG_TEMPLATES[key];
    if (!tpl) return;
    replaceConfig(clone(tpl));
    auditConfig();
    App().applyAll(); App().applyBio(); App().Lanyard.start();
    if (App().applyAntiDebug) App().applyAntiDebug();
    if (App().applyEntry) App().applyEntry();
    fillValues(); clearDirty();
    const labels = { scratch: "SIFIR", classic: "V1 Klasik", def: "Varsayılan" };
    App().toast((labels[key] || key) + " şablonu yüklendi");
  }

  /* ═══ INIT ═══ */
  function init() {
    if (inited || !window.EDIT_MODE || !window.SenkiApp) return;
    inited = true;
    try {
      ensureShape(App().CONFIG);
      injectStyles();
      injectEmergencyFrames();
      buildBadge();
      modern = !window.EDITOR_LEGACY;
      if (modern) buildModern(); else buildLegacy();
    } catch (err) {
      console.error("[senki-editör] kabuk kurulamadı:", err);
      return;
    }
    SECTIONS.forEach(sec => { try { sec.bind(); } catch (err) { console.error("[senki-editör] bölüm '" + sec.id + "' bind:", err); } });
    fillValues();
    if (emergencyFrames) safeApply(() => { App().Avatar.apply(); App().fit(true); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    setTimeout(() => setOpen(true), 250);
    let nF = 0; try { nF = window.SenkiFrames ? SenkiFrames.list().length : 0; } catch (_) { }
    console.info("[senki-editör] kabuk:", modern ? "modern" : "legacy",
      "· bölüm:", SECTIONS.length, "· çerçeve:", nF,
      "· hazır shader:", SFX_BUILTIN.length, "· özel shader:", (App().CONFIG.shaders || []).length,
      "· intro:", ((App().CONFIG.intro || {}).style || "boot"),
      emergencyFrames ? "· ⚠ ACİL ÇERÇEVE" : "");
    if (emergencyFrames) console.error("[senki-editör] ⚠ frames.js bozuk.");
    if (!App().ShaderFX) console.info("[senki-editör] ⚠ ShaderFX yok — main.js v5 yüklü mü?");
  }

  return { init, syncAudio, auditConfig, renderAllDynamic };
})();