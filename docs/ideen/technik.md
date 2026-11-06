# Technik und Betrieb

Ideen für Stabilität und Betrieb, die nicht direkt sichtbar sind. Noch nicht beschlossen.

## 404 für fehlende Dateien unter `/assets/`

- **Beobachtung:** Cloudflare liefert für jede unbekannte Adresse `index.html` aus (SPA-Fallback), auch für alte JavaScript-Dateien nach einem Update. Der Browser meldet dann «'text/html' is not a valid JavaScript MIME type». #71 fängt das ab und lädt einmal neu.
- **Idee:** Ein kleines Worker-Skript gibt für `/assets/*`, das es nicht gibt, ein echtes 404 zurück. Die Fehlermeldung wird eindeutig, und der Service Worker speichert keine falsche Antwort.
- **Aufwand:** S. **Kosten:** keine im Gratis-Plan (Worker-Aufrufe nur für fehlende Dateien).

## Fehlerberichte ohne Personendaten

- **Nutzen:** Abstürze im Pilot früh sehen, ohne auf Screenshots zu warten.
- **Idee:** Eigene, minimale Fehlermeldung an einen Cloudflare Worker: Seite, Fehlertext, App-Version. Keine Artikel, keine IDs, keine IP-Adresse speichern.
- **Braucht:** neuen Datenfluss vom Gerät weg, deshalb entscheidet Alban (CLAUDE.md, Punkt 5). Opt-in auf «Haushalt».
- **Aufwand:** M.

## Lighthouse und Bundle-Grösse in der CI

- **Nutzen:** Merken, wenn die App langsamer oder grösser wird, bevor es Pilot-Nutzer:innen merken.
- **Aufwand:** S. Kostenlos (GitHub Actions).
