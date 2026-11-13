# ADR-0091: Zurückwischen vom linken Rand

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude (Freigabe für Kostenloses, Alban 6.11.2026; «Mach das, was du grad umsetzen kannst», 13.11.2026)

## Kontext

Auf dem iPhone geht man mit einem Wisch vom linken Rand eine Seite zurück. In Safari macht das der Browser. Eine auf dem Home-Bildschirm installierte Web-App hat diese Geste nicht: Wer Rettich so nutzt, muss oben links auf «‹ Mehr» tippen. Seit ADR-0088 bewegen sich die Seiten wie auf dem iPhone, die Geste dazu fehlte noch.

## Entscheid

1. **Nur in der installierten App** (`display-mode: standalone` oder `navigator.standalone`). In Safari bleibt die Geste des Browsers, zwei Gesten würden sich stören.
2. **Start nur ganz am Rand** (bis 16 px; die Listenzeilen mit ihren Wischaktionen beginnen erst dort), **nur mit einer Seite dahinter** (Position im Verlauf über 0), **nicht auf den fünf Tabs** und **nicht bei offenem Blatt**.
3. Die Seite folgt dem Finger, mit einem leichten Schatten am linken Rand. Wer weiter als 96 px wischt oder schnell schnippt, geht zurück; sonst federt die Seite zurück. Ein Wisch, der zuerst nach oben oder unten geht, bleibt ein Scrollen.
4. Beim Zurück gleitet die Seite ganz hinaus, dann geht der Verlauf einen Schritt zurück (`history.back()`). Der Übergang dieses Schritts heisst `swipe`: Die alte Seite ist schon weg, die Seite dahinter gleitet nur noch herein. Mit «Bewegung reduzieren» geht es ohne Bewegung sofort zurück.
5. Die Regeln stehen rein und getestet in `app/edge-swipe.ts`, die Geste in `app/use-edge-swipe-back.ts`.

## Folgen

- Hinter der wischenden Seite ist der Hintergrund zu sehen, nicht schon die vorherige Seite wie bei iOS: Die vorherige Seite ist in einer Web-App zu diesem Zeitpunkt nicht gezeichnet.
- Der E2E-Test täuscht die installierte App vor und wischt mit echten Touch-Ereignissen. Ein waagrechter Wisch kann in Chromium dessen eigene Zurück-Geste auslösen; der Test prüft darum, dass der Übergang `swipe` hiess, also Rettichs Geste griff.
