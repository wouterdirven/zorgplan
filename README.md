# Zorgplan

Lokale app om je eigen zorg en hulpverleners bij te houden. Zonder account. Je gegevens blijven op je toestel.

Dit is de digitale versie van het papieren *mijn-plan* formulier van [Hoe werkt de zorg in Vlaanderen](https://wouterdirven.github.io/hoe-werkt-de-zorg-in-vlaanderen/).

Zorgplan is **geen medisch dossier** en **geen officiële overheidsapp**.

## Wat kun je doen

- Plannen bijhouden voor jezelf, je kind of iemand waarvoor je voogd bent
- Hulpverleners, afspraken, gespreksnotities, acties en vragen noteren
- Een printvriendelijk plan meenemen naar een afspraak
- Alles exporteren of importeren als JSON-bestand

## Privacy

Zorgplan bewaart alles alleen in de browser van dit toestel. Er is geen account en geen server. Let op: als je de browsergegevens wist, verdwijnen je plannen. Maak daarom regelmatig een export als back-up.

Op iPhone of iPad: zet de app op het beginscherm. Dan blijven de gegevens beter bewaard.

## Publiek zetten (GitHub Pages)

1. Merge deze code naar `main`.
2. Zet Pages aan via **Settings → Pages → Deploy from a branch**.
3. Kies branch `main` en map `/ (root)`.
4. Vul bij **About** de homepage in:

https://wouterdirven.github.io/zorgplan/

Daarna werkt de app offline na het eerste bezoek.

## Koppeling met de andere site

Op `mijn-plan.html` van [hoe-werkt-de-zorg-in-vlaanderen](https://github.com/wouterdirven/hoe-werkt-de-zorg-in-vlaanderen) kan deze knop:

```html
<a class="btn btn-secondary" href="https://wouterdirven.github.io/zorgplan/">Liever digitaal? Gebruik Zorgplan</a>
```

Zet Pages ook aan in die repository, anders werkt de link vanuit Zorgplan niet.

## Lokaal openen

De app is gewone HTML, CSS en JavaScript. Geen installatie.

```bash
python3 -m http.server 8080
```

Open daarna http://localhost:8080

Opslagtests:

```bash
node tests/storage.test.js
```

## Bouwdocument

De volledige specificatie staat in `bouwdocument.md`.
