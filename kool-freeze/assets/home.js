/* Kool Freeze homepage v6: mounts the Scrollcraft engine (unedited) and drives this site's own scene.
   One pinned coastal world: hero (sunset, heat haze) -> cool-down (frost from the edges, cold particles, palette moves
   sunset -> frost white -> ice blue, dial 95 -> 72). Then a 3D outdoor unit, loaded only when it is about to be seen.
   Reads cached act progress only; writes a handful of CSS variables per frame. */
function kfInit() {
  if (!window.ScrollCraft) return;
  var phone = matchMedia("(max-width: 760px)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // lighter on phones: shorter pinned scenes
  if (phone) {
    var w0 = document.querySelector(".kw-world"); if (w0) w0.setAttribute("data-sc-span", "3");
    var u0 = document.querySelector(".kw-unit"); if (u0) u0.setAttribute("data-sc-span", "2");
    var r0 = document.querySelector(".kw-reviews");
    if (r0) { r0.setAttribute("data-sc-act", "flow"); r0.removeAttribute("data-sc-span");
              var rail = r0.querySelector("[data-sc-pan]"); if (rail) rail.removeAttribute("data-sc-pan");
              var st = r0.querySelector("[data-sc-stage]"); if (st) st.removeAttribute("data-sc-stage"); }
    // lighter parallax on phones (about a third of desktop), so planes stay framed on a small screen
    Array.prototype.forEach.call(document.querySelectorAll(".w-stage [data-sc-parallax]"), function (el) {
      el.setAttribute("data-sc-parallax", (parseFloat(el.getAttribute("data-sc-parallax")) * 0.35).toFixed(2));
    });
  }
  var scrollT = 0, root = document.documentElement;
  addEventListener("scroll", function () { root.classList.add("is-scrolling"); clearTimeout(scrollT); scrollT = setTimeout(function () { root.classList.remove("is-scrolling"); }, 700); }, { passive: true });
  var api = ScrollCraft.mount(document.body);
  var world = null, unit = null;
  api.acts.forEach(function (a) { if (a.el.classList.contains("kw-world")) world = a; if (a.el.classList.contains("kw-unit")) unit = a; });
  var stage = document.querySelector(".w-stage");
  var heatEls = Array.prototype.slice.call(document.querySelectorAll("[data-heat]"));
  var temp = document.querySelector("[data-temp]"), tempLbl = document.querySelector("[data-temp-lbl]");
  var dial = document.querySelector("[data-dial]"), dialLbl = document.querySelector("[data-dial-lbl]");
  var lines = Array.prototype.slice.call(document.querySelectorAll(".w-l"));
  var cool = document.querySelector(".w-cool"), frost = document.querySelector(".w-frost"), heatG = document.querySelector(".w-heat");

  // palette: sunset -> frost white -> ice (never a red/blue mix, so no purple)
  var P = {
    sky1: ["#B8323A", "#DCE7EE", "#0B3A6E"], sky2: ["#F06A3A", "#EEF4F7", "#3FA9DD"], sky3: ["#FFC78A", "#F7FBFD", "#CFEFFC"],
    sun: ["#FFE7A8", "#FFFFFF", "#F4FBFF"], pier: ["#5E1626", "#7D8D9C", "#0B2C52"], water1: ["#C9503F", "#C8D6E0", "#2D8CC4"],
    water2: ["#5E1C2C", "#8CA0B2", "#0B3A6E"], glint: ["#FFD9A0", "#FFFFFF", "#EAF8FF"], dune: ["#F3D9B5", "#F4F7F9", "#E3F2FA"], "dune-edge": ["#E8C49A", "#DDE6EC", "#B9DDF0"]
  };
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  Object.keys(P).forEach(function (k) { P[k] = P[k].map(hex); });
  function mix(a, b, t) { return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + "," + Math.round(a[1] + (b[1] - a[1]) * t) + "," + Math.round(a[2] + (b[2] - a[2]) * t) + ")"; }
  function sstep(e0, e1, x) { var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }

  // heat haze over the summer scene (desktop, motion allowed)
  if (fine && !reduce && !phone && heatG) {
    var ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.style.position = "absolute";
    svg.innerHTML = '<filter id="kfHaze" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.05" numOctaves="2" seed="7">' +
      '<animate attributeName="baseFrequency" dur="7s" values="0.008 0.05;0.011 0.07;0.008 0.05" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="6"/></filter>';
    document.body.appendChild(svg);
  }

  // cold-air particles (fewer on phones; none with reduced motion)
  var canvas = document.querySelector(".w-particles"), ctx = canvas && canvas.getContext("2d"), parts = [];
  var N = reduce ? 0 : phone ? 45 : 140, cw = 0, ch = 0, dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
  function sizeCanvas() { if (!canvas) return; cw = canvas.clientWidth; ch = canvas.clientHeight; canvas.width = cw * dpr; canvas.height = ch * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  for (var i = 0; i < N; i++) parts.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 2.2, s: 0.0006 + Math.random() * 0.0016, ph: Math.random() * 6.28, streak: Math.random() < 0.3 });
  addEventListener("resize", sizeCanvas, { passive: true }); sizeCanvas();

  var last = {}, lastT = -1, lastD = -1, lastLine = -1, t0 = performance.now();
  function frame(now) {
    var p = world ? world.p : 0;
    var h = 1 - sstep(0.2, 0.27, p);           // hero copy (overlaps the card slightly: never an empty screen)
    var k = sstep(0.19, 0.26, p);              // cool-down card
    var c = Math.min(1, Math.max(0, (p - 0.3) / 0.6));   // cooling progress
    var heat = 1 - c;
    if (stage && (last.p === undefined || Math.abs(last.p - p) > 0.0005)) {
      last.p = p;
      stage.style.setProperty("--h", h.toFixed(3)); stage.style.setProperty("--k", k.toFixed(3)); stage.style.setProperty("--c", c.toFixed(3));
      var a = c < 0.5 ? 0 : 1, t = c < 0.5 ? c / 0.5 : (c - 0.5) / 0.5;
      for (var key in P) stage.style.setProperty("--" + key, mix(P[key][a], P[key][a + 1], t));
      if (frost) frost.style.opacity = sstep(0.02, 0.35, c).toFixed(3);
      if (cool) cool.classList.toggle("on", k > 0.5);
      if (heatG) heatG.style.filter = (c < 0.25 && document.getElementById("kfHaze")) ? "url(#kfHaze)" : "none";
      for (var j = 0; j < heatEls.length; j++) heatEls[j].style.setProperty("--heat", heat.toFixed(3));
      var T = Math.round(72 + 23 * heat);
      if (T !== lastT && temp) { lastT = T; temp.textContent = T + "°"; tempLbl.textContent = T > 85 ? "Too hot" : T > 74 ? "Cooling" : "Comfortable"; }
      if (T !== lastD && dial) { lastD = T; dial.textContent = T + "°"; dialLbl.textContent = T > 85 ? "Too hot" : T > 74 ? "Cooling down" : "Comfortable"; }
      var L = k < 0.5 ? -1 : c < 0.38 ? 0 : c < 0.76 ? 1 : 2;
      if (L !== lastLine) { lastLine = L; lines.forEach(function (el, n) { el.classList.toggle("on", n === L); }); }
    }
    // particles only while the cool-down is on screen
    if (ctx && N && p > 0.22 && p < 0.999) {
      ctx.clearRect(0, 0, cw, ch);
      var tt = (now - t0) / 1000, alpha = 0.15 + 0.75 * c;
      for (var q = 0; q < parts.length; q++) {
        var pt = parts[q];
        pt.x -= pt.s * (0.6 + c * 1.8); if (pt.x < -0.05) { pt.x = 1.05; pt.y = Math.random(); }
        var px = pt.x * cw, py = (pt.y + Math.sin(tt * 0.7 + pt.ph) * 0.015) * ch;
        ctx.globalAlpha = alpha * (0.35 + pt.r / 3.6);
        ctx.fillStyle = "#EAF8FF";
        if (pt.streak) { ctx.fillRect(px, py, 10 + pt.r * 8 * (0.5 + c), 1.2); }
        else { ctx.beginPath(); ctx.arc(px, py, pt.r, 0, 6.283); ctx.fill(); }
      }
      last.drawn = true;
    } else if (ctx && last.drawn) { ctx.clearRect(0, 0, cw, ch); last.drawn = false; }   // clear once, then stay idle
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // 3D unit: load three.js only when the scene is about to be seen, and only if motion + WebGL are available
  var holder = document.querySelector(".u-3d");
  // no WebGL probe at load: creating a test context can block for seconds on software GPUs. three.js fails
  // gracefully inside start() (caught below) and the static drawing stays.
  var gl = !!window.WebGLRenderingContext;
  if (holder && unit && gl && !reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      if (!es.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      // the thermostat's state = the text block the engine is showing most strongly right now (no lag)
      var steps = Array.prototype.slice.call(unit.el.querySelectorAll(".u-step"));
      var getStep = function () { var best = 0, bo = -1; for (var s = 0; s < steps.length; s++) { var o = parseFloat(steps[s].style.opacity); if (isNaN(o)) o = 0; if (o > bo) { bo = o; best = s; } } return best; };
      import("./unit3d.js").then(function (m) { m.start(holder, function () { return unit.p; }, { phone: phone, getStep: getStep }); }).catch(function () {});
    }, { rootMargin: "120% 0px" });
    io.observe(holder);
  }
}
// start after the first screen has painted (it is a complete still frame on its own), so the hero paints first
if (document.readyState === "complete") requestAnimationFrame(kfInit);
else addEventListener("load", function () { requestAnimationFrame(function () { requestAnimationFrame(kfInit); }); });
