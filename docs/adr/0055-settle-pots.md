# ADR-0055: Töpfe: Auswahl abschliessen

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Alban (Idee), Claude (Umsetzung)

## Kontext

Alban (12.11.2026): «oben auch einen Verwertet oder Entsorgt, quasi grün und rot Kübel, so dass man per Drag and Drop auch verwerten, entsorgen, einfrieren, backen, kochen in Töpfe (Felder) legen kann, um die Ware zu quittieren.» Im Auswahlmodus des Vorrats («Auswählen», langes Drücken, Ziehen auf einen Lagerort-Tab) liess sich bisher nur verschieben. Wer fünf Dinge aufgebraucht hat, musste jedes einzeln wischen oder öffnen.

## Entscheid

1. **Vier Töpfe** unter den Lagerort-Tabs, nur im Auswahlmodus, in einem Bereich «Auswahl abschliessen»:
   - **Verwertet** (grün) und **Entsorgt** (rot) schliessen die Auswahl ab;
   - **Verarbeiten** öffnet `/add/process` mit allen gewählten Artikeln vorgewählt (ADR-0052; `?item=` darf jetzt mehrfach vorkommen);
   - **Nachkaufen** setzt die Produkte auf die Einkaufsliste, die Artikel bleiben im Vorrat.
   Einfrieren ist kein Topf: Der Tab «Tiefkühler» tut es schon, samt Einfrier-Hinweis (ADR-0051). Zwei Wege für dieselbe Sache wären Schulden.
2. **Antippen oder ziehen.** Jeder Topf ist ein echter Knopf (WCAG 2.5.7), Ziehen ist nur die Abkürzung. Beim Ziehen bekommen die Töpfe den gestrichelten Rand der Tabs, der Topf unter dem Finger hebt sich ab. Dafür trägt jedes Ziel `data-drop-target="location:fridge"` oder `"action:eaten"`, und `dropTargetFrom` liefert eine Vereinigung (`kind: 'location' | 'action'`).
3. **Verwertet und Entsorgt buchen den ganzen Rest** jedes Artikels mit `inventory.recordOutcome` (ohne Menge). Es gibt keine neue Operation in der Schnittstelle.
4. **Die Rettungsfrage wird einmal gestellt** (ADR-0039): Ist unter den gewählten Artikeln einer, der `canBeRescued` ist, fragt ein Blatt einmal «Ohne Rettich im Abfall gelandet?», «Nein» ist vorgewählt. Nur bei «Ja, gerettet» bekommen genau diese Artikel `rescued: true`; ein Gerettet zählt weiter nur, wenn es bestätigt ist. «Abbrechen» bucht nichts. Ohne solche Artikel kommt kein Blatt.
5. **Kein Grund bei Sammel-Entsorgt.** Wer mehrere Dinge auf einmal in den Abfall legt, wird nicht nach einem Grund pro Artikel gefragt; das Wischen kennt ihn auch nicht. Wer den Grund festhalten will, öffnet den Artikel. Ist ein MHD-Artikel dabei, trägt die Meldung ruhig «Ist das noch gut?» (K3), wie beim Wischen.
6. **Rückgängig.** Eine Meldung wie beim Wischen: «Joghurt verwertet.» oder «3 Artikel entsorgt.» mit «Rückgängig», das alle Ausgänge per `inventory.undoOutcome` zurücknimmt. Nach vollem Erfolg endet der Auswahlmodus; bei Teil-Fehlern steht, was nicht geklappt hat, und diese Artikel bleiben gewählt. «Nachkaufen» hat kein Rückgängig: Der Eintrag lässt sich auf der Liste entfernen.
7. **Wortwahl:** Die Einkaufsliste heisst in der App «Nachkaufen» (Tab, Meldung nach dem Abschliessen eines Artikels), also sagen auch die Meldungen «steht bei «Nachkaufen»». Der Topf «Nachkaufen» nutzt `shopping.addItem` wie die Meldung nach dem Abschliessen und überspringt, was schon offen auf der Liste steht (`alreadyOnList`).

## Folgen

- Schnittstelle v1 bleibt unverändert; kein neuer Datenfluss, kein Speicher, keine Abhängigkeit.
- Die Tabs und die Töpfe sind nicht angeheftet: Wer weit unten zieht, erreicht sie nur, wenn sie im Bild sind (gilt schon für die Tabs). Ein angehefteter Kopf wäre ein eigener Entscheid.
- Eine Rettungsfrage für alle betroffenen Artikel gemeinsam ist gröber als die Frage pro Artikel auf der Artikelseite; wer es genau will, öffnet den Artikel.
