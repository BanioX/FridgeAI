# ADR-0051: Badges am Artikel, «Aufgetaut» und der Einfrier-Hinweis

- **Status:** angenommen
- **Datum:** 2026-11-11
- **Entscheid:** Alban (Idee R2-1), Claude (Umsetzung)

## Kontext

Der Zustand eines Artikels (eingefroren, aufgetaut, geöffnet, offen gekauft) war nur in der Meta-Zeile oder gar nicht sichtbar. Wer Salat oder Eier einfror, bekam keinen Hinweis, dass sie sich nicht eignen.

## Entscheid

- **Badges:** `itemBadges(item, today)` in `packages/core` liefert die Arten in fester Reihenfolge (Eingefroren oder Aufgetaut, dann Von der Theke oder Geöffnet). Eine kleine Komponente `ItemBadges` zeigt sie: in Zeilen höchstens zwei, auf der Artikelseite alle. Weitere Arten (`made`, `leftover`, `ready`) kommen mit ihren Funktionen.
- **Eingefroren** liest den Lagerort, nicht nur `frozenOn`: Nach «Rückgängig» bleibt `frozenOn` stehen, das Badge nicht.
- **Aufgetaut:** neues optionales Feld `thawedOn` am Artikel (alte Daten laden weiter). `inventory.move` setzt es beim Verlassen des Tiefkühlers und löscht es beim erneuten Einfrieren; dabei löscht es auch `frozenOn`. Beide Felder stehen jetzt in der Ansicht `InventoryItemView`.
- **Von der Theke** wird nicht eigens gespeichert (ADR-0038: Der Artikel gilt ab Kauftag als geöffnet). Das Badge steht, wenn die Kategorie `soldLoose` hat und `openedOn` dem Kauftag entspricht; es ersetzt «Geöffnet». Abkürzung: Wer so eine Packung am Kauftag öffnet, sieht ebenfalls «Von der Theke». Ein eigenes Feld lohnt erst, wenn das stört.
- **Einfrier-Hinweis:** `adviseFreezing(items)` in `packages/core` trennt Artikel, deren Kategorie keine Tiefkühl-Tage hat, von den übrigen und liefert den Grund (`freezeNote` im Katalog, nur wo etwas Konkretes bekannt ist; sonst der allgemeine Satz «Eignet sich nicht zum Einfrieren.» aus dem Textkatalog). Ein Blatt (`useFreezeHint`) fragt vor jedem Weg in den Tiefkühler: Artikelseite, «Verschieben nach», Ziehen auf den Tab. «Lieber nicht» verschiebt nur die geeigneten Artikel, «Trotzdem einfrieren» alle.
- **«Trotzdem einfrieren»:** `inventory.move` bekommt `allowUnsuitable`. Ohne Katalogwert behält der Artikel sein bisheriges Datum (nichts erfindet eine Tiefkühl-Haltbarkeit), `frozenOn` wird gesetzt. Ohne das Flag bleibt `unsuitable_location` wie bisher.

## Folgen

- Die Artikelseite bietet «Einfrieren» für jedes Lebensmittel an, nicht nur für einfrierbare.
- Kein neuer Datenfluss, keine Abhängigkeit.

## Nachtrag (12.11.2026): Selbst gemacht und Reste

Die Zustandsabzeichen für `origin` sind da (ADR-0052): «Selbst gemacht» (`made`) und «Reste» (`leftover`) stehen als ruhige Silber-Pillen vor den übrigen Abzeichen, in der Vorratsliste (höchstens zwei pro Zeile) und auf der Artikelseite. Die Startkarte «Wert im Kühlschrank» gibt `priceEstimated` an `itemValue` weiter, damit der Wert selbst gemachter Artikel, der von geschätzten Zutaten kommt, «etwa» zeigt.
