# ADR-0038: Haltbarkeits-Stufe pro Kategorie, und neue Kategorien für Saucen und Dips

- **Status:** angenommen
- **Datum:** 2026-11-08
- **Entscheid von:** Claude, auf Albans Brainstorming; Alban kann ihn jederzeit ändern

## Kontext

Alban (8.11.2026) wollte drei Dinge:
- **Haltbarkeit pro Kategorie:** «Jede der Kategorien hat einen Haltbarkeitsscore.»
- **Robustes in Ruhe lassen:** «Du musst dich nicht kümmern, ein Eis oder ein Getränk zu erfassen, so was wird nie kaputt gehen. Aber ein Joghurt, eine Salatsauce, ein Fleisch, das frisch ist: so was musst du intelligent einbauen.»
- **Die typischen Fehlkäufe:** «Was ich oft wegwerfe, sind Guacamole, Hummus, Mayonnaise oder Tomatenmark, so die typischen mal gekauft, nie gebraucht.»

Der Katalog kannte schon vieles:
- **Milchprodukte als eigene Gruppe:** Milch liegt dort und nicht bei den Getränken.
- **Convenience:** «Fertiggerichte & Salate» mit Verbrauchsdatum.
- **Haltbarkeit nach dem Öffnen:** Mit «Geöffnet» wird das Datum kürzer.

Saucen, Dips und Tomatenmark landeten aber in «Sonstiges». Dort steht keine Haltbarkeit nach dem Öffnen, und genau diese Produkte verderben offen in wenigen Tagen.

## Entscheid

1. **Drei neue Kategorien:**

   | Kategorie | Typische Produkte | Haltbarkeit | Offen |
   | --- | --- | --- | --- |
   | Dips & Aufstriche | Hummus, Guacamole, Tzatziki | Kühlschrank 10 Tage, tiefgekühlt 60 Tage | 3 Tage |
   | Saucen & Dressings | Mayonnaise, Ketchup, Senf, Salatsauce, Currypaste | Vorrat 1 Jahr | 30 Tage |
   | Tomatenmark & Pesto | Tomatenmark, Pesto | Vorrat 2 Jahre | 5 Tage |

   Die Tipps nennen den Ausweg: die kleine Packung, die Tube statt der Dose, Reste portionsweise einfrieren.
2. **Haltbarkeits-Stufe** (`perishability`), berechnet aus dem Katalog, nicht gespeichert:
   - **heikel:** Verbrauchsdatum, oder ungeöffnet höchstens 14 Tage am besten Ort. Das sind Milch, Joghurt, Rahm, Frischkäse, Fleisch, Fisch, Dips, Fertiggerichte, Salat und Beeren.
   - **mittel:** bis 60 Tage, also Butter, Hartkäse, Eier, Äpfel, Rüebli und Kartoffeln.
   - **robust:** länger. Das sind Getränke, Glace, Tiefkühlware, Pasta und ungeöffnete Saucen.

   Der «beste Ort» ist der längere Wert von Kühlschrank und Vorrat, ohne Tiefkühler, ausser die Ware gehört nur dorthin (Glace).
3. **Wer Aufmerksamkeit braucht** (`needsWatching`): eine geöffnete Packung, ein Datum innerhalb von 7 Tagen oder alles, was nicht robust ist.
   - Der Kühlschrank-Check fragt nur diese Artikel ab. Die Cola und der ungeöffnete Senf im Kühlschrank fallen weg.
   - Die Artikelseite zeigt die Stufe, und solange die Packung zu ist, auch «offen etwa N Tage haltbar».

## Später

- **Quittung in vier Schritten:** Das Datum nur bei heiklen Artikeln fragen.
- **Nicht gebaut:** «Gibt es auch kleiner» mit konkreten Produkten und Preisen. Dafür bräuchte es Daten der Händler, und echte Händler-Anbindungen gibt es nur über Mocks.

## Folgen

- Die Stufe ändert sich mit dem Katalog von selbst. Eine Kategorie mit neuer Haltbarkeit braucht keinen zweiten Eintrag.
- Mit dem Verbrauchsdatum ist eine Kategorie immer heikel, auch wenn die Tage länger wären (Rauchlachs).

## Nachtrag (8.11.2026): Von der Theke

Alban: «Wenn ich eine Packung Mozzarella kaufe, ist diese verschweisst. Wenn ich sie frisch an der Theke kaufe, ist das eine andere Geschichte.»

