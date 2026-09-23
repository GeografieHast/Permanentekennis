/* ==========================================================================
   Permanente Kennis — app.js
   Volledige leeromgeving: Leren → Oefenen → Fouten opnieuw oefenen →
   Testen → Onderhoud. Dependency-vrij (geen framework, geen build-stap).
   ========================================================================== */

(function () {
  "use strict";

  const root = document.getElementById("app");

  /* ---------- helpers ---------------------------------------------------- */

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
    const pool = arr.filter((x) => x !== exclude);
    return shuffle(pool).slice(0, n);
  }

  /* fetch() met een timeout: zonder dit kan een trage/onbereikbare
     tellerdienst de pagina lang in "Bezig met ophalen…" laten hangen.
     Gebruikt AbortController waar beschikbaar, valt anders gewoon terug
     op een gewone fetch() (oudere browser: dan geen timeout, maar de site
     blijft wel werken). */
  function fetchWithTimeout(url, ms) {
    if (typeof AbortController === "undefined") return fetch(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms || 6000);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
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

  const Progress = window.PKProgress;
  const Index = window.PKIndex;

  /* ---------- mijlpalen (badges) ---------------------------------------------- */

  const STREAK_GOALS = [
    { at: 3, label: "Warm gedraaid", icon: "🔥" },
    { at: 7, label: "Volle week", icon: "📅" },
    { at: 14, label: "Twee weken sterk", icon: "💪" },
    { at: 21, label: "Nieuwe gewoonte", icon: "🌱" },
    { at: 30, label: "Maandmarathon", icon: "🗓️" },
    { at: 45, label: "Anderhalve maand!", icon: "⛰️" },
    { at: 60, label: "Twee maanden vol", icon: "🚀" },
    { at: 100, label: "Eeuweling", icon: "💯" },
    { at: 150, label: "Ontembaar", icon: "🦾" },
    { at: 200, label: "Legende", icon: "👑" }
  ];
  const ANSWERED_GOALS = [
    { at: 25, label: "Eerste verkenner", icon: "🧭" },
    { at: 50, label: "Kaartlezer", icon: "🗺️" },
    { at: 100, label: "Honderd raak!", icon: "🎯" },
    { at: 200, label: "Grensverlegger", icon: "🌍" },
    { at: 250, label: "Wegwijs", icon: "🚏" },
    { at: 400, label: "Reisleider", icon: "🧳" },
    { at: 500, label: "Halve duizend!", icon: "🏅" },
    { at: 750, label: "Meesterbrein", icon: "🧠" },
    { at: 1000, label: "Duizendknaller", icon: "🎉" },
    { at: 1500, label: "Wereldkampioen", icon: "🏆" }
  ];
  function milestoneNote(value, goals) {
    const next = goals.find(function (g) { return g.at > value; });
    if (!next) return "🏆 topscore behaald!";
    const hasBadge = goals.some(function (g) { return g.at <= value; });
    return (hasBadge ? "🏅 volgend doel: " : "🎯 doel: ") + next.icon + " " + next.label;
  }
  function goalsList(value, goals, unitWord) {
    const list = el("ul", { class: "goals-list" });
    let nextMarked = false;
    goals.forEach(function (g) {
      const achieved = value >= g.at;
      let state = "locked";
      if (achieved) state = "achieved";
      else if (!nextMarked) { state = "next"; nextMarked = true; }
      list.appendChild(
        el("li", { class: "goal-item goal-" + state }, [
          el("span", { class: "goal-check", "aria-hidden": "true" }, [achieved ? checkTickSVG() : ""]),
          el("span", { class: "goal-icon", "aria-hidden": "true" }, [g.icon]),
          el("span", { class: "goal-text" }, [
            el("strong", null, [g.label]),
            el("span", { class: "goal-target" }, [g.at + " " + unitWord])
          ])
        ])
      );
    });
    return list;
  }
  function checkTickSVG() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.innerHTML = '<path d="M4 12.5l5 5L20 6" pathLength="1" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>';
    return s;
  }

  /* ---------- gedeelde teller (bezoeken door iedereen samen) ----------------- */

  const GLOBAL_COUNTER_KEY = "geografiehast-permanentekennis-bezoeken";
  const GLOBAL_COUNTER_BASE = "https://countapi.mileshilliard.com/api/v1/";
  function fetchGlobalCounter(el2) {
    let hitOnce = false;
    try {
      hitOnce = sessionStorage.getItem("pk-global-hit") === "1";
    } catch (e) { /* privé-modus */ }
    const url = GLOBAL_COUNTER_BASE + (hitOnce ? "get/" : "hit/") + GLOBAL_COUNTER_KEY;
    fetchWithTimeout(url, 6000)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.value != null) {
          el2.textContent = Number(data.value).toLocaleString("nl-BE");
          try { sessionStorage.setItem("pk-global-hit", "1"); } catch (e) { /* negeren */ }
        } else {
          el2.textContent = "—";
        }
      })
      .catch(() => { el2.textContent = "—"; });
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
  function mapGroupsFor(moduleId) {
    return (window.PK_MAPS ? window.PK_MAPS.groups : []).filter((g) => g.moduleId === moduleId);
  }
  function getMapGroup(groupId) {
    return (window.PK_MAPS ? window.PK_MAPS.groups : []).find((g) => g.id === groupId);
  }

  /* ---------- voortgang per onderdeel (koppelt data ↔ progress.js) ----------- */

  function topicItemIds(topic) {
    return topic.items.map((it) => Index.topicItemId(topic.id, it));
  }
  function mapItemIds(group) {
    return group.legend.map((e) => Index.mapItemId(group.id, e.key));
  }
  function topicSummary(topic) {
    return Progress.summarize(topicItemIds(topic));
  }
  function mapSummary(group) {
    return Progress.summarize(mapItemIds(group));
  }
  function moduleItemIds(mod) {
    let ids = [];
    mod.topics.forEach((t) => { ids = ids.concat(topicItemIds(t)); });
    mapGroupsFor(mod.id).forEach((g) => { ids = ids.concat(mapItemIds(g)); });
    return ids;
  }
  function moduleSummary(mod) {
    return Progress.summarize(moduleItemIds(mod));
  }
  function allItemIds() {
    let ids = [];
    PK_DATA.modules.forEach((mod) => { ids = ids.concat(moduleItemIds(mod)); });
    return ids;
  }

  /* ---------- router ------------------------------------------------------- */

  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    const parts = h.split("/").filter(Boolean);
    return { view: parts[0] || "home", p1: parts[1], p2: parts[2], p3: parts[3], p4: parts[4] };
  }

  function navigate(path) {
    location.hash = path;
  }

  /* ---------- "Ga verder waar je gebleven was" (startpagina) ------------ */

  const LAST_VISIT_KEY = "pk-last-visited-v1";

  function saveLastVisited(href, label) {
    try {
      localStorage.setItem(LAST_VISIT_KEY, JSON.stringify({ href: href, label: label, ts: Date.now() }));
    } catch (e) { /* privé-modus: dan werkt "ga verder" gewoon niet, de rest van de site wel */ }
  }
  function loadLastVisited() {
    try {
      return JSON.parse(localStorage.getItem(LAST_VISIT_KEY));
    } catch (e) { return null; }
  }

  /* Onthoudt, telkens een leerling een echt onderdeel opent (een kaartblad-
     onderdeel of een kaartoefening, in het even welke stap), waar hij was
     — zodat de startpagina daar een knop "Ga verder" voor kan tonen. */
  function trackVisit(r) {
    if (r.view === "module" && r.p1) {
      const mod = getModule(r.p1);
      if (!mod) return;
      if (r.p2 === "testen") {
        saveLastVisited(location.hash, mod.title + " — Test jezelf");
        return;
      }
      if (r.p2) {
        const topic = getTopic(r.p1, r.p2);
        if (!topic) return;
        let modeLabel = null;
        if (r.p3 === "leren") modeLabel = "Leren";
        else if (r.p3 === "oefenen") modeLabel = "Oefenen";
        else if (r.p3 === "fouten") modeLabel = "Mijn fouten";
        else if (r.p3 === "testen") modeLabel = "Test jezelf";
        saveLastVisited(location.hash, topic.title + (modeLabel ? " — " + modeLabel : ""));
      }
    } else if (r.view === "kaart" && r.p1 && r.p2) {
      const group = getMapGroup(r.p2);
      if (!group) return;
      let modeLabel = null;
      if (r.p3 === "leer") modeLabel = "Kaart bekijken";
      else if (r.p3 === "mc") modeLabel = "Oefenen — meerkeuze";
      else if (r.p3 === "typ") modeLabel = "Oefenen — zelf typen";
      else if (r.p3 === "fouten") modeLabel = "Mijn fouten";
      else if (r.p3 === "testen") modeLabel = "Test jezelf";
      const title = group.title.replace(/^Kaartoefening:\s*/, "");
      saveLastVisited(location.hash, title + (modeLabel ? " — " + modeLabel : ""));
    }
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", render);

  function render() {
    if (window.PKMapExercise) window.PKMapExercise.cleanup();
    const r = parseHash();
    trackVisit(r);
    root.innerHTML = "";
    root.appendChild(el("div", { class: "crumbs" }, breadcrumbs(r)));

    try {
      if (r.view === "home") root.appendChild(renderHome());
      else if (r.view === "module" && r.p1 && !r.p2) root.appendChild(renderModule(r.p1));
      else if (r.view === "module" && r.p1 && r.p2 === "testen") root.appendChild(renderModuleTest(r.p1));
      else if (r.view === "module" && r.p1 && r.p2 && !r.p3) root.appendChild(renderTopicHub(r.p1, r.p2));
      else if (r.view === "module" && r.p1 && r.p2 && r.p3 === "leren" && r.p4 === "kaarten") root.appendChild(renderFlashcards(r.p1, r.p2));
      else if (r.view === "module" && r.p1 && r.p2 && r.p3 === "leren") root.appendChild(renderLeren(r.p1, r.p2));
      else if (r.view === "module" && r.p1 && r.p2 && r.p3 === "oefenen") root.appendChild(renderOefenen(r.p1, r.p2, r.p4));
      else if (r.view === "module" && r.p1 && r.p2 && r.p3 === "fouten") root.appendChild(renderTopicFouten(r.p1, r.p2));
      else if (r.view === "module" && r.p1 && r.p2 && r.p3 === "testen") root.appendChild(renderTopicTest(r.p1, r.p2));
      else if (r.view === "kaart" && r.p1 && r.p2 && r.p3) renderMapView(r.p1, r.p2, r.p3);
      else if (r.view === "fouten") root.appendChild(renderGlobalFouten());
      else if (r.view === "onderhoud") root.appendChild(renderOnderhoud());
      else if (r.view === "leerkracht") root.appendChild(renderTeacher());
      else root.appendChild(renderHome());
    } catch (err) {
      console.error(err);
      root.appendChild(renderHome());
    }

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function renderMapView(moduleId, groupId, mode) {
    const wrap = el("div", { class: "view view-map" });
    root.appendChild(wrap);
    const group = getMapGroup(groupId);
    if (!group) { wrap.appendChild(renderHome()); return; }
    if (mode === "start") {
      wrap.appendChild(renderMapHub(moduleId, group));
      return;
    }
    if (mode === "fouten") {
      renderOnderdeelFoutenSession(wrap, { kind: "map", group: group, moduleId: moduleId }, "#/kaart/" + moduleId + "/" + group.id + "/start");
      return;
    }
    if (mode === "testen") {
      renderOnderdeelTestSession(wrap, { kind: "map", group: group, moduleId: moduleId }, "#/kaart/" + moduleId + "/" + group.id + "/start");
      return;
    }
    window.PKMapExercise.render(wrap, group, mode);
  }

  function renderMapHub(moduleId, group) {
    const wrap = el("div", { class: "view view-onderdeel-hub" });
    wrap.appendChild(el("h1", null, [group.title.replace(/^Kaartoefening:\s*/, "")]));
    wrap.appendChild(el("p", { class: "module-intro" }, ["Zoek het symbool op de echte kaart uit je bundel op."]));
    if (group.note) wrap.appendChild(el("p", { class: "topic-note" }, [group.note]));

    const sum = mapSummary(group);
    wrap.appendChild(progressSummaryBlock(sum));

    const mapRetryCount = sum.total ? Progress.retryList(mapItemIds(group)).length : 0;
    const mapRec = recommendedStage(sum, mapRetryCount);
    const base = "#/kaart/" + moduleId + "/" + group.id + "/";
    const stages = el("div", { class: "stage-grid stepper" });
    stages.appendChild(stageCard(base + "leer", "1", cardsIconSVG(), "Leren", "Kaart met de volledige legende ernaast — rustig instuderen.", null, mapRec === "leren"));
    stages.appendChild(stageCard(base + "mc", "2", checkIconSVG(), "Oefenen — meerkeuze", "Bij elk symbool: kies de juiste naam uit vier opties.", null, mapRec === "oefenen"));
    stages.appendChild(stageCard(base + "typ", "2", pencilIconSVG(), "Oefenen — zelf typen", "Bij elk symbool: typ zelf de naam" + (group.secondaryLabel ? " en " + group.secondaryLabel.toLowerCase() : "") + ".", null, false));
    stages.appendChild(stageCard(base + "fouten", "3", retryIconSVG(), "Mijn fouten", "Herhaal enkel de symbolen die nog niet lukken.", mapRetryCount, mapRec === "fouten"));
    stages.appendChild(stageCard(base + "testen", "4", testIconSVG(), "Test jezelf", "Alle symbolen na elkaar, zonder hulp — pas achteraf het resultaat.", null, mapRec === "testen"));
    wrap.appendChild(stages);

    return wrap;
  }

  function breadcrumbs(r) {
    const parts = [el("a", { href: "#/home" }, ["Start"])];
    if (r.view === "home") return parts;
    if (r.view === "fouten") { parts.push(sep(), el("span", { class: "current" }, ["Mijn fouten"])); return parts; }
    if (r.view === "onderhoud") { parts.push(sep(), el("span", { class: "current" }, ["Onderhoud"])); return parts; }
    if (r.view === "leerkracht") { parts.push(sep(), el("span", { class: "current" }, ["Leerkrachtoverzicht"])); return parts; }
    const mod = r.p1 ? getModule(r.p1) : null;
    if (r.view === "module" && mod) {
      parts.push(sep(), el("a", { href: "#/module/" + mod.id }, [mod.title]));
      if (r.p2 === "testen") parts.push(sep(), el("span", { class: "current" }, ["Test jezelf"]));
      else if (r.p2) {
        const topic = getTopic(r.p1, r.p2);
        if (topic) parts.push(sep(), el("a", { href: "#/module/" + r.p1 + "/" + r.p2 }, [topic.title]));
        if (r.p3 === "leren") parts.push(sep(), el("span", { class: "current" }, ["Leren"]));
        else if (r.p3 === "oefenen") parts.push(sep(), el("span", { class: "current" }, ["Oefenen"]));
        else if (r.p3 === "fouten") parts.push(sep(), el("span", { class: "current" }, ["Mijn fouten"]));
        else if (r.p3 === "testen") parts.push(sep(), el("span", { class: "current" }, ["Test jezelf"]));
      }
    } else if (r.view === "kaart" && mod) {
      const group = r.p2 ? getMapGroup(r.p2) : null;
      parts.push(sep(), el("a", { href: "#/module/" + mod.id }, [mod.title]));
      if (group) parts.push(sep(), el("span", { class: "current" }, [group.title.replace(/^Kaartoefening:\s*/, "")]));
    }
    return parts;
  }
  function sep() { return el("span", { class: "sep" }, ["›"]); }

  function animateCount(target, end) {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !end) { target.textContent = String(end); return; }
    const dur = 700;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      target.textContent = String(Math.round(eased * end));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- viering bij een juist antwoord ---------------------------------- */

  const CONFETTI_COLORS = ["#e5343c", "#f0a63b", "#1f7a6c", "#2f86c9", "#8452ad", "#ffffff", "#c9932e"];

  function celebratePiece(layer, className, style, onClick) {
    const piece = document.createElement("span");
    piece.className = className;
    Object.keys(style).forEach(function (k) { piece.style[k] = style[k]; });
    piece.setAttribute("role", "button");
    piece.setAttribute("aria-label", "Tik om te laten knallen");
    piece.addEventListener("click", function () {
      piece.style.animation = "none";
      void piece.offsetWidth;
      piece.style.transition = "transform 0.2s ease, opacity 0.2s ease";
      piece.style.transform = "translate(-50%, -50%) scale(1.8)";
      piece.style.opacity = "0";
      setTimeout(function () { piece.remove(); }, 210);
    });
    if (onClick) piece.addEventListener("click", onClick);
    layer.appendChild(piece);
    return piece;
  }

  function celebrate(originEl) {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const kind = ["confetti", "vuurwerk", "toeters", "applaus"][Math.floor(Math.random() * 4)];
    const layer = document.createElement("div");
    layer.className = "celebrate-layer";
    let originX = 50, originY = 42;
    if (originEl && originEl.getBoundingClientRect) {
      const r = originEl.getBoundingClientRect();
      originX = ((r.left + r.width / 2) / window.innerWidth) * 100;
      originY = ((r.top + r.height / 2) / window.innerHeight) * 100;
    }

    const flash = document.createElement("span");
    flash.className = "celebrate-flash";
    flash.style.left = originX + "%";
    flash.style.top = originY + "%";
    layer.appendChild(flash);

    if (kind === "confetti") {
      for (let i = 0; i < 30; i++) {
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const angle = -Math.PI / 2 + (Math.random() * 1.4 - 0.7);
        const power = 80 + Math.random() * 130;
        const tx = Math.cos(angle) * power * 0.7;
        const midY = Math.sin(angle) * power - 40;
        const fallY = midY + 90 + Math.random() * 90;
        const w = 5 + Math.random() * 5, h = 8 + Math.random() * 8;
        celebratePiece(layer, "celebrate-confetti", {
          left: originX + "%",
          top: originY + "%",
          width: w + "px",
          height: h + "px",
          background: color,
          borderRadius: Math.random() < 0.4 ? "50%" : "2px"
        }, null).style.cssText += ";--tx:" + tx.toFixed(0) + "px;--mty:" + midY.toFixed(0) + "px;--fty:" + fallY.toFixed(0) + "px;" +
          "--rot1:" + (Math.random() * 360 - 180).toFixed(0) + "deg;--rot2:" + (540 + Math.random() * 360).toFixed(0) + "deg;" +
          "--dur:" + (1.1 + Math.random() * 0.5).toFixed(2) + "s;animation-delay:" + (Math.random() * 0.18).toFixed(2) + "s;";
      }
    } else if (kind === "vuurwerk") {
      const sparkColors = [CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)], "#ffffff", "#f0a63b"];
      const rays = 22;
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2;
        const dist = 70 + Math.random() * 90;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const color = sparkColors[i % sparkColors.length];
        celebratePiece(layer, "celebrate-spark", {
          left: originX + "%",
          top: originY + "%",
          background: color,
          boxShadow: "0 0 6px 1px " + color
        }, null).style.cssText += ";--tx:" + tx.toFixed(0) + "px;--ty:" + ty.toFixed(0) + "px;--dur:" + (0.55 + Math.random() * 0.25).toFixed(2) + "s;";
      }
      ["🎆", "🎇"].forEach(function (em, i) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 30;
        celebratePiece(layer, "celebrate-piece", {
          left: originX + "%", top: originY + "%", fontSize: "1.6rem",
          animationDelay: (i * 0.1) + "s"
        }, null).textContent = em;
        const last = layer.lastChild;
        last.style.cssText += ";--tx:" + (Math.cos(angle) * dist).toFixed(0) + "px;--ty:" + (Math.sin(angle) * dist).toFixed(0) + "px;--rot:" + (Math.random() * 180 - 90).toFixed(0) + "deg;--dur:0.7s;";
      });
    } else if (kind === "toeters") {
      for (let i = 0; i < 14; i++) {
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 55 + Math.random() * 110;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        celebratePiece(layer, "celebrate-ribbon", {
          left: originX + "%",
          top: originY + "%",
          background: "linear-gradient(90deg, " + color + ", transparent)"
        }, null).style.cssText += ";--tx:" + tx.toFixed(0) + "px;--ty:" + ty.toFixed(0) + "px;--rot:" + (Math.random() * 720 - 360).toFixed(0) + "deg;--dur:" + (0.8 + Math.random() * 0.4).toFixed(2) + "s;animation-delay:" + (Math.random() * 0.12).toFixed(2) + "s;";
      }
      ["📯", "🎺", "🎉"].forEach(function (em) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 60;
        const p = celebratePiece(layer, "celebrate-piece", { left: originX + "%", top: originY + "%", fontSize: "1.5rem" }, null);
        p.textContent = em;
        p.style.cssText += ";--tx:" + (Math.cos(angle) * dist).toFixed(0) + "px;--ty:" + (Math.sin(angle) * dist).toFixed(0) + "px;--rot:" + (Math.random() * 260 - 130).toFixed(0) + "deg;--dur:0.8s;";
      });
    } else {
      for (let i = 0; i < 5; i++) {
        const spread = (i - 2) * 26;
        const p = celebratePiece(layer, "celebrate-clap", {
          left: (originX + spread * 0.12) + "%",
          top: (originY - 6) + "%",
          fontSize: (1.3 + Math.random() * 0.5) + "rem",
          animationDelay: (i * 0.06) + "s"
        }, null);
        p.textContent = "👏";
        p.style.cssText += ";--tx:" + spread.toFixed(0) + "px;--ty:" + (-18 - Math.random() * 20).toFixed(0) + "px;--dur:0.9s;";
      }
    }

    document.body.appendChild(layer);
    setTimeout(function () { layer.remove(); }, 1700);
  }
  window.PKCelebrate = celebrate;

  /* ---------- HOME ---------------------------------------------------------- */

  const MODULE_ICONS = {
    "hasselt": pinIconOutlineSVG,
    "belgie": shieldIconSVG,
    "eu": starsRingIconSVG,
    "eu-rivieren-gebergtes": riverMountainIconSVG,
    "europa": compassSVG,
    "europa-water": waveIconSVG,
    "wereld-continenten": globeIconSVG,
    "wereld-landen-steden": skylineIconSVG,
    "wereld-relief": mountainIconSVG
  };
  const MODULE_ACCENTS = ["accent-red", "accent-teal", "accent-amber", "accent-violet", "accent-sky", "accent-ink"];

  function renderHome() {
    const wrap = el("div", { class: "view view-home" });

    wrap.appendChild(
      el("section", { class: "hero" }, [
        el("div", { class: "hero-media" }, [heroIllustrationSVG()]),
        el("div", { class: "hero-content" }, [
          el("h1", null, ["Permanente Kennis"]),
          el("p", { class: "hero-sub" }, [
            "Wat je hier leert, moet je heel het jaar blijven kennen. Daarom volg je telkens hetzelfde pad: leren, oefenen, fouten wegwerken, jezelf testen — en af en toe onderhouden."
          ]),
          el("div", { class: "hero-badges" }, [
            el("span", { class: "hero-badge badge-red" }, ["🧭 9 kaartbladen"]),
            el("span", { class: "hero-badge badge-teal" }, ["🗺️ echte bundelkaarten"]),
            el("span", { class: "hero-badge badge-amber" }, ["📶 werkt offline"])
          ])
        ])
      ])
    );

    /* "Ga verder waar je gebleven was" — het handigste knopje op de hele
       startpagina, dus meteen onder de hero, vóór al de rest. */
    const lastVisited = loadLastVisited();
    if (lastVisited && lastVisited.href && lastVisited.href !== "#/home") {
      wrap.appendChild(
        el("a", { class: "continue-card", href: lastVisited.href }, [
          el("span", { class: "continue-icon", "aria-hidden": "true" }, [retryIconSVG()]),
          el("span", { class: "continue-text" }, [
            el("span", { class: "continue-kicker" }, ["Ga verder waar je gebleven was"]),
            el("strong", null, [lastVisited.label])
          ]),
          el("span", { class: "continue-arrow", "aria-hidden": "true" }, ["→"])
        ])
      );
    }

    /* Mijn voortgang: fouten + onderhoud vlot bereikbaar. Onderhoud krijgt
       hier bewust het meeste gewicht (grote kaart, duidelijke uitleg) —
       pedagogisch het belangrijkste knopje van de site, maar voorheen
       onderaan een klein pilletje. */
    const allIds = allItemIds();
    const retryCount = Progress.retryList(allIds).length;
    const dueCount = Progress.dueForMaintenance(allIds).length;

    wrap.appendChild(
      el("section", { class: "action-row" }, [
        el("a", { class: "maintenance-card" + (dueCount ? " maintenance-card-due" : ""), href: "#/onderhoud" }, [
          el("div", { class: "maintenance-icon", "aria-hidden": "true" }, [maintenanceIconSVG()]),
          el("div", { class: "maintenance-text" }, [
            el("strong", null, ["Onderhoud"]),
            el("p", null, [
              dueCount
                ? "Je kent dit al, maar het is tijd om het weer even op te frissen — zo blijft het echt hangen."
                : "Wat je beheerst, komt hier vanzelf terug zodat je het nooit meer vergeet."
            ])
          ]),
          el("span", { class: "maintenance-count" + (dueCount ? " maintenance-count-due" : "") }, [String(dueCount)])
        ]),
        el("a", { class: "quick-link quick-link-fouten" + (retryCount ? "" : " quick-link-empty"), href: "#/fouten" }, [
          retryIconSVG(),
          el("span", null, ["Mijn fouten"]),
          el("span", { class: "quick-link-count" }, [retryCount ? String(retryCount) : "0"])
        ])
      ])
    );

    function moduleCard(mod, i) {
      const onderdelen = mod.topics.length + mapGroupsFor(mod.id).length;
      const iconFn = MODULE_ICONS[mod.id] || compassSVG;
      const accent = MODULE_ACCENTS[i % MODULE_ACCENTS.length];
      const sum = moduleSummary(mod);
      const practFill = el("div", { class: "sheet-progress-fill fill-practiced", style: "width:0%" });
      const masterFill = el("div", { class: "sheet-progress-fill fill-mastered", style: "width:0%" });
      const card = el("a", { class: "sheet-card " + accent, href: "#/module/" + mod.id, style: "--i:" + i }, [
        el("span", { class: "sheet-stamp", "aria-hidden": "true" }, [(mod.label.match(/\d+/) || [""])[0]]),
        el("div", { class: "sheet-icon-badge", "aria-hidden": "true" }, [iconFn()]),
        el("span", { class: "sheet-label" }, [mod.label]),
        el("h2", null, [mod.title]),
        el("p", { class: "sheet-subtitle" }, [mod.subtitle]),
        el("p", { class: "sheet-intro" }, [mod.intro]),
        el("div", { class: "sheet-footer" }, [
          el("span", { class: "sheet-meta" }, [onderdelen + " onderdelen · openen →"]),
          el("div", { class: "sheet-progress sheet-progress-double" }, [practFill, masterFill]),
          el("span", { class: "sheet-progress-label" }, [sum.masteredPct + "% beheerst · " + sum.practicedPct + "% geoefend"]),
          window.PKCounter
            ? el("img", {
                class: "sheet-counter",
                src: window.PKCounter.badgeUrl(mod.id, "leerlingen"),
                alt: "Aantal leerlingen dat hier al oefende",
                loading: "lazy"
              })
            : null
        ])
      ]);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          practFill.style.width = sum.practicedPct + "%";
          masterFill.style.width = sum.masteredPct + "%";
        });
      });
      return card;
    }

    const EERSTE_GRAAD_IDS = ["hasselt", "belgie"];
    const eersteGraadModules = PK_DATA.modules.filter((m) => EERSTE_GRAAD_IDS.indexOf(m.id) !== -1);
    const tweedeGraadModules = PK_DATA.modules.filter((m) => EERSTE_GRAAD_IDS.indexOf(m.id) === -1);

    const gridEerste = el("div", { class: "sheet-grid" });
    eersteGraadModules.forEach((mod, i) => gridEerste.appendChild(moduleCard(mod, i)));
    wrap.appendChild(
      el("section", { class: "graad-panel graad-panel-eerste" }, [
        el("h2", { class: "section-heading graad-heading" }, ["Kaartblad 1 en 2 — eerste graad"]),
        el("p", { class: "graad-note" }, ["Voor leerlingen van het eerste jaar geografie. Zit je in de tweede of derde graad? Dan kan je dit overslaan."]),
        gridEerste
      ])
    );

    const gridTweede = el("div", { class: "sheet-grid" });
    tweedeGraadModules.forEach((mod, i) => gridTweede.appendChild(moduleCard(mod, i)));
    wrap.appendChild(
      el("section", { class: "graad-panel graad-panel-tweede" }, [
        el("h2", { class: "section-heading graad-heading" }, ["Kaartblad 3 tot 9 — tweede en derde graad"]),
        el("p", { class: "graad-note" }, ["Dit is de stof die je doorheen de tweede en derde graad moet blijven kennen."]),
        gridTweede
      ])
    );

    /* De rest (hoe werkt het, cijfers, doelen) is leuk maar niet iets een
       leerling elke keer opnieuw moet zien — daarom achter een simpele
       <details>-uitklapper, dicht bij elkaar, zodat de startpagina zelf
       overzichtelijk blijft. */
    const stats = Progress.loadStats();
    const globalSum = Progress.summarize(allIds);

    const moreDetails = el("details", { class: "home-more" });
    moreDetails.appendChild(el("summary", null, ["📊 Hoe werkt het, en hoe sta ik ervoor?"]));

    const moreInner = el("div", { class: "home-more-inner" });
    moreInner.appendChild(howItWorksStrip());

    const streakValueEl = el("span", { class: "stat-value" }, ["0"]);
    const answeredValueEl = el("span", { class: "stat-value" }, ["0"]);
    const globalValueEl = el("span", { class: "stat-value" }, ["…"]);
    moreInner.appendChild(
      el("section", { class: "stats-strip" }, [
        el("div", { class: "stat-tile stat-streak" }, [
          el("span", { class: "stat-icon stat-icon-pulse", "aria-hidden": "true" }, ["🔥"]),
          streakValueEl,
          el("span", { class: "stat-label" }, [(stats.streakCount === 1 ? "dag" : "dagen") + " op rij geoefend"]),
          el("span", { class: "stat-milestone" }, [milestoneNote(stats.streakCount || 0, STREAK_GOALS)])
        ]),
        el("div", { class: "stat-tile stat-answered" }, [
          el("span", { class: "stat-icon stat-check-badge", "aria-hidden": "true" }, [checkTickSVG()]),
          answeredValueEl,
          el("span", { class: "stat-label" }, ["vragen door jou beantwoord"]),
          el("span", { class: "stat-milestone" }, [milestoneNote(stats.totalAnswered || 0, ANSWERED_GOALS)])
        ]),
        el("div", { class: "stat-tile stat-global" }, [
          el("span", { class: "stat-icon", "aria-hidden": "true" }, ["🌍"]),
          globalValueEl,
          el("span", { class: "stat-label" }, ["keer geopend door iedereen samen"])
        ])
      ])
    );
    moreInner.appendChild(
      el("div", { class: "progress-panel-bars" }, [
        labeledBar("Geoefend (jij, alle kaartbladen)", globalSum.practicedPct, "bar-practiced"),
        labeledBar("Beheerst (jij, alle kaartbladen)", globalSum.masteredPct, "bar-mastered")
      ])
    );
    moreInner.appendChild(
      el("div", { class: "goals-grid" }, [
        el("div", { class: "goals-col" }, [
          el("h4", null, ["🔥 Reeks volhouden"]),
          goalsList(stats.streakCount || 0, STREAK_GOALS, "dagen")
        ]),
        el("div", { class: "goals-col" }, [
          el("h4", null, ["✅ Vragen beantwoord"]),
          goalsList(stats.totalAnswered || 0, ANSWERED_GOALS, "vragen")
        ])
      ])
    );
    moreDetails.appendChild(moreInner);
    moreDetails.addEventListener("toggle", function () {
      if (!moreDetails.open) return;
      animateCount(streakValueEl, stats.streakCount || 0);
      animateCount(answeredValueEl, stats.totalAnswered || 0);
      fetchGlobalCounter(globalValueEl);
    }, { once: true });
    wrap.appendChild(moreDetails);

    return wrap;
  }

  function labeledBar(label, pct, cls) {
    const fill = el("div", { class: "labeled-bar-fill " + cls, style: "width:0%" });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { fill.style.width = pct + "%"; });
    });
    return el("div", { class: "labeled-bar" }, [
      el("div", { class: "labeled-bar-head" }, [el("span", null, [label]), el("span", null, [pct + "%"])]),
      el("div", { class: "labeled-bar-track" }, [fill])
    ]);
  }

  function howItWorksStrip() {
    const steps = [
      { icon: cardsIconSVG(), title: "1. Leren", text: "Bekijk de kaart of het overzicht rustig, zonder druk." },
      { icon: checkIconSVG(), title: "2. Oefenen", text: "Oefen met oplopende moeilijkheid. Fouten komen vanzelf terug." },
      { icon: retryIconSVG(), title: "3. Mijn fouten", text: "Herhaal gericht net dat wat nog niet lukt." },
      { icon: testIconSVG(), title: "4. Test jezelf", text: "Zonder hulp, zoals op een echte toets." },
      { icon: maintenanceIconSVG(), title: "5. Onderhoud", text: "Wat je al kende, komt later vanzelf terug." }
    ];
    return el("section", { class: "howitworks" }, [
      el("h3", null, ["Hoe werkt het?"]),
      el("div", { class: "howitworks-row" }, steps.map((s) =>
        el("div", { class: "howitworks-step" }, [
          el("div", { class: "howitworks-icon" }, [s.icon]),
          el("strong", null, [s.title]),
          el("p", null, [s.text])
        ])
      ))
    ]);
  }

  /* ---------- MODULE OVERVIEW ------------------------------------------------ */

  function renderModule(moduleId) {
    const mod = getModule(moduleId);
    const wrap = el("div", { class: "view view-module" });
    wrap.appendChild(el("span", { class: "kicker" }, [mod.label]));
    wrap.appendChild(el("h1", null, [mod.title]));
    wrap.appendChild(el("p", { class: "module-intro" }, [mod.intro]));

    if (mod.headerImage) {
      wrap.appendChild(
        el("figure", { class: "module-header-img" }, [
          el("img", { src: mod.headerImage.src, alt: mod.headerImage.alt || "", loading: "lazy" }),
          mod.headerImage.caption ? el("figcaption", null, [mod.headerImage.caption]) : null
        ])
      );
    }

    if (window.PKCounter) {
      wrap.appendChild(
        el("p", { class: "module-counter" }, [
          el("img", {
            src: window.PKCounter.badgeUrl(moduleId, "leerlingen oefenden hier al"),
            alt: "Aantal leerlingen dat hier al oefende",
            loading: "lazy"
          })
        ])
      );
    }

    const modSum = moduleSummary(mod);
    wrap.appendChild(
      el("div", { class: "progress-panel-bars module-bars" }, [
        labeledBar("Geoefend", modSum.practicedPct, "bar-practiced"),
        labeledBar("Beheerst", modSum.masteredPct, "bar-mastered")
      ])
    );

    const mapGroups = mapGroupsFor(moduleId);
    if (mapGroups.length) {
      wrap.appendChild(el("h2", { class: "section-heading" }, ["Kaartoefeningen"]));
      const mapList = el("div", { class: "topic-list" });
      mapGroups.forEach((g) => {
        const sum = mapSummary(g);
        mapList.appendChild(
          el("a", { class: "topic-row", href: "#/kaart/" + moduleId + "/" + g.id + "/start" }, [
            el("div", { class: "topic-kind-dot kind-map", "aria-hidden": "true" }, []),
            el("div", { class: "topic-row-main" }, [
              el("h3", null, [g.title.replace(/^Kaartoefening:\s*/, "")]),
              el("p", null, [g.legend.length + " plaatsen op de kaart · " + sum.masteredPct + "% beheerst"])
            ]),
            dualMasteryBar(sum)
          ])
        );
      });
      wrap.appendChild(mapList);
      wrap.appendChild(el("h2", { class: "section-heading" }, ["Woordjes en feiten"]));
    }

    const list = el("div", { class: "topic-list" });
    mod.topics.forEach((topic) => {
      const sum = topicSummary(topic);
      const row = el("a", { class: "topic-row", href: "#/module/" + moduleId + "/" + topic.id }, [
        el("div", { class: "topic-kind-dot kind-" + topic.kind, "aria-hidden": "true" }, []),
        el("div", { class: "topic-row-main" }, [
          el("h3", null, [topic.title]),
          el("p", null, [topic.items.length + " items · " + sum.masteredPct + "% beheerst"])
        ]),
        dualMasteryBar(sum)
      ]);
      list.appendChild(row);
    });
    wrap.appendChild(list);

    wrap.appendChild(
      el("a", { class: "btn btn-primary big-cta", href: "#/module/" + moduleId + "/testen" }, [
        "Test jezelf — hele kaartblad door elkaar"
      ])
    );

    return wrap;
  }

  function dualMasteryBar(sum) {
    const bar = el("div", { class: "mastery mastery-double", title: sum.masteredPct + "% beheerst, " + sum.practicedPct + "% geoefend" });
    const practFill = el("div", { class: "mastery-fill fill-practiced", style: "width:0%" });
    const masterFill = el("div", { class: "mastery-fill fill-mastered", style: "width:0%" });
    bar.appendChild(practFill);
    bar.appendChild(masterFill);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        practFill.style.width = sum.practicedPct + "%";
        masterFill.style.width = sum.masteredPct + "%";
      });
    });
    return bar;
  }

  function progressSummaryBlock(sum) {
    const parts = [
      el("span", { class: "progress-chip chip-new" }, [(sum.total - sum.seen) + " nog te leren"]),
      el("span", { class: "progress-chip chip-practicing" }, [sum.practicing + " in oefening"]),
      el("span", { class: "progress-chip chip-mastered" }, [sum.mastered + " beheerst"])
    ];
    if (sum.due) parts.push(el("span", { class: "progress-chip chip-due" }, [sum.due + " toe aan onderhoud"]));
    return el("div", { class: "progress-summary" }, parts);
  }

  /* ---------- TOPIC HUB (Leren / Oefenen / Fouten / Testen) ------------------ */

  function renderTopicHub(moduleId, topicId) {
    const topic = getTopic(moduleId, topicId);
    const wrap = el("div", { class: "view view-onderdeel-hub" });
    wrap.appendChild(el("h1", null, [topic.title]));

    const descText =
      topic.kind === "category"
        ? "Herken je tot welke soort elke naam behoort? (" + topic.categories.join(", ") + ")"
        : topic.promptLabel + " → " + topic.answerLabel;
    wrap.appendChild(el("p", { class: "module-intro" }, [descText]));
    if (topic.note) wrap.appendChild(el("p", { class: "topic-note" }, [topic.note]));

    const sum = topicSummary(topic);
    wrap.appendChild(progressSummaryBlock(sum));

    const retryCount = Progress.retryList(topicItemIds(topic)).length;
    const rec = recommendedStage(sum, retryCount);
    const base = "#/module/" + moduleId + "/" + topicId + "/";
    const stages = el("div", { class: "stage-grid stepper" });
    stages.appendChild(stageCard(base + "leren", "1", cardsIconSVG(), "Leren", "Overzicht van alle antwoorden, rustig instuderen.", null, rec === "leren"));
    stages.appendChild(stageCard(base + "oefenen/adaptief", "2", checkIconSVG(), "Oefenen", "Oplopende moeilijkheid, fouten komen vanzelf terug.", null, rec === "oefenen"));
    stages.appendChild(stageCard(base + "fouten", "3", retryIconSVG(), "Mijn fouten", "Herhaal enkel wat nog niet lukt.", retryCount, rec === "fouten"));
    stages.appendChild(stageCard(base + "testen", "4", testIconSVG(), "Test jezelf", "Zonder hulp — resultaat pas op het einde.", null, rec === "testen"));
    wrap.appendChild(stages);

    wrap.appendChild(el("h3", { class: "section-heading small-heading" }, ["Andere oefenvormen"]));
    const modes = el("div", { class: "mode-grid mode-grid-compact" });
    modes.appendChild(modeCard(base + "oefenen/meerkeuze", checkIconSVG(), "Meerkeuze", "Kies telkens het juiste antwoord uit vier opties."));
    modes.appendChild(modeCard(base + "oefenen/juistfout", tfIconSVG(), "Juist of fout", "Beoordeel of het voorgestelde antwoord klopt."));
    if (topic.allowTyping !== false) {
      modes.appendChild(modeCard(base + "oefenen/invultoets", pencilIconSVG(), "Invultoets", "Typ het antwoord zelf."));
      modes.appendChild(modeCard(base + "oefenen/tabel", tableIconSVG(), "Tabeltoets", "Vul de hele tabel in en verbeter in één keer."));
    }
    wrap.appendChild(modes);

    return wrap;
  }

  function stageCard(href, num, icon, title, text, badge, recommended) {
    const children = [
      el("span", { class: "stage-num", "aria-hidden": "true" }, [num]),
      el("div", { class: "stage-icon" }, [icon]),
      el("h3", null, [title]),
      el("p", null, [text])
    ];
    if (recommended) {
      children.unshift(el("span", { class: "stage-recommended" }, ["Begin hier →"]));
    }
    if (badge != null) {
      children.push(el("span", { class: "stage-badge" + (badge ? "" : " stage-badge-zero") }, [String(badge)]));
    }
    return el("a", { class: "stage-card" + (recommended ? " stage-card-recommended" : ""), href: href }, children);
  }

  /* Welke stap (leren/oefenen/fouten/testen) heeft nu het meeste zin om
     als volgende te doen voor dit onderdeel? Gebruikt om die stap in de
     stepper visueel te laten opvallen, zodat een leerling niet zelf hoeft
     te bedenken waar te beginnen. */
  function recommendedStage(sum, retryCount) {
    if (retryCount > 0) return "fouten";
    if (!sum.seen) return "leren";
    if (sum.masteredPct < 80) return "oefenen";
    return "testen";
  }

  function modeCard(href, icon, title, text) {
    return el("a", { class: "mode-card", href: href }, [
      el("div", { class: "mode-icon" }, [icon]),
      el("h3", null, [title]),
      el("p", null, [text])
    ]);
  }

  /* ---------- LEREN (leer-/overzichtspagina) ---------------------------------- */

  function renderLeren(moduleId, topicId) {
    const topic = getTopic(moduleId, topicId);
    const wrap = el("div", { class: "view view-leren" });
    wrap.appendChild(el("h1", null, [topic.title]));
    wrap.appendChild(
      el("p", { class: "module-intro" }, [
        "Lees dit overzicht eerst rustig door. Daarna ga je oefenen."
      ])
    );
    if (topic.note) wrap.appendChild(el("p", { class: "topic-note" }, [topic.note]));

    const frontLabel = topic.kind === "category" ? "Naam" : topic.promptLabel;
    const backLabel = topic.kind === "category" ? "Soort" : topic.answerLabel;

    const tableWrap = el("div", { class: "table-wrap" });
    const table = el("table", { class: "quiz-table" });
    table.appendChild(el("thead", null, [el("tr", null, [el("th", null, [frontLabel]), el("th", null, [backLabel])])]));
    const tbody = el("tbody");
    topic.items.forEach((item) => {
      const back = topic.kind === "category" ? item.category : item.answer;
      tbody.appendChild(el("tr", null, [el("td", { class: "table-term" }, [item.term]), el("td", null, [back])]));
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrap.appendChild(tableWrap);

    wrap.appendChild(
      el("div", { class: "quiz-actions" }, [
        el("a", { class: "btn", href: "#/module/" + moduleId + "/" + topicId + "/leren/kaarten" }, ["Liever als leerkaarten? →"]),
        el("a", { class: "btn btn-primary", href: "#/module/" + moduleId + "/" + topicId + "/oefenen/adaptief" }, ["Klaar — ga oefenen →"])
      ])
    );

    return wrap;
  }

  /* ---------- FLASHCARDS (binnen Leren, optioneel) ---------------------------- */

  function faceFor(topic, item, reverse) {
    if (topic.kind === "category") {
      return { front: item.term, back: item.category, frontLabel: "Welke soort?", backLabel: "Soort" };
    }
    if (reverse) {
      return { front: item.answer, back: item.term, frontLabel: topic.answerLabel, backLabel: topic.promptLabel };
    }
    return { front: item.term, back: item.answer, frontLabel: topic.promptLabel, backLabel: topic.answerLabel };
  }

  function renderFlashcards(moduleId, topicId) {
    const topic = getTopic(moduleId, topicId);
    const order = shuffle(topic.items.map((_, i) => i));
    let pos = 0;

    const wrap = el("div", { class: "view view-study" });
    wrap.appendChild(el("h1", null, [topic.title]));
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
      const face = faceFor(topic, item, false);

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
              if (pos < order.length - 1) { pos++; draw(); }
              else {
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
    wrap.appendChild(
      el("a", { class: "btn btn-primary big-cta", href: "#/module/" + moduleId + "/" + topicId + "/oefenen/adaptief" }, ["Klaar — ga oefenen →"])
    );
    return wrap;
  }

  /* ---------- vraag-opbouw (meerkeuze / juist-fout / typen) ------------------- */

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

  function pickAdaptiveKind(progressId, allowTyping) {
    const st = Progress.getItem(progressId);
    if (st.streak <= 0) return "mc";
    if (st.streak === 1) return "tf";
    return allowTyping === false ? "mc" : "type";
  }

  /* ---------- OEFENEN (per onderdeel: adaptief of een vaste modus) ------------ */

  function renderOefenen(moduleId, topicId, variant) {
    const topic = getTopic(moduleId, topicId);
    if (variant === "tabel") return renderTable(moduleId, topicId);
    const ids = topicItemIds(topic);

    let kind = variant; // "adaptief" | "meerkeuze" | "juistfout" | "invultoets"
    const kindMap = { meerkeuze: "mc", juistfout: "tf", invultoets: "type" };

    const entries = topic.items.map((item, i) => ({
      item: item,
      progressId: ids[i]
    }));

    return runSession({
      title: topic.title + (variant === "adaptief" ? " — oefenen" : ""),
      backHref: "#/module/" + moduleId + "/" + topicId,
      entries: shuffle(entries),
      mode: "practice",
      onderdeelScope: "t:" + topic.id,
      kindFor: (entry) => (kind === "adaptief" ? pickAdaptiveKind(entry.progressId, topic.allowTyping) : kindMap[kind] || "mc"),
      buildFor: (entry, k) => (k === "tf" ? buildTF(topic, entry.item, false) : buildQuestion(topic, entry.item, false)),
      itemTitle: () => topic.title,
      onModuleTouch: () => { if (window.PKCounter) window.PKCounter.bump(moduleId); }
    });
  }

  function renderTopicFouten(moduleId, topicId) {
    const topic = getTopic(moduleId, topicId);
    const wrap = el("div", { class: "view view-quiz" });
    renderOnderdeelFoutenSession(wrap, { kind: "topic", topic: topic, moduleId: moduleId }, "#/module/" + moduleId + "/" + topicId);
    return wrap;
  }

  function renderTopicTest(moduleId, topicId) {
    const topic = getTopic(moduleId, topicId);
    const wrap = el("div", { class: "view view-quiz" });
    renderOnderdeelTestSession(wrap, { kind: "topic", topic: topic, moduleId: moduleId }, "#/module/" + moduleId + "/" + topicId);
    return wrap;
  }

  function renderOnderdeelFoutenSession(wrap, ref, backHref) {
    const entries = ref.kind === "topic" ? topicEntries(ref.topic) : mapEntries(ref.group);
    const retryIds = new Set(Progress.retryList(entries.map((e) => e.progressId)));
    const filtered = entries.filter((e) => retryIds.has(e.progressId));
    const scope = ref.kind === "topic" ? "t:" + ref.topic.id : "m:" + ref.group.id;
    const title = (ref.kind === "topic" ? ref.topic.title : ref.group.title.replace(/^Kaartoefening:\s*/, "")) + " — mijn fouten";

    if (!filtered.length) {
      wrap.appendChild(el("h1", null, [title]));
      wrap.appendChild(nothingToRetryBlock(backHref));
      return;
    }

    const sessionNode = runSession({
      title: title,
      backHref: backHref,
      entries: shuffle(filtered),
      mode: "practice",
      onderdeelScope: scope,
      kindFor: (entry) => (ref.kind === "topic" ? pickAdaptiveKind(entry.progressId, ref.topic.allowTyping) : "mc"),
      buildFor: (entry, k) =>
        ref.kind === "topic"
          ? k === "tf" ? buildTF(ref.topic, entry.item, false) : buildQuestion(ref.topic, entry.item, false)
          : buildMapQuestion(ref.group, entry.item, k),
      onModuleTouch: () => { if (window.PKCounter) window.PKCounter.bump(ref.moduleId); }
    });
    wrap.appendChild(sessionNode);
  }

  function nothingToRetryBlock(backHref) {
    return el("div", { class: "empty-state" }, [
      el("div", { class: "empty-state-icon" }, ["🎉"]),
      el("p", null, ["Niets te herhalen — hier staan momenteel geen fouten open."]),
      el("a", { class: "btn btn-primary", href: backHref }, ["Terug"])
    ]);
  }

  function renderOnderdeelTestSession(wrap, ref, backHref) {
    const entries = ref.kind === "topic" ? topicEntries(ref.topic) : mapEntries(ref.group);
    const scope = ref.kind === "topic" ? "t:" + ref.topic.id : "m:" + ref.group.id;
    const title = (ref.kind === "topic" ? ref.topic.title : ref.group.title.replace(/^Kaartoefening:\s*/, "")) + " — test jezelf";
    const sessionNode = runSession({
      title: title,
      backHref: backHref,
      entries: shuffle(entries),
      mode: "test",
      onderdeelScope: scope,
      kindFor: () => "mc",
      buildFor: (entry) =>
        ref.kind === "topic" ? buildQuestion(ref.topic, entry.item, false) : buildMapQuestion(ref.group, entry.item, "mc"),
      onModuleTouch: () => { if (window.PKCounter) window.PKCounter.bump(ref.moduleId); }
    });
    wrap.appendChild(sessionNode);
  }

  function topicEntries(topic) {
    const ids = topicItemIds(topic);
    return topic.items.map((item, i) => ({ item: item, progressId: ids[i] }));
  }
  function mapEntries(group) {
    const ids = mapItemIds(group);
    return group.legend.map((entry, i) => ({ item: entry, progressId: ids[i] }));
  }

  function buildMapQuestion(group, entry, kind) {
    const allTerms = group.legend.map((e) => e.term);
    if (kind === "tf") {
      const isTrue = Math.random() < 0.5;
      const shown = isTrue ? entry.term : sample(allTerms, 1, entry.term)[0] || entry.term;
      return {
        prompt: "Symbool " + entry.key + " op de kaart",
        promptLabel: "Kaartoefening: " + group.title.replace(/^Kaartoefening:\s*/, ""),
        statementLabel: "Naam",
        statement: shown,
        isTrue: isTrue,
        correct: entry.term,
        image: group.image,
        mapGroup: group,
        mapEntry: entry
      };
    }
    const distractors = sample(allTerms, 3, entry.term);
    return {
      prompt: "Symbool " + entry.key + " op de kaart",
      promptLabel: "Kaartoefening: " + group.title.replace(/^Kaartoefening:\s*/, ""),
      correct: entry.term,
      options: shuffle([entry.term, ...distractors]),
      image: group.image,
      mapGroup: group,
      mapEntry: entry
    };
  }

  /* ---------- Generieke sessierunner (oefenen / fouten / test / onderhoud) ---- */

  function runSession(cfg) {
    const wrap = el("div", { class: "view view-quiz" });
    wrap.appendChild(el("h1", null, [cfg.title]));
    if (cfg.mode === "test") {
      wrap.appendChild(el("p", { class: "topic-note" }, ["Testmodus: je ziet pas op het einde of je antwoorden juist waren."]));
    }

    const scoreEl = el("p", { class: "quiz-score" }, []);
    const streakEl = el("p", { class: "quiz-live-streak" }, []);
    const progress = el("div", { class: "progress-dots" });
    const stage = el("div", { class: "quiz-stage" });

    wrap.appendChild(scoreEl);
    wrap.appendChild(streakEl);
    wrap.appendChild(progress);
    wrap.appendChild(stage);

    const queue = cfg.entries.slice();
    const originalTotal = queue.length;
    let pos = 0;
    let correctCount = 0;
    let doneCount = 0;
    let answered = false;
    let liveStreak = 0;
    let bestLiveStreak = 0;
    let newlyMasteredCount = 0;
    const missed = [];
    const seenRequeue = new Map();

    function currentEntryTitle(entry) {
      return cfg.itemTitle ? cfg.itemTitle(entry) : cfg.title;
    }

    function updateHeader() {
      scoreEl.textContent = cfg.mode === "test"
        ? "Vraag " + Math.min(pos + 1, queue.length) + " / " + originalTotal
        : "Score: " + correctCount + " / " + doneCount + (pos >= queue.length ? " · klaar" : "");
      if (cfg.mode === "practice" && liveStreak >= 2) {
        streakEl.textContent = "🔥 " + liveStreak + " op rij juist!";
        streakEl.className = "quiz-live-streak quiz-live-streak-on";
      } else {
        streakEl.textContent = "";
        streakEl.className = "quiz-live-streak";
      }
      progress.innerHTML = "";
      const shown = Math.min(queue.length, 30);
      for (let i = 0; i < shown; i++) {
        let cls = "dot";
        if (i < pos) cls += " dot-done";
        if (i === pos) cls += " dot-active";
        progress.appendChild(el("span", { class: cls }));
      }
    }

    function recordAndAdvance(entry, isCorrect) {
      const beforeStage = Progress.stageOf(entry.progressId);
      const updated = Progress.recordAnswer(entry.progressId, isCorrect);
      window.PKAnalytics && window.PKAnalytics.recordAnswer(entry.progressId, isCorrect);
      doneCount++;
      if (isCorrect) {
        correctCount++;
        liveStreak++;
        bestLiveStreak = Math.max(bestLiveStreak, liveStreak);
      } else {
        liveStreak = 0;
        missed.push(entry);
      }
      const justMastered = beforeStage !== "mastered" && updated.stage === "mastered";
      if (justMastered) newlyMasteredCount++;
      if (cfg.mode === "practice" && !isCorrect) {
        const n = seenRequeue.get(entry) || 0;
        if (n < 2) {
          seenRequeue.set(entry, n + 1);
          const insertAt = Math.min(queue.length, pos + 2 + Math.floor(Math.random() * 3));
          queue.splice(insertAt, 0, entry);
        }
      }
      updateHeader();
      return { isCorrect: isCorrect, justMastered: justMastered, item: updated };
    }

    /* correctAnswer/extraNote: bij een fout antwoord tonen we altijd,
       kort en duidelijk, wat het juiste antwoord wél was (niet enkel
       "fout"), zodat een leerling meteen het goede antwoord onthoudt. */
    function applyFeedback(feedbackEl, outcome, correctAnswer, focusEl, extraNote) {
      if (outcome.justMastered) {
        feedbackEl.textContent = "⭐ Beheerst! Dit zit er nu goed in.";
        feedbackEl.className = "quiz-feedback feedback-mastered";
        celebrate(focusEl);
        setTimeout(() => celebrate(focusEl), 220);
      } else if (outcome.isCorrect) {
        feedbackEl.textContent = "Juist!";
        feedbackEl.className = "quiz-feedback feedback-good";
        celebrate(focusEl);
      } else {
        feedbackEl.innerHTML = "";
        feedbackEl.appendChild(document.createTextNode("❌ Fout — het juiste antwoord is "));
        feedbackEl.appendChild(el("strong", { class: "feedback-answer" }, [correctAnswer]));
        if (extraNote) feedbackEl.appendChild(document.createTextNode(" " + extraNote));
        feedbackEl.className = "quiz-feedback feedback-bad";
      }
    }

    function levelChip(kind) {
      const map = {
        mc: { text: "🟢 Meerkeuze", cls: "level-easy" },
        tf: { text: "🟡 Juist of fout", cls: "level-mid" },
        type: { text: "🔴 Zelf typen", cls: "level-hard" }
      };
      const info = map[kind] || map.mc;
      return el("span", { class: "level-chip " + info.cls }, [info.text]);
    }

    function masteryMeter(entry) {
      if (cfg.mode !== "practice") return null;
      const st = Progress.getItem(entry.progressId);
      if (st.stage === "mastered") {
        return el("p", { class: "mastery-meter mastery-meter-done" }, ["⭐ Al beheerst — dit is onderhoud."]);
      }
      const need = Progress.MASTER_STREAK;
      const dots = [];
      for (let i = 0; i < need; i++) {
        dots.push(el("span", { class: "meter-dot" + (i < st.streak ? " meter-dot-on" : "") }));
      }
      const label = st.streak > 0 ? "nog " + (need - st.streak) + "x juist voor beheerst" : "op weg naar beheerst";
      return el("p", { class: "mastery-meter" }, [el("span", { class: "meter-dots" }, dots), el("span", null, [" " + label])]);
    }

    function finish() {
      cfg.onModuleTouch && cfg.onModuleTouch();
      const pct = doneCount ? Math.round((correctCount / doneCount) * 100) : 0;
      stage.innerHTML = "";
      const msg =
        pct >= 90 ? "🎉 Uitstekend, dit zit goed vast." : pct >= 70 ? "👍 Goed bezig — nog even bijschaven." : "🌱 Blijf oefenen, je gaat vooruit.";
      const result = el("div", { class: "quiz-result" }, [
        el("p", { class: "result-big" }, [pct + "%"]),
        el("p", { class: "result-msg" }, [msg + " (" + correctCount + " van de " + doneCount + " juist)"])
      ]);
      if (newlyMasteredCount > 0) {
        result.appendChild(
          el("p", { class: "result-mastered-banner" }, [
            "🌟 " + newlyMasteredCount + (newlyMasteredCount === 1 ? " vraagje" : " vraagjes") + " deze keer onder de knie gekregen!"
          ])
        );
      }
      if (bestLiveStreak >= 5) {
        result.appendChild(el("p", { class: "result-streak-banner" }, ["🔥 Beste reeks deze sessie: " + bestLiveStreak + " op rij juist."]));
      }
      const missedInfo = dedupeMissed(missed.map((m) => missedInfoOf(m)));
      if (missedInfo.length) {
        const list = el("ul", { class: "missed-list" });
        missedInfo.forEach((m) => list.appendChild(
          el("li", null, [
            m.prompt,
            el("span", { class: "missed-correct" }, [" → " + m.correct])
          ])
        ));
        result.appendChild(el("p", { class: "missed-heading" }, ["Nog eens bekijken — dit was het juiste antwoord:"]));
        result.appendChild(list);
      }
      const actions = el("div", { class: "quiz-actions" });
      if (missed.length) {
        actions.appendChild(el("a", { class: "btn btn-primary", href: cfg.foutenHref || cfg.backHref }, ["Oefen mijn fouten opnieuw →"]));
      }
      actions.appendChild(
        el("button", { class: "btn", type: "button", onclick: () => {
          queue.length = 0;
          // Bij een steekproef (kaartbladtest) telkens een NIEUWE selectie trekken,
          // anders krijgt de leerling bij "Nog een keer" steeds dezelfde vragen.
          if (typeof cfg.pickEntries === "function") cfg.entries = cfg.pickEntries();
          Array.prototype.push.apply(queue, shuffle(cfg.entries));
          pos = 0; correctCount = 0; doneCount = 0; missed.length = 0; answered = false;
          liveStreak = 0; bestLiveStreak = 0; newlyMasteredCount = 0;
          draw();
        } }, ["Nog een keer"])
      );
      actions.appendChild(el("a", { class: "btn", href: cfg.backHref }, ["Terug"]));
      result.appendChild(actions);
      stage.appendChild(result);
    }

    function missedInfoOf(entry) {
      const k = cfg.kindFor(entry);
      const q = cfg.buildFor(entry, k);
      return { prompt: q.prompt || currentEntryTitle(entry), correct: q.correct || "" };
    }
    function dedupeMissed(list) {
      const seen = new Set();
      const out = [];
      list.forEach((m) => {
        const key = m.prompt + "|" + m.correct;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(m);
      });
      return out;
    }

    function draw() {
      updateHeader();
      stage.innerHTML = "";

      if (pos >= queue.length) { finish(); return; }

      answered = false;
      const entry = queue[pos];
      const kind = cfg.kindFor(entry);
      const q = cfg.buildFor(entry, kind);
      const reveal = cfg.mode === "test" ? "end" : "immediate";

      const isMapQuestion = !!(q.mapGroup && q.mapEntry && window.PKMapExercise);
      const card = el("div", { class: "quiz-card" + (isMapQuestion ? " quiz-card-map" : "") }, []);
      if (isMapQuestion) {
        card.appendChild(window.PKMapExercise.buildMapDisplay(q.mapGroup, q.mapEntry, true));
      } else if (q.image) {
        card.appendChild(el("img", { src: q.image, alt: "", class: "quiz-card-thumb" }));
      }
      if (cfg.mode === "practice") card.appendChild(levelChip(kind));
      card.appendChild(el("span", { class: "flashcard-label" }, [q.promptLabel]));
      card.appendChild(el("p", { class: "quiz-prompt" }, [q.prompt]));
      const meter = masteryMeter(entry);
      if (meter) card.appendChild(meter);

      const feedback = el("p", { class: "quiz-feedback", "aria-live": "polite" });

      if (kind === "tf") {
        card.appendChild(
          el("p", { class: "tf-statement" }, [
            el("span", { class: "flashcard-label" }, [q.statementLabel]),
            el("br"),
            q.statement
          ])
        );
        const tfWrap = el("div", { class: "tf-buttons" });
        function answerTF(choice, btnEl) {
          if (answered) return;
          answered = true;
          const isRight = choice === q.isTrue;
          Array.from(tfWrap.children).forEach((b) => (b.disabled = true));
          const outcome = recordAndAdvance(entry, isRight);
          if (reveal === "immediate") {
            applyFeedback(feedback, outcome, q.correct, btnEl, q.isTrue ? "" : "(het voorstel klopte niet)");
          }
          showNext();
        }
        tfWrap.appendChild(el("button", { class: "option-btn tf-btn", type: "button", onclick: (e) => answerTF(true, e.currentTarget) }, ["Juist"]));
        tfWrap.appendChild(el("button", { class: "option-btn tf-btn", type: "button", onclick: (e) => answerTF(false, e.currentTarget) }, ["Fout"]));
        card.appendChild(tfWrap);
      } else if (kind === "type") {
        const input = el("input", { class: "quiz-input", type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: "Typ je antwoord…" });
        const submit = el("button", { class: "btn btn-primary", type: "button" }, ["Controleer"]);
        function checkAnswer() {
          if (answered) return;
          answered = true;
          const isRight = norm(input.value) === norm(q.correct);
          input.disabled = true;
          submit.disabled = true;
          const outcome = recordAndAdvance(entry, isRight);
          if (reveal === "immediate") {
            input.classList.add(isRight ? "input-correct" : "input-wrong");
            applyFeedback(feedback, outcome, q.correct, submit);
          }
          showNext();
        }
        submit.addEventListener("click", checkAnswer);
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") checkAnswer(); });
        const row = el("div", { class: "quiz-input-row" }, [input, submit]);
        card.appendChild(row);
        setTimeout(() => input.focus(), 0);
      } else {
        const optionsWrap = el("div", { class: "quiz-options" });
        q.options.forEach((opt) => {
          const btn = el("button", { class: "option-btn", type: "button", onclick: () => {
            if (answered) return;
            answered = true;
            const isRight = opt === q.correct;
            Array.from(optionsWrap.children).forEach((b) => {
              b.disabled = true;
              if (reveal === "immediate" && b.textContent === q.correct) b.classList.add("option-correct");
            });
            if (!isRight && reveal === "immediate") btn.classList.add("option-wrong");
            const outcome = recordAndAdvance(entry, isRight);
            if (reveal === "immediate") {
              applyFeedback(feedback, outcome, q.correct, btn);
            }
            showNext();
          } }, [opt]);
          optionsWrap.appendChild(btn);
        });
        card.appendChild(optionsWrap);
      }

      card.appendChild(feedback);
      const nextHolder = el("div", { class: "quiz-next-holder" });
      card.appendChild(nextHolder);

      function showNext() {
        if (reveal !== "immediate") { pos++; draw(); return; } // testmodus: meteen door, geen tussenstop
        const isLast = pos === queue.length - 1;
        const btn = el("button", { class: "btn btn-primary", type: "button", onclick: () => { pos++; draw(); } },
          [isLast ? "Resultaat bekijken →" : "Volgende vraag →"]);
        nextHolder.appendChild(btn);
        btn.focus();
      }

      stage.appendChild(card);
    }

    draw();
    return wrap;
  }

  /* ---------- MODULE TEST (hele kaartblad, gemengd) --------------------------- */

  /* Eerlijke steekproef voor "Test jezelf" op kaartbladniveau.
     Vroeger: willekeurig 24 uit alle vragen (bij kaartblad 4 = 24 uit 100),
     waardoor sommige symbolen na 5 testen nog nooit gevraagd waren en
     "Nog een keer" steeds dezelfde 24 herhaalde.
     Nu: (1) de plaatsen worden eerlijk verdeeld over de onderdelen
     (bv. helft hoofdsteden, helft kaartsymbolen), en (2) binnen elk
     onderdeel gaan eerst de vragen die het langst niet (of nog nooit)
     gevraagd zijn. Zo komt elk symbool op dit toestel om de paar testen
     gegarandeerd terug. Bij gelijke stand beslist het toeval. */
  function pickFairTestEntries(all, max) {
    const n = Math.min(max, all.length);
    const buckets = new Map();
    all.forEach((e) => {
      const key = e.kind === "topic" ? "t:" + e.topic.id : "m:" + e.group.id;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(e);
    });
    const lists = Array.from(buckets.values()).map((list) =>
      shuffle(list)
        .map((e) => ({ e: e, last: Progress.getItem(e.progressId).lastAt || 0 }))
        .sort((a, b) => a.last - b.last) // stabiel: gelijke tijden blijven in toevalsvolgorde
        .map((x) => x.e)
    );
    // plaatsen proportioneel verdelen, restplaatsen naar de grootste resten
    const quotas = lists.map((l) => (l.length / all.length) * n);
    const alloc = quotas.map((q, i) => Math.min(lists[i].length, Math.floor(q)));
    let left = n - alloc.reduce((s, x) => s + x, 0);
    const order = quotas.map((q, i) => i).sort((a, b) => (quotas[b] - Math.floor(quotas[b])) - (quotas[a] - Math.floor(quotas[a])));
    while (left > 0) {
      let progressed = false;
      for (const i of order) {
        if (left > 0 && alloc[i] < lists[i].length) { alloc[i]++; left--; progressed = true; }
      }
      if (!progressed) break;
    }
    let picked = [];
    lists.forEach((l, i) => { picked = picked.concat(l.slice(0, alloc[i])); });
    return shuffle(picked);
  }

  function renderModuleTest(moduleId) {
    const mod = getModule(moduleId);
    const wrap = el("div", { class: "view view-quiz" });
    let entries = [];
    mod.topics.forEach((topic) => {
      topicEntries(topic).forEach((e) => entries.push({ kind: "topic", topic: topic, item: e.item, progressId: e.progressId }));
    });
    mapGroupsFor(moduleId).forEach((group) => {
      mapEntries(group).forEach((e) => entries.push({ kind: "map", group: group, item: e.item, progressId: e.progressId }));
    });
    const allEntries = entries;
    const pick = () => pickFairTestEntries(allEntries, 24);
    entries = pick();

    const sessionNode = runSession({
      title: "Test jezelf — " + mod.title,
      backHref: "#/module/" + moduleId,
      entries: entries,
      pickEntries: pick,
      mode: "test",
      onderdeelScope: "module:" + moduleId,
      kindFor: () => "mc",
      buildFor: (entry) => (entry.kind === "topic" ? buildQuestion(entry.topic, entry.item, false) : buildMapQuestion(entry.group, entry.item, "mc")),
      itemTitle: (entry) => (entry.kind === "topic" ? entry.topic.title : entry.group.title),
      onModuleTouch: () => { if (window.PKCounter) window.PKCounter.bump(moduleId); }
    });
    wrap.appendChild(sessionNode);
    return wrap;
  }

  /* ---------- GLOBAAL: Mijn fouten & Onderhoud (over alle kaartbladen) -------- */

  function collectAllEntries() {
    let entries = [];
    PK_DATA.modules.forEach((mod) => {
      mod.topics.forEach((topic) => {
        topicEntries(topic).forEach((e) => entries.push({ kind: "topic", moduleId: mod.id, topic: topic, item: e.item, progressId: e.progressId }));
      });
      mapGroupsFor(mod.id).forEach((group) => {
        mapEntries(group).forEach((e) => entries.push({ kind: "map", moduleId: mod.id, group: group, item: e.item, progressId: e.progressId }));
      });
    });
    return entries;
  }

  function renderGlobalFouten() {
    const wrap = el("div", { class: "view view-quiz" });
    const all = collectAllEntries();
    const retryIds = new Set(Progress.retryList(all.map((e) => e.progressId)));
    const filtered = all.filter((e) => retryIds.has(e.progressId));

    wrap.appendChild(el("h1", null, ["Mijn fouten"]));
    wrap.appendChild(el("p", { class: "module-intro" }, ["Alle vragen die je onlangs fout had, uit al je kaartbladen samen — net zolang tot ze weer lukken."]));

    if (!filtered.length) {
      wrap.appendChild(nothingToRetryBlock("#/home"));
      return wrap;
    }

    const sessionNode = runSession({
      title: "Mijn fouten (" + filtered.length + ")",
      backHref: "#/home",
      entries: shuffle(filtered),
      mode: "practice",
      onderdeelScope: "global-fouten",
      kindFor: (entry) => (entry.kind === "topic" ? pickAdaptiveKind(entry.progressId, entry.topic.allowTyping) : "mc"),
      buildFor: (entry, k) =>
        entry.kind === "topic" ? (k === "tf" ? buildTF(entry.topic, entry.item, false) : buildQuestion(entry.topic, entry.item, false)) : buildMapQuestion(entry.group, entry.item, k),
      itemTitle: (entry) => (entry.kind === "topic" ? entry.topic.title : entry.group.title)
    });
    wrap.appendChild(sessionNode);
    return wrap;
  }

  function renderOnderhoud() {
    const wrap = el("div", { class: "view view-quiz" });
    const all = collectAllEntries();
    const dueIds = new Set(Progress.dueForMaintenance(all.map((e) => e.progressId)));
    const filtered = all.filter((e) => dueIds.has(e.progressId));

    wrap.appendChild(el("h1", null, ["Onderhoud"]));
    wrap.appendChild(
      el("p", { class: "module-intro" }, [
        "Dit heb je al eerder onder de knie gekregen. Om het echt te blijven kennen, komt het van tijd tot tijd terug — precies wat permanente kennis is."
      ])
    );

    if (!filtered.length) {
      wrap.appendChild(
        el("div", { class: "empty-state" }, [
          el("div", { class: "empty-state-icon" }, ["📅"]),
          el("p", null, ["Nu even niets te onderhouden. Kom later terug — beheerste onderdelen komen vanzelf terug wanneer het weer tijd is."]),
          el("a", { class: "btn btn-primary", href: "#/home" }, ["Terug naar start"])
        ])
      );
      return wrap;
    }

    const sessionNode = runSession({
      title: "Onderhoud (" + filtered.length + ")",
      backHref: "#/home",
      entries: shuffle(filtered),
      mode: "practice",
      onderdeelScope: "global-onderhoud",
      kindFor: (entry) => (entry.kind === "topic" ? pickAdaptiveKind(entry.progressId, entry.topic.allowTyping) : "mc"),
      buildFor: (entry, k) =>
        entry.kind === "topic" ? (k === "tf" ? buildTF(entry.topic, entry.item, false) : buildQuestion(entry.topic, entry.item, false)) : buildMapQuestion(entry.group, entry.item, k),
      itemTitle: (entry) => (entry.kind === "topic" ? entry.topic.title : entry.group.title)
    });
    wrap.appendChild(sessionNode);
    return wrap;
  }

  /* ---------- TABELTOETS (vul de hele tabel in) ------------------------------------ */

  function renderTable(moduleId, topicId) {
    const topic = getTopic(moduleId, topicId);
    const ids = topicItemIds(topic);
    const items = topic.items.map((item, i) => ({ item: item, progressId: ids[i] }));
    const order = shuffle(items);
    const wrap = el("div", { class: "view view-table" });
    wrap.appendChild(el("h1", null, [topic.title]));
    wrap.appendChild(
      el("p", { class: "study-hint" }, ["Vul zoveel mogelijk in en klik dan op “Verbeteren” — net als bij een schriftelijke toets."])
    );

    const frontLabel = topic.kind === "category" ? "Naam" : topic.promptLabel;
    const backLabel = topic.kind === "category" ? "Soort" : topic.answerLabel;

    const rows = order.map((entry) => {
      const face = faceFor(topic, entry.item, false);
      return { front: face.front, correct: face.back, progressId: entry.progressId };
    });

    const tableWrap = el("div", { class: "table-wrap" });
    const table = el("table", { class: "quiz-table" });
    table.appendChild(el("thead", null, [el("tr", null, [el("th", null, [frontLabel]), el("th", null, [backLabel]), el("th", null, ["Bij fout: juist antwoord"])])]));
    const tbody = el("tbody");
    const inputs = [];
    const correctionCells = [];
    rows.forEach((row, i) => {
      const input = el("input", { class: "quiz-input table-input", type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
      inputs.push(input);
      const correctionCell = el("td", { class: "table-correction" }, []);
      correctionCells.push(correctionCell);
      const tr = el("tr", { id: "row-" + i }, [el("td", { class: "table-term" }, [row.front]), el("td", null, [input]), correctionCell]);
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
        Progress.recordAnswer(row.progressId, isRight);
        window.PKAnalytics && window.PKAnalytics.recordAnswer(row.progressId, isRight);
        if (isRight) {
          correctCount++;
          correctionCells[i].textContent = "✓";
          correctionCells[i].classList.add("table-correction-ok");
          setTimeout(function () { celebrate(input); }, correctCount * 90);
        } else {
          correctionCells[i].textContent = row.correct;
        }
      });
      checkBtn.disabled = true;
      const pct = rows.length ? Math.round((correctCount / rows.length) * 100) : 0;
      feedback.textContent = correctCount + " van de " + rows.length + " juist (" + pct + "%).";
      feedback.className = "quiz-feedback " + (pct >= 70 ? "feedback-good" : "feedback-bad");
      if (window.PKCounter) window.PKCounter.bump(moduleId);
      actions.appendChild(el("a", { class: "btn", href: "#/module/" + moduleId + "/" + topicId }, ["Terug"]));
    });

    return wrap;
  }

  /* ---------- LEERKRACHTOVERZICHT --------------------------------------------- */

  /* Dit is bewust GEEN echte beveiliging: op een statische site zonder
     server staat elke waarde hier gewoon leesbaar in de broncode voor wie
     ernaar zoekt, hoe de variabele ook heet. Het is enkel een drempeltje
     om nieuwsgierige leerlingen te weren (zie README, "Voor de leerkracht"). */
  const _pkGateCode = "3500";
  const TEACHER_UNLOCK_KEY = "pk-teacher-unlocked";

  function teacherUnlocked() {
    try { return localStorage.getItem(TEACHER_UNLOCK_KEY) === "1"; } catch (e) { return false; }
  }

  function renderTeacher() {
    if (!teacherUnlocked()) return renderTeacherLogin();
    return renderTeacherContent();
  }

  function renderTeacherLogin() {
    const wrap = el("div", { class: "view view-teacher" });
    wrap.appendChild(el("h1", null, ["Leerkrachtoverzicht"]));
    wrap.appendChild(el("p", { class: "module-intro" }, ["Deze pagina is voor de leerkracht. Voer het wachtwoord in om verder te gaan."]));

    const input = el("input", { class: "quiz-input", type: "password", autocomplete: "off", placeholder: "Wachtwoord" });
    const submit = el("button", { class: "btn btn-primary", type: "button" }, ["Openen"]);
    const errorEl = el("p", { class: "quiz-feedback feedback-bad" }, []);

    function tryUnlock() {
      if (input.value === _pkGateCode) {
        try { localStorage.setItem(TEACHER_UNLOCK_KEY, "1"); } catch (e) { /* privé-modus: dan telkens opnieuw invoeren */ }
        render();
      } else {
        errorEl.textContent = "Dat wachtwoord klopt niet.";
        input.value = "";
        input.focus();
      }
    }
    submit.addEventListener("click", tryUnlock);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });

    wrap.appendChild(el("div", { class: "quiz-input-row" }, [input, submit]));
    wrap.appendChild(errorEl);
    setTimeout(() => input.focus(), 0);
    return wrap;
  }

  /* Groot, opgeruimd overzicht van de "meeste fouten"-lijst, bedoeld om
     letterlijk op het scherm/bord te projecteren tijdens de les — zonder
     de rest van het leerkrachtoverzicht erbij. */
  function openProjectorView(worstList) {
    const overlay = el("div", { class: "map-lightbox projector-overlay", role: "dialog", "aria-modal": "true", "aria-label": "Meeste fouten — projecteren" });
    function onKey(e) { if (e.key === "Escape") close(); }
    function close() {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("lightbox-open");
    }
    const closeBtn = el("button", { class: "map-lightbox-close", type: "button", onclick: close }, ["✕ Sluiten"]);
    const inner = el("div", { class: "projector-inner" }, [
      el("h2", null, ["🔺 Meeste fouten in de klas"])
    ]);
    if (!worstList || !worstList.length) {
      inner.appendChild(el("p", null, ["Nog geen gegevens om te tonen."]));
    } else {
      const list = el("ol", { class: "projector-list" });
      worstList.slice(0, 10).forEach((it) => {
        list.appendChild(
          el("li", null, [
            el("strong", null, [it.itemLabel]),
            el("span", { class: "projector-meta" }, [it.onderdeelTitle + " · " + (it.errorPct || 0) + "% fout (" + it.attempts + " pogingen)"])
          ])
        );
      });
      inner.appendChild(list);
    }
    overlay.appendChild(closeBtn);
    overlay.appendChild(inner);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", onKey);
    document.body.classList.add("lightbox-open");
    document.body.appendChild(overlay);
  }

  function renderTeacherContent() {
    const wrap = el("div", { class: "view view-teacher" });
    wrap.appendChild(el("h1", null, ["Leerkrachtoverzicht"]));
    wrap.appendChild(
      el("p", { class: "module-intro" }, [
        "Anoniem, samengeteld over alle leerlingen en toestellen: hoeveel keer er per onderdeel geoefend is, en hoeveel procent daarvan fout ging. Klik een rij open voor het detail per land/symbool/begrip. Zo zie je snel waar de klas nog moeite mee heeft."
      ])
    );
    wrap.appendChild(
      el("p", { class: "topic-note" }, [
        "Dit is geen volledig leerlingvolgsysteem: er wordt nergens bijgehouden wélke leerling iets fout had, enkel geteld hoe vaak elk item juist/fout beantwoord werd. Dit wachtwoord is enkel een drempeltje — geen echte beveiliging (dit is een statische site zonder server), maar het houdt nieuwsgierige leerlingen buiten."
      ])
    );
    wrap.appendChild(
      el("p", { class: "topic-note" }, [
        "⚠️ “Verschillende leerlingen” hieronder is een schatting per toestel (een willekeurig, anoniem kenmerk dat lokaal in de browser bewaard wordt), geen geverifieerde identiteit: eenzelfde leerling op twee toestellen telt als 2, een gedeeld klastoestel voor meerdere leerlingen telt maar als 1."
      ])
    );

    const summaryHolder = el("div", { class: "teacher-summary" });
    wrap.appendChild(summaryHolder);

    const btnRow = el("div", { class: "teacher-btn-row" });
    const refreshBtn = el("button", { class: "btn", type: "button" }, ["↻ Vernieuwen"]);
    const resetBtn = el("button", { class: "btn btn-danger", type: "button" }, ["Pogingen resetten"]);
    btnRow.appendChild(refreshBtn);
    btnRow.appendChild(resetBtn);
    wrap.appendChild(btnRow);

    const topHeadingRow = el("div", { class: "teacher-section-head" }, [
      el("h2", { class: "section-heading" }, ["Meeste fouten — over alle onderdelen heen"])
    ]);
    const projectBtn = el("button", { class: "btn", type: "button" }, ["🔎 Projecteren"]);
    topHeadingRow.appendChild(projectBtn);
    wrap.appendChild(topHeadingRow);
    wrap.appendChild(
      el("p", { class: "graad-note" }, [
        "Los van bij welk kaartblad of onderdeel het hoort: dit specifieke land, hoofdstad, symbool of begrip gaat het vaakst fout. Enkel items met minstens 3 pogingen tellen mee, anders zegt 1 fout op 1 poging te weinig."
      ])
    );
    const topStatus = el("p", { class: "study-hint" }, ["Bezig met ophalen…"]);
    const topHolder = el("div", { class: "table-wrap" });
    wrap.appendChild(topStatus);
    wrap.appendChild(topHolder);
    let lastWorst = [];
    projectBtn.addEventListener("click", () => openProjectorView(lastWorst));

    function topMistakesTable(list, emptyMsg) {
      if (!list.length) return el("p", { class: "study-hint" }, [emptyMsg]);
      const t = el("table", { class: "quiz-table teacher-table teacher-table-detail" });
      t.appendChild(
        el("thead", null, [el("tr", null, [
          el("th", null, ["Item"]),
          el("th", null, ["Onderdeel"]),
          el("th", null, ["Pogingen"]),
          el("th", null, ["Fouten"]),
          el("th", null, ["Foutenpercentage"]),
          el("th", null, ["Verschillende leerlingen"])
        ])])
      );
      const tb = el("tbody");
      list.forEach((it) => {
        const pct = it.errorPct == null ? 0 : it.errorPct;
        const cls = pct >= 50 ? "row-wrong" : pct >= 25 ? "row-warn" : pct === 0 ? "row-good" : "";
        tb.appendChild(
          el("tr", { class: cls }, [
            el("td", null, [it.itemLabel]),
            el("td", null, [it.onderdeelTitle]),
            el("td", null, [String(it.attempts || 0)]),
            el("td", null, [String(it.errors || 0)]),
            el("td", null, [pct + "%"]),
            el("td", null, [String(it.uniqueDevices || 0)])
          ])
        );
      });
      t.appendChild(tb);
      return t;
    }

    function loadTop(force) {
      topStatus.textContent = "Bezig met ophalen…";
      topHolder.innerHTML = "";
      window.PKAnalytics.fetchTopMistakes({ limit: 15, minAttempts: 3 }).then((res) => {
        if (!res.consideredCount) {
          topStatus.textContent = "Nog niet genoeg pogingen per item (minstens 3 per item nodig) om een top te tonen.";
          return;
        }
        topStatus.textContent = "";
        lastWorst = res.worst;
        topHolder.appendChild(el("h3", null, ["🔺 Vaakst fout"]));
        topHolder.appendChild(topMistakesTable(res.worst, "Geen items met fouten gevonden."));
        topHolder.appendChild(el("h3", null, ["✅ Zit goed vast"]));
        topHolder.appendChild(topMistakesTable(res.best, "Geen items gevonden."));
      }).catch(() => { topStatus.textContent = "Kon de top niet ophalen."; });
    }

    wrap.appendChild(el("h2", { class: "section-heading" }, ["Per onderdeel"]));
    wrap.appendChild(el("p", { class: "study-hint" }, ["Klik op een kolomkop om te sorteren."]));
    const status = el("p", { class: "study-hint" }, ["Bezig met ophalen…"]);
    const tableHolder = el("div", { class: "table-wrap" });
    wrap.appendChild(status);
    wrap.appendChild(tableHolder);

    const SORT_COLUMNS = [
      { key: "title", label: "Onderdeel" },
      { key: "moduleTitle", label: "Kaartblad" },
      { key: "attempts", label: "Pogingen" },
      { key: "errors", label: "Fouten" },
      { key: "errorPct", label: "Foutenpercentage" },
      { key: "uniqueDevices", label: "Verschillende leerlingen (toestellen)" }
    ];
    let sortState = { key: "errorPct", dir: "desc" };
    let lastReachableRows = [];

    function itemBreakdownRow(r) {
      const holderTr = el("tr", { class: "teacher-detail-row" });
      const holderTd = el("td", { colspan: "6" });
      const holder = el("div", { class: "teacher-detail" }, ["Bezig met ophalen van het detail…"]);
      holderTd.appendChild(holder);
      holderTr.appendChild(holderTd);

      window.PKAnalytics.fetchItemBreakdown(r.id, r.kind).then((items) => {
        const withData = items.filter((it) => it.reachable && it.attempts > 0);
        holder.innerHTML = "";
        if (!withData.length) {
          holder.appendChild(el("p", { class: "study-hint" }, ["Nog geen pogingen per item geteld voor dit onderdeel."]));
          return;
        }
        const sortedItems = withData.slice().sort((a, b) => (b.errorPct || 0) - (a.errorPct || 0));
        const t = el("table", { class: "quiz-table teacher-table teacher-table-detail" });
        t.appendChild(
          el("thead", null, [el("tr", null, [
            el("th", null, [r.kind === "map" ? "Symbool" : "Begrip"]),
            el("th", null, ["Pogingen"]),
            el("th", null, ["Fouten"]),
            el("th", null, ["Foutenpercentage"]),
            el("th", null, ["Verschillende leerlingen (toestellen)"])
          ])])
        );
        const tb = el("tbody");
        sortedItems.forEach((it) => {
          const pct = it.errorPct == null ? 0 : it.errorPct;
          const cls = pct >= 50 ? "row-wrong" : pct >= 25 ? "row-warn" : pct === 0 ? "row-good" : "";
          const label = it.secondary ? it.label + " (" + it.secondary + ")" : it.label;
          tb.appendChild(
            el("tr", { class: cls }, [
              el("td", null, [label]),
              el("td", null, [String(it.attempts || 0)]),
              el("td", null, [String(it.errors || 0)]),
              el("td", null, [pct + "%"]),
              el("td", null, [String(it.uniqueDevices || 0)])
            ])
          );
        });
        t.appendChild(tb);
        holder.appendChild(t);
      }).catch(() => {
        holder.innerHTML = "";
        holder.appendChild(el("p", { class: "study-hint" }, ["Kon het detail niet ophalen."]));
      });

      return holderTr;
    }

    function renderSummary(reachableRows) {
      summaryHolder.innerHTML = "";
      if (!reachableRows.length) return;
      let totalAttempts = 0, totalErrors = 0, redCount = 0;
      reachableRows.forEach((r) => {
        totalAttempts += r.attempts || 0;
        totalErrors += r.errors || 0;
        if ((r.errorPct || 0) >= 50) redCount++;
      });
      const totalPct = totalAttempts ? Math.round((totalErrors / totalAttempts) * 100) : 0;
      const tiles = [
        { label: "Onderdelen met data", value: reachableRows.length },
        { label: "Pogingen (totaal)", value: totalAttempts },
        { label: "Foutenpercentage (gemiddeld)", value: totalPct + "%" },
        { label: "Onderdelen ≥ 50% fout", value: redCount }
      ];
      tiles.forEach((t) => {
        summaryHolder.appendChild(
          el("div", { class: "teacher-summary-tile" + (t.label.indexOf("50%") !== -1 && redCount > 0 ? " teacher-summary-tile-warn" : "") }, [
            el("span", { class: "teacher-summary-value" }, [String(t.value)]),
            el("span", { class: "teacher-summary-label" }, [t.label])
          ])
        );
      });
    }

    function buildTable(reachableRows) {
      tableHolder.innerHTML = "";
      const dir = sortState.dir === "asc" ? 1 : -1;
      const sorted = reachableRows.slice().sort((a, b) => {
        const av = a[sortState.key], bv = b[sortState.key];
        if (typeof av === "string" || typeof bv === "string") {
          return dir * String(av || "").localeCompare(String(bv || ""));
        }
        return dir * ((av || 0) - (bv || 0));
      });
      const table = el("table", { class: "quiz-table teacher-table" });
      const headTr = el("tr", null, []);
      SORT_COLUMNS.forEach((col) => {
        const active = sortState.key === col.key;
        const arrow = active ? (sortState.dir === "asc" ? " ▲" : " ▼") : "";
        headTr.appendChild(
          el("th", { class: active ? "teacher-th-active" : "" }, [
            el("button", { class: "teacher-sort-btn", type: "button", onclick: () => {
              sortState = active
                ? { key: col.key, dir: sortState.dir === "desc" ? "asc" : "desc" }
                : { key: col.key, dir: "desc" };
              buildTable(reachableRows);
            } }, [col.label + arrow])
          ])
        );
      });
      table.appendChild(el("thead", null, [headTr]));
      const tbody = el("tbody");
      let totalAttempts = 0, totalErrors = 0;
      sorted.forEach((r) => {
        totalAttempts += r.attempts || 0;
        totalErrors += r.errors || 0;
        const pct = r.errorPct == null ? 0 : r.errorPct;
        const cls = pct >= 50 ? "row-wrong" : pct >= 25 ? "row-warn" : "";
        let detailRow = null;
        const mainRow = el("tr", { class: cls + " teacher-row-clickable" }, [
          el("td", null, [el("button", { class: "teacher-expand-btn", type: "button", "aria-expanded": "false", onclick: (e) => {
            if (detailRow) {
              detailRow.remove();
              detailRow = null;
              e.currentTarget.setAttribute("aria-expanded", "false");
              e.currentTarget.textContent = "▸ " + r.title;
              return;
            }
            detailRow = itemBreakdownRow(r);
            mainRow.after(detailRow);
            e.currentTarget.setAttribute("aria-expanded", "true");
            e.currentTarget.textContent = "▾ " + r.title;
          } }, ["▸ " + r.title])]),
          el("td", null, [r.moduleTitle]),
          el("td", null, [String(r.attempts || 0)]),
          el("td", null, [String(r.errors || 0)]),
          el("td", null, [pct + "%"]),
          el("td", null, [String(r.uniqueDevices || 0)])
        ]);
        tbody.appendChild(mainRow);
      });
      table.appendChild(tbody);
      const totalPct = totalAttempts ? Math.round((totalErrors / totalAttempts) * 100) : 0;
      table.appendChild(
        el("tfoot", null, [el("tr", null, [
          el("td", null, ["Totaal"]),
          el("td", null, [""]),
          el("td", null, [String(totalAttempts)]),
          el("td", null, [String(totalErrors)]),
          el("td", null, [totalPct + "%"]),
          el("td", null, [""])
        ])])
      );
      tableHolder.appendChild(table);
    }

    function load(force) {
      status.textContent = "Bezig met ophalen…";
      tableHolder.innerHTML = "";
      summaryHolder.innerHTML = "";
      window.PKAnalytics.fetchOverview(force).then((rows) => {
        const reachableRows = rows.filter((r) => r.reachable && r.attempts > 0);
        if (!reachableRows.length) {
          status.textContent = rows.some((r) => r.reachable)
            ? "Nog geen enkele oefening geteld — kom later terug."
            : "De tellerdienst is nu niet bereikbaar. Probeer het straks opnieuw.";
          return;
        }
        status.textContent = reachableRows.length + " onderdelen met minstens 1 poging. Klik een rij open voor het detail per item, of op een kolomkop om te sorteren.";
        lastReachableRows = reachableRows;
        renderSummary(reachableRows);
        buildTable(reachableRows);
      }).catch(() => { status.textContent = "Kon de gegevens niet ophalen."; });
    }
    refreshBtn.addEventListener("click", () => { load(true); loadTop(true); });
    resetBtn.addEventListener("click", () => {
      const sure = window.confirm(
        "Alle pogingen en fouten voor de hele klas/school op nul zetten? Dit kan niet ongedaan gemaakt worden."
      );
      if (!sure) return;
      resetBtn.disabled = true;
      resetBtn.textContent = "Bezig met resetten…";
      status.textContent = "Bezig met resetten…";
      topStatus.textContent = "Bezig met resetten…";
      topHolder.innerHTML = "";
      window.PKAnalytics.resetAll().then(() => {
        resetBtn.disabled = false;
        resetBtn.textContent = "Pogingen resetten";
        load(true);
        loadTop(true);
      }).catch(() => {
        resetBtn.disabled = false;
        resetBtn.textContent = "Pogingen resetten";
        status.textContent = "Resetten is niet gelukt. Probeer het straks opnieuw.";
        topStatus.textContent = "";
      });
    });
    load(false);
    loadTop(false);

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
  function pinIconOutlineSVG() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 120 120");
    s.innerHTML =
      '<path d="M60 108S22 66 22 42a38 38 0 1176 0c0 24-38 66-38 66z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>' +
      '<circle cx="60" cy="42" r="15" fill="currentColor"/>';
    return s;
  }
  function shieldIconSVG() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 120 120");
    s.innerHTML =
      '<path d="M60 10 L100 24 V56 C100 84 84 100 60 112 C36 100 20 84 20 56 V24 Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M60 30 V92 M38 45 H82" stroke="currentColor" stroke-width="4" opacity="0.55"/>';
    return s;
  }
  function starsRingIconSVG() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 120 120");
    let dots = "";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const cx = 60 + Math.cos(a) * 40;
      const cy = 60 + Math.sin(a) * 40;
      dots += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="5.5" fill="currentColor"/>';
    }
    s.innerHTML = dots + '<circle cx="60" cy="60" r="4" fill="currentColor" opacity="0.5"/>';
    return s;
  }
  function waveIconSVG() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 120 120");
    s.innerHTML =
      '<path d="M14 46c10-12 22-12 32 0s22 12 32 0 22-12 32 0" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M14 70c10-12 22-12 32 0s22 12 32 0 22-12 32 0" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" opacity="0.5"/>' +
      '<path d="M14 94c10-12 22-12 32 0s22 12 32 0 22-12 32 0" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" opacity="0.25"/>';
    return s;
  }
  function globeIconSVG() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 120 120");
    s.innerHTML =
      '<circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" stroke-width="6"/>' +
      '<ellipse cx="60" cy="60" rx="48" ry="20" fill="none" stroke="currentColor" stroke-width="4" opacity="0.6"/>' +
      '<ellipse cx="60" cy="60" rx="20" ry="48" fill="none" stroke="currentColor" stroke-width="4" opacity="0.6"/>' +
      '<line x1="12" y1="60" x2="108" y2="60" stroke="currentColor" stroke-width="4" opacity="0.6"/>';
    return s;
  }
  function skylineIconSVG() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 120 120");
    s.innerHTML =
      '<rect x="14" y="58" width="20" height="46" fill="currentColor"/>' +
      '<rect x="40" y="38" width="22" height="66" fill="currentColor" opacity="0.75"/>' +
      '<rect x="68" y="50" width="18" height="54" fill="currentColor"/>' +
      '<rect x="92" y="66" width="16" height="38" fill="currentColor" opacity="0.75"/>' +
      '<path d="M46 38 L51 22 L56 38" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>';
    return s;
  }
  function mountainIconSVG() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 120 120");
    s.innerHTML =
      '<path d="M10 96 L42 44 L60 70 L74 50 L110 96 Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M35 58 L42 44 L49 58 Z" fill="currentColor" opacity="0.5"/>';
    return s;
  }
  function riverMountainIconSVG() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 120 120");
    s.innerHTML =
      '<path d="M8 52 L38 14 L56 38 L70 20 L112 52 Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M10 88c12-10 20-10 30 0s20 10 30 0 20-10 30 0" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M10 106c12-10 20-10 30 0s20 10 30 0 20-10 30 0" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" opacity="0.45"/>';
    return s;
  }
  function heroIllustrationSVG() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 900 280");
    s.setAttribute("preserveAspectRatio", "xMidYMid slice");
    s.setAttribute("class", "hero-svg");
    s.innerHTML =
      '<defs>' +
      '<linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#0C4A63"/><stop offset="1" stop-color="#022E3E"/>' +
      '</linearGradient>' +
      '<clipPath id="heroEarthClip"><circle cx="852" cy="222" r="30"/></clipPath>' +
      '</defs>' +
      '<rect width="900" height="280" fill="url(#oceanGrad)"/>' +
      '<g stroke="#ffffff" stroke-opacity="0.07" stroke-width="1">' +
      '<line x1="0" y1="40" x2="900" y2="40"/><line x1="0" y1="90" x2="900" y2="90"/>' +
      '<line x1="0" y1="140" x2="900" y2="140"/><line x1="0" y1="190" x2="900" y2="190"/>' +
      '<line x1="0" y1="240" x2="900" y2="240"/>' +
      '<line x1="90" y1="0" x2="90" y2="280"/><line x1="230" y1="0" x2="230" y2="280"/>' +
      '<line x1="370" y1="0" x2="370" y2="280"/><line x1="510" y1="0" x2="510" y2="280"/>' +
      '<line x1="650" y1="0" x2="650" y2="280"/><line x1="790" y1="0" x2="790" y2="280"/>' +
      '</g>' +
      '<path d="M-20 210 Q60 160 140 195 T300 190 Q360 175 420 205 L420 300 L-20 300 Z" fill="#F0A63B" opacity="0.92"/>' +
      '<path d="M520 230 Q600 190 700 215 T900 205 L900 300 L520 300 Z" fill="#1F7A6C" opacity="0.92"/>' +
      '<g class="hero-earth" opacity="0.98">' +
      '<circle cx="852" cy="222" r="33" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.55"/>' +
      '<image href="assets/img/earth.jpg" x="822" y="192" width="60" height="60" clip-path="url(#heroEarthClip)" preserveAspectRatio="xMidYMid slice"/>' +
      '</g>' +
      '<ellipse class="hero-cloud" style="--d:0s" cx="170" cy="70" rx="60" ry="26" fill="#E5343C" opacity="0.85"/>' +
      '<ellipse class="hero-cloud" style="--d:1.2s" cx="640" cy="55" rx="80" ry="30" fill="#2F86C9" opacity="0.85"/>' +
      '<g class="hero-route" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="1 9" stroke-linecap="round" opacity="0.85">' +
      '<path d="M150 210 Q400 60 620 130"/>' +
      '<path d="M620 130 Q760 170 830 90"/>' +
      '<path d="M150 210 Q280 260 470 235"/>' +
      '</g>' +
      '<g>' +
      '<circle class="hero-waypoint" style="--d:0s" cx="150" cy="210" r="7" fill="#F0A63B" stroke="#fff" stroke-width="2"/>' +
      '<circle class="hero-waypoint" style="--d:.3s" cx="620" cy="130" r="7" fill="#F0A63B" stroke="#fff" stroke-width="2"/>' +
      '<circle class="hero-waypoint" style="--d:.6s" cx="830" cy="90" r="7" fill="#F0A63B" stroke="#fff" stroke-width="2"/>' +
      '<circle class="hero-waypoint" style="--d:.9s" cx="470" cy="235" r="7" fill="#F0A63B" stroke="#fff" stroke-width="2"/>' +
      '</g>' +
      '<g class="hero-sparkles" fill="#ffffff" opacity="0.7">' +
      '<path class="hero-sparkle" style="--d:0s" d="M60 30l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/>' +
      '<path class="hero-sparkle" style="--d:.7s" d="M740 200l2.4 6.4 6.4 2.4-6.4 2.4-2.4 6.4-2.4-6.4-6.4-2.4 6.4-2.4z"/>' +
      '<path class="hero-sparkle" style="--d:1.3s" d="M860 190l2 5.2 5.2 2-5.2 2-2 5.2-2-5.2-5.2-2 5.2-2z"/>' +
      '</g>' +
      '<g class="hero-compass" transform="translate(798,54)" opacity="0.9">' +
      '<circle r="34" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.7"/>' +
      '<g class="hero-compass-needle">' +
      '<path d="M0 -26 L7 -2 L0 4 L-7 -2 Z" fill="#fff"/>' +
      '<path d="M0 26 L7 4 L0 -4 L-7 4 Z" fill="#fff" opacity="0.4"/>' +
      '</g>' +
      '<text x="0" y="-38" text-anchor="middle" font-size="13" fill="#fff" font-family="Verdana">N</text>' +
      '</g>' +
      '<g class="hero-mascot" transform="translate(58,168)" opacity="0.95">' +
      '<circle r="30" fill="#F4E4C1"/>' +
      '<path d="M-19 -6 Q-10 -16 2 -12 T18 -3" fill="none" stroke="#1F7A6C" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M-14 10 Q-4 2 8 9 T22 14" fill="none" stroke="#1F7A6C" stroke-width="6" stroke-linecap="round" opacity="0.7"/>' +
      '<circle cx="-9" cy="-9" r="3" fill="#022E3E"/><circle cx="9" cy="-9" r="3" fill="#022E3E"/>' +
      '<path d="M-8 4 Q0 10 8 4" fill="none" stroke="#022E3E" stroke-width="2.4" stroke-linecap="round"/>' +
      '</g>';
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
  function retryIconSVG() {
    return svgIcon(
      '<path d="M4 12a8 8 0 1 1 2.6 5.9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
        '<path d="M4 17.5V13h4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
    );
  }
  function testIconSVG() {
    return svgIcon(
      '<rect x="5" y="3" width="14" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
        '<path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
    );
  }
  function maintenanceIconSVG() {
    return svgIcon(
      '<rect x="3" y="5" width="18" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
        '<path d="M3 9h18" stroke="currentColor" stroke-width="1.6"/>' +
        '<path d="M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M12 12v3l2 1.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
    );
  }
})();
