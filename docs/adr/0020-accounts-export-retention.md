# ADR-0020: Konto, Export, Löschen und Aufbewahrung

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban (6.11.2026): Später soll es Konten geben, und die Daten müssen speicherbar, exportierbar und löschbar sein, «nach Best Practice». Jahrealte Daten nur, wenn es einen klaren Zweck gibt. Massstab sind das Schweizer DSG und für DACH die DSGVO: Zweckbindung, Datenminimierung und Recht auf Auskunft, Herausgabe und Löschung.

## Entscheid

- **Ohne Konto (heute):** Alles bleibt im Browser (ADR-0003).
  - «Daten exportieren» liefert JSON (vollständig). Der CSV-Export wurde am 7.11.2026 auf Wunsch des Product Owners entfernt, damit die App schlank bleibt; der JSON-Export bleibt vollständig.
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

- **Für Auswertungen** reichen Aggregate.
  - Personalisierte Auswertung nur mit Einwilligung pro Zweck, widerrufbar.
  - Kein Verkauf von Einzeldaten.
  - Längere Aufbewahrung entscheidet Alban je nach Erfolg und nur mit Einwilligung. Die Regel oben ist der Standard.

## Konsequenzen

- Das Datenmodell trennt Rohdaten und Monatssummen. Die Summen werden berechnet, nicht gepflegt (CLAUDE.md), und vor dem Löschen der Rohdaten einmal festgehalten.
- Die Datenschutzerklärung (Plan 12d) nennt genau diese Fristen.

## Nachtrag 7.11.2026: Export zurückholen

- **Warum:** Wechselt die Web-Adresse (eigene Domain statt workers.dev) oder das Gerät, sieht der Browser einen leeren Speicher. Ohne Import bliebe alles am alten Ort.
- **Wie:** `household.import` nimmt die JSON-Datei von «Alles exportieren» und **ersetzt** alles auf dem Gerät. Zusammenführen gibt es bewusst nicht, sonst zählte derselbe Haushalt doppelt.
  - Wie beim Löschen braucht es `confirm: true`. Die App fragt vorher mit dem Dateinamen und der Zahl der Artikel nach.
  - Die Datei muss das Format `fridgeai-export` v1 haben, und jede Zeile muss zum selben Haushalt gehören. Sonst ändert sich nichts.
  - Danach geht es als Besitzer:in des Haushalts weiter. Das Ereignis `household.imported` hält fest, wann der Export entstand und wie viel er enthielt.
  - Die Datei wird nur auf dem Gerät gelesen. Es fliessen keine Daten neu ab.
