# Swelper: die Schaltzentrale als eigener Rahmen

Stand 8.11.2026, dritte Fassung. Vorschlag von Claude als Architekt, **Entscheid über den Start offen** (Alban). **Name: Swelper** (Alban, 8.11.2026; technisch `swelper`), der Rahmen, der Albans [SWELP](https://github.com/BanioX/swelp) über Agenten hinweg ausführt. Der Swelper ist **kein Teil von Rettich**, sondern ein eigener Rahmen in einem eigenen Repo: ein Programm, mit dem du Ideen hineinlegst, Aufgaben nach Kontext geclustert siehst, beim Entwickeln eine Aufgabe auswählst oder eine neue hineinlegst, und ein Dirigent sie an ansteckbare Fach-Agenten verteilt. Rettich ist der erste Kontext, nicht der einzige.

**Wie dieser Vorschlag entstand:** vier Recherche-Agenten (Claude-Code-Stack, externe Frameworks, Repo-Stand, Nebenläufigkeit und Kosten), drei konkurrierende Entwürfe, drei Juroren, 13 Skeptiker, die jede Produkt-Behauptung gegen die Doku prüften. Alle drei Juroren wählten den Stufen-Entwurf. Die Recherche selbst hat Albans 5-Stunden-Fenster erreicht (26 Agenten, rund 4,2 Mio. Tokens), siehe L-21 im [Lernbuch](../swelp/lernbuch.md).

**Albans Antworten vom 8.11.2026:** Grokbot meint xAI's Grok Bot. Das Budget empfiehlt Claude. GitHub Pro ist bezahlt. Der Takt war eine Idee, keine Vorgabe. Wichtig: ein eigener Rahmen ausserhalb von Rettich, kontextbezogen und geclustert, in dem er beim Entwickeln Aufgaben auswählt oder hineinlegt.

## Was du willst, sortiert

| Dein Wort | Was es heisst | Begriff hier |
| --- | --- | --- |
| «eigenes Programm, eigener Rahmen, Frame» | Der Swelper lebt in einem eigenen Repo und wird per Sync in jedes Projekt eingesteckt | **Rahmen** (Repo `swelper`) |
| «kontextbezogen, geclustert» | Aufgaben gehören zu einem Kontext (Rettich, nächstes Projekt, privat) und zu einer Kompetenz | **Kontext** und **Lane** |
| «Trichter», «Catchup-Staubsauger» | Ein Ort, an dem du frei schreibst; alles wird aufgesaugt und sortiert | **Trichter** |
| «Er moderiert und bricht es an Marketing, CEO usw.» | Ein Dirigent zerlegt nach Kompetenz und delegiert | **Dispatcher** |
| «Telefonistinnen stecken die Leitungen zusammen» | Fach-Agenten kommen und gehen nach Bedarf | **Stecker** |
| «Task auswählen oder reinlegen, wenn ich entwickle» | Aus jeder Claude-Code-Sitzung heraus Aufgaben ziehen und ablegen | **`/swelper`** |
| «Mo–Fr 8–17 Uhr, Phasen» (war eine Idee) | Ereignisse treiben die Arbeit, ein Takt ist optional | **Ereignis-Takt**, später **Takt** |
| «Kein Agent überschreibt den anderen» | Isolation, Besitz, Rulesets, ein einziger Merger | **Wächter** |
| «Grokbot, OpenClaw, Hermes, Harness» | Vorbilder, von denen wir Muster übernehmen, nicht Code | siehe «Vorbilder» |

## Kurzantwort

**Bau den Swelper als eigenes privates Repo `swelper`: die Quelle für Agenten, Skills, Hooks und Takt-Prompts, die ein Sync-Skript in jedes Projekt kopiert, und das Gedächtnis (Tickets als GitHub Issues, geclustert nach Kontext, als privates GitHub Project sichtbar). Jedes Projekt, Rettich zuerst, trägt eine erzeugte Kopie und sagt nur, welcher Kontext es ist.** Kein Server, kein API-Key, keine neue Dependency; alles läuft im Abo. Drei Stufen: im Gespräch nutzbar, dann ereignisgetrieben ohne dich, dann mit Takt, eigener Ansicht und anderen Anbietern. Nichts wird später weggeworfen.

Warum nicht eine eigene Anwendung mit Server (Hono auf Cloudflare, Agent SDK, Managed Agents)? Weil das beim ersten Schritt einen API-Key und Geld braucht (Regel 5), rund 1500 Zeilen eigenen Code, und weil Abo, Cloud-Sitzungen, Scheduled Tasks und Subagents dasselbe heute schon können. Die Idee einer austauschbaren Ausführer-Schnittstelle kommt in Stufe 3.

## Warum Swelper

SWELP ist Albans eigenes Protokoll-Set ([`BanioX/swelp`](https://github.com/BanioX/swelp)): **S**coped **W**ork, Side **E**ffect, Self **L**earning **P**rotocols, in Rettich als «Darf, Tut, Lernt» gelebt ([`docs/swelp/`](../swelp/README.md)). Die KI arbeitet, an drei Punkten entscheidet ein Mensch. Der **Swelper** ist der, der diesen Kreis dreht, über Agenten, Projekte und Tage hinweg:

| SWELP | Alltagsbild | Im Swelper |
| --- | --- | --- |
| **Darf** (SWP) | Auftrag und Quittung | Jedes Ticket ist ein Auftrag mit Ziel, Pfaden, Tabu und Testweg; die Landung ist die Quittung (PR, Datei, Issue-Kommentar) |
| **Tut** (SEP) | Beipackzettel und Zulassung | Gates `gate:money`, `gate:data-flow`, `gate:product`; neue Nebenwirkungen stoppen, bis du Ja sagst |
| **Lernt** (SLP) | Lektionenbuch | Lernbuch des Kontexts, `metrics.json`, und in Stufe 3 der Dispatcher, der daraus Tickets vorschlägt |

**Schreibweise, design-technisch:** SWELP bleibt gross, weil es ein Akronym ist. Der Swelper ist eine Rolle, kein Akronym mehr, darum **Swelper** mit grossem S wie Rettich, und technisch klein: Repo `BanioX/swelper`, Befehl `/swelper`, Datei `.swelper.json`, Label `swelper`. «SWELPER» in Grossbuchstaben würde schreien und wie eine zweite Abkürzung aussehen. Kollisionsprüfung per Websuche am 8.11.2026: kein Werkzeug und kein Projekt mit diesem Namen gefunden. Zweiter Platz war **Mainspring**, die Zugfeder des Uhrwerks; besetzt in dieser Nische sind Clockwork, Escapement, Ratchet, Camshaft, Pinion, Gearbox und Cog.

## Bild

```
 Du: Gespräch in einem Projekt · Handy (GitHub-App) · später Panel oder Seite
        │  /swelper add «…»  ·  Issue mit Label trichter
        ▼
 ┌────────────────────────── Repo swelper (der Rahmen) ───────────────────────────┐
 │ Trichter ─▶ Dispatcher (Opus; Fable auf Zuruf)                                 │
 │             liest: Steuer-Issue, Kontext, Standing Orders, Lernbuch, Faden     │
 │             sortiert jetzt · später · Parkplatz; zerlegt in Tickets            │
 │ Tickets = Issues, geclustert: ctx:rettich · lane:marketing · status:ready      │
 │ Stecker = agents/*.md   Skills = /swelper, /trichter   Hooks = Wächter        │
 │ Kontexte: contexts/rettich/context.json · contexts/<nächstes>/…                │
 └───────────────┬──────────────────────────────┬─────────────────────────────────┘
                 │ Sync: .claude/ erzeugt       │ Sync: .claude/ erzeugt
        ┌────────▼────────┐             ┌───────▼────────┐
        │ Repo FridgeAI   │             │ nächstes Repo  │   .swelper.json: { "context": "…" }
        │ Dev-Tickets →   │             │                │   Arbeit in eigenem Worktree und Branch
        │ PR claude/<id>  │             │                │   Branch-Schutz auf main (GitHub Pro)
        └─────────────────┘             └────────────────┘
```

## Der Rahmen: Repo `swelper`

Ein privates Repo, zugleich Quelle und Gedächtnis. Vorschlag für den Aufbau:

```
swelper/
├── bin/sync.mjs                     kopiert agents, skills, hooks in das .claude/ eines Projekts (nur Node, keine Dependency)
├── .claude-plugin/plugin.json       optional: dasselbe als Plugin für deinen Rechner und für Kontexte ohne Repo
├── agents/                          dispatcher, ceo-strategy, marketing, design, legal, finance, reviewer, implementer, helper
├── skills/swelper/SKILL.md         /swelper status · pick · add · done · report
├── skills/trichter/SKILL.md         Moderation, Sortierung, Zerlegung, Gates, Anstecken, Landung, Nachführen
├── hooks/hooks.json + *.mjs         guard-paths, guard-git, board-brief (SessionStart)
├── takt/                            plan.md, build.md, optimize.md, report.md, ping.md (versionierte Prompts, Stufe 3)
├── schema/                          ticket, context, ownership als JSON Schema; ein Test prüft jede Datei dagegen
├── contexts/rettich/context.json    Repo, Default-Branch, Pfad-Besitz je Rolle, Zusätze zu den Standing Orders, Prüfbefehle
├── standing-orders.md               was jede Rolle alleine darf, wann sie dich fragt, Eskalation nach drei Versuchen
├── board/<kontext>/board.json       Spiegel der Issues, von takt-report erzeugt; metrics.json pro Lauf
└── docs/adr/                        die Entscheide des Rahmens selbst
```

**Ein Projekt steckt den Rahmen ein** per Sync, nicht per Plugin: `node bin/sync.mjs <projekt>` erzeugt im Projekt `.claude/agents/*.md`, `.claude/skills/*/SKILL.md`, `.claude/hooks/*.mjs` und den Hook-Teil von `.claude/settings.json`, jede Datei mit Kopfzeile «erzeugt von swelper vX, nicht von Hand ändern», dazu `.swelper.json` mit `{ "context": "rettich" }`. Geprüft ist: Cloud-Sitzungen und Scheduled Tasks laden Plugins, die Projekt-Settings deklarieren, **nicht**, wohl aber die `.claude/`-Dateien im Repo. Ein Test im Projekt prüft, dass die Kopie zur Version im Rahmen passt. Das Plugin bleibt eine Bequemlichkeit für deinen Rechner (`/swelper` in jedem Ordner) und für Kontexte ohne Repo. Die drei bestehenden Agenten in `.claude/agents` von Rettich werden durch die erzeugten ersetzt.

**Geclustert heisst:** Jedes Ticket trägt genau einen Kontext (`ctx:rettich`), eine Lane (`lane:dev`, `lane:marketing`, `lane:ceo`, `lane:design`, `lane:legal`, `lane:finance`), einen Status (`status:inbox`, `ready`, `doing`, `review`, `waiting-alban`, `done`, `parked`) und bei Bedarf Gates (`gate:money`, `gate:data-flow`, `gate:product`). `/swelper status` zeigt das als Baum: Kontext → Lane → Status. Dieselben Issues erscheinen in einem **privaten GitHub Project** auf deinem Konto (Tabelle und Board, gruppiert nach Kontext und Lane, auch in der GitHub-App auf dem Handy); die eingebaute Automation «Auto-add» nimmt jedes Issue mit Label `swelper` von selbst auf. Das ist die erste Ansicht des Swelpers, ohne eine Zeile Code. Ein neuer Kontext ist ein Ordner unter `contexts/` und ein Label; sonst nichts.

## So nutzt du es beim Entwickeln

1. Du öffnest Rettich in Claude Code. Der SessionStart-Hook `board-brief` druckt ohne Tokens: «Swelper · Kontext rettich · 3 bereit · 1 wartet auf dich · Not-Aus aus».
2. **Aufgabe auswählen:** `/swelper pick` listet die `ready`-Tickets dieses Kontexts, du wählst eines, Claude setzt es auf `doing`, legt den Worktree und den Branch `claude/A-0024-landingpage` an und arbeitet nach dem Ticket (Ziel, Pfade, Tabu, Testweg).
3. **Aufgabe hineinlegen:** `/swelper add «Wir brauchen eine Landingpage mit Warteliste»`. Das wird ein Issue mit `trichter` und `ctx:rettich`; der Dispatcher sortiert sofort, wenn du willst, sonst beim nächsten Lauf.
4. **Fertig melden:** `/swelper done A-0024` verlinkt den PR, setzt `review`, und der Reviewer schaut drauf. Gemergt wird erst nach grüner CI.
5. **Vom Handy:** GitHub-App, Repo `swelper`, neues Issue mit Label `trichter`. Kontext-Label, wenn du es weisst, sonst setzt es der Dispatcher.
6. **Anderer Kontext, gleicher Swelper:** Im nächsten Repo steht `.swelper.json` mit einem anderen Kontext; `/swelper pick` zeigt nur dessen Tickets. Private Aufgaben bekommen einen Kontext ohne Repo.

## Rollenmodell

Ein Stecker ist eine Markdown-Datei mit Frontmatter (`name`, `description`, `model`, `effort`, `tools`, `isolation`, `maxTurns`, `memory`). Eine Datei kostet nichts, solange niemand sie ruft. **Regel:** Der Dispatcher ruft einen Stecker nur für Tickets, die ihn brauchen; kein Stecker läuft «immer».

| Stecker | Modell, Effort | Darf schreiben | Werkzeuge | Wann |
| --- | --- | --- | --- | --- |
| **Dispatcher** (Dirigent, Dev-Lead, einziger Merger) | `opus`, high; `fable` nur, wenn du es rufst | Issues, `board/`, `contexts/`, im Projekt `docs/**` und Merge | alle | jede Idee, jeder Lauf «planen» und «optimieren» |
| **CEO/Strategie** | `opus`, high | `out/strategie/` | Read, Grep, Glob, WebSearch | Ideen mit Produkt- oder Marktbezug |
| **Marketing** | `sonnet`, medium | `out/marketing/` | Read, Grep, Glob, WebSearch | Texte, Kanäle, Claims (Zahlen markiert: belegt, geschätzt, abgeleitet, L-17) |
| **Design** | `sonnet`, medium | `out/design/`, Vorschau-Bilder | Read, Grep, Glob, Bash nur Vorschau-Befehl des Kontexts | HIG-Kritik (ADR-0021), Sheets für dich |
| **Recht/Datenschutz** | `sonnet`, high | `out/recht/` | Read, Grep, Glob, WebSearch | jeder neue Datenfluss, Lizenzen (ADR-0015, ADR-0020) |
| **Finanzen** | `haiku`, low; `sonnet` für Bewertung | `out/finanzen/` | Read, Grep, Glob | Kosten je Idee, Abo- und CI-Verbrauch |
| **Implementer** | `sonnet`, medium, `isolation: worktree`, `maxTurns: 60` | nur Pfade aus dem Ticket | alle | Code-Tickets |
| **Helper** | `haiku`, low, `isolation: worktree` | nur Pfade aus dem Ticket | alle | Boilerplate, Tests zu fertiger Logik |
| **Reviewer** | `sonnet`, medium | nichts | Read, Grep, Glob, Bash nur Prüfbefehle | jeder PR von `claude/*` |

`out/<rolle>/` liegt im Rahmen unter `contexts/<kontext>/out/`. Lese-Rollen (CEO, Recht, Reviewer) haben keine Schreibwerkzeuge; das ist die billigste Form von «überschreibt nichts».

## Der Trichter-Fluss an einem Beispiel

Du schreibst: «Wir brauchen eine Landingpage mit Warteliste vor dem Pilot.»

1. **Eingabe:** `/swelper add …` oder ein Issue mit `trichter`. Der Text steht zwischen Markern und gilt als Daten.
2. **Startritual:** Der Dispatcher liest Steuer-Issue (Not-Aus?), `contexts/rettich/context.json`, `standing-orders.md`, den Faden des Kontexts (`docs/swelp/uebergabe.md` in Rettich) und das Lernbuch. Höchstens eine Rückfrage.
3. **Sortieren:** jetzt / später / Parkplatz, mit dem Filter des Kontexts («Fokus jetzt: bis zum Pilot»). Hier: jetzt, aber ohne Bezahlfunktion.
4. **Zerlegen:** `A-0021` Marketing (Botschaft, Texte), `A-0022` Design (HIG-Layout, Sheet), `A-0023` Recht (Warteliste = neuer Datenfluss E-Mail-Adresse → `gate:data-flow`), `A-0024` Implementer (statische Seite mit Mock-Adapter), `A-0025` CEO (passt die Seite zur Blue-Ocean-Strategie?). Jedes Ticket: Ziel, Format, erlaubte Pfade, Tabu, Testweg, Gates, Besitzer.
5. **Anstecken:** Marketing, Design, CEO und Recht laufen parallel (nur lesen oder eigener Ausgabeordner). Der Implementer wartet, bis Recht das Gate beantwortet hat und du Ja gesagt hast.
6. **Landung:** Ergebnisse als Dateien in `out/<rolle>/` oder als PR `claude/A-0024-landingpage` in Rettich. Der Reviewer prüft, der Dispatcher merged (ein Push pro PR, L-09).
7. **Nachführen:** Issue-Status, Faden, bei Bedarf Parkplatz oder ADR im Kontext. Tagesbericht an dich.

## Anstecken und Abstecken

- **Dauerhaft:** Datei `agents/<rolle>.md` im Rahmen; die `description` («use proactively for marketing copy, channels, positioning») ist das Routing-Signal für den Dispatcher.
- **Kurz anhängen** («ich brauche kurz jemanden für Marketing»): im Gespräch `@marketing` nennen, oder für eine Sitzung mit `claude --agents` mitgeben.
- **Abstecken:** Datei nach `agents/_parked/` verschieben oder löschen. Ohne Zeile im Pfad-Besitz des Kontexts darf eine Rolle nichts schreiben.
- **Pro Kontext anders:** `contexts/<kontext>/context.json` kann Rollen ausschalten, Pfade anders vergeben und Standing Orders ergänzen. Rettich braucht Design und Recht, ein privates Projekt vielleicht nur Finanzen.
- **Patchkabel:** Laufen mehrere Sitzungen parallel, melden sie sich über Cross-Session-Messaging (`ListAgents`, `SendMessage`). Jede Nachricht ist ein Turn mit vollem Kontext, also sparsam.

## Gedächtnis: Issues im Rahmen, Code im Projekt

Jeder Cloud-Lauf klont frisch, ohne Erinnerung an den Lauf eine Stunde vorher. Alles, was nicht gemergt, gepusht oder in einem Issue steht, ist weg. Darum:

| Was | Wo | Wer schreibt |
| --- | --- | --- |
| Lebender Zustand der Tickets (Kontext, Lane, Status, Besitzer, Gates) | Issues im Repo `swelper`, Labels wie oben | Dispatcher; du antwortest per Kommentar oder Label |
| Steuerung und Not-Aus | ein Issue «Swelper: Steuerung» mit Labels `takt:on` / `takt:stop` | du, vom Handy |
| Code, PRs, Faden eines Kontexts | im Projekt-Repo (Rettich: `docs/swelp/uebergabe.md`), Ticket verlinkt den PR | Dispatcher, Implementer |
| Ansicht für dich | privates GitHub Project «Swelper» (Auto-add über Label), Baum per `/swelper status` | GitHub, automatisch |
| Maschinenlesbarer Spiegel und Messwerte | `board/<kontext>/board.json`, `metrics.json` (pro Lauf: Modell, Turns, Dauer, Dateien) | `takt-report`, als Doku-PR |
| Regeln | `standing-orders.md`, `contexts/*/context.json`, `schema/` | nur du und der Dispatcher in einem reviewten PR |
| Ergebnisse der Fach-Rollen | `contexts/<kontext>/out/<rolle>/` | die jeweilige Rolle |

Issues und Projects sind gratis. Das Board ist Spiegel, nicht Wahrheit, sonst sieht der nächste Lauf einen Stand, der noch in einem offenen PR steckt.

## Ereignisse zuerst, Takt optional

Der Takt war deine Idee, keine Vorgabe. Darum treiben **Ereignisse** die Arbeit, und ein Uhrzeit-Takt kommt nur, wo er etwas bringt:

| Auslöser | Was passiert | Womit |
| --- | --- | --- |
| Issue mit `trichter` | Dispatcher sortiert und zerlegt | Scheduled Task im Repo `swelper` mit GitHub-Trigger auf Issues, oder stündlicher Lauf, der den Trichter leert |
| Ticket auf `ready` und `takt:on` | Implementer setzt genau ein Ticket im Worktree um, ein Push, Draft-PR | Scheduled Task auf dem Projekt-Repo (Ein-Repo-Task, damit Hooks greifen) |
| PR geöffnet auf `claude/*` | Reviewer prüft | Scheduled Task mit GitHub-Trigger `pull_request.opened` |
| CI rot | höchstens zwei Fix-Pushes | `/autofix-pr`, gedeckelt |
| Abends | Tagesbericht, Spiegel, Totmann-Prüfung («liefen die Läufe, die anstanden?») | `takt-report`, `CRON_TZ=Europe/Zurich 37 20 * * 1-5`, haiku |

Cloud Scheduled Tasks (unter `claude.ai/code/routines` oder mit `/schedule`) laufen auf Anthropics Rechnern ohne deinen Laptop, Mindestabstand eine Stunde, Zürcher Zeit geht, Läufe starten bis zu rund 30 Minuten verspätet. Phasen sind darum **Zustände am Ticket**, keine Uhrzeit-Versprechen. Jeder Lauf ist idempotent: Liegt nichts an, endet er sofort und kostet fast nichts. Die Prompts liegen versioniert in `takt/*.md`; der Task sagt nur «lies `takt/plan.md` und folge ihm». Vor dem ersten echten Lauf misst `takt-ping` Zeitzone, Verspätung, Berechtigungen und Umgebung (frischer Clone ohne `node_modules` und ohne Playwright-Browser, Setup-Skript nötig).

**Knopf:** Label `takt:on` am Steuer-Issue. **Not-Aus:** Label `takt:stop`; jeder Lauf prüft das als Erstes. Wenn du später doch Phasen zu Uhrzeiten willst, sind es vier Tasks (planen, umsetzen, optimieren, Bericht) mit denselben Prompts, am besten ausserhalb deiner eigenen Arbeitszeit (siehe Budget).

## Kein Agent überschreibt den anderen: sieben Schichten

1. **Isolation:** Schreibende Stecker tragen `isolation: worktree` (eigener Git-Worktree, eigener Branch); Cloud-Läufe klonen ohnehin in eigene Sandboxen. Claude Code blockt Edits und Git-Befehle in den Haupt-Checkout.
2. **Ein Ticket, ein Besitzer, ein Branch:** `claude/<ticket>-<slug>`, genau ein Push am Ende.
3. **Besitz als Daten:** Pfad-Besitz je Rolle in `contexts/<kontext>/context.json` plus Pfade und Tabu im Ticket.
4. **Pfad-Wächter:** PreToolUse-Hook `guard-paths.mjs` liest `agent_type` und Zielpfad aus dem Hook-JSON und bricht mit Exit 2 ab, wenn der Pfad nicht erlaubt ist. `guard-git.mjs` blockt Push auf `main`, Tags und Merge für alle ausser dem Dispatcher. Command-Hooks kosten keine Tokens. Ein Test prüft, dass jedes Hook-Skript existiert, ausführbar ist und einen Beispiel-Verstoss mit Exit 2 quittiert (L-15).
5. **Disjunkte Pfade:** Der Dispatcher setzt zwei Tickets mit überlappenden Pfaden nie gleichzeitig auf `ready`.
6. **Ein Merger, erzwungen durch GitHub:** Mit GitHub Pro gilt Branch-Schutz (klassisch oder als Ruleset) auf `main` beider Repos auch privat: nur über PR (ohne Pflicht-Freigabe, sonst könntest du deine eigenen PRs nicht mergen), CI muss grün sein, kein Force-Push, kein Löschen, lineare Historie. Bypass ist nicht Standard; auch du gehst über PRs, so wie CLAUDE.md es ohnehin verlangt.
7. **CI-Prüfung:** ein billiger Schritt (etwa eine Minute) stellt den PR rot, wenn geänderte Dateien ausserhalb der Ticket-Pfade liegen.

**Ehrlich:** Hooks schützen vor Fehlern, nicht vor Absicht (ein Agent kann mit `cp` am Pfad-Hook vorbei), und sie laufen in Cloud-Läufen nur bei Ein-Repo-Tasks. Das Ruleset ist die harte Grenze. Stecker dürfen nie in den Rahmen selbst schreiben (`agents/`, `hooks/`, `standing-orders.md`, `contexts/*/context.json`); die Regeln ändern nur du und der Dispatcher in einem reviewten PR.

## Mensch im Kreis

- **Gates als Labels:** `gate:money`, `gate:data-flow`, `gate:product` → `status:waiting-alban`. Nur der Dispatcher darf ein Gate entfernen, und nur nach deinem Kommentar im Issue.
- **Standing Orders** (Muster aus OpenClaw): pro Rolle «darf alleine», «fragt Alban», «Eskalation nach drei Versuchen». Sie trennen die Erlaubnis vom Zeitpunkt.
- **Tagesbericht:** erledigt, offen, wartet auf dich, Zwischenfälle, Verbrauch. Als Datei im Rahmen und als Kommentar am Steuer-Issue, damit die GitHub-App dich benachrichtigt.

## Sicherheit

- **Prompt-Injection:** Trichter-Text vom Handy, aus E-Mails oder API-Payloads ist fremd. Er steht immer in einem markierten Datenblock, und keine Regel wird durch Issue-Text geändert.
- **Geheimnisse:** nie im Prompt, nie im Repo. Der API-Trigger eines Scheduled Task hat einen Bearer-Token (30 Auslösungen pro Stunde); ein Token auf dem Handy ist ein Risiko, darum GitHub-Issues als Eingang.
- **Konnektoren sind stille Datenflüsse:** In Cloud-Sitzungen sind Gmail, Drive, Figma und mehr konfiguriert. Stecker bekommen eine Werkzeug-Allowlist und standardmässig keinen Konnektor.
- **Audit-Spur:** Alle Läufe committen unter deiner GitHub-Identität. Darum Commit-Trailer `Agent: <rolle>` und `Ticket: A-xxxx` und Branch-Präfix `claude/`.
- **Berechtigungen:** Cloud-Läufe arbeiten im Auto-Modus; was Bash und Netz dürfen, bestimmt die Umgebung. Minimal halten, Setup-Skript nur `pnpm install`.

## Budget: meine Empfehlung

Du hast mich um eine Empfehlung gebeten. Sie beruht auf den geprüften Fakten unten, nicht auf Dollar-Schätzungen.

1. **Der Swelper ist Zweitverbraucher.** Deine eigene Arbeit mit Claude hat Vorrang. Autonome Läufe bekommen **höchstens ein Viertel des Wochenlimits** und starten nur, wenn der Wochenbalken unter 75 % steht. Ab 80 % setzt du `takt:stop`, bis er zurückgesetzt ist.
2. **Keine Usage Credits**, bis der Pilot Zahlen liefert. Der API-Weg (Agent SDK, Managed Agents) bleibt Stufe 3 und braucht deinen Geld-Entscheid.
3. **Modellmix:** Opus nur für den Dispatcher. Sonnet mit `effort: medium` für Umsetzung und Review. Haiku für Bericht und Finanz-Rechnen. `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` als Standard. Fable nur, wenn du es rufst: Es zieht aus demselben Wochenlimit, schneller, mit eigener Kappe.
4. **Autonome Läufe ausserhalb deiner Arbeitszeit**, zum Beispiel 06:07 und 20:37 Uhr, damit das 5-Stunden-Fenster am Morgen dir gehört. Darum ist der Takt nicht mehr 8 bis 17 Uhr.
5. **Messen statt schätzen:** `/usage` vor und nach einem Autonomie-Tag, `metrics.json` pro Lauf. Nach zwei Wochen passen wir das Viertel an.
6. **Workflows mit vielen Agenten** (Ultracode) nur interaktiv, nur unter 50 % Wochenbalken, höchstens zehn Agenten (L-21).

## Kosten und Limits, geprüft

| Fakt | Folge |
| --- | --- |
| Subagents, Workflows, Cloud-Sitzungen, Scheduled Tasks und Cross-Session-Nachrichten ziehen alle vom selben 5-Stunden-Fenster und Wochenlimit | Der Takt kann deine interaktive Arbeit verdrängen. Erst messen, dann ausbauen |
| **Fable zieht aus dem regulären Wochenlimit, verbraucht es schneller und hat zusätzlich eine eigene Obergrenze** («Nur Fable» ist eine Kappe, kein Extra-Topf) | Dispatcher auf Opus. Fable nur auf deinen Zuruf |
| Agent Teams brauchen laut Doku rund das Siebenfache an Tokens; Ultracode-Workflows vervielfachen ebenfalls | Teams nicht ohne dich. Workflows nur interaktiv und nur mit Reserve |
| Agent SDK (kein Abo-Login), Managed Agents, Batch API, Advisor-Tool: nur mit API-Key | Stufe 3, dein Geld-Entscheid. Listenpreise pro Mio. Tokens: Opus 5.5 4/20 USD, Sonnet 5.5 2/10, Haiku 5.5 0.10/0.50, Fable 5.1 10/50 |
| Usage Credits über das Limit hinaus sind kostenpflichtig | dein Entscheid, nie automatisch |
| Cloud-VM und Scheduler kosten nichts extra; Issues und Projects sind gratis; GitHub Pro: 3000 Actions-Minuten pro Monat, danach rund 0.006 USD pro Minute | Der Takt selbst kostet keine CI-Minuten, jeder Push eines PR schon (L-09) |
| Cloud-Läufe zeigen keine Token-Zahlen; `/usage` sieht nur lokale Sitzungen und Prozentbalken | Jeder Lauf schreibt Modell, Turns, Dauer und Dateien in `metrics.json` |
| Dollar-Schätzungen pro Zyklus sind Annahmen; die Token-Menge eines Max-Wochenkontingents ist nicht publiziert | Budget als Anteil des Wochenbalkens, nicht in Franken |
| Der Bau selbst (fünf PRs) kostet mehrere Opus-Sitzungen | in einer Woche mit freiem Wochenbalken bauen |

## Was geprüft wurde

| Behauptung | Ergebnis | Folge |
| --- | --- | --- |
| Fable zählt nur gegen den Fable-Topf | **widerlegt** | Dispatcher auf Opus |
| Scheduled Tasks mit `CRON_TZ=Europe/Zurich`, Start innert Minuten | teils: Zeitzone ja, Verspätung bis ~30 Min., Obergrenzen pro Stunde | Phasen als Zustände |
| Scheduled-Task-Läufe zählen zum Abo | bestätigt, plus eigene Lauf-Obergrenzen | Budget-Viertel |
| Hooks aus Settings laufen in Cloud-Läufen | teils: nur bei Ein-Repo-Tasks | Umsetzungs-Tasks pro Projekt-Repo; Ruleset als harte Grenze |
| `agent_type` im Hook-Input erlaubt Besitz-Prüfung pro Rolle | bestätigt, mit Fallback für die Hauptsitzung | `guard-paths.mjs` tragfähig |
| Frontmatter `isolation`, `effort`, `maxTurns`, `memory` | in der CLI-Doku belegt, für deine Version und Web ungeprüft | vor PR 2 mit `claude --version` und `git worktree list` testen |
| API-Trigger mit Bearer-Token und Textnutzlast | bestätigt, 30 Auslösungen pro Stunde pro Task | Issue-Eingang bevorzugen |
| Projects-Beta auf deinem Konto | nicht entscheidbar, rollt gestaffelt aus | Dispatcher nicht darauf bauen |
| PR-Trigger und `/autofix-pr` ohne Actions-Minuten | teils: der Agent-Lauf ja, die CI des PR nein | Fix-Pushes deckeln |
| Branch-Schutz auf privatem Repo | in GitHub Free nicht durchgesetzt; **mit GitHub Pro ja** («Protected branches» ausdrücklich, Rulesets laut Gating-Tabelle). PR ohne Pflicht-Freigabe erlaubt, Bypass nicht Standard | Schutz auf `main` beider Repos, siehe Schicht 6 |
| Projekt-Settings können Marketplace und Plugin vorschreiben, auch in Cloud-Sitzungen | teils: lokal ja (`enabledPlugins`, nach Vertrauen des Ordners, Installation je Rechner); **in Cloud-Sitzungen laden sie nicht**, repo-eigene `.claude/agents` schon. Plugin-Agenten ignorieren zudem `hooks` und `permissionMode` im Frontmatter | Rahmen per Sync in jedes Projekt kopieren, Plugin nur lokal |
| GitHub Pages für eine private Board-Seite | Pages gibt es auf Pro auch für private Repos, aber die Seite ist **öffentlich**; private Sichtbarkeit nur mit Enterprise Cloud | keine Board-Seite; Ansicht über privates GitHub Project und später Mod-Panel |
| Cowork-Tasks lesen Gmail und legen Issues an | teils: Cloud ja, Gmail-Lesen und Issue-Anlegen nicht dokumentiert | E-Mail-Eingang später, nur per stündlichem Polling |
| Telegram-Kanal für Pro/Max | bestätigt, braucht aber eine offene lokale Sitzung mit Bun | kein Handy-Eingang ohne laufenden Rechner |

## Vorbilder und was wir übernehmen

| Vorbild | Was es ist | Übernehmen | Nicht übernehmen |
| --- | --- | --- | --- |
| **Grok Bot** (xAI, Beta seit Aug. 2026; bestätigt von Alban, Quelle: Fachpresse, x.ai war gesperrt) | Persistente, benannte Agenten mit je eigenem Cloud-Rechner; melden sich in deinen Apps an, laufen nach Routinen, geben sich gegenseitig Arbeit, sitzen mit dir in einem Gruppen-Chat | Das Zielbild: benannte Rollen, die Arbeit untereinander weitergeben. Bei Anthropic entspricht dem: Cloud-Sitzungen (eigene VM pro Lauf), Scheduled Tasks (Routinen), Cross-Session-Messaging, Konnektoren, Projects (Beta). **Unterschied:** Claudes Läufe sind nicht persistent, darum muss der Rahmen das Gedächtnis halten (Issues, Faden) | den Dienst selbst: anderer Anbieter, eigene Kosten, eigener Datenfluss |
| **OpenClaw** (MIT, früher Clawdbot/Moltbot) | Lokaler Gateway mit Kanälen, Markdown-Gedächtnis (`MEMORY.md`, Tagesnotizen), Automationen und Heartbeat, `SKILL.md`, Sub-Agents, Bindings Kanal → Agent (die Telefonistin) | Standing Orders, Tagesnotizen, Bindings-Idee, Heartbeat | den Gateway: braucht API-Key oder ein Setup-Token, das abläuft; zwei CVEs 2026 (1-Click-RCE) |
| **Hermes Agent** (MIT, Nous Research) | Gateway für viele Kanäle, kuratiertes Gedächtnis, Cron, isolierte Subagents, modellunabhängig | Cron-Lieferung an einen Kanal, Subagent-Isolation | Laufzeit: Claude nur per API-Key oder Credits |
| **Harness** («Effective harnesses for long-running agents») | Initializer-Agent, Fortschrittsdatei, Feature-Liste, ein Feature pro Sitzung, Commits als Checkpoints, Ende-zu-Ende prüfen | Faden als Fortschrittsdatei, Issues als Feature-Liste, ein Ticket pro Lauf, L-10 | |
| **Building effective agents**, **Multi-agent research system**, **Context engineering** | Routing, Orchestrator-Workers, Evaluator-Optimizer; Lead speichert den Plan; Subagents liefern verdichtet; Delegation mit Ziel, Format, Werkzeugen, Grenzen; Kontext ist endlich | Ticket-Schema, Dispatcher als Lead, Skills statt langer CLAUDE.md | |

## Stufenplan

| Stufe | Wann | Was | Erfolg, dann weiter |
| --- | --- | --- | --- |
| **1 Rahmen im Gespräch** | sobald du das Repo angelegt hast, in einer Woche mit freiem Wochenbalken | Repo `swelper` mit Sync-Skript, Kontext `rettich`, `/swelper` und `/trichter`, Stecker, Standing Orders, Wächter, GitHub Project, Branch-Schutz auf `main`; kein Lauf ohne dich | 10 Ideen durch den Trichter, mindestens 8 richtig sortiert, 0 Überschreibungen, du hast in Rettich dreimal `/swelper pick` genutzt |
| **2 Ereignisse ohne dich** | nach dem Pilot-Start | Trichter-Lauf, Reviewer auf PRs, Umsetzungs-Task auf `ready`, Tagesbericht, Not-Aus, `takt-ping` | 5 Arbeitstage ohne Eingriff, jeden Tag ein Bericht, Verbrauch innerhalb des Viertels |
| **3 Swelper als Programm** | wenn der Nutzen belegt ist | Zweiter Kontext; eigene Ansicht als Mod-Panel in Claude Code (das GitHub Project bleibt die Ansicht fürs Handy); Dispatcher schlägt aus Lernbuch, Schulden und Metriken selbst Tickets vor, du gibst frei; Takt zu Uhrzeiten, wenn gewünscht; Ausführer-Schnittstelle für andere Anbieter über MCP; optional Agent SDK oder Managed Agents mit API-Key | dein Entscheid über Geld und Datenflüsse |

### Die ersten fünf PRs, alle im Repo `swelper`

0. **Du:** privates Repo `BanioX/swelper` anlegen, Claude GitHub App darauf installieren, Branch-Schutz auf `main` (nur PR, CI grün, kein Force-Push), ein privates GitHub Project «Swelper» mit Auto-add für das Label `swelper`.
1. **Gerüst** (Doku, CI-günstig): `README.md` (Begriffe, Bild, Ticket-Lebenszyklus), ADR-0001 des Rahmens (Entscheide aus diesem Dokument), `standing-orders.md`, `schema/`, `contexts/rettich/context.json`, Labels per Skript.
2. **Stecker:** `agents/*.md` nach einheitlicher Schablone; Test prüft Frontmatter gegen Schema und Pfad-Besitz.
3. **Wächter und Sync:** `hooks/hooks.json`, `guard-paths.mjs`, `guard-git.mjs`, `board-brief.mjs`, `bin/sync.mjs`; Tests: Beispiel-Verstoss endet mit Exit 2, Sync ist idempotent, erzeugte Dateien tragen die Kopfzeile.
4. **Skills:** `skills/swelper/SKILL.md` (status, pick, add, done, report), `skills/trichter/SKILL.md`; Issue-Spiegel über `gh`, mit GitHub-MCP als Ersatz in Cloud-Sitzungen.
5. **Rettich einstecken** (PR in FridgeAI): `node bin/sync.mjs` erzeugt `.claude/agents`, `.claude/skills`, `.claude/hooks` und die Hooks in `.claude/settings.json`; `.swelper.json`; die drei alten Agenten werden ersetzt; CLAUDE.md-Abschnitt «Agent-Orchestrierung» zeigt auf den Rahmen; dazu ADR-0038 in Rettich und ein Test, der die Kopie gegen die Version des Rahmens prüft.

## Offen

1. **Eingang vom Handy:** GitHub-Issue reicht (gratis, sicher, benachrichtigt dich)? Telegram braucht einen laufenden Rechner oder Server.
2. **Modell:** Dispatcher standardmässig Opus, Fable auf Zuruf. Einverstanden?
3. **Zweiter Kontext:** Welches Projekt oder welcher Lebensbereich kommt nach Rettich? Das bestimmt, wie allgemein die Standing Orders sein müssen.

## Quellen

Subagents: <https://code.claude.com/docs/en/sub-agents> · Hooks: <https://code.claude.com/docs/en/hooks> · Plugins: <https://code.claude.com/docs/en/plugins> · Scheduled Tasks (Cloud): <https://code.claude.com/docs/en/routines> · Sitzungs-Scheduling: <https://code.claude.com/docs/en/scheduled-tasks> · Cloud-Sitzungen: <https://code.claude.com/docs/en/claude-code-on-the-web> · Cross-Session: <https://code.claude.com/docs/en/cross-session-messaging> · Channels: <https://code.claude.com/docs/en/channels> · Workflows: <https://code.claude.com/docs/en/workflows> · Agent Teams: <https://code.claude.com/docs/en/agent-teams> · Projects: <https://code.claude.com/docs/en/claude-projects> · Worktrees: <https://code.claude.com/docs/en/worktrees> · Kosten: <https://code.claude.com/docs/en/costs> · Agent SDK: <https://code.claude.com/docs/en/agent-sdk/overview> · Managed Agents: <https://platform.claude.com/docs/en/managed-agents/overview> · Advisor: <https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool> · Preise: <https://platform.claude.com/docs/en/about-claude/pricing> · Fable im Plan: <https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan> · Pro/Max-Limits: <https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan> · Extra Usage: <https://support.claude.com/en/articles/12429409-extra-usage-for-max-20x-plans> · Cowork-Tasks: <https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork> · GitHub-Pläne und Rulesets: <https://github.com/pricing>, <https://github.com/github/docs/blob/main/data/reusables/gated-features/repo-rules.md> · Grok Bot: <https://www.unite.ai/xai-launches-grok-bot-always-on-ai-teammates-with-their-own-cloud-computers/> · SWELP: <https://github.com/BanioX/swelp> · OpenClaw: <https://github.com/openclaw/openclaw> · Hermes Agent: <https://github.com/NousResearch/hermes-agent> · Anthropic Engineering: <https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents>, <https://www.anthropic.com/engineering/building-effective-agents>, <https://www.anthropic.com/engineering/multi-agent-research-system>, <https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents>
