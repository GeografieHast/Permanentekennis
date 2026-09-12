/* ==========================================================================
   Permanente Kennis — mapquiz.js
   Kaartoefeningen op de echte, genummerde kaart uit de bundel: de leerling
   zoekt het nummer/de letter/het Romeins cijfer zelf op de kaart (zoals op
   papier) en zegt wat het is. Geen klikcoördinaten — dus geen risico dat
   de kaart een verkeerde plaats "aanwijst". De legende komt rechtstreeks
   uit de antwoordtabellen van de bundel.
   Modi: "bekijk" (kaart + volledige legende, om te studeren),
   "meerkeuze" (per symbool kiezen uit 4 opties),
   "typ" (per symbool zelf typen).
   ========================================================================== */

(function () {
  "use strict";

  const PROGRESS_KEY = "pk-progress-v1";

  function norm(str) {
    return String(str || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
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
    return shuffle(arr.filter((x) => x !== exclude)).slice(0, n);
  }
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === null || v === undefined) continue;
        if (k === "class") node.className = v;
        else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v);
      }
    }
    (children || []).forEach((c) => { if (c != null) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return node;
  }

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }
    catch (e) { /* geen opslag beschikbaar */ }
  }
  function recordScore(id, correct, total) {
    const p = loadProgress();
    const prev = p[id] || { best: 0, attempts: 0 };
    const pct = total ? Math.round((correct / total) * 100) : 0;
    p[id] = { best: Math.max(prev.best, pct), attempts: prev.attempts + 1, last: pct };
    saveProgress(p);
    bumpStats(total);
  }
  function mastery(id) {
    const p = loadProgress();
    return p[id] ? p[id].best : null;
  }

  /* ---------- gedeelde statistieken (zelfde sleutel als app.js) -------------- */

  const STATS_KEY = "pk-stats-v1";
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dayBefore(str) {
    const d = new Date(str + "T00:00:00");
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function loadStats() {
    try { return JSON.parse(localStorage.getItem(STATS_KEY)) || { totalAnswered: 0, streakCount: 0, lastDate: null }; }
    catch (e) { return { totalAnswered: 0, streakCount: 0, lastDate: null }; }
  }
  function saveStats(s) {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); }
    catch (e) { /* negeren */ }
  }
  function bumpStats(total) {
    const s = loadStats();
    s.totalAnswered = (s.totalAnswered || 0) + (total || 0);
    const today = todayStr();
    if (s.lastDate !== today) {
      s.streakCount = s.lastDate === dayBefore(today) ? (s.streakCount || 0) + 1 : 1;
      s.lastDate = today;
    }
    saveStats(s);
  }

  function closeLightbox(overlay, onKey) {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
    document.body.classList.remove("lightbox-open");
  }
  function openLightbox(src, alt) {
    const overlay = el("div", { class: "map-lightbox", role: "dialog", "aria-modal": "true", "aria-label": alt || "Kaart" });
    const img = el("img", { src: src, alt: alt || "", class: "map-lightbox-img" });
    function onKey(e) { if (e.key === "Escape") closeLightbox(overlay, onKey); }
    const closeBtn = el("button", {
      class: "map-lightbox-close", type: "button", "aria-label": "Sluiten",
      onclick: () => closeLightbox(overlay, onKey)
    }, ["\u2715 Sluiten"]);
    overlay.appendChild(closeBtn);
    overlay.appendChild(img);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeLightbox(overlay, onKey); });
    document.addEventListener("keydown", onKey);
    document.body.classList.add("lightbox-open");
    document.body.appendChild(overlay);
  }

  function mapImage(group, cls) {
    const img = el("img", {
      src: group.image, alt: group.title, class: "mapimg-plain",
      onclick: () => openLightbox(group.image, group.title)
    });
    const zoomBtn = el("button", {
      class: "mapimg-zoom-btn", type: "button", "aria-label": "Kaart vergroten",
      onclick: () => openLightbox(group.image, group.title)
    }, ["\uD83D\uDD0D Vergroten"]);
    return el("div", { class: "mapimg-wrap " + (cls || "") }, [img, zoomBtn]);
  }

  /* ---------- bekijk-modus: kaart + volledige legende ---------------------- */
  function renderStudy(root, group) {
    root.innerHTML = "";
    root.appendChild(el("h1", null, [group.title]));
    root.appendChild(
      el("p", { class: "module-intro" }, [
        "Zoek elk symbool op de kaart op en overloop de legende hieronder."
      ])
    );
    if (group.note) root.appendChild(el("p", { class: "topic-note" }, [group.note]));
    root.appendChild(mapImage(group));

    const hasSecondary = !!group.secondaryLabel && group.legend.some((e) => e.capital);
    const table = el("table", { class: "quiz-table" });
    const headCells = [el("th", null, ["Symbool"]), el("th", null, ["Naam"])];
    if (hasSecondary) headCells.push(el("th", null, [group.secondaryLabel]));
    table.appendChild(el("thead", null, [el("tr", null, headCells)]));
    const tbody = el("tbody");
    group.legend.forEach((e) => {
      const cells = [el("td", { class: "table-term" }, [e.key]), el("td", null, [e.term])];
      if (hasSecondary) cells.push(el("td", null, [e.capital || "\u2014"]));
      tbody.appendChild(el("tr", null, cells));
    });
    table.appendChild(tbody);
    root.appendChild(el("div", { class: "table-wrap" }, [table]));
  }

  /* ---------- meerkeuze / typ ------------------------------------------------ */
  function runQuiz(root, group, kind, onFinish) {
    root.innerHTML = "";
    root.appendChild(el("h1", null, [group.title]));
    if (group.note) root.appendChild(el("p", { class: "topic-note" }, [group.note]));

    const scoreEl = el("p", { class: "quiz-score" });
    const progress = el("div", { class: "progress-dots" });
    root.appendChild(scoreEl);
    root.appendChild(progress);
    root.appendChild(mapImage(group, "mapimg-wrap-quiz"));
    const stage = el("div", { class: "quiz-card map-legend-card" });
    root.appendChild(stage);

    const order = shuffle(group.legend);
    const hasSecondary = !!group.secondaryLabel && order.some((e) => e.capital);
    let pos = 0, correctFields = 0, totalFields = 0, answered = false;

    function updateHeader() {
      scoreEl.textContent = "Score: " + correctFields + " / " + totalFields;
      progress.innerHTML = "";
      order.forEach((_, i) => {
        let cls = "dot";
        if (i < pos) cls += " dot-done";
        if (i === pos) cls += " dot-active";
        progress.appendChild(el("span", { class: cls }));
      });
    }

    function draw() {
      updateHeader();
      stage.innerHTML = "";

      if (pos >= order.length) {
        const pct = totalFields ? Math.round((correctFields / totalFields) * 100) : 0;
        const emoji = pct >= 90 ? "\uD83C\uDF89 " : pct >= 70 ? "\uD83D\uDC4D " : "\uD83C\uDF31 ";
        onFinish(correctFields, totalFields);
        stage.className = "quiz-result";
        stage.appendChild(el("p", { class: "result-big" }, [pct + "%"]));
        stage.appendChild(el("p", { class: "result-msg" }, [emoji + correctFields + " van de " + totalFields + " juist"]));
        stage.appendChild(el("div", { class: "quiz-actions" }, [
          el("button", { class: "btn btn-primary", type: "button", onclick: () => runQuiz(root, group, kind, onFinish) }, ["Nog een keer"])
        ]));
        return;
      }

      answered = false;
      const entry = order[pos];
      stage.appendChild(el("p", { class: "quiz-prompt map-prompt" }, ["Wat hoort bij symbool \u201c" + entry.key + "\u201d op de kaart?"]));

      if (kind === "mc") {
        const allTerms = group.legend.map((e) => e.term);
        const distractors = sample(allTerms, 3, entry.term);
        const options = shuffle([entry.term, ...distractors]);
        const optWrap = el("div", { class: "quiz-options" });
        const feedback = el("p", { class: "quiz-feedback", "aria-live": "polite" });
        let nameOk = null;

        options.forEach((opt) => {
          const btn = el("button", { class: "option-btn", type: "button", onclick: () => {
            if (nameOk !== null) return;
            nameOk = opt === entry.term;
            totalFields++;
            if (nameOk) correctFields++;
            Array.from(optWrap.children).forEach((b) => { b.disabled = true; if (b.textContent === entry.term) b.classList.add("option-correct"); });
            if (!nameOk) btn.classList.add("option-wrong");
            feedback.textContent = nameOk ? "Juist!" : "Niet juist. Juiste antwoord: " + entry.term;
            feedback.className = "quiz-feedback " + (nameOk ? "feedback-good" : "feedback-bad");
            updateHeader();
            maybeAskCapital();
          } }, [opt]);
          optWrap.appendChild(btn);
        });
        stage.appendChild(optWrap);
        stage.appendChild(feedback);

        function maybeAskCapital() {
          if (!hasSecondary || !entry.capital) { showNext(); return; }
          const capBlock = el("div", { class: "map-capital-block" });
          capBlock.appendChild(el("p", { class: "quiz-prompt map-prompt" }, ["En de hoofdstad van " + entry.term + "?"]));
          const capTerms = group.legend.filter((e) => e.capital).map((e) => e.capital);
          const capDistractors = sample(capTerms, 3, entry.capital);
          const capOptions = shuffle([entry.capital, ...capDistractors]);
          const capWrap = el("div", { class: "quiz-options" });
          const capFeedback = el("p", { class: "quiz-feedback", "aria-live": "polite" });
          capOptions.forEach((opt) => {
            const b2 = el("button", { class: "option-btn", type: "button", onclick: () => {
              const capOk = opt === entry.capital;
              totalFields++;
              if (capOk) correctFields++;
              Array.from(capWrap.children).forEach((b) => { b.disabled = true; if (b.textContent === entry.capital) b.classList.add("option-correct"); });
              if (!capOk) b2.classList.add("option-wrong");
              capFeedback.textContent = capOk ? "Juist!" : "Juiste antwoord: " + entry.capital;
              capFeedback.className = "quiz-feedback " + (capOk ? "feedback-good" : "feedback-bad");
              updateHeader();
              showNext();
            } }, [opt]);
            capWrap.appendChild(b2);
          });
          capBlock.appendChild(capWrap);
          capBlock.appendChild(capFeedback);
          stage.appendChild(capBlock);
        }
      } else {
        const input = el("input", { class: "quiz-input", type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: "Naam..." });
        const capInput = hasSecondary && entry.capital
          ? el("input", { class: "quiz-input", type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: "Hoofdstad..." })
          : null;
        const row = el("div", { class: "quiz-input-row" }, [input]);
        if (capInput) row.appendChild(capInput);
        const submit = el("button", { class: "btn btn-primary", type: "button" }, ["Controleer"]);
        const feedback = el("p", { class: "quiz-feedback", "aria-live": "polite" });

        function check() {
          if (answered) return;
          answered = true;
          const nameOk = norm(input.value) === norm(entry.term);
          input.disabled = true;
          totalFields++;
          if (nameOk) correctFields++;
          input.classList.add(nameOk ? "input-correct" : "input-wrong");
          let msg = nameOk ? "Juist!" : "Juiste antwoord: " + entry.term;
          if (capInput) {
            const capOk = norm(capInput.value) === norm(entry.capital);
            capInput.disabled = true;
            totalFields++;
            if (capOk) correctFields++;
            capInput.classList.add(capOk ? "input-correct" : "input-wrong");
            if (!capOk) msg += " \u2014 Hoofdstad: " + entry.capital;
          }
          submit.disabled = true;
          feedback.textContent = msg;
          feedback.className = "quiz-feedback " + (nameOk ? "feedback-good" : "feedback-bad");
          updateHeader();
          showNext();
        }
        submit.addEventListener("click", check);
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") (capInput ? capInput.focus() : check()); });
        if (capInput) capInput.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });

        stage.appendChild(row);
        stage.appendChild(submit);
        stage.appendChild(feedback);
        setTimeout(() => input.focus(), 0);
      }

      function showNext() {
        const isLast = pos === order.length - 1;
        const btn = el("button", { class: "btn btn-primary", type: "button", onclick: () => { pos++; draw(); } },
          [isLast ? "Resultaat bekijken \u2192" : "Volgende \u2192"]);
        stage.appendChild(btn);
        btn.focus();
      }
    }

    draw();
  }

  window.PKMapExercise = {
    cleanup: function () {},
    mastery: mastery,
    render: function (root, group, mode) {
      if (mode === "leer") renderStudy(root, group);
      else if (mode === "mc") runQuiz(root, group, "mc", (c, t) => {
        recordScore("map-" + group.id + "-mc", c, t);
        if (window.PKCounter) window.PKCounter.bump(group.moduleId);
      });
      else runQuiz(root, group, "typ", (c, t) => {
        recordScore("map-" + group.id + "-typ", c, t);
        if (window.PKCounter) window.PKCounter.bump(group.moduleId);
      });
    }
  };
})();
