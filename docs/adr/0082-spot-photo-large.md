# ADR-0082: Das Foto eines Platzes gross zeigen

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude, auf Albans Wunsch («Man kann durch Longpress das Foto grösser anzeigen lassen, aber niemand kommt drauf», 13.11.2026)

## Kontext

Ein Platz mit Foto (ADR-0056) zeigte sein Foto auf der Artikelseite und im Fenster «Wo liegt das?» nur als kleines Quadrat. Grösser ging es nur über das lange Drücken des Browsers, das kaum jemand kennt.

## Entscheid

1. **Im Fenster «Wo liegt das?» steht das Foto des aktuellen Platzes gross und mittig** über der Liste der Plätze (4:3, höchstens 40 % der Bildschirmhöhe).
2. **Ein Tipp öffnet es über den ganzen Bildschirm** (`PhotoViewer`): schwarzer Grund, das ganze Foto in der Mitte, oben der Name und «Schliessen». Escape, «Schliessen» oder ein Tipp neben das Foto schliessen es, das Fenster darunter bleibt offen. Danach steht der Fokus wieder auf dem Foto.
3. **Ein kleines Symbol unten rechts** (zwei Pfeile nach aussen) zeigt, dass das Foto wachsen kann (`ZoomablePhoto`).
4. Dasselbe gilt für das grosse Foto auf der Seite eines Platzes unter «Wo ist was?».
5. Vollbild und das Fenster «Wo liegt das?» liegen direkt im `body` (Portal), damit die Tab-Leiste sie nicht verdeckt.

## Folgen

- Das Foto ist ohne Geheimgeste erreichbar, auch mit Tastatur und Screenreader («Foto «Oben» gross anzeigen»).
- Die übrigen Fenster (Einfrieren, Ändern, Töpfe, Packung, «Im Blick») liegen noch unter der Tab-Leiste; sie bekommen das Portal in einem eigenen Schritt.
