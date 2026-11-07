# Lernt: das Lernbuch von rettich

Was wir aus Fehlern gelernt haben, mit Beleg. Claude trägt ein, Alban kann jede Lektion streichen. Neue Arbeit liest zuerst diese Liste.

| Kennung | Lektion | Regel daraus | Beleg |
| --- | --- | --- | --- |
| L-01 | IndexedDB beendet eine Transaktion beim ersten fremden `await` (z. B. Netz) | In `storage.transaction` nur Speicher-Aufrufe; Netz davor oder danach | ADR-0034, `ports/storage.ts` |
| L-02 | Playwright nutzt einen schon laufenden Server auf Port 4173 mit, auch den einer anderen Sitzung | Vor E2E prüfen, ob der Port frei ist (`curl -s localhost:4173` darf nichts liefern); parallele Arbeit in eigenen Worktrees | 7.11.2026, Agenten-Läufe |
| L-03 | axe verlangt, dass ein `aria-label` den sichtbaren Text enthält (WCAG 2.5.3) | «Barcode scannen für …», nicht «Barcode für … scannen» | #154 |
| L-04 | Safari auf dem iPhone kann die Taschenlampe aus einer Web-App nicht schalten | «Licht» öffnet dort die Kamera-App (`capture`) mit Blitz | #155 |
| L-05 | Ein Kamera-Start kann von «Stoppen» überholt werden und die Kamera danach wieder öffnen | Sitzungszähler: ein überholter Start gibt auf | #155 |
| L-06 | Open Food Facts erlaubt etwa 10 Suchen pro Minute | Warteschlange mit höchstens 8 pro Minute, Fortschritt zeigen | #149 |
| L-07 | Absolut positionierte `sr-only`-Texte entkommen einem Scroll-Container ohne `position` | Scroll-Container mit `relative`; E2E prüft seitliches Scrollen auf allen Seiten | #139 |
| L-08 | Auf Squash-Merges gestapelte PRs bekommen Konflikte | Erst mergen, dann den nächsten auf main aufbauen; Stapel nur wenn nötig | #129, #134 |
| L-09 | CI-Minuten kosten Geld (privates Repo) | Jeden Push lokal voll prüfen, Doku-PRs überspringen Tests | #130, CLAUDE.md |
| L-10 | Ergebnisse von Hilfs-Agenten können gute Unit-Tests haben und trotzdem E2E brechen | Jedes Agenten-Ergebnis selbst reviewen und die volle E2E-Suite laufen lassen | #153, #157 |
| L-11 | iOS fixiert Symbol und Speicher einer Web-App beim Hinzufügen zum Home-Bildschirm | Neues Symbol oder neue Adresse: vorher exportieren, danach importieren | #151, ADR-0020 |
| L-12 | Unicode-Zeichen statt Escape-Sequenzen in Regex lösen `no-irregular-whitespace` aus | In Regex ` ` usw. schreiben, nie das Zeichen selbst | #152 |
| L-13 | Ein unbekanntes Lebensmittel landete still im Vorrat statt im Kühlschrank | «Kühlschrank zuerst»: ohne bekannte Kategorie in den Kühlschrank | #142 |
| L-14 | Open Food Facts kennt manche Produkte nur französisch («Viande séchée») | Offen: deutschen Namen von der Quittung behalten? (TD-14) | 7.11.2026, Albans Test |
| L-15 | Eine Prüfung mit einem Werkzeug, das fehlt (`ss` im Cloud-Container), meldet nichts und sieht aus wie bestanden | Prüfungen so bauen, dass ein fehlendes Werkzeug auffällt; Port mit `curl` prüfen | 7.11.2026, Branch `feat/swipe-eat` |
