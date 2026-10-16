"use strict";
/* ═══ js/frames.js — v4.8: 33 ÇERÇEVE ═══
   API: { html, front?, overlay?, init(slotEl, frontEl, overlayEl, opts), destroy }
   • html → slot(z1, avatar arkası; media diski içinde kalan kısım doğal maskelenir)
     · front → z3 (fr-full = tam görünür; yoksa alt-yarı clip) · overlay → z5 (--frov, screen).
   ─────────────────────────────────────────────────────────────────────────────
   KATMAN + DOLGU HARİTASI v4.8 — B=slot(z1) F=front(z3) O=overlay(z5).
   S=stroke-only · SA=stroke+accent≤.35 · P=canvas · T=metin(annulus).
   KURAL: avatar diskinde mat/siyah opak dolgu YASAK (bilinçli overlay hariç);
   metin en az yarıçap+8px annulus'ta.
     ring          B    S      tesseract    F(P) P — v4.8 TAM CANVAS: foto İKİ küpün
     square        B    S                        ortasında (iç ~1.1×foto, dış ~1.5×av
     hex           B    S                        çapı); karşıt dönüş, kenarlar
     none          —    —                        uzaklığa göre sıralı (uzak soluk,
     math          F(P) P+T                     yakın parlak); sıfır CSS bağımlılığı
     radar         B(P) P — v4.8 TAM CANVAS: kadran halkaları + bearing tick/etiket
                        + saat-yönü sweep (parlak uç önde, fosfor izi arkada) + PRNG
                        blip'ler — hepsi tek tuvalde, yalnız dış bantta
     target/gears/barbed/stamp/barcode  B  S/SA
     compass       B+F  S      constellation O(P) P (düğüm glow, çizgi .75)
     liquid        B    SA     soundwave   F(P) P (ses-reaktif; host inline -25%)
     orbit/orrery/parallax  B+F S (clip derinlik)
     swords        B+F(P) S+P  laurel F S · snow/stars/flame F(P) P
     lightning     F(P) P      chain F SA · clock F S · magic B+O+F S
     holo/vhs/ekg  O    SA/S   neon B+O · summon B+F+O S (rün tick + daire sigil)
   GÖRSEL KABUL: tesseract: teller yüzün üstünden geçer, foto iki kafesin
   ortasında; radar: sweep yalnız bantta, yüz temiz; math: merkez boş. ═══ */
