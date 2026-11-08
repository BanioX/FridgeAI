# Übergabe: wo die Arbeit steht

Für die nächste Sitzung (Mensch oder KI). Claude führt diese Datei am Ende jeder längeren Sitzung nach. Sie ersetzt keine Register, sie zeigt nur den Faden. Stand: 8.11.2026, nach dem grossen Review bei 200 PRs ([Bericht](../reviews/2026-11-08-200-prs.md)). Version 0.10.0 ist die letzte veröffentlichte, Version 0.11.0 folgt direkt nach dem Doku-PR zum Review.

## Offen auf GitHub

| PR oder Branch | Was | Nächster Schritt |
| --- | --- | --- |
| Doku-PR zum Review (`docs/review-200`) | README, Plan, Architektur, Pilot, Datenschutz, ADR-Index, Schulden, Übergabe, Review-Bericht; dazu der Text «Datenschutz in Kürze» in der App | CI abwarten, mergen, danach `pnpm release` für 0.11.0 |
| #210 Ziehen auf einen Lagerort-Tab | ausgewählte Artikel auf einen Tab ziehen; langes Drücken in der normalen Liste wählt aus und hebt an | CI abwarten, mergen |
| `feat/receipt-steps` (kein PR) | vier Schritte pro Artikel beim Quittungs-Abgleich; halbfertiger Stand eines abgebrochenen Hilfs-Agenten, auf altem `main`, über 50 Commits dahinter | schliessen und auf `main` neu bauen (Schritt 2 unten) |

Zuletzt gemergt (seit 0.10.0):
- SWELPER eingesteckt (ADR-0044);
- Produktkatalog mit 7'169 Schweizer Produkten und Abgleich auf dem Gerät (ADR-0045);
- mehrere Quittungen auf einer Seite prüfen und mit einem Knopf übernehmen (#212), «Wo eingekauft?» und die Laden-Buchstaben auf Quittungszeilen und Artikeln;
- «Verwertet» und «Entsorgt»: Wörter, Wischen in beide Richtungen, zwei Kreise, kein «Weitergegeben» mehr (ADR-0046), Kreise antippen, um im Journal die Einträge zu sehen;
- Start vor dem ersten Artikel, die «Bilanz» auf einer mittleren Achse (#211), Namen wie bei einer Privatbank (ADR-0047);
- Auswählen und gemeinsam verschieben.

## Als Nächstes (Vorschlag, in dieser Reihenfolge)

Die Schritte stammen aus dem Review (Abschnitt «Stand nach 200 PRs» im [Plan](../plan.md)). Alban entscheidet, was davon gilt.

1. **Release 0.11.0** mit `pnpm release`, danach Statusmeldung an Alban. Die Schwelle von 10 PRs ist mehr als doppelt überschritten.
2. **Vier Schritte pro Artikel** neu auf `main` bauen, danach TD-08. Dabei «Rettich» und «Quittung» beachten, beides prüft der Textkatalog-Test.
3. **Katalog zuerst auf dem Gerät** auch bei Barcode und Namenssuche (TD-17).
4. **Zahl am App-Symbol** (Badging API) für «Heute retten», ohne Server.
5. **Bundle-Diät und Budget im CI** (TD-15, TD-16, TD-18).
6. **Komponententests** für Quittung, Scan und Journal (TD-19).
7. **TD-02:** Produktsuche und Quittungs-Import nach `packages/core/src/application`, je ein PR.
8. **Werkzeuge:** vite-plugin-pwa 2, TypeScript 7 auf einem Probe-Branch, TD-05 entscheiden, alte Branches löschen.
9. **Sync-ADR** (HLC, Feld-LWW, Outbox) und die reine Logik mit Konflikt-Tests, ohne Server.
10. **Datenschutz-Entwurf** fachlich prüfen lassen (Alban).

Daneben:
- **Feedback von Alban** zu den Schwellen des wachsenden Rettichs (1, 3, 6, 10 Rettungen im Monat, ADR-0043) und zu den Food Facts (ADR-0042). Neue Facts brauchen nur einen Eintrag in `messages.knowledge.facts`; mit einer Zahl nur mit Quelle (ein Test prüft das).
- **Katalog** frischt Claude wöchentlich auf (`pnpm catalog:refresh`, ADR-0045).
- **SWELPER und SWELP:** Alban hat Claude erlaubt, sie selbständig auszubauen. Rettich ist eingesteckt (ADR-0044), der Kontext liegt in `.swelper.json`, `.claude/` ist erzeugt und wird nur über `swelper sync` geändert. Entwurf: [`docs/ideen/swelper.md`](../ideen/swelper.md).
- **Später (Ideen):** der Rettich als Maskottchen in leeren Zuständen und beim Teilen, mit Illustrationen passend zum Logo.

## Offene Fragen an Alban

- **Lidl-Quittung als PDF** für den Fehler im Parser (TD-08, Auftrag): «+3xPkt.Ges.Sort.» und «19.90 BUCH PREIS» werden als Artikel gelesen. Mit der Datei (oder erfundenen Zeilen im gleichen Aufbau) wird daraus ein Test. Die Migros-Foto-Quittung (389.06 statt 92.25) wartet noch auf ihre Zeilenliste.
- **Werbung ohne Tracking:** Kommt für die gratis Stufe Werbung in Frage, die ohne Tracking und ohne Daten vom Gerät auskommt? Das entscheidet über das Geschäftsmodell ([`monetarisierung.md`](../ideen/monetarisierung.md)). Nichts wird gebaut, bevor du entscheidest.
- **Rechtliche Prüfung der Laden-Buchstaben** (P24 im [Parkplatz](../ideen/parkplatz.md)): Sie ahmen die Gestaltung der Händler nach. Vor dem öffentlichen Start soll eine Fachperson prüfen, ob das geht. Für den Pilot zu zweit bleibt es.
- TD-14: Bei französischen Namen aus Open Food Facts den deutschen Namen von der Quittung behalten?
- Journal unter «Mehr»: auch Monats- und Jahresabschlüsse wie bei den Auszügen, oder einfach lassen? ([`design-und-bedienung.md`](../ideen/design-und-bedienung.md))

## Arbeitsweise, die sich bewährt hat

- Jede Arbeit in einem eigenen Worktree, `main` bleibt sauber.
- Vor jedem Push alle Prüfungen **mit Exit-Code** (L-18), E2E nur bei freiem Port 4173 (L-02, L-15).
- Axe in E2E nur über `AxeBuilder` aus `e2e/test.ts` (L-19), Daten immer als Textfeld TT.MM.JJJJ (L-21).
- Hilfs-Agenten nur für klar umrissene Aufgaben. Ihr Ergebnis wird selbst geprüft (L-10). Wer sich nicht zurückmeldet, wird nach einer Stunde übernommen, und der Stand wird zuerst gesichert.
- Lange Sitzungen kosten mehr Kontext: Nach einem Meilenstein lohnt sich eine neue Sitzung. Diese Datei und `AGENTS.md` reichen zum Weitermachen.
