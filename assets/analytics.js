/* ==========================================================================
   Permanente Kennis — analytics.js
   Anonieme, geaggregeerde teller — per onderdeel EN per afzonderlijk item
   (bv. per land/hoofdstad op een kaartblad, per begrip bij een tekst-
   onderdeel) — zodat de leerkracht niet enkel ziet wát er geoefend wordt,
   maar ook precies waar het fout gaat: "Kosovo — vaak fout" versus
   "België — gaat altijd goed".

   Gebruikt dezelfde gratis, accountloze tellerdienst als de bestaande
   kaartblad-teller (countapi.mileshilliard.com): elk beantwoord vraagje
   stuurt een klein "+1"-afbeeldingsverzoek naar een teller "pogingen" —
   zowel voor het specifieke item als voor het onderdeel waar dat item bij
   hoort — en bij een fout antwoord ook naar een teller "fouten". Er wordt
   nergens een naam, IP-adres of ander persoonlijk gegeven bewaard of
   verstuurd — enkel deze tellers, samen voor de hele klas/school.

   Daarnaast houdt dit bestand een anoniem, willekeurig "toestel-id" bij
   (in localStorage, nooit verstuurd) zodat er — heel grof — ook geteld kan
   worden door hoeveel VERSCHILLENDE toestellen een item/onderdeel al
   geprobeerd is, niet enkel hoe vaak in totaal. Dat voorkomt dat 20
   pogingen van 1 leerling die blijft herkansen eruitzien als "20
   leerlingen oefenden hierop". Dit is een schatting per toestel, geen
   geverifieerde identiteit: eenzelfde leerling op twee toestellen telt
   dubbel, een gedeeld (klas)toestel voor meerdere leerlingen telt te
   weinig.
   ========================================================================== */

