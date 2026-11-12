# ADR-0054: Abzeichen berechnen, nie speichern

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Alban (Idee, Katalog), Claude (Umsetzung)

## Kontext

Alban (11.11.2026): «Man kann auch Abzeichen gewinnen wie Koch, Sparsam, Überlebenskünstler.» [`docs/abzeichen.md`](../abzeichen.md) legt Katalog, Schwellen und Aussehen fest. Dieser Entscheid hält fest, wie sie gebaut sind und was dort offen blieb. «Gemeinsam» (Haushalt) fehlt bewusst.

## Entscheid

1. **Reine Funktion** `achievements(input, today)` in `packages/core/src/achievements.ts`. Sie liest die Daten des Haushalts (Ausgänge, Artikel mit Kategorie, Ereignisse, eigene Rezepte, Quittungen, Mitglieder) und liefert je Abzeichen `id`, Familie, Stufe 0 bis 3 (einmalige: 0 oder 1), den Tag der Freischaltung der aktuellen Stufe und den Fortschritt (Stand, nächste Schwelle). Nichts wird gespeichert (ADR-0020); gelöschte Zeilen und rückgängig gemachte Ausgänge zählen nicht. Die Schwellen stehen in `achievements-catalogue.ts`, einmalige Abzeichen als eine Schwelle (Tage, Teile oder 1).
2. **Abfrage `stats.achievements`** (Berechtigung `stats:read`, `application/achievements.ts`, ADR-0034), **Befehl `inventory.completeCheck`** (Berechtigung `inventory:write`) mit dem neuen Ereignis **`check.completed`** (Zahl der geprüften Artikel). Der Kühlschrank-Check meldet es einmal beim Abschluss.
3. **`item.moved` trägt `previousExpiresOn`** (optional), damit «Vorausschauend» weiss, ob das Datum beim Einfrieren noch nicht vorbei war. Verschiebungen aus der Zeit davor haben es nicht und zählen (die App kann es nicht wissen; der Einfrier-Hinweis bietet nur Gutes an).
4. **Entscheide, wo der Katalog offen liess:**
   - **Rettung** = bestätigte Rettung (ADR-0039), ohne verarbeitete Zutaten (`madeInto`, ADR-0052). Ausgänge zählen, solange sie nicht rückgängig gemacht sind, wie in der Bilanz. Artikelbezogene Regeln (Auf den letzten Tag, Mit allen Sinnen, Resteküche, Vorausschauend) verlangen einen nicht gelöschten Artikel.
   - **Auf den letzten Tag** und **Mit allen Sinnen** zählen Ausgänge «verwertet» (`eaten`), auch bei Zutaten, die verarbeitet wurden.
   - **Monate** (Sparsam, Nichts entsorgt, Fortschritt): abgeschlossene Kalendermonate ab dem ersten vollen Monat (ADR-0050) mit mindestens 10 Abschlüssen, gezählt wie in der Bilanz (Zutaten, die weiterwandern, sind kein Abschluss). Ein Monat ist am Ersten des Folgemonats «erreicht». Sparsam: unter 5 % entsorgt nach Wert, bei Wert 0 nach Anzahl.
   - **Fortschritt:** ganze Prozent wie in «Seit deinem ersten Monat» (24,5 % zählen als 25 %). Der Grundmonat muss etwas Entsorgtes haben; die Mindestzahl von 10 Abschlüssen gilt für den verglichenen Monat, nicht für den Grundmonat (sonst fiele der Start kleiner Haushalte für immer weg). Die Stufe folgt dem besten Monat.
   - **Jahresabschluss:** 365 Tage nach dem ersten Abschluss.
   - **Verarbeiten:** Ein `item.processed` zählt, solange sein Ergebnis nicht gelöscht ist und eine Zutat-Ausgabe mit `madeInto` besteht; ohne Ergebnis («Gekocht, nichts übrig»), solange ein verwerteter Ausgang einer Zutat höchstens 60 Sekunden vor dem Ereignis besteht (so schreibt `inventory.process` sie). **Am Herd** zählt Ereignisse mit Rezept, **Backstube** Ereignisse «selbst gemacht» mit Ergebnis in einer Gebäck-Kategorie (Gruppe `bakery`), **Resteküche** Reste-Artikel, die verwertet oder weitergegeben wurden (nicht entsorgt), je Artikel einmal.
   - **Vorausschauend:** je Artikel einmal, der erste Einfrier-Zug vor oder am Datum.
   - **Alles im Blick:** 30 Tage in Folge, in denen kein Artikel, der jetzt im Kühlschrank liegt, über seinem Datum lag (ab dem Tag danach bis zum Abschluss oder bis heute; ein Mindesthaltbarkeitsdatum zählt wie ein Verbrauchsdatum) und nichts mit Grund «abgelaufen» entsorgt wurde, mit mindestens 10 Abschlüssen in den 30 Tagen. Weil der Lagerort nur jetzt bekannt ist, zählen Artikel, die heute im Kühlschrank liegen. Fortschritt: saubere Tage bis heute, höchstens 29.
   - **Treu:** Wochen Montag bis Sonntag mit mindestens einem Check, in Folge. Die Stufe folgt der längsten Folge; der Fortschritt zeigt die laufende, die erst endet, wenn eine ganze Woche ohne Check verging («diese Woche noch offen» bricht nichts).
   - **Überlebenskunst:** im Notvorrat (Lagerort `reserve`, aktiv) mindestens 9 Liter Trinkwasser je Mitglied (Kategorie `reserve-water`; ml zählen wie g, Stück mit Packungsgrösse mal Inhalt, Stück ohne Grösse als typische Packung von 9 Litern) und Haltbares aus mindestens vier von fünf Gruppen: Reis oder Teigwaren (`pantry-rice`, `pantry-pasta`), Öl oder Fett (`pantry-oil`), Konserven (`pantry-canned`), Mehl (`pantry-flour`), Fertiges (`reserve-freeze-dried`, `reserve-rations`). Mengen für eine Woche prüft Rettich nicht, nur die Vielfalt. Der Zustand zählt, wie der Notvorrat jetzt ist; der Tag ist der, an dem das letzte nötige Stück dort ankam (Kauf oder Umlagern). Wird der Vorrat verbraucht, ist das Abzeichen wieder offen (der Bund empfiehlt rollierendes Lagern).
   - **Buchhaltung:** je Quittung einmal, solange sie nicht gelöscht ist.
   - **Sparbuch:** Beträge in der kleinsten Einheit der Haushaltswährung; die Schwellen (2000, 10000, 50000) sind für Franken gedacht, für andere Währungen folgt später eine Anpassung.
