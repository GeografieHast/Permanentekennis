/* ==========================================================================
   Permanente Kennis — mapquiz.js
   Kaartoefeningen op de echte, genummerde kaart uit de bundel: de leerling
   zoekt het nummer/de letter/het Romeins cijfer zelf op de kaart (zoals op
   papier) en zegt wat het is. Geen klikcoördinaten — dus geen risico dat
   de kaart een verkeerde plaats "aanwijst". De legende komt rechtstreeks
   uit de antwoordtabellen van de bundel.
   Modi: "leer" (kaart + volledige legende, om te studeren),
   "mc" (meerkeuze per symbool), "typ" (zelf typen per symbool).
   Voortgang per symbool loopt via progress.js (window.PKProgress), net als
   de tekst-onderdelen in app.js — zo tellen kaartoefeningen gewoon mee voor
   "beheerst"/"onderhoud" en de leerkrachtteller.
   ========================================================================== */

(function () {
  "use strict";

  function norm(str) {
    return window.PKIndex.norm(str);
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
    }, ["✕ Sluiten"]);
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
    }, ["🔍 Vergroten"]);
    return el("div", { class: "mapimg-wrap " + (cls || "") }, [img, zoomBtn]);
  }

  /* Toont/verbergt een pulserende marker op de kaart bij het symbool dat
     net gevraagd wordt, zodat leerlingen het sneller terugvinden tijdens
     het oefenen. Niet gebruikt in "leer"-modus (daar moeten ze zelf zoeken). */
  function setMapMarker(wrap, entry) {
    const old = wrap.querySelector(".map-marker");
    if (old) old.remove();
    if (entry && typeof entry.x === "number" && typeof entry.y === "number") {
      const marker = el("span", {
        class: "map-marker",
        style: "left:" + entry.x + "%; top:" + entry.y + "%;",
        "aria-hidden": "true"
      }, [el("span", { class: "map-marker-dot" }), el("span", { class: "map-marker-ring" })]);
      wrap.appendChild(marker);
    }
  }

  /* Bouwt de grote kaartweergave (zelfde als tijdens oefenen) voor één
     symbool, met of zonder pulserende marker. Herbruikt door app.js voor
     "Mijn fouten" en "Test jezelf" op kaartonderdelen, zodat de kaart daar
     ook groot en bruikbaar getoond wordt in plaats van als klein plaatje. */
  function buildMapDisplay(group, entry, showMarker) {
    const wrap = mapImage(group, "mapimg-wrap-quiz");
    if (showMarker) setMapMarker(wrap, entry);
    return wrap;
  }

  /* ---------- bekijk-modus: kaart + volledige legende ---------------------- */
  function renderStudy(root, group) {
    root.innerHTML = "";
    root.appendChild(el("h1", null, [group.title.replace(/^Kaartoefening:\s*/, "")]));
    root.appendChild(
      el("p", { class: "module-intro" }, [
        "Zoek elk symbool op de kaart op en overloop de legende hieronder. Daarna ga je oefenen."
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
      if (hasSecondary) cells.push(el("td", null, [e.capital || "—"]));
      tbody.appendChild(el("tr", null, cells));
    });
    table.appendChild(tbody);
    root.appendChild(el("div", { class: "table-wrap" }, [table]));

    const actions = el("div", { class: "quiz-actions" });
    actions.appendChild(el("a", { class: "btn btn-primary", href: "#/kaart/" + group.moduleId + "/" + group.id + "/mc" }, ["Klaar — ga oefenen →"]));
    root.appendChild(actions);
  }

  /* ---------- meerkeuze / typ ------------------------------------------------ */
  function runQuiz(root, group, kind) {
    root.innerHTML = "";
    root.appendChild(el("h1", null, [group.title.replace(/^Kaartoefening:\s*/, "")]));
    if (group.note) root.appendChild(el("p", { class: "topic-note" }, [group.note]));

    const scoreEl = el("p", { class: "quiz-score" });
    const streakEl = el("p", { class: "quiz-live-streak" });
    const progress = el("div", { class: "progress-dots" });
    root.appendChild(scoreEl);
    root.appendChild(streakEl);
    root.appendChild(progress);
    const mapWrap = mapImage(group, "mapimg-wrap-quiz");
    root.appendChild(mapWrap);
    const stage = el("div", { class: "quiz-card map-legend-card" });
    root.appendChild(stage);

    const order = shuffle(group.legend);
    const hasSecondary = !!group.secondaryLabel && order.some((e) => e.capital);
    let pos = 0, correctFields = 0, totalFields = 0, answered = false;
    let liveStreak = 0, bestLiveStreak = 0, newlyMasteredCount = 0;

    function progressIdFor(entry) {
      return window.PKIndex.mapItemId(group.id, entry.key);
    }

    function updateHeader() {
      scoreEl.textContent = "Score: " + correctFields + " / " + totalFields;
      if (liveStreak >= 2) {
        streakEl.textContent = "🔥 " + liveStreak + " op rij juist!";
        streakEl.className = "quiz-live-streak quiz-live-streak-on";
      } else {
        streakEl.textContent = "";
        streakEl.className = "quiz-live-streak";
      }
      progress.innerHTML = "";
      order.forEach((_, i) => {
        let cls = "dot";
        if (i < pos) cls += " dot-done";
        if (i === pos) cls += " dot-active";
        progress.appendChild(el("span", { class: cls }));
      });
    }

    function record(entry, isRight) {
      const id = progressIdFor(entry);
      const beforeStage = window.PKProgress.stageOf(id);
      const updated = window.PKProgress.recordAnswer(id, isRight);
      if (window.PKAnalytics) window.PKAnalytics.recordAnswer(id, isRight);
      if (isRight) { liveStreak++; bestLiveStreak = Math.max(bestLiveStreak, liveStreak); }
      else liveStreak = 0;
      const justMastered = beforeStage !== "mastered" && updated.stage === "mastered";
      if (justMastered) newlyMasteredCount++;
      return justMastered;
    }

    function masteryMeter(entry) {
      const st = window.PKProgress.getItem(progressIdFor(entry));
      if (st.stage === "mastered") return el("p", { class: "mastery-meter mastery-meter-done" }, ["⭐ Al beheerst — dit is onderhoud."]);
      const need = window.PKProgress.MASTER_STREAK;
      const dots = [];
      for (let i = 0; i < need; i++) dots.push(el("span", { class: "meter-dot" + (i < st.streak ? " meter-dot-on" : "") }));
      const label = st.streak > 0 ? "nog " + (need - st.streak) + "x juist voor beheerst" : "op weg naar beheerst";
      return el("p", { class: "mastery-meter" }, [el("span", { class: "meter-dots" }, dots), el("span", null, [" " + label])]);
    }

    function draw() {
      updateHeader();
      stage.innerHTML = "";

      if (pos >= order.length) {
        const pct = totalFields ? Math.round((correctFields / totalFields) * 100) : 0;
        const emoji = pct >= 90 ? "🎉 " : pct >= 70 ? "👍 " : "🌱 ";
        if (window.PKCounter) window.PKCounter.bump(group.moduleId);
        stage.className = "quiz-result";
        stage.appendChild(el("p", { class: "result-big" }, [pct + "%"]));
        stage.appendChild(el("p", { class: "result-msg" }, [emoji + correctFields + " van de " + totalFields + " juist"]));
        if (newlyMasteredCount > 0) {
          stage.appendChild(el("p", { class: "result-mastered-banner" }, [
            "🌟 " + newlyMasteredCount + (newlyMasteredCount === 1 ? " symbool" : " symbolen") + " deze keer onder de knie gekregen!"
          ]));
        }
        if (bestLiveStreak >= 5) {
          stage.appendChild(el("p", { class: "result-streak-banner" }, ["🔥 Beste reeks deze sessie: " + bestLiveStreak + " op rij juist."]));
        }
        stage.appendChild(el("div", { class: "quiz-actions" }, [
          el("button", { class: "btn btn-primary", type: "button", onclick: () => runQuiz(root, group, kind) }, ["Nog een keer"]),
          el("a", { class: "btn", href: "#/kaart/" + group.moduleId + "/" + group.id + "/start" }, ["Terug"])
        ]));
        setMapMarker(mapWrap, null);
        return;
      }

      answered = false;
      const entry = order[pos];
      setMapMarker(mapWrap, entry);
      stage.appendChild(el("p", { class: "quiz-prompt map-prompt" }, ["Wat hoort bij symbool “" + entry.key + "” op de kaart?"]));
      stage.appendChild(masteryMeter(entry));

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
            const justMastered = record(entry, nameOk);
            if (justMastered) {
              feedback.textContent = "⭐ Beheerst! Dit zit er nu goed in.";
              feedback.className = "quiz-feedback feedback-mastered";
              if (window.PKCelebrate) { window.PKCelebrate(btn); setTimeout(() => window.PKCelebrate(btn), 220); }
            } else {
              feedback.textContent = nameOk ? "Juist!" : "Niet juist. Juiste antwoord: " + entry.term;
              feedback.className = "quiz-feedback " + (nameOk ? "feedback-good" : "feedback-bad");
              if (nameOk && window.PKCelebrate) window.PKCelebrate(btn);
            }
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
              if (capOk && window.PKCelebrate) window.PKCelebrate(b2);
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
          const justMastered = record(entry, nameOk);
          let msg = justMastered ? "⭐ Beheerst! Dit zit er nu goed in." : nameOk ? "Juist!" : "Juiste antwoord: " + entry.term;
          if (justMastered && window.PKCelebrate) { window.PKCelebrate(input); setTimeout(() => window.PKCelebrate(input), 220); }
          else if (nameOk && window.PKCelebrate) window.PKCelebrate(input);
          if (capInput) {
            const capOk = norm(capInput.value) === norm(entry.capital);
            capInput.disabled = true;
            totalFields++;
            if (capOk) correctFields++;
            capInput.classList.add(capOk ? "input-correct" : "input-wrong");
            if (capOk && window.PKCelebrate) window.PKCelebrate(capInput);
            if (!capOk) msg += " — Hoofdstad: " + entry.capital;
          }
          submit.disabled = true;
          feedback.textContent = msg;
          feedback.className = "quiz-feedback " + (justMastered ? "feedback-mastered" : nameOk ? "feedback-good" : "feedback-bad");
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
          [isLast ? "Resultaat bekijken →" : "Volgende →"]);
        stage.appendChild(btn);
        btn.focus();
      }
    }

    draw();
  }

  window.PKMapExercise = {
    cleanup: function () {},
    render: function (root, group, mode) {
      if (mode === "leer") renderStudy(root, group);
      else runQuiz(root, group, mode === "typ" ? "typ" : "mc");
    },
    buildMapDisplay: buildMapDisplay
  };
})();
