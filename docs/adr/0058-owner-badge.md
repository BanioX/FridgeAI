# ADR-0058: Gehört: Initialen am Artikel

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Alban (Idee), Claude (Umsetzung)

## Kontext

Alban (12.11.2026): «Namens- oder Initialen-Badge, falls jemand sich selbst ein Dessert gekauft hat, das der andere nicht essen soll. Und wenn man es nicht taggt oder markiert, heisst das: du kannst es auch essen.» Gedacht für Paare, WGs und Büros. `InventoryItem.owner` (ein Mitglied oder `shared`) gab es im Modell schon, ohne Oberfläche und ohne Operationen für Personen.

## Entscheid

1. **Standard ist «Allen».** Ohne Markierung gehört ein Artikel dem ganzen Haushalt (`owner: 'shared'`). Nur wer etwas für sich kauft, markiert es: Die Initialen der Person stehen am Artikel (Vorrat, Start, Artikelseite).
2. **Die Markierung ist eine Höflichkeit, keine Sperre.** Nichts wird blockiert: Die Artikelseite sagt ruhig «Gehört Mia. Frag lieber, bevor du es verwertest.» Verwerten, Verschieben und Löschen gehen für alle.
3. **Personen sind nur Namen.** Seite «Personen» unter «Mehr» (`/more/people`): hinzufügen, umbenennen, entfernen. Kein Konto, keine Einladung. Namen sind pro Haushalt eindeutig (ohne Rücksicht auf Gross- und Kleinschreibung), damit «Gehört Mia» eindeutig bleibt.
4. **Ein Gerät, bis es Sync gibt.** Bis zum Abgleich (Meilenstein C) läuft Rettich auf einem Gerät, zum Beispiel einem gemeinsamen Tablet in der Küche. «Du» ist die Person, die das Gerät nutzt (`isSelf`); eigene Geräte pro Person kommen später. Die Seite sagt das offen.
5. **Entfernen:** Die Person bekommt `leftAt` (Zeile bleibt für den Verlauf, Abschlüsse behalten ihren Schnappschuss des Besitzers). Ihre Artikel gehören danach allen. Nicht entfernt werden können die Inhaberin des Haushalts (Rolle `owner`), die Person, die das Gerät nutzt, und die letzte Person. Vor dem Entfernen fragt die Seite nach und sagt, was mit den Sachen geschieht.
6. **Initialen** (`initialsOf`, reine Funktion in `packages/core`): die ersten Buchstaben der ersten zwei Wörter, gross («Mia Muster» gibt «MM», «Noah» gibt «N»). Würden zwei aktive Personen dieselben bekommen, nehmen beide die ersten zwei Buchstaben des Vornamens («Mi», «Ma»). Berechnet, nicht gespeichert.
7. **Farbe:** fünf ruhige Töne aus den vorhandenen Farbpaaren (Frisch, Eis, Weizen, Olive, Bald), nach der Reihenfolge der Person im Haushalt. Die Farbe stützt nur; Buchstaben und Name tragen die Bedeutung.
8. **Wo es erscheint:** Die Wahl «Gehört» (Chips «Allen» und je Person) steht unter «Mehr Angaben» beim Erfassen und auf der Artikelseite, beides nur ab zwei Personen. Bei einer Person bleibt die Oberfläche wie bisher.

## Folgen

- **Schnittstelle v1:** vier neue Operationen (`household.members`, `household.addMember`, `household.renameMember`, `household.removeMember`; `inventory.updateItem` kennt `owner`), drei neue Ereignisarten (`member.added`, `member.renamed`, `member.removed`). Eine ungültige Besitzerin (Fremde, ausgetretene Person) lehnt `inventory.updateItem` mit `invalid_owner` ab.
- **Datenrechte (ADR-0020):** Namen liegen schon in der Tabelle der Personen auf dem Gerät und gehören zu Export und Löschen. Kein neuer Datenfluss, kein neuer Speicher-Schlüssel.
- **Aufwand:** Zeilen mit Markierung fragen die Personen einzeln ab (kleine Tabelle); Zeilen ohne Markierung kosten nichts.
- **Offen:** Erinnerungs-Einstellungen für zusätzliche Personen (sie gehören erst mit Sync zu eigenen Geräten); Filter «Nur meine Sachen»; Hinweis beim Verwerten fremder Sachen (bewusst weggelassen, siehe Punkt 2).
- **Verworfen:** Sperre oder Bestätigung beim Verwerten (widerspräche Albans «du kannst es auch essen»); Pflichtfeld «Gehört» (mehr Tippen im Alltag).
