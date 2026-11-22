/* Mansfield Sales & Service premium rebuild: DEMO by Harmony AI. No network calls; the chat and forms are scripted demos. */
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
      box.innerHTML = "<b>Demo only, nothing was sent.</b> On the live site this request goes straight to Mansfield's office.";
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
  // Three tap questions (Harmony 2026-11-21). No promised times or prices; town facts only from Mansfield's own service-area list.
  var flows = {
    "Why is my AC freezing up?": [
      "Ice on an AC usually points to an airflow or refrigerant problem. Set the thermostat to OFF with the fan ON so it can thaw, and check that the air filter isn't clogged.",
      "Then have a technician take a look. Call Mansfield at <a href='tel:" + TEL + "'>" + PHONE + "</a>."
    ],
    "Do you serve Southport?": [
      "Yes. Southport is one of the towns Mansfield lists, along with Oak Island, Saint James, Bald Head Island, Leland, Holden Beach and Ocean Isle."
    ],
    "How soon can someone come out?": [
      "I can't promise a time in this demo. The quickest way to get on the schedule is to call <a href='tel:" + TEL + "'>" + PHONE + "</a>.",
      "On your real site, I'd pass your name, number and the problem straight to the office."
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
    if (open && !started) { started = true; say("Hi! I'm <b>Hali</b>, Mansfield's AI assistant. <i>(This is a demo of what I'd do on your site.)</i> What can I help with?"); showQuick(); }
  });
  chat.querySelector(".x").addEventListener("click", function () { chat.classList.remove("open"); fab.setAttribute("aria-expanded", "false"); });
})();
