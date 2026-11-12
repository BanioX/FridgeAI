# Flächen: jede Funktion überall, wo sie hingehört

Alban, 12.11.2026: «Du hast so viele Features neu, du musst diese konsequent nachziehen, z. B. Klimabilanz auch beim PDF-Auszug.»

Eine neue Funktion ist erst fertig, wenn sie auf **jeder Fläche** steht, auf der man sie erwartet, oder bewusst dort fehlt (–). Jeder PR mit einer neuen Funktion geht diese Liste durch (Definition of Done in [`CLAUDE.md`](../CLAUDE.md) und in der PR-Vorlage).

## Die Flächen

| # | Fläche | Wo im Code | Frage |
| --- | --- | --- | --- |
| 1 | Start | `features/today` | Sieht man es auf einen Blick, wenn es zählt? |
| 2 | Vorrat-Liste | `features/inventory/InventoryPage`, `InventoryItemRow`, `item-meta` | Zeigt die Zeile es (Badge, Platz, Person)? |
| 3 | Artikelseite | `features/inventory/ItemDetailPage`, `EditItemPage` | Lässt es sich dort sehen und ändern? |
| 4 | Journal | `features/history` | Steht es im Verlauf, und stimmt die Zählung mit der Bilanz? |
| 5 | Bilanz, Klima, Abzeichen | `features/more`, `features/climate`, Abzeichen | Fliesst es in die Zahlen ein? |
| 6 | Auszüge (PDF) | `features/reports`, `reports.build` | Steht es in der Quittung und im Gesamtauszug? |
| 7 | Export und Import | `household.export`, `household.import` | Ist es in der Sicherung und kommt es zurück (Test mit Hin und Zurück)? |
| 8 | Wissen | `features/knowledge`, «Kurz erklärt» | Wird es kurz erklärt? |
| 9 | Suche | Namenssuche, «Wo ist was?» | Findet man es? |
| 10 | Abzeichen | `achievements-catalogue.ts` | Lohnt es sich, dafür eines zu vergeben? |

## Stand 12.11.2026

Prüfung aller Funktionen aus ADR-0048 bis ADR-0062 und der Funktionen ohne eigenes ADR. «ja» heisst vorhanden, «nein» heisst Lücke, «–» heisst gehört dort nicht hin. In Klammern: der Auftrag, der die Lücke schliesst.

| Funktion | Start | Liste | Artikel | Journal | Bilanz | PDF | Export | Wissen | Suche | Abzeichen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Rezepte, eigene Rezepte (0048) | – | – | über «Verarbeiten» | – | ja | – | ja | ja | nein (K12) | ja |
| Verarbeiten, Reste (0052) | «etwa» fehlt (K4) | Badge fehlt (K4) | ja | zählt doppelt (K2) | ja | nein (K6) | ja | nein (K10) | ja | ja |
| Abzeichen (0054) | ja | – | – | – | ja | nein (K7) | ja | nein (K10) | – | – |
| Töpfe (0055) | – | ja | – | ja | – | – | – | nein (K10) | – | – |
| Plätze, «Wo ist was?» (0056) | ja | ja | ja | – | ja | nein (K6) | ja | nein (K10) | Fachnamen nein (K9) | – |
| Klimabilanz (0057) | ja | – | – | – | ja | nein (K1) | ja | teilweise (K10) | – | – |
| «Gehört» (0058) | ja | ja | ja | nein (K2) | – | nein (K6) | ja | nein (K10) | nein (K9) | – |
| Mindestbestand (0059) | – | ja | ja | – | – | – | ja | nein (K10) | – | – |
| Rezepte zur Auswahl (0061) | – | ja | ja | – | – | – | – | nein (K10) | – | – |
| Datum fotografieren (0062) | – | – | ja (Ändern, Einräumen) | – | – | – | ja | nein (K10) | – | – |
| Lagerort-Kacheln | ja | ja | – | – | – | Notvorrat-Quittung nein (K7) | – | – | – | – |
| Sicherung | ja | – | – | – | ja | – | nach Import nein (K3) | nein (K10) | – | – |
| Einräumen | – | ja | ja | – | – | – | – | nein (K10) | – | – |
| Check Fach für Fach | nur wenn fällig (K5) | kein Einstieg (K5) | – | teilweise | ja | – | ja | nein (K10) | – | ja |
| Mehrere ändern | – | Platz fehlt (K11) | – | – | – | – | – | nein (K10) | – | – |

Daten gehen keine verloren: Alle Tabellen stehen in der Sicherung und kommen beim Import zurück. Es fehlten nur Tests mit Hin und Zurück für einzelne Felder (K3).

## Aufträge

| Auftrag | Inhalt | Status |
| --- | --- | --- |
| K1 | Klimabilanz in der Quittung «Bilanz» und im Gesamtauszug, mit Quelle; echter Haushaltsname im PDF | in Arbeit |
| K2 | Journal zählt wie die Bilanz (Verarbeitetes nicht doppelt, «→ Kuchen»), Person an der Zeile | in Arbeit |
| K3 | Tests mit Hin und Zurück für Person, Verarbeiten, Mindestbestand; «Letzte Sicherung» nach Import und Löschen | in Arbeit |
| K4 | Badges «Selbst gemacht» und «Reste»; «etwa» auf Start | in Arbeit |
| K5 | Kühlschrank-Check auch ohne Fälligkeit starten (Vorrat, Mehr); Person auf der Check-Karte | offen |
| K6 | PDF: Plätze, Person und Verarbeitetes im Auszug | offen |
| K7 | PDF: Abzeichen im Zeitraum; Quittung für den Notvorrat | offen |
| K8 | «Datum fotografieren» auch beim Ändern und beim Einräumen | erledigt |
| K9 | «Wo ist was?» findet Fachnamen und Personen | offen |
| K10 | «Kurz erklärt» für alle neuen Funktionen; Datenschutz-Hinweis nennt Datumsfotos | offen |
| K11 | «Mehrere ändern» kann auch den Platz setzen | offen |
| K12 | Suche in «Alle Rezepte» | offen |
| K13 | «Steht jetzt auf Nachkaufen» auch nach Töpfen, Check und Verarbeiten | offen |
| später | Bilanz und Klimabilanz pro Person; Abzeichen für Ordnung | wartet auf Konten und Sync |
