# Permanente Kennis — Aardrijkskunde

Een gratis, statische studiewebsite bij de twee referentiebundels
("Permanente Kennis 2025" en "Permanente Kennis eerste graad"). Leerlingen
oefenen hoofdsteden, provincies, rivieren, gebergtes en zeeën in met
leerkaarten, meerkeuzevragen, invultoetsen én echte kaartoefeningen op de
originele kaarten uit de bundel.

**Inwonersaantallen en vlaggen staan er bewust niet in** — die hoeven
leerlingen niet te kennen.

## Een volledige leeromgeving, geen losse quizjes

Elk onderdeel (elk "woordjes en feiten"-onderdeel én elke kaartoefening)
volgt hetzelfde vaste pad:

1. **Leren** — een rustig leesbaar overzicht (tabel, of de kaart met de
   volledige legende) — geen druk, geen score.
2. **Oefenen** — de aanbevolen "Oefenen"-oefening wordt per vraagje
   automatisch moeilijker naarmate de leerling het beter kent: eerst
   meerkeuze, dan juist/fout, en pas daarna zelf typen. Een fout antwoord
   komt binnen dezelfde oefensessie vanzelf nog eens terug. Daarnaast
   blijven de klassieke, vaste oefenvormen (meerkeuze, juist/fout,
   invultoets, tabeltoets) gewoon beschikbaar onder "Andere oefenvormen".
3. **Mijn fouten** — een knop die uitsluitend de vraagjes herhaalt die de
   leerling recent fout had, per onderdeel én in één keer over alle
   kaartbladen samen (`#/fouten`, ook een snelkoppeling op de startpagina).
   Een vraagje verdwijnt pas uit de foutenbank als het weer juist beantwoord
   wordt.
4. **Test jezelf** — dezelfde vragen, maar zonder tussentijdse feedback:
   je ziet pas op het einde wat juist en fout was, net als op een
   schriftelijke toets. Nadien: score, en per gemiste vraag niet enkel
   wát je fout had maar ook meteen het **juiste antwoord** ernaast, plus
   een knop om meteen "Mijn fouten" te starten. Bij Leren/Oefenen/Mijn
   fouten (waar wél tussentijdse feedback is) staat bij een fout antwoord
   altijd kort en duidelijk "❌ Fout — het juiste antwoord is ..." — nooit
   enkel "fout" zonder het juiste antwoord erbij.
5. **Onderhoud** — wat een leerling al **beheerst** (drie keer na elkaar
   juist, zonder hulp), duikt na verloop van tijd vanzelf weer op: eerst na
   1 dag, dan na 3, 7, 16, 35 en 90 dagen, telkens opnieuw zolang het juist
   blijft. Eén fout tijdens onderhoud duwt een onderdeel terug naar
   "moet geoefend worden". Bereikbaar via `#/onderhoud` en de snelkoppeling
   op de startpagina (met een teller hoeveel er klaarstaat).

Op de startpagina en bovenaan elk kaartblad/onderdeel zie je steeds twee
aparte percentages: **% geoefend** (al minstens één keer geprobeerd) en
**% beheerst** (drie keer na elkaar juist, zonder hulp) — dat is bewust
niet hetzelfde.

Op elk kaartblad-onderdeel en elke kaartoefening staan de stappen Leren →
Oefenen → Mijn fouten → Test jezelf nu als een **stepper** naast elkaar
(genummerd, met een verbindingslijn op een breed scherm), niet als een
rij gelijkwaardige knoppen. De stap die op dat moment het meeste zin
heeft om als volgende te doen — op basis van wat je al probeerde, hoeveel
er beheerst is en of er nog open fouten staan — krijgt een opvallend
label **"Begin hier →"**, zodat je nooit zelf hoeft te bedenken waar te
starten.

### Startpagina: opgeruimder, met "Ga verder" en meer nadruk op Onderhoud

De startpagina toont voortaan alleen het essentiële meteen: de hero, een
knop **"Ga verder waar je gebleven was"** (zodra je ooit een onderdeel
opende — zie hieronder), de twee kaartblad-groepen (eerste graad /
tweede en derde graad), en een prominente **Onderhoud**-kaart. Cijfers,
"Hoe werkt het" en je eigen doelen/mijlpalen staan achter een
uitklapper ("📊 Hoe werkt het, en hoe sta ik ervoor?") onderaan — leuk
om te bekijken, maar niet iets wat elke keer opnieuw in de weg moet
staan.

