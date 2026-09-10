/* ==========================================================================
   Permanente Kennis — mapquiz.js
   Kaartoefeningen op de echte kaarten uit je bundel (afbeelding + pixel-
   coördinaten), zonder externe kaartendienst. Werkt responsief via
   procentuele positionering t.o.v. de natuurlijke afbeeldingsgrootte.
   Modi: "leer" (studeren), "wijs" (klik-op-de-kaart), "mc" (meerkeuze),
   "nummer" (genummerde kaarttoets zoals op papier).
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
  }
  function mastery(id) {
    const p = loadProgress();
    return p[id] ? p[id].best : null;
  }

  function allEntries(group) {
    const pts = (group.items || []).map((it) => ({
      term: it.term, kind: "point", x: it.x, y: it.y,
      tolerance: it.tolerance || group.tolerance, capital: it.capital
    }));
    const lines = (group.lines || []).map((it) => ({
      term: it.term, kind: "line", path: it.path,
      tolerance: it.tolerance || group.tolerance, capital: it.capital
    }));
    return pts.concat(lines);
  }

  function distToSegment(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = a[0] + t * dx, cy = a[1] + t * dy;
    return Math.hypot(p.x - cx, p.y - cy);
  }
  function distToPolyline(p, path) {
    let min = Infinity;
    for (let i = 0; i < path.length - 1; i++) min = Math.min(min, distToSegment(p, path[i], path[i + 1]));
    return min;
  }
  function midOfPath(path) {
    return path[Math.floor(path.length / 2)];
  }

  /* ---------- de kaart-basis: afbeelding + overlay-laag ------------------- */
  function buildMapBase(group, extraClass) {
    const [natW, natH] = group.imageSize;
    const wrap = el("div", { class: "mapimg-wrap" + (extraClass ? " " + extraClass : "") });
    const img = el("img", { src: group.image, alt: group.title, draggable: "false", class: "mapimg" });
    const overlay = el("div", { class: "mapimg-overlay" });
    wrap.style.aspectRatio = natW + " / " + natH;
    wrap.appendChild(img);
    wrap.appendChild(overlay);

    function toPercent(x, y) {
      return { left: (x / natW) * 100 + "%", top: (y / natH) * 100 + "%" };
    }
    function clickToNatural(evt) {
      const rect = wrap.getBoundingClientRect();
      const px = ((evt.clientX - rect.left) / rect.width) * natW;
      const py = ((evt.clientY - rect.top) / rect.height) * natH;
      return { x: px, y: py };
    }
    return { wrap, overlay, toPercent, clickToNatural, natW, natH };
  }

  function placeMarker(overlay, toPercent, x, y, cls, content) {
    const pos = toPercent(x, y);
    const m = el("div", { class: "map-marker " + (cls || ""), style: "left:" + pos.left + ";top:" + pos.top + ";" }, content != null ? [String(content)] : []);
    overlay.appendChild(m);
    return m;
  }
  function placeLabel(overlay, toPercent, x, y, text, cls) {
    const pos = toPercent(x, y);
    const l = el("div", { class: "map-tag " + (cls || ""), style: "left:" + pos.left + ";top:" + pos.top + ";" }, [text]);
    overlay.appendChild(l);
    return l;
  }
  function placeLine(overlay, natW, natH, path, cls) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + natW + " " + natH);
    svg.setAttribute("class", "map-line-svg");
    svg.setAttribute("preserveAspectRatio", "none");
    const pts = path.map((p) => p[0] + "," + p[1]).join(" ");
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    poly.setAttribute("points", pts);
    poly.setAttribute("class", cls || "map-line");
    svg.appendChild(poly);
    overlay.appendChild(svg);
    return svg;
  }

  /* ---------- studeermodus: alles gelabeld -------------------------------- */
  function renderStudy(root, group) {
    root.innerHTML = "";
    root.appendChild(el("h1", null, [group.title]));
    root.appendChild(el("p", { class: "module-intro" }, [group.instructions]));

    const base = buildMapBase(group);
    root.appendChild(base.wrap);

    (group.items || []).forEach((it) => {
      placeMarker(base.overlay, base.toPercent, it.x, it.y, "marker-dot");
      placeLabel(base.overlay, base.toPercent, it.x, it.y, it.term, "tag-study");
    });
    (group.lines || []).forEach((it) => {
      placeLine(base.overlay, base.natW, base.natH, it.path, "map-line map-line-study");
      const mid = midOfPath(it.path);
      placeLabel(base.overlay, base.toPercent, mid[0], mid[1], it.term, "tag-study tag-line");
    });
  }

  /* ---------- klik-op-de-kaart --------------------------------------------- */
  function renderClick(root, group, onFinish) {
    root.innerHTML = "";
    root.appendChild(el("h1", null, [group.title]));
    const scoreEl = el("p", { class: "quiz-score" });
    const promptEl = el("p", { class: "quiz-prompt map-prompt" });
    const progress = el("div", { class: "progress-dots" });
    const feedback = el("p", { class: "quiz-feedback", "aria-live": "polite" });
    const nextHolder = el("div", { class: "quiz-next-holder" });

    root.appendChild(scoreEl);
    root.appendChild(promptEl);
    root.appendChild(progress);
    const mapHolder = el("div");
    root.appendChild(mapHolder);
    root.appendChild(feedback);
    root.appendChild(nextHolder);

    const order = shuffle(allEntries(group));
    let pos = 0, correct = 0, answered = false;

    function updateHeader() {
      scoreEl.textContent = "Score: " + correct + " / " + Math.min(pos, order.length);
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
      feedback.textContent = "";
      feedback.className = "quiz-feedback";
      nextHolder.innerHTML = "";
      mapHolder.innerHTML = "";

      if (pos >= order.length) {
        const pct = order.length ? Math.round((correct / order.length) * 100) : 0;
        onFinish(correct, order.length);
        promptEl.textContent = "";
        root.appendChild(
          el("div", { class: "quiz-result" }, [
            el("p", { class: "result-big" }, [pct + "%"]),
            el("p", { class: "result-msg" }, [correct + " van de " + order.length + " juist aangeklikt."]),
            el("div", { class: "quiz-actions" }, [
              el("button", { class: "btn btn-primary", type: "button", onclick: () => renderClick(root, group, onFinish) }, ["Nog een keer"])
            ])
          ])
        );
        return;
      }

      answered = false;
      const entry = order[pos];
      promptEl.textContent = "Waar ligt: " + entry.term + " ?";

      const base = buildMapBase(group);
      mapHolder.appendChild(base.wrap);
      (group.lines || []).forEach((it) => {
        if (it !== entry) placeLine(base.overlay, base.natW, base.natH, it.path, "map-line map-line-faint");
      });

      base.wrap.addEventListener("click", function handler(evt) {
        if (answered) return;
        answered = true;
        base.wrap.removeEventListener("click", handler);
        const click = base.clickToNatural(evt);
        let d, targetX, targetY;
        if (entry.kind === "point") {
          d = Math.hypot(click.x - entry.x, click.y - entry.y);
          targetX = entry.x; targetY = entry.y;
        } else {
          d = distToPolyline(click, entry.path);
          const mid = midOfPath(entry.path);
          targetX = mid[0]; targetY = mid[1];
        }
        const isRight = d <= entry.tolerance;
        if (isRight) correct++;

        placeMarker(base.overlay, base.toPercent, click.x, click.y, isRight ? "marker-click-good" : "marker-click-bad");
        if (!isRight) {
          if (entry.kind === "point") placeMarker(base.overlay, base.toPercent, targetX, targetY, "marker-answer");
          else placeLine(base.overlay, base.natW, base.natH, entry.path, "map-line map-line-answer");
        }
        feedback.textContent = isRight ? "Juist!" : "Niet helemaal — het juiste antwoord staat nu op de kaart.";
        feedback.className = "quiz-feedback " + (isRight ? "feedback-good" : "feedback-bad");
        updateHeader();

        const isLast = pos === order.length - 1;
        const btn = el("button", { class: "btn btn-primary", type: "button", onclick: () => { pos++; draw(); } },
          [isLast ? "Resultaat bekijken →" : "Volgende →"]);
        nextHolder.appendChild(btn);
        btn.focus();
      });
    }

    draw();
  }

  /* ---------- meerkeuze op de kaart ---------------------------------------- */
  function renderMC(root, group, onFinish) {
    root.innerHTML = "";
    root.appendChild(el("h1", null, [group.title]));
    const scoreEl = el("p", { class: "quiz-score" });
    const progress = el("div", { class: "progress-dots" });
    const mapHolder = el("div");
    const stage = el("div", { class: "quiz-card map-mc-card" });

    root.appendChild(scoreEl);
    root.appendChild(progress);
    root.appendChild(mapHolder);
    root.appendChild(stage);

    const order = shuffle(allEntries(group));
    const allTerms = order.map((e) => e.term);
    let pos = 0, correct = 0, answered = false;

    function updateHeader() {
      scoreEl.textContent = "Score: " + correct + " / " + Math.min(pos, order.length);
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
      mapHolder.innerHTML = "";

      if (pos >= order.length) {
        const pct = order.length ? Math.round((correct / order.length) * 100) : 0;
        onFinish(correct, order.length);
        stage.className = "quiz-result";
        stage.appendChild(el("p", { class: "result-big" }, [pct + "%"]));
        stage.appendChild(el("p", { class: "result-msg" }, [correct + " van de " + order.length + " juist"]));
        stage.appendChild(el("div", { class: "quiz-actions" }, [
          el("button", { class: "btn btn-primary", type: "button", onclick: () => renderMC(root, group, onFinish) }, ["Nog een keer"])
        ]));
        return;
      }

      answered = false;
      const entry = order[pos];
      const base = buildMapBase(group, "mapimg-wrap-small");
      mapHolder.appendChild(base.wrap);
      if (entry.kind === "point") {
        placeMarker(base.overlay, base.toPercent, entry.x, entry.y, "marker-highlight");
      } else {
        placeLine(base.overlay, base.natW, base.natH, entry.path, "map-line map-line-highlight");
      }

      stage.appendChild(el("span", { class: "flashcard-label" }, ["Wat is dit op de kaart?"]));
      const distractors = sample(allTerms, 3, entry.term);
      const options = shuffle([entry.term, ...distractors]);
      const optWrap = el("div", { class: "quiz-options" });
      const feedback = el("p", { class: "quiz-feedback", "aria-live": "polite" });
      options.forEach((opt) => {
        const btn = el("button", { class: "option-btn", type: "button", onclick: () => {
          if (answered) return;
          answered = true;
          const isRight = opt === entry.term;
          if (isRight) correct++;
          Array.from(optWrap.children).forEach((b) => { b.disabled = true; if (b.textContent === entry.term) b.classList.add("option-correct"); });
          if (!isRight) btn.classList.add("option-wrong");
          feedback.textContent = isRight ? "Juist!" : "Niet juist. Juiste antwoord: " + entry.term;
          feedback.className = "quiz-feedback " + (isRight ? "feedback-good" : "feedback-bad");
          updateHeader();
          const isLast = pos === order.length - 1;
          const nb = el("button", { class: "btn btn-primary", type: "button", onclick: () => { pos++; draw(); } },
            [isLast ? "Resultaat bekijken →" : "Volgende →"]);
          stage.appendChild(nb);
          nb.focus();
        } }, [opt]);
        optWrap.appendChild(btn);
      });
      stage.appendChild(optWrap);
      stage.appendChild(feedback);
    }

    draw();
  }

  /* ---------- genummerde kaarttoets (zoals op je eigen toetsen) ------------ */
  function renderNumbered(root, group, onFinish) {
    root.innerHTML = "";
    root.appendChild(el("h1", null, [group.title]));
    root.appendChild(
      el("p", { class: "module-intro" }, [
        "Op de kaart staat bij elk nummer een plaats gemarkeerd. Vul de tabel in en klik dan op \u201cVerbeteren\u201d."
      ])
    );

    const base = buildMapBase(group, "mapimg-wrap-tall");
    root.appendChild(base.wrap);

    const order = shuffle(allEntries(group));
    const hasSecondary = !!group.secondaryLabel && order.some((e) => e.capital);

    order.forEach((entry, i) => {
      const n = i + 1;
      if (entry.kind === "point") {
        placeMarker(base.overlay, base.toPercent, entry.x, entry.y, "marker-num", n);
      } else {
        placeLine(base.overlay, base.natW, base.natH, entry.path, "map-line map-line-study");
        const mid = midOfPath(entry.path);
        placeMarker(base.overlay, base.toPercent, mid[0], mid[1], "marker-num", n);
      }
    });

    const tableWrap = el("div", { class: "table-wrap" });
    const table = el("table", { class: "quiz-table" });
    const headCells = [el("th", null, ["Nr."]), el("th", null, ["Naam"])];
    if (hasSecondary) headCells.push(el("th", null, [group.secondaryLabel]));
    table.appendChild(el("thead", null, [el("tr", null, headCells)]));
    const tbody = el("tbody");
    const rows = [];
    order.forEach((entry, i) => {
      const n = i + 1;
      const nameInput = el("input", { class: "quiz-input table-input", type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
      const capInput = hasSecondary
        ? el("input", { class: "quiz-input table-input", type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false" })
        : null;
      const cells = [el("td", { class: "table-term" }, [String(n)]), el("td", null, [nameInput])];
      if (hasSecondary) cells.push(el("td", null, [capInput]));
      const tr = el("tr", { id: "num-row-" + i }, cells);
      tbody.appendChild(tr);
      rows.push({ entry, nameInput, capInput });
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    root.appendChild(tableWrap);

    const feedback = el("p", { class: "quiz-feedback", "aria-live": "polite" });
    const actions = el("div", { class: "quiz-actions" });
    const checkBtn = el("button", { class: "btn btn-primary", type: "button" }, ["Verbeteren"]);
    actions.appendChild(checkBtn);
    root.appendChild(feedback);
    root.appendChild(actions);

    checkBtn.addEventListener("click", () => {
      let correctFields = 0, totalFields = 0;
      rows.forEach((row, i) => {
        const tr = document.getElementById("num-row-" + i);
        const nameOk = norm(row.nameInput.value) === norm(row.entry.term);
        row.nameInput.disabled = true;
        totalFields++;
        if (nameOk) correctFields++;
        row.nameInput.classList.add(nameOk ? "input-correct" : "input-wrong");
        if (!nameOk) tr.appendChild(el("td", { class: "table-correction" }, ["Naam: " + row.entry.term]));
        if (row.capInput) {
          const capOk = norm(row.capInput.value) === norm(row.entry.capital || "");
          row.capInput.disabled = true;
          totalFields++;
          if (capOk) correctFields++;
          row.capInput.classList.add(capOk ? "input-correct" : "input-wrong");
          if (!capOk) tr.appendChild(el("td", { class: "table-correction" }, [(group.secondaryLabel || "") + ": " + row.entry.capital]));
        }
        tr.classList.add(nameOk && (!row.capInput || norm(row.capInput.value) === norm(row.entry.capital || "")) ? "row-correct" : "row-wrong");
      });
      checkBtn.disabled = true;
      const pct = totalFields ? Math.round((correctFields / totalFields) * 100) : 0;
      feedback.textContent = correctFields + " van de " + totalFields + " juist (" + pct + "%).";
      feedback.className = "quiz-feedback " + (pct >= 70 ? "feedback-good" : "feedback-bad");
      onFinish(correctFields, totalFields);
      actions.appendChild(
        el("button", { class: "btn", type: "button", onclick: () => renderNumbered(root, group, onFinish) }, ["Nog een keer"])
      );
    });
  }

  window.PKMapExercise = {
    cleanup: function () {}, // geen externe kaartinstantie meer op te ruimen
    mastery: mastery,
    render: function (root, group, mode) {
      if (mode === "leer") renderStudy(root, group);
      else if (mode === "mc") renderMC(root, group, (c, t) => recordScore("map-" + group.id + "-mc", c, t));
      else if (mode === "nummer") renderNumbered(root, group, (c, t) => recordScore("map-" + group.id + "-nummer", c, t));
      else renderClick(root, group, (c, t) => recordScore("map-" + group.id + "-wijs", c, t));
    }
  };
})();
