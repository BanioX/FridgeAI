# ADR-0073: Im Blick

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude, auf Albans Wunsch

## Kontext

Alban: «Einen Hinweis mit (i), Overlay: diesem Produkt besondere Beachtung schenken, weil teuer oder schnell verderblich. Smarte Übersichten, wo man denkt: geiles Feature. Immer dezent.» Bei vielen Artikeln im Vorrat geht unter, welche wirklich Aufmerksamkeit brauchen. Ein Hinweis, der oft erscheint, würde selbst zum Rauschen. Er muss selten bleiben, damit er etwas bedeutet.

## Entscheid

1. **Eine reine Regel im Kern** (`packages/core/src/attention.ts`, `attentionOf`): Sie liefert bis zu zwei Gründe, der wichtigste zuerst, und einen Tipp. Ohne Grund ist der Artikel nicht «im Blick».
2. **Die vier Gründe, in dieser Reihenfolge:**
   - **Verbrauchsdatum** (`use_by`): Datumsart «Verbrauchsdatum» und es läuft heute oder morgen ab. Abgelaufenes bekommt kein (i): Die Zeile sagt dort schon rot «Nicht mehr verwenden». Text: «Verbrauchsdatum: danach nicht mehr verwenden.»
   - **Heikel** (`perishable`): Die Kategorie ist heikel (Haltbarkeit 1 bis 4 nach ADR-0038, bei geöffneter Packung nach den Tagen nach dem Öffnen) und der Artikel ist geöffnet (das nahe Datum steht schon in der Zeile). Text: «Verdirbt schnell, offen hält es nur kurz.»
   - **Teuer** (`pricey`): Preis von mindestens 6.00 (600 in der kleinsten Einheit) und unter den drei teuersten aktiven Artikeln des Haushalts; gleiche Preise zählen alle mit. Text: «Teuer: CHF 12.90, eines der teuersten in deinem Vorrat.»
   - **Oft entsorgt** (`often_wasted`): Der Haushalt hat Artikel dieser Kategorie in den letzten 90 Tagen mindestens 2-mal entsorgt (bestehende Abfrage `products.wasteHabits`, ADR-0038). Text: «Das hast du schon 3-mal entsorgt.»
3. **Schwellen als benannte Konstanten:** `ATTENTION_SOON_DAYS = 1`, `PRICEY_MIN_RAPPEN = 600`, `PRICEY_TOP_COUNT = 3`, `MAX_ATTENTION_REASONS = 2`; die Schwelle für «oft entsorgt» ist `WASTE_HABIT_MIN_TIMES` aus ADR-0038.
4. **Tiefkühler und Notvorrat** bekommen nie «Verbrauchsdatum» oder «Heikel»: Dort hält das Lebensmittel lange, ein Datum ist kein Alarm. «Teuer» und «Oft entsorgt» gelten überall.
5. **Tipp, eine Zeile:** Lässt sich die Kategorie einfrieren und liegt der Artikel nicht im Tiefkühler, steht «Heute einfrieren hält es länger.», sonst der erste Tipp der Kategorie, falls sie einen hat.
6. **Wo es erscheint:**
   - In den Listenzeilen des Vorrats und bei «Heute retten» auf Start: ein kleines, graues (i) nach dem Namen. Es ist nicht antippbar (die Zeile ist schon ein Link und wischbar) und trägt den Text «Im Blick» für Screenreader.
   - Auf der Artikelseite: ein (i)-Knopf neben dem Titel (44 px Tippfläche, Name «Warum im Blick»). Er öffnet ein Overlay «Im Blick» mit den Gründen (je ein kleines Symbol) und dem Tipp in gedämpfter Schrift. Der Fokus bleibt im Overlay, Escape und «Schliessen» schliessen es, es bewegt sich nicht und beachtet damit `prefers-reduced-motion`.
   - Ein Hook (`useAttention`) berechnet die Gründe für Liste, Start und Artikelseite, damit alle dasselbe sagen.
7. **Nichts wird gespeichert:** Die Gründe werden bei jeder Ansicht aus Vorrat, Preisen und Journal berechnet. Nichts verlässt das Gerät.

## Folgen

- Der Hinweis erscheint bei wenigen Artikeln. Ist der Haushalt ohne Preise (zum Beispiel ohne Quittungen), entfällt «Teuer»; die anderen drei Gründe bleiben.
- «Oft entsorgt» gilt pro Kategorie, nicht pro Produkt, weil `products.wasteHabits` nach Kategorie zählt. Ein Joghurt mit zwei entsorgten Joghurts anderer Sorte ist damit im Blick.
- Die Schwellen sind Konstanten und lassen sich nach dem Pilot ohne Umbau anpassen.
- Die Liste liest dafür den Vorrat und die Abfrage `products.wasteHabits` ein zweites Mal; bei der Grösse eines Haushalts ist das vernachlässigbar.
- Nach dem Datum gibt es keinen Tipp: Einfrieren hilft dann nicht mehr (Review der Vorschau, 13.11.2026: das (i) war bei fast jedem Artikel zu sehen).

## Ergänzung 13.11.2026: das Zeichen im Text

Alban, 13.11.2026: «das Info i nicht in Klammern, sondern als eigenes Kreiszeichen». Wo ein Text das Zeichen nennt (Wissen → «Kurz erklärt» → «Im Blick»), steht im Textkatalog `{i}`, und `TextWithMarks` zeichnet daraus dasselbe i im Kreis wie in den Zeilen, so hoch wie die Buchstaben. Screenreader lesen «Info-Zeichen». Ein Test hält fest, dass kein Text der App «(i)» schreibt.
