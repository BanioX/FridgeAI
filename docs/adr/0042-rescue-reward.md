# ADR-0042: Die Belohnung nach «Gerettet»: nüchtern, mit Betrag und Food Fact

- **Status:** angenommen
- **Datum:** 2026-11-08
- **Entscheid von:** Alban (kein «Danke», Food Facts), Umsetzung Claude

## Kontext

Seit ADR-0039 zählt eine Rettung nur, wenn du sie bestätigst. Alban fragte, was die Belohnung dafür ist. Seine Antwort auf Claudes Vorschlag (8.11.2026): «Rettich wächst ist cool, aber Danke sagen wir dem Nutzer nicht. Wie wäre es mit Food Facts als nützliche Infos?»

Eine Belohnung, die nach Lob klingt, nutzt sich schnell ab und wirkt bei Erwachsenen bevormundend. Was bleibt, ist ein Gefühl von Wirkung: Was war es wert, was kommt im Monat zusammen? Dazu etwas, das beim nächsten Mal hilft.

## Entscheid

1. **Nach «Ja, gerettet»** steht im Vorrat statt «Joghurt gegessen.»: «Gerettet: Joghurt, CHF 2.10.» Darunter «Diesen Monat gerettet: CHF 18.40» und ein Food Fact mit «Wusstest du?». Rückgängig machen bleibt wie bisher.
2. **Kein «Danke»**, kein Lob, keine Ausrufezeichen. Die Zahl spricht für sich.
3. **Ehrlicher Betrag:** Ohne Preis von der Quittung ist der Wert eine Schätzung aus der Kategorie und heisst dann «etwa CHF 1.20». Dafür liefert `inventory.recordOutcome` jetzt `valueRappen` und `valueEstimated`.
4. **Der Monat** zählt vom 1. bis heute, mit derselben Abfrage wie Start (`stats.waste`, nur bestätigte Rettungen).
5. **Food Facts** stehen im Textkatalog (`messages.knowledge.facts`). `factFor(seed)` wählt einen aus: nach einer Rettung nach dem Eintrag, im Tab «Wissen» nach dem Tag. Dieselbe Rettung zeigt so nach einem Neuladen denselben Fact, der Tab einen pro Tag.
6. **Quellenregel:** Ein Fact mit einer Zahl nennt seine Quelle (BAFU, BLV), ein Test prüft das. Zahlen zur Schweiz kommen nur aus geprüften Quellen. Die Angaben zum Food Waste in der Schweiz gehen je nach Quelle weit auseinander; Rettich nutzt darum nur die Aussage «Rund ein Drittel der Lebensmittelverluste der Schweiz entsteht in den Haushalten (BAFU)». Die übrigen Facts sind Küchenwissen ohne Zahlen.

## Folgen

- Die Bestätigung lohnt sich sichtbar, ohne die Zahlen aufzublasen.
- Der wachsende Rettich auf Start folgt in ADR-0043: ein Blatt pro Rettung im Monat, «Vorbild» als oberste Stufe.
- Neue Facts brauchen nur einen Eintrag im Textkatalog.
