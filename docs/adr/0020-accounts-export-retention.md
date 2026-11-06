# ADR-0020: Konto, Export, Löschen und Aufbewahrung

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban (6.11.2026): Später soll es Konten geben, und die Daten müssen speicherbar, exportierbar und löschbar sein, «nach Best Practice». Jahrealte Daten nur, wenn es kommerziell Sinn ergibt, etwa um Zielgruppen zu verstehen, und abhängig vom Erfolg. Massstab sind das Schweizer DSG und für DACH die DSGVO: Zweckbindung, Datenminimierung und Recht auf Auskunft, Herausgabe und Löschung.

## Entscheid

- **Ohne Konto (heute):** Alles bleibt im Browser (ADR-0003).
  - «Daten exportieren» liefert JSON (vollständig) und CSV (Vorrat, Abschlüsse).
  - «Alles löschen» entfernt die lokale Datenbank samt Cache.
  - Beides kommt vor dem Pilot (Plan 12a).
- **Mit Konto (Schritt 7):**
  - Dieselben Knöpfe wirken auch auf dem Server.
  - Ein Konto löschen entfernt die Serverdaten sofort. Backups rotieren nach höchstens 30 Tagen.
  - Teilen weitere Mitglieder den Haushalt, bleiben die geteilten Daten dort, ohne Bezug auf die gelöschte Person.
- **Aufbewahrung:**

  | Daten | Wie lange |
  | --- | --- |
  | Aktiver Vorrat und Einkaufsliste | solange sie gebraucht werden |
  | Abgeschlossene Artikel, Abschlüsse, Domain Events | 24 Monate für Statistik und Rückgängig; danach bleiben nur Monatssummen (gerettet und weggeworfen in Geld und Gewicht, Kategorien) |
  | Bon-Bilder | nie (CLAUDE.md), ausser mit Opt-in |
  | Produktcache von offenen Datenbanken | 30 Tage (ADR-0016) |
  | Server-Logs | 14 Tage, ohne Inhalte |

- **Für Zielgruppen und Werbung** reichen Aggregate (siehe [`ideen/monetarisierung.md`](../ideen/monetarisierung.md)).
  - Personalisierte Auswertung nur mit Einwilligung pro Zweck, widerrufbar.
  - Kein Verkauf von Einzeldaten.
  - Längere Aufbewahrung entscheidet Alban je nach Erfolg und nur mit Einwilligung. Die Regel oben ist der Standard.

## Konsequenzen

- Das Datenmodell trennt Rohdaten und Monatssummen. Die Summen werden berechnet, nicht gepflegt (CLAUDE.md), und vor dem Löschen der Rohdaten einmal festgehalten.
- Die Datenschutzerklärung (Plan 12d) nennt genau diese Fristen.
