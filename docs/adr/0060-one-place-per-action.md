# ADR-0060: Eine Stelle pro Aktion im Auswahlmodus

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Alban (Rückmeldung), Claude (Umsetzung)

## Kontext

Alban (12.11.2026, mit Bildschirmfoto aus dem Tiefkühler): «Drag and Drop funktioniert nicht und macht keinen Sinn, oben als auch unten dieselbe Funktion zu haben.» Im Auswahlmodus zeigte der Vorrat oben die Lagerort-Tabs (Ziel zum Ziehen) und unten eine schwebende Leiste «Verschieben nach» mit denselben Lagerorten (Ziel zum Antippen). Zwei Stellen für dieselbe Sache, und auf dem iPhone kam das Ziehen gar nicht an.

## Entscheid

1. **Die Tabs werden zu «Verschieben nach».** Sobald mindestens ein Artikel gewählt ist, steht an der Stelle der Tabs dieselbe Reihe mit den vier Lagerorten: der eigene ist grau und sagt «hier», die drei anderen tragen Symbol und Akzentfarbe. Antippen und Ziehen treffen dieselben Knöpfe (`MoveTargets`, `data-drop-target`). Ist nichts gewählt, sind es wieder Tabs zum Wechseln.
2. **Keine Leiste unten.** Die Zahl («2 ausgewählt») und «Ändern» stehen neben «Alle auswählen». Die Töpfe (ADR-0055) bleiben unter der Reihe: oben verschieben, darunter abschliessen.
3. **Ziehen auf dem iPhone:** Eine Zeile verhindert, dass Safari beim langen Drücken selbst einen Link oder ein Bild zieht oder das Kontextmenü öffnet (`-webkit-touch-callout: none`, `-webkit-user-drag: none`, Bilder ohne Zeiger-Ereignisse). Ein Finger folgt den Touch-Ereignissen; ein abgebrochener Zeiger (`pointercancel`) beendet nur Maus- und Stift-Gesten (L-28).

## Folgen

- Weniger Fläche, kein Element verdeckt die Liste, und es gibt keinen Weg doppelt.
- Ein Bildschirmleser hört während der Auswahl keine Tabs, sondern eine Gruppe «Verschieben nach»; der Tab-Bereich heisst dann nach dem Lagerort.
- Ob das Ziehen auf echten iPhones jetzt trägt, zeigt erst der Test auf dem Gerät: Die E2E-Tests laufen in Chromium mit echten Touch-Ereignissen, nicht in Safari.