De **Onderhoud**-kaart kreeg bewust het meeste gewicht van de hele
startpagina (naast "Ga verder"): een grote kaart met uitleg waarom
onderhoud nuttig is, en een tellertje dat zacht pulseert zodra er iets
klaarstaat. Dat is bewust een grotere kaart dan "Mijn fouten" ernaast —
Onderhoud is pedagogisch het onderdeel dat er echt voor zorgt dat kennis
*permanent* blijft, en verdiende dus meer aandacht dan voorheen (toen
het een klein, even groot pilletje was als "Mijn fouten").

### "Ga verder waar je gebleven was"

De site onthoudt, telkens je een kaartblad-onderdeel of een
kaartoefening opent (in eender welke stap: leren, oefenen, mijn fouten
of test jezelf), waar je was — in `localStorage`, per toestel, net als
de rest van je voortgang. Op de startpagina verschijnt daardoor, zodra
dat ooit gebeurde, een knop die rechtstreeks teruglinkt, met erbij wát
het was (bv. "Hoofdsteden EU — Oefenen"). Zo hoef je na een onderbreking
niet opnieuw te zoeken naar waar je gebleven was.

## Voor de leerkracht: welke onderdelen — en welke items — gaan vaak fout?

Onderaan elke pagina staat een kleine link **"Voor leerkrachten"**
(`#/leerkracht`). Die pagina toont, samengeteld over alle leerlingen en
toestellen, per onderdeel hoeveel keer er geoefend is en welk percentage
daarvan fout ging — gesorteerd van "gaat het meest fout" naar "zit goed
vast". Klik een rij open en je krijgt het **detail per item**: bij een
kaartblad per land/symbool ("Kosovo — 70% fout" naast "België — 5% fout"),
bij een tekst-onderdeel per begrip. Zo zie je niet enkel dát een kaartblad
moeilijk is, maar precies **welk land, welke hoofdstad of welk symbool**
de klas nog niet kent.

Naast "pogingen" en "fouten" toont elke rij ook **"verschillende
leerlingen (toestellen)"**: een schatting van hoeveel afzonderlijke
toestellen dat onderdeel/item al minstens één keer probeerden, niet enkel
hoeveel pogingen er in totaal waren. Dat voorkomt een vertekend beeld
(20 pogingen kan 1 leerling zijn die 20 keer herkanst, of 20 verschillende
leerlingen). Dit gebeurt via een willekeurig, anoniem kenmerk dat één keer
per toestel in de browser wordt aangemaakt (geen naam, geen account) — dus
een **schatting per toestel**, geen geverifieerde identiteit: dezelfde
leerling op twee toestellen telt als 2, en een gedeeld klastoestel voor
meerdere leerlingen telt maar als 1. Dat staat ook als korte melding
bovenaan de leerkrachtpagina zelf.

Dit is bewust **geen volledig leerlingvolgsysteem**: er wordt nergens
bijgehouden wélke leerling iets fout had, enkel geteld hoe vaak elk item
juist/fout beantwoord werd — via dezelfde gratis, accountloze tellerdienst
die de site al gebruikt voor de bezoekersteller en de teller per
kaartblad (`countapi.mileshilliard.com`). De pagina vraagt een wachtwoord
(standaard **3500**, aan te passen in `assets/app.js` bij de variabele
`_pkGateCode`, vlak boven `renderTeacher`) voor je de gegevens te zien
krijgt — dit is enkel een drempeltje, geen echte beveiliging (dat kan niet
op een statische GitHub Pages-site zonder server: elke waarde staat
sowieso leesbaar in de broncode voor wie er met "Bekijk paginabron" naar
zoekt, ongeacht hoe de variabele heet), maar het houdt nieuwsgierige
leerlingen buiten. Eén keer invullen op een toestel volstaat: daarna
onthoudt de browser dat dit toestel ontgrendeld is. Is de tellerdienst
even niet bereikbaar, dan toont de pagina dat gewoon (dankzij een timeout
van 6 seconden op elke aanroep naar de tellerdienst hangt de pagina nooit
lang op "Bezig met ophalen…") en kan je later opnieuw vernieuwen — de
rest van de site blijft normaal werken.

