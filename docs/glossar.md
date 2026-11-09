# Glossar: ein Begriff, eine Bedeutung

Damit Mensch und Maschine dasselbe meinen: Wort in der App (de-CH), Name im Code, und wie andere Regionen sagen würden. Neue Begriffe kommen hier zuerst hinein.

## Begriffe

| App (de-CH) | Code | Bedeutung | Andere Regionen |
| --- | --- | --- | --- |
| **Monatsabschluss**, **Jahresabschluss** | `closingMonth`, `closingYear`, `monthClosingDay` | Berichtszeitraum bis zum letzten Schweizer Bankwerktag des Monats oder Jahres; der nächste beginnt am Tag danach (ADR-0030) | – |
| **Bankwerktag** | `isSwissBankDay`, `swissBankHolidays` | Montag bis Freitag ohne Bankfeiertage des Schweizer Zahlungsverkehrs (SIC); 24.12. und 31.12. zählen | DE/AT: TARGET2-Kalender, später je Land |
| **Kurz-Auszug** (Quittung im PDF, früher «Kurz-Bericht») | `ReportKind`, `receiptSpec`, `receiptPdf` | Ein PDF im Look einer Quittung zu einem Thema: Bilanz, Läuft bald ab in N Tagen, Entsorgt, ein Ort. Der Gesamtauszug zeigt keine Quittung (ADR-0030, ADR-0047) | – |
| **SWELP** | `swelp` | Albans Protokoll-Set «Darf, Tut, Lernt»: Scoped Work, Side Effect, Self Learning Protocols ([`BanioX/swelp`](https://github.com/BanioX/swelp)); in Rettich gelebt in [`docs/swelp/`](./swelp/README.md) | – |
| **SWELPER** (Alban 8.11.2026) | `swelper`, `/swelper`, `.swelper.json` | Albans Schaltzentrale als eigener Rahmen: Trichter, Dispatcher, Stecker, Kontexte; führt SWELP über Agenten aus ([`docs/ideen/swelper.md`](./ideen/swelper.md)) | – |
| **Quittung** (nicht «Bon», Alban 7.11.2026) | `receipt`, `receipts.import`, `receipts.matchLine` | Kassenzettel eines Einkaufs, als PDF, Screenshot oder Foto | de-DE «Kassenbon», de-AT «Kassabon» oder «Rechnung» |
| **Abfall** (nicht «Kübel», Alban 8.11.2026) | `wasted` | wohin entsorgte Lebensmittel gehen; Claim «Wirf kein Geld in den Abfall.» | de-DE auch «Müll», de-CH auch «Kehricht» |
| **Vorrat** (Tab) | `inventory` | alles, was im Haushalt ist, über alle Lagerorte | – |
| **Haltbarkeit** 1–10 (heikel 1–4, mittel 5–6, robust 7–10) | `shelfScore`, `perishability`, `needsWatching` | Wie lange eine Kategorie hält, 10 = am längsten; geöffnet zählen die Tage nach dem Öffnen; der Kühlschrank-Check fragt Robustes mit fernem Datum nicht ab (ADR-0038) | – |
| **Von der Theke** | `soldLoose`, `openedOn` | Offen gekauft (Käse, Aufschnitt, Dips): hält ab Kauf wie eine geöffnete Packung (ADR-0038) | – |
| **Das entsorgst du oft** | `products.wasteHabits`, `wasteHabits` | Kategorie mit mindestens zwei Mal «Entsorgt» in 90 Tagen; beim Erfassen kommt ein Tipp (ADR-0038) | – |
| **Wissen** (Tab) | `/knowledge`, `shelfGuide` | «Kurz erklärt» und «Haltbarkeit A–Z» aus dem Katalog (ADR-0041) | – |
| **Lagerort** | `StorageLocation` | `fridge` Kühlschrank, `freezer` Tiefkühler, `pantry` Vorrat, `reserve` Notvorrat | de-DE «Gefrierschrank», «Vorratsschrank» |
| **Haltbar bis** | `expiresOn` (`LocalDate`, Europe/Zurich) | Kalendertag, an dem etwas abläuft | – |
| **Mindestens haltbar / Zu verbrauchen** | `DateKind`: `best_before` / `use_by` | MHD darf man prüfen und oft noch essen, Verbrauchsdatum nicht | de-AT «mindestens haltbar bis» |
| **Gerettet** | `rescued`, `canBeRescued`, `isRescue` | verwertet und selbst bestätigt «ohne Rettich im Abfall gelandet»; Rettich fragt nur, wenn es auf der Kippe stand (ADR-0039) | – |
| **Wusstest du?** (Food Fact) | `factFor`, `messages.knowledge.facts` | kurzer Fact nach einer bestätigten Rettung und einmal pro Tag im Tab «Wissen»; Zahlen nur mit Quelle (ADR-0042) | – |
| **Dein Rettich** (Samen, Keimling, Jungpflanze, Rettich, Vorbild) | `growthOf`, `RettichGrowth` | wächst mit jeder bestätigten Rettung im Monat, ein Blatt pro Rettung; «Vorbild» ab 10 Rettungen; beginnt jeden Monat neu (ADR-0043) | – |
| **Katalog** (mitgeliefert) | `off-ch.json`, `retail-ch.json`, `localCatalogSearch` | Produktdaten, die mit der App kommen: Open Food Facts (Migros, Coop …) und öffentliche Händlerseiten; Quittungszeilen werden zuerst darin gesucht, auf dem Gerät (ADR-0045) | – |
| **Abschluss** | `OutcomeEvent` | verwertet oder entsorgt, mit Menge und Wert. «Weitergegeben» (`shared_out`) bietet Rettich seit 8.11.2026 nicht mehr an; ältere Einträge zählen als verwertet (ADR-0046) | – |
| **Verwertet** (nicht «gegessen», Alban 8.11.2026) | `eaten` | genutzt: gegessen, gekocht, gebacken, verbraucht. Rettich zählt nicht, was du isst (ADR-0046) | de-DE gleich |
| **Entsorgt** (nicht «weggeworfen», Alban 8.11.2026) | `wasted` | im Abfall gelandet, mit freiwilligem Grund (ADR-0046) | de-DE gleich |
| **Heute retten** (früher «Läuft bald ab» auf Start) | `urgentItems`, `today.expiringTitle` | was in den nächsten drei Tagen abläuft, zuoberst auf Start (ADR-0047) | – |
| **Bilanz** (früher «Deine Wirkung») | `ImpactCard`, `stats.waste` | Verwertet und Entsorgt als zwei Kreise, darunter Gerettet, pro Monat («Bilanz November») (ADR-0046, ADR-0047) | – |
| **Auszug, Gesamtauszug** (früher «Bericht», «Ausführlich») | `ReportKind`, `reports.build` | PDF zu einem Zeitraum wie ein Kontoauszug; Kurz-Auszüge als Quittung, der Gesamtauszug mit Diagrammen (ADR-0030, ADR-0047) | – |
| **Journal** (früher «Verlauf») | `inventory.history` | jeder Abschluss, neueste zuerst, ändern und löschen (ADR-0047) | – |
| **Deine Daten** (früher «Daten und Datenschutz») | `/more/data`, `pages.data` | Export als JSON, Import, alles löschen und «Datenschutz in Kürze» (ADR-0020, ADR-0047) | – |
| **Wischen** (wie bei Spotify) | `SwipeAction`, `useSwipeOutcome` | in Vorrat und «Heute retten»: nach links «Verwertet», nach rechts «Entsorgt», mit «Rückgängig» (ADR-0046) | – |
| **Auswählen** (wie in iOS) | `useSelection`, `SelectableRow`, `SelectionBar`, `useMoveSelected` | mehrere Artikel antippen und gemeinsam verschieben; was nicht an den neuen Ort passt, bleibt und wird genannt | – |
| **Lang drücken und ziehen** | `useDragToLocation`, `dropLocationFrom` | ein Artikel (oder alle ausgewählten) hängt am Finger und landet auf dem Lagerort-Tab, über dem du loslässt; die Knöpfe «Verschieben nach» bleiben der barrierefreie Weg | – |
| **Laden-Buchstabe** | `ShopBadge`, `shopMark` (PDF) | ein Buchstabe pro Laden im Stil seines Schilds (Coop, Migros, Denner, Lidl, Aldi), immer neben dem Namen; nie die geschützten Marken selbst (P24 im Parkplatz) | – |
| **Alle übernehmen** | `ReceiptReview`, `batchTotals` | mehrere Quittungen auf einer Seite prüfen und mit einem Knopf in den Vorrat legen | – |
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
