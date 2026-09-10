/* ==========================================================================
   Permanente Kennis — mapquiz.js
   Echte kaartoefeningen op een OpenStreetMap-kaart (via Leaflet):
   - "leer": studeer — alle plaatsen staan gelabeld op de kaart
   - "wijs": klik-op-de-kaart — leerling klikt de juiste plaats aan
   - "mc": een plaats is gemarkeerd — leerling kiest de juiste naam
   ========================================================================== */

(function () {
  "use strict";

  const PROGRESS_KEY = "pk-progress-v1";
  let currentMap = null; // actieve Leaflet-instantie, opgeruimd bij elke navigatie

  function cleanup() {
    if (currentMap) {
      currentMap.remove();
      currentMap = null;
    }
  }

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }
    catch (e) { /* geen opslag beschikbaar: app blijft werken */ }
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

  /* ---------- afstand: haversine (km) --------------------------------- */
  function distKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /* dichtste afstand (km) van een punt tot een lijnstuk (platte benadering,
     nauwkeurig genoeg op de schaal van België) */
  function distToSegmentKm(p, a, b) {
    const toXY = (pt) => ({
      x: pt.lng * 111.32 * Math.cos((p.lat * Math.PI) / 180),
      y: pt.lat * 110.57
    });
    const P = toXY(p), A = toXY(a), B = toXY(b);
    const dx = B.x - A.x, dy = B.y - A.y;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((P.x - A.x) * dx + (P.y - A.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = A.x + t * dx, cy = A.y + t * dy;
    return Math.hypot(P.x - cx, P.y - cy);
  }
  function distToPolylineKm(p, path) {
    let min = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const a = { lat: path[i][0], lng: path[i][1] };
      const b = { lat: path[i + 1][0], lng: path[i + 1][1] };
      min = Math.min(min, distToSegmentKm(p, a, b));
    }
    return min;
  }

  function allEntries(group) {
    const pts = (group.items || []).map((it) => ({ term: it.term, kind: "point", lat: it.lat, lng: it.lng, tolerance: it.tolerance || group.tolerance }));
    const lines = (group.lines || []).map((it) => ({ term: it.term, kind: "line", path: it.path, tolerance: it.tolerance || group.tolerance }));
    return pts.concat(lines);
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

  function makeMap(container, view) {
    const map = L.map(container, { scrollWheelZoom: false });
    map.setView(view.center, view.zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers'
    }).addTo(map);
    currentMap = map;
    setTimeout(() => map.invalidateSize(), 60);
    return map;
  }

  function pinIcon(color) {
    return L.divIcon({
      className: "",
      html: '<span class="map-pin" style="--pin-color:' + color + '"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  /* ---------- studeermodus: alle plaatsen gelabeld --------------------- */
  function renderStudy(root, group) {
    root.innerHTML = "";
    root.appendChild(el("h1", null, [group.title]));
    root.appendChild(el("p", { class: "module-intro" }, [group.instructions]));
    const mapEl = el("div", { class: "leaflet-box" });
    root.appendChild(mapEl);

    const map = makeMap(mapEl, group.view);
    (group.items || []).forEach((it) => {
      L.marker([it.lat, it.lng], { icon: pinIcon("var(--ink)") })
        .addTo(map)
        .bindTooltip(it.term, { permanent: true, direction: "top", offset: [0, -6], className: "map-label" });
    });
    (group.lines || []).forEach((it) => {
      const line = L.polyline(it.path, { color: "#022e3e", weight: 4, opacity: 0.85 }).addTo(map);
      const mid = it.path[Math.floor(it.path.length / 2)];
      L.marker(mid, {
        icon: L.divIcon({ className: "", html: '<span class="map-line-label">' + it.term + "</span>", iconSize: [1, 1] })
      }).addTo(map);
    });
  }

  /* ---------- klik-op-de-kaart modus ------------------------------------ */
  function renderClick(root, group, onFinish) {
    root.innerHTML = "";
    root.appendChild(el("h1", null, [group.title]));
    const scoreEl = el("p", { class: "quiz-score" });
    const promptEl = el("p", { class: "quiz-prompt map-prompt" });
    const progress = el("div", { class: "progress-dots" });
    const mapEl = el("div", { class: "leaflet-box" });
    const feedback = el("p", { class: "quiz-feedback", "aria-live": "polite" });
    const nextHolder = el("div", { class: "quiz-next-holder" });

    root.appendChild(scoreEl);
    root.appendChild(promptEl);
    root.appendChild(progress);
    root.appendChild(mapEl);
    root.appendChild(feedback);
    root.appendChild(nextHolder);

    const map = makeMap(mapEl, group.view);
    const order = shuffle(allEntries(group));
    let pos = 0, correct = 0, answered = false, marker = null, clickHandler = null;

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
      if (marker) { map.removeLayer(marker); marker = null; }
      if (clickHandler) { map.off("click", clickHandler); clickHandler = null; }

      if (pos >= order.length) {
        promptEl.textContent = "";
        const pct = order.length ? Math.round((correct / order.length) * 100) : 0;
        onFinish(correct, order.length);
        mapEl.style.display = "none";
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

      clickHandler = function (e) {
        if (answered) return;
        answered = true;
        map.off("click", clickHandler);
        const click = { lat: e.latlng.lat, lng: e.latlng.lng };
        let d, targetLatLng;
        if (entry.kind === "point") {
          d = distKm(click.lat, click.lng, entry.lat, entry.lng);
          targetLatLng = [entry.lat, entry.lng];
        } else {
          d = distToPolylineKm(click, entry.path);
          targetLatLng = entry.path[Math.floor(entry.path.length / 2)];
        }
        const isRight = d <= entry.tolerance;
        if (isRight) correct++;

        L.marker(e.latlng, { icon: pinIcon(isRight ? "var(--correct)" : "var(--red)") }).addTo(map);
        if (!isRight) {
          marker = entry.kind === "point"
            ? L.marker(targetLatLng, { icon: pinIcon("var(--ink)") }).addTo(map)
            : L.polyline(entry.path, { color: "#022e3e", weight: 4, dashArray: "6 6" }).addTo(map);
        }
        feedback.textContent = isRight ? "Juist!" : "Niet helemaal — het juiste antwoord staat nu op de kaart.";
        feedback.className = "quiz-feedback " + (isRight ? "feedback-good" : "feedback-bad");
        updateHeader();

        const isLast = pos === order.length - 1;
        const btn = el("button", { class: "btn btn-primary", type: "button", onclick: () => { pos++; draw(); } },
          [isLast ? "Resultaat bekijken →" : "Volgende →"]);
        nextHolder.appendChild(btn);
        btn.focus();
      };
      map.on("click", clickHandler);
    }

    draw();
  }

  /* ---------- meerkeuze op de kaart -------------------------------------- */
  function renderMC(root, group, onFinish) {
    root.innerHTML = "";
    root.appendChild(el("h1", null, [group.title]));
    const scoreEl = el("p", { class: "quiz-score" });
    const progress = el("div", { class: "progress-dots" });
    const mapEl = el("div", { class: "leaflet-box leaflet-box-small" });
    const stage = el("div", { class: "quiz-card map-mc-card" });

    root.appendChild(scoreEl);
    root.appendChild(progress);
    root.appendChild(mapEl);
    root.appendChild(stage);

    const map = makeMap(mapEl, group.view);
    map.dragging.disable();
    const order = shuffle(allEntries(group));
    const allTerms = order.map((e) => e.term);
    let pos = 0, correct = 0, answered = false, marker = null, line = null;

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
      if (marker) { map.removeLayer(marker); marker = null; }
      if (line) { map.removeLayer(line); line = null; }

      if (pos >= order.length) {
        const pct = order.length ? Math.round((correct / order.length) * 100) : 0;
        onFinish(correct, order.length);
        mapEl.style.display = "none";
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
      if (entry.kind === "point") {
        marker = L.marker([entry.lat, entry.lng], { icon: pinIcon("var(--red)") }).addTo(map);
        map.panTo([entry.lat, entry.lng]);
      } else {
        line = L.polyline(entry.path, { color: "#e5343c", weight: 5 }).addTo(map);
        map.fitBounds(line.getBounds(), { padding: [24, 24] });
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

  window.PKMapExercise = {
    cleanup: cleanup,
    mastery: mastery,
    render: function (root, group, mode) {
      cleanup();
      if (mode === "leer") renderStudy(root, group);
      else if (mode === "mc") renderMC(root, group, (c, t) => recordScore("map-" + group.id + "-mc", c, t));
      else renderClick(root, group, (c, t) => recordScore("map-" + group.id + "-wijs", c, t));
    }
  };
})();
