# Technische Schulden

Alban (7.11.2026): «Baue so weiter, dass so wenige Technical Debts wie möglich entstehen.» Schulden lassen sich nicht ganz vermeiden, aber sie dürfen nicht still wachsen. Darum steht jede bekannte Schuld hier, mit Grund, Risiko und Plan. Ein PR, der eine Schuld schafft, trägt sie ein. Ein PR, der eine abbaut, markiert sie als erledigt.

**Risiko:** hoch = kann Daten oder Vertrauen kosten · mittel = bremst die nächsten Schritte · tief = Schönheitsfehler.

| Kennung | Schuld | Warum sie besteht | Risiko | Plan | Status |
| --- | --- | --- | --- | --- | --- |
| TD-01 | Seiten zeichnen sich über `useLiveQuery` (Dexie) neu, also an der Datenschicht vorbei | Schnellster Weg im Pilot. Die Seiten rufen darin nur Operationen der Schnittstelle auf | mittel | Abo auf Domain Events, wenn der Sync kommt (ADR-0034) | offen |
| TD-02 | Produktsuche und Quittungs-Import liegen noch in `apps/web/src/data` (die Rezepte liegen seit ADR-0048 in `application/recipes.ts`) | Umzug Schritt für Schritt (ADR-0034). Häufige Produkte, Preis-Gedächtnis und Berichte sind seit 7.11.2026 in `application/insights.ts` | mittel | je ein PR in `packages/core/src/application` | offen |
| TD-03 | Haushalt löschen und importieren bleiben in der Datenschicht | Sie verwalten die ganze Gerätedatenbank, auf einem Server wären es andere Abläufe | tief | bewusst so, mit Konten neu bauen (P6) | akzeptiert |
| TD-04 | Felder heissen `priceRappen` und `valueRappen`, meinen aber die kleinste Einheit jeder Währung | Umbenennen wäre ein Bruch der Schnittstelle v1 | tief | mit Schnittstelle v2 (ADR-0019) | akzeptiert |
| TD-05 | Der Listen-Parser `import/ai-import.ts` wird von der App nicht mehr genutzt | «Mit eigener KI» ist entfernt, die Bestandesaufnahme per Foto ist geparkt (P18) | tief | bis Ende 2026 entscheiden: P18 bauen oder Parser löschen | offen |
| TD-06 | E2E nutzt fest Port 4173, parallele Läufe stören sich | einfach im Einzelbetrieb | mittel | Port über eine Umgebungsvariable wählbar machen | offen |
| TD-07 | Es gibt einen einzigen Textkatalog `messages.de-CH.ts` | Pilot Schweiz | mittel | Begriffe pro Region im Glossar sammeln; mit DACH Kataloge `de-DE`, `de-AT` | offen |
| TD-08 | Der Quittungs-Parser liest bei einer Migros-Foto-Quittung eine Zeile falsch (Summe 389.06 statt 92.25) | Beispiel fehlt. Dazu liest der Leser bei einer Lidl-Quittung «+3xPkt.Ges.Sort.» und «19.90 BUCH PREIS» als Artikel | hoch | Alban schickt die Zeilenliste, dann ein Test mit erfundenen Werten | offen |
| TD-09 | Geschätzte Werte (Preis pro Kategorie) gibt es nur in CHF | Pilot Schweiz | mittel | vor der ersten anderen Währung: Schätzwerte pro Land oder keine (ADR-0019) | offen |
| TD-10 | Lokale Arbeitsumgebung hat Node 22, das Projekt will 24 | Container-Vorgabe | tief | CI läuft mit Node 24; Setup-Skript der Umgebung anpassen | offen |
| TD-11 | Repo, Pakete, Datenbank und Speicher-Schlüssel heissen technisch noch `fridgeai` | Umbenennen würde Daten auf Geräten verlieren (ADR-0032) | tief | bewusst so | akzeptiert |
| TD-14 | Produktnamen von Open Food Facts teils nur französisch | Die offene Datenbank hat nicht für jedes Produkt einen deutschen Namen | mittel | Albans Entscheid: deutschen Namen von der Quittung behalten? | offen |
| TD-15 | jsPDF bringt optionale Teile mit (html2canvas, canvg mit core-js, DOMPurify, rund 380 kB), die die App nie nutzt, und der Service Worker holt sie bei der Installation | jsPDF kann sie bei Bedarf nachladen; die App nutzt diese Funktionen nicht, der Build nimmt die Dateien trotzdem mit | mittel | per `resolve.alias` auf leere Module legen oder mit `globIgnores` vom Vorab-Cache ausnehmen (Review 8.11.2026) | offen |
| TD-16 | `retail-ch.json` (208 kB) wird ausgeliefert, aber von der App nicht gelesen | Geplant in ADR-0045 für später, die Datei ist schon im Build | tief | aus `apps/web/public/` nehmen, bis die App sie nutzt | offen |
| TD-17 | Barcode-Abfrage und Namenssuche nutzen den mitgelieferten Katalog noch nicht, nur der Quittungs-Abgleich | ADR-0045 begann beim Quittungs-Abgleich | mittel | Katalog zuerst auf dem Gerät fragen, erst dann Open Food Facts; weniger Daten verlassen das Gerät (SE-01) | offen |
| TD-18 | Kein Bundle-Budget in der CI, der Plan sieht eins vor (Abschnitt 8) | Nie eingebaut | mittel | Grenze für das Start-JavaScript (rund 225 kB gzip heute) und den Vorab-Cache (4.4 MB heute) in der CI prüfen | offen |
| TD-19 | Wenig Unit-Tests im Web für Quittung (8 %), Scan (10 %) und Journal (0 %); geprüft nur über E2E | E2E deckte die Abläufe ab, und E2E war das Schnellere | mittel | je Bereich Komponententests für die Kernabläufe; E2E läuft lokal nicht immer wegen Port 4173 (TD-06) | offen |
