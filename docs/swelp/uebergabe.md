# Übergabe: wo die Arbeit steht

Für die nächste Sitzung (Mensch oder KI). Claude führt diese Datei am Ende jeder längeren Sitzung nach. Sie ersetzt keine Register, sie zeigt nur den Faden. Stand: 8.11.2026, nach Release v0.9.0 (#176).

## Offen auf GitHub

| PR oder Branch | Was | Nächster Schritt |
| --- | --- | --- |
| `feat/receipt-steps` (kein PR) | vier Schritte pro Artikel beim Quittungs-Abgleich; halbfertiger Stand eines abgebrochenen Hilfs-Agenten, auf altem main (#154) | selbst fertig bauen, auf main nachziehen, reviewen, E2E, dann PR |

Zuletzt gemergt:
- «Abfall» statt «Kübel» (#172);
- Berichtsarten: Kurz-Berichte als Quittung, ausführlicher Bericht ohne Quittung (#173);
- Onyx-Karte mit Ring im ausführlichen Bericht (#174);
- Zeiträume wie ein Kontoauszug: Abschluss am letzten Schweizer Bankwerktag oder von–bis in TT.MM.JJJJ (#175);
- Release v0.9.0 (#176).

## Als Nächstes (in dieser Reihenfolge)

1. **Vier Schritte pro Artikel** (Branch `feat/receipt-steps`, siehe oben). Dabei «Rettich» und «Quittung» beachten, beides prüft der Textkatalog-Test.
2. **Scanner:** «Code aus Foto lesen» und die Nummer von Hand hinter «Andere Wege» legen. Dabei die Quittungs-E2E anpassen, sie nutzen die Nummer.
3. **TD-02:** Produktsuche, Quittungs-Import und Rezepte nach `packages/core/src/application` ziehen (je ein PR).
4. **Mit dem nächsten Code-PR:** In `.github/workflows/release.yml` heisst der Release-Titel noch «rettich v…». Er soll «Rettich v…» heissen. Ein eigener PR nur dafür würde die volle CI auslösen.
5. **Release** bei 10 gemergten PRs seit v0.9.0 (`pnpm release --count`).
6. **Später (Ideen):** der Rettich als Maskottchen in leeren Zuständen und beim Teilen. Illustrationen passend zum Logo, zum Beispiel mit einer Bild-KI erstellt (Albans Abos).

## Offene Fragen an Alban

- TD-14: Bei französischen Namen aus Open Food Facts den deutschen Namen von der Quittung behalten?
- TD-08: Zeilenliste der Migros-Foto-Quittung (gelesen 389.06 statt 92.25) für einen Test mit erfundenen Werten.
- Verlauf unter «Mehr»: auch Monats- und Jahresabschlüsse wie bei den Berichten, oder einfach lassen? ([`design-und-bedienung.md`](../ideen/design-und-bedienung.md))

## Arbeitsweise, die sich bewährt hat

- Jede Arbeit in einem eigenen Worktree, `main` bleibt sauber.
- Vor jedem Push alle Prüfungen **mit Exit-Code** (L-18), E2E nur bei freiem Port 4173 (L-02, L-15).
- Axe in E2E nur über `AxeBuilder` aus `e2e/test.ts` (L-19), Daten immer als Textfeld TT.MM.JJJJ (L-20).
- Hilfs-Agenten nur für klar umrissene Aufgaben. Ihr Ergebnis wird selbst geprüft (L-10). Wer sich nicht zurückmeldet, wird nach einer Stunde übernommen, und der Stand wird zuerst gesichert.
- Lange Sitzungen kosten mehr Kontext: Nach einem Meilenstein lohnt sich eine neue Sitzung. Diese Datei und `AGENTS.md` reichen zum Weitermachen.
