/* Kool Freeze premium rebuild: DEMO by Harmony AI. No network calls; the chat and forms are scripted demos. */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // mobile menu
  var mb = document.querySelector(".menu-btn"), dr = document.querySelector(".drawer");
  if (mb && dr) mb.addEventListener("click", function () {
    var open = dr.classList.toggle("open"); mb.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // reveal on scroll
  var rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rv.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  // hero depth: each plane moves at its own speed
  var planes = document.querySelectorAll("[data-depth]");
  // thermostat: 95 -> 72 as the section scrolls through
  var th = document.querySelector("[data-thermo]");
  var tEl = th && th.querySelector(".temp"), arc = th && th.querySelector(".arc"), lbl = th && th.querySelector(".lbl");
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY || 0;
    // read layout BEFORE writing styles (write-then-read forced a reflow every frame; Lighthouse 2026-11-19)
    var r = th ? th.getBoundingClientRect() : null, vh = window.innerHeight;
    if (!reduce) planes.forEach(function (p) {
      var d = parseFloat(p.getAttribute("data-depth"));
      p.style.transform = "translate3d(0," + (y * d).toFixed(1) + "px,0)";
    });
    if (th) {
      var prog = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height * 0.4)));
      if (reduce) prog = 1;
      var t = Math.round(95 - 23 * prog);
      tEl.textContent = t + "°";
      var len = 754; arc.style.strokeDashoffset = (len * (1 - prog)).toFixed(0);
      var c = prog < 0.5 ? "#E04048" : "#18A0D0"; arc.style.stroke = c;
      lbl.textContent = prog < 0.98 ? "Cooling down…" : "Comfortable";
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  frame();

  // DEMO booking / contact forms: never sent anywhere
  document.querySelectorAll("form[data-demo]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var box = f.querySelector(".result");
      box.hidden = false;
      box.innerHTML = "<b>Demo only, nothing was sent.</b> On the live site this request goes straight to Kool Freeze, and Hali texts the customer back within a minute to confirm.";
      box.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    });
  });

  // SEER savings calculator (general estimate, clearly labeled)
  var calc = document.querySelector("[data-seer]");
  if (calc) {
    var upd = function () {
      var oldS = +calc.querySelector("#seer-old").value, newS = +calc.querySelector("#seer-new").value, bill = +calc.querySelector("#bill").value;
      var save = bill > 0 && oldS > 0 && newS > oldS ? bill * (1 - oldS / newS) : 0;
      calc.querySelector("output").textContent = "$" + Math.round(save) + " a year (estimate)";
    };
    calc.addEventListener("input", upd); upd();
  }

  // DEMO chat: shows what Hali would do. Scripted, no AI call, no data leaves the page.
  var fab = document.querySelector(".chat-fab"), chat = document.querySelector(".chat");
  if (!fab || !chat) return;
  var log = chat.querySelector(".log"), quick = chat.querySelector(".quick");
  var PHONE = fab.getAttribute("data-phone"), TEL = fab.getAttribute("data-tel"), ROOT = fab.getAttribute("data-root") || "";
  var flows = {
    "My AC stopped working": [
      "Oh no, let's get you cool again. Is the outdoor unit running at all, or is it completely silent?",
      "Got it. Two quick checks while I alert the team: is the thermostat set to COOL, and has the breaker tripped?",
      "In the live version I'd now text your details to Kool Freeze's on-call tech and offer you the first open slot. Fastest right now: call <a href='tel:" + TEL + "'>" + PHONE + "</a>."
    ],
    "Book a tune-up": [
      "Happy to! Is this for heating, cooling, or both?",
      "In the live version I'd show real open times and book it for you, then text you a reminder the day before. For now, use the <a href='" + ROOT + "book/'>booking page</a> or call <a href='tel:" + TEL + "'>" + PHONE + "</a>."
    ],
    "Do you serve my town?": [
      "Kool Freeze serves Ocean Isle Beach, Holden Beach, Calabash, Carolina Shores, Sunset Beach, Ash and Shallotte in NC, plus North Myrtle Beach, Little River and Longs in SC.",
      "Not on the list? Call <a href='tel:" + TEL + "'>" + PHONE + "</a> and ask. They may still be able to help."
    ],
    "Rental property / property manager": [
      "Kool Freeze works with property managers here on the coast. How many units do you manage?",
      "In the live version I'd collect the unit addresses and set up a service request the team can schedule between guest stays."
    ]
  };
  function say(html, who) {
    var m = document.createElement("div"); m.className = "msg " + (who || "bot"); m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight;
  }
  function showQuick() {
    quick.innerHTML = "";
    Object.keys(flows).forEach(function (k) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = k;
      b.addEventListener("click", function () { run(k); }); quick.appendChild(b);
    });
  }
  function run(k) {
    quick.innerHTML = ""; say(k, "me");
    var steps = flows[k], i = 0;
    (function next() {
      if (i >= steps.length) { setTimeout(showQuick, 400); return; }
      setTimeout(function () { say(steps[i++]); next(); }, reduce ? 0 : 700);
    })();
  }
  var started = false;
  fab.addEventListener("click", function () {
    var open = chat.classList.toggle("open"); fab.setAttribute("aria-expanded", open ? "true" : "false");
    if (open && !started) { started = true; say("Hi! I'm <b>Hali</b>, Kool Freeze's AI assistant. <i>(This is a demo of what I'd do on your site.)</i> What can I help with?"); showQuick(); }
  });
  chat.querySelector(".x").addEventListener("click", function () { chat.classList.remove("open"); fab.setAttribute("aria-expanded", "false"); });
})();
