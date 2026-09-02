# Bouwdocument: Zorgplan

Dit document beschrijft de volledige app. Cursor bouwt de app volgens dit document.

---

## 1. Doel van de app

Zorgplan is de digitale versie van het papieren mijn-plan formulier uit de website "Hoe werkt de zorg in Vlaanderen".
De gebruiker houdt zelf bij welke hulp hij krijgt: welke zorgverleners, welke afspraken, wat er besproken is, wat hij zelf moet doen en welke vragen hij nog heeft.

De app is er voor iedereen die hulp krijgt, en ook voor ouders of voogden die dit bijhouden voor hun kind. Daarom kan de app meerdere personen bevatten.

Kernwaarden: overzichtelijk, simpel, privacyvriendelijk. De gebruiker is eigenaar van zijn gegevens.

---

## 2. Technische basis

- Gewone HTML, CSS en JavaScript. Geen framework. Geen backend. Geen database op een server.
- Alle gegevens worden bewaard in de browser (localStorage). Niets verlaat het toestel.
- Export en import via een JSON-bestand (back-up, verhuizen naar ander toestel, delen).
- Hosting via GitHub Pages. Repo: `zorgplan`.
- Mobile first. Werkt op smartphone en computer.
- Geen cookies, geen tracking, geen externe scripts.
- Alle datatoegang loopt via één aparte module `storage.js` (zie sectie 9). Nergens in de code wordt localStorage rechtstreeks aangesproken.

---

## 3. Datamodel

Eén JSON-object bevat alle gegevens. Voeg een veld `versie` toe (start: 1) zodat latere migraties mogelijk zijn.

```text
zorgplan
├── versie: 1
├── personen []
│   └── id, naam (optioneel), geboortedatum (optioneel),
│       notitie "Dit wil ik dat hulpverleners over mij weten"
├── zorgverleners []  (gedeeld tussen alle personen)
│   └── id, naam, organisatie, telefoon of e-mail, waarvoor
├── afspraken []
│   └── id, persoonId, zorgverlenerId, datum en uur, locatie
├── sessies []  ("Wat is er besproken")
│   └── id, persoonId, zorgverlenerId (optioneel), datum, vrije tekst
├── acties []  ("Wat ga ik doen")
│   └── id, persoonId, tekst, gedaan (ja/nee)
└── vragen []  ("Mijn vragen voor de volgende keer")
    └── id, persoonId, zorgverlenerId (optioneel), tekst
```

---

## 4. Pagina's

### 4.1 Overzichtspagina (home, belangrijkste scherm)

Eén scherm dat in één oogopslag antwoord geeft op: waar sta ik?

- Bovenaan: naam van de app "Zorgplan" en een korte lijn: "Jouw gegevens blijven op dit toestel. Er wordt niets online bewaard."
- Per persoon een kaart met:
  - Naam (of "Mijn plan" als er geen naam is ingevuld)
  - De eerstvolgende afspraak (datum, uur, bij wie)
  - Aantal openstaande acties
  - Aantal openstaande vragen
  - Knop: open het plan van deze persoon
- Knop "Nieuwe persoon toevoegen"
- Knoppen "Exporteer" en "Importeer"
- Link naar de lijst met zorgverleners

Lege toestand (eerste bezoek): vriendelijke uitleg in 3 korte zinnen plus een grote knop "Maak je eerste plan".

### 4.2 Persoonspagina

Per persoon één pagina met dezelfde onderdelen als het papieren formulier:

1. Over mij: naam (optioneel), geboortedatum (optioneel), vrije notitie
2. Mijn hulpverleners: kies uit de gedeelde lijst of voeg nieuwe toe
3. Mijn afspraken: lijst, gesorteerd op datum, met toevoegen en afvinken
4. Wat is er besproken: notities per sessie met datum
5. Wat ga ik doen: actielijst met vinkjes
6. Mijn vragen voor de volgende keer
7. Knop "Print dit plan" (zie sectie 6)

### 4.3 Zorgverlenerspagina

- Lijst van alle zorgverleners met naam, organisatie, contact en waarvoor
- Toevoegen, bewerken, verwijderen (met waarschuwing als er nog afspraken aan hangen)
- Per zorgverlener zichtbaar: bij welke personen hoort deze

