/* ==========================================================================
   Permanente Kennis — kaartblad-teller.js
   Telt, per kaartblad, hoeveel verschillende toestellen er minstens één
   oefening op hebben afgerond — over alle leerlingen samen. Geen account,
   geen server van onszelf nodig: dezelfde gratis, accountloze tellerdienst
   die de site al gebruikt voor de bezoekersteller op de startpagina
   (countapi.mileshilliard.com), gewoon met een eigen sleutel per
   kaartblad.

   Om dichter bij "hoeveel leerlingen" te komen dan bij "hoeveel keer
   geoefend": elk toestel telt maar één keer mee per kaartblad, ook al
   oefent diezelfde leerling er nadien nog vaker op (bijgehouden via
   localStorage, net zoals de rest van de voortgang). Er wordt geen
   enkel ander gegeven over een leerling bewaard of verstuurd, enkel dat
   ene "+1"-signaal.

   Geen internet of de tellerdienst niet bereikbaar? Dan faalt dit
   gewoon stil op de achtergrond — de rest van de app (leerkaarten,
   quizzen, kaartoefeningen, eigen voortgang) blijft normaal werken.
   ========================================================================== */

(function () {
  "use strict";

  const BASE = "https://countapi.mileshilliard.com/api/v1/";
  const KEY_PREFIX = "geografiehast-permanentekennis-kaartblad-";
  const DONE_PREFIX = "pk-kaartblad-geteld-";

  function key(moduleId) {
    return KEY_PREFIX + moduleId;
  }

  function alreadyCounted(moduleId) {
    try {
      return localStorage.getItem(DONE_PREFIX + moduleId) === "1";
    } catch (e) {
      return false;
    }
  }
  function markCounted(moduleId) {
    try {
      localStorage.setItem(DONE_PREFIX + moduleId, "1");
    } catch (e) {
      /* privé-modus of vol geheugen: dan telt dit toestel volgende keer gewoon opnieuw mee */
    }
  }

  /* Dit toestel deed net een oefening af op kaartblad "moduleId". Telt
     enkel de allereerste keer mee voor dit toestel op dit kaartblad. */
  function bump(moduleId) {
    if (!moduleId || alreadyCounted(moduleId)) return;
    markCounted(moduleId);
    fetch(BASE + "hit/" + key(moduleId)).catch(() => {
      /* mislukt? dan proberen we het gewoon een volgende keer weer */
    });
  }

  /* Haal de telling van precies één kaartblad op (verhoogt niets). */
  function fetchOne(moduleId, callback) {
    fetch(BASE + "get/" + key(moduleId))
      .then((r) => r.json())
      .then((data) => callback(data && data.value != null ? data.value : 0))
      .catch(() => callback(0));
  }

  /* Haal de tellingen van een lijst kaartblad-id's in één keer op. */
  function fetchAll(moduleIds, callback) {
    const result = {};
    const ids = moduleIds || [];
    Promise.all(
      ids.map(
        (id) =>
          new Promise((resolve) => {
            fetchOne(id, (n) => {
              result[id] = n;
              resolve();
            });
          })
      )
    ).then(() => callback(result));
  }

  window.PKCounter = { bump: bump, fetchOne: fetchOne, fetchAll: fetchAll };
})();
