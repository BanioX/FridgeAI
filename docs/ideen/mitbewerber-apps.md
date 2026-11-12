# Von anderen Apps lernen (12.11.2026)

Alban (12.11.2026): «Kopieren ist doch erlaubt, mach aber nicht Feature-Copy, sondern lerne von den anderen Apps, quasi als Ideensammlung.» Gesucht wurde auch «Optius»; unter diesem oder einem ähnlichen Namen gibt es keine App (Websuche, 12.11.2026). Angeschaut: Restlos, FoodShiner, Grocy, FridgeX, Fridgify, Kellr, NoWaste, VorratsApp, Stökk, Speisekammer, Too Good To Go, Bring!, Mealime, Paprika, KitchenPal, Pantry Check. Die Fakten stammen aus Suchergebnissen und Store-Texten, Preise sind Richtwerte.

## Was sich durch alle Apps zieht

1. **Erfassen ist die grösste Hürde.** Manuelles Eintippen ist der häufigste Grund aufzuhören; wer Quittung oder Datum scannt, wirbt genau damit ([Fridgify, iphone-ticker](https://www.iphone-ticker.de/geheimtipp-fridgify-app-verwaltet-vorraete-und-erinnert-an-ablaufdaten-281021/), [NoWaste-Bewertungen](https://justuseapp.com/en/app/926211004/nowaste-food-inventory-list/reviews)). Rettich hat Quittung, Barcode und Satz; das ist der richtige Schwerpunkt.
2. **Bezahlschranken bei Kernfunktionen** ärgern: Erinnerungen nur in Pro (NoWaste, [Verbraucherzentrale](https://www.verbraucherzentrale.de/wissen/umwelt-haushalt/apptest-nowaste-lebensmittelliste-die-digitale-speisekammer-95921)), 10 Artikel gratis (Restlos, [App Store](https://apps.apple.com/de/app/restlos/id6754604227)). Gratis-Apps werben mit «ohne Limit, ohne Werbung».
3. **Vertrauen und Datenverlust**: «Glitchy, and lost all my food», Sync, der trotz Bezahlung nicht geht ([Pantry Check](https://justuseapp.com/en/app/966702368/pantry-check-grocery-list/reviews)). Rettich ist local-first: die Daten liegen sicher auf dem Gerät, aber nur dort. Darum zeigt Rettich die letzte Sicherung offen (siehe unten).

## Sortiert für Rettich

| Nr. | Idee (gelernt von) | Nutzen | Aufwand | Stand |
| --- | --- | --- | --- | --- |
| M1 | **Sichtbare Sicherung** (gegen den Datenverlust in Bewertungen) | «Letzte Sicherung: …» unter «Deine Daten», einmal im Monat ein ruhiger Hinweis auf Start | S | **umgesetzt** (12.11.2026) |
| M2 | **Doppelkauf mit Ort** (Grocy, Pantrist: Liste kennt den Vorrat) | «Noch da: 1 l · Türfach» auf «Nachkaufen» | S | **umgesetzt** (#249) |
| M3 | **Mindestbestand** füllt «Nachkaufen» von selbst (Grocy, Pantrist) | Die Liste schreibt sich; «Grundvorrat» gibt es bei den Rezepten schon | M | **umgesetzt** (12.11.2026, «Immer da haben» auf der Artikelseite, ADR-0059) |
| M4 | **Mehrere auf einmal ändern** (FoodShiner Batch) | Datum, «Angebrochen», Person für die Auswahl | S–M | **umgesetzt** (12.11.2026, «Ändern» im Auswahlmodus) |
| M5 | **Etiketten mit QR** für Dosen und Fächer (Stökk, Grocy) | Reste-Dose scannen = abschliessen; Fach scannen = «Wo ist was?» | M | später (O10) |
| M6 | **Wochenplan, der den Vorrat bucht** (FoodShiner, Paprika, Grocy) | Planen mit dem, was da ist, Lücken auf die Liste | L | später |
| M7 | **Datum per Kamera lesen** (Kellr) | Kein Tippen des Datums | L | später, auf dem Gerät (OCR ist schon da) |
| M8 | **Tägliche Erinnerung «Heute retten»** (fast alle) | Handeln, bevor es verdirbt | M | braucht Push über einen Dienst: neuer Datenfluss, Entscheid Alban ([`benachrichtigungen.md`](./benachrichtigungen.md)) |
| M9 | **Widget auf dem Home-Bildschirm** | Anstoss ohne App zu öffnen | L | nur nativ ([`app-stores.md`](./app-stores.md)) |
| M10 | **Teilen im Haushalt** (FoodShiner, Fridgify mit Ende-zu-Ende-Verschlüsselung) | WG sieht denselben Kühlschrank | L | Meilenstein C; Fridgify zeigt, dass es verschlüsselt geht |
| M11 | **Reste mit Standard-Haltbarkeit je Gericht** (LeftoverMate, ok2eat) | Gekochtes bekommt ein vernünftiges Datum | S | prüfen, was «Reste» heute schätzt |
| M12 | **Kundenkarten-Mappe** (Bring!) | Karte an der Kasse | M | nein: weg vom Kern, nur Kopie |
| M13 | **Too Good To Go verlinken** | Schweizer Überraschungstüten | S | höchstens ein Link; keine Anbindung (harte Regel) |

**Preise der anderen** (Richtwerte): NoWaste Pro etwa 6,49 EUR pro Jahr, Speisekammer 29,99 EUR pro Jahr oder 99,99 EUR einmalig, Stökk 12,99 USD einmalig, Fridgify und Kellr gratis. Für die Preisfrage von Rettich: [`monetarisierung.md`](./monetarisierung.md); Grenzen entscheidet Alban.
