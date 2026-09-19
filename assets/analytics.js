/* ==========================================================================
   Permanente Kennis — analytics.js
   Anonieme, geaggregeerde teller per onderdeel (per tekst-onderdeel en per
   kaartoefening), zodat de leerkracht kan zien wat het meest geoefend
   wordt en waar de leerlingen de meeste fouten maken — over alle
   leerlingen en toestellen samen.

   Gebruikt dezelfde gratis, accountloze tellerdienst als de bestaande
   kaartblad-teller (countapi.mileshilliard.com): elk beantwoord vraagje
   stuurt een klein "+1"-afbeeldingsverzoek naar een teller "pogingen" voor
   dat onderdeel, en bij een fout antwoord ook naar een teller "fouten".
   Er wordt geen enkel gegeven over een individuele leerling bewaard of
   verstuurd — enkel deze twee tellers per onderdeel, samen voor de hele
   klas/school. Dit is dus geen volledig leerlingvolgsysteem, maar een
   lichtgewicht signaal: "hier wordt veel geoefend" / "hier gaat het vaak
   fout" — precies genoeg om als leerkracht te weten waar je in de les nog
   even bij moet stilstaan.
   ========================================================================== */

(function () {
  "use strict";

  const BASE = "https://countapi.mileshilliard.com/api/v1/";
  const PREFIX = "geografiehast-permanentekennis-";
  const CACHE_KEY = "pk-teacher-overview-cache-v1";
  const CACHE_TTL_MS = 60 * 1000;

  function safeId(scope) {
    return scope.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  }
  function attemptsKey(scope) {
    return PREFIX + "att-" + safeId(scope);
  }
  function errorsKey(scope) {
    return PREFIX + "err-" + safeId(scope);
  }

  /* ---------- vuur-en-vergeet: één antwoord melden -------------------------- */

  function ping(key) {
    try {
      const img = new Image();
      img.src = BASE + "hit/" + key;
    } catch (e) {
      /* kan hier eigenlijk niet mislukken, maar voor de zekerheid */
    }
  }

  function recordAnswer(scope, correct) {
    if (!scope) return;
    ping(attemptsKey(scope));
    if (!correct) ping(errorsKey(scope));
  }

  /* ---------- opvragen voor het leerkrachtoverzicht -------------------------- */

  function fetchCount(key) {
    return fetch(BASE + "get/" + key)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => (data && typeof data.value === "number" ? data.value : 0))
      .catch(() => null); // null = niet bereikbaar, onderscheiden van 0 = wel bereikbaar, nog niets geteld
  }

  function readCache() {
    try {
      const raw = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (raw && Date.now() - raw.at < CACHE_TTL_MS) return raw.rows;
    } catch (e) {
      /* negeren */
    }
    return null;
  }
  function writeCache(rows) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rows: rows }));
    } catch (e) {
      /* negeren */
    }
  }

  function fetchOverview(forceRefresh) {
    if (!forceRefresh) {
      const cached = readCache();
      if (cached) return Promise.resolve(cached);
    }
    const onderdelen = window.PKIndex ? window.PKIndex.all() : [];
    return Promise.all(
      onderdelen.map((o) =>
        Promise.all([fetchCount(attemptsKey(o.scope)), fetchCount(errorsKey(o.scope))]).then(([attempts, errors]) => ({
          id: o.id,
          kind: o.kind,
          title: o.title,
          moduleTitle: o.moduleTitle,
          moduleId: o.moduleId,
          attempts: attempts,
          errors: errors,
          reachable: attempts !== null && errors !== null,
          errorPct: attempts ? Math.round(((errors || 0) / attempts) * 100) : null
        }))
      )
    ).then((rows) => {
      writeCache(rows);
      return rows;
    });
  }

  window.PKAnalytics = {
    recordAnswer: recordAnswer,
    fetchOverview: fetchOverview
  };
})();
