# ADR-0048: Rezepte kehren zurück, als Abschnitt unter «Wissen»

- **Status:** angenommen
- **Datum:** 2026-11-11
- **Entscheid von:** Alban (Rückkehr, kein sechster Tab), Claude (Ort und Umfang)

## Kontext

ADR-0040 hat die Rezepte am 8.11.2026 entfernt und festgehalten: Kommen sie zurück, beginnt das beim Tag v0.9.0 und einem neuen Entscheid. Alban (11.11.2026): «Baue weiter an den Rezepten. Wir brauchen kein 6. Menü, aber einen Ort, wo Rezepte reinkommen.»

## Entscheid

1. **Rezepte sind ein Abschnitt im Tab «Wissen»**, oben auf der Seite: «Rezepte». Zuerst «Heute kochen» (bis zu drei Rezepte, gereiht nach dem, was bald abläuft), darunter die Zeile «Alle Rezepte».
2. **Es bleiben fünf Tabs:** Start · Vorrat · ＋ · Wissen · Mehr (ADR-0031, ADR-0041). Es gibt keinen Tab «Kochen».
3. **Adressen:** `/knowledge/recipes` (alle Rezepte) und `/knowledge/recipes/:id` (ein Rezept), beide mit «‹ Wissen» oben. Alte Links `/recipes/:id` führen auf das neue Rezept, `/cook` weiter auf Start.
4. **Wiederhergestellt aus v0.9.0:**
   - das Modell (`packages/core/src/recipes/recipe.ts`);
   - die für Rettich geschriebenen, kuratierten Rezepte (`recipes.de-CH.ts`, mit Zutaten-Kategorien des heutigen Katalogs);
   - die Abfragen `recipes.suggest`, `recipes.list` und `recipes.get` mit der Berechtigung `recipes:read`.
5. **Die Anwendungsfälle liegen in `packages/core/src/application/recipes.ts`** (ADR-0034), nicht mehr in der Datenschicht. Der Port `RecipeProvider` kommt zurück; die mitgelieferte Sammlung ist seine einzige Quelle.
6. **Die Rezeptseite** zeigt Minuten und Portionen, die Zutaten getrennt in «Da» und «Fehlt» im Vergleich mit dem Vorrat (Grundvorrat zählt als «Da»), und die Schritte. «Fehlendes auf die Liste» setzt jede fehlende, nicht optionale Zutat mit dem bestehenden `shopping.addItem` auf «Nachkaufen». Was schon auf der Liste steht, kommt nicht doppelt dazu.
7. **Eigene Rezepte («Meine Rezepte»)**, ein Ort, wo Rezepte hineinkommen, folgen in einem zweiten Schritt mit eigenem ADR-Nachtrag. Dort sind Speicher, Erfassen und Export zu klären.
8. **«Nach dem Kochen abbuchen» bleibt vorerst draussen** (R-03). Abbuchen geht weiter über die Artikelseite, das Wegwischen und den Kühlschrank-Check.

## Folgen

- **Kein neuer Datenfluss:** Rezepte und Abgleich liegen auf dem Gerät, es gibt kein Netz und keinen neuen Eintrag in den Nebenwirkungen.
- **Schnittstelle v1:** 35 statt 32 Operationen. Hinzufügen ist erlaubt (ADR-0005).
- **Start** zeigt keine Rezeptidee (anders als bis v0.9.0).
- **ADR-0040** gilt weiter für den Tab «Kochen», «Start» und «nach dem Kochen abbuchen»; die Löschung der Rezepte selbst ist damit abgelöst.
