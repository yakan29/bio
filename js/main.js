"use strict";
/* ═══════════════════════════════════════════════════════════════════
   SENKI BIO v5.1 — çekirdek
   v5.1: renk/şekil (text, background, icon, cardBg, avatarShape) + v5.0 intro (7 tarz) + tüm v4.7.2 sistemleri
   ═══════════════════════════════════════════════════════════════════ */

/* ---------- yardımcılar ---------- */
const $ = (s) => document.querySelector(s);
const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const store = { get(k,f){try{const v=localStorage.getItem(k);return v===null?f:v}catch(_){return f}}, set(k,v){try{localStorage.setItem(k,v)}catch(_){}} };
function deepMerge(t,s){for(const k in s){if(s[k]&&typeof s[k]==="object"&&!Array.isArray(s[k])&&t[k]&&typeof t[k]==="object"&&!Array.isArray(t[k]))deepMerge(t[k],s[k]);else t[k]=s[k];}return t}
const deepClone=(o)=>JSON.parse(JSON.stringify(o));
const escapeHtml=(s)=>String(s).replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function hslToHex(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return"#"+[f(0),f(8),f(4)].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("")}
const mulberry32=(seed)=>{let a=seed>>>0;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};};

/* intro element manifest — intro.js ve main.js paylaşıyor */
function manifestSelectors() {
  return ["#division", "#avatar-frame", "#username", "#badges", "#chips",
          "#lanyard", ".separator", ".bio", "#tabs-wrap"];
}

/* ---------- DEFAULTS ---------- */
const DEFAULTS = {
  meta:{title:"yakan12 | Bio",description:"",favicon:"assets/favicon.svg"},
  entry:{hint:"CLICK TO ENTER",note:"ses açık önerilir",showCube:true,cubeSize:72,cubeSpeed:10,cubeColor:""},
  intro:{
    enabled:true,
    style:"boot",
    lines:["IMPERIAL SYSTEMS v5.1","BAĞLANTI KURULUYOR...","BEING X TESPİT EDİLDİ","SİSTEM HAZIR"],
    elementDelay:120,
    bgReveal:"blur",
    skipOnReload:true,
    sound:true,
  },
  profile:{username:"yakan12",division:"OFFICIAL LINKS",bio:"Senin için geliyorum 'Varhk X'…",avatarFrame:"ring",avatarShape:"circle",
    badges:[{icon:"verified",title:"Doğrulanmış",anim:"pulse",color:""},{icon:"shield",title:"Nişan",anim:"none",color:""}],
    chips:[]},
  avatar:{src:"assets/avatar.jpg",anim:"breathe"},
  theme:{accent:"#e6b34d",text:"",background:"",icon:"",cardBg:""},font:{mode:"local",googleFamily:"Cinzel",weights:"400;600"},
  bg:{mode:"video",blur:6,index:0,particleStyle:"dust",list:[]},
  layout:{autofit:true,minScale:.5,maxScale:1.2,marginY:84,marginX:36},
  card:{width:400,radius:18,blur:20,opacity:.58},
  elements:{card:{w:400,radius:18,rot:0,x:0,y:0,scale:1,fx:{ambient:"none",interactive:"none"},media:{src:"",opacity:.3,blend:"screen"}},
    avatar:{w:112,h:112,rot:0,x:0,y:0,scale:1,fx:{ambient:"none",interactive:"none"},media:{src:"",opacity:.3,blend:"screen"}},
    username:{size:33,rot:0,x:0,y:0,scale:1,fx:{ambient:"none",interactive:"none"},media:{src:"",opacity:.3,blend:"screen"}},
    bio:{size:14.5,rot:0,x:0,y:0,scale:1,fx:{ambient:"none",interactive:"none"},media:{src:"",opacity:.3,blend:"screen"}},
    links:{w:100,rot:0,x:0,y:0,scale:1,fx:{ambient:"none",interactive:"none"},media:{src:"",opacity:.3,blend:"screen"}}},
  fx:{sparks:true,cursor:true,parallax:true,tilt:true,typewriter:true,blips:true,shortcuts:true},
  perf:{quality:"auto",particleCap:120,dprCap:2,renderer:"auto"},
  debug:{triggers:false,zones:false},
  audio:{source:"video",defaultVolume:.35},
  sounds:{enabled:true,volume:.4,hover:"assets/sounds/hover.mp3",click:"assets/sounds/click.mp3"},
  tabs:{style:"animated",list:[{label:"Bağlantılar",type:"links"}]},
  links:[{type:"steam",label:"Steam",url:"https://steamcommunity.com/id/yakan12",fx:{hover:{type:"none"},click:{type:"burst"}}},
         {type:"discord",label:"Discord",copy:"yakan12",fx:{hover:{type:"none"},click:{type:"burst"}}}],
  shaders:[],antiDebug:{rightClick:true,shortcuts:true,debuggerTrap:false,consoleWarn:true},
  menus:[],contextMenu:{enabled:false,menu:"main"},
  dock:{buttons:[]},zones:[],triggers:[],quotes:[],
  lanyard:{enabled:false,discordId:"",showSpotify:true},
  greeting:{enabled:true,template:"{selam} — İmparatorluk saati {saat}"},
  cursor:{image:""},stats:{url:""},
};
const CONFIG = window.CONFIG = deepMerge(deepClone(DEFAULTS), window.CONFIG || {});
if (window.EDIT_MODE) { try { const p = JSON.parse(store.get("senki:config-preview","null")); if (p && typeof p === "object") deepMerge(CONFIG, p); } catch(_) {} }
let entered = false;

/* ---------- ikonlar ---------- */
const ICONS = {
  github:'<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
  telegram:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.04 15.5l-.38 5.33c.54 0 .78-.24 1.06-.52l2.55-2.44 5.28 3.87c.97.53 1.66.25 1.92-.9L23.9 4.6c.31-1.42-.51-1.98-1.46-1.63L1.7 10.9c-1.39.54-1.37 1.32-.24 1.67l5.31 1.66L19.2 6.9c.55-.36 1.05-.16.64.2L9.04 15.5z"/></svg>',
  steam:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/></svg>',
  youtube:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>',
  discord:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.11 13.11 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07L11.5 5.4"/><path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.47"/></svg>',
  chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  verified:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.7 2.7L16.2 9"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z"/><path d="M9.2 12.2l2 2 3.6-3.9"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.6z"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 8"/></svg>',
  cross:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};
const ICON_KEYS = () => Object.keys(ICONS);

/* ═══ MEDYA BİRLİĞİ ═══ */
function makeMedia(src, opts = {}) {
  if (!src) return null;
  if (/\.(mp4|webm|mov|m4v)([?#]|$)/i.test(src)) {
    const v = document.createElement("video");
    v.muted = true; v.loop = opts.loop !== false; v.playsInline = true;
    if (opts.autoplay !== false) v.autoplay = true;
    v.preload = opts.preload || "auto";
    v.src = src;
    const out = { el: v, kind: "video", hasAudio: false, src };
    const probe = () => { out.hasAudio = !!(v.mozHasAudio || (v.audioTracks && v.audioTracks.length) || (v.webkitAudioDecodedByteCount > 0)); };
    v.addEventListener("loadedmetadata", probe);
    v.addEventListener("timeupdate", probe, { once: true });
    return out;
  }
  const i = document.createElement("img");
  i.src = src; if (opts.alt) i.alt = opts.alt;
  if (opts.loading) i.loading = opts.loading;
  i.decoding = "async";
  return { el: i, kind: /\.gif([?#]|$)/i.test(src) ? "gif" : "img", hasAudio: false, src };
}

/* ═══ POINTERBUS / LOOP / PERF ═══ */
const PointerBus = { subs: [], last: { x: innerWidth / 2, y: innerHeight / 2 },
  init() { addEventListener("pointermove", (e) => { this.last = { x: e.clientX, y: e.clientY };
    for (const f of this.subs) { try { f(e); } catch (_) {} } }, { passive: true }); },
  on(f) { if (!this.subs.includes(f)) this.subs.push(f); },
  off(f) { const i = this.subs.indexOf(f); if (i >= 0) this.subs.splice(i, 1); } };
const Loop = { fns:[], running:false,
  add(fn){ if(!this.fns.includes(fn)) this.fns.push(fn); this.start(); },
  remove(fn){ const i=this.fns.indexOf(fn); if(i>=0) this.fns.splice(i,1); },
  start(){ if(this.running) return; this.running = true; const tok=(this.tok=(this.tok||0)+1);
    const tick=(t)=>{ if(!this.running||tok!==this.tok) return; for(const f of this.fns){ try{f(t);}catch(_){} } requestAnimationFrame(tick); };
    requestAnimationFrame(tick); },
  stop(){ this.running = false; } };
const Perf = { low:false,
  init(){ this.detect(); this.apply(); },
  detect(){ let q = CONFIG.perf.quality;
    if (q === "auto") { const c = navigator.hardwareConcurrency || 8, m = navigator.deviceMemory || 8; q = (c <= 4 || m <= 4) ? "low" : "high"; }
    this.low = (q === "low"); },
  apply(){ document.body.classList.toggle("perf-low", this.low); safeApply(()=>{Background.applyMode(); Avatar.refreshStatic();}); },
  dpr(){ return Math.min(devicePixelRatio || 1, CONFIG.perf.dprCap || 2); },
  cap(n){ n = this.low ? Math.floor(n/2) : n; return Math.min(n, CONFIG.perf.particleCap || 120); } };
function safeApply(fn){ try{fn()}catch(_){} }

/* ═══ TIMEDILATION ═══ */
const TimeDilation = {
  scale: 1, target: 1, vt: 0, lastRaw: 0, vNow: Date.now(),
  _lr: 0, _animT: 0, _vidT: 0, _wasChanging: false,
  now(raw) { if (!this.lastRaw) { this.lastRaw = raw; this.vt = raw; return this.vt; }
    if (raw > this.lastRaw) { this.vt += (raw - this.lastRaw) * this.scale; this.lastRaw = raw; }
    return this.vt; },
  virtualDate() { return new Date(this.vNow); },
  setTarget(s) { this.target = clamp(s, 0, 2); },
  tick(raw) {
    if (!this._lr) this._lr = raw;
    const dt = clamp((raw - this._lr) / 1000, 0, .1); this._lr = raw;
    if (Math.abs(this.target - this.scale) > 1e-4) this.scale += (this.target - this.scale) * Math.min(1, dt * 5);
    else this.scale = this.target;
    this.vNow += dt * 1000 * this.scale;
    const s = this.scale, changing = Math.abs(s - 1) > .002 || Math.abs(this.target - s) > .002;
    if (changing || this._wasChanging) {
      if (raw - this._vidT > 120) { this._vidT = raw;
        const want = Math.abs(s - 1) < .01 ? 1 : clamp(s, .05, 4);
        [Media.video, Media.avVideo].forEach((v) => { if (!v) return;
          try { const cur = v.playbackRate || 1;
            v.playbackRate = want === 1 ? 1 : clamp(cur + (want - cur) * .35, .05, 4); } catch (_) {} }); }
      if (raw - this._animT > 250) { this._animT = raw;
        try { const want = Math.abs(s - 1) < .01 ? 1 : clamp(s, .05, 4);
          document.getAnimations().forEach((a) => { try { const cur = a.playbackRate || 1;
            a.playbackRate = want === 1 ? 1 : cur + (want - cur) * .4; } catch (_) {} }); } catch (_) {} }
    }
    this._wasChanging = changing;
  },
  timestop(dur = 6) {
    dur = clamp(dur, 1.2, 12);
    if (reducedMotion || Perf.low) {
      const h = document.documentElement;
      h.style.transition = "filter .8s ease";
      h.style.filter = "grayscale(.85) brightness(.92)";
      setTimeout(() => { h.style.filter = "";
        setTimeout(() => { h.style.transition = ""; }, 850); }, Math.max(300, dur * 1000 - 800));
      return;
    }
    ShaderFX.play({ name: "timestop", duration: dur, intensity: 1, at: "center", mode: "oneshot" });
    const T = dur * 1000, t0 = performance.now();
    const drive = (raw) => {
      const p = (raw - t0) / T;
      if (p >= 1) { this.setTarget(1); Loop.remove(drive); return; }
      if (p < .2)      this.setTarget(lerp(1, .05, p / .2));
      else if (p < .8) this.setTarget(.05);
      else { const q = (p - .8) / .2;
        this.setTarget(q < .5 ? lerp(.05, 1.6, q * 2) : lerp(1.6, 1, (q - .5) * 2)); }
    };
    Loop.add(drive);
  },
};

/* ═══ GÜVENLİ GPU ═══ */
const Gfx = {
  mode: "canvas2d", dust: null,
  async detect() {
    const want = CONFIG.perf.renderer;
    if (want === "css" || Perf.low) { this.mode = want === "css" ? "css" : "canvas2d"; this.applyFlags(); return; }
    const order = want === "auto" ? ["webgpu", "webgl2"] : [want];
    for (const t of order) {
      try {
        if (t === "webgpu" && navigator.gpu) { this.mode = "webgpu"; this.applyFlags(); return; }
        if (t === "webgl2" && document.createElement("canvas").getContext("webgl2")) { this.mode = "webgl2"; this.applyFlags(); return; }
      } catch (_) {}
    }
    this.mode = "canvas2d"; this.applyFlags();
  },
  gl2Layer(cv) {
    const gl = cv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return null;
    const VS = "#version 300 es\nlayout(location=0) in vec2 aP;layout(location=1) in vec2 aSA;layout(location=2) in vec3 aC;uniform vec2 uR;out vec3 vC;out float vA;void main(){vec2 c=aP/uR*2.-1.;gl_Position=vec4(c.x,-c.y,0.,1.);gl_PointSize=aSA.x;vC=aC;vA=aSA.y;}";
    const FS = "#version 300 es\nprecision mediump float;in vec3 vC;in float vA;out vec4 o;void main(){vec2 d=gl_PointCoord-.5;float m=1.-smoothstep(0.,.5,length(d));o=vec4(vC*vA*m,vA*m);}";
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const uR = gl.getUniformLocation(pr, "uR"), buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const attr = (loc, size, off) => { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 28, off); };
    attr(0, 2, 0); attr(1, 2, 8); attr(2, 3, 16);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); Gfx.fallback(); });
    return { draw(arr, n, w, h, dpr) {
        if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
        gl.viewport(0, 0, cv.width, cv.height);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uR, cv.width, cv.height);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, arr.subarray(0, n * 7), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, n);
      }, clear() { gl.clear(gl.COLOR_BUFFER_BIT); } };
  },
  async gpuLayer(cv) {
    const adapter = await navigator.gpu.requestAdapter(); if (!adapter) return null;
    const device = await adapter.requestDevice();
    const ctx = cv.getContext("webgpu"); if (!ctx) return null;
    const format = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({ device, format, alphaMode: "premultiplied" });
    const WGSL = "struct U{res:vec2f,pad:vec2f}\n@group(0) @binding(0) var<uniform> u:U;\nconst C=array<vec2f,6>(vec2f(-1.,-1.),vec2f(1.,-1.),vec2f(1.,1.),vec2f(-1.,-1.),vec2f(1.,1.),vec2f(-1.,1.));\nstruct V{@builtin(position) p:vec4f,@location(0) uv:vec2f,@location(1) col:vec4f}\n@vertex fn vs(@builtin(vertex_index) vi:u32,@location(0) pos:vec2f,@location(1) sa:vec2f,@location(2) col:vec3f)->V{let c=C[vi];let px=pos+c*sa.x;let clip=vec2f(px.x/u.res.x*2.-1.,1.-px.y/u.res.y*2.);var o:V;o.p=vec4f(clip,0.,1.);o.uv=c;o.col=vec4f(col*sa.y,sa.y);return o;}\n@fragment fn fs(v:V)->@location(0) vec4f{let d=length(v.uv);let m=1.-smoothstep(.1,1.,d);return vec4f(v.col.rgb*v.col.a*m,v.col.a*m);}";
    const mod = device.createShaderModule({ code: WGSL });
    const pipe = device.createRenderPipeline({ layout: "auto",
      vertex: { module: mod, entryPoint: "vs", buffers: [{ arrayStride: 28, stepMode: "instance", attributes: [
        { shaderLocation: 0, offset: 0, format: "float32x2" }, { shaderLocation: 1, offset: 8, format: "float32x2" }, { shaderLocation: 2, offset: 16, format: "float32x3" } ] }] },
      fragment: { module: mod, entryPoint: "fs", targets: [{ format, blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } } }] },
      primitive: { topology: "triangle-list" } });
    const ub = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const bg = device.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: ub } }] });
    device.lost.then(() => Gfx.fallback());
    const uarr = new Float32Array(4);
    const vb = device.createBuffer({ size: (CONFIG.perf.particleCap || 120) * 28, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    return { draw(arr, n, w, h, dpr) {
        if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
        uarr[0] = cv.width; uarr[1] = cv.height;
        device.queue.writeBuffer(ub, 0, uarr);
        device.queue.writeBuffer(vb, 0, arr, 0, n * 7);
        const enc = device.createCommandEncoder();
        const pass = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: "clear", clearValue: { r: 0, g: 0, b: 0, a: 0 }, storeOp: "store" }] });
        pass.setPipeline(pipe); pass.setBindGroup(0, bg); pass.setVertexBuffer(0, vb); pass.draw(6, n, 0, 0); pass.end();
        device.queue.submit([enc.finish()]);
      }, clear() {} };
  },
  applyFlags() {
    const gpu = this.mode === "webgl2" || this.mode === "webgpu";
    const dg = $("#bg-dust-gpu");
    if (dg) { dg.hidden = !gpu; dg.classList.toggle("gpu-on", gpu); }
    const d2 = $("#bg-dust");
    if (d2) d2.style.display = gpu ? "none" : "";
  },
  fallback() { this.mode = "canvas2d"; this.dust = null; this.applyFlags(); },
  async attach() {
    if (this.mode !== "webgl2" && this.mode !== "webgpu") return;
    try {
      this.dust = this.mode === "webgpu" ? await this.gpuLayer($("#bg-dust-gpu")) : this.gl2Layer($("#bg-dust-gpu"));
      if (!this.dust) throw 0;
    } catch (_) { this.fallback(); }
  },
  async boot() { await this.detect(); await this.attach(); },
};

