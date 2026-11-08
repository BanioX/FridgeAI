# Übergabe: wo die Arbeit steht

Für die nächste Sitzung (Mensch oder KI). Claude führt diese Datei am Ende jeder längeren Sitzung nach. Sie ersetzt keine Register, sie zeigt nur den Faden. Stand: 8.11.2026, nach PR #168.

## Offen auf GitHub

| PR oder Branch | Was | Nächster Schritt |
| --- | --- | --- |
| #167 `feat/quittung` | «Quittung» statt «Bon», Marken-Hinweis, ADR-0037 | bei grüner CI mergen |
| #168 `feat/report-receipt` | Seite 1 des PDF als Rettich-Quittung | bei grüner CI mergen, Bild an Alban ist verschickt |
| `feat/receipt-steps` (kein PR) | vier Schritte pro Artikel beim Quittungs-Abgleich; halbfertiger Stand eines abgebrochenen Hilfs-Agenten, auf altem main (#154) | selbst fertig bauen, auf main nachziehen, reviewen, E2E, dann PR |

## Als Nächstes (in dieser Reihenfolge)

1. **Marke «Rettich»** gross geschrieben (Alban, 8.11.2026): App-Texte, App-Name im Manifest, `<title>`, README, CLAUDE.md, AGENTS.md, Design-Doku; ADR-0032 mit Nachtrag; ein Test im Textkatalog. Technische Namen (`fridgeai`, Dateinamen wie `rettich-bericht-…pdf`) bleiben.
2. **Vier Schritte pro Artikel** (Branch `feat/receipt-steps`, siehe oben).
3. **Scanner:** «Code aus Foto lesen» und die Nummer von Hand hinter «Andere Wege» legen. Dabei die Quittungs-E2E anpassen, sie nutzen die Nummer.
4. **TD-02:** Produktsuche, Quittungs-Import und Rezepte nach `packages/core/src/application` ziehen (je ein PR).
5. **Release** bei 10 gemergten PRs seit v0.8.0 (`pnpm release --count`).

## Offene Fragen an Alban

- TD-14: Bei französischen Namen aus Open Food Facts den deutschen Namen von der Quittung behalten?
- TD-08: Zeilenliste der Migros-Foto-Quittung (gelesen 389.06 statt 92.25) für einen Test mit erfundenen Werten.

## Arbeitsweise, die sich bewährt hat

- Jede Arbeit in einem eigenen Worktree, `main` bleibt sauber.
- Vor jedem Push alle Prüfungen **mit Exit-Code** (L-18), E2E nur bei freiem Port 4173 (L-02, L-15).
- Hilfs-Agenten nur für klar umrissene Aufgaben. Ihr Ergebnis wird selbst geprüft (L-10). Wer sich nicht zurückmeldet, wird nach einer Stunde übernommen, und der Stand wird zuerst gesichert.
- Lange Sitzungen kosten mehr Kontext: Nach einem Meilenstein lohnt sich eine neue Sitzung. Diese Datei und `AGENTS.md` reichen zum Weitermachen.
