/* ==========================================================================
   Permanente Kennis — index.js
   Bouwt één keer een overzicht van alle "onderdelen" (tekst-onderdelen uit
   data.js + kaartoefeningen uit mapdata.js) met een stabiele lijst van
   item-sleutels per onderdeel. Wordt gebruikt door app.js (voortgang,
   Mijn fouten, Onderhoud), mapquiz.js en analytics.js (leerkrachtoverzicht),
   zodat die drie bestanden niet elk hun eigen kopie van deze logica nodig
   hebben.
   ========================================================================== */

(function () {
  "use strict";

  function norm(str) {
    return String(str || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ");
  }

  function topicItemKey(item) {
    return norm(item.term);
  }
  function topicItemId(topicId, item) {
    return "t:" + topicId + "::" + topicItemKey(item);
  }
  function mapItemId(groupId, legendKey) {
    return "m:" + groupId + "::" + legendKey;
  }
  /* Uit een item-id ("t:topicId::term" of "m:groupId::key") het onderdeel-
     niveau scope-id afleiden ("t:topicId" / "m:groupId"), zodat analytics.js
     naast een teller per item ook automatisch een teller per onderdeel kan
     bijhouden zonder dat elke aanroeper dat zelf moet berekenen. */
  function onderdeelScopeOf(itemId) {
    const i = String(itemId || "").indexOf("::");
    return i === -1 ? itemId : itemId.slice(0, i);
  }

  function build() {
    const topics = [];
    const mapGroups = [];

    (window.PK_DATA ? window.PK_DATA.modules : []).forEach((mod) => {
      mod.topics.forEach((topic) => {
        const scope = "t:" + topic.id;
        const items = topic.items.map((it) => ({ id: topicItemId(topic.id, it), label: it.term, secondary: null }));
        topics.push({
          id: topic.id,
          scope: scope,
          moduleId: mod.id,
          moduleTitle: mod.title,
          title: topic.title,
          kind: "topic",
          itemIds: items.map((it) => it.id),
          items: items
        });
      });
    });

    (window.PK_MAPS ? window.PK_MAPS.groups : []).forEach((group) => {
      const scope = "m:" + group.id;
      const items = group.legend.map((e) => ({ id: mapItemId(group.id, e.key), label: e.term, secondary: e.capital || null }));
      mapGroups.push({
        id: group.id,
        scope: scope,
        moduleId: group.moduleId,
        moduleTitle: (window.PK_DATA.modules.find((m) => m.id === group.moduleId) || {}).title || "",
        title: group.title.replace(/^Kaartoefening:\s*/, ""),
        kind: "map",
        itemIds: items.map((it) => it.id),
        items: items
      });
    });

    return { topics: topics, mapGroups: mapGroups };
  }

  let cache = null;
  function get() {
    if (!cache) cache = build();
    return cache;
  }

  function all() {
    const idx = get();
    return idx.topics.concat(idx.mapGroups);
  }

  function byId(id, kind) {
    const idx = get();
    if (kind === "map") return idx.mapGroups.find((g) => g.id === id);
    return idx.topics.find((t) => t.id === id);
  }

  function onderdelenForModule(moduleId) {
    const idx = get();
    return idx.topics.filter((t) => t.moduleId === moduleId).concat(idx.mapGroups.filter((g) => g.moduleId === moduleId));
  }

  window.PKIndex = {
    topicItemKey: topicItemKey,
    topicItemId: topicItemId,
    mapItemId: mapItemId,
    onderdeelScopeOf: onderdeelScopeOf,
    norm: norm,
    all: all,
    get: get,
    byId: byId,
    onderdelenForModule: onderdelenForModule
  };
})();