Bovenaan de tabel per onderdeel staan nu ook een paar **samenvattende
cijfers** in het groot (aantal onderdelen met data, totaal aantal
pogingen, gemiddeld foutenpercentage, aantal onderdelen met ≥ 50%
fout) — zodat je in één oogopslag weet hoe de klas er globaal voorstaat,
vóór je in de tabel zelf duikt. De tabel **"Per onderdeel"** is bovendien
sorteerbaar: klik op eender welke kolomkop (Onderdeel, Kaartblad,
Pogingen, Fouten, Foutenpercentage, Verschillende leerlingen) om erop te
sorteren, nog eens klikken keert de volgorde om.

Bovenaan de leerkrachtpagina staat, los van de tabel per onderdeel, ook een
lijst **"Meeste fouten — over alle onderdelen heen"**: de items met het
hoogste foutenpercentage over de hele site, ongeacht bij welk kaartblad ze
horen (en daaronder, ter vergelijking, de items die het best zitten). Enkel
items met minstens 3 pogingen tellen mee, anders zou 1 pechpoging al
bovenaan staan. Naast die titel staat een knop **"🔎 Projecteren"**: die
opent de top-10 "meeste fouten" in het groot, met weinig andere ruis
eromheen — handig om letterlijk op het scherm/bord te tonen tijdens de
les. Sluiten kan met de knop, met Escape, of door naast de kaart te
klikken.

Naast "↻ Vernieuwen" staat een knop **"Pogingen resetten"**. Die vraagt
eerst een bevestiging en zet dan alle tellers (pogingen, fouten, en de
schatting van verschillende toestellen) terug op nul, voor alle onderdelen
en items samen. Handig bij het begin van een nieuw schooljaar of na een
periode waarin je de teller even niet wil laten meetellen. Dit kan niet
ongedaan gemaakt worden.

**Let op bij een update vanaf een oudere versie:** de tellers zijn
overgeschakeld van "één teller per heel kaartblad/onderdeel" naar "één
teller per item", zodat het detail per land/symbool/begrip mogelijk werd.
Daardoor beginnen de pogingen/fouten-aantallen opnieuw bij 0 — de oude,
opgebouwde totalen per kaartblad gaan niet verloren in de zin dat er iets
stukgaat, maar ze tellen gewoon niet meer mee, want het zijn nu andere
tellersleutels. Dit is eenmalig bij deze update.

## Bekijken zonder installatie

Dubbelklik gewoon op `index.html`. De site werkt volledig offline (de
kaartafbeeldingen zitten er zelf bij, er wordt geen externe kaartendienst
gebruikt), er is geen server of build-stap nodig.

## De 9 kaartbladen

De site volgt dezelfde opbouw als je bundels, van de eigen leefomgeving
naar de wereld. Op de startpagina staan kaartblad 1-2 en kaartblad 3-9 in
twee aparte rijen, met een korte uitleg erbij — zo weet elke leerling
meteen welk deel voor hem/haar is:

**Eerste graad** (kaartblad 1-2):

1. **Hasselt** — de eigen leefruimte
2. **België** — provincies, gewesten, rivieren, autowegen

**Tweede en derde graad** (kaartblad 3-9):

3. **Europese Unie** — de 27 lidstaten
4. **Europa** — kandidaat-lidstaten, andere landen, alle 50 landen samen
5. **Europese rivieren en gebergtes** — op de EU-kaart
6. **Europa: water en reliëf** — zeeën, oceanen, rivieren, gebergte
7. **Continenten & werelddelen** — en de oceanen/zeeën van de wereld
8. **Landen & steden** — de 21 landen en steden uit de wereldbundel
9. **Reliëf, rivieren & zeeën** — in de wereld

Die indeling in twee groepen staat in `assets/app.js` bij
`EERSTE_GRAAD_IDS` (in de functie `renderHome`) — daar kan je kaartbladen
tussen de twee groepen verschuiven als je indeling ooit wijzigt.

## Wat zit erin?

Voor elk tekst-onderdeel (hoofdsteden, rivieren, provincies, ...) kan je
kiezen tussen leerkaarten, meerkeuze, juist/fout, een invultoets en een
tabeltoets — meestal ook omgekeerd (bv. hoofdstad → land).

