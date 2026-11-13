# ADR-0088: Seitenübergänge wie auf dem iPhone

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude (Freigabe für Kostenloses, Alban 6.11.2026; Auftrag «Hebe meine App auf das nächste Level», 13.11.2026)

## Kontext

Rettich wechselt Seiten bisher ohne Bewegung: Der neue Inhalt steht einfach da. Auf dem iPhone zeigt eine Bewegung, wohin man geht: Eine tiefere Seite schiebt sich von rechts herein, zurück geht es nach rechts, zwischen den Tabs wird überblendet. Ohne diese Spur wirkt eine Web-App weniger wie eine App (Design nach Apple, ADR-0021).

## Entscheid

1. **View Transitions des Browsers**, keine Bibliothek. React Router startet sie, wenn eine Navigation `viewTransition` mitgibt. `app/page-transition.ts` gibt das jeder Navigation mit, statt jeden Link einzeln anzupassen, und setzt die Art auf `<html data-transition>`:
   - `forward`: tiefere Seite, von rechts herein, die alte rückt ein Stück nach links;
   - `back`: zurück zur übergeordneten Seite oder ein Schritt zurück im Verlauf, nach rechts hinaus;
   - `tab`: von Tab zu Tab, kurze Überblendung (160 ms);
   - `none`: gleiche Seite, nur ein anderer Filter, nichts bewegt sich.
2. Die Richtung beim Zurück und Vorwärts im Verlauf liest Rettich aus dem Index, den React Router in den Verlauf schreibt. Der Zuhörer dafür steht vor dem des Routers.
3. Tab-Leiste und Statusstreifen tragen eigene Namen (`view-transition-name`) und bleiben stehen; nur der Inhalt bewegt sich.
4. **Bewegung reduzieren** in den Einstellungen des Geräts schaltet alles ab: Rettich startet dann gar keinen Übergang, und das CSS setzt jede Animation auf null.

## Folgen

- Browser ohne View Transitions wechseln die Seite wie bisher. Safari kann sie seit iOS 18.
- Während eines Übergangs (gut 0,3 Sekunden) nimmt die Seite keine Taps an, auch nicht mit `pointer-events: none` auf `::view-transition` (in Chromium geprüft). Das iPhone sperrt Taps bei seinen eigenen Übergängen ebenso. Die E2E-Tests laufen darum mit «Bewegung reduzieren» (`playwright.config.ts`); `e2e/page-transitions.spec.ts` prüft die Bewegung selbst und tippt erst, wenn die Seite steht (L-35).
- Ein Wischen vom Rand zurück gibt es damit noch nicht: In der installierten App fehlt die Geste des Browsers, eine eigene wäre ein späterer Schritt.
