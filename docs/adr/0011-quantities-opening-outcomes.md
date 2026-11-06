# ADR-0011: Mengen, Öffnungsregel und Abschliessen mit Grund

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban (6.11.2026): Mengen, «die Sinn machen» (Liter, Gramm, Becher, Cup …); «Grana Padano gültig bis März, aber nach dem Öffnen innert 3 Tagen» – ab dem Öffnen soll diese Regel gelten; quittieren können «50 % verbraucht» oder «1 Stück von 4»; beim Wegwerfen den Grund (z. B. abgelaufen) erfassen und tracken; weitergeben auch als Spende oder an Nachbarn.

## Entscheid

1. **Basiseinheiten** bleiben `g`, `ml`, `pcs` (rechnen, vergleichen, Statistik). Eingabe und Anzeige in natürlichen Einheiten: kg, cl, **dl** (Schweiz), l; `displayQuantity` wählt die passende (1500 g → 1.5 kg, 300 ml → 3 dl).
2. **Stück mit Verpackung:** `container` (Stück, Becher, Packung, Flasche, Dose, Glas, Bund, Beutel, Schachtel) und optional `packageSize` («Becher à 180 g»). So kennt die App bei «2 Becher» auch das Gewicht für den kg-Zähler.
3. **Anteile** (`portionChoices`): bei mehreren ganzen Stücken «1 · 2 · 3 von N · alles», sonst Bruchteile · alles; bei weniger als 20 g/ml nur «alles». Freie Eingabe bleibt immer möglich.
3a. **Portionierung pro Kategorie** (Ergänzung 6.11.2026, Alban: «Drittel, Viertel, Achtel, wo es Sinn macht … Eierpackungen oder Anzahl Bananen»): Jede Kategorie kann `portioning` haben, mit
   - Einheit und Verpackung, die das Erfassen vorschlägt: Bananen und Joghurt in Stück, Joghurt im Becher, Reis in Gramm, Milch in Millilitern;
   - üblichen Packungen in Stück: Eier 6 und 10, Getränke und Notwasser 6;
   - Teilern für Bruchteile: Kuchen und Pizza ⅛ · ¼ · ½, Hartkäse ⅓ · ¼, Brot ½ · ¼, Eier gar keine.

   Grosse Teiler bringen nur ihren Stammbruch (⅛, nicht ⅜), damit die Auswahl kurz bleibt. Bei Stückware gibt es Bruchteile eines Stücks, solange weniger als zwei übrig sind (der Rest vom Kuchen). Bei g/ml gelten sie für den Rest der Menge. Ohne eigene Regel gilt `DEFAULT_PORTIONING` (Stück, Viertel).
4. **Öffnungsregel:** Kategorien können `afterOpeningDays` haben (z. B. Rahm 3, Hartkäse 21, Konserven 3, Saft 5); ein Etikett («nach dem Öffnen innert 3 Tagen») überschreibt das pro Artikel. «Geöffnet» setzt `openedOn`, merkt das bisherige Datum (`sealedExpiresOn`, für Rückgängig) und setzt das Ablaufdatum auf das frühere von bisher und heute + N (`expirySource: after_opening`). So wirkt die Regel überall (Liste, Push, Statistik) ohne Sonderfälle.
5. **Abschliessen mit Grund:** `wasteReason` nur bei «weggeworfen» (abgelaufen, verdorben, zu viel gekauft, vergessen, schmeckt nicht, anderes); `sharedWith` nur bei «weitergegeben» (Haushalt, Nachbarschaft, Familie/Freunde, Spende, öffentlicher Kühlschrank). Beides optional, damit Abschliessen ein Tipp bleibt.

## Konsequenzen

- Der Vertrag erhält dazu `inventory.open` und optionale Felder für Grund, Empfänger, Verpackung und Packungsgrösse (nur Ergänzungen, kein Breaking Change).
- Statistik kann später nach Grund und Empfänger auswerten (A-03, Wirkungsberichte).