/* ═══ SHADERFX v2 + SHADERTOY SARMALAYICI ═══ */
const SF_HEAD = "#version 300 es\nprecision highp float;\nuniform float u_time;uniform vec2 u_res;uniform float u_progress;uniform vec2 u_origin;uniform float u_intensity;uniform vec3 u_accent;\nout vec4 fragColor;\nfloat hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n";
const WF = (body) => "struct U{t:f32,progress:f32,intensity:f32,_p0:f32,res:vec2f,origin:vec2f,accent:vec3f,_p1:f32}\n@group(0) @binding(0) var<uniform> u:U;\nfn h21(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}\nstruct VOut{@builtin(position) pos:vec4f}\n@vertex fn vs(@builtin(vertex_index) vi:u32)->VOut{var p=array<vec2f,4>(vec2f(-1.,-1.),vec2f(1.,-1.),vec2f(-1.,1.),vec2f(1.,1.));var o:VOut;o.pos=vec4f(p[vi],0.,1.);return o;}\n@fragment fn fs(@builtin(position) fc:vec4f)->@location(0) vec4f{\nlet uv=fc.xy/u.res;let rel=(fc.xy-u.origin)/u.res.y;let d=length(rel);let t=u.progress;let acc=u.accent;let ii=u.intensity;\n" + body + "\n}";

const SF_B = {
  explosion: {
    glsl: `void main(){
  vec2 rel2=(gl_FragCoord.xy-u_origin)/u_res.y; float d2=length(rel2); float t=u_progress;
  float wave=(1.-smoothstep(0.,.012,abs(d2-t*.6)))*(1.-t);
  float flash=(1.-smoothstep(0.,.3,d2))*pow(1.-t,3.);
  float a=(wave*.9+flash)*u_intensity;
  for(int i=0;i<16;i++){float fi=float(i);
    float h1=hash21(vec2(fi,7.31));float h2=hash21(vec2(fi,3.77));
    float ang=h2*6.2831;float rr=t*(.2+h1*.75);
    vec2 sp=vec2(cos(ang),sin(ang))*rr;
    a+=(1.-smoothstep(0.,.006,distance(rel2,sp)))*u_intensity*(1.-t)*.55;}
  fragColor=vec4(u_accent*a,a);}`,
    wgsl: `var a=(1.-smoothstep(0.,.012,abs(d-t*.6)))*(1.-t)*.9;
a=a+(1.-smoothstep(0.,.3,d))*pow(1.-t,3.);
for(var i=0;i<16;i=i+1){let fi=f32(i);
 let h1=h21(vec2f(fi,7.31));let h2=h21(vec2f(fi,3.77));
 let ang=h2*6.2831;let rr=t*(.2+h1*.75);
 let sp=vec2f(cos(ang),sin(ang))*rr;
 a=a+(1.-smoothstep(0.,.006,distance(rel,sp)))*ii*(1.-t)*.55;}
a=a*ii;
return vec4f(acc*a,a);`
  },
  ripple: {
    glsl: `void main(){
  vec2 rel2=(gl_FragCoord.xy-u_origin)/u_res.y; float d2=length(rel2); float t=u_progress;
  float r1=1.-smoothstep(0.,.01,abs(d2-t*.7));
  float r2=(1.-smoothstep(0.,.014,abs(d2-t*.7+.05)))*.6;
  float a=(r1+r2)*pow(1.-t,1.5)*u_intensity;
  fragColor=vec4(u_accent*a,a);}`,
    wgsl: `var r1=1.-smoothstep(0.,.01,abs(d-t*.7));
var r2=(1.-smoothstep(0.,.014,abs(d-t*.7+.05)))*.6;
var a=(r1+r2)*pow(1.-t,1.5)*ii;
return vec4f(acc*a,a);`
  },
  warp: {
    glsl: `void main(){
  vec2 rel2=(gl_FragCoord.xy-u_origin)/u_res.y; float d2=length(rel2);
  float ang=atan(rel2.y,rel2.x); float t=u_progress; float streak=0.;
  for(int i=1;i<9;i++){float fi=float(i);
    float sd=hash21(vec2(floor(ang*fi*6.),fi));
    streak+=smoothstep(.9,1.,sd)*(1.-fi/9.);}
  streak*=smoothstep(.05,.3,d2);
  float pull=1./(1.+max(d2*3.-t*2.,0.));
  float a=streak*pull*u_intensity*smoothstep(0.,.1,t)*(1.-t);
  fragColor=vec4(mix(vec3(1.),u_accent,.5)*a,a);}`,
    wgsl: `let ang=atan2(rel.y,rel.x);
var streak=0.;
for(var i=1;i<9;i=i+1){let fi=f32(i);
 let sd=h21(vec2f(floor(ang*fi*6.),fi));
 streak=streak+smoothstep(.9,1.,sd)*(1.-fi/9.);}
streak=streak*smoothstep(.05,.3,d);
let pull=1./(1.+max(d*3.-t*2.,0.));
var a=streak*pull*ii*smoothstep(0.,.1,t)*(1.-t);
let c=mix(vec3f(1.),acc,.5);
return vec4f(c*a,a);`
  },
  glitch: {
    glsl: `void main(){
  vec2 uv=gl_FragCoord.xy/u_res; float t=u_progress;
  float burst=exp(-(t-.1)*(t-.1)*700.); float bId=0.;
  float b2=exp(-(t-.35)*(t-.35)*700.);
  float b3=exp(-(t-.7)*(t-.7)*700.);
  if(b2>burst){burst=b2;bId=1.;}
  if(b3>burst){burst=b3;bId=2.;}
  float env=smoothstep(0.,.04,t)*(1.-smoothstep(.92,1.,t));
  burst*=env;
  if(burst<.004){fragColor=vec4(0.);return;}
  float slip=step(hash21(vec2(bId,3.)),.5)*burst*.03;
  float row=floor(uv.y*22.);
  float h=hash21(vec2(row,bId*13.));
  float shift=(h-.5)*.16*burst;
  float bandPos=fract(t*1.4+bId*.33);
  float band=1.-smoothstep(0.,.06,abs(uv.y-bandPos));
  float g=hash21(uv*u_res*.5+vec2(floor(u_time*60.)));
  float ca=abs(shift)*4.+.004;
  float rB=1.-smoothstep(0.,ca,abs(uv.x-(.5+shift*.5)));
  float bB=1.-smoothstep(0.,ca,abs(uv.x-(.5-shift*.5)));
  float edge=1.-smoothstep(0.,.015,abs(fract(uv.y*22.)-.5));
  vec3 col3=u_accent*(.4*band+.5*edge)*burst
    +vec3(1.,.3,.15)*rB*burst*.4
    +vec3(.2,.45,1.)*bB*burst*.4
    +vec3(g)*.07*burst;
  float a=clamp(burst*(.5+.35*band)*u_intensity,0.,1.);
  fragColor=vec4(col3*u_intensity+vec3(slip*8.),a);}`,
    wgsl: `var bId=0.; var burst=exp(-(t-0.1)*(t-0.1)*700.);
let b2=exp(-(t-0.35)*(t-0.35)*700.);
let b3=exp(-(t-0.7)*(t-0.7)*700.);
if(b2>burst){burst=b2;bId=1.;}
if(b3>burst){burst=b3;bId=2.;}
let env=smoothstep(0.,0.04,t)*(1.-smoothstep(0.92,1.,t));
burst=burst*env;
if(burst<0.004){return vec4f(0.);}
let slip=step(h21(vec2f(bId,3.)),0.5)*burst*0.03;
let row=floor(uv.y*22.);
let h=h21(vec2f(row,bId*13.));
let shift=(h-0.5)*0.16*burst;
let bandPos=fract(t*1.4+bId*0.33);
let band=1.-smoothstep(0.,0.06,abs(uv.y-bandPos));
let st=floor(u.t*60.);
let g=h21(uv*u.res*0.5+vec2f(st,st));
let ca=abs(shift)*4.+0.004;
let rB=1.-smoothstep(0.,ca,abs(uv.x-(0.5+shift*0.5)));
let bB=1.-smoothstep(0.,ca,abs(uv.x-(0.5-shift*0.5)));
let edge=1.-smoothstep(0.,0.015,abs(fract(uv.y*22.)-0.5));
var col3=acc*(0.4*band+0.5*edge)*burst+vec3f(1.,0.3,0.15)*rB*burst*0.4+vec3f(0.2,0.45,1.)*bB*burst*0.4+vec3f(g)*0.07*burst;
let a=clamp(burst*(0.5+0.35*band)*ii,0.,1.);
return vec4f(col3*ii+vec3f(slip*8.),a);`
  },
  aurora: {
    glsl: `void main(){
  vec2 uv=gl_FragCoord.xy/u_res; float t=u_progress;
  float w=sin(uv.y*6.+u_time*1.2)*.5+.5;
  w*=sin(uv.x*3.-u_time*.7)*.5+.5;
  float band=1.-smoothstep(0.,.3,abs(uv.x-.5-w*.25));
  vec3 col=mix(mix(u_accent,vec3(.35,.75,.6),w),vec3(.45,.5,.9),sin(u_time*.5)*.5+.5);
  float a=band*.35*u_intensity*sin(t*3.14159);
  fragColor=vec4(col*a,a);}`,
    wgsl: `let w=(sin(uv.y*6.+u.t*1.2)*.5+.5)*(sin(uv.x*3.-u.t*.7)*.5+.5);
let band=1.-smoothstep(0.,0.3,abs(uv.x-0.5-w*0.25));
let col=mix(mix(acc,vec3f(.35,.75,.6),w),vec3f(.45,.5,.9),(sin(u.t*.5)*.5+.5));
var a=band*0.35*ii*sin(t*3.14159);
return vec4f(col*a,a);`
  },
  summon: {
    glsl: `void main(){
  vec2 rel2=(gl_FragCoord.xy-u_origin)/u_res.y; float d2=length(rel2); float t=u_progress;
  float fade=smoothstep(0.,.1,t)*(1.-smoothstep(.82,1.,t));
  float rings=0.;
  for(int i=0;i<4;i++){float fi=float(i)/4.;
    float R=t*(.55-fi*.08)+.06+fi*.05;
    float w=.006+.004*(1.-t);
    rings+=(1.-smoothstep(0.,w,abs(d2-R)))*(1.-fi*.18);}
  float ang=atan(rel2.y,rel2.x);
  float ring1=t*.5+.08;
  float ticks1=step(.55,fract(ang*10./6.2831+t*2.))*(1.-smoothstep(0.,.012,abs(d2-ring1)));
  float ticks2=step(.6,fract(ang*14./6.2831-t*1.4))*(1.-smoothstep(0.,.01,abs(d2-ring1*.78)));
  float a5=ang+t*.6; float m=abs(fract(a5/1.2566)-.5)*2.;
  float star=(1.-smoothstep(0.,.02,abs(d2-t*.34)))*step(m,.55);
  float gsh=hash21(vec2(floor(ang*24.),floor(u_time*3.)));
  float glyph=(1.-smoothstep(0.,.02,abs(d2-ring1)))*step(.7,gsh);
  float ray=pow(max(0.,sin(ang*12.+t*2.)),8.)*(1.-smoothstep(.05,.6,d2))*.25;
  float motes=0.;
  for(int i=0;i<8;i++){float fi=float(i);
    float h1=hash21(vec2(fi,1.));float h2=hash21(vec2(fi,2.));float h3=hash21(vec2(fi,3.));
    vec2 mp=vec2(h1-.5,h2-.5)*1.1; mp.y+=fract(h3-u_time*.05)*.4-.2;
    motes+=(1.-smoothstep(0.,.008,distance(rel2,mp)))*.6;}
  vec2 gr=rel2-vec2(0.,-.55); gr.y*=2.2;
  float ground=(1.-smoothstep(0.,.01,abs(length(gr)-t*.5-.05)))*.5*step(rel2.y,-.1);
  float bloom=exp(-d2*3.5)*.3;
  float flash=(t>.86)?(1.-smoothstep(.86,1.,t))*1.2:0.;
  float a=clamp((rings*.8+ticks1*.9+ticks2*.7+star*.6+glyph+ray+motes+ground+bloom+flash)*fade*u_intensity,0.,1.);
  fragColor=vec4(u_accent*a+vec3(flash*.8)*fade*u_intensity,a);}`,
    wgsl: `let fade=smoothstep(0.,0.1,t)*(1.-smoothstep(0.82,1.,t));
var rings=0.;
for(var i=0;i<4;i=i+1){let fi=f32(i)/4.;
 let R=t*(0.55-fi*0.08)+0.06+fi*0.05;
 let w=0.006+0.004*(1.-t);
 rings=rings+(1.-smoothstep(0.,w,abs(d-R)))*(1.-fi*0.18);}
let ang=atan2(rel.y,rel.x);
let ring1=t*0.5+0.08;
let ticks1=step(0.55,fract(ang*10./6.2831+t*2.))*(1.-smoothstep(0.,0.012,abs(d-ring1)));
let ticks2=step(0.6,fract(ang*14./6.2831-t*1.4))*(1.-smoothstep(0.,0.01,abs(d-ring1*0.78)));
let a5=ang+t*0.6; let m=abs(fract(a5/1.2566)-0.5)*2.;
let star=(1.-smoothstep(0.,0.02,abs(d-t*0.34)))*step(m,0.55);
let gsh=h21(vec2f(floor(ang*24.),floor(u.t*3.)));
let glyph=(1.-smoothstep(0.,0.02,abs(d-ring1)))*step(0.7,gsh);
let ray=pow(max(0.,sin(ang*12.+t*2.)),8.)*(1.-smoothstep(0.05,0.6,d))*0.25;
var motes=0.;
for(var j=0;j<8;j=j+1){let fj=f32(j);
 let h1=h21(vec2f(fj,1.));let h2=h21(vec2f(fj,2.));let h3=h21(vec2f(fj,3.));
 var mp=vec2f(h1-0.5,h2-0.5)*1.1; mp.y=mp.y+fract(h3-u.t*0.05)*0.4-0.2;
 motes=motes+(1.-smoothstep(0.,0.008,distance(rel,mp)))*0.6;}
var gr=rel-vec2f(0.,-0.55); gr.y=gr.y*2.2;
let ground=(1.-smoothstep(0.,0.01,abs(length(gr)-t*0.5-0.05)))*0.5*step(rel.y,-0.1);
let bloom=exp(-d*3.5)*0.3;
var flash=0.; if(t>0.86){flash=(1.-smoothstep(0.86,1.,t))*1.2;}
var a=clamp((rings*0.8+ticks1*0.9+ticks2*0.7+star*0.6+glyph+ray+motes+ground+bloom+flash)*fade*ii,0.,1.);
return vec4f(acc*a+vec3f(flash*0.8)*fade*ii,a);`
  },
  timestop: {
    glsl: `void main(){
  vec2 uv=gl_FragCoord.xy/u_res; float t=u_progress;
  float dd=distance(uv,vec2(.5));
  float env=sin(t*3.14159);
  float vin=smoothstep(.15,.75,dd);
  float grain=hash21(uv*u_res*.5+vec2(floor(u_time*24.)))*.12;
  float wave=0.;
  if(t>.8){float q=(t-.8)/.2; wave=(1.-smoothstep(0.,.05,abs(dd-q*.9)))*(1.-q)*1.2;}
  float a=clamp((vin*.85+grain)*env*u_intensity+wave*u_intensity,0.,1.);
  fragColor=vec4(vec3(.82,.86,.95)*(vin*env*u_intensity)+u_accent*wave*u_intensity,a);}`,
    wgsl: `let dd=distance(uv,vec2f(0.5));
let env=sin(t*3.14159);
let vin=smoothstep(0.15,0.75,dd);
let st=floor(u.t*24.);
let grain=h21(uv*u.res*0.5+vec2f(st,st))*0.12;
var wave=0.;
if(t>0.8){let q=(t-0.8)/0.2; wave=(1.-smoothstep(0.,0.05,abs(dd-q*0.9)))*(1.-q)*1.2;}
let a=clamp((vin*0.85+grain)*env*ii+wave*ii,0.,1.);
return vec4f(vec3f(0.82,0.86,0.95)*(vin*env*ii)+acc*wave*ii,a);`
  },
  crt: {
    glsl: `void main(){
  vec2 uv=gl_FragCoord.xy/u_res; float t=u_progress;
  float scan=(.5+.5*sin(uv.y*700.))*.35;
  float s24=floor(u_time*24.);
  float noise=hash21(floor(uv*vec2(180.,120.))+vec2(s24));
  float band=(1.-smoothstep(0.,.05,abs(uv.y-fract(t*1.3))))*.5;
  float a=(scan+noise*.25+band)*u_intensity*(1.-t)*.9;
  fragColor=vec4(mix(vec3(1.),u_accent,.3)*a,a);}`,
    wgsl: `let scan=(.5+.5*sin(uv.y*700.))*.35;
let s24=floor(u.t*24.);
let noise=h21(floor(uv*vec2f(180.,120.))+vec2f(s24,s24));
let band=(1.-smoothstep(0.,0.05,abs(uv.y-fract(t*1.3))))*.5;
var a=(scan+noise*0.25+band)*ii*(1.-t)*0.9;
let c=mix(vec3f(1.),acc,0.3);
return vec4f(c*a,a);`
  },
  snowfall: {
    glsl: `void main(){
  vec2 uv=gl_FragCoord.xy/u_res; float t=u_progress;
  float a=0.;
  for(int i=0;i<24;i++){float fi=float(i);
    float h1=hash21(vec2(fi,1.));float h2=hash21(vec2(fi,2.));float h3=hash21(vec2(fi,3.));
    float y=fract(h2-u_time*(.05+h1*.12));
    float x=fract(h3+sin(u_time*.8+fi)*.02);
    a+=(1.-smoothstep(0.,.003+h1*.003,distance(uv,vec2(x,y))))*(.5+h2*.5);}
  a*=u_intensity*(1.-smoothstep(.85,1.,t));
  fragColor=vec4(vec3(1.)*a,a);}`,
    wgsl: `var a=0.;
for(var i=0;i<24;i=i+1){let fi=f32(i);
 let h1=h21(vec2f(fi,1.));let h2=h21(vec2f(fi,2.));let h3=h21(vec2f(fi,3.));
 let y=fract(h2-u.t*(0.05+h1*0.12));
 let x=fract(h3+sin(u.t*0.8+fi)*0.02);
 a=a+(1.-smoothstep(0.,0.003+h1*0.003,distance(uv,vec2f(x,y))))*(0.5+h2*0.5);}
a=a*ii*(1.-smoothstep(0.85,1.,t));
return vec4f(vec3f(a),a);`
  },
  pulse: {
    glsl: `void main(){
  vec2 uv=gl_FragCoord.xy/u_res; float t=u_progress;
  float dd=distance(uv,vec2(.5));
  float beat=pow(abs(sin(u_time*5.)),8.);
  float beat2=pow(abs(sin(u_time*5.-.8)),8.)*.6;
  float vin=smoothstep(.25,.7,dd);
  float env=sin(t*3.14159);
  float a=vin*(beat+beat2)*env*u_intensity;
  fragColor=vec4(u_accent*a,a);}`,
    wgsl: `let dd=distance(uv,vec2f(0.5));
let beat=pow(abs(sin(u.t*5.)),8.);
let beat2=pow(abs(sin(u.t*5.-0.8)),8.)*0.6;
let vin=smoothstep(0.25,0.7,dd);
let env=sin(t*3.14159);
var a=vin*(beat+beat2)*env*ii;
return vec4f(acc*a,a);`
  },
};