Daarnaast staat er bovenaan elk kaartblad een **kaartoefening op de
echte, genummerde kaart uit de bundel** — exact dezelfde kaart als op
papier, met dezelfde cijfers, letters en Romeinse cijfers:

- **Kaart bekijken** — de kaart met de volledige legende ernaast, om
  rustig in te studeren. Hier wordt **niets** aangeduid: de leerling
  zoekt zelf alle symbolen op, precies zoals bij het instuderen op
  papier.
- **Meerkeuze** — bij elk symbool: kies de juiste naam (en bij landen
  ook de hoofdstad) uit vier opties. Het gevraagde symbool wordt met
  een klein rood, zacht pulserend rondje **aangeduid op de kaart
  zelf**, zodat een leerling het sneller terugvindt tussen tientallen
  andere cijfers/letters — vooral handig bij de drukke kaarten (Europa
  met 50 landen, de wereldkaart met 42 landen/steden).
- **Zelf typen** — hetzelfde, met dezelfde aanduiding op de kaart, maar
  dan zelf typen in plaats van kiezen.

De legende komt rechtstreeks uit de antwoordtabellen van de bundel
zelf, dus die klopt gegarandeerd met de kaart.

Ook in **"Mijn fouten"** (en bij "Test jezelf"/"Onderhoud") wordt een
kaartvraag met dezelfde grote kaart en hetzelfde rondje getoond in plaats
van een klein plaatje — net omdat je daar net moet kunnen zien wáár het
juiste symbool staat om jezelf te kunnen verbeteren.

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

## Teller per kaartblad

Op de startpagina en bovenaan elk kaartblad staat een teller: hoeveel
leerlingen er op dat kaartblad al minstens één oefening hebben
afgerond (leerkaarten tellen niet mee, wel meerkeuze, juist/fout,
invultoets, tabeltoets, kaartoefeningen en de grote overhoring), over
alle toestellen samen. Dit gebruikt dezelfde gratis, accountloze
tellerdienst die de site al gebruikt voor de bezoekersteller op de
startpagina (`countapi.mileshilliard.com`) — gewoon met een eigen
sleutel per kaartblad. Er is niets in te stellen: dit werkt meteen,
ook meteen na het uploaden naar GitHub Pages.

Deze teller praat met die dienst via een **afbeeldingsverzoek**
(zoals een klassieke "tracking pixel" en een badge-plaatje), niet via
een gewone JavaScript-`fetch()`-aanroep. Dat is bewust: browsers
blokkeren `fetch()`-aanroepen naar externe domeinen soms stilzwijgend
(CORS), maar een afbeelding laden wordt nooit geblokkeerd. Daardoor
werkt deze teller betrouwbaarder dan de oorspronkelijke
bezoekersteller.

Om dichter bij "hoeveel leerlingen" te komen dan bij "hoeveel keer
geoefend": elk toestel telt maar één keer mee per kaartblad, ook al
oefent diezelfde leerling er nadien nog vaker op. Er wordt geen enkel
ander gegeven over een leerling bewaard of verstuurd, enkel dat ene
"+1"-signaal per kaartblad en per toestel.

Zoals bij de bezoekersteller geldt: dit is een klein, gratis dienstje
zonder garanties. Is het even niet bereikbaar, dan blijft de teller
gewoon een leeg plaatje tonen en werkt de rest van de site
(leerkaarten, quizzen, kaartoefeningen, eigen voortgang) volledig
normaal verder.

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
naar een afbeelding in `assets/img/maps/` (de genummerde kaart, met de
cijfers/letters gewoon zichtbaar op de afbeelding zelf) en een lijst
`legend` met `{ key: "3", term: "Frankrijk", capital: "Parijs", x: 25.0, y: 70.3 }`
voor elk symbool op die kaart. De antwoorden zelf (`key`/`term`/
`capital`) komen rechtstreeks uit de antwoordtabel van de bundel, dus
die klopt gegarandeerd — er wordt nergens een klikbare kaart met eigen
coördinaten gebruikt om te bepalen of iets juist is.

