# ADR-0017: Releases und Pflege-Rhythmus – automatisch, durch Claude

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban (6.11.2026): «Mach das als Regel, dass GitHub alle 10 oder alle 50 oder alle 100 Pushs ein Update bekommt, immer nach Best-Practice-Regeln. Ich selber bin faul, werde nie was manuell machen, immer nur du.»

## Entscheid

**Zählweise:** Ein «Push» ist ein gemergter PR auf `main` (Squash-Merge = ein Commit). `pnpm release --count` zeigt den Stand seit dem letzten Release.

| Rhythmus | Was Claude macht |
| --- | --- |
| **Jeder PR** | Conventional Commit im Titel (`feat:`, `fix:`, `docs:` …); README «Was die App heute kann» und Plan-Status nachführen, wenn sich Sichtbares ändert; Vorschau-Link und Screenshots an Alban |
| **Wöchentlich** | Dependabot-PRs prüfen; bei grüner CI mergen; Major-Updates einzeln mit Changelog des Pakets |
| **Alle 10 PRs** (oder am Ende eines Meilensteins) | **Release:** `pnpm release` → PR `chore(release): vX.Y.Z` mit `CHANGELOG.md` und Version → nach grüner CI mergen. Der Workflow `release.yml` sieht die neue Version auf `main`, setzt das Tag `vX.Y.Z` und erstellt das GitHub Release aus dem Changelog. Kurze Statusmeldung an Alban mit Release-Link |
| **Alle 50 PRs** | **Gesundheits-Check** als eigener PR: Abhängigkeiten inkl. Majors, `pnpm licenses:check`, Bundle-Grösse, tote Dateien und Exporte, Doku und ADRs auf Stand, Testabdeckung, Sicherheits- und Datenschutz-Review durch den `reviewer`-Subagent |
| **Alle 100 PRs** | **Grosses Review:** Architektur und Plan überprüfen, ADR-Status aktualisieren, Performance- und Barrierefreiheits-Audit (Lighthouse, axe), Roadmap-Vorschlag an Alban |

- **Versionierung:** Semantic Versioning. In 0.x erhöht ein `feat` die Minor-, ein `fix` die Patch-Version. Bis 1.0 gelten Releases auf GitHub als Vorabversion (Prerelease). 1.0 kommt mit dem öffentlichen Release (Schritt 12).
- **Changelog:** wird aus den Commit-Titeln erzeugt, mit deutschen Überschriften (Neu, Behoben, Dokumentation, Tests, Wartung) und Links zu den PRs. Die Einträge selbst bleiben englisch wie die Commits (CLAUDE.md).
- **Tag durch GitHub, nicht von Hand:** Das Tag entsteht serverseitig beim Release (`gh release create --target`). So braucht es keinen Tag-Push, der in der Entwicklungsumgebung ohnehin gesperrt ist, und kein Release wird vergessen. Für Notfälle lässt sich der Workflow von Hand starten (`workflow_dispatch`).
- **Keine neue Dependency:** `scripts/release.mjs` nutzt nur Git und Node. Der Release-Workflow nutzt das `gh`-CLI der GitHub-Runner mit dem eingebauten Token (kein Secret).

## Konsequenzen

- Alban muss nichts manuell machen. Er sieht Releases unter «Releases» auf GitHub und bekommt Statusmeldungen.
- Erstes Release: v0.1.0 «Manueller Prototyp» mit allen bisherigen Änderungen.
