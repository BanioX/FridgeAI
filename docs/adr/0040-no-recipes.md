# ADR-0040: Rezepte und der Tab «Kochen» fallen weg

- **Status:** angenommen; teilweise abgelöst durch [ADR-0048](0048-recipes-return-under-wissen.md) (Rezepte kehren unter «Wissen» zurück)
- **Datum:** 2026-11-08
- **Entscheid von:** Alban

## Kontext

Alban (8.11.2026): «Ich will den Kochen-Tab wegbekommen. Zwar kann ich mir vorstellen, später mal Rezeptempfehlungen zu haben, aber aktuell ist es so weit out of scope, wie es nur geht.»

Rettich hatte:
- einen Tab «Kochen» mit rund 30 eigenen Rezepten, gereiht nach bald ablaufenden Zutaten;
- die Rezeptseite mit «Da / Fehlt» und «nach dem Kochen abbuchen»;
- eine Rezeptidee auf Start;
- die Abfragen `recipes.suggest`, `recipes.list` und `recipes.get` sowie den Port `RecipeProvider`.

## Entscheid

1. **Alles zu Rezepten wird gelöscht, nicht nur versteckt:** Code, Daten, Tests, Texte und die Berechtigung `recipes:read`. Ungenutzter Code wäre technische Schuld (Regel 9).
2. **Die Schnittstelle v1 verliert drei Abfragen:** `recipes.suggest`, `recipes.list` und `recipes.get`. Das bricht keine Nutzer:innen: Es gibt noch keine öffentliche API, keinen MCP-Server und keine Freigaben (`Grant`) mit `recipes:read`.
3. **Alte Links** auf `/cook` und `/recipes/…` führen auf Start, auch Verknüpfungen auf dem Home-Bildschirm.
4. **Die Leiste** ist vorübergehend **Start · Vorrat · ＋ · Mehr**. Der Platz von «Kochen» geht an «Wissen» (Food Facts und Haltbarkeit, eigener PR).
5. **Wiederherstellen:** Der letzte Stand mit Rezepten ist Version **v0.9.0** (Tag). Kommen Rezeptempfehlungen später zurück, beginnt das bei diesem Tag und einem neuen Entscheid.

## Folgen

- **Rund 1500 Zeilen weniger.** Die App ist schlanker, und Start zeigt keine Rezeptidee mehr.
- **«Nach dem Kochen abbuchen» (R-03) fällt weg.** Abbuchen geht weiter über die Artikelseite, das Wegwischen und den Kühlschrank-Check.
- **Ideen und Parkplatz** behalten Rezepte als mögliche spätere Erweiterung, zum Beispiel Partner-Rezepte oder KI-Rezepte mit Einwilligung.
