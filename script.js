(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var rRu = $("r-ru"), rEn = $("r-en"), menuCb = $("menu-toggle");

  function lang() { return rEn.checked ? "en" : "ru"; }

  /* ---------- language: the CSS already switches the text, this adds memory and labels ---------- */
  function applyLang(l, save) {
    rRu.checked = l === "ru";
    rEn.checked = l === "en";
    document.documentElement.lang = l;
    menuCb.setAttribute("aria-label", l === "en" ? "Menu" : "Меню");
    var x = $("ai-x"); if (x) x.setAttribute("aria-label", l === "en" ? "Close assistant" : "Закрыть ассистента");
    var inp = $("ai-input"); if (inp) inp.placeholder = l === "en" ? "Ask about the project" : "Спросите о проекте";
    var send = $("ai-send"); if (send) send.setAttribute("aria-label", l === "en" ? "Send" : "Отправить");
    renderChips();
    if (save) { try { localStorage.setItem("cl-lang", l); } catch (_) {} }
  }
  var saved = null;
  try { saved = localStorage.getItem("cl-lang"); } catch (_) {}
  var dev = String((navigator.languages && navigator.languages[0]) || navigator.language || "ru").toLowerCase();
  var start = (saved === "ru" || saved === "en") ? saved : (dev.indexOf("ru") === 0 ? "ru" : "en");

  /* ---------- title: two lines, never broken, size fitted to its column ---------- */
  var title = $("title");
  function fitTitle() {
    if (!title) return;
    var box = title.parentElement, l1 = title.querySelector(".l1");
    title.style.fontSize = "100px";
    var w = l1.getBoundingClientRect().width, avail = box.clientWidth;
    if (!w || !avail) return;
    var maxPx = 7.5 * 16;
    var size = Math.max(24, Math.min(maxPx, 100 * avail / w * 0.98));
    title.style.fontSize = size.toFixed(1) + "px";
  }

  /* ---------- menu ---------- */
  function closeMenu() { menuCb.checked = false; }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (menuCb.checked) { closeMenu(); }
      if (!$("ai").hidden) { closeAi(); }
    }
  });
  document.addEventListener("click", function (e) {
    if (menuCb.checked && !e.target.closest("header")) closeMenu();
  });
  window.addEventListener("resize", function () { if (window.innerWidth > 980) closeMenu(); fitTitle(); });

  /* anchor links: smooth scroll that behaves the same inside and outside a frame */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function goTo(id) {
    var target = $(id);
    if (!target) return;
    closeMenu();
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    try { history.replaceState(null, "", "#" + id); } catch (_) {}
  }
  Array.prototype.forEach.call(document.querySelectorAll('a[href^="#"]'), function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").slice(1);
      if (!$(id)) return;
      e.preventDefault();
      goTo(id);
    });
  });

  /* highlight the section being read */
  var links = Array.prototype.slice.call(document.querySelectorAll("nav a[href^='#']"));
  var secs = [];
  links.forEach(function (a) { var s = $(a.getAttribute("href").slice(1)); if (s && secs.indexOf(s) < 0) secs.push(s); });
  function markActive() {
    var y = window.scrollY + 120, current = null;
    secs.forEach(function (s) { if (s.offsetTop <= y) current = s.id; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = secs[secs.length - 1].id;
    links.forEach(function (a) {
      if (a.getAttribute("href").slice(1) === current) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }
  window.addEventListener("scroll", markActive, { passive: true });
  window.addEventListener("resize", markActive);

  /* ---------- assistant: answers come from the site's own content ---------- */
  var KB = [
    { k: ["привет", "здравств", "добрый", "hello", "hi ", "hey"], go: null,
      ru: "Здравствуйте! Спросите о проекте: что это, какие возможности, как работает семейный режим, чем он отличается, кто основатель.",
      en: "Hello! Ask about the project: what it is, its features, how family mode works, how it differs, who the founder is." },
    { k: ["что это", "что такое", "о проекте", "расскажи", "суть", "what is", "about", "tell me", "project"], go: "about",
      ru: "Comfortable life — приложение, которое собирает в одном месте умный дом, заметки, календарь, спорт и здоровье. Цель: облегчить людям жизнь в их телефоне.",
      en: "Comfortable life is an app that brings smart home, notes, calendar, sport and health into one place. The goal is to make life easier for people, right in their phone." },
    { k: ["возможност", "функци", "умеет", "что можно", "feature", "what can", "can it", "functionality"], go: "features",
      ru: "В приложении пять областей: управление умным домом, заметки, расписание в календаре, спорт и здоровье.",
      en: "The app covers five areas: smart home control, notes, a calendar schedule, sport and health." },
    { k: ["умный дом", "умного дом", "устройств", "экосистем", "яндекс", "алиса", "smart home", "device", "ecosystem"], go: "features",
      ru: "Умный дом: устройства из разных экосистем управляются в одном месте. Сценарии запускает встроенный ИИ-помощник приложения.",
      en: "Smart home: devices from different ecosystems are controlled in one place. Scenes are run by the app's built-in AI assistant." },
    { k: ["заметк", "календар", "расписан", "спорт", "здоровь", "тренировк", "note", "calendar", "schedule", "sport", "health", "workout"], go: "features",
      ru: "Заметки: быстрые записи, личные и общие. Календарь: день и неделя на одном экране, события семьи рядом с вашими. Спорт: тренировки, активность и прогресс. Здоровье: самочувствие и привычки под рукой.",
      en: "Notes: quick entries, personal and shared. Calendar: your day and week at a glance, family events next to yours. Sport: workouts, activity and progress. Health: well-being and habits at hand." },
    { k: ["семь", "семейн", "родн", "общие", "личн", "family", "shared", "personal", "together"], go: "family",
      ru: "В семейном режиме у семьи общие заметки, общий календарь и общий умный дом. При этом у каждого остаётся личное пространство, которое не смешивается с общим.",
      en: "In family mode a family shares notes, a calendar and a smart home. Everyone still keeps a personal space that stays separate from the shared one." },
    { k: ["отлич", "лучше", "конкурент", "аналог", "рынок", "differ", "better", "compet", "alternative", "market"], go: "why",
      ru: "Отличия: всё в одном приложении вместо нескольких; общее и личное разделены внутри семьи; устройства из разных экосистем и сценарии с ИИ-помощником; защита данных как главный принцип; язык интерфейса следует за языком устройства.",
      en: "Differences: everything in one app instead of several; shared and personal spaces kept apart inside a family; devices from different ecosystems and scenes with an AI assistant; data protection as the main principle; the interface language follows the device language." },
    { k: ["амбици", "цель", "план", "будущ", "сша", "америк", "страны", "ambition", "goal", "plan", "usa", "countries", "future"], go: "ambitions",
      ru: "Цель — стать неотъемлемой частью жизни человека. Начинаем с России, затем США и другие страны.",
      en: "The ambition is to become an essential part of a person's life. We start in Russia, then the USA and other countries." },
    { k: ["основател", "автор", "кто создал", "кто сделал", "чепуштанов", "матвей", "founder", "who made", "who created", "author", "matthew"], go: "founder",
      ru: "Основатель и автор идеи проекта — Matthew Chepushtanov.",
      en: "The founder and author of the idea is Matthew Chepushtanov." },
    { k: ["безопас", "защит", "данны", "приват", "конфиденц", "security", "privacy", "safe", "protect", "data"], go: "why",
      ru: "Защита данных — главный принцип разработки: приложение задумано максимально защищённым. Технических подробностей на сайте пока нет.",
      en: "Data protection is the main development principle: the app is meant to be as secure as possible. There are no technical details on the site yet." },
    { k: ["когда", "релиз", "дата", "цен", "стоим", "бесплатн", "скача", "запуск", "контакт", "связ", "почт", "price", "cost", "free", "download", "release", "when", "launch", "contact", "email"], go: null,
      ru: "Проект в разработке. Дат выхода, цен и контактов на сайте пока нет.",
      en: "The project is in development. There are no release dates, prices or contacts on the site yet." },
    { k: ["язык", "англ", "русск", "language", "english", "russian"], go: null,
      ru: "Язык сайта и приложения подстраивается под язык устройства. Переключатель RU/EN в шапке меняет язык сайта вручную.",
      en: "The site and the app follow the device language. The RU/EN switch in the header changes the site language manually." },
    { k: ["спасибо", "благодар", "thank"], go: null,
      ru: "Пожалуйста! Спрашивайте ещё.", en: "You are welcome! Ask anything else." }
  ];
  var FALLBACK = {
    ru: "Я отвечаю на вопросы о проекте Comfortable life по материалам сайта. Попробуйте спросить про возможности, семейный режим, отличия или основателя.",
    en: "I answer questions about Comfortable life using the site's content. Try asking about features, family mode, differences or the founder."
  };
  var GO = { ru: "Открыть раздел", en: "Open section" };
  var CHIPS = {
    ru: ["Что это за проект?", "Какие возможности?", "Как работает семейный режим?", "Чем он отличается?", "Кто основатель?"],
    en: ["What is this project?", "What can it do?", "How does family mode work?", "How is it different?", "Who is the founder?"]
  };
  var ai = $("ai"), log = $("ai-log"), chips = $("ai-chips"), form = $("ai-form"), input = $("ai-input");

  function answer(q) {
    var s = " " + q.toLowerCase() + " ", best = null, bestScore = 0;
    KB.forEach(function (e) {
      var score = 0;
      e.k.forEach(function (w) { if (s.indexOf(w) >= 0) score += w.length > 4 ? 2 : 1; });
      if (score > bestScore) { best = e; bestScore = score; }
    });
    return best;
  }
  function addMsg(text, who, go) {
    var m = document.createElement("div");
    m.className = "msg " + who;
    m.textContent = text;
    if (go) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "go"; b.textContent = GO[lang()];
      b.addEventListener("click", function () {
        if (window.innerWidth <= 560) closeAi();
        goTo(go);
      });
      m.appendChild(document.createElement("br"));
      m.appendChild(b);
    }
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
  }
  function ask(q) {
    q = q.replace(/^\s+|\s+$/g, "");
    if (!q) return;
    addMsg(q, "me");
    var l = lang(), hit = answer(q);
    window.setTimeout(function () {
      if (hit) addMsg(hit[l], "bot", hit.go); else addMsg(FALLBACK[l], "bot");
    }, 280);
  }
  function renderChips() {
    if (!chips) return;
    chips.textContent = "";
    CHIPS[lang()].forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = c;
      b.addEventListener("click", function () { ask(c); });
      chips.appendChild(b);
    });
  }
  var greeted = false;
  function openAi() {
    closeMenu();
    ai.hidden = false;
    if (!greeted) {
      greeted = true;
      addMsg(lang() === "en"
        ? "Hello! I am the project assistant. Ask me about Comfortable life."
        : "Здравствуйте! Я ассистент проекта. Спросите меня о Comfortable life.", "bot");
    }
    window.setTimeout(function () { input.focus(); }, 50);
  }
  function closeAi() { ai.hidden = true; }
  Array.prototype.forEach.call(document.querySelectorAll("[data-ai-open]"), function (b) {
    b.addEventListener("click", function (e) { e.stopPropagation(); if (ai.hidden) openAi(); else closeAi(); });
  });
  $("ai-x").addEventListener("click", closeAi);
  form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; ask(v); });

  /* ---------- ferns ---------- */
  function fern(id, bend, tipx, n) {
    var svg = $(id), ns = "http://www.w3.org/2000/svg";
    var P0 = [150, 515], P1 = [bend, 270], P2 = [tipx, 28];
    var stem = document.createElementNS(ns, "path");
    stem.setAttribute("d", "M" + P0 + " Q" + P1 + " " + P2);
    stem.setAttribute("fill", "none"); stem.setAttribute("stroke", "currentColor");
    stem.setAttribute("stroke-width", "3"); stem.setAttribute("stroke-linecap", "round");
    svg.appendChild(stem);
    for (var i = 1; i <= n; i++) {
      var t = 0.1 + 0.88 * i / n, u = 1 - t;
      var x = u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0];
      var y = u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1];
      var tx = 2 * u * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]);
      var ty = 2 * u * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
      var a = Math.atan2(ty, tx);
      var len = (78 * Math.pow(u, 0.75) + 9) * Math.min(1, t * 5 + 0.45);
      [-1, 1].forEach(function (s) {
        var d = a + s * 1.05;
        var cx = x + Math.cos(d) * len / 2, cy = y + Math.sin(d) * len / 2;
        var el = document.createElementNS(ns, "ellipse");
        el.setAttribute("cx", cx.toFixed(1)); el.setAttribute("cy", cy.toFixed(1));
        el.setAttribute("rx", (len / 2).toFixed(1)); el.setAttribute("ry", (len * 0.13).toFixed(1));
        el.setAttribute("transform", "rotate(" + (d * 180 / Math.PI).toFixed(1) + " " + cx.toFixed(1) + " " + cy.toFixed(1) + ")");
        el.setAttribute("fill", "currentColor"); el.setAttribute("opacity", "0.9");
        svg.appendChild(el);
      });
    }
  }
  fern("fern-h1", 70, 205, 24);
  fern("fern-h2", 230, 90, 18);
  fern("fern-w1", 60, 215, 26);
  fern("fern-w2", 235, 80, 20);

  /* ---------- start ---------- */
  rRu.addEventListener("change", function () { applyLang("ru", true); });
  rEn.addEventListener("change", function () { applyLang("en", true); });
  applyLang(start, false);
  markActive();
  fitTitle();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
  window.addEventListener("load", fitTitle);
})();
