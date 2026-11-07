# Technische Schulden

Alban (7.11.2026): «Baue so weiter, dass so wenige Technical Debts wie möglich entstehen.» Schulden lassen sich nicht ganz vermeiden, aber sie dürfen nicht still wachsen. Darum steht jede bekannte Schuld hier, mit Grund, Risiko und Plan. Ein PR, der eine Schuld schafft, trägt sie ein. Ein PR, der eine abbaut, markiert sie als erledigt.

**Risiko:** hoch = kann Daten oder Vertrauen kosten · mittel = bremst die nächsten Schritte · tief = Schönheitsfehler.

| Kennung | Schuld | Warum sie besteht | Risiko | Plan | Status |
| --- | --- | --- | --- | --- | --- |
| TD-01 | Seiten zeichnen sich über `useLiveQuery` (Dexie) neu, also an der Datenschicht vorbei | Schnellster Weg im Pilot. Die Seiten rufen darin nur Operationen der Schnittstelle auf | mittel | Abo auf Domain Events, wenn der Sync kommt (ADR-0034) | offen |
| TD-02 | Häufige Produkte, Produktsuche, Quittungs-Import, Preis-Gedächtnis, Berichte und Rezepte liegen noch in `apps/web/src/data` | Umzug Schritt für Schritt (ADR-0034) | mittel | je ein PR in `packages/core/src/application` | offen |
| TD-03 | Haushalt löschen und importieren bleiben in der Datenschicht | Sie verwalten die ganze Gerätedatenbank, auf einem Server wären es andere Abläufe | tief | bewusst so, mit Konten neu bauen (P6) | akzeptiert |
| TD-04 | Felder heissen `priceRappen` und `valueRappen`, meinen aber die kleinste Einheit jeder Währung | Umbenennen wäre ein Bruch der Schnittstelle v1 | tief | mit Schnittstelle v2 (ADR-0019) | akzeptiert |
| TD-05 | Der Listen-Parser `import/ai-import.ts` wird von der App nicht mehr genutzt | «Mit eigener KI» ist entfernt, die Bestandesaufnahme per Foto ist geparkt (P18) | tief | bis Ende 2026 entscheiden: P18 bauen oder Parser löschen | offen |
| TD-06 | E2E nutzt fest Port 4173, parallele Läufe stören sich | einfach im Einzelbetrieb | mittel | Port über eine Umgebungsvariable wählbar machen | offen |
| TD-07 | Es gibt einen einzigen Textkatalog `messages.de-CH.ts` | Pilot Schweiz | mittel | Begriffe pro Region im Glossar sammeln; mit DACH Kataloge `de-DE`, `de-AT` | offen |
| TD-08 | Der Quittungs-Parser liest bei einer Migros-Foto-Quittung eine Zeile falsch (Summe 389.06 statt 92.25) | Beispiel fehlt | hoch | Alban schickt die Zeilenliste, dann ein Test mit erfundenen Werten | offen |
| TD-09 | Geschätzte Werte (Preis pro Kategorie) gibt es nur in CHF | Pilot Schweiz | mittel | vor der ersten anderen Währung: Schätzwerte pro Land oder keine (ADR-0019) | offen |
| TD-10 | Lokale Arbeitsumgebung hat Node 22, das Projekt will 24 | Container-Vorgabe | tief | CI läuft mit Node 24; Setup-Skript der Umgebung anpassen | offen |
| TD-11 | Repo, Pakete, Datenbank und Speicher-Schlüssel heissen technisch noch `fridgeai` | Umbenennen würde Daten auf Geräten verlieren (ADR-0032) | tief | bewusst so | akzeptiert |
| TD-14 | Produktnamen von Open Food Facts teils nur französisch | Die offene Datenbank hat nicht für jedes Produkt einen deutschen Namen | mittel | Albans Entscheid: deutschen Namen von der Quittung behalten? | offen |
