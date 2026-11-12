# ADR-0064: Geschätzte Nährwerte für frische Lebensmittel (BLV)

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Claude (Albans Frage vom 12.11.2026)

## Kontext

Alban: «Kannst du von Frischprodukten wie Thunfischsteak oder Rindshack, Pouletbrust, Äpfel etc. Nährwerte schätzen und das auch so deklarieren: geschätzt, da unverarbeitetes Produkt.» Frisches hat keinen Barcode, also keine Werte aus Open Food Facts.

**Quelle:** Schweizer Nährwertdatenbank des BLV, «Generische Lebensmittel» V 7.1 (01.07.2026), Excel-Download von [naehrwertdaten.ch](https://naehrwertdaten.ch/de/downloads/). Lizenz, Wortlaut der Download-Seite (geprüft 12.11.2026): «Das Herunterladen ist kostenlos und die Daten dürfen unter Angabe eines Quellenvermerks auch für kommerzielle (z.B. Einbindung in Nährwertberechnungssoftware oder Ernährungstagebuch-App) und wissenschaftliche Zwecke verwendet werden.» Quellenvermerk in der App: «Quelle: Schweizer Nährwertdatenbank V 7.1, BLV». Werte pro 100 g essbarer Anteil.

## Entscheid

1. **Berechnet, nicht gespeichert.** `toView` ergänzt die Schätzung, wenn das Produkt keine eigenen Nährwerte hat: `nutrition` mit `source: 'blv'` und das neue, optionale Feld `nutritionFood` («Thunfisch, roh»). Eigene Werte (Open Food Facts, Foto, von Hand) gewinnen immer. In der Datenbank steht nichts; ein neuer Stand der Datenbank gilt sofort für alles.
2. **Nur sichere Treffer.** Nur Kategorien unverarbeiteter Frischware (Fleisch, Geflügel, Hackfleisch, frischer Fisch, Obst, Gemüse, Pilze, Kräuter, Eier), nie Aufschnitt, Wurst, Rauchlachs, Konserven, Fertiges oder Tiefkühlmenüs. Der Name wird wie in `matchCategoryByName` gelesen (ganzes Wort oder Wortende, Wortgruppen, längstes Stichwort gewinnt). Verarbeitungswörter im Namen («Rauch», «paniert», «Curry», «Fertig», «in Öl», «vegan», «mit …») sperren die Schätzung. Kein sicherer Treffer: keine Schätzung, lieber nichts als falsch. Eine Kategorie, die genau ein Lebensmittel ist (Äpfel, Bananen, Rüebli, Tomaten, Gurken, Eier), dient als Rückfall.
3. **Deutlich als Schätzung.** Die Tabelle heisst «Nährwerte pro 100 g · geschätzt», darunter «Durchschnitt für Thunfisch, roh. Unverarbeitet, darum ohne Etikett.» und der Quellenvermerk. Ein Foto der Nährwerttabelle (ADR-0028) bleibt möglich und ersetzt die Schätzung.
4. **Mitgeliefert, kein Datenfluss.** Die Werte (rund 150 Lebensmittel, je eine Zeile) liegen als `packages/core/src/nutrition/fresh-nutrition.data.ts` im Code; nichts verlässt das Gerät. Keine neue Abhängigkeit.
5. **Erneuern:** `node scripts/catalog/blv-nutrition.mjs <Schweizer_Nahrwertdatenbank.xlsx>` liest die Excel-Datei (ohne Bibliothek) und die Zuordnung `scripts/catalog/blv-fresh.json` (BLV-ID, Stichwörter, Kategorie-Rückfall) und schreibt die Datei neu. Die Excel-Datei selbst kommt nicht ins Repo. Fehlende Werte («k.A.») bleiben weg.

## Folgen

- Die Werte sind Durchschnitte roher Ware; Zubereitung, Sorte und Fettanteil ändern sie. Deshalb «geschätzt» und der Name des Lebensmittels.
- Auf der Artikelseite wirkt die Schätzung, im Export und in den Auszügen nicht (berechnet, nicht gespeichert).
- Bei der Kategorie-Vermutung nicht erkannte Namen (z. B. «Crevetten» landet in «Sonstiges») bekommen erst nach dem Wechsel der Kategorie eine Schätzung; die Stichwörter der Kategorien sind ein eigener Auftrag.
