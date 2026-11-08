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

- **Von der Theke** (Alban: «Mozzarella verschweisst oder frisch an der Theke ist eine andere Geschichte»): Beim Erfassen ein Schalter «Von der Theke», dann gilt die Haltbarkeit ab Kauf wie geöffnet.
- **Das wirfst du oft weg:** Aus dem eigenen Verlauf, nur auf dem Gerät, ein Hinweis beim Erfassen, zum Beispiel «kleinere Packung», «Tube» oder «Reste einfrieren».
- **Quittung in vier Schritten:** Das Datum nur bei heiklen Artikeln fragen.
- **Parkplatz:** «Gibt es auch kleiner» mit konkreten Produkten und Preisen. Dafür bräuchte es Daten der Händler, und echte Händler-Anbindungen gibt es nur über Mocks.

## Folgen

- Die Stufe ändert sich mit dem Katalog von selbst. Eine Kategorie mit neuer Haltbarkeit braucht keinen zweiten Eintrag.
- Mit dem Verbrauchsdatum ist eine Kategorie immer heikel, auch wenn die Tage länger wären (Rauchlachs).
