/* ==========================================================================
   Permanente Kennis — progress.js
   De "leermotor": houdt per vraag (elk kaartje/legendesymbool) een status
   bij, zodat de site een echte leeromgeving is in plaats van los-vaste
   quizjes:

     nieuw → leren → geoefend → beheerst → (onderhoud, opnieuw getest)

   Een item is "beheerst" na een aantal juiste antwoorden op rij, zonder
   hulp. Eén fout duwt een beheerst item terug naar "moet geoefend worden"
   en zet het in de foutenbank ("Mijn fouten"). Beheerste items krijgen een
   vervaldatum: na die datum duiken ze vanzelf weer op in "Onderhoud", met
   een oplopend interval (1, 3, 7, 16, 35 dagen) zolang ze juist blijven.

   Alles wordt per toestel bewaard in localStorage — er wordt niets naar
   een server gestuurd (zie analytics.js voor de aparte, anonieme teller
   voor de leerkracht).
   ========================================================================== */

(function () {
  "use strict";

  const STATE_KEY = "pk-itemstate-v1";
  const STATS_KEY = "pk-stats-v1";
  const MASTER_STREAK = 3; // aantal juiste antwoorden op rij om iets "beheerst" te noemen
  const MAINTENANCE_LADDER = [1, 3, 7, 16, 35, 90]; // dagen tot volgende onderhoudsbeurt

  const DAY_MS = 24 * 60 * 60 * 1000;

  /* ---------- opslag -------------------------------------------------- */

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveState(s) {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(s));
    } catch (e) {
      /* privé-modus of vol geheugen: negeren, de app blijft werken */
    }
  }

  let cache = null;
  function all() {
    if (!cache) cache = loadState();
    return cache;
  }
  function persist() {
    saveState(cache);
  }

  function getItem(id) {
    const s = all();
    return (
      s[id] || {
        seen: 0,
        wrong: 0,
        streak: 0,
        stage: "new", // new | learning | mastered
        reps: 0, // aantal succesvolle onderhoudsbeurten (bepaalt interval)
        retry: false, // staat in de foutenbank
        dueAt: null,
        lastAt: null
      }
    );
  }

  function stageOf(id) {
    return getItem(id).stage;
  }
  function isMastered(id) {
    return getItem(id).stage === "mastered";
  }
  function isSeen(id) {
    return getItem(id).seen > 0;
  }
  function needsRetry(id) {
    return !!getItem(id).retry;
  }

  /* ---------- kernlogica: een antwoord verwerken ------------------------ */

  function recordAnswer(id, correct) {
    const s = all();
    const item = getItem(id);
    item.seen += 1;
    item.lastAt = Date.now();

    if (correct) {
      item.streak += 1;
      if (item.stage === "mastered") {
        // onderhoudsbeurt gehaald: interval opschuiven, opnieuw plannen
        item.reps = Math.min(item.reps + 1, MAINTENANCE_LADDER.length - 1);
        item.dueAt = Date.now() + MAINTENANCE_LADDER[item.reps] * DAY_MS;
        item.retry = false;
      } else if (item.streak >= MASTER_STREAK) {
        item.stage = "mastered";
        item.reps = 0;
        item.dueAt = Date.now() + MAINTENANCE_LADDER[0] * DAY_MS;
        item.retry = false;
      } else {
        item.stage = "learning";
      }
    } else {
      item.wrong += 1;
      item.streak = 0;
      item.stage = "learning";
      item.reps = 0;
      item.dueAt = null;
      item.retry = true; // fout → in de foutenbank tot opnieuw juist geoefend
    }

    s[id] = item;
    persist();
    bumpStats(correct);
    return item;
  }

  function clearRetry(id) {
    const s = all();
    const item = getItem(id);
    item.retry = false;
    s[id] = item;
    persist();
  }

  /* ---------- verzamelstatistieken voor een groep items ------------------ */

  function summarize(ids) {
    const total = ids.length;
    let mastered = 0,
      practicing = 0,
      seen = 0,
      due = 0;
    const now = Date.now();
    ids.forEach((id) => {
      const it = getItem(id);
      if (it.seen > 0) seen++;
      if (it.stage === "mastered") {
        mastered++;
        if (it.dueAt != null && it.dueAt <= now) due++;
      } else if (it.stage === "learning") {
        practicing++;
      }
    });
    return {
      total: total,
      mastered: mastered,
      practicing: practicing,
      seen: seen,
      due: due,
      masteredPct: total ? Math.round((mastered / total) * 100) : 0,
      practicedPct: total ? Math.round((seen / total) * 100) : 0
    };
  }

  function dueForMaintenance(ids) {
    const now = Date.now();
    return ids.filter((id) => {
      const it = getItem(id);
      return it.stage === "mastered" && it.dueAt != null && it.dueAt <= now;
    });
  }

  function retryList(ids) {
    return ids.filter((id) => needsRetry(id));
  }

  /* ---------- eigen statistieken: totaal beantwoord + studeer-streak -------- */

  function todayStr() {
    const d = new Date();
    return (
      d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
    );
  }
  function dayBefore(str) {
    const d = new Date(str + "T00:00:00");
    d.setDate(d.getDate() - 1);
    return (
      d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
    );
  }
  function loadStats() {
    try {
      return (
        JSON.parse(localStorage.getItem(STATS_KEY)) || {
          totalAnswered: 0,
          totalCorrect: 0,
          streakCount: 0,
          lastDate: null
        }
      );
    } catch (e) {
      return { totalAnswered: 0, totalCorrect: 0, streakCount: 0, lastDate: null };
    }
  }
  function saveStats(s) {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(s));
    } catch (e) {
      /* negeren */
    }
  }
  function bumpStats(correct) {
    const s = loadStats();
    s.totalAnswered = (s.totalAnswered || 0) + 1;
    if (correct) s.totalCorrect = (s.totalCorrect || 0) + 1;
    const today = todayStr();
    if (s.lastDate !== today) {
      s.streakCount = s.lastDate === dayBefore(today) ? (s.streakCount || 0) + 1 : 1;
      s.lastDate = today;
    }
    saveStats(s);
    return s;
  }

  window.PKProgress = {
    itemKey: function (scope, key) {
      return scope + "::" + key;
    },
    getItem: getItem,
    stageOf: stageOf,
    isMastered: isMastered,
    isSeen: isSeen,
    needsRetry: needsRetry,
    recordAnswer: recordAnswer,
    clearRetry: clearRetry,
    summarize: summarize,
    dueForMaintenance: dueForMaintenance,
    retryList: retryList,
    loadStats: loadStats,
    MASTER_STREAK: MASTER_STREAK
  };
})();
