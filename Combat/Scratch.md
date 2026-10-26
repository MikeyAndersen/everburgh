---
type: combat-scratch
---

# Combat

> [!tip] Hvis blokken nedenfor fejler
> Kør kampen på `_dm/RUNSHEET Planar Anchor.md` i stedet — alle AC og HP står i tabellen
> øverst der. Trackeren er en bekvemmelighed, ikke en afhængighed.

```dataviewjs
await dv.view("_scripts/tracker")
```

## Sådan bruges den

- **Add** henter automatisk `ac` og `hp` fra frontmatter i `Bestiary/` og `PCs/`.
  Skriv navn eller alias. `×n` tilføjer flere med nummer.
- PC'er viser kun AC — spillerne sporer selv HP og death saves, jf. `_dm/HOUSERULES.md`.
- **dmg-feltet:** skriv skade, tryk Enter. Temp HP trækkes automatisk fra først.
- **Next turn** flytter markøren. Ved rundeskift tælles alle countere med `±/round`.
- **Anchor Charge** ligger allerede som counter på 8 med **+1/round**.
  Når [[Merith Lonehunter]] propper: sæt `±/round` til 0 ved at slette counteren og
  tilføje den igen uden regen — eller bare korriger manuelt med **−**. Manuelt er hurtigere.
- **Archive** skriver kampen til `Encounters/`.

Kampen er forudfyldt i `Combat/State.md`. Rul initiative, skriv dem ind, tryk **Start**.
