# Ideen und Erweiterungen

Brainstorming, laufend gepflegt (CLAUDE.md: «Ideen unterwegs»). Hier steht, was Rettich später können könnte, nicht was beschlossen ist. Beschlüsse stehen in [`../plan.md`](../plan.md) und den [ADRs](../adr/).

**Grosse Hebel mit Abklärungsbedarf** (Partner, Verträge, Kosten, Recht, neue Datenflüsse) und der Geschäftsmodell-Entwurf parken in [`parkplatz.md`](./parkplatz.md).

| Datei | Thema |
| --- | --- |
| [`personalisierung.md`](./personalisierung.md) | Rezepte aus bald Ablaufendem (vorerst entfernt, ADR-0040), Menüplanung, Zielgruppen (Sport, Frugalismus, Tracking, «No-Brainer») |
| [`monetarisierung.md`](./monetarisierung.md) | Gratis mit Werbung oder Pro ohne Werbung und Tracking, Partner, Büro |
| [`benachrichtigungen.md`](./benachrichtigungen.md) | Push-Mitteilungen: was technisch geht und was es braucht |
| [`scan-und-produktdaten.md`](./scan-und-produktdaten.md) | Woher Produktdaten und Bilder kommen, der Vergleich mit Yazio, was eine native App bringt |
| [`design-und-bedienung.md`](./design-und-bedienung.md) | Wischgesten, Sheets, Dunkelmodus, schmale Handys, grosse Schrift |
| [`technik.md`](./technik.md) | 404 für alte Dateien, Fehlerberichte ohne Personendaten, Lighthouse in der CI |
| [`hilfe-und-konto.md`](./hilfe-und-konto.md) | FAQ, How-to- und Info-Seiten; Registrierung (geparkt) |
| [`app-stores.md`](./app-stores.md) | Native App für iOS und Android: Weg, Kosten, Zeitplan |
| [`ausgaben-und-ernaehrung.md`](./ausgaben-und-ernaehrung.md) | Essensbudget aus den Quittungen, gesund und ungesund (später) |
| [`integrationen.md`](./integrationen.md) | Thermomix, Kühlschränke (Samsung, LG, Matter), GS1-Codes und eine offene Rettich-Schnittstelle |
| [`schutz.md`](./schutz.md) | Marke, Urheberrecht, NDA, Source Maps: Rettich vor Kopien schützen |
| [`produktdaten.md`](./produktdaten.md) | Bessere Produktdaten: Open Food Repo, Händler-Websites, Foto der Nährwerttabelle, gemeinsames Gedächtnis |
| [`designsprache-garten.md`](./designsprache-garten.md) | Pflanzen als Bereiche, Reineclaude für Erfolg, Reifen statt Prozent |
| [`markt-und-timing.md`](./markt-und-timing.md) | Food Waste in Zahlen, Ziele 2030, Konkurrenz, Abo-Kennzahlen |
| [`mitbewerber-yazio.md`](./mitbewerber-yazio.md) | YAZIO geprüft: Zahlen, Datenquellen (Schweizer Nährwertdatenbank), Suche in Stufen, Wachstum ohne Werbebudget |
| [`masterplan-bewertung.md`](./masterplan-bewertung.md) | Albans Masterplan: übernommen, später, Entscheide, Regeln |
| [`swelper.md`](./swelper.md) | **SWELPER**, die Schaltzentrale als eigener Rahmen ausserhalb von Rettich: Trichter, Dispatcher, Stecker, Kontexte; führt SWELP über Agenten aus; wie Alban beim Entwickeln Aufgaben zieht und ablegt; Budget-Empfehlung, geprüfte Fakten, Stufenplan |

**Produkt-Prioritäten** (Alban, 6.11.2026):

- **Kühlschrank zuerst.** Vorrat, Tiefkühler und Notvorrat sind zweitrangig. Sie bleiben, bekommen aber keinen eigenen Aufwand, solange der Kühlschrank-Ablauf nicht perfekt ist.
- **Design nach Apples Human Interface Guidelines** (ADR-0021).
- **Erst Schweiz, später DACH, dann weltweit.** Gebaut wird so, dass jede Währung möglich bleibt (ADR-0019).
- **Daten so kurz wie möglich aufbewahren.** Exportieren und Löschen ist jederzeit möglich (ADR-0020).

**So wird eine Idee notiert:** Nutzen, für wen, Aufwand (S/M/L), was sie braucht (Daten, Server, Kosten) und ob sie Geld bringen kann. Ideen mit Kosten oder neuen Datenflüssen entscheidet Alban.
