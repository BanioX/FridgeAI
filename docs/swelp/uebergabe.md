# Übergabe: wo die Arbeit steht

Für die nächste Sitzung (Mensch oder KI). Claude führt diese Datei am Ende jeder längeren Sitzung nach. Sie ersetzt keine Register, sie zeigt nur den Faden. Stand: 13.11.2026. Version 0.20.0 ist die letzte veröffentlichte ([CHANGELOG](../../CHANGELOG.md)).

## Stand

- Was gebaut ist, steht im [Plan](../plan.md) und im [README](../../README.md); auf welchen Flächen eine Funktion erscheinen muss, in [`flaechen.md`](../flaechen.md).
- Bekannte Schulden: [`schulden.md`](../schulden.md). Lektionen: [`lernbuch.md`](./lernbuch.md).
- Wenn ein Update etwas kaputt macht: [`notfall.md`](../notfall.md) (zurückrollen, Daten sichern, was nie ohne Rücksprache).
- Rettich ist ein Kontext des SWELPER (ADR-0044): Der Kontext liegt in `.swelper.json`, `.claude/` ist erzeugt und wird nur über `swelper sync` geändert.

## Was als Nächstes kommt

Steht nicht in diesem Repo. Ideen, Reihenfolge und offene Fragen an Alban liegen im privaten Ablageort `rettich-intern` (ADR-0065). Aufträge kommen von Alban oder aus dem SWELPER.

## Offen im Code

| Branch | Was | Nächster Schritt |
| --- | --- | --- |
| TD-08 | Lidl-Quittung: «+3xPkt.Ges.Sort.» und «19.90 BUCH PREIS» werden als Artikel gelesen | braucht die Zeilenliste als Test |

## Arbeitsweise, die sich bewährt hat

- Vor jedem Push alle Prüfungen lokal und jeden Exit-Code einzeln lesen (L-18).
- E2E nie parallel auf demselben Port; Vorschaubilder mit `pnpm preview:shots`.
- Ein PR, ein Thema; Matrix in `flaechen.md` im selben PR nachführen (L-29).
- Katalog wöchentlich auffrischen (`pnpm catalog:refresh`, ADR-0045).
- Ein roter Vorschau-Build bei Cloudflare mit «An unknown error has occurred» nach erfolgreichem Bauen: einmal «Retry build», dann erst den Code verdächtigen (L-34).
- E2E läuft mit «Bewegung reduzieren»; Taps während eines Seitenübergangs kommen nicht an (L-35, ADR-0088). Wer die Bewegung testet, wartet, bis `document.getAnimations()` leer ist.
- Agenten der Rolle `implementer` arbeiten in einem eigenen Worktree; Arbeit in einem vorbereiteten Worktree lehnt der Wächter ab. Ihre Commits danach auf einen Branch mit gutem Namen schieben.
