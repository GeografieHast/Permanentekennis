/* ==========================================================================
   Permanente Kennis, spelletjes.js
   Drie speelse extra's bovenop de leeromgeving:

     1. Snelheidsronde: 60 seconden, zoveel mogelijk juiste antwoorden per
        kaartblad, met een persoonlijk record per toestel.
     2. Medailles: brons, zilver en goud per kaartblad, op basis van hoeveel
        procent een leerling al beheerst (zelfde "beheerst" als elders).
     3. Memory: paren zoeken, enkel voor de eerste graad (kaartblad 1 en 2).

   De snelheidsronde en memory tellen bewust NIET mee voor "beheerst",
   "Mijn fouten" of "Onderhoud": onder tijdsdruk gokken leerlingen sneller,
   en dat mag hun echte voortgang niet vertekenen. Records en medailles
   worden per toestel bewaard in localStorage, net als de rest.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- helpers --------------------------------------------------- */

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === null || v === undefined) continue;
        if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
        else if (k === "disabled") { if (v !== false) node.disabled = true; }
        else node.setAttribute(k, v);
      }
    }
    (children || []).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function sample(arr, n, exclude) {
    const pool = Array.from(new Set(arr.filter((x) => x !== exclude)));
    return shuffle(pool).slice(0, n);
  }
  function loadJSON(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
  }
  function saveJSON(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) { /* privé-modus: negeren */ }
  }
  function getModule(id) {
    return (window.PK_DATA ? PK_DATA.modules : []).find((m) => m.id === id);
  }
  function mapGroupsFor(moduleId) {
    return (window.PK_MAPS ? PK_MAPS.groups : []).filter((g) => g.moduleId === moduleId);
  }
  function reduceMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function fmtTime(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  /* Alles wat een lopend spel achterlaat (timers, toetsenbord-luisteraars)
     wordt hier verzameld, zodat app.js het bij elke paginawissel kan
     opruimen via PKGames.cleanup(). */
  let cleanups = [];
  function onCleanup(fn) { cleanups.push(fn); }
  function cleanup() {
    const list = cleanups;
    cleanups = [];
    list.forEach((fn) => { try { fn(); } catch (e) { /* negeren */ } });
  }

  /* Kleine confetti-knal bij een record of een gewonnen memory. */
  function burst() {
    if (reduceMotion()) return;
    const colors = ["#e5343c", "#f0a63b", "#1f7a6c", "#2f86c9", "#8452ad", "#c9932e"];
    const layer = el("div", { class: "game-burst", "aria-hidden": "true" });
    for (let i = 0; i < 40; i++) {
      const p = el("span", { class: "game-burst-piece" });
      p.style.left = 50 + (Math.random() * 30 - 15) + "%";
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--dx", (Math.random() * 520 - 260).toFixed(0) + "px");
      p.style.setProperty("--dy", (Math.random() * -360 - 120).toFixed(0) + "px");
      p.style.setProperty("--rot", (Math.random() * 720 - 360).toFixed(0) + "deg");
      p.style.animationDelay = (Math.random() * 0.15).toFixed(2) + "s";
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1800);
  }

  /* ======================================================================
     1. MEDAILLES
     ====================================================================== */

  const MEDALS = [
    { level: 1, id: "brons", label: "Brons", at: 25 },
    { level: 2, id: "zilver", label: "Zilver", at: 60 },
    { level: 3, id: "goud", label: "Goud", at: 90 }
  ];
  const MEDAL_STORE_KEY = "pk-medals-v1";

  function moduleItemIds(moduleId) {
    let ids = [];
    window.PKIndex.onderdelenForModule(moduleId).forEach((o) => { ids = ids.concat(o.itemIds); });
    return ids;
  }
  function moduleSum(moduleId) {
    return window.PKProgress.summarize(moduleItemIds(moduleId));
  }
  function medalLevelFor(pct) {
    let lvl = 0;
    MEDALS.forEach((m) => { if (pct >= m.at) lvl = m.level; });
    return lvl;
  }

  function medalSVG(medalId, earned) {
    const colors = {
      brons: ["#d99a5b", "#a0612a"],
      zilver: ["#e3e9ed", "#9aa8b2"],
      goud: ["#f6d160", "#c9932e"]
    }[medalId];
    const fill = earned ? colors : ["#e7ebea", "#c2cbca"];
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 40 48");
    s.setAttribute("aria-hidden", "true");
    const star = earned
      ? '<path d="M20 20.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L20 32.48l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76z" fill="#fff" opacity="0.92"/>'
      : '<path d="M16.5 28v-3a3.5 3.5 0 017 0v3" fill="none" stroke="#9aa8b2" stroke-width="2"/><rect x="14.5" y="27.5" width="11" height="8" rx="1.8" fill="#9aa8b2"/>';
    s.innerHTML =
      '<path d="M11 1h7l4 12h-7z" fill="' + (earned ? "#e5343c" : "#d5dbda") + '"/>' +
      '<path d="M29 1h-7l-4 12h7z" fill="' + (earned ? "#022e3e" : "#c2cbca") + '"/>' +
      '<circle cx="20" cy="29" r="15" fill="' + fill[1] + '"/>' +
      '<circle cx="20" cy="29" r="12" fill="' + fill[0] + '"/>' +
      star;
    return s;
  }

  /* Compacte rij van drie medailles, voor op de kaartblad-tegels. */
  function medalRow(moduleId) {
    const lvl = medalLevelFor(moduleSum(moduleId).masteredPct);
    const earnedLabel = lvl ? MEDALS[lvl - 1].label : null;
    const row = el("span", {
      class: "medal-row",
      title: earnedLabel ? "Medaille: " + earnedLabel : "Nog geen medaille"
    });
    MEDALS.forEach((m) => {
      row.appendChild(el("span", { class: "medal-mini" + (lvl >= m.level ? " medal-earned medal-" + m.id : "") }, [medalSVG(m.id, lvl >= m.level)]));
    });
    row.appendChild(el("span", { class: "sr-only" }, [earnedLabel ? "Medaille: " + earnedLabel : "Nog geen medaille"]));
    return row;
  }

  /* Groot paneel voor bovenaan een kaartblad: welke medailles je hebt en
     hoeveel items je nog moet beheersen voor de volgende. */
  function medalPanel(moduleId) {
    const sum = moduleSum(moduleId);
    const lvl = medalLevelFor(sum.masteredPct);
    const panel = el("section", { class: "medal-panel" });
    const list = el("div", { class: "medal-list" });
    MEDALS.forEach((m) => {
      const earned = lvl >= m.level;
      list.appendChild(
        el("div", { class: "medal-item" + (earned ? " medal-earned medal-" + m.id : " medal-locked") }, [
          el("span", { class: "medal-icon" }, [medalSVG(m.id, earned)]),
          el("strong", null, [m.label]),
          el("span", { class: "medal-target" }, [m.at + "% beheerst"])
        ])
      );
    });
    panel.appendChild(el("h2", { class: "medal-heading" }, ["Medailles voor dit kaartblad"]));
    panel.appendChild(list);

    const next = MEDALS.find((m) => m.level === lvl + 1);
    let msg;
    if (!sum.total) msg = "";
    else if (!next) msg = "Goud! Je beheerst dit kaartblad. Blijf het onderhouden, dan hou je je medaille.";
    else {
      const needed = Math.max(1, Math.ceil((next.at / 100) * sum.total) - sum.mastered);
      msg = "Nog " + needed + " " + (needed === 1 ? "item" : "items") + " beheersen voor " + next.label.toLowerCase() + ". Een item is beheerst als je het 3 keer na elkaar juist hebt.";
    }
    if (msg) panel.appendChild(el("p", { class: "medal-next" }, [msg]));
    return panel;
  }

  /* Bij elke paginawissel: is er ergens een medaille bijgekomen sinds de
     vorige keer? Dan een korte felicitatie onderaan het scherm. Een
     medaille kan ook weer verloren gaan (bij fouten in onderhoud); dan
     wordt enkel het nieuwe niveau onthouden, zonder melding. */
  function checkNewMedals() {
    if (!window.PK_DATA || !window.PKIndex || !window.PKProgress) return;
    const stored = loadJSON(MEDAL_STORE_KEY);
    const firstRun = !Object.keys(stored).length;
    const gained = [];
    PK_DATA.modules.forEach((mod) => {
      const lvl = medalLevelFor(moduleSum(mod.id).masteredPct);
      const prev = stored[mod.id] || 0;
      if (lvl > prev && !firstRun) gained.push({ mod: mod, medal: MEDALS[lvl - 1] });
      stored[mod.id] = lvl;
    });
    saveJSON(MEDAL_STORE_KEY, stored);
    if (!gained.length) return;
    const g = gained[gained.length - 1];
    showToast(g.medal, "Nieuwe medaille: " + g.medal.label.toLowerCase() + " voor " + g.mod.title + "!");
  }

  function showToast(medal, text) {
    const old = document.querySelector(".medal-toast");
    if (old) old.remove();
    const toast = el("div", { class: "medal-toast", role: "status" }, [
      el("span", { class: "medal-toast-icon" }, [medalSVG(medal.id, true)]),
      el("strong", null, [text]),
      el("button", { class: "medal-toast-close", type: "button", "aria-label": "Sluiten", onclick: () => toast.remove() }, ["×"])
    ]);
    document.body.appendChild(toast);
    burst();
    setTimeout(() => toast.classList.add("medal-toast-out"), 5200);
    setTimeout(() => toast.remove(), 5800);
  }

  /* ======================================================================
     2. SNELHEIDSRONDE
     ====================================================================== */

  const SPEED_SECONDS = 60;
  const SPEED_KEY = "pk-speed-records-v1";

  function speedRecord(moduleId) {
    const all = loadJSON(SPEED_KEY);
    return all[moduleId] ? all[moduleId].best || 0 : 0;
  }

  /* Alle meerkeuzevragen voor een kaartblad: tekst-onderdelen (heen en,
     waar het antwoord kort is, ook terug) plus de kaartoefeningen met het
     rode rondje op de echte bundelkaart. */
  function speedPool(moduleId) {
    const mod = getModule(moduleId);
    const pool = [];
    mod.topics.forEach((topic) => {
      topic.items.forEach((item) => {
        if (topic.kind === "category") {
          pool.push({
            label: "Welke soort is dit?",
            prompt: item.term,
            correct: item.category,
            options: shuffle(topic.categories)
          });
          return;
        }
        const answers = topic.items.map((i) => i.answer);
        const terms = topic.items.map((i) => i.term);
        pool.push({
          label: topic.promptLabel + " → " + topic.answerLabel,
          prompt: item.term,
          correct: item.answer,
          options: shuffle([item.answer].concat(sample(answers, 3, item.answer)))
        });
        if (topic.allowTyping !== false) {
          pool.push({
            label: topic.answerLabel + " → " + topic.promptLabel,
            prompt: item.answer,
            correct: item.term,
            options: shuffle([item.term].concat(sample(terms, 3, item.term)))
          });
        }
      });
    });
    mapGroupsFor(moduleId).forEach((group) => {
      const terms = group.legend.map((e) => e.term);
      group.legend.forEach((entry) => {
        if (typeof entry.x !== "number" || typeof entry.y !== "number") return;
        pool.push({
          label: "Wat is aangeduid op de kaart?",
          prompt: "Symbool " + entry.key,
          correct: entry.term,
          options: shuffle([entry.term].concat(sample(terms, 3, entry.term))),
          mapGroup: group,
          mapEntry: entry
        });
      });
    });
    return pool;
  }

  function renderSpeedPicker() {
    const wrap = el("div", { class: "view view-games" });
    wrap.appendChild(el("span", { class: "kicker" }, ["Spelletje"]));
    wrap.appendChild(el("h1", null, ["⏱️ Snelheidsronde"]));
    wrap.appendChild(el("p", { class: "module-intro" }, [
      "Je krijgt 60 seconden. Beantwoord zoveel mogelijk vragen juist. Een fout kost je geen punten, maar wel tijd. Kies een kaartblad en probeer je eigen record te breken!"
    ]));
    wrap.appendChild(el("p", { class: "topic-note" }, [
      "De snelheidsronde is om te spelen: ze telt niet mee voor wat je beheerst of voor Mijn fouten."
    ]));
    const grid = el("div", { class: "game-pick-grid" });
    PK_DATA.modules.forEach((mod) => {
      const rec = speedRecord(mod.id);
      grid.appendChild(
        el("a", { class: "game-pick", href: "#/snel/" + mod.id }, [
          el("span", { class: "game-pick-label" }, [mod.label]),
          el("strong", null, [mod.title]),
          el("span", { class: "game-pick-record" + (rec ? "" : " game-pick-record-empty") }, [rec ? "🏆 Record: " + rec : "Nog geen record"])
        ])
      );
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function renderSpeed(moduleId) {
    const mod = getModule(moduleId);
    if (!mod) return renderSpeedPicker();
    const wrap = el("div", { class: "view view-speed" });
    const pool = speedPool(moduleId);

    function intro() {
      wrap.innerHTML = "";
      const rec = speedRecord(moduleId);
      wrap.appendChild(el("span", { class: "kicker" }, [mod.label + " · Snelheidsronde"]));
      wrap.appendChild(el("h1", null, ["⏱️ " + mod.title]));
      wrap.appendChild(
        el("div", { class: "speed-intro-card" }, [
          el("div", { class: "speed-intro-big" }, [String(SPEED_SECONDS)]),
          el("p", { class: "speed-intro-unit" }, ["seconden"]),
          el("p", null, ["Zoveel mogelijk juist in één minuut. Bij een fout zie je kort het juiste antwoord."]),
          el("p", { class: "speed-intro-record" }, [rec ? "🏆 Jouw record: " + rec + " juist" : "Je hebt hier nog geen record. Zet er meteen één neer!"]),
          el("p", { class: "speed-intro-tip" }, ["Op een computer kan je ook antwoorden met de toetsen 1, 2, 3 en 4."]),
          el("button", { class: "btn btn-primary btn-hero", type: "button", onclick: countdown }, ["Start!"])
        ])
      );
      wrap.appendChild(el("a", { class: "btn", href: "#/module/" + moduleId }, ["← Terug naar " + mod.title]));
    }

    function countdown() {
      wrap.innerHTML = "";
      const num = el("div", { class: "speed-countdown", "aria-live": "assertive" }, ["3"]);
      wrap.appendChild(num);
      let n = 3;
      const t = setInterval(() => {
        n -= 1;
        if (n <= 0) { clearInterval(t); play(); return; }
        num.textContent = String(n);
        num.classList.remove("speed-countdown-tick");
        void num.offsetWidth;
        num.classList.add("speed-countdown-tick");
      }, reduceMotion() ? 400 : 700);
      onCleanup(() => clearInterval(t));
    }

    function play() {
      wrap.innerHTML = "";
      let score = 0;
      let asked = 0;
      let combo = 0;
      let bestCombo = 0;
      const misses = [];
      let queue = shuffle(pool);
      let qi = 0;
      let current = null;
      let locked = false;
      let finished = false;
      const endAt = Date.now() + SPEED_SECONDS * 1000;

      const timeFill = el("div", { class: "speed-time-fill" });
      const timeText = el("span", { class: "speed-time-text" }, [String(SPEED_SECONDS)]);
      const scoreText = el("span", { class: "speed-score" }, ["0"]);
      const comboText = el("span", { class: "speed-combo" }, []);
      wrap.appendChild(
        el("div", { class: "speed-hud" }, [
          el("div", { class: "speed-hud-row" }, [
            el("span", { class: "speed-hud-item" }, ["⏱️ ", timeText, " s"]),
            comboText,
            el("span", { class: "speed-hud-item" }, ["✅ ", scoreText])
          ]),
          el("div", { class: "speed-time-track" }, [timeFill])
        ])
      );
      const stage = el("div", { class: "quiz-stage speed-stage" });
      wrap.appendChild(stage);

      const tick = setInterval(() => {
        const left = endAt - Date.now();
        const pct = Math.max(0, left / (SPEED_SECONDS * 1000)) * 100;
        timeFill.style.width = pct + "%";
        timeText.textContent = String(Math.max(0, Math.ceil(left / 1000)));
        timeFill.classList.toggle("speed-time-low", left <= 10000);
        if (left <= 0) finish();
      }, 100);

      function onKey(e) {
        if (!current || locked) return;
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 4) {
          const btn = stage.querySelectorAll(".option-btn")[n - 1];
          if (btn) btn.click();
        }
      }
      document.addEventListener("keydown", onKey);
      let nextTimer = null;
      onCleanup(() => {
        clearInterval(tick);
        clearTimeout(nextTimer);
        document.removeEventListener("keydown", onKey);
      });

      function nextQuestion() {
        if (finished) return;
        if (qi >= queue.length) { queue = shuffle(pool); qi = 0; }
        current = queue[qi++];
        locked = false;
        stage.innerHTML = "";
        const q = current;
        const isMap = !!(q.mapGroup && window.PKMapExercise);
        const card = el("div", { class: "quiz-card speed-card" + (isMap ? " quiz-card-map" : "") });
        if (isMap) card.appendChild(window.PKMapExercise.buildMapDisplay(q.mapGroup, q.mapEntry, true));
        card.appendChild(el("span", { class: "flashcard-label" }, [q.label]));
        card.appendChild(el("p", { class: "quiz-prompt" }, [q.prompt]));
        const opts = el("div", { class: "quiz-options" });
        const feedback = el("p", { class: "quiz-feedback", "aria-live": "polite" });
        q.options.forEach((opt, i) => {
          opts.appendChild(
            el("button", { class: "option-btn", type: "button", onclick: (e) => answer(opt, e.currentTarget, opts, feedback) }, [
              el("span", { class: "speed-key", "aria-hidden": "true" }, [String(i + 1)]),
              opt
            ])
          );
        });
        card.appendChild(opts);
        card.appendChild(feedback);
        stage.appendChild(card);
      }

      function answer(opt, btn, opts, feedback) {
        if (locked || finished) return;
        locked = true;
        asked += 1;
        const right = opt === current.correct;
        Array.from(opts.children).forEach((b) => {
          b.disabled = true;
          if (b.lastChild && b.lastChild.textContent === current.correct) b.classList.add("option-correct");
        });
        if (right) {
          score += 1;
          combo += 1;
          bestCombo = Math.max(bestCombo, combo);
          scoreText.textContent = String(score);
          scoreText.classList.remove("speed-bump");
          void scoreText.offsetWidth;
          scoreText.classList.add("speed-bump");
          comboText.textContent = combo >= 3 ? "🔥 " + combo + " op rij" : "";
          nextTimer = setTimeout(nextQuestion, 280);
        } else {
          combo = 0;
          comboText.textContent = "";
          btn.classList.add("option-wrong");
          feedback.textContent = "❌ Fout, het juiste antwoord is " + current.correct + ".";
          misses.push({ prompt: current.mapEntry ? current.prompt + " (" + current.mapGroup.title.replace(/^Kaartoefening:\s*/, "") + ")" : current.prompt, correct: current.correct });
          nextTimer = setTimeout(nextQuestion, 1500);
        }
      }

      function finish() {
        if (finished) return;
        finished = true;
        clearInterval(tick);
        clearTimeout(nextTimer);
        document.removeEventListener("keydown", onKey);
        showResult(score, asked, bestCombo, misses);
      }

      nextQuestion();
    }

    function showResult(score, asked, bestCombo, misses) {
      wrap.innerHTML = "";
      const all = loadJSON(SPEED_KEY);
      const prev = all[moduleId] ? all[moduleId].best || 0 : 0;
      const isRecord = score > prev;
      if (isRecord) {
        all[moduleId] = { best: score, at: Date.now() };
        saveJSON(SPEED_KEY, all);
      }
      wrap.appendChild(el("span", { class: "kicker" }, [mod.label + " · Snelheidsronde"]));
      wrap.appendChild(el("h1", null, ["Tijd is om!"]));
      const card = el("div", { class: "speed-result" + (isRecord ? " speed-result-record" : "") }, [
        el("div", { class: "speed-intro-big" }, [String(score)]),
        el("p", { class: "speed-intro-unit" }, [score === 1 ? "juist antwoord" : "juiste antwoorden"]),
        el("p", { class: "speed-result-line" }, [
          isRecord
            ? (prev ? "🏆 Nieuw record! Je vorige record was " + prev + "." : "🏆 Je eerste record staat er!")
            : prev
              ? "Jouw record blijft " + prev + ". " + (prev - score <= 2 ? "Zo dichtbij, probeer nog eens!" : "Nog een poging?")
              : "Nog geen record. Probeer het nog eens!"
        ]),
        el("p", { class: "speed-result-meta" }, [
          asked + " " + (asked === 1 ? "vraag" : "vragen") + " beantwoord" + (bestCombo >= 3 ? " · langste reeks: " + bestCombo + " op rij" : "")
        ])
      ]);
      wrap.appendChild(card);
      if (isRecord && score > 0) burst();

      if (misses.length) {
        const seen = new Set();
        const list = el("ul", { class: "speed-miss-list" });
        misses.forEach((m) => {
          const k = m.prompt + "|" + m.correct;
          if (seen.has(k)) return;
          seen.add(k);
          list.appendChild(el("li", null, [el("span", null, [m.prompt]), el("strong", null, [m.correct])]));
        });
        wrap.appendChild(el("h2", { class: "section-heading" }, ["Dit had je fout, met het juiste antwoord"]));
        wrap.appendChild(list);
      }

      wrap.appendChild(
        el("div", { class: "result-actions speed-actions" }, [
          el("button", { class: "btn btn-primary", type: "button", onclick: countdown }, ["Nog een keer"]),
          el("a", { class: "btn", href: "#/module/" + moduleId }, ["Naar " + mod.title]),
          el("a", { class: "btn", href: "#/snel" }, ["Ander kaartblad"])
        ])
      );
    }

    intro();
    return wrap;
  }

  /* ======================================================================
     3. MEMORY (eerste graad)
     ====================================================================== */

  const MEMORY_KEY = "pk-memory-best-v1";

  const MEMORY_SETS = [
    {
      id: "provincies",
      title: "Provincies en hun hoofdstad",
      intro: "Zoek bij elke provincie de juiste provinciehoofdstad.",
      kind: "text",
      topicModule: "belgie",
      topicId: "provincies",
      aLabel: "Provincie",
      bLabel: "Hoofdstad",
      count: 10
    },
    {
      id: "provincies-kaart",
      title: "Waar ligt de provincie?",
      intro: "Zoek bij elk rondje op de kaart de juiste provincie.",
      kind: "map",
      groupId: "provincies-kaart",
      /* uitsnede (in % van de afbeelding) zodat België groot genoeg op het
         kaartje staat, zonder de legende en de lege kaders eromheen */
      crop: { x1: 27, x2: 97, y1: 3, y2: 97, w: 1392, h: 871 },
      count: 10
    },
    {
      id: "rivieren-wegen",
      title: "Rivieren en autowegen op de kaart",
      intro: "Zoek bij elk rondje op de kaart de juiste rivier of autoweg. Elke keer krijg je andere.",
      kind: "map",
      groupId: "rivieren-belgie-kaart",
      crop: { x1: 8, x2: 99, y1: 2, y2: 99, w: 1445, h: 965 },
      count: 8
    },
    {
      id: "buurlanden",
      title: "De buurlanden van België",
      intro: "Een snelle mini-memory: waar ligt elk buurland?",
      kind: "text",
      topicModule: "belgie",
      topicId: "buurlanden",
      aLabel: "Buurland",
      bLabel: "Ligt ten ...",
      count: 4
    }
  ];

  function memoryBest(setId) {
    const all = loadJSON(MEMORY_KEY);
    return all[setId] || null;
  }

  function memoryPairs(set) {
    if (set.kind === "text") {
      const mod = getModule(set.topicModule);
      const topic = mod && mod.topics.find((t) => t.id === set.topicId);
      if (!topic) return [];
      return shuffle(topic.items).slice(0, set.count).map((it, i) => ({
        id: i,
        a: { type: "text", text: it.term, label: set.aLabel },
        b: { type: "text", text: it.answer, label: set.bLabel }
      }));
    }
    const group = (window.PK_MAPS ? PK_MAPS.groups : []).find((g) => g.id === set.groupId);
    if (!group) return [];
    const entries = group.legend.filter((e) => typeof e.x === "number" && typeof e.y === "number");
    return shuffle(entries).slice(0, set.count).map((e, i) => ({
      id: i,
      a: { type: "map", group: group, entry: e, crop: set.crop, label: "Op de kaart" },
      b: { type: "text", text: e.term, label: "Naam" }
    }));
  }

  function renderMemoryPicker() {
    const wrap = el("div", { class: "view view-games" });
    wrap.appendChild(el("span", { class: "kicker" }, ["Spelletje · eerste graad"]));
    wrap.appendChild(el("h1", null, ["🃏 Memory"]));
    wrap.appendChild(el("p", { class: "module-intro" }, [
      "Draai telkens twee kaartjes om en zoek de paren die bij elkaar horen. Hoe minder beurten je nodig hebt, hoe beter!"
    ]));
    const grid = el("div", { class: "game-pick-grid" });
    MEMORY_SETS.forEach((set) => {
      const best = memoryBest(set.id);
      grid.appendChild(
        el("a", { class: "game-pick", href: "#/memory/" + set.id }, [
          el("span", { class: "game-pick-label" }, [set.count + " paren"]),
          el("strong", null, [set.title]),
          el("span", { class: "game-pick-desc" }, [set.intro]),
          el("span", { class: "game-pick-record" + (best ? "" : " game-pick-record-empty") }, [best ? "🏆 Record: " + best.moves + " beurten" : "Nog geen record"])
        ])
      );
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function memoryFace(side) {
    if (side.type === "map") {
      const c = side.crop || { x1: 0, x2: 100, y1: 0, y2: 100, w: 4, h: 3 };
      const cw = c.x2 - c.x1;
      const ch = c.y2 - c.y1;
      const imgStyle =
        "width:" + (10000 / cw).toFixed(2) + "%;" +
        "margin-left:" + (-100 * c.x1 / cw).toFixed(2) + "%;" +
        "margin-top:" + (-100 * c.y1 / cw * (c.h / c.w)).toFixed(2) + "%;";
      const dotStyle =
        "left:" + (100 * (side.entry.x - c.x1) / cw).toFixed(2) + "%;" +
        "top:" + (100 * (side.entry.y - c.y1) / ch).toFixed(2) + "%";
      const mapWrap = el("span", { class: "mem-map", style: "aspect-ratio:" + (cw * c.w).toFixed(0) + " / " + (ch * c.h).toFixed(0) }, [
        el("img", { src: side.group.image, alt: "", loading: "eager", draggable: "false", style: imgStyle }),
        el("span", { class: "mem-map-dot", style: dotStyle })
      ]);
      return [el("span", { class: "mem-face-label" }, [side.label]), mapWrap];
    }
    return [el("span", { class: "mem-face-label" }, [side.label]), el("span", { class: "mem-face-text" }, [side.text])];
  }

  function renderMemory(setId) {
    const set = MEMORY_SETS.find((s) => s.id === setId);
    if (!set) return renderMemoryPicker();
    const wrap = el("div", { class: "view view-memory" });

    function start() {
      cleanup();
      wrap.innerHTML = "";
      const pairs = memoryPairs(set);
      const cards = [];
      pairs.forEach((p) => {
        cards.push({ pair: p.id, side: p.a, kind: "a" });
        cards.push({ pair: p.id, side: p.b, kind: "b" });
      });
      const deck = shuffle(cards);

      let moves = 0;
      let found = 0;
      let open = [];
      let busy = false;
      let startedAt = null;

      const movesEl = el("strong", null, ["0"]);
      const foundEl = el("strong", null, ["0"]);
      const timeEl = el("strong", null, ["0:00"]);
      const best = memoryBest(set.id);

      wrap.appendChild(el("span", { class: "kicker" }, ["Memory · eerste graad"]));
      wrap.appendChild(el("h1", null, [set.title]));
      wrap.appendChild(el("p", { class: "module-intro" }, [set.intro]));
      wrap.appendChild(
        el("div", { class: "mem-hud" }, [
          el("span", null, ["Beurten: ", movesEl]),
          el("span", null, ["Paren: ", foundEl, " / " + pairs.length]),
          el("span", null, ["Tijd: ", timeEl]),
          best ? el("span", { class: "mem-hud-record" }, ["🏆 Record: " + best.moves]) : null
        ])
      );

      const grid = el("div", { class: "mem-grid mem-grid-" + deck.length + (set.kind === "map" ? " mem-grid-map" : "") });
      wrap.appendChild(grid);

      const timer = setInterval(() => {
        if (startedAt) timeEl.textContent = fmtTime(Date.now() - startedAt);
      }, 500);
      onCleanup(() => clearInterval(timer));
      let flipBack = null;
      onCleanup(() => clearTimeout(flipBack));

      deck.forEach((c, idx) => {
        const btn = el("button", {
          class: "mem-card mem-card-" + c.side.type + " mem-kind-" + c.kind,
          type: "button",
          "aria-label": "Kaartje " + (idx + 1) + ", omgedraaid"
        }, [
          el("span", { class: "mem-inner" }, [
            el("span", { class: "mem-back", "aria-hidden": "true" }, [el("span", { class: "mem-back-mark" }, ["?"])]),
            el("span", { class: "mem-front" }, memoryFace(c.side))
          ])
        ]);
        c.btn = btn;
        btn.addEventListener("click", () => flip(c));
        grid.appendChild(btn);
      });

      function describe(c) {
        return c.side.type === "map" ? "kaart met rondje (symbool " + c.side.entry.key + ")" : c.side.text;
      }

      function flip(c) {
        if (busy || c.done || open.indexOf(c) !== -1) return;
        if (!startedAt) startedAt = Date.now();
        c.btn.classList.add("mem-open");
        c.btn.setAttribute("aria-label", describe(c));
        open.push(c);
        if (open.length < 2) return;

        moves += 1;
        movesEl.textContent = String(moves);
        const [x, y] = open;
        if (x.pair === y.pair) {
          x.done = y.done = true;
          open = [];
          setTimeout(() => {
            [x, y].forEach((k) => {
              k.btn.classList.add("mem-done");
              k.btn.disabled = true;
              k.btn.setAttribute("aria-label", describe(k) + ", gevonden");
            });
          }, 250);
          found += 1;
          foundEl.textContent = String(found);
          if (found === pairs.length) setTimeout(win, 700);
        } else {
          busy = true;
          x.btn.classList.add("mem-miss");
          y.btn.classList.add("mem-miss");
          flipBack = setTimeout(() => {
            [x, y].forEach((k) => {
              k.btn.classList.remove("mem-open", "mem-miss");
              k.btn.setAttribute("aria-label", "Kaartje, omgedraaid");
            });
            open = [];
            busy = false;
          }, 1100);
        }
      }

      function win() {
        clearInterval(timer);
        const ms = Date.now() - (startedAt || Date.now());
        const all = loadJSON(MEMORY_KEY);
        const prev = all[set.id];
        const isRecord = !prev || moves < prev.moves || (moves === prev.moves && ms < prev.ms);
        if (isRecord) {
          all[set.id] = { moves: moves, ms: ms, at: Date.now() };
          saveJSON(MEMORY_KEY, all);
        }
        const perfect = moves === pairs.length;
        const result = el("div", { class: "speed-result mem-result" + (isRecord ? " speed-result-record" : "") }, [
          el("p", { class: "mem-result-title" }, [perfect ? "Perfect! Geen enkele misser!" : "Alle paren gevonden!"]),
          el("div", { class: "speed-intro-big" }, [String(moves)]),
          el("p", { class: "speed-intro-unit" }, ["beurten, in " + fmtTime(ms)]),
          el("p", { class: "speed-result-line" }, [
            isRecord
              ? (prev ? "🏆 Nieuw record! Vorige keer had je " + prev.moves + " beurten nodig." : "🏆 Je eerste record staat er!")
              : "Jouw record blijft " + prev.moves + " beurten."
          ]),
          el("div", { class: "result-actions" }, [
            el("button", { class: "btn btn-primary", type: "button", onclick: start }, ["Nog een keer"]),
            el("a", { class: "btn", href: "#/memory" }, ["Ander memory-spel"])
          ])
        ]);
        grid.insertAdjacentElement("beforebegin", result);
        result.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
        burst();
      }

      wrap.appendChild(
        el("div", { class: "result-actions mem-actions" }, [
          el("button", { class: "btn", type: "button", onclick: start }, ["↻ Opnieuw schudden"]),
          el("a", { class: "btn", href: "#/memory" }, ["← Ander memory-spel"])
        ])
      );
    }

    start();
    return wrap;
  }

  /* ======================================================================
     Blok "Spelletjes" (startpagina) en knoppen voor een kaartblad
     ====================================================================== */

  const EERSTE_GRAAD_IDS = ["hasselt", "belgie"];

  function homeGamesSection() {
    return el("section", { class: "games-panel" }, [
      el("h2", { class: "section-heading graad-heading" }, ["Even spelen"]),
      el("p", { class: "graad-note" }, ["Leuk als opwarmer of als beloning. Telt niet mee voor wat je beheerst."]),
      el("div", { class: "games-grid" }, [
        el("a", { class: "game-tile game-tile-speed", href: "#/snel" }, [
          el("span", { class: "game-tile-icon", "aria-hidden": "true" }, ["⏱️"]),
          el("strong", null, ["Snelheidsronde"]),
          el("span", null, ["60 seconden, zoveel mogelijk juist. Kan je je record breken?"])
        ]),
        el("a", { class: "game-tile game-tile-memory", href: "#/memory" }, [
          el("span", { class: "game-tile-icon", "aria-hidden": "true" }, ["🃏"]),
          el("strong", null, ["Memory"]),
          el("span", null, ["Zoek de paren: provincies, hoofdsteden, rivieren en autowegen. Voor de eerste graad."])
        ])
      ])
    ]);
  }

  function moduleGameButtons(moduleId) {
    const row = el("div", { class: "module-games" }, [
      el("a", { class: "btn btn-game", href: "#/snel/" + moduleId }, ["⏱️ Snelheidsronde" + (speedRecord(moduleId) ? " (record " + speedRecord(moduleId) + ")" : "")])
    ]);
    if (EERSTE_GRAAD_IDS.indexOf(moduleId) !== -1) {
      row.appendChild(el("a", { class: "btn btn-game", href: "#/memory" }, ["🃏 Memory"]));
    }
    return row;
  }

  window.PKGames = {
    cleanup: cleanup,
    renderSpeedPicker: renderSpeedPicker,
    renderSpeed: renderSpeed,
    renderMemoryPicker: renderMemoryPicker,
    renderMemory: renderMemory,
    memorySetTitle: function (id) {
      const s = MEMORY_SETS.find((x) => x.id === id);
      return s ? s.title : null;
    },
    medalRow: medalRow,
    medalPanel: medalPanel,
    checkNewMedals: checkNewMedals,
    homeGamesSection: homeGamesSection,
    moduleGameButtons: moduleGameButtons
  };
})();
