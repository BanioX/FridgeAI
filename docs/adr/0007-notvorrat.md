# ADR-0007: Notvorrat als vierter Lagerort

- **Status:** angenommen
- **Datum:** 2026-11-06
- **Abweichung vom Brief:** §2.1 sieht drei feste Lagerorte vor. Alban hat am 6.11.2026 einen Langzeit-Vorrat verlangt («Use Case Militär oder Prepper … Nahrung mit 50 Jahren Laufzeit»).

## Kontext

Der Bund empfiehlt jedem Schweizer Haushalt einen Notvorrat (BWL, «Kluger Rat – Notvorrat»): Lebensmittel für rund eine Woche, 9 Liter Trinkwasser pro Person, regelmässig aufbrauchen und ersetzen, um Abfall zu vermeiden. Prepper und Organisationen lagern zudem Nahrung mit 25 bis 50 Jahren Haltbarkeit. Dieser Vorrat wird anders gelebt als der Alltagsvorrat: Er steht oft im Keller, wird selten angeschaut und braucht Warnungen Monate statt Tage im Voraus.

## Entscheid

1. `StorageLocation` erhält `reserve`, angezeigt als **«Notvorrat»** (offizieller Schweizer Begriff, verständlicher als «Langzeitvorrat» oder «Vorratskammer»). Akzentfarbe Oliv.
2. Haltbarkeiten bis **100 Jahre** (`36'500` Tage). Kategorien können einen eigenen Notvorrat-Wert haben; sonst gilt der Vorrats-Wert, sofern das Lebensmittel mindestens 90 Tage hält (Reis ja, Brot nein).
3. Neue Kategoriegruppe `reserve`: gefriergetrocknete Mahlzeiten (25 Jahre), Notrationen und Feldverpflegung (5 Jahre), Trinkwasser-Vorrat (2 Jahre); die gedruckten Daten haben immer Vorrang.
4. «Läuft bald ab» beginnt im Notvorrat **90 Tage** vorher (`soonThresholdFor`), damit Zeit zum Aufbrauchen und Ersetzen bleibt (Rotation statt Wegwerfen).
5. Die Datumserfassung deckt Jahrzehnte ab: Schnellwahl bis 50 Jahre (`expiryPresets`), `parseDateInput` mit Monat/Jahr (`12.2076`), GS1-Jahrhundertregel für 2D-Codes.

## Konsequenzen

- Vier Tabs im Vorrat (Schritt 3), Notvorrat-Artikel erscheinen nicht im täglichen «Heute retten», ausser sie sind innert 90 Tagen fällig.
- Reichweite («reicht für X Tage für Y Personen») und eine Checkliste nach Empfehlung des Bundes sind nicht gebaut.
