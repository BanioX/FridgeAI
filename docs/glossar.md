# Glossar: ein Begriff, eine Bedeutung

Damit Mensch und Maschine dasselbe meinen: Wort in der App (de-CH), Name im Code, und wie andere Regionen sagen würden. Neue Begriffe kommen hier zuerst hinein.

## Begriffe

| App (de-CH) | Code | Bedeutung | Andere Regionen |
| --- | --- | --- | --- |
| **Monatsabschluss**, **Jahresabschluss** | `closingMonth`, `closingYear`, `monthClosingDay` | Berichtszeitraum bis zum letzten Schweizer Bankwerktag des Monats oder Jahres; der nächste beginnt am Tag danach (ADR-0030) | – |
| **Bankwerktag** | `isSwissBankDay`, `swissBankHolidays` | Montag bis Freitag ohne Bankfeiertage des Schweizer Zahlungsverkehrs (SIC); 24.12. und 31.12. zählen | DE/AT: TARGET2-Kalender, später je Land |
| **Kurz-Bericht** (Quittung im PDF) | `ReportKind`, `receiptSpec`, `receiptPdf` | Ein PDF im Look einer Quittung zu einem Thema: Wirkung, Läuft bald ab, Weggeworfen, ein Ort. Der ausführliche Bericht zeigt keine Quittung (ADR-0030) | – |
| **Quittung** (nicht «Bon», Alban 7.11.2026) | `receipt`, `receipts.import`, `receipts.matchLine` | Kassenzettel eines Einkaufs, als PDF, Screenshot oder Foto | de-DE «Kassenbon», de-AT «Kassabon» oder «Rechnung» |
| **Abfall** (nicht «Kübel», Alban 8.11.2026) | `wasted` | wohin weggeworfene Lebensmittel gehen; Claim «Wirf kein Geld in den Abfall.» | de-DE auch «Müll», de-CH auch «Kehricht» |
| **Vorrat** (Tab) | `inventory` | alles, was im Haushalt ist, über alle Lagerorte | – |
| **Haltbarkeit** 1–10 (heikel 1–4, mittel 5–6, robust 7–10) | `shelfScore`, `perishability`, `needsWatching` | Wie lange eine Kategorie hält, 10 = am längsten; geöffnet zählen die Tage nach dem Öffnen; der Kühlschrank-Check fragt Robustes mit fernem Datum nicht ab (ADR-0038) | – |
| **Von der Theke** | `soldLoose`, `openedOn` | Offen gekauft (Käse, Aufschnitt, Dips): hält ab Kauf wie eine geöffnete Packung (ADR-0038) | – |
| **Das wirfst du oft weg** | `products.wasteHabits`, `wasteHabits` | Kategorie mit mindestens zwei Mal «Weggeworfen» in 90 Tagen; beim Erfassen kommt ein Tipp (ADR-0038) | – |
| **Wissen** (Tab) | `/knowledge`, `shelfGuide` | «Kurz erklärt» und «Haltbarkeit A–Z» aus dem Katalog (ADR-0041) | – |
| **Lagerort** | `StorageLocation` | `fridge` Kühlschrank, `freezer` Tiefkühler, `pantry` Vorrat, `reserve` Notvorrat | de-DE «Gefrierschrank», «Vorratsschrank» |
| **Haltbar bis** | `expiresOn` (`LocalDate`, Europe/Zurich) | Kalendertag, an dem etwas abläuft | – |
| **Mindestens haltbar / Zu verbrauchen** | `DateKind`: `best_before` / `use_by` | MHD darf man prüfen und oft noch essen, Verbrauchsdatum nicht | de-AT «mindestens haltbar bis» |
| **Gerettet** | `rescued`, `canBeRescued`, `isRescue` | gegessen oder weitergegeben und selbst bestätigt «ohne Rettich im Abfall gelandet»; Rettich fragt nur, wenn es auf der Kippe stand (ADR-0039) | – |
| **Abschluss** | `OutcomeEvent` | gegessen, weitergegeben oder weggeworfen, mit Menge und Wert | – |
| **Nachkaufen** | `shopping.*`, `ShoppingListItem` | Einkaufsliste | – |
| **Haushalt** | `Household` | WG, Paar, Familie; hat eine Währung (ADR-0019) | – |
| **Rappen** | `Rappen` (Typ) | Ganzzahl in der kleinsten Einheit der Haushaltswährung (TD-04) | Cent |
| **Schnittstelle** | `CONTRACT_V1` | alle Befehle und Abfragen als Zod-Schemas (ADR-0005) | – |
| **Logik-, Daten-, Präsentationsschicht** | `packages/core/src/application`, `apps/web/src/data`, `apps/web/src/features` | die drei Schichten (ADR-0034) | – |
| **Treffer bestätigen** | `decisions: 'yes' \| 'no'` | «Ist es das? Ja/Nein» beim Abgleich mit Open Food Facts (ADR-0036) | – |

## Schweizer Wörter für Lebensmittel

Die App versteht sie über Kategorien und Quittungs-Wörter (`catalog/receipt-words.ts`). Bei anderen Regionen muss die Anzeige angepasst werden.

| de-CH | de-DE / de-AT |
| --- | --- |
| Glace | Eis |
| Rüebli | Karotte, Möhre |
| Poulet | Hähnchen, Hendl |
| Peperoni | Paprika |
| Rahm | Sahne, Obers |
| Nüsslisalat | Feldsalat, Vogerlsalat |
