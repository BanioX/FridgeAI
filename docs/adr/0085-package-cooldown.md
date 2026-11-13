# ADR-0085: Neue Pakete erst nach drei Tagen

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude (Freigabe für Kostenloses, Alban 6.11.2026; blinder Fleck «öffentliches Repo, das sich selbst veröffentlicht», 13.11.2026)

## Kontext

Jeder Merge auf `main` geht automatisch in die echte App (ADR-0013). Wird ein npm-Paket, das Rettich nutzt, mit einer bösartigen neuen Version veröffentlicht, käme diese Version beim nächsten Update der Abhängigkeiten ohne Halt bis auf die Handys. Solche Versionen werden meist innert Stunden entdeckt und zurückgezogen.

## Entscheid

1. `pnpm-workspace.yaml` setzt `minimumReleaseAge: 4320`: pnpm wählt beim Auflösen nur Versionen, die seit mindestens drei Tagen veröffentlicht sind. Installationen mit fester Lockfile (`--frozen-lockfile`, CI, Cloudflare) ändern nichts.
2. Dependabot wartet mit `cooldown.default-days: 3` gleich lang, für npm und für GitHub Actions. So schlägt Dependabot keine Version vor, die pnpm danach ablehnt.

## Folgen

- Sicherheitsupdates kommen drei Tage später. Für eine App ohne Server und ohne Konten ist das vertretbar. Eilt eine Lücke, lässt sich eine Version gezielt freigeben (`minimumReleaseAgeExclude` in `pnpm-workspace.yaml`) und in einem eigenen PR begründen.
- Geprüft: Mit einer sehr hohen Wartezeit verweigert pnpm 10.34 die Installation eines Pakets, dessen neueste Version jünger ist.