window.SenkiFrames = (function () {

  /* PRNG — mulberry32 */
  const mulberry32 = (seed) => {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const mountSeed = () => ((Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0);

  /* TimeDilation köprüsü — null-safe */
  const TD = () => (window.SenkiApp && window.SenkiApp.TimeDilation) || null;
  const vtime = (t) => { const d = TD(); return (d && d.now) ? d.now(t) : t; };
  const vdate = () => { const d = TD(); return (d && d.virtualDate) ? d.virtualDate() : new Date(); };

  function loopAttach(fn) {
    const L = window.SenkiApp && window.SenkiApp.Loop;
    if (L && L.add && L.remove) { L.add(fn); return () => { try { L.remove(fn); } catch (_) {} }; }
    let on = true;
    const tick = (t) => { if (!on) return; fn(t); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    return () => { on = false; };
  }
  const appPerf = () => (window.SenkiApp && window.SenkiApp.Perf) || null;

  /* ── CANVAS FX RUNNER — t = SANİYE, dpr cap, tam clearRect ── */
  function canvasFX(host, opts, make) {
    if (!host) return null;
    const cv = document.createElement("canvas");
    cv.className = "fr-cv";
    host.appendChild(cv);
    const ctx = cv.getContext("2d");
    const S = { cv, ctx, rng: mulberry32(mountSeed()), W: 112, H: 112 };
    const cap = (n) => { const P = appPerf(); return P ? P.cap(n) : n; };
    const dpr = () => { const P = appPerf(); return Math.min(P ? P.dpr() : (devicePixelRatio || 1), 2); };
    const fit = () => {
      const d = dpr();
      S.W = host.clientWidth || 112; S.H = host.clientHeight || 112;
      cv.width = Math.max(1, Math.round(S.W * d));
      cv.height = Math.max(1, Math.round(S.H * d));
      cv.style.width = S.W + "px"; cv.style.height = S.H + "px";
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    fit();
    let inst = null;
    try { inst = make(S, cap) || {}; } catch (_) { cv.remove(); return null; }
    if (opts && opts.static) {
      try { if (inst.staticRender) inst.staticRender(ctx, S.W, S.H, S.rng); } catch (_) {}
      return { inst, destroy() { if (inst._rm) inst._rm(); cv.remove(); } };
    }
    let lw = 0, lh = 0;
    const onR = () => {
      if (host.clientWidth === lw && host.clientHeight === lh) return;
      lw = host.clientWidth; lh = host.clientHeight;
      fit(); if (inst.resize) inst.resize();
    };
    window.addEventListener("resize", onR, { passive: true });
    let last = 0;
    const stop = loopAttach((rawT) => {
      const t = vtime(rawT) / 1000;             /* t = SANİYE */
      const dt = last ? Math.min(0.05, Math.max(0, t - last)) : 0.016;
      last = t;
      try {
        ctx.clearRect(0, 0, S.W, S.H);
        inst.step(t, dt);
        inst.render(ctx, S.W, S.H, t);
      } catch (_) {}
    });
    return { inst, destroy() { if (inst._rm) inst._rm(); window.removeEventListener("resize", onR); stop(); cv.remove(); } };
  }

  const SVGFULL = ' style="position:absolute;inset:0;width:100%;height:100%;overflow:visible"';

  /* ── işaretlemeler ── */
  const ORBIT = `<div class="frx fr-orbit"><div class="ob o1"><i class="pl"></i></div><div class="ob o2"><i class="pl p2"></i></div></div>`;
  const ORRERY = `<div class="frx fr-orrery"><div class="or-sys"><i class="or-orbit o1"><span class="or-arm a1"><i class="or-planet p1"></i></span></i><i class="or-orbit o2"><span class="or-arm a2"><i class="or-planet p2"><i class="or-moon"></i></i></span></i><i class="or-orbit o3"><span class="or-arm a3"><i class="or-planet p3"></i></span></i><i class="or-belt"></i></div></div>`;
  const PARALLAX = `<div class="frx fr-parallax"><i class="l1"></i><i class="l2"></i><i class="l3"></i></div>`;
  const HOLO = `<div class="frx fr-holo"><i class="sl"></i><i class="gl"></i></div>`;
  const VHS = `<div class="frx fr-vhs"><b class="vt">--:--:--</b><i class="trk"></i><i class="grd"></i></div>`;
  const EKG = `<div class="frx fr-ekg"><svg viewBox="0 0 100 100"${SVGFULL}><path d="M4,50 L22,50 L28,38 L34,64 L40,50 L58,50 L64,28 L72,72 L78,50 L96,50" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></div>`;
  const NEON_BACK = `<div class="frx fr-neon"><i class="nr"></i></div>`;
  const NEON_OV = `<div class="frx fr-ov-neon"></div>`;
  const LAUREL = `<div class="frx fr-full fr-laurel"><svg viewBox="0 0 100 100"${SVGFULL}><g><path d="M31,16 Q14,50 31,84"/>${[[27,22,-60],[21,32,-40],[17,44,-12],[17,56,12],[21,68,40],[27,78,60]].map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="6.5" ry="2.6" transform="rotate(${r} ${x} ${y})"/>`).join("")}</g><g><path d="M69,16 Q86,50 69,84"/>${[[73,22,60],[79,32,40],[83,44,12],[83,56,-12],[79,68,-40],[73,78,-60]].map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="6.5" ry="2.6" transform="rotate(${r} ${x} ${y})"/>`).join("")}</g></svg></div>`;
  const MATH_POOL = ["∑1/n² = π²/6", "e^iπ + 1 = 0", "∮E·dA = Q/ε₀", "∇×B = μ₀J", "lim(1+1/n)ⁿ = e", "det(A−λI) = 0", "ζ(2) = π²/6", "dy/dx = eˣ", "∫e^(−x²)dx = √π", "a² + b² = c²"];

  /* compass v3 — stroke baklava ibre */
  const CPTICKS3 = Array.from({ length: 24 }, (_, i) => {
    const a = i * 15 * Math.PI / 180, R1 = 44.5, R2 = (i % 6 === 0) ? 38.5 : 41.5;
    return `<line x1="${(50 + Math.cos(a) * R1).toFixed(1)}" y1="${(50 + Math.sin(a) * R1).toFixed(1)}" x2="${(50 + Math.cos(a) * R2).toFixed(1)}" y2="${(50 + Math.sin(a) * R2).toFixed(1)}" stroke="currentColor" stroke-opacity="${i % 6 === 0 ? .85 : .5}" stroke-width="${i % 6 === 0 ? 1.4 : .8}"/>`;
  }).join("");
  const COMPASS3_BACK = `<div class="frx fr-compass3"><svg viewBox="0 0 100 100"${SVGFULL}>
      <circle cx="50" cy="50" r="44.5" fill="none" stroke="currentColor" stroke-opacity=".8" stroke-width="1.3"/>
      <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width=".7"/>
      ${CPTICKS3}
      <text x="50" y="4.5" text-anchor="middle" font-size="7.5" fill="currentColor">K</text>
      <text x="96.4" y="53" text-anchor="middle" font-size="7.5" fill="currentColor">D</text>
      <text x="50" y="97.8" text-anchor="middle" font-size="7.5" fill="currentColor">G</text>
      <text x="3.6" y="53" text-anchor="middle" font-size="7.5" fill="currentColor">B</text>
      <g class="cpn-g" transform="rotate(0 50 50)">
        <polygon points="50,7 53.4,50 46.6,50" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
        <polygon points="46.6,50 53.4,50 50,93" fill="none" stroke="#9fb2c8" stroke-width="2" stroke-opacity=".85" stroke-linejoin="round"/>
      </g>
      <circle cx="50" cy="50" r="4.2" fill="none" stroke="currentColor" stroke-width="1.2"/>
    </svg></div>`;
  const COMPASS3_FRONT = `<div class="frx fr-full fr-compass-f3"><div class="cp-rot"><span class="cp-tip"><svg viewBox="0 0 20 20"><path d="M10 2 L14 12 L10 9.6 L6 12 Z" fill="#e6b34d" stroke="#f6d68b" stroke-width="1"/></svg></span></div></div>`;

  /* swords v3 — bıçaklar BACK */
  const SWORDS3_BACK = `<div class="frx fr-swords3"><svg viewBox="0 0 100 100"${SVGFULL}>
    <defs><linearGradient id="swG3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8a6f2e"/><stop offset=".4" stop-color="#f8e6b0"/>
      <stop offset=".65" stop-color="#e6b34d"/><stop offset="1" stop-color="#8a6f2e"/>
    </linearGradient></defs>
    <line class="sw3-blade" x1="14" y1="86" x2="89" y2="11" stroke="url(#swG3)" stroke-width="3.4" stroke-linecap="round"/>
    <polygon points="15.2,87.2 90.2,12.2 87.8,9.8 12.8,84.8" fill="url(#swG3)" fill-opacity=".25"/>
    <line class="sw3-blade" x1="86" y1="86" x2="11" y2="11" stroke="url(#swG3)" stroke-width="3.4" stroke-linecap="round"/>
    <polygon points="84.8,87.2 9.8,12.2 12.2,9.8 87.2,84.8" fill="url(#swG3)" fill-opacity=".25"/>
    <line x1="17.3" y1="74.3" x2="25.7" y2="82.7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <line x1="82.7" y1="74.3" x2="74.3" y2="82.7" stroke="currentColor" stroke-width="2.6" strokecap="round"/>
    <circle cx="12.4" cy="87.6" r="2.4" fill="currentColor" fill-opacity=".55" stroke="none"/>
    <circle cx="87.6" cy="87.6" r="2.4" fill="currentColor" fill-opacity=".55" stroke="none"/>
  </svg></div>`;

  /* chain v3 — geçmeli halkalar */
  const CHAIN3 = (() => {
    const links = [];
    for (let i = 0; i < 18; i++) {
      const a = (i * 20) * Math.PI / 180, R = 45.5;
      const x = (50 + R * Math.cos(a)).toFixed(2), y = (50 + R * Math.sin(a)).toFixed(2);
      const tang = i * 20 + 90, odd = i % 2 === 1;
      const rot = (odd ? tang + 90 : tang).toFixed(1);
      const sc = odd ? `translate(${x} ${y}) scale(.45 1) translate(-${x} -${y})` : "";
      links.push(`<g transform="rotate(${rot} ${x} ${y})">
        <ellipse cx="${x}" cy="${y}" rx="11" ry="4.5" transform="${sc}" fill="url(#chM3)" fill-opacity=".35" stroke="rgba(90,72,38,.9)" stroke-width="1"/>
        <ellipse cx="${x}" cy="${(y - 1.5).toFixed(2)}" rx="6" ry="1.2" transform="${sc}" fill="rgba(255,248,225,.75)" stroke="none"/>
      </g>`);
    }
    return `<div class="frx fr-full fr-chain3"><svg viewBox="0 0 100 100"${SVGFULL}>
      <defs><linearGradient id="chM3" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6b5a35"/><stop offset=".4" stop-color="#e6b34d"/>
        <stop offset=".6" stop-color="#f8e6b0"/><stop offset="1" stop-color="#8a6f2e"/>
      </linearGradient></defs>
      <g class="ch3-g">${links.join("")}</g>
    </svg></div>`;
  })();

  /* clock v3 — bant tick + kısa ibreler */
  const CKTICKS3 = Array.from({ length: 12 }, (_, i) => {
    const a = i * 30 * Math.PI / 180;
    return `<line x1="${(50 + Math.cos(a) * 49).toFixed(1)}" y1="${(50 + Math.sin(a) * 49).toFixed(1)}" x2="${(50 + Math.cos(a) * 46).toFixed(1)}" y2="${(50 + Math.sin(a) * 46).toFixed(1)}" stroke="currentColor" stroke-width="1.3" stroke-opacity=".85"/>`;
  }).join("") + Array.from({ length: 60 }, (_, i) => {
    if (i % 5 === 0) return "";
    const a = i * 6 * Math.PI / 180;
    return `<line x1="${(50 + Math.cos(a) * 49).toFixed(1)}" y1="${(50 + Math.sin(a) * 49).toFixed(1)}" x2="${(50 + Math.cos(a) * 47.6).toFixed(1)}" y2="${(50 + Math.sin(a) * 47.6).toFixed(1)}" stroke="currentColor" stroke-width=".6" stroke-opacity=".45"/>`;
  }).join("");
  const CLOCK3_FRONT = `<div class="frx fr-full fr-clock3"><svg viewBox="0 0 100 100"${SVGFULL}>
      <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" stroke-opacity=".8" stroke-width="1.2"/>
      ${CKTICKS3}
      <text class="ck-num" x="50" y="11" text-anchor="middle" font-size="7" fill="currentColor">12</text>
      <text class="ck-num" x="90.5" y="52.6" text-anchor="middle" font-size="7" fill="currentColor">3</text>
      <text class="ck-num" x="50" y="94.6" text-anchor="middle" font-size="7" fill="currentColor">6</text>
      <text class="ck-num" x="9.5" y="52.6" text-anchor="middle" font-size="7" fill="currentColor">9</text>
      <line class="ckh" x1="50" y1="1.8" x2="50" y2="9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
      <line class="ckm" x1="50" y1="1.8" x2="50" y2="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
      <line class="cks" x1="50" y1="1.8" x2="50" y2="15" fill="none" stroke="#e07a5f" stroke-width=".9" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="1.4" fill="currentColor" fill-opacity=".9" stroke="none"/>
    </svg></div>`;

  /* magic v3 — fill:none */
  const HEPTA = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI / 2 + i * 2 * Math.PI / 7;
    return `${(50 + 44 * Math.cos(a)).toFixed(1)},${(50 + 44 * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  const MAGIC3_BACK = `<div class="frx fr-magic3"><svg viewBox="0 0 100 100"${SVGFULL}>
      <defs><path id="mg3A" d="M50,50 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/><path id="mg3B" d="M50,50 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0"/></defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width=".8"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width=".6" stroke-dasharray="2 4"/>
      <text fill="currentColor" fill-opacity=".85" font-size="6" letter-spacing="3"><textPath href="#mg3A">ᚨᛟᚱᛝᛉᛊᚦᛖᚹᛚᚨᛟᚱᛝᛉᛊᚦ</textPath></text>
      <text fill="currentColor" fill-opacity=".55" font-size="5" letter-spacing="3"><textPath href="#mg3B">ᚨᛟᚱᛝᛉᛊᚦᛖᚹ</textPath></text>
      <g class="mg3-hepta"><polygon points="${HEPTA}" fill="none" stroke="currentColor" stroke-width=".9" stroke-opacity=".8"/></g>
      <g class="mg3-tri"><polygon points="50,8 22,58 78,58" fill="none" stroke="currentColor" stroke-width=".8" stroke-opacity=".6"/></g>
    </svg></div>`;
  const MAGIC3_OV = `<div class="frx fr-ov-magic" style="--frov:.3"></div>`;
  const MAGIC3_FRONT = `<div class="frx fr-full fr-magic3-f">
    <i class="mg-sat3 ms1"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M10 3.5v13M4.5 7l11 6M15.5 7l-11 6" fill="none" stroke="currentColor" stroke-width=".7" stroke-opacity=".8"/></svg></i>
    <i class="mg-sat3 ms2"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="5.5" y="5.5" width="9" height="9" transform="rotate(45 10 10)" fill="none" stroke="currentColor" stroke-width=".8"/></svg></i>
    <i class="mg-sat3 ms3"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.3"/><polygon points="10,3 17.5,16 2.5,16" fill="none" stroke="currentColor" stroke-width=".8"/></svg></i>
    <i class="mg-sp" style="--T:9s;--R:calc(var(--av-sz,112px)*.44)"></i>
    <i class="mg-sp" style="--T:13s;--R:calc(var(--av-sz,112px)*.4);animation-direction:reverse"></i>
    <i class="mg-sp" style="--T:7s;--R:calc(var(--av-sz,112px)*.47);animation-delay:-3s"></i>
  </div>`;

  /* summon v3 — rün tick + daire sigiller */
  const SUM3_BACK = `<div class="frx fr-summon"><svg viewBox="0 0 100 100" class="sum-svg"${SVGFULL}>
      <defs><path id="sum3-arc" d="M50,50 m-46.3,0 a46.3,46.3 0 1,1 92.6,0 a46.3,46.3 0 1,1 -92.6,0"/></defs>
      <circle class="sum-o1" cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-opacity=".9"/>
      <circle class="sum-o2" cx="50" cy="50" r="44.6" fill="none" stroke="currentColor" stroke-width=".7" stroke-opacity=".5"/>
      <g class="sum-runes"><circle class="sum-tick" cx="50" cy="50" r="46.3" fill="none" stroke="currentColor" stroke-width="4.6" stroke-opacity=".55" stroke-dasharray="1.4 5"/>
        <text class="sum-glyphs" fill="currentColor" fill-opacity=".85" font-size="6" letter-spacing="4"><textPath href="#sum3-arc">ᚨ ᛟ ᚱ ᛝ ᛉ ᛊ ᚦ ᛖ ᚹ ᛚ ᚨ ᛟ</textPath></text></g>
      <g class="sum-matrix"><polygon class="sum-tri" points="50,10 15.4,70 84.6,70" fill="none" stroke="currentColor" stroke-width=".9" stroke-opacity=".55"/>
        <rect class="sum-sq" x="21.5" y="21.5" width="57" height="57" transform="rotate(45 50 50)" fill="none" stroke="currentColor" stroke-width=".7" stroke-opacity=".35"/></g>
    </svg></div>`;
  const SUM3_CHIPS = `<div class="frx fr-sum-chips3"><div class="sum-orbit3">
    <i class="sg sg1"><b>ᚨ</b></i><i class="sg sg2"><b>ᛟ</b></i><i class="sg sg3"><b>ᚱ</b></i><i class="sg sg4"><b>ᛝ</b></i>
  </div></div>`;
  const SUM3_FRONT = `<div class="frx fr-full fr-sum-front3">
      <i class="sum-sat s1"><svg viewBox="0 0 20 20"><polygon points="10,2 18,16 2,16"/></svg></i>
      <i class="sum-sat s2"><svg viewBox="0 0 20 20"><rect x="4" y="4" width="12" height="12" transform="rotate(45 10 10)"/></svg></i>
    </div>`;
  const SUM3_OV = `<div class="frx fr-sum-ov" style="--frov:.25"><svg viewBox="0 0 100 100"${SVGFULL}>
      <g fill="none" stroke="currentColor" stroke-width=".5" stroke-opacity=".8">
        <line x1="30" y1="30" x2="50" y2="50"/><line x1="79" y1="50" x2="50" y2="50"/>
        <line x1="50" y1="10" x2="50" y2="50"/><line x1="15.4" y1="70" x2="50" y2="50"/>
        <line x1="84.6" y1="70" x2="50" y2="50"/>
      </g></svg><i class="sum-core"></i></div>`;

  const R = {

    /* ═══ back-only ═══ */
    ring:      { html: `<div class="frx fr-ring"></div>` },

    /* 1) TESSERACT v4 — TAM CANVAS: foto iki küpün ortasında.
       İç küp fotoğrafı sarar (~1.1×foto çapı), dış küp avatarı (~1.5×av çapı);
       karşıt yönlerde ağır dönerler; kenarlar uzaklığa göre sıralanır —
       uzak teller soluk/ince, yakın teller parlak/kalın → gerçek kafes hissi.
       Sıfır CSS bağımlılığı (yalnız base .frx/.fr-cv/.fr-full). */
    tesseract: { front: `<div class="frx fr-full fr-tess4" style="inset:calc(var(--av-sz,112px)*-.42)"></div>`,
      init(slot, front, ov, opts) {
        const host = front && front.querySelector(".fr-tess4"); if (!host) return null;
        return canvasFX(host, opts, (S, cap) => {
          const accent = (getComputedStyle(host).color || "").trim() || "#e6b34d";
          const F = 9;                                    /* perspektif odak uzaklığı */
          /* s: küp yarı-boyutu (W oranı) · sp: rad/sn · tilt: sabit X eğimi
             host = 1.84×av → foto yarıçapı ≈ .272W; iç .30W sarar, dış .40W */
          const cubes = [
            { s: .40, sp: .30, dir:  1, tilt: -.38, a0: S.rng() * 6.28, lw: 1.6, base: .34 },
            { s: .30, sp: .50, dir: -1, tilt:  .46, a0: S.rng() * 6.28, lw: 1.3, base: .58 },
          ];
          const V = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
          const E = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
          const proj = (c, t) => {
            const ry = c.a0 + t * c.sp * c.dir;
            const rx = c.tilt + Math.sin(t * .25 + c.a0) * .07;   /* hafif nefes */
            const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
            const s = S.W * c.s;
            return V.map(([x, y, z]) => {
              const X = x * cy + z * sy, Z1 = -x * sy + z * cy;    /* rotateY */
              const Y = y * cx - Z1 * sx, Z2 = y * sx + Z1 * cx;   /* rotateX */
              const p = F / (F + Z2);                              /* Z2 büyük = uzak */
              return { x: S.W / 2 + X * s * p, y: S.W / 2 + Y * s * p, z: Z2 };
            });
          };
          const draw = (ctx, t) => {
            for (const c of cubes) {
              const P = proj(c, t);
              /* uzak → yakın sırala: yakın teller EN SON çizilir (üstte kalır) */
              const edges = E.map(([a, b]) => ({ a: P[a], b: P[b], z: (P[a].z + P[b].z) / 2 }))
                             .sort((u, v) => v.z - u.z);
              for (const e of edges) {
                const near = Math.max(0, Math.min(1, (1.8 - e.z) / 3.6));  /* 0 uzak … 1 yakın */
                ctx.globalAlpha = c.base * (.35 + .65 * near);
                ctx.strokeStyle = accent;
                ctx.lineWidth = c.lw * (.75 + .55 * near);
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(e.a.x, e.a.y);
                ctx.lineTo(e.b.x, e.b.y);
                ctx.stroke();
              }
            }
            ctx.globalAlpha = 1;
          };
          return {
            step() {},
            render(ctx, W, H, t) { draw(ctx, t); },
            staticRender(ctx, W, H, rng) { draw(ctx, rng() * 40); },
          };
        });
      } },

    square:    { html: `<div class="frx fr-sq"><i class="d a"></i><i class="d b"></i></div>` },
    hex:       { html: `<div class="frx fr-hex"><svg viewBox="0 0 100 100"${SVGFULL}><polygon class="h1" points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5"/><polygon class="h2" points="50,22 74,36 74,64 50,78 26,64 26,36"/></svg></div>` },
    none:      { html: `` },

    /* 2) math — "Çözücü Halkası": pergel intro + 3 plaka, merkez BOŞ */
    math:      { front: `<div class="frx fr-full fr-math-c" style="inset:calc(var(--av-sz,112px)*-.38)"></div>`,
      init(slot, front, ov, opts) {
        const host = front && front.querySelector(".fr-math-c"); if (!host) return null;
        return canvasFX(host, opts, (S, cap) => {
          const pick = () => MATH_POOL[(S.rng() * MATH_POOL.length) | 0];
          const lanes = [
            { r: .400, sp: .42, dir:  1, a0: S.rng() * 6.28 },
            { r: .436, sp: .30, dir: -1, a0: S.rng() * 6.28 },
            { r: .470, sp: .22, dir:  1, a0: S.rng() * 6.28 },
          ].map(l => Object.assign(l, { txt: pick(), swapAt: 3 + S.rng() * 3, tAcc: 0, alpha: 1, squash: 1 }));
          const INTRO = 3.6;
          let introDone = !!(opts && opts.static);
          const clamp2 = (v, a, b) => Math.max(a, Math.min(b, v));
          const chip = (ctx, W, lane, t, tt) => {
            const ang = lane.a0 + t * lane.sp * lane.dir;
            const x = W / 2 + Math.cos(ang) * W * lane.r, y = W / 2 + Math.sin(ang) * W * lane.r;
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(lane.squash, 1);                       /* çözüm adımı: yatay ezilme */
            let fs = W * .037;
            ctx.font = `600 ${fs.toFixed(1)}px Georgia, serif`;
            while (ctx.measureText(lane.txt).width > W * .24 && fs > W * .024) {
              fs *= .94; ctx.font = `600 ${fs.toFixed(1)}px Georgia, serif`;
            }
            const tw = ctx.measureText(lane.txt).width;
            const pw = tw + W * .022, ph = W * .07, rr = ph * .42;
            ctx.fillStyle = "rgba(230,179,77,.06)";
            ctx.strokeStyle = `rgba(230,179,77,${(0.75 * lane.alpha * tt).toFixed(2)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-pw / 2 + rr, -ph / 2);
            ctx.arcTo(pw / 2, -ph / 2, pw / 2, ph / 2, rr);
            ctx.arcTo(pw / 2, ph / 2, -pw / 2, ph / 2, rr);
            ctx.arcTo(-pw / 2, ph / 2, -pw / 2, -ph / 2, rr);
            ctx.arcTo(-pw / 2, -ph / 2, pw / 2, -ph / 2, rr);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.shadowColor = "rgba(230,179,77,.8)"; ctx.shadowBlur = 5;
            ctx.fillStyle = `rgba(246,214,139,${(0.95 * lane.alpha * tt).toFixed(2)})`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(lane.txt, 0, 0.5);
            ctx.restore();
          };
          return {
            step(t, dt) {
              if (!introDone) return;
              for (const l of lanes) {
                l.tAcc += dt;
                if (l.squash < 1) l.squash = Math.min(1, l.squash + dt * 6);
                if (l.tAcc >= l.swapAt) { l.tAcc = 0; l.txt = pick(); l.alpha = 0; l.squash = 0.12; }
                l.alpha = Math.min(1, l.alpha + dt * 2.2);
              }
            },
            render(ctx, W, H, t) {
              const cx = W / 2, cy = W / 2;
              if (!introDone) {
                const p = t / INTRO;
                if (p >= 1) { introDone = true; return; }
                const rC = W * .47, a0 = -Math.PI / 2;
                const arcP = clamp2((p - .05) / .8, 0, 1);
                ctx.strokeStyle = "rgba(230,179,77,.75)"; ctx.lineWidth = 1.4; ctx.lineCap = "round";
                ctx.setLineDash([W * .012, W * .008]);
                ctx.beginPath(); ctx.arc(cx, cy, rC, a0, a0 + arcP * Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
                const na = a0 + arcP * Math.PI * 2;
                ctx.fillStyle = "rgba(246,214,139,.95)";
                ctx.shadowColor = "rgba(230,179,77,.9)"; ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.arc(cx + Math.cos(na) * rC, cy + Math.sin(na) * rC, W * .008, 0, 6.283); ctx.fill();
                ctx.shadowBlur = 0;
                const PI = "π = 3.14159265";
                const shown = Math.floor(clamp2((p - .12) / .78, 0, 1) * PI.length);
                if (shown > 0) {
                  ctx.font = `600 ${(W * .052).toFixed(1)}px Georgia, serif`;
                  ctx.textAlign = "center"; ctx.textBaseline = "middle";
                  ctx.fillStyle = "rgba(246,214,139,.9)";
                  for (let i = 0; i < shown; i++) {
                    const th = Math.PI * (1.12 + .76 * (i / (PI.length - 1)));
                    ctx.save();
                    ctx.translate(cx + Math.cos(th) * W * .41, cy + Math.sin(th) * W * .41);
                    ctx.rotate(th + Math.PI / 2);
                    ctx.fillText(PI[i], 0, 0);
                    ctx.restore();
                  }
                }
                return;
              }
              ctx.strokeStyle = "rgba(230,179,77,.16)"; ctx.lineWidth = .8;
              ctx.setLineDash([2, 5]);
              for (const l of lanes) { ctx.beginPath(); ctx.arc(cx, cy, W * l.r, 0, 6.283); ctx.stroke(); }
              ctx.setLineDash([]);
              for (const l of lanes) chip(ctx, W, l, t, 1);
            },
            staticRender(ctx, W, H, rng) {
              const cx = W / 2, cy = W / 2;
              ctx.strokeStyle = "rgba(230,179,77,.5)"; ctx.lineWidth = 1.2;
              ctx.setLineDash([2, 5]);
              for (const l of lanes) { ctx.beginPath(); ctx.arc(cx, cy, W * l.r, 0, 6.283); ctx.stroke(); }
              ctx.setLineDash([]);
              for (const l of lanes) chip(ctx, W, Object.assign({}, l, { alpha: 1, squash: 1 }), 0, 1);
            }
          };
        });
      } },

    /* 3) RADAR v4 — TAM CANVAS (kadran+sweep+blip tek tuval; host = frx →
       boyut hatası yok). Sweep SAAT YÖNÜNDE: parlak uç önde, iz arkada sönüyor. */
    radar:     { html: `<div class="frx fr-radar4" style="inset:calc(var(--av-sz,112px)*-.35)"></div>`,
      init(slot, front, ov, opts) {
        const host = slot && slot.querySelector(".fr-radar4"); if (!host) return null;
        return canvasFX(host, opts, (S, cap) => {
          const accent = (getComputedStyle(host).color || "").trim() || "#e6b34d";
          const blips = []; let blipAt = .6;
          const drawDial = (ctx, W) => {
            const cx = W / 2, cy = W / 2, c = W / 2;
            ctx.strokeStyle = accent; ctx.globalAlpha = .55; ctx.lineWidth = Math.max(1, W * .006);
            for (const r of [.985, .90, .82]) { ctx.beginPath(); ctx.arc(cx, cy, c * r, 0, 6.283); ctx.stroke(); }
            for (let i = 0; i < 36; i++) {                    /* bearing tick'leri */
              const a = i * 10 * Math.PI / 180, maj = i % 9 === 0;
              const r1 = c * .985, r2 = c * (maj ? .90 : .945);
              ctx.globalAlpha = maj ? .85 : .45;
              ctx.lineWidth = Math.max(1, W * (maj ? .008 : .004));
              ctx.beginPath();
              ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
              ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
              ctx.stroke();
            }
            ctx.globalAlpha = .85; ctx.fillStyle = accent;
            ctx.font = `600 ${(W * .028).toFixed(1)}px Georgia, serif`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            const lab = [["0", 0], ["90", 90], ["180", 180], ["270", 270]];
            for (const [t, d] of lab) {
              const a = d * Math.PI / 180 - Math.PI / 2;       /* 0 = yukarı, saat yönü artar */
              ctx.fillText(t, cx + Math.cos(a) * c * .965, cy + Math.sin(a) * c * .965);
            }
            ctx.globalAlpha = 1;
          };
          return {
            step(t, dt) {
              if (t >= blipAt) { blipAt = t + 1.2 + S.rng() * 2.2;
                const a = S.rng() * 6.283, rr = .84 + S.rng() * .12;
                blips.push({ a, rr, born: t, life: 2.4 + S.rng() * 1.4 }); }
              for (let i = blips.length - 1; i >= 0; i--) if (t - blips[i].born > blips[i].life) blips.splice(i, 1);
            },
            render(ctx, W, H, t) {
              drawDial(ctx, W);
              const cx = W / 2, cy = W / 2, c = W / 2;
              /* sweep: yalnız dış bantta (r .62c–c); saat yönünde */
              const sa = (t * 1.5) % 6.283;                    /* ters yön: sa = -(t*1.5)%6.283 */
              ctx.save();
              ctx.beginPath();
              ctx.arc(cx, cy, c, 0, 6.283);
              ctx.arc(cx, cy, c * .62, 0, 6.283, true);
              ctx.clip();
              if (ctx.createConicGradient) {
                const g = ctx.createConicGradient(sa, cx, cy);
                g.addColorStop(0.00, "rgba(230,179,77,0)");
                g.addColorStop(0.80, "rgba(230,179,77,0)");
                g.addColorStop(0.96, "rgba(230,179,77,.42)");
                g.addColorStop(1.00, "rgba(230,179,77,.55)");
                ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
              } else {
                ctx.fillStyle = "rgba(230,179,77,.3)";
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, c, sa - .55, sa); ctx.closePath(); ctx.fill();
              }
              for (const b of blips) {
                const age = (t - b.born) / b.life, al = Math.max(0, 1 - age);
                const x = cx + Math.cos(b.a) * c * b.rr, y = cy + Math.sin(b.a) * c * b.rr;
                ctx.fillStyle = `rgba(246,214,139,${(al * .95).toFixed(2)})`;
                ctx.beginPath(); ctx.arc(x, y, Math.max(1.6, W * .011), 0, 6.283); ctx.fill();
                ctx.strokeStyle = `rgba(230,179,77,${(al * .4).toFixed(2)})`; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(x, y, 2 + age * W * .04, 0, 6.283); ctx.stroke();
              }
              ctx.restore();
            },
            staticRender(ctx, W, H, rng) {
              drawDial(ctx, W);
              const cx = W / 2, cy = W / 2, c = W / 2;
              ctx.save();
              ctx.beginPath(); ctx.arc(cx, cy, c, 0, 6.283); ctx.arc(cx, cy, c * .62, 0, 6.283, true); ctx.clip();
              ctx.fillStyle = "rgba(230,179,77,.3)";
              ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, c, -1.1, -.1); ctx.closePath(); ctx.fill();
              for (let i = 0; i < 2; i++) { const a = rng() * 6.283, rr = .84 + rng() * .12;
                ctx.fillStyle = "rgba(246,214,139,.9)";
                ctx.beginPath(); ctx.arc(cx + Math.cos(a) * c * rr, cy + Math.sin(a) * c * rr, Math.max(1.6, W * .011), 0, 6.283); ctx.fill(); }
              ctx.restore();
            }
          };
        });
      } },

    target:    { html: `<div class="frx fr-target"><i class="tg c1"></i><i class="tg c2"></i><i class="tg c3"></i><i class="tg c4"></i></div>` },
    gears:     { html: `<div class="frx fr-gears"><svg viewBox="0 0 100 100"${SVGFULL}><circle class="g1" cx="50" cy="50" r="46"/><circle class="g2" cx="50" cy="50" r="32"/><circle class="g3" cx="50" cy="50" r="39"/></svg></div>` },
    barbed:    { html: `<div class="frx fr-barbed"></div>` },
    stamp:     { html: `<div class="frx fr-stamp"><i class="r1"></i><i class="r2"></i><b>GİZLİ</b></div>` },
    barcode:   { html: `<div class="frx fr-barcode"></div>` },

    /* 4) compass — stroke baklava ibre + F mini ok */
    compass:   { html: COMPASS3_BACK, front: COMPASS3_FRONT,
      init(slot, front, ov, opts) {
        const host = slot && slot.querySelector(".fr-compass3"); if (!host) return null;
        const g = host.querySelector(".cpn-g");
        const rot = front && front.querySelector(".cp-rot");
        if (opts && opts.static) { if (rot) rot.style.setProperty("--na", "0deg"); return null; }
        let cur = 0;
        const mv = (e) => {
          const r = host.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
          if (!isFinite(dx) || !isFinite(dy) || (dx === 0 && dy === 0)) return;
          const target = Math.atan2(dy, dx) * 180 / Math.PI + 90;
          if (!isFinite(target)) return;
          const d = ((target - cur + 540) % 360) - 180;
          cur = (cur + d * .18 + 360) % 360;
          if (g) g.setAttribute("transform", `rotate(${cur.toFixed(2)} 50 50)`);
          if (rot) rot.style.setProperty("--na", cur.toFixed(2) + "deg");
        };
        window.addEventListener("pointermove", mv, { passive: true });
        return { destroy() { window.removeEventListener("pointermove", mv); } };
      } },

    /* 5) constellation — düğüm glow */
    constellation: { overlay: `<div class="frx fr-const-c" style="--frov:.5"></div>`,
      init(slot, front, ov, opts) {
        const host = ov && ov.querySelector(".fr-const-c"); if (!host) return null;
        return canvasFX(host, opts, (S, cap) => {
          const n = 6 + Math.floor(S.rng() * 4);
          const accent = (getComputedStyle(host).color || "").trim() || "#e6b34d";
          const retarget = (p) => { p.tx = S.W * .08 + S.rng() * S.W * .84; p.ty = S.H * .08 + S.rng() * S.H * .84; };
          const nodes = [];
          for (let i = 0; i < n; i++) { const p = { ph: S.rng() * 6.28 }; retarget(p); p.x = p.tx; p.y = p.ty; nodes.push(p); }
          let nextMorph = 4;
          const draw = (ctx) => {
            const seen = new Set();
            ctx.strokeStyle = accent; ctx.lineWidth = .9;
            for (let i = 0; i < nodes.length; i++) {
              let bi = -1, bd = 1e9;
              for (let j = 0; j < nodes.length; j++) { if (i === j) continue;
                const d = (nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2;
                if (d < bd) { bd = d; bi = j; } }
              if (bi < 0) continue;
              const key = Math.min(i, bi) + "-" + Math.max(i, bi);
              if (seen.has(key)) continue; seen.add(key);
              ctx.globalAlpha = .75;
              ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[bi].x, nodes[bi].y); ctx.stroke();
            }
          };
          const nodeR = (W) => Math.max(2.4, W * .026);
          return {
            step(t, dt) {
              if (t >= nextMorph) { nextMorph = t + 4; nodes.forEach(retarget); }
              const k = Math.min(1, dt * 1.15);
              for (const p of nodes) { p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; }
            },
            render(ctx, W, H, t) {
              draw(ctx);
              const nr = nodeR(W);
              for (const p of nodes) {
                ctx.globalAlpha = .5 + .5 * (0.5 + 0.5 * Math.sin(t * 1.8 + p.ph));
                ctx.fillStyle = "#f6d68b";
                ctx.shadowColor = accent; ctx.shadowBlur = 9;
                ctx.beginPath(); ctx.arc(p.x, p.y, nr, 0, 6.283); ctx.fill();
                ctx.shadowBlur = 0;
              }
              ctx.globalAlpha = 1;
            },
            staticRender(ctx, W, H, rng) {
              draw(ctx);
              const nr = nodeR(W);
              ctx.fillStyle = "#f6d68b"; ctx.shadowColor = accent; ctx.shadowBlur = 8;
              nodes.forEach((p) => { ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(p.x, p.y, nr, 0, 6.283); ctx.fill(); });
              ctx.shadowBlur = 0; ctx.globalAlpha = 1;
            }
          };
        });
      } },

    liquid:    { html: `<div class="frx fr-liquid"><i class="blb"></i></div>` },

    /* 6) soundwave — ses-reaktif; host inline -25% (CSS'e muhtaç değil) */
    soundwave: { front: `<div class="frx fr-full fr-soundwave-c" style="inset:calc(var(--av-sz,112px)*-.25)"></div>`,
      init(slot, front, ov, opts) {
        const host = front && front.querySelector(".fr-soundwave-c"); if (!host) return null;
        return canvasFX(host, opts, (S, cap) => {
          const N = 30;
          const bars = new Float32Array(N), tgt = new Float32Array(N), buf = new Uint8Array(64);
          let hook = null, flat = 0;
          if (!(opts && opts.static)) {
            const A = window.SenkiApp && window.SenkiApp.AudioSys;
            if (A && typeof A.routedFrame === "function") { try { hook = A.routedFrame(true); } catch (_) { hook = null; } }
          }
          return {
            _rm() { if (hook) { try { hook.release(); } catch (_) {} hook = null; } },
            step(t, dt) {
              let live = false;
              if (hook) { try { live = !!hook.read(buf); } catch (_) { live = false; } }
              if (live) {
                let s = 0; for (let i = 0; i < 48; i++) s += buf[i];
                if (s < 60) { if (++flat > 90) live = false; } else flat = 0;
              }
              for (let i = 0; i < N; i++) {
                if (live) {
                  const bi = 2 + Math.floor(Math.pow(i / N, 1.5) * 44);
                  tgt[i] = (buf[bi] / 255) * .95 + .04;
                } else {
                  tgt[i] = .22 + .5 * (0.5 + 0.5 * Math.sin(t * 1.9 + i * .85)) * (0.55 + 0.45 * Math.sin(t * .7 + i * 2.1));
                }
                bars[i] += (tgt[i] - bars[i]) * Math.min(1, dt * 9);
              }
            },
            render(ctx, W, H) {
              const cx = W / 2, cy = H / 2;
              /* host = 1.5×av → foto yarıçapı ≈ .333W; barlar .34W'ten DIŞARI */
              const inner = W * .34, maxLen = W * .14;
              for (let i = 0; i < N; i++) {
                const a = (i / N) * Math.PI * 2 - Math.PI / 2;
                const ca = Math.cos(a), sa = Math.sin(a);
                const r0 = inner + 2, r1 = inner + 4 + bars[i] * maxLen;
                const g = ctx.createLinearGradient(cx + ca * r0, cy + sa * r0, cx + ca * r1, cy + sa * r1);
                g.addColorStop(0, "rgba(246,214,139,.95)");
                g.addColorStop(1, "rgba(201,143,46,.25)");
                ctx.strokeStyle = g; ctx.lineWidth = Math.max(2, W * .012); ctx.lineCap = "round";
                ctx.beginPath(); ctx.moveTo(cx + ca * r0, cy + sa * r0); ctx.lineTo(cx + ca * r1, cy + sa * r1); ctx.stroke();
              }
            },
            staticRender(ctx, W, H, rng) {
              const cx = W / 2, cy = W / 2, inner = W * .34, maxLen = W * .14;
              ctx.strokeStyle = "rgba(230,179,77,.8)"; ctx.lineCap = "round"; ctx.lineWidth = Math.max(2, W * .012);
              for (let i = 0; i < N; i++) {
                const a = (i / N) * Math.PI * 2 - Math.PI / 2, L = inner + 4 + rng() * maxLen;
                ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
                ctx.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); ctx.stroke();
              }
            }
          };
        });
      } },

    /* ═══ back+front (clip derinlik) ═══ */
    orbit:     { html: ORBIT, front: ORBIT },
    orrery:    { html: ORRERY, front: ORRERY },

    /* 7) swords — bıçaklar BACK; F glint + hover slash */
    swords:    { html: SWORDS3_BACK, front: `<div class="frx fr-full fr-swords-c"></div>`,
      init(slot, front, ov, opts) {
        const host = front && front.querySelector(".fr-swords-c"); if (!host) return null;
        return canvasFX(host, opts, (S, cap) => {
          const card = document.querySelector(".profile-card");
          const blades = [[.14, .86, .89, .11], [.86, .86, .11, .11]];
          let pending = false, sparkAt = -10, sparks = [];
          const onEnter = () => { pending = true; };
          if (card && !(opts && opts.static)) card.addEventListener("mouseenter", onEnter, { passive: true });
          return {
            _rm() { if (card) card.removeEventListener("mouseenter", onEnter); },
            step(t, dt) {
              if (pending) { pending = false;
                if (t - sparkAt > 2.5) {
                  sparkAt = t; sparks = [];
                  for (let k = 0; k < 6; k++) sparks.push({ p: S.rng(), off: (S.rng() - .5) * 14, r: .8 + S.rng() * 1.4 });
                } }
            },
            render(ctx, W, H, t) {
              const s = W / 100;
              for (let b = 0; b < 2; b++) {
                const [x0, y0, x1, y1] = blades[b];
                const p = ((t * .22 + b * .5) % 1);
                const fade = Math.sin(p * Math.PI) * .85;
                const gx = (x0 + (x1 - x0) * p) * s, gy = (y0 + (y1 - y0) * p) * s;
                const dx = (x1 - x0) * s, dy = (y1 - y0) * s, L = Math.hypot(dx, dy) || 1;
                const ux = dx / L, uy = dy / L, gl = 11 * s;
                const g = ctx.createLinearGradient(gx - ux * gl, gy - uy * gl, gx + ux * gl, gy + uy * gl);
                g.addColorStop(0, "rgba(255,248,225,0)");
                g.addColorStop(.5, `rgba(255,248,225,${(.8 * fade).toFixed(2)})`);
                g.addColorStop(1, "rgba(255,248,225,0)");
                ctx.strokeStyle = g; ctx.lineWidth = 3 * s; ctx.lineCap = "round";
                ctx.beginPath(); ctx.moveTo(gx - ux * gl, gy - uy * gl); ctx.lineTo(gx + ux * gl, gy + uy * gl); ctx.stroke();
              }
              const st = t - sparkAt;
              if (st >= 0 && st < .55) {
                const [x0, y0, x1, y1] = blades[0];
                const al = 1 - st / .55;
                ctx.strokeStyle = `rgba(255,250,235,${(.95 * al).toFixed(2)})`;
                ctx.lineWidth = 2.4 * s; ctx.lineCap = "round";
                ctx.shadowColor = "rgba(230,179,77,.9)"; ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.moveTo(x0 * s, y0 * s); ctx.lineTo(x1 * s, y1 * s); ctx.stroke();
                ctx.shadowBlur = 0;
                const dx = (x1 - x0), dy = (y1 - y0), L = Math.hypot(dx, dy);
                const px = -dy / L, py = dx / L;
                for (const sp of sparks) {
                  const bx = (x0 + dx * sp.p) * s, by = (y0 + dy * sp.p) * s;
                  ctx.fillStyle = `rgba(246,214,139,${(.9 * al).toFixed(2)})`;
                  ctx.beginPath(); ctx.arc(bx + px * sp.off * s, by + py * sp.off * s, sp.r * s, 0, 6.283); ctx.fill();
                }
              }
            },
            staticRender(ctx, W, H, rng) {
              const s = W / 100;
              ctx.strokeStyle = "rgba(255,248,225,.55)"; ctx.lineWidth = 2.6 * s; ctx.lineCap = "round";
              for (const b of blades) {
                const p = .3 + rng() * .4;
                const gx = (b[0] + (b[2] - b[0]) * p) * s, gy = (b[1] + (b[3] - b[1]) * p) * s;
                ctx.beginPath(); ctx.moveTo(gx - 8 * s, gy - 8 * s); ctx.lineTo(gx + 8 * s, gy + 8 * s); ctx.stroke();
              }
            }
          };
        });
      } },

    parallax:  { html: PARALLAX, front: PARALLAX,
      init(slot, front, ov, opts) {
        if (opts && opts.static) return null;
        let raf = 0, px = 0, py = 0;
        const ap = () => { raf = 0; [slot, front].forEach((c) => { if (!c) return;
          c.querySelectorAll("i").forEach((i) => { i.style.setProperty("--px", px + "px"); i.style.setProperty("--py", py + "px"); }); }); };
        const mv = (e) => { px = (e.clientX / innerWidth - .5) * 14; py = (e.clientY / innerHeight - .5) * 14; if (!raf) raf = requestAnimationFrame(ap); };
        window.addEventListener("pointermove", mv, { passive: true });
        return { destroy() { window.removeEventListener("pointermove", mv); if (raf) cancelAnimationFrame(raf); } }; } },

    /* ═══ front TAM-GÖRÜNÜR ═══ */
    laurel:    { front: LAUREL },

    snow:      { front: `<div class="frx fr-full fr-snow-c"></div>`,
      init(slot, front, ov, opts) {
        const host = front && front.querySelector(".fr-snow-c"); if (!host) return null;
        return canvasFX(host, opts, (S, cap) => {
          const N = cap(26);
          const mk = () => ({ x: S.rng() * S.W, y: S.rng() * S.H, r: 1 + S.rng() * 2.5,
            vy: 24 + S.rng() * 48, amp: 3 + S.rng() * 7, fr: .5 + S.rng() * 1.2,
            ph: S.rng() * 6.28, drift: (S.rng() - .5) * 10 });
          const ps = []; for (let i = 0; i < N; i++) ps.push(mk());
          let wind = 0;
          return {
            __testField: () => ps.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" "),
            step(t, dt) {
              wind = Math.sin(t * .25) * 10;
              for (const p of ps) {
                p.y += p.vy * dt;
                p.x += (Math.sin(t * p.fr + p.ph) * p.amp * p.fr + wind * .5 + p.drift) * dt;
                if (p.y > S.H + 4) { p.y = -4; p.x = S.rng() * S.W; }
                if (p.x < -6) p.x += S.W + 12; else if (p.x > S.W + 6) p.x -= S.W + 12;
              }
            },
            render(ctx) {
              ctx.fillStyle = "rgba(255,255,255,.92)";
              for (const p of ps) {
                ctx.globalAlpha = .4 + .5 * (p.r / 3.5);
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
              }
              ctx.globalAlpha = 1;
            },
            staticRender(ctx, W, H, rng) {
              ctx.fillStyle = "rgba(255,255,255,.85)";
              for (let i = 0; i < 5; i++) { const x = rng() * W, y = rng() * H, r = 1.2 + rng() * 2.2;
                ctx.globalAlpha = .4 + rng() * .5; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); }
              ctx.globalAlpha = 1;
            } };
        });
      } },

    stars:     { front: `<div class="frx fr-full fr-stars-c"></div>`,
      init(slot, front, ov, opts) {
        const host = front && front.querySelector(".fr-stars-c"); if (!host) return null;
        return canvasFX(host, opts, (S, cap) => {
          const N = cap(16);
          const st = []; for (let i = 0; i < N; i++)
            st.push({ x: S.rng() * S.W, y: S.rng() * S.H, r: .7 + S.rng() * 1.3, ph: S.rng() * 6.28, fr: .8 + S.rng() * 2.2 });
          let met = null, nextAt = 1 + S.rng() * 2;
          return {
            step(t, dt) {
              if (!met && t >= nextAt) {
                const sp = 130 + S.rng() * 90;
                met = { x: S.W * (.55 + S.rng() * .45), y: S.H * S.rng() * .3,
                        vx: -sp * .72, vy: sp * .72, len: 26 + S.rng() * 20, life: 1 };
                nextAt = t + 1.5 + S.rng() * 2.5;
              }
              if (met) { met.x += met.vx * dt; met.y += met.vy * dt; met.life -= dt * .85;
                if (met.life <= 0 || met.x < -50 || met.y > S.H + 50) met = null; }
            },
            render(ctx, W, H, t) {
              for (const s of st) {
                ctx.globalAlpha = .2 + .8 * (0.5 + 0.5 * Math.sin(t * s.fr + s.ph));
                ctx.fillStyle = "#fff8e8";
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
              }
              if (met) {
                const d = Math.hypot(met.vx, met.vy), ux = met.vx / d, uy = met.vy / d;
                const tx = met.x - ux * met.len, ty = met.y - uy * met.len;
                const g = ctx.createLinearGradient(met.x, met.y, tx, ty);
                g.addColorStop(0, `rgba(255,250,235,${(.95 * Math.max(0, met.life)).toFixed(2)})`);
                g.addColorStop(1, "rgba(255,250,235,0)");
                ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = "round";
                ctx.beginPath(); ctx.moveTo(met.x, met.y); ctx.lineTo(tx, ty); ctx.stroke();
              }
              ctx.globalAlpha = 1;
            },
            staticRender(ctx, W, H, rng) {
              ctx.fillStyle = "#fff8e8";
              for (let i = 0; i < 4; i++) { ctx.globalAlpha = .35 + rng() * .5;
                ctx.beginPath(); ctx.arc(rng() * W, rng() * H, .8 + rng() * 1.2, 0, 6.283); ctx.fill(); }
              ctx.globalAlpha = .8; ctx.strokeStyle = "rgba(255,250,235,.8)"; ctx.lineWidth = 1.4;
              const x1 = W * (.6 + rng() * .3), y1 = H * rng() * .25;
              ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + 24, y1 - 24); ctx.stroke();
              ctx.globalAlpha = 1;
            } };
        });
      } },

    flame:     { front: `<div class="frx fr-full fr-flame-c"></div>`,
      init(slot, front, ov, opts) {
        const host = front && front.querySelector(".fr-flame-c"); if (!host) return null;
        return canvasFX(host, opts, (S, cap) => {
          const N = cap(34);
          const ps = [], sparks = [];
          let sparkAt = .4;
          const L = (a, b, t) => a + (b - a) * t;
          const colAt = (l, a) => {
            let r, g, b;
            if (l > .6)      { const t = (l - .6) / .4; r = L(230, 255, t); g = L(179, 243, t); b = L(77, 214, t); }
            else if (l > .3) { const t = (l - .3) / .3; r = L(212, 230, t); g = L(58, 179, t);  b = L(46, 77, t);  }
            else             { const t = l / .3;         r = 212;            g = L(0, 58, t);   b = L(0, 46, t);   }
            return `rgba(${r | 0},${g | 0},${b | 0},${(a * l).toFixed(3)})`;
          };
          return {
            step(t, dt) {
              const cx = S.W / 2, cy = S.H / 2, R = Math.min(S.W, S.H) * .44;
              while (ps.length < N) {
                const th = (20 + S.rng() * 140) * Math.PI / 180;
                ps.push({ x: cx + Math.cos(th) * R, y: cy + Math.sin(th) * R,
                  vy: -(22 + S.rng() * 20), ph: S.rng() * 6.28, fr: 2 + S.rng() * 3,
                  life: 1, decay: 1 / (.5 + S.rng() * .4) });
              }
              if (t >= sparkAt) { sparkAt = t + .35 + S.rng() * .7;
                sparks.push({ x: cx + (S.rng() - .5) * R * 1.1, y: cy + R * (.75 + S.rng() * .25),
                  vx: (S.rng() - .5) * 30, vy: -(60 + S.rng() * 50), life: 1, decay: 1.7 }); }
              for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i];
                p.life -= p.decay * dt;
                p.x += Math.sin(t * p.fr + p.ph) * 14 * dt;
                p.y += p.vy * dt;
                if (p.life <= 0) ps.splice(i, 1); }
              for (let i = sparks.length - 1; i >= 0; i--) { const p = sparks[i];
                p.life -= p.decay * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 70 * dt;
                if (p.life <= 0) sparks.splice(i, 1); }
            },
            render(ctx, W, H) {
              const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .44;
              ctx.globalCompositeOperation = "lighter";
              const g = ctx.createRadialGradient(cx, cy + R * .82, 0, cx, cy + R * .82, R * .6);
              g.addColorStop(0, "rgba(230,140,50,.26)"); g.addColorStop(1, "rgba(230,140,50,0)");
              ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy + R * .82, R * .6, 0, 6.283); ctx.fill();
              for (const p of ps) { const l = Math.max(0, p.life);
                ctx.fillStyle = colAt(l, .85);
                ctx.beginPath(); ctx.arc(p.x, p.y, 1 + 5 * l, 0, 6.283); ctx.fill(); }
              for (const p of sparks) {
                ctx.fillStyle = `rgba(255,246,220,${Math.max(0, p.life * .95).toFixed(2)})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, 1.3, 0, 6.283); ctx.fill(); }
              ctx.globalCompositeOperation = "source-over";
            },
            staticRender(ctx, W, H, rng) {
              const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .44;
              ctx.globalCompositeOperation = "lighter";
              for (let i = 0; i < 5; i++) { const th = (20 + rng() * 140) * Math.PI / 180;
                ctx.fillStyle = colAt(.5 + rng() * .4, .7);
                ctx.beginPath(); ctx.arc(cx + Math.cos(th) * R, cy + Math.sin(th) * R - rng() * 10, 2 + rng() * 3, 0, 6.283); ctx.fill(); }
              ctx.globalCompositeOperation = "source-over";
            } };
        });
      } },

    /* 8) lightning — radyal glow flash + dallanan PRNG bolt */
    lightning: { front: `<div class="frx fr-full fr-ltn-c"></div>`,
      init(slot, front, ov, opts) {
        const host = front && front.querySelector(".fr-ltn-c"); if (!host) return null;
        return canvasFX(host, opts, (S, cap) => {
          let bolt = null, flash = 0, nextAt = .8 + S.rng() * 1.5;
          const mkPath = (x0, y0, x1, y1, iters, rough) => {
            let pts = [{ x: x0, y: y0 }, { x: x1, y: y1 }];
            for (let it = 0; it < iters; it++) {
              const np = [pts[0]];
              for (let i = 1; i < pts.length; i++) {
                const a = pts[i - 1], b = pts[i];
                const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
                const off = (S.rng() - .5) * len * rough;
                np.push({ x: (a.x + b.x) / 2 - dy / len * off, y: (a.y + b.y) / 2 + dx / len * off }, b);
              }
              pts = np;
            }
            return pts;
          };
          const mkBolt = () => {
            const W = S.W, H = S.H, cx = W / 2;
            const R = Math.min(W, H) * .40;
            const sx = cx + (S.rng() - .5) * W * .6, sy = -H * .05;
            const phi = S.rng() * Math.PI * 2;
            const ex = cx + Math.cos(phi) * R, ey = H / 2 + Math.sin(phi) * R;
            const main = mkPath(sx, sy, ex, ey, 5, .42);
            const branches = [];
            const nb = 1 + ((S.rng() * 2) | 0);
            for (let b = 0; b < nb; b++) {
              const i = 2 + ((S.rng() * Math.max(1, main.length - 6)) | 0);
              const p = main[i];
              const bl = Math.min(W, H) * (.1 + S.rng() * .12);
              const ba = Math.atan2(ey - sy, ex - sx) + (S.rng() - .5) * 1.6;
              branches.push(mkPath(p.x, p.y, p.x + Math.cos(ba) * bl, p.y + Math.sin(ba) * bl, 3, .5));
            }
            return { main, branches, ex, ey };
          };
          return {
            __testBolt: () => { const b = mkBolt(); return b.main.map((p) => Math.round(p.x) + "," + Math.round(p.y)).join(" "); },
            step(t, dt) {
              if (!bolt && t >= nextAt) { bolt = mkBolt(); bolt.born = t; nextAt = t + 2.5 + S.rng() * 3.5; }
              if (bolt) { flash = Math.max(0, 1 - (t - bolt.born) / .13);
                if (t - bolt.born > .24) bolt = null; }
            },
            render(ctx, W, H, t) {
              if (flash > 0 && bolt) {
                const g = ctx.createRadialGradient(bolt.ex, bolt.ey, 0, bolt.ex, bolt.ey, Math.min(W, H) * .42);
                g.addColorStop(0, `rgba(255,246,220,${(.18 * flash).toFixed(3)})`);
                g.addColorStop(1, "rgba(255,246,220,0)");
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(bolt.ex, bolt.ey, Math.min(W, H) * .42, 0, 6.283); ctx.fill();
              }
              if (!bolt) return;
              const draw = (pts, w1, w2) => {
                ctx.lineJoin = "round"; ctx.lineCap = "round";
                ctx.strokeStyle = "rgba(186,132,255,.5)";
                ctx.shadowColor = "rgba(168,108,255,.9)"; ctx.shadowBlur = 9;
                ctx.lineWidth = w1;
                ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
                ctx.strokeStyle = "rgba(255,250,236,.95)";
                ctx.shadowColor = "rgba(230,179,77,.9)"; ctx.shadowBlur = 5;
                ctx.lineWidth = w2;
                ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
                ctx.shadowBlur = 0;
              };
              const age = t - bolt.born;
              const vis = (age < .05 || (age > .08 && age < .14)) ? 1 : .55;
              ctx.globalAlpha = vis;
              draw(bolt.main, 3.4, 1.5);
              for (const br of bolt.branches) draw(br, 2.2, 1);
              ctx.globalAlpha = 1;
            },
            staticRender(ctx, W, H, rng) {
              const cx = W / 2;
              const pts = mkPath(cx + (rng() - .5) * W * .4, -8, cx + (rng() - .5) * W * .5, H * .42, 4, .45);
              ctx.strokeStyle = "rgba(255,250,236,.85)"; ctx.lineWidth = 1.6; ctx.lineJoin = "round";
              ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
            } };
        });
      } },

    chain:     { front: CHAIN3 },

    /* 10) clock — bant tick + kısa ibreler; sanal saat */
    clock:     { front: CLOCK3_FRONT,
      init(slot, front, ov, opts) {
        const host = front && front.querySelector(".fr-clock3"); if (!host) return null;
        const set = () => {
          const n = vdate();
          const s = n.getSeconds() + n.getMilliseconds() / 1000;
          const h = host.querySelector(".ckh"), m = host.querySelector(".ckm"), sc = host.querySelector(".cks");
          if (!h) return;
          h.setAttribute("transform", `rotate(${((n.getHours() % 12) * 30 + n.getMinutes() * .5).toFixed(1)} 50 50)`);
          m.setAttribute("transform", `rotate(${(n.getMinutes() * 6 + s * .1).toFixed(1)} 50 50)`);
          sc.setAttribute("transform", `rotate(${(s * 6).toFixed(1)} 50 50)`);
        };
        set();
        if (opts && opts.static) return null;
        const t = setInterval(set, 1000);
        return { destroy() { clearInterval(t); } }; } },

    /* 11) magic — fill:none */
    magic:     { html: MAGIC3_BACK, front: MAGIC3_FRONT, overlay: MAGIC3_OV },

    /* ═══ overlay ═══ */
    holo: { overlay: HOLO },
    vhs:  { overlay: VHS,
      init(slot, front, ov, opts) {
        const host = ov || slot; const vt = host && host.querySelector(".vt"); if (!vt) return null;
        const set = () => { vt.textContent = vdate().toLocaleTimeString("tr-TR"); };
        set(); if (opts && opts.static) return null;
        const t = setInterval(set, 1000);
        return { destroy() { clearInterval(t); } }; } },
    ekg:  { overlay: EKG },

    /* ═══ karma ═══ */
    neon:  { html: NEON_BACK, overlay: NEON_OV },
    summon: { html: SUM3_BACK + SUM3_CHIPS, front: SUM3_FRONT + SUM3_CHIPS, overlay: SUM3_OV },
  };

  return { reg: R, list: () => Object.keys(R), mulberry32 };
})();