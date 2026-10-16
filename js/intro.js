"use strict";
/* ═══ js/intro.js — v5.2 İNTERAKTİF İNTRO ═══
   16 tarz (intro-core.js STYLES) + video/animasyonlu-webp intro.
   Akış: perde tık → start() → normalizeIntro (kodek + kilit) →
         video varsa ve oynatılabiliyorsa video yolu, yoksa tarz dispatch →
         öğe reveal → arka plan reveal → finish.
   Skip: her zaman tık / Escape. Tarz hatası → skip (sayfa asla kilitlenmez). */

window.SenkiIntro = (function () {

  const CORE = window.SenkiIntroCore;

  let running = false, timers = [], rafIds = [], skipped = false, currentOv = null;
  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;

  const mulberry32 = (seed) => {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const T = (fn, ms) => { const id = setTimeout(fn, skipped ? 0 : ms); timers.push(id); return id; };
  const RAF = (fn) => { const id = requestAnimationFrame(fn); rafIds.push(id); return id; };
  const clearAll = () => {
    timers.forEach(clearTimeout); timers = [];
    rafIds.forEach(cancelAnimationFrame); rafIds = [];
  };

  /* zaman tabanlı animasyon: frame(p 0..1), bitince done() — skip'te done çağrılmaz */
  function animate(ms, frame, done) {
    const t0 = performance.now();
    const step = (now) => {
      if (skipped || !running) return;
      const p = Math.min(1, (now - t0) / ms);
      frame(p);
      if (p < 1) RAF(step); else if (done) done();
    };
    RAF(step);
  }

  function manifest() {
    return ["#division", "#avatar-frame", "#username", "#badges", "#chips",
            "#lanyard", ".separator", ".bio", "#tabs-wrap"];
  }

  function shuffle(arr, rng) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function hideElements() {
    manifest().forEach(sel => {
      const el = $(sel);
      if (el) { el.style.transition = "none"; el.style.opacity = "0"; }
    });
  }

  function showElement(sel, style) {
    const el = $(sel); if (!el) return;
    el.style.transition = "opacity .35s ease, transform .45s cubic-bezier(.22,1,.36,1)";
    el.style.opacity = "1";
    el.style.transform = "none";
    const dirs = {
      materialize: "scale(.85)", slideL: "translateX(-30px)",
      slideR: "translateX(30px)", slideUp: "translateY(30px)", slideDown: "translateY(-30px)",
    };
    if (dirs[style]) {
      el.style.transform = dirs[style];
      RAF(() => { el.style.transform = "none"; });
    }
    if (window.SenkiApp && SenkiApp.Sfx && window.SenkiApp.CONFIG &&
        SenkiApp.CONFIG.intro && SenkiApp.CONFIG.intro.sound) {
      try { const a = SenkiApp.Sfx.click; if (a && !a._dead) { a.currentTime = 0; a.volume = .3; a.play().catch(()=>{}); } } catch(_) {}
    }
  }

  /* öğeleri sırayla göster, sonra bitir (tüm tarzların ortak sonu) */
  function revealAndFinish(ov, cfg, rng, style, startDelay) {
    if (!running) return;
    const order = shuffle(manifest(), rng);
    const base = startDelay || 0;
    order.forEach((sel, i) => T(() => showElement(sel, style || "materialize"), base + i * cfg.elementDelay));
    const total = base + order.length * cfg.elementDelay + 450;
    T(() => finish(ov), total);
    bgReveal(cfg.bgReveal, total * 0.6);
  }

  function bgReveal(type, duration) {
    const layer = $("#bg-layer"), video = $("#bg-video"), fallback = $(".bg-fallback");
    const steps = 8, stepMs = duration / steps;
    let i = 0;

    const finishBg = () => {
      if (root) root.style.setProperty("--bg-blur", "");
      [video, fallback].forEach(el => { if (el) { el.style.opacity = ""; el.style.transition = ""; } });
      if (layer) layer.style.clipPath = "";
    };

    const doStep = () => {
      if (skipped) { finishBg(); return; }
      const p = i / steps;
      if (type === "blur") {
        const blur = 20 - (p * 14);
        if (root) root.style.setProperty("--bg-blur", blur.toFixed(1) + "px");
        [video, fallback].forEach(el => { if (el) el.style.opacity = (p * 0.8 + 0.2).toFixed(2); });
      } else if (type === "fade") {
        [video, fallback].forEach(el => { if (el) el.style.opacity = p.toFixed(2); });
      } else if (type === "frames") {
        [video, fallback].forEach(el => { if (el) el.style.opacity = (i % 2 === 0 ? p * 0.6 : p).toFixed(2); });
      } else if (type === "wipe") {
        if (layer) layer.style.clipPath = `inset(0 0 ${(100 - p * 100).toFixed(0)}% 0)`;
      }
      i++;
      if (i <= steps) T(doStep, stepMs);
      else finishBg();
    };

    if (type === "none") { finishBg(); return; }
    if (type === "blur") {
      if (root) root.style.setProperty("--bg-blur", "20px");
      [video, fallback].forEach(el => { if (el) { el.style.transition = "none"; el.style.opacity = "0.2"; } });
    } else if (type === "wipe") {
      if (layer) { layer.style.transition = "none"; layer.style.clipPath = "inset(0 0 100% 0)"; }
    } else {
      [video, fallback].forEach(el => { if (el) { el.style.transition = "none"; el.style.opacity = "0"; } });
    }

    doStep();
  }

  function createIntroOverlay() {
    let ov = $("#intro-overlay");
    if (ov) ov.remove();
    ov = document.createElement("div");
    ov.id = "intro-overlay";
    ov.className = "intro-overlay";
    ov.innerHTML = `<div class="intro-body"></div>`;
    document.body.appendChild(ov);
    currentOv = ov;
    return ov;
  }

  function makeCanvas(ov) {
    const cv = document.createElement("canvas");
    cv.className = "intro-canvas";
    cv.width = innerWidth; cv.height = innerHeight;
    ov.appendChild(cv);
    return cv;
  }

  function typeLine(container, text, rng) {
    return new Promise(resolve => {
      const div = document.createElement("div");
      div.className = "intro-line";
      container.appendChild(div);
      let i = 0;
      const speed = 18 + rng() * 20;
      const tick = () => {
        if (skipped) { div.textContent = text; resolve(); return; }
        i++;
        div.textContent = text.substring(0, i);
        if (i < text.length) T(tick, speed);
        else resolve();
      };
      tick();
    });
  }

  function linesChain(body, lines, rng, between) {
    let chain = Promise.resolve();
    for (const line of lines) {
      chain = chain.then(() => {
        if (skipped || !running) return;
        return typeLine(body, line, rng).then(() => new Promise(r => T(r, between || 0)));
      });
    }
    return chain;
  }

  function finish(ov) {
    if (!running) return;
    running = false;
    clearAll();
    const o = ov || currentOv;
    currentOv = null;
    document.querySelectorAll("#intro-video").forEach(v => { try { v.pause(); } catch (_) {} });
    if (o) {
      o.style.opacity = "0";
      o.style.transition = "opacity .5s";
      setTimeout(() => o.remove(), 600);
    }
    manifest().forEach(sel => {
      const el = $(sel);
      if (el) { el.style.transition = ""; el.style.opacity = ""; el.style.transform = ""; }
    });
    const card = $("#profile-card");
    if (card) { card.style.scale = ""; card.style.filter = ""; card.style.opacity = ""; card.style.transition = ""; }
    document.body.classList.remove("intro-active");
    if (window.SenkiApp) {
      if (SenkiApp.CONFIG) SenkiApp.CONFIG._introDone = true;
      if (SenkiApp.applyBio) SenkiApp.applyBio();
      if (SenkiApp.fit) SenkiApp.fit(true);
    }
    document.body.classList.add("is-entered");
    console.info("[intro] bitti");
  }

  function skip() {
    if (!running) return;
    skipped = true;
    finish(null);
  }

  /* ═══ TARZLAR — klasik 7 ═══ */

  function styleBoot(cfg, rng) {
    const ov = createIntroOverlay();
    const body = ov.querySelector(".intro-body");
    linesChain(body, cfg.lines, rng).then(() => {
      T(() => { body.style.opacity = "0"; body.style.transition = "opacity .4s"; }, 400);
      const order = shuffle(manifest(), rng);
      order.forEach((sel, i) => T(() => showElement(sel, "materialize"), 300 + i * cfg.elementDelay));
      const total = 300 + order.length * cfg.elementDelay + 500;
      T(() => finish(ov), total);
      bgReveal(cfg.bgReveal, total * 0.6);
    });
  }

  function styleCinematic(cfg, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-cinematic");
    const topBar = document.createElement("div"); topBar.className = "intro-letterbox intro-lb-top";
    const botBar = document.createElement("div"); botBar.className = "intro-letterbox intro-lb-bot";
    ov.appendChild(topBar); ov.appendChild(botBar);
    T(() => {
      topBar.style.transform = "translateY(-100%)";
      botBar.style.transform = "translateY(100%)";
      topBar.style.transition = botBar.style.transition = "transform 1.2s ease";
    }, 200);
    const card = $("#profile-card");
    if (card) {
      card.style.transition = "filter 1.5s ease, opacity 1.5s ease";
      card.style.filter = "blur(8px)";
      card.style.opacity = "0";
      T(() => { card.style.filter = "blur(0)"; card.style.opacity = "1"; }, 600);
    }
    const order = shuffle(manifest(), rng);
    order.forEach((sel, i) => T(() => showElement(sel, "fade"), 900 + i * (cfg.elementDelay * 1.5)));
    const total = 900 + order.length * cfg.elementDelay * 1.5 + 800;
    T(() => finish(ov), total);
    bgReveal("fade", total * 0.5);
  }

  function styleAssembly(cfg, rng) {
    const directions = ["slideL", "slideR", "slideUp", "slideDown"];
    const order = shuffle(manifest(), rng);
    order.forEach((sel, i) => {
      const dir = directions[Math.floor(rng() * directions.length)];
      T(() => showElement(sel, dir), 200 + i * cfg.elementDelay);
    });
    const total = 200 + order.length * cfg.elementDelay + 400;
    T(() => finish(null), total);
    bgReveal(cfg.bgReveal, total * 0.4);
  }

  function styleGlitch(cfg, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-glitch");
    const order = shuffle(manifest(), rng);
    order.forEach((sel, i) => {
      const el = $(sel);
      if (el) {
        T(() => {
          el.classList.add("intro-glitch-reveal");
          showElement(sel, "fade");
          T(() => el.classList.remove("intro-glitch-reveal"), 300);
        }, 150 + i * cfg.elementDelay);
      }
    });
    T(() => {
      document.body.classList.add("intro-glitch-body");
      T(() => document.body.classList.remove("intro-glitch-body"), 250);
    }, 150 + order.length * cfg.elementDelay);
    const total = 150 + order.length * cfg.elementDelay + 600;
    T(() => finish(ov), total);
    bgReveal(cfg.bgReveal, total * 0.5);
  }

  function styleTerminal(cfg, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-terminal");
    const body = ov.querySelector(".intro-body");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=<>/\\|~^";
    const firstLine = cfg.lines[0] || "SYSTEM";
    let waterfallInterval = null;

    const decodeLine = () => {
      const target = firstLine;
      let i = 0;
      const decodeInterval = setInterval(() => {
        if (skipped) { clearInterval(decodeInterval); body.textContent = target; return; }
        i++;
        let s = "";
        for (let c = 0; c < target.length; c++) {
          if (c < i) s += target[c];
          else s += chars[Math.floor(rng() * chars.length)];
        }
        body.textContent = s;
        if (i >= target.length) {
          clearInterval(decodeInterval);
          T(() => { body.style.opacity = "0"; body.style.transition = "opacity .3s"; }, 600);
          const order = shuffle(manifest(), rng);
          order.forEach((sel, j) => T(() => showElement(sel, "materialize"), 800 + j * cfg.elementDelay));
          T(() => finish(ov), 800 + order.length * cfg.elementDelay + 400);
          bgReveal(cfg.bgReveal, 1500);
        }
      }, 40);
    };

    let tick = 0;
    waterfallInterval = setInterval(() => {
      if (skipped) { clearInterval(waterfallInterval); return; }
      tick++;
      let s = "";
      for (let c = 0; c < 40; c++) s += chars[Math.floor(rng() * chars.length)];
      body.textContent = s.substring(0, 20 + Math.floor(rng() * 20));
      if (tick > 30) { clearInterval(waterfallInterval); decodeLine(); }
    }, 50);

    bgReveal(cfg.bgReveal, 1500);
  }

  function styleSummon(cfg, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-summon");
    const dot = document.createElement("div"); dot.className = "intro-summon-dot"; ov.appendChild(dot);
    T(() => { dot.classList.add("active"); }, 100);
    const ring = document.createElement("div"); ring.className = "intro-summon-ring"; ov.appendChild(ring);
    T(() => { ring.classList.add("active"); }, 500);
    T(() => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      ring.style.transform = "scale(3)";
      ring.style.transition = "opacity .3s, transform .5s ease-out";
    }, 1800);
    T(() => {
      if (window.SenkiApp && SenkiApp.ShaderFX) {
        SenkiApp.runAction({ type: "shader", params: { name: "summon", duration: 2, intensity: 1, at: "center" } });
      }
    }, 1750);
    const order = shuffle(manifest(), rng);
    order.forEach((sel, i) => T(() => showElement(sel, "materialize"), 2000 + i * cfg.elementDelay));
    const total = 2000 + order.length * cfg.elementDelay + 500;
    T(() => finish(ov), total);
    bgReveal("fade", total * 0.4);
  }

  function styleMinimal(cfg, rng) {
    const order = shuffle(manifest(), rng);
    order.forEach((sel, i) => T(() => showElement(sel, "fade"), i * (cfg.elementDelay * 2)));
    const total = order.length * cfg.elementDelay * 2 + 300;
    T(() => finish(null), total);
    bgReveal("fade", total);
  }

  /* ═══ TARZLAR — v5.2 yeni 9 ═══ */

  function styleMatrix(cfg, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-matrix");
    const cv = makeCanvas(ov), ctx = cv.getContext("2d");
    const chars = "01アイウエオカキクケコ<>/#$%*+";
    const size = 16, cols = Math.max(1, Math.floor(cv.width / size));
    const drops = Array.from({ length: cols }, () => rng() * (cv.height / size));
    ctx.font = size - 2 + "px monospace";
    animate(1700, (p) => {
      ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = "#e6b34d";
      drops.forEach((y, i) => {
        ctx.fillText(chars[Math.floor(rng() * chars.length)], i * size, y * size);
        drops[i] = (y * size > cv.height && rng() > 0.975) ? 0 : y + 0.6;
      });
      cv.style.opacity = String(Math.max(0, 1 - Math.max(0, (p - 0.7) / 0.3)));
    }, () => revealAndFinish(ov, cfg, rng, "materialize"));
  }

  function styleIris(cfg, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-iris");
    const body = ov.querySelector(".intro-body");
    ov.style.clipPath = "circle(150% at 50% 50%)";
    linesChain(body, cfg.lines, rng, 120).then(() => {
      if (!running) return;
      ov.style.transition = "clip-path 1.4s cubic-bezier(.7,0,.2,1)";
      ov.style.clipPath = "circle(0% at 50% 50%)";
    });
    revealAndFinish(ov, cfg, rng, "materialize", 900);
  }

  function styleTypewriter(cfg, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-typewriter");
    const body = ov.querySelector(".intro-body");
    linesChain(body, cfg.lines, rng, 350).then(() => {
      if (!running) return;
      T(() => { body.style.transition = "opacity .5s"; body.style.opacity = "0"; }, 200);
      revealAndFinish(ov, cfg, rng, "slideUp", 600);
    });
  }

  function styleScanline(cfg, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-scanline");
    const bar = document.createElement("div"); bar.className = "intro-scan-bar"; ov.appendChild(bar);
    const order = manifest().filter(sel => $(sel));
    order.sort((a, b) => $(a).getBoundingClientRect().top - $(b).getBoundingClientRect().top);
    const total = Math.max(600, order.length * cfg.elementDelay);
    animate(total, (p) => { bar.style.top = (p * 100).toFixed(1) + "%"; });
    order.forEach((sel, i) => T(() => showElement(sel, "fade"), i * cfg.elementDelay));
    T(() => finish(ov), total + 450);
    bgReveal(cfg.bgReveal, total * 0.6);
  }

  function styleParticles(cfg, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-particles");
    const cv = makeCanvas(ov), ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
    const ps = Array.from({ length: 140 }, () => ({
      x: rng() * W, y: rng() * H, ang: rng() * Math.PI * 2, sp: 0.5 + rng() * 1.5,
    }));
    const draw = (alpha, pos) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = `rgba(230,179,77,${alpha})`;
      ps.forEach((q) => { const [x, y] = pos(q); ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.2832); ctx.fill(); });
    };
    animate(1400, (p) => {
      draw(0.85, (q) => {
        q.x += (cx - q.x) * 0.06 * (0.4 + p);
        q.y += (cy - q.y) * 0.06 * (0.4 + p);
        return [q.x, q.y];
      });
    }, () => {
      animate(700, (p) => {
        draw(1 - p, (q) => {
          const r = p * Math.max(W, H) * 0.6 * q.sp;
          return [cx + Math.cos(q.ang) * r, cy + Math.sin(q.ang) * r];
        });
      }, () => { ctx.clearRect(0, 0, W, H); revealAndFinish(ov, cfg, rng, "materialize"); });
    });
  }

  function styleZoom(cfg, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-zoom");
    const card = $("#profile-card");
    if (card) {
      card.style.transition = "scale 1.4s cubic-bezier(.22,1,.36,1), filter 1.4s ease, opacity 1s ease";
      card.style.scale = "1.7";
      card.style.filter = "blur(14px)";
      card.style.opacity = "0";
      T(() => { card.style.scale = "1"; card.style.filter = "blur(0)"; card.style.opacity = "1"; }, 120);
    }
    revealAndFinish(ov, cfg, rng, "fade", 300);
  }

  function styleFlicker(cfg, rng) {
    const order = shuffle(manifest(), rng);
    order.forEach((sel, i) => T(() => {
      const el = $(sel);
      if (!el) return;
      el.classList.add("intro-flicker");
      showElement(sel, "fade");
      T(() => el.classList.remove("intro-flicker"), 700);
    }, i * cfg.elementDelay * 1.2));
    const total = order.length * cfg.elementDelay * 1.2 + 800;
    T(() => finish(null), total);
    bgReveal(cfg.bgReveal, total * 0.6);
  }

  function styleCurtains(cfg, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-curtains");
    const l = document.createElement("div"); l.className = "intro-curtain intro-curtain-l";
    const r = document.createElement("div"); r.className = "intro-curtain intro-curtain-r";
    ov.appendChild(l); ov.appendChild(r);
    T(() => { l.style.transform = "translateX(-101%)"; r.style.transform = "translateX(101%)"; }, 500);
    revealAndFinish(ov, cfg, rng, "fade", 900);
  }

  /* EKG şekli: bir kalp atışı periyodu (u ∈ [0,1)) → [-0.2, 1] */
  const ECG = [[0, 0], [0.08, 0.08], [0.12, 0], [0.14, -0.12], [0.17, 1], [0.2, -0.25], [0.24, 0], [0.36, 0], [1, 0]];
  function ecgAt(t) {
    const u = ((t * 4) % 1 + 1) % 1;
    for (let i = 1; i < ECG.length; i++) {
      if (u <= ECG[i][0]) {
        const [x0, y0] = ECG[i - 1], [x1, y1] = ECG[i];
        return y0 + (y1 - y0) * ((u - x0) / (x1 - x0 || 1));
      }
    }
    return 0;
  }

  function styleEkg(cfg, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-ekg");
    const cv = makeCanvas(ov), ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    animate(1600, (p) => {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "#f6d68b"; ctx.lineWidth = 2.5; ctx.shadowColor = "#e6b34d"; ctx.shadowBlur = 14;
      ctx.beginPath();
      const n = Math.max(2, Math.floor(p * W));
      for (let x = 0; x <= n; x += 2) {
        const y = H / 2 - ecgAt(x / W) * H * 0.22;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }, () => { ctx.clearRect(0, 0, W, H); revealAndFinish(ov, cfg, rng, "slideUp", 200); });
  }

  /* ═══ VİDEO / ANİMASYONLU GÖRSEL INTRO ═══ */
  function runMedia(norm, rng) {
    const ov = createIntroOverlay();
    ov.classList.add("intro-media");
    ov.querySelector(".intro-body").remove();
    const candidates = norm.playable.filter(p => p.supported);
    let idx = 0;

    const end = () => {
      if (!running) return;
      revealAndFinish(ov, norm, rng, "fade", 0);
    };
    const fallbackToStyle = () => {
      if (!running) return;
      console.info("[intro] video oynatılamadı — tarz moduna dönülüyor");
      ov.remove(); currentOv = null;
      runStyle(norm, rng);
    };

    const tryNext = () => {
      if (!running) return;
      if (idx >= candidates.length) return fallbackToStyle();
      const c = candidates[idx++];
      if (c.kind === "image") {
        const img = document.createElement("img");
        img.id = "intro-image"; img.className = "intro-media-el"; img.alt = "";
        img.onerror = tryNext;
        img.onload = () => T(end, norm.video.maxMs || 4000);
        img.src = c.src;
        ov.appendChild(img);
        return;
      }
      const v = document.createElement("video");
      v.id = "intro-video"; v.className = "intro-media-el";
      v.playsInline = true; v.preload = "auto";
      if (norm.video.poster) v.poster = norm.video.poster;
      v.muted = !norm.sound;
      v.addEventListener("error", () => { v.remove(); tryNext(); });
      v.addEventListener("ended", end);
      v.src = c.src;
      ov.appendChild(v);
      const p = v.play();
      if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(() => {}); });
      if (norm.video.maxMs) T(end, norm.video.maxMs);
    };
    tryNext();
  }

  /* ═══ DISPATCH ═══ */
  const STYLE_FNS = {
    boot: styleBoot, cinematic: styleCinematic, assembly: styleAssembly,
    glitch: styleGlitch, terminal: styleTerminal, summon: styleSummon, minimal: styleMinimal,
    matrix: styleMatrix, iris: styleIris, typewriter: styleTypewriter, scanline: styleScanline,
    particles: styleParticles, zoom: styleZoom, flicker: styleFlicker, curtains: styleCurtains, ekg: styleEkg,
  };

  function runStyle(norm, rng) {
    const fn = STYLE_FNS[norm.style] || styleBoot;
    try { fn(norm, rng); }
    catch (err) {
      console.error("[intro] tarz hatası:", norm.style, err);
      skip();
    }
  }

  function makeCanPlay() {
    let probe = null;
    try { probe = document.createElement("video"); } catch (_) { return () => ""; }
    return (mime) => { try { return probe.canPlayType(mime); } catch (_) { return ""; } };
  }

  /* ═══ ANA GİRİŞ ═══ */
  function start(config) {
    const cfg = Object.assign({
      style: "boot", lines: ["SYSTEM READY"], elementDelay: 120, bgReveal: "blur",
      sound: true, skipKey: "Escape",
    }, config || {});

    const norm = CORE ? CORE.normalizeIntro(cfg, makeCanPlay())
                      : { style: cfg.style, lines: cfg.lines, elementDelay: cfg.elementDelay,
                          bgReveal: cfg.bgReveal, sound: cfg.sound, video: { sources: [] },
                          mode: "style", playable: [], warnings: [], locked: false };
    if (norm.warnings && norm.warnings.length) console.info("[intro] uyarılar:", norm.warnings);
    norm.skipKey = cfg.skipKey;

    running = true;
    skipped = false;
    hideElements();

    const rng = mulberry32((Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0);

    const keyHandler = (e) => {
      if (e.key === cfg.skipKey || e.key === "Enter") { skip(); removeListeners(); }
    };
    const clickHandler = () => { skip(); removeListeners(); };
    const removeListeners = () => {
      document.removeEventListener("keydown", keyHandler);
      document.removeEventListener("pointerdown", clickHandler);
    };
    document.addEventListener("keydown", keyHandler);
    document.addEventListener("pointerdown", clickHandler);

    const useMedia = norm.mode === "video" && norm.playable.some(p => p.supported);
    if (useMedia) runMedia(norm, rng);
    else runStyle(norm, rng);

    console.info("[intro] başladı:", useMedia ? "video" : norm.style);
  }

  function hasSeen() {
    try { return localStorage.getItem("senki:intro-seen") === "1"; } catch(_) { return false; }
  }

  function markSeen() {
    try { localStorage.setItem("senki:intro-seen", "1"); } catch(_) {}
  }

  return { start, skip, hasSeen, markSeen, isRunning: () => running, styles: () => (CORE ? CORE.STYLES : []) };
})();
