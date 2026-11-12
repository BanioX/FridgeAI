# Glossar: ein Begriff, eine Bedeutung

Damit Mensch und Maschine dasselbe meinen: Wort in der App (de-CH), Name im Code, und wie andere Regionen sagen würden. Neue Begriffe kommen hier zuerst hinein.

## Begriffe

| App (de-CH) | Code | Bedeutung | Andere Regionen |
| --- | --- | --- | --- |
| **Platz** | `StorageSpot`, `spotId` | Ein benannter Ort innerhalb eines Lagerorts («Oberer Schrank links», «Gemüsefach»), auf Wunsch mit Foto; gehört zum Produkt, jede Packung erbt ihn (ADR-0056) | – |
| **Monatsabschluss**, **Jahresabschluss** | `closingMonth`, `closingYear`, `monthClosingDay` | Berichtszeitraum bis zum letzten Schweizer Bankwerktag des Monats oder Jahres; der nächste beginnt am Tag danach (ADR-0030) | – |
| **Bankwerktag** | `isSwissBankDay`, `swissBankHolidays` | Montag bis Freitag ohne Bankfeiertage des Schweizer Zahlungsverkehrs (SIC); 24.12. und 31.12. zählen | DE/AT: TARGET2-Kalender, später je Land |
| **Kurz-Auszug** (Quittung im PDF, früher «Kurz-Bericht») | `ReportKind`, `receiptSpec`, `receiptPdf` | Ein PDF im Look einer Quittung zu einem Thema: Bilanz, Läuft bald ab in N Tagen, Entsorgt, ein Ort. Der Gesamtauszug zeigt keine Quittung (ADR-0030, ADR-0047) | – |
| **SWELP** | `swelp` | Albans Protokoll-Set «Darf, Tut, Lernt»: Scoped Work, Side Effect, Self Learning Protocols ([`BanioX/swelp`](https://github.com/BanioX/swelp)); in Rettich gelebt in [`docs/swelp/`](./swelp/README.md) | – |
| **SWELPER** (Alban 8.11.2026) | `swelper`, `/swelper`, `.swelper.json` | Albans Schaltzentrale als eigener Rahmen: Trichter, Dispatcher, Stecker, Kontexte; führt SWELP über Agenten aus ([`docs/ideen/swelper.md`](./ideen/swelper.md)) | – |
| **CO₂e** (Alban 12.11.2026) | `co2eGrams`, `stats.footprint`, `summarizeFootprint` | Treibhausgase in CO₂-Äquivalenten: wie viel Klimawirkung in der Herstellung eines Lebensmittels steckte, geschätzt je Kilogramm aus Clark et al. (2022) via Our World in Data (CC BY 4.0). Gerettetes zeigt, was in seiner Herstellung steckte, nicht, was «gespart» wurde; Energie fehlt in der Quelle ([ADR-0057](adr/0057-climate-balance.md)) | en: CO₂e, CO2-equivalents |
| **Verarbeiten** (Alban 11.11.2026) | `inventory.process`, `item.processed`, `madeInto` | Zutaten werden verwertet und daraus wird etwas Neues (Kuchen, Brot, Reste). Der Wert der Zutaten wandert auf das Ergebnis und zählt nur einmal ([ADR-0052](adr/0052-processing-value-moves-along.md)) | – |
| **Selbst gemacht** | `origin: 'made'`, `madeFrom`, Kategorie `bakery-homemade` | Artikel, der aus Zutaten des Vorrats entstanden ist; die Artikelseite nennt die Zutaten | – |
| **Reste** | `origin: 'leftover'`, Kategorie `prepared-leftovers` | Gekochtes, das übrig ist: 3 Tage im Kühlschrank (Verbrauchsdatum), auch ohne Zutaten erfassbar («Reste erfassen») | – |
| **Gekocht** | `recipeId`, Ereignisart `cooked` | Knopf auf der Rezeptseite: bucht die «Da»-Zutaten ab und fragt, ob Reste in den Kühlschrank kommen | – |
| **Rezepte** (Alban 11.11.2026) | `recipes.suggest`, `recipes.list`, `recipes.get`, `RecipeProvider` | Abschnitt im Tab «Wissen», kein eigener Tab: kuratierte, für Rettich geschriebene Rezepte, gereiht nach bald ablaufenden Zutaten (ADR-0048) | – |
| **Meine Rezepte** (Alban 11.11.2026) | `OwnRecipe`, `recipes.create`/`update`/`delete`, `source: 'own'`, `createRecipeCommands` | Rezepte, die du selbst schreibst oder von irgendwo einfügst; Gruppe unter «Wissen › Rezepte», kein eigener Tab. Zutaten bleiben im Originaltext und werden gelesen und einer Kategorie zugeordnet, damit «Da / Fehlt» wie bei den mitgelieferten Rezepten geht. Liegen auf dem Gerät und gehören zu Export, Import und Löschen (ADR-0048 Nachtrag) | – |
| **Heute kochen** | `createRecipeQueries`, `suggestRecipes` | Bis zu drei Rezepte oben bei «Rezepte», die Lebensmittel verwenden, die in drei Tagen ablaufen; das Dringendste zuerst. Nie mit Ware nach dem Verbrauchsdatum | – |
| **Da / Fehlt** | `ingredientsAtHome`, `atHome` | Auf der Rezeptseite die Zutaten im Vergleich mit dem Vorrat: «Da» (im Vorrat oder Grundvorrat), «Fehlt» (nicht da; was nicht optional ist, setzt ein Tipp auf «Nachkaufen») | – |
| **Quittung** (nicht «Bon», Alban 7.11.2026) | `receipt`, `receipts.import`, `receipts.matchLine` | Kassenzettel eines Einkaufs, als PDF, Screenshot oder Foto | de-DE «Kassenbon», de-AT «Kassabon» oder «Rechnung» |
| **Abfall** (nicht «Kübel», Alban 8.11.2026) | `wasted` | wohin entsorgte Lebensmittel gehen; Claim «Wirf kein Geld in den Abfall.» | de-DE auch «Müll», de-CH auch «Kehricht» |
| **Vorrat** (Tab) | `inventory` | alles, was im Haushalt ist, über alle Lagerorte | – |
| **Haltbarkeit** 1–10 (heikel 1–4, mittel 5–6, robust 7–10) | `shelfScore`, `perishability`, `needsWatching` | Wie lange eine Kategorie hält, 10 = am längsten; geöffnet zählen die Tage nach dem Öffnen; der Kühlschrank-Check fragt Robustes mit fernem Datum nicht ab (ADR-0038) | – |
| **Badge** (Eingefroren, Aufgetaut, Fertigprodukt, Geöffnet, Von der Theke) | `itemBadges`, `ItemBadges`, `thawedOn` | Kleine Text-Pille am Artikel, die seinen Zustand zeigt; Eingefroren liest den Lagerort, Aufgetaut `thawedOn` (ADR-0051) | – |
| **Fertigprodukt** (Gegenstück: Zutat, «Zum Kochen»; nicht «Convenience») | `ready`, `readyMade`, `isReadyMade`, `matchesIngredient` | Essfertiges Lebensmittel (Fertiggericht, Dessert, Süsses, Glace, Tiefkühl-Pizza): zeigt das Badge «Fertigprodukt» und zählt in Rezepten nicht als Zutat, ausser das Rezept verlangt selbst Fertiges (Oreo Cheesecake); die Kategorie entscheidet, der Artikel kann es überschreiben (ADR-0053) | – |
| **Einfrier-Hinweis** | `adviseFreezing`, `freezeNote`, `allowUnsuitable` | Hinweis mit Grund vor dem Einfrieren von Lebensmitteln ohne Tiefkühl-Haltbarkeit; «Trotzdem einfrieren» behält das Datum (ADR-0051) | – |
| **Von der Theke** | `soldLoose`, `openedOn` | Offen gekauft (Käse, Aufschnitt, Dips): hält ab Kauf wie eine geöffnete Packung (ADR-0038) | – |
| **Das entsorgst du oft** | `products.wasteHabits`, `wasteHabits` | Kategorie mit mindestens zwei Mal «Entsorgt» in 90 Tagen; beim Erfassen kommt ein Tipp (ADR-0038) | – |
| **Wissen** (Tab) | `/knowledge`, `shelfGuide` | «Kurz erklärt» und «Haltbarkeit A–Z» aus dem Katalog (ADR-0041) | – |
| **Lagerort** | `StorageLocation` | `fridge` Kühlschrank, `freezer` Tiefkühler, `pantry` Vorrat, `reserve` Notvorrat | de-DE «Gefrierschrank», «Vorratsschrank» |
| **Haltbar bis** | `expiresOn` (`LocalDate`, Europe/Zurich) | Kalendertag, an dem etwas abläuft | – |
| **Mindestens haltbar / Zu verbrauchen** | `DateKind`: `best_before` / `use_by` | MHD darf man prüfen und oft noch essen, Verbrauchsdatum nicht | de-AT «mindestens haltbar bis» |
| **Gerettet** | `rescued`, `canBeRescued`, `isRescue` | verwertet und selbst bestätigt «ohne Rettich im Abfall gelandet»; Rettich fragt nur, wenn es auf der Kippe stand (ADR-0039) | – |
| **Wusstest du schon?** (Fakt des Tages) | `factFor`, `messages.knowledge.facts` | kurzer Fakt nach einer bestätigten Rettung und einmal pro Tag auf Start und im Tab «Wissen»: Tipps, Food Waste und Hunger in der Schweiz und weltweit; Zahlen nur mit Quelle (BAFU, BLV, FAO, UNEP, WWF; ADR-0042) | – |
| **Dein Rettich** (Samen, Keimling, Jungpflanze, Rettich, Vorbild) | `growthOf`, `RettichGrowth` | wächst mit jeder bestätigten Rettung im Monat, ein Blatt pro Rettung; «Vorbild» ab 10 Rettungen; beginnt jeden Monat neu (ADR-0043) | – |
| **Katalog** (mitgeliefert) | `off-ch.json`, `retail-ch.json`, `localCatalogSearch` | Produktdaten, die mit der App kommen: Open Food Facts (Migros, Coop …) und öffentliche Händlerseiten; Quittungszeilen werden zuerst darin gesucht, auf dem Gerät (ADR-0045) | – |
| **Abschluss** | `OutcomeEvent` | verwertet oder entsorgt, mit Menge und Wert. «Weitergegeben» (`shared_out`) bietet Rettich seit 8.11.2026 nicht mehr an; ältere Einträge zählen als verwertet (ADR-0046) | – |
| **Verwertet** (nicht «gegessen», Alban 8.11.2026) | `eaten` | genutzt: gegessen, gekocht, gebacken, verbraucht. Rettich zählt nicht, was du isst (ADR-0046) | de-DE gleich |
| **Entsorgt** (nicht «weggeworfen», Alban 8.11.2026) | `wasted` | im Abfall gelandet, mit freiwilligem Grund (ADR-0046) | de-DE gleich |
| **Heute retten** (früher «Läuft bald ab» auf Start) | `urgentItems`, `today.expiringTitle` | was in den nächsten drei Tagen abläuft, zuoberst auf Start (ADR-0047) | – |
| **Gehört** (Alban 12.11.2026) | `owner`, `household.members`, `initialsOf` | Wem ein Artikel gehört: «Allen» (ohne Markierung, der Standard) oder einer Person, deren Initialen am Artikel stehen. Eine Höflichkeit, keine Sperre: Verwerten geht für alle ([ADR-0058](adr/0058-owner-badge.md)) | – |
| **Abzeichen** (nicht «Achievement», «Badge») | `achievements`, `stats.achievements`, Ereignis `check.completed` ([ADR-0054](./adr/0054-achievements.md)) | Medaille für Retten, Kochen, Planen, in bis zu drei Stufen (Silber, Smaragd, Onyx); aus deinen Daten auf dem Gerät berechnet, nie gespeichert ([`abzeichen.md`](./abzeichen.md)) | – |
| **Ist das noch gut?** | `shouldAskStillGood`, `rescue.stillGood` | ruhiger Hinweis beim Entsorgen von Ware mit Mindesthaltbarkeit («Schauen, riechen, probieren»); nie bei Verbrauchsdatum (K3) | – |
| **Einfrieren mit einem Tipp** | `shouldSuggestFreezing`, `rescue.freeze` | ein Tipp auf «Heute retten» und der Artikelseite für einfrierbare Ware aus dem Kühlschrank, die heute oder morgen fällig ist (K4) | – |
| **Bilanz** (früher «Deine Wirkung») | `ImpactCard`, `stats.waste` | Verwertet und Entsorgt als zwei Kreise, darunter Gerettet, pro Monat («Bilanz November») (ADR-0046, ADR-0047) | – |
| **Auszug, Gesamtauszug** (früher «Bericht», «Ausführlich») | `ReportKind`, `reports.build` | PDF zu einem Zeitraum wie ein Kontoauszug; Kurz-Auszüge als Quittung, der Gesamtauszug mit Diagrammen (ADR-0030, ADR-0047) | – |
| **Journal** (früher «Verlauf») | `inventory.history` | jeder Abschluss, neueste zuerst, ändern und löschen (ADR-0047) | – |
| **Deine Daten** (früher «Daten und Datenschutz») | `/more/data`, `pages.data` | Export als JSON, Import, alles löschen und «Datenschutz in Kürze» (ADR-0020, ADR-0047) | – |
| **Wischen** (wie bei Spotify) | `SwipeAction`, `useSwipeOutcome` | in Vorrat und «Heute retten»: nach links «Verwertet», nach rechts «Entsorgt», mit «Rückgängig» (ADR-0046) | – |
| **Auswählen** (wie in iOS) | `useSelection`, `SelectableRow`, `SelectionBar`, `useMoveSelected` | mehrere Artikel antippen und gemeinsam verschieben; was nicht an den neuen Ort passt, bleibt und wird genannt | – |
| **Lang drücken und ziehen** | `useDragToLocation`, `dropTargetFrom` | ein Artikel (oder alle ausgewählten) hängt am Finger und landet auf dem Lagerort-Tab oder dem Topf, über dem du loslässt; die Knöpfe «Verschieben nach» und die Töpfe bleiben der barrierefreie Weg | – |
| **Töpfe** (ADR-0055) | `SettlePots`, `useSettleSelected`, `SettleAction` | vier Felder unter den Lagerort-Tabs im Auswahlmodus: Verwertet (grün), Entsorgt (rot), Verarbeiten, Nachkaufen; antippen oder die Auswahl hineinziehen | – |
| **Laden-Buchstabe** | `ShopBadge`, `shopMark` (PDF) | ein Buchstabe pro Laden im Stil seines Schilds (Coop, Migros, Denner, Lidl, Aldi), immer neben dem Namen; nie die geschützten Marken selbst (P24 im Parkplatz) | – |
| **Alle übernehmen** | `ReceiptReview`, `batchTotals` | mehrere Quittungen auf einer Seite prüfen und mit einem Knopf in den Vorrat legen | – |
| **Einkaufsliste aus einem Satz** (K14) | `parseShoppingText` | Ein frei getippter oder per Tastatur-Mikrofon diktierter Satz wird zu einem Listeneintrag pro Produkt, mit Menge und Einheit, wenn genannt; läuft nur auf dem Gerät | – |
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
