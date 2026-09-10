# Permanente Kennis — Aardrijkskunde

Een gratis, statische studiewebsite bij de twee referentiebundels
("Permanente Kennis 2025" en "Permanente Kennis eerste graad"). Leerlingen
oefenen hoofdsteden, provincies, rivieren, gebergtes en zeeën in met
leerkaarten, meerkeuzevragen, invultoetsen én echte kaartoefeningen op de
originele kaarten uit de bundel.

**Inwonersaantallen en vlaggen staan er bewust niet in** — die hoeven
leerlingen niet te kennen.

## Bekijken zonder installatie

Dubbelklik gewoon op `index.html`. De site werkt volledig offline (de
kaartafbeeldingen zitten er zelf bij, er wordt geen externe kaartendienst
gebruikt), er is geen server of build-stap nodig.

## De 8 kaartbladen

De site volgt dezelfde opbouw als je bundels, van de eigen leefomgeving
naar de wereld:

1. **Hasselt** — de eigen leefruimte
2. **België** — provincies, gewesten, rivieren, autowegen
3. **Europese Unie** — de 27 lidstaten
4. **Europa** — kandidaat-lidstaten, andere landen, alle 50 landen samen
5. **Europa: water en reliëf** — zeeën, oceanen, rivieren, gebergte
6. **Continenten & werelddelen** — en de oceanen/zeeën van de wereld
7. **Landen & steden** — de 21 landen en steden uit de wereldbundel
8. **Reliëf, rivieren & zeeën** — in de wereld

## Wat zit erin?

Voor elk tekst-onderdeel (hoofdsteden, rivieren, provincies, ...) kan je
kiezen tussen leerkaarten, meerkeuze, juist/fout, een invultoets en een
tabeltoets — meestal ook omgekeerd (bv. hoofdstad → land).

Daarnaast staan er bovenaan elk kaartblad **echte kaartoefeningen**, op
de originele kaarten uit de bundel zelf (uit de PDF gehaald — dezelfde
kaarten die leerlingen al kennen, geen vreemde kaartendienst met extra
info erop):

- **Kaart bekijken** — alles gelabeld, om rustig in te studeren
- **Wijs aan** — leerling klikt zelf de juiste plaats aan op de kaart
- **Meerkeuze op de kaart** — een plaats is gemarkeerd, kies de juiste naam
- **Genummerde kaart (zoals op je toets)** — elk nummer op de kaart is
  een plaats; leerlingen vullen in een tabel de naam in, en bij landen
  ook de hoofdstad — precies zoals bij een schriftelijke overhoring.

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
- **Site laadt wel, maar zonder opmaak/logo/kaarten**: de map `assets`
  is niet meegeüpload, of niet op hetzelfde niveau als `index.html`
  beland.

## Inhoud aanpassen of uitbreiden

**Tekst-onderdelen** (leerkaarten/meerkeuze/invultoets/...) staan in
`assets/data.js`. Elk onderdeel ("topic") is een lijst van kaartjes:

- `kind: "pair"` — een vraag met één vast antwoord (bv. land → hoofdstad).
  Zet `allowTyping: false` als het antwoord een lange zin is (zoals bij
  de rivieren en autowegen), zodat de invultoets-knop niet verschijnt.
- `kind: "category"` — leerlingen bepalen tot welke soort een naam
  behoort (bv. is dit een rivier, een zee of een gebergte?).

Om een nieuw tekst-onderdeel toe te voegen: kopieer een bestaand blokje,
pas de titel en de `items` aan — de rest (leerkaarten, meerkeuze,
voortgangsbalkjes, ...) werkt er automatisch mee.

**Kaartoefeningen** staan in `assets/mapdata.js`. Elk blokje verwijst
naar een afbeelding in `assets/img/maps/` en een lijst `items` met
pixelposities (`x`,`y`, geteld vanaf linksboven op die afbeelding — te
vinden door de afbeelding te openen in een tekenprogramma en de
muisaanwijzer op de juiste plek te zetten). Voor een lijnvormig element
zoals een autoweg gebruik je `lines` met een reeks `path`-coördinaten in
plaats van één punt. Wil je een heel nieuwe kaart toevoegen (bv. een
andere pagina uit een volgende bundel)? Zet de afbeelding in
`assets/img/maps/`, en maak een nieuw blokje naar het voorbeeld van de
bestaande — vermeld de echte afmetingen van de afbeelding in pixels bij
`imageSize`.

## Techniek

Geen frameworks, geen build-stap, geen externe kaartendienst: gewone
HTML, CSS en JavaScript, met de kaartafbeeldingen gewoon als bestand
meegeleverd. De voortgang (beste score per onderdeel) wordt per toestel
bewaard in de browser (`localStorage`) — er wordt niets naar een server
gestuurd en er worden geen gegevens over leerlingen verzameld.

## Huisstijl Hast

De site gebruikt het echte Hast-logo (`assets/img/hast-logo.png`) in de
header en een foto van Campus Hast (`assets/img/hast-campus.jpg`) als
banner op de startpagina, met de Hast-kleuren (donkerblauw #022E3E en
rood #E5343C) als basis voor knoppen, accenten en actieve status. Wil je
een andere foto als banner? Vervang gewoon `assets/img/hast-campus.jpg`
door een andere afbeelding met dezelfde bestandsnaam.
