# ADR-0044: Rettich ist der erste Kontext des SWELPER

- **Status:** angenommen
- **Datum:** 2026-11-08

## Kontext

Alban (8.11.2026) wollte eine Schaltzentrale ausserhalb von Rettich: Er legt Ideen hinein, ein Dirigent zerlegt sie nach Kompetenz, ansteckbare Fach-Agenten erledigen sie, kein Agent überschreibt den anderen, und er kann beim Entwickeln Aufgaben ziehen oder ablegen. Daraus wurde der **SWELPER** ([`BanioX/SWELPER`](https://github.com/BanioX/SWELPER)), der Rahmen, der Albans SWELP (Scoped Work, Side Effect, Self Learning Protocols) über Agenten, Projekte und Tage hinweg ausführt. Entwurf und Begründung: [`docs/ideen/swelper.md`](../ideen/swelper.md); Entscheide des Rahmens: dessen ADR-0001.

Bis heute hatte Rettich drei eigene Subagenten in `.claude/agents` (helper, implementer, reviewer) und die Orchestrierungsregeln in `CLAUDE.md`.

## Entscheid

1. **Rettich ist ein Kontext des SWELPER**, der erste. Seine Regeln, Rollen, Prüfbefehle und Gates stehen seit SWELPER 0.2.0 im Projekt in `.swelper.json` (SWELPER ADR-0003; bis dahin im Rahmen unter `contexts/rettich/context.json`); eine Kopie liegt hier unter `.claude/swelper/context.json`.
2. **Aufträge sind Issues im Rahmen** (Label `ctx:rettich`), der Code entsteht hier auf Branches `claude/<id>-<slug>` als PR. Die Übergabe (`docs/swelp/uebergabe.md`) bleibt der Faden dieses Kontexts.
3. **Erzeugt, nicht gepflegt:** `.claude/agents/*.md`, `.claude/skills/*/SKILL.md`, `.claude/swelper/*`, `.swelper.json` und der SessionStart-Hook in `.claude/settings.json` kommen aus dem Rahmen (`python -m swelper sync <pfad>`), tragen `generated: swelper <version>` und werden hier nie von Hand geändert. Der Test `apps/web/src/swelper.test.ts` prüft Markierung und Vollständigkeit. Die drei alten Agenten sind durch die erzeugten Fassungen ersetzt.
4. **Die Regeln von Rettich bleiben die Regeln:** `CLAUDE.md` und `AGENTS.md` gelten unverändert; der Kontext trägt sie als Zusätze zu den Standing Orders in den Rahmen (keine Partner-Integrationen, Geld in Rappen, reiner Core, Nebenwirkungen im Register, Previews für Alban, CI-Minuten).
5. **Warum Kopie statt Plugin:** Cloud-Sitzungen und Scheduled Tasks laden Plugins aus Projekt-Settings nicht, Dateien unter `.claude/` schon (geprüft am 8.11.2026 gegen die Doku von Claude Code).

## Konsequenzen

- Neue Rollen, geänderte Prompts oder Modelle werden im Rahmen geändert und per Sync nachgezogen; der Test hier schlägt an, wenn jemand die Kopie von Hand anfasst.
- Die Kopfzeile am Sitzungsstart («SWELPER · Kontext rettich · n bereit …») braucht das Paket `swelper` auf dem Rechner; ohne Paket zeigt der Hook nur den Kontext.
- SWELP selbst (`swelp init`: Wächter, Lock, Ledger) ist in Rettich noch nicht aktiv; das ist ein eigener Entscheid, sobald SWP 0.2 die Felder `deny`, `gates` und `ref` kennt.
