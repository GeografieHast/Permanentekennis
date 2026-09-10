/* ==========================================================================
   Permanente Kennis — data.js
   Alle leerinhoud uit de twee referentiebundels van Meneer Schaeken:
   - Permanente Kennis (2025): België & de Europese Unie
   - Permanente Kennis (eerste graad): Wereld & Europa

   Bewust weggelaten, in overleg met de leerkracht: inwonersaantallen en
   vlaggen. Leerlingen moeten die niet kennen — dus staan ze hier niet in.
   ========================================================================== */

window.PK_DATA = {
  modules: [
    /* ======================================================================
       MODULE 1 — Wereld & Europa (eerste graad)
       ====================================================================== */
    {
      id: "wereld-europa",
      label: "Kaartblad 1",
      title: "Wereld & Europa",
      subtitle: "eerste graad",
      intro: "De basiskennis over de werelddelen, oceanen en de landen van Europa.",
      topics: [
        {
          id: "eu-lidstaten",
          title: "EU-lidstaten en hoofdsteden",
          kind: "pair",
          promptLabel: "Lidstaat",
          answerLabel: "Hoofdstad",
          allowTyping: true,
          items: [
            { term: "België", answer: "Brussel" },
            { term: "Bulgarije", answer: "Sofia" },
            { term: "Cyprus", answer: "Nicosia" },
            { term: "Denemarken", answer: "Kopenhagen" },
            { term: "Duitsland", answer: "Berlijn" },
            { term: "Estland", answer: "Tallinn" },
            { term: "Finland", answer: "Helsinki" },
            { term: "Frankrijk", answer: "Parijs" },
            { term: "Griekenland", answer: "Athene" },
            { term: "Hongarije", answer: "Boedapest" },
            { term: "Ierland", answer: "Dublin" },
            { term: "Italië", answer: "Rome" },
            { term: "Letland", answer: "Riga" },
            { term: "Litouwen", answer: "Vilnius" },
            { term: "Luxemburg", answer: "Luxemburg" },
            { term: "Malta", answer: "Valletta" },
            { term: "Nederland", answer: "Amsterdam" },
            { term: "Oostenrijk", answer: "Wenen" },
            { term: "Polen", answer: "Warschau" },
            { term: "Portugal", answer: "Lissabon" },
            { term: "Roemenië", answer: "Boekarest" },
            { term: "Slovenië", answer: "Ljubljana" },
            { term: "Slowakije", answer: "Bratislava" },
            { term: "Spanje", answer: "Madrid" },
            { term: "Tsjechië", answer: "Praag" },
            { term: "Zweden", answer: "Stockholm" },
            { term: "Kroatië", answer: "Zagreb" }
          ]
        },
        {
          id: "kandidaat-lidstaten",
          title: "Kandidaat-lidstaten en hoofdsteden",
          kind: "pair",
          promptLabel: "Kandidaat-lidstaat",
          answerLabel: "Hoofdstad",
          allowTyping: true,
          items: [
            { term: "Turkije", answer: "Ankara" },
            { term: "Noord-Macedonië", answer: "Skopje" },
            { term: "Albanië", answer: "Tirana" },
            { term: "Bosnië en Herzegovina", answer: "Sarajevo" },
            { term: "Georgië", answer: "Tbilisi" },
            { term: "Moldavië", answer: "Chisinau" },
            { term: "Montenegro", answer: "Podgorica" },
            { term: "Oekraïne", answer: "Kiev" },
            { term: "Servië", answer: "Belgrado" }
          ]
        },
        {
          id: "andere-landen-europa",
          title: "Andere landen in Europa en hoofdsteden",
          kind: "pair",
          promptLabel: "Land",
          answerLabel: "Hoofdstad",
          allowTyping: true,
          items: [
            { term: "Verenigd Koninkrijk", answer: "Londen" },
            { term: "IJsland", answer: "Reykjavik" },
            { term: "Andorra", answer: "Andorra la Vella" },
            { term: "Armenië", answer: "Jerevan" },
            { term: "Azerbeidzjan", answer: "Bakoe" },
            { term: "Kosovo", answer: "Pristina" },
            { term: "Liechtenstein", answer: "Vaduz" },
            { term: "Monaco", answer: "Monaco" },
            { term: "Noorwegen", answer: "Oslo" },
            { term: "Rusland", answer: "Moskou" },
            { term: "San Marino", answer: "San Marino" },
            { term: "Staat Vaticaanstad", answer: "Vaticaanstad" },
            { term: "Wit-Rusland (Belarus)", answer: "Minsk" },
            { term: "Zwitserland", answer: "Bern" }
          ]
        },
        {
          id: "europa-alle-hoofdsteden",
          title: "Europa en hoofdsteden (alle 50 landen)",
          kind: "pair",
          promptLabel: "Land",
          answerLabel: "Hoofdstad",
          allowTyping: true,
          items: [
            { term: "België", answer: "Brussel" },
            { term: "Bulgarije", answer: "Sofia" },
            { term: "Cyprus", answer: "Nicosia" },
            { term: "Denemarken", answer: "Kopenhagen" },
            { term: "Duitsland", answer: "Berlijn" },
            { term: "Estland", answer: "Tallinn" },
            { term: "Finland", answer: "Helsinki" },
            { term: "Frankrijk", answer: "Parijs" },
            { term: "Griekenland", answer: "Athene" },
            { term: "Hongarije", answer: "Boedapest" },
            { term: "Ierland", answer: "Dublin" },
            { term: "Italië", answer: "Rome" },
            { term: "Letland", answer: "Riga" },
            { term: "Litouwen", answer: "Vilnius" },
            { term: "Luxemburg", answer: "Luxemburg" },
            { term: "Malta", answer: "Valletta" },
            { term: "Nederland", answer: "Amsterdam" },
            { term: "Oostenrijk", answer: "Wenen" },
            { term: "Polen", answer: "Warschau" },
            { term: "Portugal", answer: "Lissabon" },
            { term: "Roemenië", answer: "Boekarest" },
            { term: "Slovenië", answer: "Ljubljana" },
            { term: "Slowakije", answer: "Bratislava" },
            { term: "Spanje", answer: "Madrid" },
            { term: "Tsjechië", answer: "Praag" },
            { term: "Zweden", answer: "Stockholm" },
            { term: "Kroatië", answer: "Zagreb" },
            { term: "Turkije", answer: "Ankara" },
            { term: "Noord-Macedonië", answer: "Skopje" },
            { term: "Albanië", answer: "Tirana" },
            { term: "Bosnië en Herzegovina", answer: "Sarajevo" },
            { term: "Georgië", answer: "Tbilisi" },
            { term: "Moldavië", answer: "Chisinau" },
            { term: "Montenegro", answer: "Podgorica" },
            { term: "Oekraïne", answer: "Kiev" },
            { term: "Servië", answer: "Belgrado" },
            { term: "Verenigd Koninkrijk", answer: "Londen" },
            { term: "IJsland", answer: "Reykjavik" },
            { term: "Andorra", answer: "Andorra la Vella" },
            { term: "Armenië", answer: "Jerevan" },
            { term: "Azerbeidzjan", answer: "Bakoe" },
            { term: "Kosovo", answer: "Pristina" },
            { term: "Liechtenstein", answer: "Vaduz" },
            { term: "Monaco", answer: "Monaco" },
            { term: "Noorwegen", answer: "Oslo" },
            { term: "Rusland", answer: "Moskou" },
            { term: "San Marino", answer: "San Marino" },
            { term: "Staat Vaticaanstad", answer: "Vaticaanstad" },
            { term: "Wit-Rusland (Belarus)", answer: "Minsk" },
            { term: "Zwitserland", answer: "Bern" }
          ]
        },
        {
          id: "europa-water-relief",
          title: "Europa: zeeën, oceanen, rivieren en gebergtes",
          kind: "category",
          categoryLabel: "Soort",
          categories: ["Zee of oceaan", "Rivier", "Gebergte"],
          items: [
            { term: "Atlantische Oceaan", category: "Zee of oceaan" },
            { term: "Middellandse Zee", category: "Zee of oceaan" },
            { term: "Noordzee", category: "Zee of oceaan" },
            { term: "Zwarte Zee", category: "Zee of oceaan" },
            { term: "Kaspische Zee", category: "Zee of oceaan" },
            { term: "Noordelijke IJszee", category: "Zee of oceaan" },
            { term: "Barentszzee", category: "Zee of oceaan" },
            { term: "Oostzee", category: "Zee of oceaan" },
            { term: "Taag", category: "Rivier" },
            { term: "Seine", category: "Rivier" },
            { term: "Schelde", category: "Rivier" },
            { term: "Maas", category: "Rivier" },
            { term: "Rijn", category: "Rivier" },
            { term: "Donau", category: "Rivier" },
            { term: "Wolga", category: "Rivier" },
            { term: "Theems", category: "Rivier" },
            { term: "Po", category: "Rivier" },
            { term: "Pyreneeën", category: "Gebergte" },
            { term: "Kaukasus", category: "Gebergte" },
            { term: "Oeral", category: "Gebergte" },
            { term: "Scandinavisch hoogland", category: "Gebergte" },
            { term: "Alpen", category: "Gebergte" }
          ]
        },
        {
          id: "wereld-definities",
          title: "Kernbegrippen: continent, werelddeel, oceaan, zee",
          kind: "pair",
          promptLabel: "Begrip",
          answerLabel: "Definitie",
          allowTyping: false,
          items: [
            { term: "Continent", answer: "Een aaneengesloten landoppervlak, zonder eilanden." },
            { term: "Werelddeel", answer: "Het continent met de eilanden eromheen." },
            { term: "Oceaan", answer: "Een grote wereldzee tussen de continenten, die meerdere kleine zeeën kan bevatten." },
            { term: "Zee", answer: "Een deel van het zoutwateroppervlak van de aarde dat gedeeltelijk omsloten wordt door land en meestal een kleinere oppervlakte heeft dan een oceaan." }
          ]
        },
        {
          id: "wereld-indeling",
          title: "De wereld: continenten, werelddelen, oceanen en zeeën",
          kind: "category",
          categoryLabel: "Soort",
          categories: ["Continent", "Werelddeel", "Oceaan of zee"],
          items: [
            { term: "Amerika", category: "Continent" },
            { term: "Eurazië", category: "Continent" },
            { term: "Afrika", category: "Continent" },
            { term: "Antarctica", category: "Continent" },
            { term: "Australië", category: "Continent" },
            { term: "Noord-Amerika", category: "Werelddeel" },
            { term: "Midden-Amerika/Centraal-Amerika", category: "Werelddeel" },
            { term: "Zuid-Amerika", category: "Werelddeel" },
            { term: "Europa", category: "Werelddeel" },
            { term: "Afrika (werelddeel)", category: "Werelddeel" },
            { term: "Azië", category: "Werelddeel" },
            { term: "Oceanië", category: "Werelddeel" },
            { term: "Antarctica (werelddeel)", category: "Werelddeel" },
            { term: "Grote of Stille Oceaan", category: "Oceaan of zee" },
            { term: "Atlantische Oceaan (wereld)", category: "Oceaan of zee" },
            { term: "Indische Oceaan", category: "Oceaan of zee" },
            { term: "Zuidelijke Oceaan", category: "Oceaan of zee" },
            { term: "Noordelijke IJszee (wereld)", category: "Oceaan of zee" }
          ]
        },
        {
          id: "wereld-landen-steden",
          title: "De wereld: landen en steden om te kennen",
          kind: "category",
          categoryLabel: "Soort",
          categories: ["Land", "Stad"],
          allowTyping: true,
          allowTypingCategoryOnly: true,
          items: [
            { term: "Canada", category: "Land" },
            { term: "Verenigde Staten (VS)", category: "Land" },
            { term: "Mexico", category: "Land" },
            { term: "Brazilië", category: "Land" },
            { term: "Zuid-Afrika", category: "Land" },
            { term: "Argentinië", category: "Land" },
            { term: "Democratische Republiek Congo", category: "Land" },
            { term: "Nigeria", category: "Land" },
            { term: "Libië", category: "Land" },
            { term: "Egypte", category: "Land" },
            { term: "Turkije (wereldkaart)", category: "Land" },
            { term: "Saudi-Arabië", category: "Land" },
            { term: "Iran", category: "Land" },
            { term: "India", category: "Land" },
            { term: "China", category: "Land" },
            { term: "Indonesië", category: "Land" },
            { term: "Nieuw-Zeeland", category: "Land" },
            { term: "Japan", category: "Land" },
            { term: "Rusland (wereldkaart)", category: "Land" },
            { term: "Israël", category: "Land" },
            { term: "Marokko", category: "Land" },
            { term: "San Francisco", category: "Stad" },
            { term: "Los Angeles (LA)", category: "Stad" },
            { term: "New York", category: "Stad" },
            { term: "Washington", category: "Stad" },
            { term: "Mexico City", category: "Stad" },
            { term: "Brasilia", category: "Stad" },
            { term: "Rio de Janeiro", category: "Stad" },
            { term: "Kaapstad", category: "Stad" },
            { term: "Kinshasa", category: "Stad" },
            { term: "Caïro", category: "Stad" },
            { term: "Moskou", category: "Stad" },
            { term: "New Delhi", category: "Stad" },
            { term: "Mumbai", category: "Stad" },
            { term: "Beijing (Peking)", category: "Stad" },
            { term: "Tokio", category: "Stad" },
            { term: "Sydney", category: "Stad" },
            { term: "Canberra", category: "Stad" },
            { term: "Teheran", category: "Stad" },
            { term: "Dubai", category: "Stad" },
            { term: "Riyad", category: "Stad" },
            { term: "Tripoli", category: "Stad" }
          ]
        },
        {
          id: "wereld-relief",
          title: "De wereld: reliëf, rivieren en zeeën",
          kind: "category",
          categoryLabel: "Soort",
          categories: ["Reliëfgebied", "Rivier", "Zee"],
          items: [
            { term: "Rocky Mountains", category: "Reliëfgebied" },
            { term: "Andesgebergte", category: "Reliëfgebied" },
            { term: "Atlasgebergte", category: "Reliëfgebied" },
            { term: "Himalaya", category: "Reliëfgebied" },
            { term: "Australische Alpen", category: "Reliëfgebied" },
            { term: "Great Plains", category: "Reliëfgebied" },
            { term: "Dekanplateau", category: "Reliëfgebied" },
            { term: "Mississippivlakte", category: "Reliëfgebied" },
            { term: "Amazonevlakte", category: "Reliëfgebied" },
            { term: "Mississippi", category: "Rivier" },
            { term: "Amazone", category: "Rivier" },
            { term: "Nijl", category: "Rivier" },
            { term: "Indus", category: "Rivier" },
            { term: "Ganges", category: "Rivier" },
            { term: "Gele rivier", category: "Rivier" },
            { term: "Blauwe rivier", category: "Rivier" },
            { term: "Middellandse Zee (wereldkaart)", category: "Zee" },
            { term: "Noordzee (wereldkaart)", category: "Zee" },
            { term: "Zwarte Zee (wereldkaart)", category: "Zee" },
            { term: "Kaspische Zee (wereldkaart)", category: "Zee" }
          ]
        }
      ]
    },

    /* ======================================================================
       MODULE 2 — België & de Europese Unie (2025)
       ====================================================================== */
    {
      id: "belgie-eu",
      label: "Kaartblad 2",
      title: "België & de Europese Unie",
      subtitle: "2025",
      intro: "Provincies, gewesten, buurlanden, rivieren en autowegen van België, en de 27 EU-lidstaten.",
      topics: [
        {
          id: "provincies",
          title: "De 10 provincies en hun hoofdstad",
          kind: "pair",
          promptLabel: "Provincie",
          answerLabel: "Provinciehoofdstad",
          allowTyping: true,
          items: [
            { term: "West-Vlaanderen", answer: "Brugge" },
            { term: "Oost-Vlaanderen", answer: "Gent" },
            { term: "Antwerpen", answer: "Antwerpen" },
            { term: "Limburg", answer: "Hasselt" },
            { term: "Vlaams-Brabant", answer: "Leuven" },
            { term: "Waals-Brabant", answer: "Waver" },
            { term: "Henegouwen", answer: "Bergen" },
            { term: "Namen", answer: "Namen" },
            { term: "Luik", answer: "Luik" },
            { term: "Luxemburg (provincie)", answer: "Aarlen" }
          ]
        },
        {
          id: "gewesten-gemeenschappen",
          title: "Gewesten en gemeenschappen van België",
          kind: "category",
          categoryLabel: "Gewest of gemeenschap?",
          categories: ["Gewest", "Gemeenschap"],
          items: [
            { term: "Vlaams Gewest", category: "Gewest" },
            { term: "Waals Gewest", category: "Gewest" },
            { term: "Brussels Hoofdstedelijk Gewest", category: "Gewest" },
            { term: "Vlaamse Gemeenschap", category: "Gemeenschap" },
            { term: "Franse Gemeenschap", category: "Gemeenschap" },
            { term: "Duitstalige Gemeenschap (Oostkantons, rond Eupen)", category: "Gemeenschap" }
          ]
        },
        {
          id: "buurlanden",
          title: "De buurlanden van België",
          kind: "pair",
          promptLabel: "Buurland",
          answerLabel: "Ligt ten ...",
          allowTyping: true,
          items: [
            { term: "Nederland", answer: "Noorden van België" },
            { term: "Duitsland", answer: "Oosten van België" },
            { term: "Luxemburg (land)", answer: "Zuidoosten van België" },
            { term: "Frankrijk", answer: "Zuiden/Zuidwesten van België" }
          ]
        },
        {
          id: "rivieren-belgie",
          title: "Belangrijke rivieren in België",
          kind: "pair",
          promptLabel: "Rivier",
          answerLabel: "Waar?",
          allowTyping: false,
          items: [
            { term: "IJzer", answer: "West-Vlaanderen, mondt uit in Nieuwpoort" },
            { term: "Leie", answer: "West- en Oost-Vlaanderen, komt samen met de Schelde in Gent" },
            { term: "Schelde (België)", answer: "Van Henegouwen tot Antwerpen, mondt uit in Nederland" },
            { term: "Demer", answer: "Stroomt onder andere door Diest, Aarschot en Hasselt en mondt uit in de Dijle" },
            { term: "Samber", answer: "Henegouwen, mondt uit in de Maas in Namen" },
            { term: "Maas (België)", answer: "Van Namen over Luik naar Limburg/Nederland" },
            { term: "Ourthe", answer: "Provincie Luxemburg en Luik, mondt uit in de Maas in Luik" }
          ]
        },
        {
          id: "autowegen-belgie",
          title: "Belangrijkste autowegen in België",
          kind: "pair",
          promptLabel: "Autoweg",
          answerLabel: "Verbindt ...",
          allowTyping: false,
          items: [
            { term: "E17", answer: "Loopt vanaf de Nederlandse grens bij Antwerpen via Gent en Kortrijk naar de Franse grens." },
            { term: "E40", answer: "De langste snelweg van het land (280 km). Loopt van de kust (Oostende/De Panne) via Brugge, Gent, Brussel en Leuven naar Luik en de Duitse grens." },
            { term: "E19", answer: "Verbindt de Nederlandse grens (Breda) via Antwerpen en Brussel met Bergen (Mons) en de Franse grens." },
            { term: "E411", answer: "Vormt de verbinding tussen Brussel, Namen en Aarlen (Luxemburg)." },
            { term: "E313", answer: "Verbindt Antwerpen met Hasselt en Luik." }
          ]
        },
        {
          id: "eu-lidstaten-2",
          title: "De 27 EU-lidstaten en hoofdsteden",
          kind: "pair",
          promptLabel: "Lidstaat",
          answerLabel: "Hoofdstad",
          allowTyping: true,
          items: [
            { term: "België (EU)", answer: "Brussel" },
            { term: "Bulgarije (EU)", answer: "Sofia" },
            { term: "Cyprus (EU)", answer: "Nicosia" },
            { term: "Denemarken (EU)", answer: "Kopenhagen" },
            { term: "Duitsland (EU)", answer: "Berlijn" },
            { term: "Estland (EU)", answer: "Tallinn" },
            { term: "Finland (EU)", answer: "Helsinki" },
            { term: "Frankrijk (EU)", answer: "Parijs" },
            { term: "Griekenland (EU)", answer: "Athene" },
            { term: "Hongarije (EU)", answer: "Boedapest" },
            { term: "Ierland (EU)", answer: "Dublin" },
            { term: "Italië (EU)", answer: "Rome" },
            { term: "Letland (EU)", answer: "Riga" },
            { term: "Litouwen (EU)", answer: "Vilnius" },
            { term: "Luxemburg (EU)", answer: "Luxemburg" },
            { term: "Malta (EU)", answer: "Valletta" },
            { term: "Nederland (EU)", answer: "Amsterdam" },
            { term: "Oostenrijk (EU)", answer: "Wenen" },
            { term: "Polen (EU)", answer: "Warschau" },
            { term: "Portugal (EU)", answer: "Lissabon" },
            { term: "Roemenië (EU)", answer: "Boekarest" },
            { term: "Slovenië (EU)", answer: "Ljubljana" },
            { term: "Slowakije (EU)", answer: "Bratislava" },
            { term: "Spanje (EU)", answer: "Madrid" },
            { term: "Tsjechië (EU)", answer: "Praag" },
            { term: "Zweden (EU)", answer: "Stockholm" },
            { term: "Kroatië (EU)", answer: "Zagreb" }
          ]
        },
        {
          id: "eu-rivieren",
          title: "Enkele belangrijke rivieren van de EU",
          kind: "pair",
          promptLabel: "Rivier",
          answerLabel: "Waar?",
          allowTyping: false,
          items: [
            { term: "Rijn", answer: "Zwitserland, Duitsland, Nederland" },
            { term: "Donau", answer: "Duitsland, Oostenrijk, Slowakije, Hongarije, Kroatië, Roemenië, Bulgarije" },
            { term: "Seine", answer: "Frankrijk (door Parijs)" },
            { term: "Schelde (EU)", answer: "Frankrijk, België, Nederland" },
            { term: "Maas (EU)", answer: "Frankrijk, België, Nederland" }
          ]
        },
        {
          id: "eu-gebergtes",
          title: "Enkele belangrijke gebergtes van de EU",
          kind: "pair",
          promptLabel: "Gebergte",
          answerLabel: "Waar?",
          allowTyping: false,
          items: [
            { term: "Pyreneeën (EU)", answer: "Grens tussen Frankrijk en Spanje" },
            { term: "Alpen (EU)", answer: "Frankrijk, Italië, Zwitserland, Oostenrijk, Slovenië" },
            { term: "Oeral (EU)", answer: "Natuurlijke grens tussen werelddeel Europa en werelddeel Azië" },
            { term: "Scandinavisch hoogland (EU)", answer: "Noorden van Europa, in Scandinavië" }
          ]
        },
        {
          id: "hasselt-referentie",
          title: "Referentiekaart Hasselt en omgeving",
          kind: "category",
          categoryLabel: "Soort",
          categories: ["Rivier", "Snelweg", "Kanaal"],
          note: "Dit onderdeel is nog onvolledig: de omliggende gemeenten op de referentiekaart (de stippen bij Al, Bi, Di, Ge, Hc, Ko, Lu en Zo) staan er nog niet bij.",
          items: [
            { term: "Demer", category: "Rivier" },
            { term: "Herk", category: "Rivier" },
            { term: "E313", category: "Snelweg" },
            { term: "E314", category: "Snelweg" },
            { term: "A2", category: "Snelweg" },
            { term: "Albertkanaal", category: "Kanaal" }
          ]
        }
      ]
    }
  ]
};
