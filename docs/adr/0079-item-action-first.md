# ADR-0079: Auf der Artikelseite zuerst «Verwertet» oder «Entsorgt»

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude, auf Albans Wunsch («Simplicity, kein Stress», 13.11.2026)

## Kontext

Auf der Artikelseite stand die Hauptaktion «Was ist damit passiert?» erst nach Platz, Datum und Haltbarkeit, «Gehört», dem Einfrier-Tipp, weiteren Packungen und den Nährwerten, mit Beispieldaten bei rund 940 px, also unter dem ersten Bildschirm. Darunter stand immer ein Eingabefeld «Andere Menge», das selten gebraucht wird.

## Entscheid

1. **Die Hauptaktion zuerst:** Direkt unter Name und Kopfzeilen stehen «Verwertet» und «Entsorgt», «Wie viel?» und der Knopf zum Speichern, dazu der Hinweis mit «Rückgängig». Platz, Datum, Haltbarkeit, «Gehört», Nährwerte und «Weitere Aktionen» folgen darunter.
2. **«Andere Menge …» auf Wunsch:** Die vier Portionen (¼, ½, ¾, alles) decken die meisten Fälle. Das Eingabefeld erscheint nach einem Tipp auf «Andere Menge …» und bekommt dann den Fokus.
3. Was gefragt wird, bleibt gleich: der Grund beim Entsorgen, «Ist das noch gut?» und die Rettungsfrage nach ADR-0039.

## Folgen

- Verwertet: Zeile antippen, «Als verwertet speichern», ohne zu scrollen.
- Ein Umbau zu zwei grossen Knöpfen, die sofort speichern (Grund und Teilmenge danach im Hinweis), wäre der nächste Schritt; er ändert, wann gefragt wird, und kommt nur mit eigenem Entscheid.
