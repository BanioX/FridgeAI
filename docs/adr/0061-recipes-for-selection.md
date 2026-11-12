# ADR-0061: Rezepte zur Auswahl

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Claude (Umsetzung von O8), nach ADR-0060

## Kontext

Die Idee O8 sah einen fünften Topf «Rezept» im Auswahlmodus vor: Auswahl hineinziehen, Rettich zeigt Rezepte, die genau diese Artikel brauchen. Der Vorrat hat aber schon vier Töpfe (ADR-0055); bei 390 px Breite wird ein fünfter zu eng, und Alban hat in ADR-0060 entschieden: eine Stelle pro Aktion.

## Entscheid

1. **Kein fünfter Topf.** Der Topf «Verarbeiten» öffnet schon `/add/process?item=…` mit der Auswahl. Dort stehen oberhalb des Formulars bis zu drei «Rezepte mit deiner Auswahl»: Titel als Link zum Rezept, darunter «Mit: …» und, wenn etwas fehlt, «Fehlt: …». Ohne Treffer oder beim Laden fehlt der Abschnitt ganz.
2. **Neue Abfrage `recipes.withItems`** (Scope `recipes:read`, Eingabe `itemIds` 1 bis 50 und `limit` 1 bis 10, Standard 3; Ausgabe `id`, `title`, `source`, `minutes`, `uses`, `missing`). Kein neues Ereignis.
3. **Rangfolge** (`recipesForChosen` im Kern): Nur Rezepte, die mindestens einen gewählten Artikel brauchen (Basiszutaten zählen nicht, abgelaufenes Verbrauchsdatum nie). Danach mehr verschiedene gewählte Artikel, dann die höhere Dringlichkeit der verwendeten gewählten Artikel, dann weniger Fehlendes, weniger Minuten, zuletzt die Kennung. «Fehlt» schaut auf den ganzen Vorrat, nicht nur auf die Auswahl.

## Folgen

- «Was kann ich daraus machen?» ist ein Tipp auf einer Seite, die es schon gibt; die Töpfe bleiben vier.
- 55 Operationen, 33 Ereignisse. REST-API und MCP bekommen die Abfrage ohne Umbau.
- Ein Rezept kann ohne Auswahl nicht gefunden werden; das bleibt Aufgabe von «Heute kochen» und «Alle Rezepte».