- **Katalog-Feld `soldLoose`:** Kategorien, die es auch offen an der Theke gibt, tragen das Feld. Das sind Hartkäse, Frischkäse und Mozzarella, Aufschnitt, Würste, Rauchlachs und Dips. Ein Schema-Test verlangt dafür eine Haltbarkeit nach dem Öffnen.
- **Beim Erfassen:** Steht so ein Artikel im Kühlschrank, fragt Rettich «Wie gekauft? Verpackt / Von der Theke». Mit «Von der Theke» ist der Artikel ab dem Kauftag geöffnet (`openedOn`). Das Datum folgt der bestehenden Regel nach dem Öffnen: Mozzarella hält dann etwa 3 Tage statt 10.
- Frisches Fleisch und frischer Fisch brauchen den Schalter nicht, sie haben schon das kurze Verbrauchsdatum.

**Nachtrag (12.11.2026): «Von der Theke» wird gespeichert.** Alban: «Bei geöffnet kommt dann der Badge von der Theke, was ja falsch ist.» Bisher wurde «Von der Theke» erraten: Kategorie mit `soldLoose`, am Kauftag geöffnet. Wer eine verschweisste Mozzarella am Kauftag öffnet, sah deshalb «Von der Theke» statt «Geöffnet».
- **Neu:** Der Artikel trägt `fromCounter: true`, gesetzt beim Erfassen mit «Von der Theke» (`inventory.addItem`, Feld `fromCounter`; ohne `openedOn` gilt er ab heute als geöffnet). Das Badge liest nur noch dieses Feld.
- **Ältere Theken-Artikel** ohne das Feld zeigen «Geöffnet». Das ist die sichere Richtung, und sie sind nach wenigen Tagen verbraucht, darum keine Datenmigration.

## Nachtrag (8.11.2026): Das wirfst du oft weg

Alban: «Oder man kauft eine Riesenpackung, aber benutzt sie selten. Da vielleicht smarte Hinweise: Dieses Produkt gibt es auch in kleineren Grössen.»

- **Neue Abfrage `products.wasteHabits`:** Kategorien, aus denen in den letzten 90 Tagen mindestens zweimal etwas weggeworfen wurde, mit den Produktnamen (neueste zuerst) und dem ersten Tipp der Kategorie. Gegessenes, Rückgängig-Gemachtes und Älteres zählt nicht.
- **Beim Erfassen** einer solchen Kategorie steht oben eine Tipp-Karte, zum Beispiel: «Tzatziki, Hummus Natur: in den letzten 3 Monaten 2× weggeworfen. Offen hält ein Dip nur wenige Tage: lieber die kleine Packung kaufen.»
- **Nur eigene Daten**, berechnet auf dem Gerät. Nichts verlässt es.
- **Konkrete kleinere Produkte** mit Preisen sind nicht gebaut, weil sie Daten der Händler brauchen.

## Nachtrag (8.11.2026): Score von 1 bis 10

Alban: «Score von 1 bis 10, entweder nach verderblich oder haltbar. Was macht mehr Sinn?» Entscheid: **Haltbarkeit, 10 = hält am längsten.**
- **Warum Haltbarkeit:** «Haltbar» steht auf jeder Packung, und eine hohe Zahl liest man als gut.

**Der Score** (`shelfScore`) kommt aus den Tagen, ungeöffnet am besten Ort, in etwa doppelten Schritten:

| Score | hält bis | Beispiele |
| --- | --- | --- |
| 1 | 2 Tage | Hackfleisch |
| 2 | 4 Tage | Fertiggerichte |
| 3 | 1 Woche | Milch, Salat |
| 4 | 2 Wochen | Joghurt, Hummus |
| 5 | 1 Monat | Hartkäse, Eier |
| 6 | 2 Monate | Butter |
| 7 | 6 Monate | Saft |
| 8 | 1 Jahr | Getränke, Saucen |
| 9 | 3 Jahre | Pasta, Konserven |
| 10 | länger | Notvorrat |

- **Geöffnet** zählen die Tage nach dem Öffnen: Hummus fällt auf 2, Tomatenmark auf 3, Mayonnaise auf 5.
- **Mit Verbrauchsdatum** höchstens 3.
- **Die drei Stufen** sind Bereiche des Scores: heikel 1–4, mittel 5–6, robust 7–10. Am Kühlschrank-Check ändert sich nichts.
- **Die Artikelseite** zeigt einen kleinen Ring wie im Bericht, mit «Haltbarkeit 4/10 · heikel». Rot heisst heikel, Weizen mittel, Smaragd robust.
