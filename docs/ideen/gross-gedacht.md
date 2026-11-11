# Gross gedacht: was Rettich begehrenswert macht

Alban, 11.11.2026: «Denke es gross. Was braucht es alles, um appealing zu sein?»

Vorschlag von Claude. Es gelten das Betriebsmodell (Alban allein, rund 2 Stunden pro Woche, [`fahrplan-12-monate.md`](./fahrplan-12-monate.md)) und Regel 5 in CLAUDE.md: Kosten, neue Datenflüsse und Partnerverträge entscheidet Alban.

## Der eine Satz

Niemand lädt eine «Food-Waste-App». Menschen wollen Geld sparen, weniger Stress beim Einkaufen und Kochen, und ein gutes Gewissen ohne Aufwand. **Rettich ist der Mitbewohner, der weiss, was im Kühlschrank ist, und dir sagt, was du heute essen solltest.** Claim bleibt: «Wirf kein Geld in den Abfall.»

## Neun Ebenen

| # | Ebene | Was es braucht | Stand |
| --- | --- | --- | --- |
| 1 | **Die ersten 60 Sekunden** | Kein Konto, kein Formular. Erste Quittung → «Dein Kühlschrank ist CHF 84 wert», alles erkannt, mit Laden-Buchstaben und geschätztem Ablaufdatum. Oder ein Satz: «Milch, Eier, Brot» | Quittung und Start-Einführung da; Satz wird gebaut |
| 2 | **Null Aufwand beim Erfassen** | Quittung aus der Migros- oder Coop-App mit «Teilen → Rettich» (zwei Tipps). Sprache. Ablaufdatum aus 2D-Codes. Später: Einkauf erfasst sich beim Bezahlen selbst (digitale Quittung, P1) | Teilen braucht die native App (Januar) |
| 3 | **Der tägliche Haken** | Auslöser (Erinnerung am Morgen, Zahl am App-Symbol, Widget) → eine Handlung (wischen) → Belohnung (gerettete Franken, der Rettich wächst) → Investition (gepflegter Vorrat macht Rettich klüger) | Belohnung da; Auslöser fehlen |
| 4 | **Magie** | «Heute Abend Zürcher Geschnetzeltes» → was du hast, was fehlt, was zuerst weg muss. «Was koche ich mit dem, was abläuft?» Später: ein Foto vom offenen Kühlschrank erkennt, was drin ist (braucht Cloud-KI) | Entscheid Alban (ADR-0040, Kosten) |
| 5 | **Freude** | Ruhige Animationen, ein Tick in der Hand beim Wischen, der wachsende Rettich. Monats-Bilanz zum Teilen. **«Dein Rettich-Jahr»** im Dezember, wie Spotify Wrapped: gerettete Franken, Lieblingsladen, das am häufigsten gerettete Lebensmittel, als Bild auf dem Gerät erzeugt | Rettich wächst; Bilanz-Bild fehlt |
| 6 | **Gemeinsam** | Haushalt teilen in WG und Familie, «wem gehört was», Kosten teilen («wer schuldet was», der Kern der ursprünglichen Vision), Retter:in des Monats im Haushalt (freundlich, ohne Rangliste nach aussen) | Braucht Sync (Alban) |
| 7 | **Vertrauen als Funktion** | Alles auf dem Gerät, kein Konto, kein Tracking, Schweizer App. **Rückruf-Warnung:** Wird ein Produkt in deinem Vorrat öffentlich zurückgerufen (RecallSwiss, BLV), sagt Rettich es dir. Die Liste wird geholt, deine Daten bleiben auf dem Gerät | Rückruf: Quelle und Format prüfen |
| 8 | **Geld sichtbar** | Wert im Kühlschrank, Preis-Gedächtnis, Aktion erkannt, Ausgaben pro Monat und Laden aus den Quittungen («Was gebe ich fürs Essen aus?») | Wert und Preise da; Ausgaben fehlen |
| 9 | **Marke, die man zeigt** | Der Rettich als Figur in leeren Zuständen und beim Teilen. Ruhige Sprache wie eine Privatbank (ADR-0047). Store-Seite, die in fünf Bildern eine Geschichte erzählt. Die Gründer-Geschichte («Student aus Aarau baut eine App gegen Food Waste») für die Presse | Sprache und Symbol da |

## Was bewusst nicht

- Keine Werbung im ersten Jahr, keine Kontopflicht, keine Mitteilungen ohne Nutzen.
- Keine Spielerei mit Punkten und Ranglisten nach aussen; Freude ja, Druck nein.
- Keine Kalorien und kein Ernährungstagebuch ([`komfort-und-geld.md`](./komfort-und-geld.md)).

## Reihenfolge für die nächsten drei Monate

Ausgewählt nach Wirkung auf «will ich haben» pro Aufwand, für einen Gründer mit 2 Stunden pro Woche.

| # | Was | Aufwand | Entscheid |
| --- | --- | --- | --- |
| 1 | Einkaufsliste aus einem Satz (Sprache über die Tastatur) | S | läuft |
| 2 | Monats-Bilanz als Bild zum Teilen | S | keiner |
| 3 | Native App mit «Teilen → Rettich» für Quittungs-PDFs, Erinnerung am Morgen, Widget | M | Alban: Store-Konten |
| 4 | Gericht-Check «Was brauche ich, was habe ich» mit eigener Liste auf dem Gerät | M | Alban: ADR-0040 |
| 5 | Rückruf-Warnung | S–M | Alban: neuer Abruf einer öffentlichen Liste |
| 6 | Store-Seite mit fünf Bildern und Gründer-Geschichte für die Presse | S | keiner |
| 7 | Haushalt teilen und Kosten teilen | L | Alban: Sync, Server |
| 8 | «Dein Rettich-Jahr» für Dezember 2027 | M | keiner |

## Die grossen Hebel (Parkplatz)

- **Einkauf erfasst sich selbst** über die digitale Quittung von Migros oder Coop (P1). Der grösste Einzelhebel für «null Aufwand», braucht einen Vertrag.
- **Foto vom Kühlschrank** erkennt Lebensmittel, mit Cloud-KI und Einwilligung.
- **Rettich in der Händler-App** als Modul (Lizenz pro Haushalt).
