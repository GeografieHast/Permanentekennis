/* ==========================================================================
   Permanente Kennis — app.js
   Kleine, dependency-vrije studie-app: leerkaarten, meerkeuze en invultoets.
   ========================================================================== */

(function () {
  "use strict";

  const root = document.getElementById("app");
  const PROGRESS_KEY = "pk-progress-v1";

  /* ---------- helpers ---------------------------------------------------- */

  function norm(str) {
    return String(str || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents
      .replace(/\s+/g, " ");
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
    const pool = arr.filter((x) => x !== exclude);
    return shuffle(pool).slice(0, n);
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === null || v === undefined) continue;
        if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k.startsWith("on") && typeof v === "function") {
          node.addEventListener(k.slice(2), v);
        } else if (k === "disabled") {
          if (v !== false) node.disabled = true;
        } else node.setAttribute(k, v);
      }
    }
    (children || []).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveProgress(p) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    } catch (e) {
      /* privé-modus of vol geheugen: negeren, de app blijft werken */
    }
  }
  function recordScore(topicId, correct, total) {
    const p = loadProgress();
    const prev = p[topicId] || { best: 0, attempts: 0 };
    const pct = total ? Math.round((correct / total) * 100) : 0;
    p[topicId] = {
      best: Math.max(prev.best, pct),
      attempts: prev.attempts + 1,
      last: pct
    };
    saveProgress(p);
  }
  function topicMastery(topicId) {
    const p = loadProgress();
    return p[topicId] ? p[topicId].best : null;
  }

  /* ---------- data lookup ------------------------------------------------- */

  function getModule(moduleId) {
    return PK_DATA.modules.find((m) => m.id === moduleId);
  }
  function getTopic(moduleId, topicId) {
    const mod = getModule(moduleId);
    return mod && mod.topics.find((t) => t.id === topicId);
  }
  function topicAnswerPool(topic) {
    if (topic.kind === "category") return topic.categories.slice();
    return topic.items.map((i) => i.answer);
  }
  function topicTermPool(topic) {
    return topic.items.map((i) => i.term);
  }

  /* ---------- router ------------------------------------------------------- */

  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    const parts = h.split("/").filter(Boolean);
    return {
      view: parts[0] || "home",
      moduleId: parts[1],
      topicId: parts[2],
      mode: parts[3],
      reverse: parts[4] === "omgekeerd"
    };
  }

  function navigate(path) {
    location.hash = path;
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", render);

  function mapGroupsFor(moduleId) {
    return (window.PK_MAPS ? window.PK_MAPS.groups : []).filter((g) => g.moduleId === moduleId);
  }
  function getMapGroup(groupId) {
    return (window.PK_MAPS ? window.PK_MAPS.groups : []).find((g) => g.id === groupId);
  }

  function render() {
    if (window.PKMapExercise) window.PKMapExercise.cleanup();
    const r = parseHash();
    root.innerHTML = "";
    root.appendChild(el("div", { class: "crumbs" }, breadcrumbs(r)));

    if (r.view === "home") root.appendChild(renderHome());
    else if (r.view === "module" && r.moduleId && !r.topicId)
      root.appendChild(renderModule(r.moduleId));
    else if (r.view === "module" && r.moduleId && r.topicId && !r.mode)
      root.appendChild(renderTopicIntro(r.moduleId, r.topicId));
    else if (r.view === "module" && r.moduleId && r.topicId && r.mode === "kaarten")
      root.appendChild(renderFlashcards(r.moduleId, r.topicId, r.reverse));
    else if (r.view === "module" && r.moduleId && r.topicId && r.mode === "meerkeuze")
      root.appendChild(renderQuiz(r.moduleId, r.topicId, "mc", r.reverse));
    else if (r.view === "module" && r.moduleId && r.topicId && r.mode === "juistfout")
      root.appendChild(renderQuiz(r.moduleId, r.topicId, "tf", r.reverse));
    else if (r.view === "module" && r.moduleId && r.topicId && r.mode === "invultoets")
      root.appendChild(renderQuiz(r.moduleId, r.topicId, "type", r.reverse));
    else if (r.view === "module" && r.moduleId && r.topicId && r.mode === "tabel")
      root.appendChild(renderTable(r.moduleId, r.topicId, r.reverse));
    else if (r.view === "overhoring" && r.moduleId)
      root.appendChild(renderModuleQuiz(r.moduleId));
    else if (r.view === "kaart" && r.moduleId && r.topicId && r.mode) {
      const group = getMapGroup(r.topicId);
      if (group) renderMapView(r.moduleId, group, r.mode);
      else root.appendChild(renderHome());
    } else root.appendChild(renderHome());

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function renderMapView(moduleId, group, mode) {
    const wrap = el("div", { class: "view view-map" });
    root.appendChild(wrap);
    if (mode === "start") {
      wrap.appendChild(el("h1", null, [group.title]));
      wrap.appendChild(el("p", { class: "module-intro" }, [group.instructions]));
      const base = "#/kaart/" + moduleId + "/" + group.id + "/";
      const modes = el("div", { class: "mode-grid" });
      modes.appendChild(modeCard(base + "leer", cardsIconSVG(), "Kaart bekijken", "Alle plaatsen gelabeld — rustig instuderen."));
      modes.appendChild(modeCard(base + "wijs", pencilIconSVG(), "Wijs aan", "Klik zelf op de juiste plaats op de kaart."));
      modes.appendChild(modeCard(base + "mc", checkIconSVG(), "Meerkeuze op de kaart", "Een plaats is gemarkeerd — kies de juiste naam."));
      modes.appendChild(modeCard(base + "nummer", tableIconSVG(), "Genummerde kaart (zoals op je toets)", "Elk nummer op de kaart is een plaats — vul de naam" + (group.secondaryLabel ? " én " + group.secondaryLabel.toLowerCase() : "") + " in."));
      wrap.appendChild(modes);
      const m = window.PKMapExercise ? window.PKMapExercise.mastery("map-" + group.id + "-wijs") : null;
      if (m != null) wrap.appendChild(el("p", { class: "score-note" }, ["Je beste score bij 'Wijs aan': " + m + "%."]));
      return;
    }
    window.PKMapExercise.render(wrap, group, mode);
  }

  function breadcrumbs(r) {
    const parts = [el("a", { href: "#/home" }, ["Start"])];
    if (r.view === "home") return parts;
    const mod = r.moduleId ? getModule(r.moduleId) : null;
    if (mod) {
      parts.push(el("span", { class: "sep" }, ["›"]));
      parts.push(el("a", { href: "#/module/" + mod.id }, [mod.title]));
    }
    if (r.topicId) {
      const topic = getTopic(r.moduleId, r.topicId);
      if (topic) {
        parts.push(el("span", { class: "sep" }, ["›"]));
        parts.push(el("span", { class: "current" }, [topic.title]));
      }
    } else if (r.view === "overhoring" && mod) {
      parts.push(el("span", { class: "sep" }, ["›"]));
      parts.push(el("span", { class: "current" }, ["Grote overhoring"]));
    }
    return parts;
  }

  /* ---------- HOME ---------------------------------------------------------- */

  function renderHome() {
    const wrap = el("div", { class: "view view-home" });

    wrap.appendChild(
      el("section", { class: "hero" }, [
        el("div", { class: "hero-media" }, [
          el("img", {
            src: "assets/img/hast-campus.jpg",
            alt: "Campus Hast, Kleine Breemstraat 7, Hasselt"
          })
        ]),
        el("div", { class: "hero-compass", "aria-hidden": "true" }, [compassSVG()]),
        el("div", { class: "hero-content" }, [
          el("h1", null, ["Permanente Kennis"]),
          el("p", { class: "hero-sub" }, [
            "Aardrijkskunde — studeer je referentiekaarten in met leerkaarten, meerkeuzevragen, invultoetsen én echte kaartoefeningen."
          ])
        ])
      ])
    );

    const grid = el("div", { class: "sheet-grid" });
    PK_DATA.modules.forEach((mod) => {
      const count = mod.topics.length + mapGroupsFor(mod.id).length;
      grid.appendChild(
        el("a", { class: "sheet-card", href: "#/module/" + mod.id }, [
          el("span", { class: "sheet-label" }, [mod.label]),
          el("h2", null, [mod.title]),
          el("p", { class: "sheet-subtitle" }, [mod.subtitle]),
          el("p", { class: "sheet-intro" }, [mod.intro]),
          el("span", { class: "sheet-meta" }, [count + " onderdelen · openen →"])
        ])
      );
    });
    wrap.appendChild(grid);

    wrap.appendChild(
      el("section", { class: "legend-block" }, [
        el("h3", null, ["Hoe werkt het?"]),
        el("div", { class: "legend-row" }, [
          legendItem(mapPinIconSVG(), "Kaartoefening", "Klik zelf de juiste plaats aan op een echte kaart."),
          legendItem(cardsIconSVG(), "Leerkaarten", "Klik een kaart om en toont het antwoord."),
          legendItem(checkIconSVG(), "Meerkeuze", "Kies het juiste antwoord uit vier opties."),
          legendItem(tfIconSVG(), "Juist of fout", "Beoordeel een voorgesteld antwoord, net als bij juist/fout-vragen."),
          legendItem(pencilIconSVG(), "Invultoets", "Typ het antwoord zelf, net als op een toets."),
          legendItem(tableIconSVG(), "Tabeltoets", "Vul de volledige tabel in en verbeter in één keer.")
        ]),
        el("p", { class: "legend-note" }, [
          "Bij de meeste onderdelen kan je ook omgekeerd oefenen — bv. hoofdstad → land in plaats van land → hoofdstad."
        ])
      ])
    );

    return wrap;
  }

  function legendItem(icon, title, text) {
    return el("div", { class: "legend-item" }, [
      el("div", { class: "legend-icon" }, [icon]),
      el("div", null, [el("strong", null, [title]), el("p", null, [text])])
    ]);
  }

  /* ---------- MODULE OVERVIEW ------------------------------------------------ */

  function renderModule(moduleId) {
    const mod = getModule(moduleId);
    const wrap = el("div", { class: "view view-module" });
    wrap.appendChild(el("span", { class: "kicker" }, [mod.label]));
    wrap.appendChild(el("h1", null, [mod.title]));
    wrap.appendChild(el("p", { class: "module-intro" }, [mod.intro]));

    const mapGroups = mapGroupsFor(moduleId);
    if (mapGroups.length) {
      wrap.appendChild(el("h2", { class: "section-heading" }, ["Kaartoefeningen"]));
      const mapList = el("div", { class: "topic-list" });
      mapGroups.forEach((g) => {
        const m = window.PKMapExercise ? window.PKMapExercise.mastery("map-" + g.id + "-wijs") : null;
        const count = (g.items ? g.items.length : 0) + (g.lines ? g.lines.length : 0);
        mapList.appendChild(
          el("a", { class: "topic-row", href: "#/kaart/" + moduleId + "/" + g.id + "/start" }, [
            el("div", { class: "topic-kind-dot kind-map", "aria-hidden": "true" }, []),
            el("div", { class: "topic-row-main" }, [
              el("h3", null, [g.title.replace(/^Kaartoefening:\s*/, "")]),
              el("p", null, [count + " plaatsen op de kaart" + (m != null ? " · beste score " + m + "%" : "")])
            ]),
            masteryBar(m)
          ])
        );
      });
      wrap.appendChild(mapList);
      wrap.appendChild(el("h2", { class: "section-heading" }, ["Woordjes en feiten"]));
    }

    const list = el("div", { class: "topic-list" });
    mod.topics.forEach((topic) => {
      const mastery = topicMastery(topic.id);
      const row = el("a", { class: "topic-row", href: "#/module/" + moduleId + "/" + topic.id }, [
        el("div", { class: "topic-kind-dot kind-" + topic.kind, "aria-hidden": "true" }, []),
        el("div", { class: "topic-row-main" }, [
          el("h3", null, [topic.title]),
          el("p", null, [topic.items.length + " items" + (mastery != null ? " · beste score " + mastery + "%" : "")])
        ]),
        masteryBar(mastery)
      ]);
      list.appendChild(row);
    });
    wrap.appendChild(list);

    wrap.appendChild(
      el("a", { class: "btn btn-primary big-cta", href: "#/overhoring/" + moduleId }, [
        "Grote overhoring — mix van alle onderdelen"
      ])
    );

    return wrap;
  }

  function masteryBar(pct) {
    const bar = el("div", { class: "mastery", title: pct != null ? pct + "% beste score" : "Nog niet geoefend" });
    const fill = el("div", { class: "mastery-fill", style: "width:" + (pct || 0) + "%" });
    bar.appendChild(fill);
    return bar;
  }

  /* ---------- TOPIC INTRO ---------------------------------------------------- */

  function renderTopicIntro(moduleId, topicId) {
    const topic = getTopic(moduleId, topicId);
    const wrap = el("div", { class: "view view-topic-intro" });
    wrap.appendChild(el("h1", null, [topic.title]));

    const canReverse = topic.kind === "pair";
    const descFor = (reverse) =>
      topic.kind === "category"
        ? "Herken je tot welke soort elke naam behoort? (" + topic.categories.join(", ") + ")"
        : reverse
        ? topic.answerLabel + " → " + topic.promptLabel
        : topic.promptLabel + " → " + topic.answerLabel;

    const descEl = el("p", { class: "module-intro" }, [descFor(false)]);
    wrap.appendChild(descEl);

    if (topic.note) {
      wrap.appendChild(el("p", { class: "topic-note" }, [topic.note]));
    }

    let reverse = false;

    if (canReverse) {
      const toggle = el("div", { class: "direction-toggle", role: "group", "aria-label": "Oefenrichting" });
      const btnNormal = el(
        "button",
        { class: "dir-btn dir-btn-active", type: "button", onclick: () => setDir(false) },
        [topic.promptLabel + " → " + topic.answerLabel]
      );
      const btnReverse = el(
        "button",
        { class: "dir-btn", type: "button", onclick: () => setDir(true) },
        [topic.answerLabel + " → " + topic.promptLabel]
      );
      toggle.appendChild(btnNormal);
      toggle.appendChild(btnReverse);
      wrap.appendChild(toggle);

      function setDir(v) {
        reverse = v;
        descEl.textContent = descFor(reverse);
        btnNormal.classList.toggle("dir-btn-active", !reverse);
        btnReverse.classList.toggle("dir-btn-active", reverse);
        updateModeLinks();
      }
    }

    const modes = el("div", { class: "mode-grid" });
    wrap.appendChild(modes);

    function updateModeLinks() {
      modes.innerHTML = "";
      const suffix = reverse ? "/omgekeerd" : "";
      const base = "#/module/" + moduleId + "/" + topicId + "/";
      modes.appendChild(
        modeCard(base + "kaarten" + suffix, cardsIconSVG(), "Leerkaarten", "Rustig instuderen: kaart tonen, kaart omdraaien.")
      );
      modes.appendChild(
        modeCard(base + "meerkeuze" + suffix, checkIconSVG(), "Meerkeuze", "Kies telkens het juiste antwoord uit vier opties.")
      );
      modes.appendChild(
        modeCard(base + "juistfout" + suffix, tfIconSVG(), "Juist of fout", "Beoordeel of het voorgestelde antwoord klopt.")
      );
      if (topic.allowTyping !== false) {
        modes.appendChild(
          modeCard(base + "invultoets" + suffix, pencilIconSVG(), "Invultoets", "Typ het antwoord zelf — hoofdletters en accenten maken niet uit.")
        );
        modes.appendChild(
          modeCard(base + "tabel" + suffix, tableIconSVG(), "Tabeltoets", "Vul de hele tabel in en verbeter in één keer, zoals op papier.")
        );
      }
    }
    updateModeLinks();

    const mastery = topicMastery(topicId);
    if (mastery != null) {
      wrap.appendChild(el("p", { class: "score-note" }, ["Je beste score op deze onderdeel tot nu toe: " + mastery + "%."]));
    }

    return wrap;
  }

  function modeCard(href, icon, title, text) {
    return el("a", { class: "mode-card", href: href }, [
      el("div", { class: "mode-icon" }, [icon]),
      el("h3", null, [title]),
      el("p", null, [text])
    ]);
  }

  /* ---------- FLASHCARDS ------------------------------------------------------ */

  function faceFor(topic, item, reverse) {
    if (topic.kind === "category") {
      return { front: item.term, back: item.category, frontLabel: "Welke soort?", backLabel: "Soort" };
    }
    if (reverse) {
      return { front: item.answer, back: item.term, frontLabel: topic.answerLabel, backLabel: topic.promptLabel };
    }
    return { front: item.term, back: item.answer, frontLabel: topic.promptLabel, backLabel: topic.answerLabel };
  }

  function renderFlashcards(moduleId, topicId, reverse) {
    const topic = getTopic(moduleId, topicId);
    const order = shuffle(topic.items.map((_, i) => i));
    let pos = 0;

    const wrap = el("div", { class: "view view-study" });
    wrap.appendChild(el("h1", null, [topic.title + (reverse ? " (omgekeerd)" : "")]));
    wrap.appendChild(el("p", { class: "study-hint" }, ["Klik op de kaart om het antwoord te zien."]));

    const progress = el("div", { class: "progress-dots" });
    const cardHolder = el("div", { class: "card-stage" });
    const nav = el("div", { class: "study-nav" });

    wrap.appendChild(progress);
    wrap.appendChild(cardHolder);
    wrap.appendChild(nav);

    function draw() {
      cardHolder.innerHTML = "";
      progress.innerHTML = "";
      const idx = order[pos];
      const item = topic.items[idx];
      const face = faceFor(topic, item, reverse);

      order.forEach((_, i) => {
        progress.appendChild(el("span", { class: "dot" + (i === pos ? " dot-active" : "") }));
      });

      const flip = el("button", { class: "flashcard", type: "button", "aria-label": "Klik om om te draaien" }, [
        el("div", { class: "flashcard-inner" }, [
          el("div", { class: "flashcard-face flashcard-front" }, [
            el("span", { class: "flashcard-label" }, [face.frontLabel]),
            el("p", null, [face.front])
          ]),
          el("div", { class: "flashcard-face flashcard-back" }, [
            el("span", { class: "flashcard-label" }, [face.backLabel]),
            el("p", null, [face.back])
          ])
        ])
      ]);
      flip.addEventListener("click", () => flip.classList.toggle("is-flipped"));
      cardHolder.appendChild(flip);

      nav.innerHTML = "";
      nav.appendChild(
        el("button", { class: "btn", type: "button", disabled: pos === 0 ? "" : null, onclick: () => { pos--; draw(); } }, ["← Vorige"])
      );
      nav.appendChild(el("span", { class: "study-count" }, [pos + 1 + " / " + order.length]));
      nav.appendChild(
        el(
          "button",
          {
            class: "btn btn-primary",
            type: "button",
            onclick: () => {
              if (pos < order.length - 1) {
                pos++;
                draw();
              } else {
                order.splice(0, order.length, ...shuffle(topic.items.map((_, i) => i)));
                pos = 0;
                draw();
              }
            }
          },
          [pos === order.length - 1 ? "Opnieuw schudden ↻" : "Volgende →"]
        )
      );
    }

    draw();
    return wrap;
  }

  /* ---------- QUIZ (meerkeuze / juist-fout / invultoets) ------------------------------------ */

  function buildQuestion(topic, item, reverse) {
    if (topic.kind === "category") {
      return {
        prompt: item.term,
        promptLabel: "Welke soort is dit?",
        correct: item.category,
        options: shuffle(topic.categories)
      };
    }
    if (reverse) {
      const distractors = sample(topicTermPool(topic), 3, item.term);
      return {
        prompt: item.answer,
        promptLabel: topic.answerLabel,
        correct: item.term,
        options: shuffle([item.term, ...distractors])
      };
    }
    const distractors = sample(topicAnswerPool(topic), 3, item.answer);
    return {
      prompt: item.term,
      promptLabel: topic.promptLabel,
      correct: item.answer,
      options: shuffle([item.answer, ...distractors])
    };
  }

  function buildTF(topic, item, reverse) {
    const face = faceFor(topic, item, reverse);
    const isTrue = Math.random() < 0.5;
    let shown = face.back;
    if (!isTrue) {
      const pool = topic.kind === "category" ? topicAnswerPool(topic) : reverse ? topicTermPool(topic) : topicAnswerPool(topic);
      const wrongOptions = sample(pool, 1, face.back);
      shown = wrongOptions[0] || face.back;
    }
    return {
      prompt: face.front,
      promptLabel: face.frontLabel,
      statementLabel: face.backLabel,
      statement: shown,
      isTrue: isTrue,
      correct: face.back
    };
  }

  function renderQuiz(moduleId, topicId, kind, reverse) {
    const topic = getTopic(moduleId, topicId);
    return runQuiz({
      title: topic.title + (reverse ? " (omgekeerd)" : ""),
      backHref: "#/module/" + moduleId + "/" + topicId,
      items: shuffle(topic.items),
      questionFor: (item) => (kind === "tf" ? buildTF(topic, item, reverse) : buildQuestion(topic, item, reverse)),
      kind: kind,
      onFinish: (correct, total) => recordScore(topicId, correct, total)
    });
  }

  function renderModuleQuiz(moduleId) {
    const mod = getModule(moduleId);
    const pool = [];
    mod.topics.forEach((topic) => {
      topic.items.forEach((item) => pool.push({ topic, item }));
    });
    const items = shuffle(pool).slice(0, Math.min(20, pool.length));

    return runQuiz({
      title: "Grote overhoring — " + mod.title,
      backHref: "#/module/" + moduleId,
      items: items,
      questionFor: (entry) => buildQuestion(entry.topic, entry.item),
      kind: "mc",
      onFinish: () => {}
    });
  }

  function runQuiz(cfg) {
    const wrap = el("div", { class: "view view-quiz" });
    wrap.appendChild(el("h1", null, [cfg.title]));

    const scoreEl = el("p", { class: "quiz-score" }, []);
    const progress = el("div", { class: "progress-dots" });
    const stage = el("div", { class: "quiz-stage" });

    wrap.appendChild(scoreEl);
    wrap.appendChild(progress);
    wrap.appendChild(stage);

    let pos = 0;
    let correctCount = 0;
    let answered = false;
    const total = cfg.items.length;
    const missedTitles = [];

    function updateHeader() {
      scoreEl.textContent = "Score: " + correctCount + " / " + Math.min(pos, total) + (pos >= total ? " · klaar" : "");
      progress.innerHTML = "";
      cfg.items.forEach((_, i) => {
        let cls = "dot";
        if (i < pos) cls += " dot-done";
        if (i === pos) cls += " dot-active";
        progress.appendChild(el("span", { class: cls }));
      });
    }

    function finish() {
      cfg.onFinish(correctCount, total);
      const pct = total ? Math.round((correctCount / total) * 100) : 0;
      stage.innerHTML = "";
      const msg =
        pct >= 90 ? "Uitstekend, dit zit goed vast." : pct >= 70 ? "Goed bezig — nog even bijschaven." : "Blijf oefenen, je gaat vooruit.";
      const result = el("div", { class: "quiz-result" }, [
        el("p", { class: "result-big" }, [pct + "%"]),
        el("p", { class: "result-msg" }, [msg + " (" + correctCount + " van de " + total + " juist)"])
      ]);
      if (missedTitles.length) {
        const list = el("ul", { class: "missed-list" });
        [...new Set(missedTitles)].forEach((t) => list.appendChild(el("li", null, [t])));
        result.appendChild(el("p", { class: "missed-heading" }, ["Nog eens bekijken:"]));
        result.appendChild(list);
      }
      const actions = el("div", { class: "quiz-actions" });
      actions.appendChild(
        el("button", { class: "btn btn-primary", type: "button", onclick: () => { pos = 0; correctCount = 0; missedTitles.length = 0; answered = false; draw(); } }, [
          "Nog een keer"
        ])
      );
      actions.appendChild(el("a", { class: "btn", href: cfg.backHref }, ["Terug"]));
      result.appendChild(actions);
      stage.appendChild(result);
    }

    function draw() {
      updateHeader();
      stage.innerHTML = "";

      if (pos >= total) {
        finish();
        return;
      }

      answered = false;
      const entry = cfg.items[pos];
      const q = cfg.questionFor(entry);
      const topicTitle = entry.topic ? entry.topic.title : cfg.title;

      const card = el("div", { class: "quiz-card" }, [
        el("span", { class: "flashcard-label" }, [q.promptLabel]),
        el("p", { class: "quiz-prompt" }, [q.prompt])
      ]);

      const feedback = el("p", { class: "quiz-feedback", "aria-live": "polite" });

      if (cfg.kind === "mc") {
        const optionsWrap = el("div", { class: "quiz-options" });
        q.options.forEach((opt) => {
          const btn = el(
            "button",
            {
              class: "option-btn",
              type: "button",
              onclick: () => {
                if (answered) return;
                answered = true;
                const isRight = opt === q.correct;
                if (isRight) correctCount++;
                else missedTitles.push(topicTitle);
                Array.from(optionsWrap.children).forEach((b) => {
                  b.disabled = true;
                  if (b.textContent === q.correct) b.classList.add("option-correct");
                });
                if (!isRight) btn.classList.add("option-wrong");
                feedback.textContent = isRight ? "Juist!" : "Niet juist. Juiste antwoord: " + q.correct;
                feedback.className = "quiz-feedback " + (isRight ? "feedback-good" : "feedback-bad");
                showNext();
              }
            },
            [opt]
          );
          optionsWrap.appendChild(btn);
        });
        card.appendChild(optionsWrap);
      } else if (cfg.kind === "tf") {
        card.appendChild(
          el("p", { class: "tf-statement" }, [
            el("span", { class: "flashcard-label" }, [q.statementLabel]),
            el("br"),
            q.statement
          ])
        );
        const tfWrap = el("div", { class: "tf-buttons" });
        function answerTF(choice) {
          if (answered) return;
          answered = true;
          const isRight = choice === q.isTrue;
          if (isRight) correctCount++;
          else missedTitles.push(topicTitle);
          Array.from(tfWrap.children).forEach((b) => (b.disabled = true));
          feedback.textContent =
            (isRight ? "Juist! " : "Niet juist. ") + "Correct antwoord: " + q.correct + (q.isTrue ? "" : " (het voorstel klopte niet)");
          feedback.className = "quiz-feedback " + (isRight ? "feedback-good" : "feedback-bad");
          showNext();
        }
        tfWrap.appendChild(el("button", { class: "option-btn tf-btn", type: "button", onclick: () => answerTF(true) }, ["Juist"]));
        tfWrap.appendChild(el("button", { class: "option-btn tf-btn", type: "button", onclick: () => answerTF(false) }, ["Fout"]));
        card.appendChild(tfWrap);
      } else {
        const input = el("input", {
          class: "quiz-input",
          type: "text",
          autocomplete: "off",
          autocapitalize: "off",
          spellcheck: "false",
          placeholder: "Typ je antwoord…"
        });
        const submit = el("button", { class: "btn btn-primary", type: "button" }, ["Controleer"]);
        function checkAnswer() {
          if (answered) return;
          answered = true;
          const isRight = norm(input.value) === norm(q.correct);
          input.disabled = true;
          submit.disabled = true;
          if (isRight) correctCount++;
          else missedTitles.push(topicTitle);
          input.classList.add(isRight ? "input-correct" : "input-wrong");
          feedback.textContent = isRight ? "Juist!" : "Juiste antwoord: " + q.correct;
          feedback.className = "quiz-feedback " + (isRight ? "feedback-good" : "feedback-bad");
          showNext();
        }
        submit.addEventListener("click", checkAnswer);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") checkAnswer();
        });
        const row = el("div", { class: "quiz-input-row" }, [input, submit]);
        card.appendChild(row);
        setTimeout(() => input.focus(), 0);
      }

      card.appendChild(feedback);
      const nextHolder = el("div", { class: "quiz-next-holder" });
      card.appendChild(nextHolder);

      function showNext() {
        const isLast = pos === total - 1;
        const btn = el(
          "button",
          {
            class: "btn btn-primary",
            type: "button",
            onclick: () => {
              pos++;
              draw();
            }
          },
          [isLast ? "Resultaat bekijken →" : "Volgende vraag →"]
        );
        nextHolder.appendChild(btn);
        btn.focus();
      }

      stage.appendChild(card);
    }

    draw();
    return wrap;
  }

  /* ---------- TABELTOETS (vul de hele tabel in) ------------------------------------ */

  function renderTable(moduleId, topicId, reverse) {
    const topic = getTopic(moduleId, topicId);
    const items = shuffle(topic.items);
    const wrap = el("div", { class: "view view-table" });
    wrap.appendChild(el("h1", null, [topic.title + (reverse ? " (omgekeerd)" : "")]));
    wrap.appendChild(
      el("p", { class: "study-hint" }, ["Vul zoveel mogelijk in en klik dan op \u201cVerbeteren\u201d — net als bij een schriftelijke toets."])
    );

    const frontLabel = topic.kind === "category" ? "Naam" : reverse ? topic.answerLabel : topic.promptLabel;
    const backLabel = topic.kind === "category" ? "Soort" : reverse ? topic.promptLabel : topic.answerLabel;

    const rows = items.map((item) => {
      const face = faceFor(topic, item, reverse);
      return { front: face.front, correct: face.back };
    });

    const tableWrap = el("div", { class: "table-wrap" });
    const table = el("table", { class: "quiz-table" });
    table.appendChild(
      el("thead", null, [el("tr", null, [el("th", null, [frontLabel]), el("th", null, [backLabel])])])
    );
    const tbody = el("tbody");
    const inputs = [];
    rows.forEach((row, i) => {
      const input = el("input", {
        class: "quiz-input table-input",
        type: "text",
        autocomplete: "off",
        autocapitalize: "off",
        spellcheck: "false"
      });
      inputs.push(input);
      const tr = el("tr", { id: "row-" + i }, [
        el("td", { class: "table-term" }, [row.front]),
        el("td", null, [input])
      ]);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrap.appendChild(tableWrap);

    const feedback = el("p", { class: "quiz-feedback", "aria-live": "polite" });
    const actions = el("div", { class: "quiz-actions" });
    const checkBtn = el("button", { class: "btn btn-primary", type: "button" }, ["Verbeteren"]);
    actions.appendChild(checkBtn);
    wrap.appendChild(feedback);
    wrap.appendChild(actions);

    checkBtn.addEventListener("click", () => {
      let correctCount = 0;
      rows.forEach((row, i) => {
        const tr = document.getElementById("row-" + i);
        const input = inputs[i];
        const isRight = norm(input.value) === norm(row.correct);
        input.disabled = true;
        tr.classList.add(isRight ? "row-correct" : "row-wrong");
        if (isRight) {
          correctCount++;
        } else {
          tr.appendChild(el("td", { class: "table-correction" }, [row.correct]));
        }
      });
      checkBtn.disabled = true;
      const pct = rows.length ? Math.round((correctCount / rows.length) * 100) : 0;
      feedback.textContent = correctCount + " van de " + rows.length + " juist (" + pct + "%).";
      feedback.className = "quiz-feedback " + (pct >= 70 ? "feedback-good" : "feedback-bad");
      recordScore(topicId, correctCount, rows.length);
      actions.appendChild(
        el("a", { class: "btn", href: "#/module/" + moduleId + "/" + topicId }, ["Terug"])
      );
    });

    return wrap;
  }

  /* ---------- icons (inline SVG, currentColor) --------------------------------- */

  function compassSVG() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 120 120");
    s.innerHTML =
      '<circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="60" cy="60" r="3" fill="currentColor"/>' +
      '<path d="M60 12 L68 56 L60 60 L52 56 Z" fill="currentColor"/>' +
      '<path d="M60 108 L68 64 L60 60 L52 64 Z" fill="currentColor" opacity="0.35"/>' +
      '<text x="60" y="26" text-anchor="middle" font-size="10" fill="currentColor" font-family="inherit">N</text>';
    return s;
  }
  function svgIcon(paths) {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.innerHTML = paths;
    return s;
  }
  function cardsIconSVG() {
    return svgIcon(
      '<rect x="3" y="6" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
        '<rect x="7" y="2" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>'
    );
  }
  function checkIconSVG() {
    return svgIcon(
      '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
        '<path d="M8 12.5l2.5 2.5L16 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
    );
  }
  function pencilIconSVG() {
    return svgIcon(
      '<path d="M4 20l1-4.2L15.5 5.3a1.5 1.5 0 012.1 0l1.1 1.1a1.5 1.5 0 010 2.1L8.2 19 4 20z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
    );
  }
  function tfIconSVG() {
    return svgIcon(
      '<path d="M4 8l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M13 16l4 4m0-4l-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
    );
  }
  function tableIconSVG() {
    return svgIcon(
      '<rect x="3" y="4" width="18" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
        '<line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.6"/>' +
        '<line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="1.6"/>'
    );
  }
  function mapPinIconSVG() {
    return svgIcon(
      '<path d="M12 21s7-7.1 7-12a7 7 0 10-14 0c0 4.9 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<circle cx="12" cy="9" r="2.4" fill="currentColor"/>'
    );
  }
})();
