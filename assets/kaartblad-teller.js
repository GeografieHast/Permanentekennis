/* ==========================================================================
   Permanente Kennis — kaartblad-teller.js
   Telt, per kaartblad, hoeveel verschillende toestellen er minstens één
   oefening op hebben afgerond — over alle leerlingen samen.

   Werkt via een afbeeldingsverzoek (zoals een klassieke "tracking pixel")
   in plaats van fetch()+JSON: dat wordt door browsers nooit geblokkeerd
   (geen CORS-gedoe), in tegenstelling tot een gewone fetch()-aanroep naar
   een extern domein, die in veel browsers stil faalt. Gebruikt dezelfde
   gratis, accountloze tellerdienst als voorheen (countapi.mileshilliard.com),
   met een eigen sleutel per kaartblad.

   Om dichter bij "hoeveel leerlingen" te komen dan bij "hoeveel keer
   geoefend": elk toestel telt maar één keer mee per kaartblad, ook al
   oefent diezelfde leerling er nadien nog vaker op (bijgehouden via
   localStorage, net zoals de rest van de voortgang). Er wordt geen
   enkel ander gegeven over een leerling bewaard of verstuurd, enkel dat
   ene "+1"-signaal.
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

  /* Dit toestel deed net een oefening af op kaartblad "moduleId". Vuurt
     een onzichtbaar afbeeldingsverzoek af (geen CORS-probleem mogelijk),
     enkel de allereerste keer voor dit toestel op dit kaartblad. */
  function bump(moduleId) {
    if (!moduleId || alreadyCounted(moduleId)) return;
    markCounted(moduleId);
    try {
      const pixel = new Image();
      pixel.src = BASE + "hit/" + key(moduleId);
    } catch (e) {
      /* kan hier eigenlijk niet mislukken, maar voor de zekerheid */
    }
  }

  /* URL van een klein badge-plaatje met het huidige aantal voor dit
     kaartblad (verhoogt de teller niet). Rechtstreeks bruikbaar als
     <img src="..."> — geen JavaScript-uitlezing nodig, dus ook geen
     CORS-gevoeligheid. */
  function badgeUrl(moduleId, label) {
    const params = "text=" + encodeURIComponent(label || "leerlingen") + "&bgcolor=1F7A6C&textcolor=ffffff&style=flat";
    return BASE + "get/" + key(moduleId) + "/shield?" + params;
  }

  window.PKCounter = { bump: bump, badgeUrl: badgeUrl };
})();