(function () {
  "use strict";

  const BASE = "https://countapi.mileshilliard.com/api/v1/";
  const PREFIX = "geografiehast-permanentekennis2-";
  const CACHE_KEY = "pk-teacher-overview-cache-v2";
  const ITEM_CACHE_KEY = "pk-teacher-item-cache-v2";
  const CACHE_TTL_MS = 60 * 1000;

  const DEVICE_ID_KEY = "pk-device-id-v1";
  const UNIQ_ITEMS_KEY = "pk-uniq-items-v1";
  const UNIQ_ONDERDELEN_KEY = "pk-uniq-onderdelen-v1";

  function safeId(scope) {
    return String(scope).replace(/[^a-z0-9]/gi, "-").toLowerCase();
  }
  function attemptsKey(scope) {
    return PREFIX + "att-" + safeId(scope);
  }
  function errorsKey(scope) {
    return PREFIX + "err-" + safeId(scope);
  }
  function uniqKey(scope) {
    return PREFIX + "uniq-" + safeId(scope);
  }

  /* ---------- anoniem toestel-id + "1x per toestel geteld"-vlaggen --------- */

  function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  }

  let deviceIdCache = null;
  function deviceId() {
    if (deviceIdCache) return deviceIdCache;
    try {
      let id = localStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = randomId();
        localStorage.setItem(DEVICE_ID_KEY, id);
      }
      deviceIdCache = id;
      return id;
    } catch (e) {
      // geen localStorage (privé-modus e.d.): val terug op een id dat enkel
      // binnen dit tabblad leeft, zodat de tellers toch blijven werken
      if (!deviceIdCache) deviceIdCache = randomId();
      return deviceIdCache;
    }
  }

  function loadSet(key) {
    try {
      const arr = JSON.parse(localStorage.getItem(key));
      return Array.isArray(arr) ? new Set(arr) : new Set();
    } catch (e) {
      return new Set();
    }
  }
  function saveSet(key, set) {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch (e) {
      /* negeren: uniek-teller is een extraatje, mag falen zonder de app te breken */
    }
  }

  /* true als dit de EERSTE keer is dat dit toestel deze id meldt (en
     onthoudt dat meteen), false als dat al eerder gebeurde */
  function firstTimeOnThisDevice(setKey, id) {
    const set = loadSet(setKey);
    if (set.has(id)) return false;
    set.add(id);
    saveSet(setKey, set);
    return true;
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

  /* itemId is de item-sleutel zoals PKIndex die ook voor de voortgang
     gebruikt (bv. "m:europa-landen-kaart::38" of "t:eu-lidstaten::belgie").
     Daaruit wordt automatisch ook het onderdeel-niveau afgeleid, zodat één
     aanroep zowel de item-teller als de onderdeel-teller bijwerkt. */
  function recordAnswer(itemId, correct) {
    if (!itemId) return;
    const onderdeel = window.PKIndex ? window.PKIndex.onderdeelScopeOf(itemId) : itemId;

    ping(attemptsKey(itemId));
    if (!correct) ping(errorsKey(itemId));
    ping(attemptsKey(onderdeel));
    if (!correct) ping(errorsKey(onderdeel));

    const dev = deviceId();
    if (firstTimeOnThisDevice(UNIQ_ITEMS_KEY, itemId)) ping(uniqKey(itemId));
    if (firstTimeOnThisDevice(UNIQ_ONDERDELEN_KEY, onderdeel)) ping(uniqKey(onderdeel));
    void dev; // dev zelf wordt nergens verstuurd, enkel gebruikt om de vlag lokaal uniek te houden
  }

  /* ---------- opvragen voor het leerkrachtoverzicht -------------------------- */

  function fetchCount(key) {
    return fetch(BASE + "get/" + key)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => (data && typeof data.value === "number" ? data.value : 0))
      .catch(() => null); // null = niet bereikbaar, onderscheiden van 0 = wel bereikbaar, nog niets geteld
  }

  function readCache(key, ttl) {
    try {
      const raw = JSON.parse(sessionStorage.getItem(key));
      if (raw && Date.now() - raw.at < ttl) return raw.rows;
    } catch (e) {
      /* negeren */
    }
    return null;
  }
  function writeCache(key, rows) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), rows: rows }));
    } catch (e) {
      /* negeren */
    }
  }

  function fetchOverview(forceRefresh) {
    if (!forceRefresh) {
      const cached = readCache(CACHE_KEY, CACHE_TTL_MS);
      if (cached) return Promise.resolve(cached);
    }
    const onderdelen = window.PKIndex ? window.PKIndex.all() : [];
    return Promise.all(
      onderdelen.map((o) =>
        Promise.all([fetchCount(attemptsKey(o.scope)), fetchCount(errorsKey(o.scope)), fetchCount(uniqKey(o.scope))]).then(
          ([attempts, errors, uniqueDevices]) => ({
            id: o.id,
            kind: o.kind,
            title: o.title,
            moduleTitle: o.moduleTitle,
            moduleId: o.moduleId,
            scope: o.scope,
            attempts: attempts,
            errors: errors,
            uniqueDevices: uniqueDevices,
            reachable: attempts !== null && errors !== null,
            errorPct: attempts ? Math.round(((errors || 0) / attempts) * 100) : null
          })
        )
      )
    ).then((rows) => {
      writeCache(CACHE_KEY, rows);
      return rows;
    });
  }

  /* Per-item detail voor één onderdeel (aangeroepen wanneer de leerkracht een
     rij openklikt) — apart en lui geladen, want dit kan tientallen items per
     onderdeel zijn (bv. 50 landen) en dat wil je niet voor elk onderdeel
     tegelijk ophalen. */
  function fetchItemBreakdown(onderdeelId, kind, forceRefresh) {
    const cacheKey = ITEM_CACHE_KEY + ":" + kind + ":" + onderdeelId;
    if (!forceRefresh) {
      const cached = readCache(cacheKey, CACHE_TTL_MS);
      if (cached) return Promise.resolve(cached);
    }
    const onderdeel = window.PKIndex ? window.PKIndex.byId(onderdeelId, kind) : null;
    const items = onderdeel && onderdeel.items ? onderdeel.items : [];
    return Promise.all(
      items.map((it) =>
        Promise.all([fetchCount(attemptsKey(it.id)), fetchCount(errorsKey(it.id)), fetchCount(uniqKey(it.id))]).then(
          ([attempts, errors, uniqueDevices]) => ({
            id: it.id,
            label: it.label,
            secondary: it.secondary,
            attempts: attempts,
            errors: errors,
            uniqueDevices: uniqueDevices,
            reachable: attempts !== null && errors !== null,
            errorPct: attempts ? Math.round(((errors || 0) / attempts) * 100) : null
          })
        )
      )
    ).then((rows) => {
      writeCache(cacheKey, rows);
      return rows;
    });
  }

  /* ---------- alles op nul zetten (leerkrachtoverzicht) ---------------------- */

  function setToZero(key) {
    return fetch(BASE + "set/" + key + "?value=0").catch(() => null);
  }

  /* Zet alle pogingen/fouten/uniek-tellers terug op nul, zowel per item als
     per onderdeel. Wist ook de lokale caches zodat het overzicht meteen
     leeg toont, in plaats van pas na de volgende minuut. Dit reset enkel de
     tellers op de tellerdienst zelf: de "al geteld op dit toestel"-vlaggen
     in de browser van leerlingen blijven staan, dus wie al meetelde voor de
     reset, telt na de reset niet nog eens automatisch mee als "nieuw". */
  function resetAll() {
    const onderdelen = window.PKIndex ? window.PKIndex.all() : [];
    const calls = [];
    onderdelen.forEach((o) => {
      calls.push(setToZero(attemptsKey(o.scope)), setToZero(errorsKey(o.scope)), setToZero(uniqKey(o.scope)));
      const items = o.items || [];
      items.forEach((it) => {
        calls.push(setToZero(attemptsKey(it.id)), setToZero(errorsKey(it.id)), setToZero(uniqKey(it.id)));
      });
    });
    try {
      sessionStorage.removeItem(CACHE_KEY);
      Object.keys(sessionStorage).forEach((k) => {
        if (k.indexOf(ITEM_CACHE_KEY) === 0) sessionStorage.removeItem(k);
      });
    } catch (e) {
      /* negeren */
    }
    return Promise.all(calls);
  }

  window.PKAnalytics = {
    recordAnswer: recordAnswer,
    fetchOverview: fetchOverview,
    fetchItemBreakdown: fetchItemBreakdown,
    resetAll: resetAll
  };
})();