De velden **`x`/`y`** zijn enkel voor het rondje dat tijdens meerkeuze/
zelf-typen het gevraagde symbool aanduidt op de kaart (zie hierboven):
percentages (0-100) vanaf respectievelijk de linker- en bovenrand van
de afbeelding. Die zijn **met het oog geschat** door de kaartafbeelding
te bekijken en de positie van elk cijfer/letter/Romeins cijfer in te
schatten (en herzien met een automatische controle die elk rondje
vergelijkt met de dichtstbijzijnde bedrukte tekst op de kaart) — dus
zorgvuldig nagekeken, maar nog steeds geen pixel-perfecte meting, vooral
niet op de drukste kaarten (Europa met 50 landen, en de wereldkaart met
42 landen/steden). Staat een rondje net naast in plaats van op het
symbool? Zoek het bijhorende `legend`-blokje op `key` op en schuif `x`/`y`
een klein beetje bij (hoger % = verder naar rechts/onder). Ontbreken
`x`/`y` bij een entry, dan wordt er gewoon geen rondje getoond voor dat
symbool — de rest van de oefening blijft werken.

Wil je een nieuwe kaart toevoegen (bv. een pagina uit een volgende
bundel)? Zet een afbeelding van die kaart — mét de nummers/letters
erop, zoals in de bundel — in `assets/img/maps/`, en maak een nieuw
blokje met de bijhorende `legend`, overgenomen uit de antwoordtabel van
de bundel (`x`/`y` toevoegen is optioneel).

## Techniek

Geen frameworks, geen build-stap, geen externe kaartendienst, geen
klikcoördinaten: gewone HTML, CSS en JavaScript, met de kaartafbeeldingen
gewoon als bestand meegeleverd — inclusief hun eigen ingedrukte cijfers
en letters. De voortgang per vraagje (nieuw/in oefening/beheerst, wanneer
het weer aan onderhoud toe is, wat in de foutenbank staat) wordt per
toestel bewaard in de browser (`localStorage`) — er wordt niets naar een
server gestuurd en er worden geen gegevens over individuele leerlingen
verzameld.

De enige uitzondering is de teller per onderdeel/kaartblad (zie
"Voor de leerkracht" hierboven): die stuurt, telkens een leerling een
vraagje beantwoordt, een "+1"-signaal naar hetzelfde gratis, accountloze
tellerdienstje als de bezoekersteller — twee tellers per onderdeel
("pogingen" en "fouten"), geen naam, geen toestel-ID, geen enkel ander
gegeven.

Code-indeling in `assets/`:

- `data.js`, `mapdata.js` — de leerinhoud (tekst-onderdelen en
  kaartoefeningen), zoals voorheen.
- `index.js` — bouwt één keer een lijst van alle onderdelen met hun
  vraagjes, gebruikt door de andere bestanden.
- `progress.js` — de "leermotor": per vraagje nieuw/leren/beheerst,
  wanneer iets aan onderhoud toe is, en de foutenbank.
- `analytics.js` — de anonieme, samengetelde teller voor het
  leerkrachtoverzicht: per item én per onderdeel, plus de schatting van
  het aantal verschillende toestellen (zie hierboven).
- `mapquiz.js` — de kaartoefeningen (kaart bekijken, meerkeuze, zelf
  typen), inclusief het rondje dat het gevraagde symbool aanduidt op
  de kaart tijdens meerkeuze/zelf-typen.
- `kaartblad-teller.js` — de bestaande "aantal leerlingen"-badge per
  kaartblad.
- `app.js` — de rest van de site: routering, startpagina, leren/oefenen/
  fouten/testen/onderhoud, het leerkrachtoverzicht.

## Huisstijl Hast

De site gebruikt het echte Hast-logo (`assets/img/hast-logo.png`) in de
header. De banner op de startpagina is geen foto, maar een zelfgemaakte
illustratie (kompas, reisroutes, kaartvormen) in SVG-code, rechtstreeks in
`assets/app.js` (functie `heroIllustrationSVG`) — geen extra bestand
nodig, en dus ook geen toestemmings- of auteursrechtvraag. De kleuren
(donkerblauw #022E3E, rood #E5343C, plus teal #1F7A6C en oker #C9932E
voor wat meer variatie) sturen ook de kaartbladen, knoppen en iconen.
Wil je de illustratie aanpassen? Pas gewoon de SVG-code in die functie
aan.
