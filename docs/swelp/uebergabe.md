# Übergabe: wo die Arbeit steht

Für die nächste Sitzung (Mensch oder KI). Claude führt diese Datei am Ende jeder längeren Sitzung nach. Sie ersetzt keine Register, sie zeigt nur den Faden. Stand: 8.11.2026, nach Release v0.10.0.

## Offen auf GitHub

| PR oder Branch | Was | Nächster Schritt |
| --- | --- | --- |
| `feat/receipt-steps` (kein PR) | vier Schritte pro Artikel beim Quittungs-Abgleich; halbfertiger Stand eines abgebrochenen Hilfs-Agenten, auf altem main (#154) | selbst fertig bauen, auf main nachziehen, reviewen, E2E, dann PR |

Zuletzt gemergt (alles in v0.10.0):
- Haltbarkeit pro Kategorie, Score 1–10 mit Ring, neue Kategorien für Dips, Saucen sowie Tomatenmark & Pesto (#178, #181);
- «Von der Theke» (#179) und «Das wirfst du oft weg» (#180);
- Rezepte und der Tab «Kochen» entfernt (#182), dafür der Tab «Wissen» (#184);
- «Gerettet» nur auf Bestätigung (#183), mit Betrag, Monatstotal und Food Fact (#185) und dem wachsenden Rettich auf Start (#186).

## Als Nächstes (in dieser Reihenfolge)

1. **Vier Schritte pro Artikel** (Branch `feat/receipt-steps`, siehe oben). Dabei «Rettich» und «Quittung» beachten, beides prüft der Textkatalog-Test.
2. **Scanner:** «Code aus Foto lesen» und die Nummer von Hand hinter «Andere Wege» legen. Dabei die Quittungs-E2E anpassen, sie nutzen die Nummer.
3. **TD-02:** Produktsuche und Quittungs-Import nach `packages/core/src/application` ziehen (je ein PR). Die Rezepte sind weg (ADR-0040).
4. **Feedback von Alban** zu den Schwellen des wachsenden Rettichs (1, 3, 6, 10 Rettungen im Monat, ADR-0043) und zu den Food Facts (ADR-0042). Neue Facts brauchen nur einen Eintrag in `messages.knowledge.facts`; mit einer Zahl nur mit Quelle (ein Test prüft das).
5. **Release** bei 10 gemergten PRs seit v0.10.0 (`pnpm release --count`).
6. **SWELPER und SWELP** (8.11.2026): Alban hat Claude erlaubt, SWELP, SWELPER, SWP, SEP und SLP selbständig auszubauen. Stufe 1 des Rahmens steht (`BanioX/SWELPER` #1 bis #6 gemergt: Gerüst, Schemas, Stecker, Skills, Paket `swelper`); SWELP #6 bis #8 gemergt (Review, Hygiene, Wächter). Rettich ist eingesteckt (ADR-0044): `.claude/` ist erzeugt, Änderungen nur im Rahmen und per `swelper sync`. Als Nächstes: Labels und GitHub Project im Rahmen, dann die ersten echten Aufträge über `/trichter`; in SWELP SWP 0.2 (Schema, Delegation, `deny`, `gates`, `ref`). Entwurf: [`docs/ideen/swelper.md`](../ideen/swelper.md).
7. **Später (Ideen):** der Rettich als Maskottchen in leeren Zuständen und beim Teilen. Illustrationen passend zum Logo, zum Beispiel mit einer Bild-KI erstellt (Albans Abos).

## Offene Fragen an Alban

- TD-14: Bei französischen Namen aus Open Food Facts den deutschen Namen von der Quittung behalten?
- TD-08: Zeilenliste der Migros-Foto-Quittung (gelesen 389.06 statt 92.25) für einen Test mit erfundenen Werten.
- Verlauf unter «Mehr»: auch Monats- und Jahresabschlüsse wie bei den Berichten, oder einfach lassen? ([`design-und-bedienung.md`](../ideen/design-und-bedienung.md))

## Arbeitsweise, die sich bewährt hat

- Jede Arbeit in einem eigenen Worktree, `main` bleibt sauber.
- Vor jedem Push alle Prüfungen **mit Exit-Code** (L-18), E2E nur bei freiem Port 4173 (L-02, L-15).
- Axe in E2E nur über `AxeBuilder` aus `e2e/test.ts` (L-19), Daten immer als Textfeld TT.MM.JJJJ (L-21).
- Hilfs-Agenten nur für klar umrissene Aufgaben. Ihr Ergebnis wird selbst geprüft (L-10). Wer sich nicht zurückmeldet, wird nach einer Stunde übernommen, und der Stand wird zuerst gesichert.
- Lange Sitzungen kosten mehr Kontext: Nach einem Meilenstein lohnt sich eine neue Sitzung. Diese Datei und `AGENTS.md` reichen zum Weitermachen.
