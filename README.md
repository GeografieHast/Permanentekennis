# Permanente Kennis — Aardrijkskunde

Een gratis, statische studiewebsite bij de twee referentiebundels
("Permanente Kennis 2025" en "Permanente Kennis eerste graad"). Leerlingen
oefenen de hoofdsteden, provincies, rivieren, gebergtes en zeeën in met
leerkaarten, meerkeuzevragen en invultoetsen.

**Inwonersaantallen en vlaggen staan er bewust niet in** — die hoeven
leerlingen niet te kennen.

## Bekijken zonder installatie

Dubbelklik gewoon op `index.html`. De site werkt volledig offline, er is
geen server of build-stap nodig.

## Wat zit erin?

Voor elk onderdeel (hoofdsteden, rivieren, provincies, ...) kan je kiezen
tussen leerkaarten, meerkeuze, juist/fout, een invultoets en een
tabeltoets — meestal ook omgekeerd (bv. hoofdstad → land). Daarnaast
staan er **echte kaartoefeningen** op een OpenStreetMap-kaart: leerlingen
klikken zelf de juiste plaats aan, bekijken een gelabelde kaart om te
studeren, of krijgen een gemarkeerde plaats te herkennen. Dat geldt voor
de hoofdsteden van Europa en de EU, de zeeën/rivieren/gebergtes, de
landen en steden uit de wereldbundel, en voor België: provincies,
rivieren, autowegen en Hasselt als referentiepunt.

De kaarten gebruiken [OpenStreetMap](https://www.openstreetmap.org/copyright)
via de gratis [Leaflet](https://leafletjs.com)-bibliotheek (beide geladen
vanaf hun eigen CDN, dus reken op een werkende internetverbinding bij de
leerlingen — dat is toch al zo voor de lettertypes).

## Gratis hosten op GitHub Pages — stap voor stap

**Belangrijk:** je moet de bestanden uit de zip **uploaden**, niet de
zip zelf. En ze moeten in de **hoofdmap** van de repository staan (dus
niet in een extra onderliggend mapje).

1. **Pak de zip eerst uit** op je computer (dubbelklik erop, of
   rechtermuisknop → "Alles uitpakken"). Je krijgt een map met daarin:
   `index.html`, de map `assets`, `README.md` en `.nojekyll`.
2. Ga naar [github.com](https://github.com) en log in.
3. Klik rechtsboven op **+** → **New repository**.
   - Geef een naam, bv. `permanente-kennis`.
   - Zet hem op **Public**.
   - Vink niets extra aan (geen README, geen .gitignore).
   - Klik **Create repository**.
4. Op de lege repository-pagina klik je op de link **"uploading an
   existing file"** (of ga naar **Add file → Upload files**).
5. Open op je computer de uitgepakte map en **selecteer alles wat erin
   zit** (`index.html`, de map `assets`, `README.md`, `.nojekyll` —
   dus niet de map zelf, wél de inhoud ervan). Sleep die bestanden
   samen naar het uploadvak op GitHub.
   - Controleer nadien op de GitHub-pagina of je bovenaan gewoon
     `index.html` en `assets` ziet staan — **niet** een map met de
     naam van je zip erin. Zie je die wél, dan is er een extra laag
     mee-geupload; verwijder ze en upload opnieuw met enkel de
     inhoud geselecteerd.
6. Scrol naar onder en klik **Commit changes**.
7. Ga naar **Settings** (bovenaan de repository) → **Pages** (linkermenu).
8. Bij **"Build and deployment" → Source** kies je **Deploy from a
   branch**. Bij **Branch** kies je `main` en `/ (root)`. Klik **Save**.
9. Wacht ongeveer 1 minuut en herlaad de Pages-instellingenpagina. Je
   ziet dan bovenaan een groen vakje met de link naar je site:
   `https://GEBRUIKERSNAAM.github.io/permanente-kennis/`.

Werkt de link nog niet meteen? Wacht nog een minuutje en herlaad met
Ctrl+Shift+R (harde herlaad) — de allereerste keer duurt het bouwen
soms iets langer.

### Meest voorkomende fouten

- **Lege of witte pagina / 404-foutmelding**: `index.html` staat niet
  in de hoofdmap van de repository, maar in een submap (bv. omdat de
  hele uitgepakte map in één keer is geüpload in plaats van de inhoud
  ervan). Los op door de bestanden te verplaatsen naar de hoofdmap, of
  de repository leeg te maken en opnieuw te uploaden zoals in stap 5.
- **Pages-tab toont geen link**: stap 7-8 (Settings → Pages) is nog
  niet gebeurd, of de verkeerde branch/map staat ingesteld.
- **Site laadt wel, maar zonder opmaak/logo**: de map `assets` is niet
  meegeüpload, of niet op hetzelfde niveau als `index.html` beland.


## Inhoud aanpassen of uitbreiden

Alle leerstof staat in **één bestand**: `assets/data.js`. Elk onderdeel
("topic") is een lijst van kaartjes:

- `kind: "pair"` — een vraag met één vast antwoord (bv. land → hoofdstad).
  Zet `allowTyping: false` als het antwoord een lange zin is (zoals bij de
  rivieren en autowegen), zodat de invultoets-knop niet verschijnt.
- `kind: "category"` — leerlingen bepalen tot welke soort een naam behoort
  (bv. is dit een rivier, een zee of een gebergte?).

Om een nieuw onderdeel toe te voegen: kopieer een bestaand blokje in
`assets/data.js`, pas de titel en de `items` aan. De website (leerkaarten,
meerkeuze, invultoets, voortgangsbalkjes) werkt er automatisch mee — er
moet niets aangepast worden in `assets/app.js` of `assets/styles.css`.

Een kaartoefening toevoegen of aanpassen doe je in `assets/mapdata.js`:
elk blokje daar heeft een titel, een startpositie voor de kaart (`view`),
en een lijst `items` met naam + coördinaten (`lat`/`lng`, te vinden door
een plaats op te zoeken op [openstreetmap.org](https://www.openstreetmap.org)
en de coördinaten uit de URL te kopiëren). Voor een lijnvormig element
zoals een autoweg gebruik je `lines` met een reeks `path`-coördinaten in
plaats van één punt.

## Techniek

Geen frameworks, geen build-stap: gewone HTML, CSS en JavaScript. De
voortgang (beste score per onderdeel) wordt per toestel bewaard in de
browser (`localStorage`) — er wordt niets naar een server gestuurd en er
worden geen gegevens over leerlingen verzameld.

## Huisstijl Hast

De site gebruikt het echte Hast-logo (`assets/img/hast-logo.png`) in de
header en een foto van Campus Hast (`assets/img/hast-campus.jpg`) als
banner op de startpagina, met de Hast-kleuren (donkerblauw #022E3E en
rood #E5343C) als basis voor knoppen, accenten en actieve status. Wil je
een andere foto als banner? Vervang gewoon `assets/img/hast-campus.jpg`
door een andere afbeelding met dezelfde bestandsnaam.

