# Zorgplan

Lokale app om je eigen zorg en hulpverleners bij te houden. Zonder account. Je gegevens blijven op je toestel.

Dit is de digitale versie van het papieren *mijn-plan* formulier van [Hoe werkt de zorg in Vlaanderen](https://wouterdirven.github.io/hoe-werkt-de-zorg-in-vlaanderen/).

## Wat kun je doen

- Plannen bijhouden voor jezelf, je kind of iemand waarvoor je voogd bent
- Hulpverleners, afspraken, gespreksnotities, acties en vragen noteren
- Een printvriendelijk plan meenemen naar een afspraak
- Alles exporteren of importeren als JSON-bestand

## Privacy

Zorgplan bewaart alles alleen in de browser van dit toestel. Er is geen account en geen server. Let op: als je de browsergegevens wist, verdwijnen je plannen. Maak daarom regelmatig een export als back-up.

## Lokaal openen

De app is gewone HTML, CSS en JavaScript. Geen installatie.

```bash
python3 -m http.server 8080
```

Open daarna http://localhost:8080

## GitHub Pages

Zet Pages aan via **Settings → Pages → Deploy from a branch** en kies `main` met map `/ (root)`. De app staat dan op:

https://wouterdirven.github.io/zorgplan/

## Bouwdocument

De volledige specificatie staat in `bouwdocument.md`.
