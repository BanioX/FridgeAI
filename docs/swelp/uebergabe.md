# Übergabe: wo die Arbeit steht

Für die nächste Sitzung (Mensch oder KI). Claude führt diese Datei am Ende jeder längeren Sitzung nach. Sie ersetzt keine Register, sie zeigt nur den Faden. Stand: 8.11.2026, nach PR #170 (6 gemergte PRs seit v0.8.0).

## Offen auf GitHub

| PR oder Branch | Was | Nächster Schritt |
| --- | --- | --- |
| `feat/receipt-steps` (kein PR) | vier Schritte pro Artikel beim Quittungs-Abgleich; halbfertiger Stand eines abgebrochenen Hilfs-Agenten, auf altem main (#154) | selbst fertig bauen, auf main nachziehen, reviewen, E2E, dann PR |

Zuletzt gemergt: «Quittung» statt «Bon» (#167), PDF-Seite 1 als Rettich-Quittung (#168), «Rettich» mit grossem R (#170).

## Als Nächstes (in dieser Reihenfolge)

1. **Vier Schritte pro Artikel** (Branch `feat/receipt-steps`, siehe oben). Dabei «Rettich» und «Quittung» beachten, beides prüft der Textkatalog-Test.
2. **Scanner:** «Code aus Foto lesen» und die Nummer von Hand hinter «Andere Wege» legen. Dabei die Quittungs-E2E anpassen, sie nutzen die Nummer.
3. **TD-02:** Produktsuche, Quittungs-Import und Rezepte nach `packages/core/src/application` ziehen (je ein PR).
4. **Release** bei 10 gemergten PRs seit v0.8.0 (`pnpm release --count`).
5. **Später (Ideen):** der Rettich als Maskottchen in leeren Zuständen und beim Teilen. Illustrationen passend zum Logo, zum Beispiel mit einer Bild-KI erstellt (Albans Abos).

## Offene Fragen an Alban

- TD-14: Bei französischen Namen aus Open Food Facts den deutschen Namen von der Quittung behalten?
- TD-08: Zeilenliste der Migros-Foto-Quittung (gelesen 389.06 statt 92.25) für einen Test mit erfundenen Werten.

## Arbeitsweise, die sich bewährt hat

- Jede Arbeit in einem eigenen Worktree, `main` bleibt sauber.
- Vor jedem Push alle Prüfungen **mit Exit-Code** (L-18), E2E nur bei freiem Port 4173 (L-02, L-15).
- Hilfs-Agenten nur für klar umrissene Aufgaben. Ihr Ergebnis wird selbst geprüft (L-10). Wer sich nicht zurückmeldet, wird nach einer Stunde übernommen, und der Stand wird zuerst gesichert.
- Lange Sitzungen kosten mehr Kontext: Nach einem Meilenstein lohnt sich eine neue Sitzung. Diese Datei und `AGENTS.md` reichen zum Weitermachen.
