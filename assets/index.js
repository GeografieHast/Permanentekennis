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

  function build() {
    const topics = [];
    const mapGroups = [];

    (window.PK_DATA ? window.PK_DATA.modules : []).forEach((mod) => {
      mod.topics.forEach((topic) => {
        const scope = "t:" + topic.id;
        const itemIds = topic.items.map((it) => topicItemId(topic.id, it));
        topics.push({
          id: topic.id,
          scope: scope,
          moduleId: mod.id,
          moduleTitle: mod.title,
          title: topic.title,
          kind: "topic",
          itemIds: itemIds
        });
      });
    });

    (window.PK_MAPS ? window.PK_MAPS.groups : []).forEach((group) => {
      const scope = "m:" + group.id;
      const itemIds = group.legend.map((e) => mapItemId(group.id, e.key));
      mapGroups.push({
        id: group.id,
        scope: scope,
        moduleId: group.moduleId,
        moduleTitle: (window.PK_DATA.modules.find((m) => m.id === group.moduleId) || {}).title || "",
        title: group.title.replace(/^Kaartoefening:\s*/, ""),
        kind: "map",
        itemIds: itemIds
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
    norm: norm,
    all: all,
    get: get,
    byId: byId,
    onderdelenForModule: onderdelenForModule
  };
})();
