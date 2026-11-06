# Push-Mitteilungen

Frage Alban: «Push-Mitteilungen technisch möglich?» **Ja**, mit diesen Bedingungen (Plan, Schritt 8):

| Gerät | Geht? | Bedingung |
| --- | --- | --- |
| Android (Chrome, Firefox, Samsung) | ja | Erlaubnis nach einem Tipp |
| Desktop (Chrome, Edge, Firefox, Safari) | ja | Erlaubnis nach einem Tipp |
| iPhone und iPad (ab iOS 16.4) | ja | nur wenn FridgeAI **auf dem Home-Bildschirm installiert** ist («Teilen» → «Zum Home-Bildschirm»), danach Erlaubnis |

## Was es braucht

- **Einen kleinen Server, der zur richtigen Zeit sendet**, z. B. morgens «2 Sachen laufen heute ab». Eine Web-App kann sich nicht selbst wecken.
  - Günstig ginge das mit einem Cloudflare Worker und Zeitplan (Cron) im Gratis-Plan, VAPID-Schlüssel nur dort.
- **Daten verlassen dafür das Gerät:** mindestens «welcher Artikel läuft wann ab» pro Haushalt. Das ist ein neuer Datenfluss, also entscheidet Alban (CLAUDE.md, Regel 5). Datensparsame Variante: nur Anzahl und Datum («2 Artikel heute»), keine Namen; den Text baut die App erst beim Öffnen.

## Ohne Server (jetzt schon möglich)

- **Hinweis beim Öffnen:** «Heute retten» zeigt alles Dringende.
- **Zahl am App-Symbol** (Badging API) bei installierter App auf iPhone, Android und Desktop. Sie aktualisiert sich beim Öffnen und im Hintergrund, soweit der Browser das erlaubt.

## Ideen für Mitteilungen (use-cases P-01 bis P-08)

- Morgens: heute und morgen Ablaufendes, gebündelt, mit Ruhezeiten.
- Verbrauchsdatum (Fleisch, Fisch): einzeln und früher.
- Einfrier-Tipp: «Hackfleisch morgen fällig: heute einfrieren?»
- Wochenrückblick: gerettet in CHF.
- Notvorrat-Rotation: 3 Monate vorher (zweitrangig).
- Haushalt: «Sara hat 3 Sachen auf die Liste gesetzt» (Opt-in, nach Schritt 7).
