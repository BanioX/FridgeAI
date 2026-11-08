# Glossar: ein Begriff, eine Bedeutung

Damit Mensch und Maschine dasselbe meinen: Wort in der App (de-CH), Name im Code, und wie andere Regionen sagen würden. Neue Begriffe kommen hier zuerst hinein.

## Begriffe

| App (de-CH) | Code | Bedeutung | Andere Regionen |
| --- | --- | --- | --- |
| **SWELP** | `swelp` | Albans Protokoll-Set «Darf, Tut, Lernt»: Scoped Work, Side Effect, Self Learning Protocols ([`BanioX/swelp`](https://github.com/BanioX/swelp)); in Rettich gelebt in [`docs/swelp/`](./swelp/README.md) | – |
| **Swelper** (Alban 8.11.2026) | `swelper`, `/swelper`, `.swelper.json` | Albans Schaltzentrale als eigener Rahmen: Trichter, Dispatcher, Stecker, Kontexte; führt SWELP über Agenten aus ([`docs/ideen/swelper.md`](./ideen/swelper.md)) | – |
| **Quittung** (nicht «Bon», Alban 7.11.2026) | `receipt`, `receipts.import`, `receipts.matchLine` | Kassenzettel eines Einkaufs, als PDF, Screenshot oder Foto | de-DE «Kassenbon», de-AT «Kassabon» oder «Rechnung» |
| **Abfall** (nicht «Kübel», Alban 8.11.2026) | `wasted` | wohin weggeworfene Lebensmittel gehen; Claim «Wirf kein Geld in den Abfall.» | de-DE auch «Müll», de-CH auch «Kehricht» |
| **Vorrat** (Tab) | `inventory` | alles, was im Haushalt ist, über alle Lagerorte | – |
| **Lagerort** | `StorageLocation` | `fridge` Kühlschrank, `freezer` Tiefkühler, `pantry` Vorrat, `reserve` Notvorrat | de-DE «Gefrierschrank», «Vorratsschrank» |
| **Haltbar bis** | `expiresOn` (`LocalDate`, Europe/Zurich) | Kalendertag, an dem etwas abläuft | – |
| **Mindestens haltbar / Zu verbrauchen** | `DateKind`: `best_before` / `use_by` | MHD darf man prüfen und oft noch essen, Verbrauchsdatum nicht | de-AT «mindestens haltbar bis» |
| **Gerettet** | `atRisk` + `eaten`/`shared_out` | kurz vor oder nach Ablauf gegessen oder weitergegeben (ADR-0033) | – |
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