5. **Oberfläche:** Medaille (`ui/Medal.tsx`, 56 px, Lucide 1.75, Stufen Silber, Smaragd, Onyx, offen gestrichelt mit Bogen und Text), drei neueste auf Start unter der Bilanz mit «Dein Rettich», Seite «Abzeichen» unter «Mehr» (`/more/achievements`), ein ruhiger Hinweis im Arbeitsspeicher beim Erscheinen einer neuen Stufe (kein Speicher, keine Mitteilung). Der Hinweis nennt mehrere neue Namen in einem Satz.

## Folgen

- **Schnittstelle v1:** 43 Operationen (neu `inventory.completeCheck`, `stats.achievements`), 25 Ereignisarten (neu `check.completed`).
- **Datenrechte (ADR-0020):** Das Ereignis liegt im Export und verschwindet mit dem Löschen. Das Feld `previousExpiresOn` ist optional, alte Dateien bleiben gültig.
- **Kein neuer Datenfluss:** alles auf dem Gerät.
- **Aufwand:** Die Abfrage liest alle Zeilen des Haushalts; auf Start, unter «Mehr» und für den Hinweis läuft sie bei jeder Änderung neu. Für Haushalte von Pilotgrösse unbedenklich; bei Bedarf später zwischenspeichern (nur im Speicher).
- **Verworfen:** Freischaltungen speichern (widerspräche «berechnet, nicht gespeichert» und ADR-0020).