### 4.4 Gegevenspagina (export, import, wissen)

- Exporteer: download één JSON-bestand met alles
- Importeer: kies een bestand, dan keuze "vervang alles" of "voeg toe"
- Wis alles: met duidelijke dubbele bevestiging
- Privacytekst (letterlijk overnemen, zie sectie 7)

---

## 5. Overzichtspagina: extra eisen

De gebruiker koos expliciet voor een sterk overzicht. Daarom:

- Geen menu's of diepe navigatie nodig om het overzicht te zien. Home = overzicht.
- De eerstvolgende afspraak over alle personen heen staat bovenaan als eigen blok: "Volgende afspraak".
- Openstaande acties en vragen tellen live mee.
- Alles is klikbaar en leidt direct naar de juiste plek.

---

## 6. Printen en delen

- "Print dit plan" opent een printvriendelijke weergave van één persoon, met dezelfde indeling als het papieren formulier, en gebruikt `window.print()`.
- Print-CSS voor A4, 1 à 2 pagina's.
- Onderaan elke print, kleine tekst: "Dit plan is van mij. Ik bepaal zelf wie dit ziet."
- Bij exporteren toon je deze waarschuwing (letterlijk): "Dit bestand bevat persoonlijke gegevens. Deel het enkel met mensen die je vertrouwt."

---

## 7. Privacyteksten (letterlijk overnemen)

Op de overzichtspagina:
"Jouw gegevens blijven op dit toestel. Er wordt niets online bewaard."

Op de gegevenspagina:
"Zorgplan bewaart alles alleen in de browser van dit toestel. Er is geen account en geen server. Let op: als je de browsergegevens wist, verdwijnen je plannen. Maak daarom regelmatig een export als back-up."

---

## 8. Ontwerp en toegankelijkheid

Dezelfde rustige stijl als "Hoe werkt de zorg in Vlaanderen", zodat beide sites bij elkaar passen:

- Grote knoppen (minstens 48 px), weinig keuzes per scherm
- Korte zinnen, duidelijke koppen
- Goed leesbaar systeemlettertype, minstens 18 px
- Rustige kleuren, hoog contrast (WCAG AA)
- Mobile first, duidelijke focus-stijlen
- Geen animaties, pop-ups of banners

---

## 9. Voorbereid op later (belangrijk)

De app moet later kunnen groeien naar een online versie met accounts. Daarom:

- Alle lees- en schrijfacties lopen via `storage.js` met duidelijke functies zoals `loadData()`, `saveData()`, `exportJSON()`, `importJSON()`.
- De rest van de app kent localStorage niet.
- Het datamodel heeft een `versie`-veld.
- Deze structuur maakt het later mogelijk om `storage.js` te vervangen door een online opslag zonder de app te herschrijven.

---

## 10. Buiten scope (niet bouwen in deze versie)

- Geen accounts, login of server
- Geen portaal voor hulpverleners
- Geen herinneringen of meldingen
- Geen koppeling met andere systemen of API's
- Geen meertaligheid

---

## 11. Koppeling met "Hoe werkt de zorg in Vlaanderen"

- Onderaan de overzichtspagina: link "Nog geen idee waar je moet zijn? Bezoek Hoe werkt de zorg in Vlaanderen" naar https://wouterdirven.github.io/hoe-werkt-de-zorg-in-vlaanderen/
- Later (aparte kleine taak in de andere repo): op de pagina mijn-plan.html een knop "Liever digitaal? Gebruik Zorgplan" die naar deze app linkt.

---

## 12. Acceptatiecriteria

- De app werkt volledig offline na het eerste laden.
- Een nieuwe gebruiker maakt binnen 1 minuut een persoon en een eerste afspraak aan.
- De overzichtspagina toont zonder scrollen op een smartphone: volgende afspraak, open acties en open vragen per persoon.
- Export en import werken: exporteren, alles wissen, importeren, alles staat terug.
- De printweergave past op 1 à 2 A4-pagina's.
- De app verstuurt geen enkele data naar het internet.
- Geen console-errors.