const ShaderFX = {
  cv: null, gl: null, glVS: null, glProgs: new Map(),
  gpu: null, gpuCtx: null, gpuFormat: null, gpuPipes: new Map(),
  active: null, seq: 0, raf: 0, cssT: 0, fade: null,
  DPR_CAP: 1.25, NORMAL_BLEND: ["timestop"],
  _srcCache: new Map(), _fetching: new Set(), _want: null, _wantP: null,
  cssFB: { explosion:"fb-explosion", ripple:"fb-ripple", warp:"fb-glitch", glitch:"fb-glitch",
           aurora:"fb-aurora", summon:"fb-glitch", timestop:"fb-timestop", crt:"fb-crt",
           snowfall:"fb-glitch", pulse:"fb-pulse" },
  builtins: SF_B,

  isShadertoy(src) { return /mainImage\s*\(/.test(src) && !/void\s+main\s*\(/.test(src); },
  wrapGLSL(src) {
    if (!this.isShadertoy(src)) return src;
    src = src.replace(/^\s*#version[^\n]*\n/, "");
    return "#version 300 es\nprecision highp float;\n" +
      "uniform float u_time;uniform vec2 u_res;uniform float u_progress;" +
      "uniform vec2 u_origin;uniform float u_intensity;uniform vec3 u_accent;\n" +
      "uniform vec4 iMouse;uniform float iTimeDelta;uniform int iFrame;uniform vec4 iDate;\n" +
      "uniform sampler2D iChannel0;uniform sampler2D iChannel1;uniform sampler2D iChannel2;uniform sampler2D iChannel3;\n" +
      "#define iTime u_time\n#define iResolution u_res\n" +
      "out vec4 _shOut;\n" + src + "\n" +
      "void main(){ mainImage(_shOut, gl_FragCoord.xy); }\n";
  },
  _noiseTex: null,
  ensureNoiseTex(gl) {
    if (this._noiseTex) return this._noiseTex;
    const N = 128, data = new Uint8Array(N * N * 4), rng = mulberry32(0xC0FFEE);
    for (let i = 0; i < data.length; i++) data[i] = (rng() * 256) | 0;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    this._noiseTex = tex;
    return tex;
  },

  init() {
    this.cv = $("#shader-fx");
    if (!this.cv) return;
    try { this.gl = this.cv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" }); }
    catch (_) { this.gl = null; }
    if (this.gl) {
      this.cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); this.glProgs.clear(); this.glVS = null; this.stop(); }, false);
      this.cv.addEventListener("webglcontextrestored", () => { this.glProgs.clear(); this.glVS = null; }, false);
    }
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.stop(); });
  },
  ensureGL() { return this.gl; },
  async ensureGPU() {
    if (this.gpu !== null) return this.gpu;
    if (!navigator.gpu) { this.gpu = null; return null; }
    try {
      const ad = await navigator.gpu.requestAdapter();
      if (!ad) { this.gpu = null; return null; }
      const dev = await ad.requestDevice();
      const ctx = this.cv.getContext("webgpu");
      if (!ctx) { this.gpu = null; return null; }
      this.gpu = dev; this.gpuCtx = ctx;
      this.gpuFormat = navigator.gpu.getPreferredCanvasFormat();
      ctx.configure({ device: dev, format: this.gpuFormat, alphaMode: "premultiplied" });
      dev.lost.then(() => { this.gpu = null; this.gpuPipes.clear(); this.stop(); });
      return dev;
    } catch (_) { this.gpu = null; return null; }
  },
  getVSGL() {
    if (this.glVS) return this.glVS;
    const gl = this.gl;
    const sh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(sh, "#version 300 es\nin vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}");
    gl.compileShader(sh);
    this.glVS = sh; return sh;
  },
  getProgGL(name, code) {
    if (this.glProgs.has(name)) return this.glProgs.get(name);
    const gl = this.gl; if (!gl) return null;
    let p = null;
    try {
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, this.wrapGLSL(code)); gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) { console.info("[shader] derleme hatası:", name, gl.getShaderInfoLog(fs)); return null; }
      const pr = gl.createProgram();
      gl.attachShader(pr, this.getVSGL()); gl.attachShader(pr, fs); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.info("[shader] link hatası:", name, gl.getProgramInfoLog(pr)); return null; }
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, "aPos");
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u = {};
      ["u_time","u_res","u_progress","u_origin","u_intensity","u_accent"].forEach(k => u[k] = gl.getUniformLocation(pr, k));
      p = { pr, buf, loc, u };
      if (this.isShadertoy(code)) {
        gl.useProgram(pr);
        const tex = this.ensureNoiseTex(gl);
        for (let ch = 0; ch < 4; ch++) {
          const lc = gl.getUniformLocation(pr, "iChannel" + ch);
          if (lc) { gl.activeTexture(gl.TEXTURE0 + ch); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(lc, ch); }
        }
        p.stMouse = gl.getUniformLocation(pr, "iMouse");
      }
    } catch (e) { console.info("[shader] GL hata:", name, String(e)); p = null; }
    this.glProgs.set(name, p); return p;
  },
  async getPipeGPU(name, code) {
    if (this.gpuPipes.has(name)) return this.gpuPipes.get(name);
    let r = null;
    try {
      const dev = this.gpu; if (!dev) return null;
      const mod = dev.createShaderModule({ code });
      const normal = this.NORMAL_BLEND.includes(name);
      const dst = normal ? "one-minus-src-alpha" : "one";
      const pipe = dev.createRenderPipeline({ layout: "auto",
        vertex: { module: mod, entryPoint: "vs" },
        fragment: { module: mod, entryPoint: "fs", targets: [{ format: this.gpuFormat,
          blend: { color: { srcFactor: "one", dstFactor: dst }, alpha: { srcFactor: "one", dstFactor: dst } } }] },
        primitive: { topology: "triangle-strip" } });
      const ubo = dev.createBuffer({ size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      const bind = dev.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: ubo } }] });
      r = { pipe, ubo, bind };
    } catch (e) { console.info("[shader] WebGPU pipeline hatası:", name, String(e)); r = null; }
    this.gpuPipes.set(name, r); return r;
  },
  isOwnOrigin(f) { return !(/^(https?:)?\/\//i.test(f) || /^data:/i.test(f) || /^[a-z][a-z0-9+.-]*:\/\//i.test(f)); },
  resolve(name) {
    if (this._srcCache.has(name)) return this._srcCache.get(name);
    const b = this.builtins[name];
    if (b) { const r = { lang: "dual", glsl: SF_HEAD + b.glsl, wgsl: WF(b.wgsl) }; this._srcCache.set(name, r); return r; }
    const c = (CONFIG.shaders || []).find(s => s && s.name === name);
    if (!c) { this._srcCache.set(name, null); return null; }
    if (c.src) {
      const lang = /@fragment|fn\s+\w+\s*\(/.test(c.src) ? "wgsl" : "glsl";
      const r = { lang, code: c.src };
      this._srcCache.set(name, r); return r;
    }
    if (c.file) {
      if (!this.isOwnOrigin(c.file)) { console.info("[shader] red: kendi-kökeni değil:", c.file); this._srcCache.set(name, null); return null; }
      const lang = /\.wgsl$/i.test(c.file) ? "wgsl" : "glsl";
      const cached = this._srcCache.get("__file:" + c.file);
      if (cached && cached.code) { const r = { lang, code: cached.code }; this._srcCache.set(name, r); return r; }
      this.fetchFile(name, c.file, lang);
      return "pending";
    }
    this._srcCache.set(name, null); return null;
  },
  fetchFile(name, file, lang) {
    if (this._fetching.has(file)) return;
    this._fetching.add(file);
    fetch(file)
      .then(r => { if (!r.ok) throw 0; return r.text(); })
      .then(txt => {
        this._srcCache.set("__file:" + file, { code: txt });
        this._srcCache.delete(name);
        if (this._want === name && this._wantP) this.play(Object.assign({}, this._wantP));
      })
      .catch(() => { console.info("[shader] dosya okunamadı (sessiz skip):", file); this._srcCache.set(name, null); })
      .finally(() => this._fetching.delete(file));
  },
  compileCheck(name, src) {
    this._srcCache.delete(name);
    const isW = /@fragment|fn\s+\w+\s*\(/.test(src);
    if (isW) {
      if (!navigator.gpu) return "WebGPU yok — WGSL derlenemez";
      this.verifyWGSL(name, src);
      return true;
    }
    const gl = this.ensureGL();
    if (!gl) return "WebGL2 yok — derleme kontrolü yapılamadı";
    try {
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, this.wrapGLSL(src)); gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(fs) || "bilinmeyen hata";
        console.info("[shader] derleme hatası:", name, log);
        gl.deleteShader(fs); return log;
      }
      const pr = gl.createProgram();
      gl.attachShader(pr, this.getVSGL()); gl.attachShader(pr, fs); gl.linkProgram(pr);
      const ok = gl.getProgramParameter(pr, gl.LINK_STATUS);
      const llog = ok ? "" : (gl.getProgramInfoLog(pr) || "link hatası");
      gl.deleteProgram(pr); gl.deleteShader(fs);
      if (!ok) { console.info("[shader] link hatası:", name, llog); return llog; }
      return true;
    } catch (e) { return String(e && e.message || e); }
  },
  async verifyWGSL(name, src) {
    try {
      const dev = await this.ensureGPU();
      if (!dev) return false;
      const mod = dev.createShaderModule({ code: src });
      const info = await mod.getCompilationInfo();
      const errs = info.messages.filter(m => m.type === "error");
      if (errs.length) {
        console.info("[shader] WGSL derleme hatası:", name, errs.map(m => m.lineNum + ":" + m.message).join("; "));
        const ix = (CONFIG.shaders || []).findIndex(s => s && s.name === name);
        if (ix >= 0) CONFIG.shaders.splice(ix, 1);
        this._srcCache.delete(name); this.gpuPipes.delete(name);
        if (window.SenkiApp) SenkiApp.toast("WGSL shader geçersiz — kaldırıldı (log)", "err");
        return false;
      }
      return true;
    } catch (e) { console.info("[shader] WGSL kontrolü:", name, String(e)); return false; }
  },
  accentVec() {
    const h = String(CONFIG.theme.accent || "#e6b34d").replace("#", "");
    return [(parseInt(h.slice(0,2),16)||230)/255, (parseInt(h.slice(2,4),16)||179)/255, (parseInt(h.slice(4,6),16)||77)/255];
  },
  async play(p) {
    if (!this.cv) return false;
    if (reducedMotion || Perf.low) return false;
    if (document.hidden) return false;
    p = p || {};
    const name = p.name || "explosion";
    const mode = p.mode || "oneshot";
    const ambient = mode !== "oneshot";
    const dur = clamp(p.duration ?? 3, .5, 10);
    const inten = clamp01(p.intensity ?? 1);
    const ease = p.easing === "linear" ? (x => x) : (x => 1 - (1 - x) * (1 - x));
    this._want = name; this._wantP = p;
    let src = this.resolve(name);
    if (src === null) return this.playCSS(name, ambient ? Math.max(dur, 6) : dur);
    if (src === "pending") return "pending";
    this.stop();
    let backend = null, glCode = null, wgslCode = null;
    if (src.lang === "dual") {
      const dev = await this.ensureGPU().catch(() => null);
      if (dev && this.gpuCtx) { backend = "gpu"; wgslCode = src.wgsl; }
      else if (this.ensureGL()) { backend = "gl"; glCode = src.glsl; }
    } else if (src.lang === "wgsl") {
      const dev = await this.ensureGPU().catch(() => null);
      if (dev && this.gpuCtx) { backend = "gpu"; wgslCode = src.code; }
    } else {
      if (this.ensureGL()) { backend = "gl"; glCode = src.code; }
    }
    if (!backend) return this.playCSS(name, ambient ? Math.max(dur, 6) : dur);
    const cv = this.cv, d = Math.min(devicePixelRatio || 1, this.DPR_CAP);
    const ox = p.at === "center" ? innerWidth / 2 : PointerBus.last.x;
    const oy = p.at === "center" ? innerHeight / 2 : PointerBus.last.y;
    cv.width = Math.max(2, Math.round(innerWidth * d));
    cv.height = Math.max(2, Math.round(innerHeight * d));
    cv.hidden = false;
    if (name === "timestop") cv.style.mixBlendMode = "saturation";
    let draw = null;
    if (backend === "gl") {
      const prog = this.getProgGL(name, glCode);
      if (!prog) return this.playCSS(name, dur);
      const gl = this.gl;
      gl.viewport(0, 0, cv.width, cv.height);
      gl.useProgram(prog.pr);
      if (prog.stMouse) gl.uniform4f(prog.stMouse, ox * d, cv.height - oy * d, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, prog.buf);
      gl.enableVertexAttribArray(prog.loc);
      gl.vertexAttribPointer(prog.loc, 2, gl.FLOAT, false, 0, 0);
      if (prog.u.u_res) gl.uniform2f(prog.u.u_res, cv.width, cv.height);
      if (prog.u.u_origin) gl.uniform2f(prog.u.u_origin, ox * d, (innerHeight - oy) * d);
      const acc = this.accentVec();
      if (prog.u.u_accent) gl.uniform3f(prog.u.u_accent, acc[0], acc[1], acc[2]);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, this.NORMAL_BLEND.includes(name) ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
      draw = (prg, t, k) => {
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        if (prog.u.u_time) gl.uniform1f(prog.u.u_time, t);
        if (prog.u.u_progress) gl.uniform1f(prog.u.u_progress, prg);
        if (prog.u.u_intensity) gl.uniform1f(prog.u.u_intensity, k);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
    } else {
      const r = await this.getPipeGPU(name, wgslCode);
      if (!r) return this.playCSS(name, dur);
      const dev = this.gpu, U = new Float32Array(12);
      const acc = this.accentVec();
      U[4] = cv.width; U[5] = cv.height;
      U[6] = ox * d; U[7] = oy * d;
      U[8] = acc[0]; U[9] = acc[1]; U[10] = acc[2];
      draw = (prg, t, k) => {
        U[0] = t; U[1] = prg; U[2] = k; U[3] = 0; U[11] = 0;
        dev.queue.writeBuffer(r.ubo, 0, U);
        const enc = dev.createCommandEncoder();
        const pass = enc.beginRenderPass({ colorAttachments: [{ view: this.gpuCtx.getCurrentTexture().createView(),
          loadOp: "clear", clearValue: { r: 0, g: 0, b: 0, a: 0 }, storeOp: "store" }] });
        pass.setPipeline(r.pipe); pass.setBindGroup(0, r.bind); pass.draw(4); pass.end();
        dev.queue.submit([enc.finish()]);
      };
    }
    const t0 = performance.now(), myId = ++this.seq;
    this.active = { id: myId, name, ambient };
    const self = this;
    const frame = (now) => {
      if (!self.active || self.active.id !== myId) return;
      const t = (now - t0) / 1000;
      let k = inten;
      if (self.fade) { k *= Math.max(0, 1 - (now - self.fade.t0) / 600);
        if (k <= 0.001) { self.stop(); return; } }
      const prg = ambient ? 0.5 : clamp01(t / dur);
      try { draw(ambient ? prg : ease(prg), t, k); } catch (_) { self.stop(); return; }
      if (!ambient && prg >= 1) { self.stop(); return; }
      self.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
    return true;
  },
  playCSS(name, dur) {
    const cls = this.cssFB[name];
    if (!cls) return false;
    const cv = this.cv;
    Object.values(this.cssFB).forEach(c => cv.classList.remove(c));
    cv.classList.add(cls);
    cv.style.animationDuration = dur + "s";
    cv.hidden = false;
    this.active = { id: ++this.seq, name, css: true, ambient: dur > 5 };
    clearTimeout(this.cssT);
    this.cssT = setTimeout(() => this.stop(), dur * 1000 + 60);
    return "css";
  },
  stopFade() {
    if (!this.active) return;
    if (this.active.css) { this.cssT = setTimeout(() => this.stop(), 450); return; }
    this.fade = { t0: performance.now() };
  },
  stop() {
    if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0;
    clearTimeout(this.cssT); this.cssT = 0;
    this.fade = null;
    if (this.cv) {
      this.cv.hidden = true;
      Object.values(this.cssFB).forEach(c => this.cv.classList.remove(c));
      this.cv.style.mixBlendMode = "";
      this.cv.style.animationDuration = "";
    }
    this.active = null;
  },
};

/* ---------- tema / font / meta / entry / toast ---------- */
function applyTheme(){
  const h=String(CONFIG.theme.accent||"#e6b34d").replace("#","");
  const r=parseInt(h.slice(0,2),16)||230,g=parseInt(h.slice(2,4),16)||179,b=parseInt(h.slice(4,6),16)||77;
  const up=v=>Math.min(255,v+42);
  root.style.setProperty("--accent","#"+h);
  root.style.setProperty("--accent-rgb",`${r},${g},${b}`);
  root.style.setProperty("--accent-bright",`rgb(${up(r)},${up(g)},${up(b)})`);
  /* v5.1: boş/geçersiz = CSS varsayılanı kalır */
  const valid=s=>{const v=String(s||"").trim();return /^#[0-9a-fA-F]{6}$/.test(v)?v:null;};
  const put=(name,val)=>{if(val)root.style.setProperty(name,val);else root.style.removeProperty(name);};
  const txt=valid(CONFIG.theme.text);
  put("--text",txt);
  put("--muted",txt?txt+"b0":null);
  put("--bg",valid(CONFIG.theme.background));
  put("--icon-color",valid(CONFIG.theme.icon));
  const cb=valid(CONFIG.theme.cardBg);
  if(cb){
    root.style.setProperty("--card-bg-r",parseInt(cb.slice(1,3),16));
    root.style.setProperty("--card-bg-g",parseInt(cb.slice(3,5),16));
    root.style.setProperty("--card-bg-b",parseInt(cb.slice(5,7),16));
  }else{
    ["--card-bg-r","--card-bg-g","--card-bg-b"].forEach(k=>root.style.removeProperty(k));
  }
  document.body.classList.toggle("card-solid",!!cb);
}
function applyFont(){if(CONFIG.font.mode==="google"){const f=(CONFIG.font.googleFamily||"Cinzel").replace(/ /g,"+");if(!document.querySelector(`link[data-sf="${f}"]`)){const l=document.createElement("link");l.rel="stylesheet";l.dataset.sf=f;l.href=`https://fonts.googleapis.com/css2?family=${f}:wght@${CONFIG.font.weights||"400;600"}&display=swap`;document.head.appendChild(l);}root.style.setProperty("--font-main",`"${CONFIG.font.googleFamily}",Georgia,serif`);}else root.style.setProperty("--font-main",`"ProfileFont",Georgia,"Times New Roman",serif`)}
function applyMeta(){
  if(CONFIG.meta&&CONFIG.meta.title)document.title=CONFIG.meta.title;
  const d=$("#meta-desc");if(d&&CONFIG.meta&&CONFIG.meta.description)d.setAttribute("content",CONFIG.meta.description);
  const fav=(CONFIG.meta&&CONFIG.meta.favicon)||"assets/favicon.svg";
  let link=document.querySelector('link[rel="icon"],link[rel="shortcut icon"]');
  if(!link){link=document.createElement("link");link.rel="icon";document.head.appendChild(link);}
  if(link.getAttribute("href")!==fav)link.setAttribute("href",fav);
}
function applyEntry(){
  const E=CONFIG.entry||{};
  const h=$(".entry-hint"),n=$(".entry-note"),c=$(".cube-scene"),cube=$(".cube");
  if(h)h.textContent=E.hint||"CLICK TO ENTER";
  if(n)n.textContent=E.note||"ses açık önerilir";
  if(c)c.style.display=(E.showCube!==false)?"":"none";
  let sz=clamp(parseInt(E.cubeSize,10)||72,28,140);
  if(innerWidth<=640)sz=Math.min(sz,64);
  root.style.setProperty("--cube",sz+"px");
  if(cube)cube.style.animationDuration=clamp(parseFloat(E.cubeSpeed)||10,3,40)+"s";
  const cc=String(E.cubeColor||"").trim();
  if(/^#[0-9a-fA-F]{6}$/.test(cc)){
    const r=parseInt(cc.slice(1,3),16),g=parseInt(cc.slice(3,5),16),b=parseInt(cc.slice(5,7),16);
    root.style.setProperty("--cube-rgb",r+","+g+","+b);
    root.style.setProperty("--cube-bright","rgb("+Math.min(255,r+42)+","+Math.min(255,g+42)+","+Math.min(255,b+42)+")");
  }else{
    root.style.removeProperty("--cube-rgb");
    root.style.removeProperty("--cube-bright");
  }
}
function toast(msg,type="ok"){const w=$("#toasts");if(!w)return;while(w.children.length>=3)w.firstChild.remove();const t=document.createElement("div");t.className="toast";t.innerHTML=(type==="err"?ICONS.cross:ICONS.check)+"<span></span>";t.lastChild.textContent=msg;w.appendChild(t);setTimeout(()=>{t.classList.add("is-leaving");t.addEventListener("animationend",()=>t.remove(),{once:true})},2600)}

/* ═══ SES + routedFrame ═══ */
const AudioSys={video:null,music:null,_on:false,_vol:.35,
  _routed:0,_wa:null,
  ensureMusic(){if(this.music)return this.music;
    const m=this.music=new Audio();m.loop=true;m.preload="none";m.dataset.path="assets/music.mp3";
    m.addEventListener("error",()=>{if(CONFIG.audio.source==="music"){CONFIG.audio.source="video";console.info("[senki] music.mp3 yok — videoya dönüldü.");this.apply();if(window.SenkiEditor)SenkiEditor.syncAudio();}});
    return m;},
  init(){this.video=$("#bg-video");if(this.video)this.video.muted=true;
    const tg=$("#player-toggle");if(tg)tg.addEventListener("click",()=>{this.toggle();Sfx.clickBlip();});
    const v=$("#player-vol");if(v)v.addEventListener("input",()=>this.setVolume(parseFloat(v.value)));
    const p=$("#player");if(p)p.addEventListener("mouseenter",()=>Sfx.hoverBlip());},
  unlock(){this._vol=parseFloat(store.get("senki:volume",String(CONFIG.audio.defaultVolume)));if(Number.isNaN(this._vol))this._vol=CONFIG.audio.defaultVolume;this._vol=clamp01(this._vol);this._on=store.get("senki:muted","0")!=="1";const v=$("#player-vol");if(v)v.value=this._vol;this.apply();},
  toggle(){this._on=!this._on;store.set("senki:muted",this._on?"0":"1");this.apply();},
  setVolume(v,persist=true){this._vol=clamp01(v);if(persist)store.set("senki:volume",String(this._vol));this.apply();},
  ensureWA(){
    if(this._wa)return this._wa;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
      const ctx=new AC();
      const analyser=ctx.createAnalyser();analyser.fftSize=128;analyser.smoothingTimeConstant=.72;
      const gain=ctx.createGain();gain.gain.value=0;
      analyser.connect(gain);gain.connect(ctx.destination);
      this._wa={ctx,analyser,gain,nodes:new Map(),el:null};
    }catch(_){this._wa=null;}
    return this._wa;},
  waAttach(el){
    const W=this.ensureWA();if(!W||!el)return false;
    try{
      if(!W.nodes.has(el))W.nodes.set(el,W.ctx.createMediaElementSource(el));
      if(W.el&&W.el!==el){try{W.nodes.get(W.el).disconnect(W.analyser);}catch(_){}}
      W.nodes.get(el).connect(W.analyser);
      W.el=el;
      el.muted=false;
      if(W.ctx.state==="suspended")W.ctx.resume().catch(()=>{});
      return true;
    }catch(_){return false;}},
  routedFrame(on){
    if(on){
      this._routed++;
      let attached=false;
      const self=this;
      return {
        read:(arr)=>{
          if(!attached){attached=true;
            if(entered){const el=CONFIG.audio.source==="music"?self.ensureMusic():self.video;
              self.waAttach(el);self.apply();}}
          const W=self._wa;
          if(W&&W.el){try{W.analyser.getByteFrequencyData(arr);return true;}catch(_){}}
          return false;
        },
        release:()=>self.routedFrame(false)
      };
    }
    if(this._routed>0)this._routed--;
    this.apply();
    return null;},
  _waGain(){if(!this._wa)return;const g=this._on?this._vol:0;
    try{this._wa.gain.gain.setTargetAtTime(g,this._wa.ctx.currentTime,.03);}
    catch(_){try{this._wa.gain.gain.value=g;}catch(_){}}},
  apply(){
    const W=this._wa,routedEl=W?W.el:null;
    if(CONFIG.audio.source==="music"){
      const m=this.ensureMusic();
      if(this.video)this.video.muted=true;
      if(routedEl===m){m.muted=false;}
      else{m.volume=this._vol;}
      if(this._on&&!document.hidden)m.play().catch(()=>{});else m.pause();
    }else{
      if(this.music)this.music.pause();
      const v=this.video;
      if(v){
        if(routedEl===v){v.muted=false;}
        else{v.muted=!this._on;v.volume=this._vol;}
      }
    }
    if(W&&this._routed>0){
      const el=CONFIG.audio.source==="music"?this.music:this.video;
      if(el&&W.el!==el)this.waAttach(el);
    }
    if(W&&W.el)this._waGain();
    Media.setAudio(CONFIG.audio.source==="video"&&this._on);
    this.updateUI();},
  isOn(){return this._on===true},
  paintSlider(){const v=$("#player-vol");if(v)v.style.setProperty("--fill",(this._vol*100)+"%")},
  updateUI(){const b=$("#player-toggle");if(!b)return;b.innerHTML=this._on?ICONS.pause:ICONS.play;b.setAttribute("aria-pressed",String(this._on));$("#player").classList.toggle("is-on",this._on);$("#player-vol").value=this._vol;this.paintSlider();}};

const Sfx={hover:null,click:null,ok:false,_l:0,
  init(){if(!CONFIG.sounds.enabled)return;
    const mk=s=>{const a=new Audio();a.preload="none";a._p=s;a.addEventListener("error",()=>{a._dead=true},{once:true});return a};
    this.hover=mk(CONFIG.sounds.hover);this.click=mk(CONFIG.sounds.click);this.ok=true;},
  play(a){if(!this.ok||!a||a._dead||!CONFIG.fx.blips||!AudioSys.isOn())return;
    const n=performance.now();if(n-this._l<70)return;this._l=n;
    try{if(!a.src)a.src=a._p;a.currentTime=0;a.volume=CONFIG.sounds.volume;a.play().catch(()=>{})}catch(_){}},
  hoverBlip(){this.play(this.hover)},clickBlip(){this.play(this.click)}};
const AudioDuck={prev:null,
  duck(a){if(this.prev==null)this.prev=AudioSys._vol;AudioSys.setVolume(clamp01(a??.3),false);},
  unduck(){if(this.prev==null)return;const p=this.prev;this.prev=null;AudioSys.setVolume(p,false);}};

/* ═══ VİDEO DOKTORU v2 + entered gate ═══ */
const Media = {
  video:null, wantAudio:false, _wePause:false, _reloaded:false, avVideo:null,
  _wdTO:0, _rvfcOK:false,
  async pickSourceOrder() {
    const v = this.video; if (!v || v.dataset.src) return;
    try {
      if (!navigator.mediaCapabilities || !navigator.mediaCapabilities.decodingInfo) return;
      const r = await navigator.mediaCapabilities.decodingInfo({ type: "file",
        video: { contentType: 'video/webm; codecs="av01.0.08M.08"', width: 1280, height: 720, bitrate: 3e6, framerate: 30 } });
      if (!(r.supported && r.smooth && r.powerEfficient)) {
        const mp4 = [...v.children].find(s => s.type && s.type.includes("mp4"));
        if (mp4 && v.firstElementChild !== mp4) {
          v.insertBefore(mp4, v.firstChild);
          if (v.readyState === 0 && !entered) v.load();
        }
      }
    } catch (_) {}
  },
  init() {
    const v = this.video = $("#bg-video"); if (!v) return;
    v.muted = true;
    v.addEventListener("play", () => { if (!entered) { this._wePause = true; v.pause(); this._wePause = false; } });
    this._rvfcOK = !!v.requestVideoFrameCallback;
    v.addEventListener("pause", () => { if (this.plays() && !this._wePause) setTimeout(() => this.resumeTick(), 120); });
    v.addEventListener("error", () => this.reloadOnce());
    v.addEventListener("waiting", () => { if (this.plays()) this.resumeTick(); });
    v.addEventListener("stalled", () => { if (this.plays()) this.resumeTick(); });
    this.armWatchdog();
    if (this.plays()) this.resumeTick();
    this.pickSourceOrder();
  },
  armWatchdog() {
    const v = this.video; if (!v) return;
    const arm = () => { clearTimeout(this._wdTO);
      this._wdTO = setTimeout(() => { if (this.plays() && (v.paused || v.readyState < 2)) this.resumeTick(); arm(); }, 3000); };
    if (this._rvfcOK) {
      const onFrame = () => { clearTimeout(this._wdTO); arm(); if (this.plays()) { try { v.requestVideoFrameCallback(onFrame); } catch (_) {} } };
      try { v.requestVideoFrameCallback(onFrame); } catch (_) { arm(); }
    } else {
      v.addEventListener("timeupdate", () => { clearTimeout(this._wdTO); arm(); }, { passive: true });
    }
    arm();
  },
  plays() { const w = $("#bg-wrap"); const m = w ? w.dataset.mode : "video"; return m === "video" && !document.hidden && !Perf.low && entered; },
  setAudio(want) { this.wantAudio = !!want; this.sync(); },
  sync() {
    const v = this.video; if (!v) return;
    const waEl = AudioSys._wa ? AudioSys._wa.el : null;
    if (waEl === v) { v.muted = false; }
    else { v.muted = !this.wantAudio; v.volume = AudioSys._vol; }
    if (this.plays()) { if (v.paused) this.resumeTick(); }
    else { this._wePause = true; v.pause(); this._wePause = false; }
  },
  resumeTick() {
    const v = this.video; if (!v || !this.plays()) return;
    v.play().then(() => { this._reloaded = false; }).catch(() => {
      if (v.readyState < 2) this.reloadOnce();
      else setTimeout(() => { if (this.plays()) v.play().catch(() => {}); }, 300);
    });
  },
  reloadOnce() {
    if (this._reloaded) return; this._reloaded = true;
    try { this.video.load(); setTimeout(() => { if (this.plays()) this.video.play().catch(() => {}); }, 300); } catch (_) {}
  },
  pauseAllForHidden() { const v = this.video; if (v) { this._wePause = true; v.pause(); this._wePause = false; } },
  setPreloadAuto() { if (this.video) this.video.preload = "auto"; },
};

/* ═══ PARTİKÜLLER ═══ */
const Dust={cv:null,ctx:null,parts:[],running:false,sprites:null,_gpuArr:null,_curStyle:"",
  init(){this.cv=$("#bg-dust");if(!this.cv)return;
    this.ctx=this.cv.getContext("2d");
    const mk=(c1,c2)=>{const s=document.createElement("canvas");s.width=s.height=32;const g=s.getContext("2d");
      const rg=g.createRadialGradient(16,16,0,16,16,16);rg.addColorStop(0,c1);rg.addColorStop(.35,c2);rg.addColorStop(1,"rgba(0,0,0,0)");
      g.fillStyle=rg;g.fillRect(0,0,32,32);return s;};
    this.sprites={dust:mk("rgba(255,240,200,1)","rgba(230,179,77,.55)"),
      snow:mk("rgba(255,255,255,1)","rgba(220,230,255,.5)"),
      embers:mk("rgba(255,220,170,1)","rgba(255,120,40,.55)"),rain:null};
    this.fit();
    addEventListener("resize",debounce(()=>{this.fit();if(this.running)this.spawn()},150),{passive:true});
    Loop.add((raw)=>this.step(TimeDilation.now(raw)));},
  style(){return CONFIG.bg.particleStyle||"dust"},
  W(){return this.cv.offsetWidth||innerWidth},
  H(){return this.cv.offsetHeight||innerHeight},
  fit(){if(!this.cv)return;const d=Perf.dpr();
    this.cv.width=this.W()*d;this.cv.height=this.H()*d;
    this.ctx.setTransform(d,0,0,d,0,0);
    this._gpuArr=new Float32Array((CONFIG.perf.particleCap||120)*7);},
  spawn(){const st=this.style(),n=Perf.cap(st==="rain"?70:44),W=this.W(),H=this.H();this.parts=[];
    for(let i=0;i<n;i++){
      if(st==="snow")this.parts.push({x:Math.random()*W,y:Math.random()*H,r:2+Math.random()*3.5,vy:.25+Math.random()*.5,amp:6+Math.random()*16,ph:Math.random()*6.28,sp:.15+Math.random()*.3,a:.5+Math.random()*.4});
      else if(st==="rain")this.parts.push({x:Math.random()*W,y:Math.random()*H,r:1.2,vy:5+Math.random()*4,amp:1.5,ph:0,sp:0,a:.25+Math.random()*.3});
      else if(st==="embers")this.parts.push({x:Math.random()*W,y:Math.random()*H,r:1.5+Math.random()*2.5,vy:-(.3+Math.random()*.6),amp:5+Math.random()*14,ph:Math.random()*6.28,sp:.3+Math.random()*.5,a:.4+Math.random()*.5});
      else this.parts.push({x:Math.random()*W,y:Math.random()*H,r:3+Math.random()*7,vy:-(.08+Math.random()*.3),amp:8+Math.random()*22,ph:Math.random()*6.28,sp:.2+Math.random()*.5,a:.25+Math.random()*.5});}},
  start(){if(!this.cv||reducedMotion||Perf.low)return;
    if(this.running&&this._curStyle===this.style())return;
    this.running=true;this._curStyle=this.style();this.spawn();},
  stop(){if(!this.running)return;this.running=false;
    const g=Gfx.dust;if(g)g.clear();else this.ctx.clearRect(0,0,this.W(),this.H());},
  step(t){if(!this.running)return;
    const st=this._curStyle||this.style(),g=Gfx.dust,ar=this._gpuArr,W=this.W(),H=this.H();let n=0;
    if(!g&&this.cv.width<10)this.fit();
    const up=st==="dust"||st==="embers";
    const mv=TimeDilation.scale;
    const gc=st==="snow"?[1,1,1]:st==="embers"?[1,.5,.15]:st==="rain"?[.6,.7,.9]:[.9,.7,.3];
    const ctx=this.ctx;ctx.strokeStyle="rgba(170,190,220,.5)";ctx.lineWidth=1;ctx.lineCap="round";
    let m=0;
    for(let i=0;i<this.parts.length;i++){const p=this.parts[i];
      p.y+=p.vy*mv;if(up?(p.y<-12):(p.y>H+12)){p.y=up?H+12:-12;p.x=Math.random()*W}
      const tw=st==="embers"?(.45+.55*Math.sin(t*.004*p.sp+p.ph)):(.6+.4*Math.sin(t*.0016*p.sp+p.ph));
      const x=p.x+Math.sin(t*.001*p.sp+p.ph)*p.amp;
      if(g){const o=n*7;ar[o]=x;ar[o+1]=p.y;ar[o+2]=p.r;ar[o+3]=p.a*tw;ar[o+4]=gc[0];ar[o+5]=gc[1];ar[o+6]=gc[2];n++;}
      else if(st==="rain"){ctx.globalAlpha=p.a*tw;ctx.beginPath();ctx.moveTo(x,p.y);ctx.lineTo(x-p.amp,p.y-11);ctx.stroke();}
      else{ctx.globalAlpha=p.a*tw;ctx.drawImage(this.sprites[st]||this.sprites.dust,x-p.r/2,p.y-p.r/2,p.r,p.r);}
      this.parts[m++]=p;}
    this.parts.length=m;ctx.globalAlpha=1;
    if(g)g.draw(ar,n,W,H,Perf.dpr());}};
/* ═══ ARKA PLAN ═══ */
const Background={lastBlur:6,_blurVal:null,
  init(){const wrap=$("#bg-wrap"),video=$("#bg-video");if(!wrap||!video)return;
    const srcs=video.querySelectorAll("source");let failed=0;
    const fail=()=>{if(!this.current()&&CONFIG.bg.mode!=="video")return;if(wrap.classList.contains("is-video-ok"))return;wrap.classList.add("is-fallback");console.info("[senki] bg videosu yok — bg.jpg Ken Burns.");};
    video.addEventListener("canplay",()=>{wrap.classList.add("is-video-ok");wrap.classList.remove("is-fallback");if(Media.plays()&&video.paused)Media.resumeTick();});
    srcs.forEach(s=>s.addEventListener("error",()=>{if(++failed>=srcs.length)fail();}));
    video.addEventListener("error",fail);
    setTimeout(()=>{if(document.hidden||!entered)return;if(video.readyState<2&&!wrap.classList.contains("is-video-ok"))fail()},6000);
    Dust.init();this.applyBlur();this.applyMode();},
  current(){const L=CONFIG.bg.list||[];return L.length?L[((CONFIG.bg.index||0)%L.length+L.length)%L.length]:null},
  _writeBlur(val){if(this._blurVal===val)return;this._blurVal=val;root.style.setProperty("--bg-blur",val);},
  applyBlur(){const b=Math.max(0,Math.min(20,CONFIG.bg.blur??6));if(b>0)this.lastBlur=b;this._writeBlur(b+"px");},
  tempBlur(v){if(v==null)this.applyBlur();else this._writeBlur(clamp(v,0,20)+"px");},
  applyMode(){const wrap=$("#bg-wrap"),video=$("#bg-video");if(!wrap)return;
    /* v4.9.1: particles/none modu listeyi EZER (düzeltilmiş) */
    const e=this.current();
    let m=CONFIG.bg.mode;
    if(m!=="particles"&&m!=="none"&&e){
      m=e.type;
      if(m==="video"&&/\.(gif|jpe?g|png|webp)([?#]|$)/i.test(e.src||""))m="image";
    }
    wrap.dataset.mode=m;
    if(m==="image"){
      video.pause();
      wrap.querySelector(".bg-fallback").style.backgroundImage=`url("${(e&&e.src)||"assets/bg.jpg"}")`;
      Dust.stop();
    }
    else if(e&&m==="video"){
      wrap.classList.remove("is-fallback");
      if(e.src&&video.dataset.src!==e.src){video.dataset.src=e.src;video.src=e.src;video.load();}
      Dust.stop();
    }
    else if(m==="particles"){video.pause();Dust.start();}
    else if(m==="video"){wrap.classList.remove("is-fallback");Dust.stop();}
    else{video.pause();Dust.stop();}
    if(Perf.low&&wrap.dataset.mode==="video")wrap.classList.add("is-fallback");
    Media.sync();},
  set(i){const L=CONFIG.bg.list||[];if(!L.length)return;CONFIG.bg.index=((i%L.length)+L.length)%L.length;this.applyMode();},
  next(){this.set((CONFIG.bg.index||0)+1);toast("bg: "+((this.current()||{}).label||""));},
  prev(){this.set((CONFIG.bg.index||0)-1);toast("bg: "+((this.current()||{}).label||""));}};

/* ═══ AVATAR ═══ */
const Avatar={
  handle:null,name:null,
  reg(){return window.SenkiFrames?SenkiFrames.reg:{}},
  staticMode(){return reducedMotion||Perf.low},
  setMedia(src){
    const wrap=$("#av-media");if(!wrap)return;
    wrap.innerHTML=`<div class="avatar-fallback"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M12 3l7.5 4.3v9.4L12 21l-7.5-4.3V7.3z"/><path d="M12 3v9m0 0l7.5-4.7M12 12L4.5 7.3M12 21v-9"/></svg></div>`;
    Media.avVideo=null;
    const dropFallback=()=>{const f=wrap.querySelector(".avatar-fallback");if(f)f.remove();};
    const m=makeMedia(src,{loop:true,autoplay:true,alt:CONFIG.profile.username});
    if(!m)return;
    if(m.kind==="video"){
      m.el.addEventListener("loadeddata",dropFallback);
      m.el.addEventListener("error",()=>{ m.el.remove();
        const jpg=(src||"").replace(/\.(mp4|webm|mov|m4v)([?#]|$)/i,".jpg$2");
        const i=document.createElement("img");i.alt=CONFIG.profile.username;
        i.onload=dropFallback;i.onerror=()=>i.remove();i.src=jpg;wrap.appendChild(i); });
      wrap.appendChild(m.el);Media.avVideo=m.el;m.el.play().catch(()=>{});
    } else {
      m.el.addEventListener("load",dropFallback);
      m.el.addEventListener("error",()=>m.el.remove());
      wrap.appendChild(m.el);
    }
  },
  setFrame(name){
    const slot=$("#av-frame-slot"),front=$("#av-frame-front"),ov=$("#av-frame-overlay");if(!slot)return;
    if(this.handle&&this.handle.destroy){try{this.handle.destroy()}catch(_){}}
    this.handle=null;slot.innerHTML="";if(front)front.innerHTML="";if(ov)ov.innerHTML="";
    this.name=name;
    const def=this.reg()[name];
    $("#avatar-frame").dataset.mode=(name==="none"||!def)?"none":name;
    $("#avatar-frame").dataset.shape=["circle","rounded","square","hex"].includes(CONFIG.profile.avatarShape)?CONFIG.profile.avatarShape:"circle";
    if(!def)return;
    if(def.html)slot.innerHTML=def.html;
    if(def.front&&front)front.innerHTML=def.front;
    if(def.overlay&&ov)ov.innerHTML=def.overlay;
    if(def.init)this.handle=def.init(slot,front,ov,{static:this.staticMode()})||null;
  },
  setAnim(a){$("#avatar-frame").dataset.anim=a||"none"},
  refreshStatic(){
    $("#avatar-frame").classList.toggle("frames-static",this.staticMode());
    if(this.name)this.setFrame(this.name);},
  apply(){this.setMedia(CONFIG.avatar.src);this.setFrame(CONFIG.profile.avatarFrame||"ring");this.setAnim(CONFIG.avatar.anim);this.refreshStatic();},
};

/* ---------- profil parçaları ---------- */
function splitChars(el,text){el.textContent="";[...text].forEach((ch,i)=>{const s=document.createElement("span");s.className="ch";s.style.setProperty("--i",i);s.textContent=ch===" "?"\u00A0":ch;el.appendChild(s)})}
function applyTexts(){$("#username").textContent=CONFIG.profile.username;$("#division").textContent=CONFIG.profile.division;applyMeta()}
function applyBadges(){const b=$("#badges");b.innerHTML="";(CONFIG.profile.badges||[]).forEach(x=>{const s=document.createElement("span");s.className="badge";s.title=x.title||"";s.dataset.anim=x.anim||"none";if(x.color)s.style.color=x.color;
  const k=x.icon||"⭐";
  if(ICONS[k])s.innerHTML=ICONS[k];
  else if(/\.(png|gif|jpe?g|webp|svg)$/i.test(k)){const im=document.createElement("img");im.src=k;im.alt=x.title||"";im.loading="lazy";im.onerror=()=>im.remove();s.appendChild(im)}
  else s.textContent=k;
  b.appendChild(s)})}
let statsVal="",chipsT=null;
function chipText(t){
  if(t==="{time}")return new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"});
  if(t==="{stats}")return statsVal||"—";
  return t;}
function applyChips(){const row=$("#chips");if(!row)return;row.innerHTML="";
  (CONFIG.profile.chips||[]).forEach(c=>{if(!c||(!c.text&&!c.icon))return;
    const s=document.createElement("span");s.className="chip";
    const i=document.createElement("i");i.textContent=c.icon||"";
    const b=document.createElement("b");b.textContent=chipText(c.text||"");
    if(c.text==="{time}")b.dataset.live="time";
    if(c.text==="{stats}")b.dataset.live="stats";
    s.append(i,b);row.appendChild(s);});
  clearInterval(chipsT);
  if(row.querySelector("[data-live]"))chipsT=setInterval(updateChips,30000);}
function updateChips(){const row=$("#chips");if(!row)return;
  row.querySelectorAll("[data-live]").forEach(b=>{b.textContent=chipText(b.dataset.live==="time"?"{time}":"{stats}");});}
function applyCard(){root.style.setProperty("--card-w",(CONFIG.card.width||400)+"px");root.style.setProperty("--card-r",(CONFIG.card.radius??18)+"px");root.style.setProperty("--card-blur",(CONFIG.card.blur??20)+"px");root.style.setProperty("--card-op",clamp01(CONFIG.card.opacity??.58))}

/* ═══ ELEMENT TRANSFORM ═══ */
const EL_TARGETS={card:"#profile-card",avatar:"#avatar-frame",username:"#username",bio:".bio",links:"#tabs-wrap"};
const EL={els:{},last:{},
  grab(){for(const k in EL_TARGETS)this.els[k]=document.querySelector(EL_TARGETS[k])},
  tf(key,i){
    const el=this.els[key]||document.querySelector(EL_TARGETS[key]);if(!el)return;
    this.els[key]=el;
    const p=CONFIG.elements[key]||{};
    const anti=CONFIG.tabs.style==="anti";
    const it=(p.fx&&p.fx.interactive)||"none";
    let px=0,py=0;
    if(!anti&&!Perf.low){
      if(it==="parallax"){px=i.px;py=i.py}
      if(it==="magnetic"){px=el._mgx||0;py=el._mgy||0}
    }
    let tf=`translate(${((p.x||0)+px).toFixed(2)}px,${((p.y||0)+py).toFixed(2)}px) rotate(${p.rot||0}deg) scale(${p.scale??1})`;
    if(key==="card"&&i.tx)tf=`rotateX(${i.tx.toFixed(2)}deg) rotateY(${i.ty.toFixed(2)}deg) `+tf;
    if(this.last[key]!==tf){this.last[key]=tf;el.style.transform=tf;}},
  composeAll(i){for(const k in EL_TARGETS)this.tf(k,i||{px:0,py:0,tx:0,ty:0})},
  resetAll(){this.composeAll({px:0,py:0,tx:0,ty:0})}};
const AMBIENTS=["float","glow","shine","liquid-glass","hue"];
function applyElements(){
  EL.grab();
  const E=CONFIG.elements||{};
  for(const key in EL_TARGETS){
    const el=EL.els[key];if(!el)continue;
    const p=E[key]||{};
    if(key==="card"){root.style.setProperty("--el-card-w",(p.w||400)+"px");root.style.setProperty("--el-card-radius",(p.radius??18)+"px")}
    if(key==="avatar")root.style.setProperty("--av-sz",(p.w||112)+"px");
    if(key==="username")root.style.setProperty("--el-user-size",(p.size||33)+"px");
    if(key==="bio")root.style.setProperty("--el-bio-size",(p.size||14.5)+"px");
    if(key==="links")root.style.setProperty("--el-links-w",(p.w||100)+"%");
    const am=(p.fx&&p.fx.ambient)||"none";
    AMBIENTS.forEach(a=>el.classList.toggle("el-fx-"+a,am===a));
    const it=(p.fx&&p.fx.interactive)||"none";
    el.classList.toggle("el-i-spotlight",it==="spotlight");
    el.classList.toggle("el-anim",it!=="none"&&it!=="spotlight");
    attachInteractive(el,it);
    ensureMedia(el,p.media);
  }
  EL.composeAll({px:0,py:0,tx:0,ty:0});
  if(CONFIG.tabs.style==="anti")EL.resetAll();}
function attachInteractive(el,it){
  if(el._iwired!==it){el._iwired=it;
    if(el._imv){el.removeEventListener("mousemove",el._imv);el._imv=null}
    if(it==="magnetic"&&!isTouch&&!reducedMotion){el._imv=(e)=>{const r=el.getBoundingClientRect();
      el._mgx=Math.max(-5,Math.min(5,(e.clientX-r.left-r.width/2)*.1));
      el._mgy=Math.max(-5,Math.min(5,(e.clientY-r.top-r.height/2)*.1))};
      el.addEventListener("mousemove",el._imv,{passive:true});
      el.addEventListener("mouseleave",()=>{el._mgx=0;el._mgy=0});}
    if(it==="spotlight"){el._imv=(e)=>{const r=el.getBoundingClientRect();
      el.style.setProperty("--spx",((e.clientX-r.left)/r.width*100).toFixed(1)+"%");
      el.style.setProperty("--spy",((e.clientY-r.top)/r.height*100).toFixed(1)+"%")};
      el.addEventListener("mousemove",el._imv,{passive:true});}}}
function ensureMedia(el,m){
  let layer=el.querySelector(":scope > .el-media");
  if(!m||!m.src){if(layer)layer.remove();return}
  if(!layer){layer=document.createElement("div");layer.className="el-media";el.prepend(layer)}
  const isVid=/\.(mp4|webm|mov|m4v)([?#]|$)/i.test(m.src);
  const cur=layer.querySelector(isVid?"video":"img");
  if(!cur||cur.dataset.src!==m.src){layer.innerHTML="";
    const mm=makeMedia(m.src,{loop:true,autoplay:true,preload:"auto"});
    if(mm){mm.el.dataset.src=m.src;layer.appendChild(mm.el);
      if(mm.kind==="video")mm.el.play().catch(()=>{});}}
  layer.style.opacity=m.opacity??.3;layer.style.mixBlendMode=m.blend||"screen";}

/* daktilo */
let twId=0;
function applyBio(){const el=$("#bio-text");twId++;if(!CONFIG.fx.typewriter||reducedMotion){el.textContent=CONFIG.profile.bio;return}if(entered)typewriter(el,CONFIG.profile.bio)}
function typewriter(el,text,speed=28){const id=twId;let i=0;(function tick(){if(id!==twId)return;el.textContent=text.slice(0,++i);
  if(i<text.length){const d=(speed+Math.random()*38)/Math.max(.05,TimeDilation.scale);setTimeout(tick,d);}})()}

/* ═══ SESSIONS ═══ */
const Sessions={
  seq:0,map:new Map(),hist:[],
  revertsFor(action){
    const eff=[],t=action&&action.type,p=action&&action.params||{};
    if(t==="shader"&&p.mode==="toggle")eff.push(()=>ShaderFX.stopFade());
    else if(t==="shader"){}
    else if(t==="menu-open")eff.push(()=>PopupMenu.close());
    else if(t==="blur-set")eff.push(()=>Background.tempBlur(null));
    else if(t==="dock-show")eff.push(()=>Dock.hide());
    else if(t==="audio-duck")eff.push(()=>AudioDuck.unduck());
    else if(t==="spotlight"){const el=document.querySelector(EL_TARGETS[(action.params&&action.params.target)||"card"]);if(el)eff.push(()=>el.classList.remove("el-i-spotlight"));}
    return eff;},
  open(source,action){
    const id="s"+(++this.seq);
    const s={id,source,at:Date.now(),ttl:(action&&action.params&&action.params.maxTtlMs)||0,effects:this.revertsFor(action)};
    this.map.set(id,s);this.render();return id;},
  close(id){const s=this.map.get(id);if(!s)return;this.map.delete(id);
    for(let i=s.effects.length-1;i>=0;i--){try{s.effects[i]()}catch(_){}}
    this.hist.unshift(s.id+" · "+s.source);this.hist=this.hist.slice(0,4);
    this.render();},
  closeSource(source){[...this.map.values()].filter(s=>s.source===source).forEach(s=>this.close(s.id));},
  tick(){const now=Date.now();for(const s of [...this.map.values()])if(s.ttl&&now-s.at>s.ttl)this.close(s.id);},
  render(){
    const d=$("#dbg");if(!d||!CONFIG.debug.triggers)return;d.hidden=false;
    let el=d.querySelector("#dbg-sess");
    if(!el){el=document.createElement("div");el.id="dbg-sess";d.prepend(el);}
    const act=[...this.map.values()].map(s=>`${s.id} · ${s.source} · aktif`).join("<br>");
    const rev=this.hist.map(h=>h+" · reverted").join("<br>");
    el.innerHTML="OTURUMLAR:<br>"+(act||"—")+(rev?"<br><span style='opacity:.55'>"+rev+"</span>":"");}
};

/* ═══ MENÜLER v2 ═══ */
const PopupMenu={
  el:null,autoT:null,graceT:null,closeT:null,stack:[],lastX:0,lastY:0,
  ensure(){
    if(this.el)return;
    this.el=document.createElement("div");this.el.id="popup-menu";this.el.className="popup-menu";
    this.el.hidden=true;document.body.appendChild(this.el);
    PointerBus.on((e)=>{this.lastX=e.clientX;this.lastY=e.clientY;});
    document.addEventListener("pointerdown",(e)=>{if(this.el&&!this.el.hidden&&!this.el.contains(e.target))this.close();});
    document.addEventListener("keydown",(e)=>{if(e.key==="Escape")this.close();});
    document.addEventListener("contextmenu",(e)=>{
      const cm=CONFIG.contextMenu;
      if(!cm||!cm.enabled)return;
      if(e.target.closest(".ed-drawer,.ed-badge,.ed2"))return;
      e.preventDefault();
      this.lastX=e.clientX;this.lastY=e.clientY;
      clearTimeout(this.graceT);this.open({menu:cm.menu||"main",at:"pointer"});});},
  getMenu(id){return (CONFIG.menus||[]).find(m=>m.id===id)},
  open(p){
    this.ensure();p=p||{};
    let items=p.items,title=p.title;
    if(!items&&p.menu){const m=this.getMenu(p.menu);if(m){items=m.items;title=title||m.title;}}
    if(!items&&p.source==="links")items=CONFIG.links;
    if(!items||!items.length){toast("Menü boş","err");return;}
    this.stack=[];this.paint(items,title);
    clearTimeout(this.closeT);
    this.el.hidden=false;requestAnimationFrame(()=>this.el.classList.add("open"));
    this.place(p.at);
    clearTimeout(this.autoT);this.autoT=setTimeout(()=>this.close(),10000);},
  paint(items,title){
    const el=this.el;el.innerHTML="";
    if(this.stack.length){
      const back=document.createElement("button");back.className="pm-back";back.innerHTML="‹ Geri";
      back.addEventListener("click",()=>{const prev=this.stack.pop();this.paint(prev.items,prev.title);});
      el.appendChild(back);}
    if(title){const t=document.createElement("div");t.className="pm-title";t.textContent=title;el.appendChild(t);}
    const body=document.createElement("div");body.className="pm-body";el.appendChild(body);
    items.forEach((it,i)=>{
      if(it&&it.type==="menu"){
        const sub=this.getMenu(it.menuId);
        const b=document.createElement("button");b.className="link-btn";b.type="button";
        b.setAttribute("aria-label",(it.label||"alt menü")+" — aç");
        const ic=document.createElement("span");ic.className="btn-icon";
        if(ICONS[it.icon||""])ic.innerHTML=ICONS[it.icon||""];else{const em=document.createElement("span");em.className="emoji";em.textContent=it.icon||"📂";ic.appendChild(em)}
        const lb=document.createElement("span");lb.className="btn-label";splitChars(lb,it.label||"Menü");
        const ar=document.createElement("span");ar.className="btn-arrow";ar.innerHTML=ICONS.chev;
        b.append(ic,lb,ar);
        b.addEventListener("mouseenter",()=>Sfx.hoverBlip());
        b.addEventListener("click",(e)=>{spawnRipple(e,b);Sfx.clickBlip();
          if(sub){this.stack.push({items,title});this.paint(sub.items,sub.title);this.place();}
          else toast("Alt menü bulunamadı: "+(it.menuId||"?"),"err");});
        body.appendChild(b);
      } else body.appendChild(makeButton(it,i));});},
  place(at){
    const el=this.el;el.style.left="0px";el.style.top="0px";
    const r=el.getBoundingClientRect();
    let x,y;
    if(at==="center"){x=(innerWidth-r.width)/2;y=(innerHeight-r.height)/2;}
    else{x=this.lastX+14;y=this.lastY+14;}
    el.style.left=clamp(x,8,innerWidth-r.width-8)+"px";
    el.style.top=clamp(y,8,innerHeight-r.height-8)+"px";},
  close(){
    if(!this.el||this.el.hidden)return;
    clearTimeout(this.autoT);clearTimeout(this.graceT);
    this.el.classList.remove("open");
    this.closeT=setTimeout(()=>{if(this.el&&!this.el.classList.contains("open"))this.el.hidden=true;},230);},
  closeGrace(){
    if(!this.el||this.el.hidden)return;
    clearTimeout(this.graceT);
    this.graceT=setTimeout(()=>this.close(),400);},
  toggle(p){if(this.el&&!this.el.hidden)this.close();else{clearTimeout(this.graceT);this.open(p);}}
};

/* ═══ AKSİYONLAR ═══ */
const ACTIONS={
  "link":(p)=>{if(p&&p.url)open(p.url,"_blank","noopener")},
  "copy":(p)=>copyToClipboard(p.text||"",p.label||"Değer"),
  "toast":(p)=>toast(p.text||"…",p.type==="err"?"err":"ok"),
  "quote":()=>{const q=CONFIG.quotes||[];if(q.length)toast(q[(Math.random()*q.length)|0])},
  "shader":(p)=>{
    p=p||{};const mode=p.mode||"oneshot";const name=p.name||"explosion";
    if(name==="timestop"){
      TimeDilation.timestop(p.duration??6);
      Sessions.open("sfx:timestop",{type:"shader",params:{maxTtlMs:clamp(p.duration??6,1.2,12)*1000,mode:"oneshot"}});
      return;}
    if(mode==="switch"){
      if(ShaderFX.active&&ShaderFX.active.name===name){ShaderFX.stop();return;}
      ShaderFX.play(Object.assign({},p,{mode:"switch"}));
      return;}
    ShaderFX.play(p).then((rfx)=>{
      if (rfx === false && !reducedMotion && !Perf.low && !document.hidden)
        toast("Shader oynatılamadı — konsol loguna bak", "err");
    }).catch(()=>{});
    if(mode==="toggle")
      Sessions.open("sfx:"+name,{type:"shader",params:{mode:"toggle",maxTtlMs:p.maxTtlMs||60000}});
    else
      Sessions.open("sfx:"+name,{type:"shader",params:{mode:"oneshot",maxTtlMs:clamp(p.duration??3,.5,10)*1000}});},
  "toggle-blur":()=>{CONFIG.bg.blur=(CONFIG.bg.blur>0)?0:(Background.lastBlur||6);Background.applyBlur()},
  "blur-set":(p)=>{if(p&&p.restore)Background.tempBlur(null);else Background.tempBlur(p&&p.value!=null?p.value:0)},
  "bg-next":()=>Background.next(),"bg-prev":()=>Background.prev(),
  "theme-random":()=>{CONFIG.theme.accent=hslToHex((Math.random()*360)|0,62,58);applyTheme()},
  "frame-next":()=>{const F=window.SenkiFrames?SenkiFrames.list():["ring"];const i=F.indexOf(CONFIG.profile.avatarFrame);CONFIG.profile.avatarFrame=F[(i+1)%F.length]||"ring";Avatar.setFrame(CONFIG.profile.avatarFrame)},
  "sound-toggle":()=>AudioSys.toggle(),
  "audio-duck":(p)=>AudioDuck.duck(p&&p.amount),
  "tab-goto":(p)=>Tabs.goto(parseInt(p.index,10)||0),
  "dock-show":()=>Dock.show(true),"dock-hide":()=>Dock.hide(),
  "menu-open":(p)=>{clearTimeout(PopupMenu.graceT);PopupMenu.open(p);},
  "menu-close":()=>PopupMenu.closeGrace(),
  "menu-toggle":(p)=>PopupMenu.toggle(p),
  "spotlight":(p)=>{const el=document.querySelector(EL_TARGETS[(p&&p.target)||"card"]);if(el)el.classList.add("el-i-spotlight")},
  "fullscreen":()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{})},
  "sparks-storm":()=>Sparks.storm(),
  "copy-domain":()=>copyToClipboard(location.hostname||"localhost","Alan adı"),
  "scroll-top":()=>scrollTo({top:0,behavior:"smooth"}),
};
function runAction(a){if(a&&ACTIONS[a.type]){try{ACTIONS[a.type](a.params||{})}catch(e){console.error("[senki] aksiyon:",a.type,e)}}}

/* ═══ BUTONLAR ═══ */
function attachMagnetic(btn){if(reducedMotion||isTouch)return;
  btn.addEventListener("mousemove",(e)=>{const r=btn.getBoundingClientRect();
    const mx=Math.max(-6,Math.min(6,(e.clientX-r.left-r.width/2)*.12)),my=Math.max(-6,Math.min(6,(e.clientY-r.top-r.height/2)*.12));
    btn.style.transform=`translate(${mx.toFixed(1)}px,${my.toFixed(1)}px)`},{passive:true});
  btn.addEventListener("mouseleave",()=>btn.style.transform="");}
function attachBtnFx(btn,fx){
  if(!fx)return;
  const h=(fx.hover||{}).type,c=(fx.click||{}).type;
  ["glow","scan","shake"].forEach(t=>btn.classList.toggle("bfx-"+t,h===t));
  let hm=null;
  if((h==="mp4"||h==="gif")&&fx.hover.src){
    hm=makeMedia(fx.hover.src,{loop:true,autoplay:false,preload:"none"});
    if(hm){
      hm.el.classList.add("bfx-vid");
      const isVid=hm.kind==="video";
      if(!isVid){hm.el.style.display="none";hm.el.style.objectFit="cover";}
      btn.prepend(hm.el);
      hm.el.addEventListener("loadedmetadata",()=>{
        if(isVid&&hm.hasAudio&&AudioSys.isOn()&&btn.matches(":hover")){
          hm.el.muted=false;hm.el.volume=Math.min(CONFIG.sounds.volume,1);}});
      btn.addEventListener("mouseenter",()=>{
        if(isVid){
          if(!hm.el.src)hm.el.src=fx.hover.src;
          const want=hm.hasAudio&&AudioSys.isOn();
          hm.el.muted=!want;
          if(want)hm.el.volume=Math.min(CONFIG.sounds.volume,1);
          hm.el.play().catch(()=>{});
        } else hm.el.style.display="";});
      btn.addEventListener("mouseleave",()=>{
        if(isVid){hm.el.muted=true;hm.el.pause();try{hm.el.currentTime=0}catch(_){}}
        else hm.el.style.display="none";});
    }
  }
  btn.addEventListener("click",()=>{
    if(c==="burst"){const r=btn.getBoundingClientRect();Sparks.burst(r.left+r.width/2,r.top+r.height/2,16)}
    else if((c==="mp4"||c==="gif")&&fx.click.src){
      const m=makeMedia(fx.click.src,{loop:false,autoplay:false,preload:"none"});
      if(m){m.el.classList.add("bfx-vid");btn.prepend(m.el);
        if(m.kind==="video"){m.el.muted=true;m.el.src=fx.click.src;
          m.el.addEventListener("ended",()=>m.el.remove(),{once:true});m.el.play().catch(()=>m.el.remove());}
        else setTimeout(()=>m.el.remove(),900);}}
    else if(c&&c!=="none"){btn.classList.add("bfx-click-flash");setTimeout(()=>btn.classList.remove("bfx-click-flash"),480)}});}
function makeButton(entry,i){
  let act=entry.action||null;
  if(typeof act==="string")act={type:act};
  if(!act&&entry.url)act={type:"link",params:{url:entry.url}};
  if(!act&&entry.copy)act={type:"copy",params:{text:entry.copy,label:entry.label}};
  if(!act&&entry.text&&entry.type==="copy")act={type:"copy",params:{text:entry.text,label:entry.label}};
  const isLink=act&&act.type==="link"&&act.params&&act.params.url;
  const btn=document.createElement(isLink?"a":"button");
  btn.className="link-btn";btn.style.setProperty("--d",(i*70)+"ms");
  if(isLink){btn.href=act.params.url;btn.target="_blank";btn.rel="noopener noreferrer"}
  else{btn.type="button";btn.setAttribute("aria-label",`${entry.label||"buton"} — ${act?act.type:"?"}`)}
  const ic=document.createElement("span");ic.className="btn-icon";
  const k=entry.icon||entry.type;
  if(ICONS[k])ic.innerHTML=ICONS[k];else{const em=document.createElement("span");em.className="emoji";em.textContent=k||"•";ic.appendChild(em)}
  const lb=document.createElement("span");lb.className="btn-label";splitChars(lb,entry.label||"Link");
  const ar=document.createElement("span");ar.className="btn-arrow";ar.innerHTML=isLink?ICONS.chev:ICONS.link;
  btn.append(ic,lb,ar);
  btn.addEventListener("mouseenter",()=>Sfx.hoverBlip());
  btn.addEventListener("click",(e)=>{spawnRipple(e,btn);Sfx.clickBlip();if(act)runAction(act)});
  attachMagnetic(btn);attachBtnFx(btn,entry.fx);
  return btn;}
function renderLinksInto(panel,list){panel.innerHTML="";(list||[]).forEach((l,i)=>panel.appendChild(makeButton(l,i)))}
function copyToClipboard(text,label){const legacy=()=>new Promise((res,rej)=>{const t=document.createElement("textarea");t.value=text;t.style.cssText="position:fixed;opacity:0";document.body.appendChild(t);t.select();try{document.execCommand("copy")?res():rej()}catch(_){rej()}finally{t.remove()}});const j=(navigator.clipboard&&isSecureContext)?navigator.clipboard.writeText(text):legacy();j.then(()=>toast(`${label} panoya kopyalandı!`)).catch(()=>toast(`${label} kopyalanamadı: ${text}`,"err"))}
function spawnRipple(e,btn){const r=btn.getBoundingClientRect(),d=Math.max(r.width,r.height)*1.15;const s=document.createElement("span");s.className="ripple";s.style.width=s.style.height=d+"px";s.style.left=(e.clientX-r.left-d/2)+"px";s.style.top=(e.clientY-r.top-d/2)+"px";btn.appendChild(s);s.addEventListener("animationend",()=>s.remove(),{once:true})}

/* ═══ SEKMELER ═══ */
const Tabs={active:0,collapsed:false,_warned:false,
  tabsList(){return Array.isArray(CONFIG.tabs)?CONFIG.tabs:((CONFIG.tabs&&CONFIG.tabs.list)||[])},
  styleClass(){return{animated:"tabs-anim",plain:"tabs-plain",collapsible:"tabs-collapse",parallax:"tabs-parallax",anti:"tabs-anti"}[CONFIG.tabs.style||"animated"]||"tabs-anim"},
  render(){const bar=$("#tabs-bar"),body=$("#tab-body");if(!bar||!body)return;
    const tabs=this.tabsList();if(!tabs.length)tabs.push({label:"Bağlantılar",type:"links"});
    if(this.active>=tabs.length)this.active=0;
    const tw=$("#tabs-wrap");
    tw.classList.remove("tabs-anim","tabs-plain","tabs-collapse","tabs-parallax","tabs-anti");
    tw.classList.add(this.styleClass());
    tw.classList.toggle("is-collapsed",this.collapsed&&CONFIG.tabs.style==="collapsible");
    bar.innerHTML="";body.innerHTML="";bar.hidden=tabs.length<=1;
    tabs.forEach((t,i)=>{
      if(tabs.length>1){const b=document.createElement("button");b.className="tab-btn"+((i===this.active&&!this.collapsed)?" active":"");b.textContent=t.label||("Sekme "+(i+1));
        b.addEventListener("click",()=>{Sfx.clickBlip();
          if(CONFIG.tabs.style==="collapsible"&&i===Tabs.active){Tabs.collapsed=!Tabs.collapsed;Tabs.render();return}
          Tabs.goto(i)});bar.appendChild(b)}
      const p=document.createElement("div");p.className="tab-panel"+((i===this.active&&!this.collapsed)?" active":"");this.renderPanel(p,t);body.appendChild(p);});
    if(window.EDIT_MODE&&!this._warned){const n=body.querySelectorAll(".link-btn").length;
      if(n>8){this._warned=true;toast("⚠ karar felci: 6-8 link ideal (şu an "+n+")");}}
    Fit.compute(true);},
  renderPanel(panel,t){
    if(t.type==="links"){const n=document.createElement("nav");n.className="links";renderLinksInto(n,t.links&&t.links.length?t.links:CONFIG.links);panel.appendChild(n)}
    else if(t.type==="games"){const g=document.createElement("div");g.className="games";(t.games||[]).forEach(x=>{const c=document.createElement("div");c.className="game";const em=document.createElement("span");em.className="g-emoji";em.textContent=x.emoji||"🎮";const nm=document.createElement("b");nm.textContent=x.name||"?";const nt=document.createElement("i");nt.textContent=x.note||"";c.append(em,nm);if(x.note)c.appendChild(nt);g.appendChild(c)});panel.appendChild(g)}
    else if(t.type==="gallery"){const g=document.createElement("div");g.className="gallery";(t.items||[]).forEach(src=>{const i=document.createElement("img");i.loading="lazy";i.alt="galeri";i.onerror=()=>i.remove();i.src=src;g.appendChild(i)});panel.appendChild(g)}
    else if(t.type==="tracks"){const g=document.createElement("div");g.className="tracks";(t.tracks||[]).forEach(x=>{const c=document.createElement("div");c.className="track";
        const em=document.createElement("span");em.className="t-emoji";em.textContent=x.emoji||"🎵";
        const tx=document.createElement("span");
        const b=document.createElement("b");b.textContent=x.track||"?";
        const i=document.createElement("i");i.textContent=x.artist?" — "+x.artist:"";
        tx.append(b,i);c.append(em,tx);g.appendChild(c)});panel.appendChild(g)}
    else{const d=document.createElement("div");d.className="tab-text";d.textContent=t.text||"";panel.appendChild(d)}},
  goto(i){const t=this.tabsList();if(i<0||i>=t.length||i===this.active)return;this.active=i;this.collapsed=false;this.render()}};
function rebuildLinks(){Tabs.render()}

/* ═══ DOCK ═══ */
const Dock={byZone:false,
  build(){const inn=$("#dock-inner");if(!inn)return;inn.innerHTML="";
    ((CONFIG.dock&&CONFIG.dock.buttons)||[]).forEach(b=>{const btn=document.createElement("button");btn.className="dock-btn";
      if(ICONS[b.icon]){btn.innerHTML=ICONS[b.icon];const s=document.createElement("span");s.textContent=b.label||"";btn.appendChild(s)}else btn.textContent=b.icon||b.label||"•";
      btn.addEventListener("click",()=>{Sfx.clickBlip();runAction(b.action||{})});inn.appendChild(btn)})},
  show(byZone){this.byZone=!!byZone;$("#dock").classList.add("show")},
  hide(){this.byZone=false;$("#dock").classList.remove("show")}};

/* ═══ TETİKLER (hayalet temizlenmiş) ═══ */
const Triggers={
  lastAct:0,_hiddenAt:0,
  log(ev,extra){ if(!CONFIG.debug.triggers)return;
    const line=`${ev}${extra?" · "+extra:""} @ ${new Date().toLocaleTimeString("tr-TR")}`;
    console.info("[trigger]",line);
    const d=$("#dbg");if(d){d.hidden=false;
      const r=document.createElement("div");r.textContent=line;d.appendChild(r);
      while(d.children.length>7)d.lastChild.remove();}},
  fire(ev,extra){this.log(ev,extra);(CONFIG.triggers||[]).filter(t=>t.event===ev).forEach(t=>{
    if(t.action){if(t.autoRevert!==false)Sessions.open("trig:"+ev,t.action);runAction(t.action);}})},
  pokeIdle(){this.lastAct=Date.now();for(const k in this)if(k.startsWith("_if_"))this[k]=false},
  init(){
    const T=CONFIG.triggers||[];if(!T.length)return;
    addEventListener("keydown",()=>this.pokeIdle());
    addEventListener("wheel",()=>this.pokeIdle(),{passive:true});
    PointerBus.on(()=>this.pokeIdle());
    const idles=T.filter(t=>t.event&&t.event.startsWith("idle-"));
    if(idles.length){this.lastAct=Date.now();
      setInterval(()=>{if(document.hidden)return;const now=Date.now();
        idles.forEach(t=>{const n=parseInt(t.event.split("-")[1],10)||30;const k="_if_"+n;
          if(!this[k]&&now-this.lastAct>=n*1000){this[k]=true;this.fire(t.event)}})},1000);}
    if(T.some(t=>t.event==="night")){const h=new Date().getHours();
      if(h>=23||h<6)setTimeout(()=>{
        this.fire("night","lokal saat "+h);
        runAction({type:"shader",params:{name:"aurora",duration:6,intensity:.7,at:"center",mode:"oneshot"}});},2600);}
    if(T.some(t=>t.event==="first-visit")&&store.get("senki:visited","0")!=="1"){store.set("senki:visited","1");setTimeout(()=>this.fire("first-visit"),2400);}
    document.addEventListener("visibilitychange",()=>{if(document.hidden)this._hiddenAt=Date.now();
      else if(this._hiddenAt&&Date.now()-this._hiddenAt>3000){this._hiddenAt=0;this.fire("tab-return")}});
    console.info("[senki] tetikler:",T.map(t=>t.event).join(", ")||"boş");}};

/* ═══ ZONE SESLERİ ═══ */
const ZoneSounds={
  playing:new Map(),fired:null,
  fire(z,idx){
    const s=z.sound;if(!s||!(s.files||[]).length)return;
    const key=idx+":snd",now=performance.now(),cd=z.cooldownMs||250;
    if(!this.fired)this.fired=new Map();
    if(this.fired.get(key)&&now-this.fired.get(key)<cd&&s.mode!=="loop")return;
    this.fired.set(key,now);
    this.stop(idx);
    let file=s.files[0];
    if(s.files.length>1)file=s.files[(Math.random()*s.files.length)|0];
    const a=new Audio();a.preload="none";a.loop=(s.mode==="loop");
    a.volume=clamp01(s.volume??.5);
    a.addEventListener("error",()=>{a._dead=true;this.playing.delete(idx);},{once:true});
    a.src=file;
    this.playing.set(idx,a);
    a.play().catch(()=>{this.playing.delete(idx);});},
  stop(idx){const a=this.playing.get(idx);
    if(a){try{a.pause();a.currentTime=0;}catch(_){}
      this.playing.delete(idx);}},
  stopAll(){[...this.playing.keys()].forEach(i=>this.stop(i));},
};

/* ═══ BÖLGELER ═══ */
const Zones={
  inside:new Map(),fired:new Map(),_last:0,
  init(){PointerBus.on((e)=>{
      const now=performance.now();if(now-this._last<50)return;this._last=now;
      this.check(e.clientX,e.clientY);});
    document.documentElement.addEventListener("mouseleave",()=>{
      for(const k of [...this.inside.keys()])this.inside.set(k,false);
      [...(CONFIG.zones||[]).keys()].forEach(i=>Sessions.closeSource("zone:"+i));});
    this.renderOverlay();},
  check(x,y){(CONFIG.zones||[]).forEach((z,idx)=>{
    const r={x:z.x/100*innerWidth,y:z.y/100*innerHeight,w:z.w/100*innerWidth,h:z.h/100*innerHeight};
    const hit=x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
    const was=this.inside.get(idx);this.inside.set(idx,hit);
    if(was===undefined||was===hit)return;
    const ev=hit?"enter":"leave";
    if(z.hoverUnblur){
      if(ev==="enter"){Background.tempBlur(0);Sessions.open("zone:ub"+idx,{type:"blur-set",params:{value:0}});}
      else Sessions.closeSource("zone:ub"+idx);}
    if(ev==="enter"){
      if(z.event!=="enter")return;
      const key=idx+":enter",t=performance.now(),cd=z.cooldownMs||0;
      if(this.fired.get(key)&&t-this.fired.get(key)<cd)return;
      this.fired.set(key,t);
      Triggers.log("zone:"+(z.id||("zone"+idx))+":enter",`${Math.round(x)},${Math.round(y)}`);
      ZoneSounds.fire(z,idx);
      if(z.action){if(z.autoRevert!==false)Sessions.open("zone:"+idx,z.action);runAction(z.action);}
    } else {
      Triggers.log("zone:"+(z.id||("zone"+idx))+":leave",`${Math.round(x)},${Math.round(y)}`);
      ZoneSounds.stop(idx);
      Sessions.closeSource("zone:"+idx);
      if(z.leaveAction)runAction(z.leaveAction);}});},
  renderOverlay(){const o=$("#zones-debug");if(!o)return;
    const show=window.EDIT_MODE&&CONFIG.debug.zones;
    o.hidden=!show;if(!show){o.innerHTML="";return}
    o.innerHTML="";(CONFIG.zones||[]).forEach(z=>{const d=document.createElement("div");d.className="zbox";
      d.style.left=z.x+"%";d.style.top=z.y+"%";d.style.width=z.w+"%";d.style.height=z.h+"%";
      const sfx=z.sound?` · ${z.sound.mode}`:"";
      d.innerHTML=`<b>${escapeHtml(z.id||"?")} · ${z.event}${z.hoverUnblur?" · unblur":""}${sfx}</b>`;o.appendChild(d)});}};

/* ═══ LANYARD + selam + imleç + sayaç ═══ */
const Lanyard={timer:null,
  start(){const L=CONFIG.lanyard||{},el=$("#lanyard");
    if(!L.enabled||!L.discordId||!el){this.disable();return}
    this.poll();clearInterval(this.timer);this.timer=setInterval(()=>this.poll(),60000);},
  disable(){const el=$("#lanyard");clearInterval(this.timer);
    if(el){el.hidden=true;const d=$("#lan-dot");if(d)d.style.background="#747f8d";const s=$("#lan-status");if(s)s.textContent="";const sp=$("#lan-spotify");if(sp)sp.hidden=true;}},
  async poll(){const L=CONFIG.lanyard,el=$("#lanyard");if(!el)return;
    try{const c=new AbortController();const to=setTimeout(()=>c.abort(),8000);
      const r=await fetch(`https://api.lanyard.rest/v1/${encodeURIComponent(L.discordId)}`,{signal:c.signal});clearTimeout(to);
      if(!r.ok)throw 0;const j=await r.json();if(!j.success)throw 0;const d=j.data;
      const C={online:"#43b581",idle:"#faa81a",dnd:"#ed4245",offline:"#747f8d"},N={online:"çevrimiçi",idle:"boşta",dnd:"rahatsız etmeyin",offline:"çevrimdışı"};
      $("#lan-dot").style.background=C[d.discord_status]||"#747f8d";
      $("#lan-status").textContent=N[d.discord_status]||d.discord_status;
      const sp=$("#lan-spotify");
      if(L.showSpotify&&d.spotify&&d.spotify.track_id){sp.hidden=false;
        sp.innerHTML=`<span class="eqm"><i></i><i></i><i></i></span><span class="sp-note">♪</span><span></span>`;
        sp.lastChild.textContent=`${d.spotify.song} — ${d.spotify.artist}`;}
      else sp.hidden=true;
      el.hidden=false;
    }catch(_){this.disable();}}};
function fireGreeting(){const G=CONFIG.greeting||{};if(!G.enabled)return;
  const now=new Date(),h=now.getHours();
  const selam=h>=5&&h<11?"Günaydın":h<18?"İyi günler":h<22?"İyi akşamlar":"İyi geceler";
  const saat=now.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"});
  toast((G.template||"{selam} — İmparatorluk saati {saat}").replace("{selam}",selam).replace("{saat}",saat));}
function applyCursor(){const src=CONFIG.cursor&&CONFIG.cursor.image;
  document.body.classList.remove("img-cursor");document.body.style.cursor="";
  if(!src||isTouch)return;
  const im=new Image();im.onload=()=>{document.body.classList.add("img-cursor");document.body.style.cursor=`url("${src}") 4 4, auto`};im.src=src;}
function applyStats(){const el=$("#stats-line");const u=CONFIG.stats&&CONFIG.stats.url;
  if(!u){el.hidden=true;statsVal="";updateChips();return}
  fetch(u).then(r=>r.text()).then(t=>{let n=t.trim();try{const j=JSON.parse(t);n=j.views??j.count??j.hits??n}catch(_){}
    statsVal=n;el.textContent="◉ "+n;el.hidden=false;updateChips();}).catch(()=>{el.hidden=true;statsVal="";});}

/* ═══ KISAYOLLAR ═══ */
const Shortcuts={
  init(){addEventListener("keydown",(e)=>{
    if(!CONFIG.fx||!CONFIG.fx.shortcuts)return;
    const t=e.target;
    if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT"||t.isContentEditable))return;
    const k=e.key.toLowerCase();
    if(k==="m")AudioSys.toggle();
    else if(k==="f")runAction({type:"frame-next"});
    else if(k==="b")runAction({type:"toggle-blur"});
    else if(k==="t")runAction({type:"shader",params:{name:"timestop",duration:6,at:"center"}});
    else if(k==="h")toast("Kısayollar: M ses · F çerçeve · B blur · T zaman durdur · H yardım");});}};

/* ═══ FX ═══ */
const FX={tiltOn:false,
  init(){if(reducedMotion||isTouch)return;
    const bg=$("#bg-layer"),card=$("#profile-card"),dot=$("#cursor-dot"),ring=$("#cursor-ring");
    if(!bg||!card||!dot||!ring)return;
    const st={tx:0,ty:0,px:0,py:0,mx:innerWidth/2,my:innerHeight/2,rx:innerWidth/2,ry:innerHeight/2};
    PointerBus.on((e)=>{st.tx=e.clientX/innerWidth*2-1;st.ty=e.clientY/innerHeight*2-1;st.mx=e.clientX;st.my=e.clientY;
      dot.style.transform=`translate3d(${e.clientX}px,${e.clientY}px,0) translate(-50%,-50%)`;
      if(CONFIG.tabs.style==="parallax"){const tb=$("#tabs-wrap");tb.style.setProperty("--tpx",(st.tx*8).toFixed(1)+"px");tb.style.setProperty("--tpy",(st.ty*5).toFixed(1)+"px")}});
    document.addEventListener("mouseover",(e)=>{ring.classList.toggle("is-active",!!e.target.closest("a,button,input,.tab-btn"));
      document.body.classList.toggle("on-editor",!!e.target.closest(".ed-drawer,.ed-badge,.ed2"))});
    card.addEventListener("animationend",(e)=>{if(e.animationName==="card-in"){card.classList.add("is-ready");this.tiltOn=true}},{once:true});
    Loop.add(()=>{
      if(CONFIG.fx.parallax&&!Perf.low){st.px+=(st.tx-st.px)*.05;st.py+=(st.ty-st.py)*.05;
        bg.style.transform=`translate3d(${(st.px*10).toFixed(2)}px,${(st.py*10).toFixed(2)}px,0) scale(1.12)`}
      const anti=CONFIG.tabs.style==="anti";
      const ci=(CONFIG.elements.card.fx&&CONFIG.elements.card.fx.interactive)||"none";
      const tiltOn=CONFIG.fx.tilt&&!Perf.low&&this.tiltOn&&!anti&&(ci==="none"||ci==="tilt");
      const tx=tiltOn?(-st.py*6):0,ty=tiltOn?(st.tx*6):0;
      for(const k in EL_TARGETS){
        const it=(CONFIG.elements[k]&&CONFIG.elements[k].fx&&CONFIG.elements[k].fx.interactive)||"none";
        let px=0,py=0;
        if(!anti&&!Perf.low&&it==="parallax"){px=st.tx*6;py=st.ty*6}
        EL.tf(k,{px,py,tx,ty});}
      if(CONFIG.fx.cursor){st.rx+=(st.mx-st.rx)*.18;st.ry+=(st.my-st.ry)*.18;
        ring.style.transform=`translate3d(${st.rx.toFixed(1)}px,${st.ry.toFixed(1)}px,0) translate(-50%,-50%)`}});}};
function applyFx(){document.body.classList.toggle("fx-no-cursor",!CONFIG.fx.cursor);
  const bg=$("#bg-layer");if(bg&&!CONFIG.fx.parallax)bg.style.transform="scale(1.12)";
  if(CONFIG.tabs.style==="anti")EL.resetAll();}

/* ═══ KIVILCIM ═══ */
const Sparks={cv:null,ctx:null,parts:[],_last:0,
  colors:["#f6d68b","#e6b34d","#c98f2e","#fff3d6"],
  init(){if(reducedMotion)return;
    this.cv=$("#sparks");if(!this.cv)return;
    this.ctx=this.cv.getContext("2d");
    this.fit();
    addEventListener("resize",debounce(()=>this.fit(),150),{passive:true});
    addEventListener("pointerdown",(e)=>this.burst(e.clientX,e.clientY,14),{passive:true});
    Loop.add(()=>this.step());},
  fit(){if(!this.cv)return;const d=Perf.dpr();
    this.cv.width=innerWidth*d;this.cv.height=innerHeight*d;
    this.cv.style.width=innerWidth+"px";this.cv.style.height=innerHeight+"px";
    this.ctx.setTransform(d,0,0,d,0,0);},
  burst(x,y,n=14){if(!CONFIG.fx.sparks||reducedMotion||!this.ctx)return;
    const now=performance.now();if(now-this._last<70)return;this._last=now;
    n=Perf.cap(n);
    for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=2+Math.random()*4.2;
      this.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.2,life:1,decay:.016+Math.random()*.02,w:1+Math.random()*1.2,c:this.colors[(Math.random()*this.colors.length)|0]});}
    while(this.parts.length>(CONFIG.perf.particleCap||120))this.parts.shift();},
  storm(){this._last=0;
    for(let i=0;i<8;i++)this.burst(innerWidth*(.15+Math.random()*.7),innerHeight*(.15+Math.random()*.7),22);},
  step(){if(!this.parts.length)return;
    const ctx=this.ctx,sc=TimeDilation.scale;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    let m=0;
    for(let i=0;i<this.parts.length;i++){const p=this.parts[i];
      p.vy+=.12*sc;p.vx*=.96;p.vy*=.96;p.x+=p.vx*sc;p.y+=p.vy*sc;p.life-=p.decay*sc;
      if(p.life<=0)continue;
      ctx.globalAlpha=Math.max(0,p.life);
      ctx.strokeStyle=p.c;ctx.lineWidth=p.w;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*2.4,p.y-p.vy*2.4);ctx.stroke();
      this.parts[m++]=p;}
    this.parts.length=m;ctx.globalAlpha=1;
    if(!this.parts.length)ctx.clearRect(0,0,innerWidth,innerHeight);}};

/* ═══ KONAMI ═══ */
const Konami={seq:["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"],buf:[],
  init(){document.addEventListener("keydown",(e)=>{this.buf.push(e.key.toLowerCase());this.buf=this.buf.slice(-10);
    if(this.buf.join(",")===this.seq.join(","))this.fire()})},
  fire(){toast("Varlık X domuzlara yem edildi.");
    document.body.classList.add("quake");setTimeout(()=>document.body.classList.remove("quake"),620);
    Sparks.storm();
    runAction({type:"shader",params:{name:"explosion",duration:3,intensity:1,at:"center",mode:"oneshot"}});}};

/* ═══ FITSCALE ═══ */
const Fit={cs:null,wrap:null,useZoom:CSS.supports("zoom","1"),busy:false,_W:0,_H:0,_s:1,_z:null,
  init(){this.cs=$("#card-scene");this.wrap=$("#fit-wrap");if(!this.cs)return;
    if(!CONFIG.layout.autofit){this.reset();return}
    addEventListener("resize",debounce(()=>this.compute(),150),{passive:true});
    if("ResizeObserver"in window)new ResizeObserver(()=>this.compute()).observe(this.cs);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>this.compute());
    this.compute();},
  compute(force){if(this.busy||!this.cs)return;
    if(!CONFIG.layout||!CONFIG.layout.autofit){this.reset();return}
    this.busy=true;const cs=this.cs,L=CONFIG.layout;const pz=cs.style.zoom,pt=cs.style.transform;
    cs.style.zoom="1";cs.style.transform="none";
    const W=cs.offsetWidth||1,H=cs.offsetHeight||1;
    let availW=innerWidth;
    if(window.EDIT_MODE){const d=document.querySelector(".ed2.open,.ed-drawer.open");
      if(d)availW=Math.max(300,innerWidth-Math.min(d.offsetWidth||440,480));}
    let s=Math.min((innerHeight-(L.marginY??84))/H,(availW-(L.marginX??36))/W);
    s=Math.max(L.minScale??.5,Math.min(L.maxScale??1.2,s));
    if(!force&&W===this._W&&H===this._H&&s===this._s&&this._z===this.useZoom){cs.style.zoom=pz;cs.style.transform=pt;this.busy=false;return}
    if(this.useZoom){cs.style.zoom=String(s);cs.style.transform="none";this.wrap.style.height=""}
    else{cs.style.zoom="";cs.style.transform=`scale(${s})`;this.wrap.style.height=Math.round(H*s)+"px"}
    this._W=W;this._H=H;this._s=s;this._z=this.useZoom;this.busy=false;},
  reset(){if(!this.cs)return;this.cs.style.zoom="";this.cs.style.transform="";this.wrap.style.height="";this._W=this._H=0;this._s=1}};

/* ═══ GÖRÜNÜRLÜK ═══ */
const Vis={_m:false,_av:false,
  init(){document.addEventListener("visibilitychange",()=>{
    const v=Media.video;
    if(document.hidden){
      this._m=!!(AudioSys.music&&!AudioSys.music.paused);
      this._av=!!(Media.avVideo&&!Media.avVideo.paused);
      Loop.stop();Media.pauseAllForHidden();
      ZoneSounds.stopAll();
      if(AudioSys.music&&this._m)AudioSys.music.pause();
      if(Media.avVideo)Media.avVideo.pause();
    }else{
      Loop.start();
      if(v&&v.paused&&Media.plays())Media.resumeTick();
      if(AudioSys.music&&this._m&&AudioSys._on&&!document.hidden)AudioSys.music.play().catch(()=>{});
      if(Media.avVideo&&this._av)Media.avVideo.play().catch(()=>{});
    }})}};

/* ═══ ANTI-DEBUG ═══ */
const AntiDebug={
  _rc:null,_key:null,_dt:null,_warned:false,
  apply(){
    const A=CONFIG.antiDebug||{};
    if(window.EDIT_MODE){this._teardown();return;}
    if(A.rightClick&&!this._rc){
      this._rc=(e)=>{
        if(CONFIG.contextMenu&&CONFIG.contextMenu.enabled)return;
        e.preventDefault();
      };
      document.addEventListener("contextmenu",this._rc);
    }
    if(!A.rightClick&&this._rc){document.removeEventListener("contextmenu",this._rc);this._rc=null;}
    if(A.shortcuts&&!this._key){
      this._key=(e)=>{
        const k=(e.key||"").toLowerCase();
        const f12=k==="f12";
        const dev=e.ctrlKey&&e.shiftKey&&(k==="i"||k==="j"||k==="c");
        const view=e.ctrlKey&&!e.shiftKey&&(k==="u"||k==="s");
        if(f12||dev||view){e.preventDefault();e.stopPropagation();}
      };
      document.addEventListener("keydown",this._key,true);
    }
    if(!A.shortcuts&&this._key){document.removeEventListener("keydown",this._key,true);this._key=null;}
    if(A.consoleWarn&&!this._warned){
      this._warned=true;
      console.log("%c🛡️ DİKKAT","font-size:24px;color:#e6b34d;font-weight:bold");
      console.log("%cBu konsolda seni kandırmaya çalışan birini görüyorsan, sayfayı kapat. Senki Bio güvenli bir statik sayfadır. Burada yazdığın her komut sadece KENDİ tarayıcını etkiler.","font-size:12px;color:#a1916f");
    }},
  _teardown(){
    if(this._rc){document.removeEventListener("contextmenu",this._rc);this._rc=null;}
    if(this._key){document.removeEventListener("keydown",this._key,true);this._key=null;}
    if(this._dt){clearInterval(this._dt);this._dt=null;}
  },
};

/* ═══ HER ŞEYİ UYGULA ═══ */
function applyAll(){applyTheme();applyFont();applyTexts();applyBadges();applyChips();applyEntry();Avatar.apply();applyCard();applyElements();
  Background.applyBlur();Background.applyMode();Tabs.render();Dock.build();Zones.renderOverlay();applyFx();applyCursor();applyStats();Fit.compute(true);
  /* intro bittiyse elementler görünür kalsın */
  if (CONFIG._introDone) {
    manifestSelectors().forEach(sel => {
      const el = document.querySelector(sel);
      if (el) { el.style.opacity = ""; el.style.transition = ""; }
    });
  }
}

/* ═══ GİRİŞ PERDESİ + İNTERAKTİF İNTRO ═══ */
const Entry={done:false,
  init(){const o=$("#entry-overlay");if(!o)return;
    const enter=(e)=>{if(this.done)return;this.done=true;this.hide(e)};
    o.addEventListener("click",enter);
    document.addEventListener("keydown",(e)=>{if(!this.done&&(e.key==="Enter"||e.key===" "))enter(e)});
    if(window.EDIT_MODE)setTimeout(()=>enter(null),450)},
  hide(e){const o=$("#entry-overlay");if(o)o.classList.add("is-hidden");
    document.body.classList.add("is-entered");entered=true;
    Media.setPreloadAuto();
    applyEntry();
    setTimeout(()=>document.body.classList.add("stage-done"),1900);

    /* ═══ v5.0: İNTERAKTİF İNTRO ═══ */
    const iCfg = CONFIG.intro || {};
    const useIntro = iCfg.enabled !== false &&
                     window.SenkiIntro &&
                     !(iCfg.skipOnReload !== false && SenkiIntro.hasSeen());

    if (useIntro) {
      document.body.classList.add("intro-active");
      SenkiIntro.start(iCfg);
      if (iCfg.skipOnReload !== false) SenkiIntro.markSeen();
      /* Normal finish akışı intro.finish içinde çağrılır */
    } else {
      setTimeout(()=>document.body.classList.remove("intro-active"), 3000);
    }

    const g=(l,f)=>{try{f()}catch(err){console.error("[senki] giriş '"+l+"':",err)}};
    g("ses",()=>AudioSys.unlock());g("blip",()=>Sfx.clickBlip());
    g("kıvılcım",()=>{if(e&&e.clientX)Sparks.burst(e.clientX,e.clientY,16)});
    g("daktilo",()=>applyBio());g("fit",()=>Fit.compute());
    g("selam",()=>setTimeout(fireGreeting,2200));g("lanyard",()=>Lanyard.start());}};

/* ═══ EDİTÖR API ═══ */
window.SenkiApp={CONFIG,toast,ACTIONS,runAction,Loop,Perf,Gfx,ShaderFX,PopupMenu,Sessions,TimeDilation,makeMedia,ZoneSounds,
  icons:ICONS,iconKeys:ICON_KEYS,
  util:{deepMerge,deepClone,escapeHtml,debounce,store,mulberry32},
  applyAll,applyTexts,applyBio,applyBadges,applyChips,applyCard,applyTheme,applyFont,applyFx,
  applyElements,applyCursor,applyStats,applyMeta,applyEntry,rebuildLinks,
  Avatar,Tabs,Zones,Background,AudioSys,Sfx,Lanyard,EL,
  applyAntiDebug:()=>AntiDebug.apply(),
  applyBg:()=>Background.applyMode(),applyBlur:()=>Background.applyBlur(),
  bgNext:()=>Background.next(),bgPrev:()=>Background.prev(),
  frames:()=>(window.SenkiFrames?SenkiFrames.list():[]),
  fit:(f)=>Fit.compute(f),
  applyPerf:()=>{Perf.detect();Perf.apply();Sparks.fit();Dust.fit();Gfx.boot()}};

/* ═══ BAŞLAT ═══ */
function safe(l,f){try{f()}catch(err){console.error("[senki] '"+l+"':",err)}}
Entry.init();
safe("pointer bus",()=>PointerBus.init());
safe("perf",()=>Perf.init());
safe("gpu toz",()=>Gfx.boot());
safe("shader fx",()=>ShaderFX.init());
safe("anti-debug",()=>AntiDebug.apply());
safe("tema & meta",()=>{applyTheme();applyFont();applyTexts();applyMeta();});
safe("giriş perdesi",()=>applyEntry());
safe("rozet & chips",()=>{applyBadges();applyChips()});
safe("avatar",()=>Avatar.apply());
safe("kart",()=>{applyCard();applyElements()});
safe("arka plan",()=>Background.init());
safe("medya doktoru",()=>Media.init());
safe("ses",()=>{AudioSys.init();AudioSys.updateUI();Sfx.init()});
safe("sekmeler & dock",()=>{Tabs.render();Dock.build()});
safe("bölgeler",()=>Zones.init());
safe("kıvılcım",()=>Sparks.init());
safe("imleç & tilt",()=>FX.init());
safe("kısayollar",()=>Shortcuts.init());
safe("konami",()=>Konami.init());
safe("otomatik sığdır",()=>Fit.init());
safe("görünürlük",()=>Vis.init());
safe("zaman genişlemesi",()=>Loop.add((t)=>TimeDilation.tick(t)));
safe("oturum ttl",()=>setInterval(()=>Sessions.tick(),1000));
safe("ekstra",()=>{applyCursor();applyStats()});
if(window.EDIT_MODE&&window.SenkiEditor&&window.SenkiEditor.init)safe("editör",()=>window.SenkiEditor.init());
safe("tetikler",()=>setTimeout(()=>Triggers.init(),2500));
console.info("[senki-bio v5.1] hazır — toz:",Gfx.mode,"| shader:",ShaderFX.gl?"GLSL":"CSS","+",(navigator.gpu?"WGSL":""),"| intro:",(CONFIG.intro&&CONFIG.intro.enabled)?"açık":"kapalı");