# Schaltzentrale: Trichter, Dispatcher, Stecker, Takt

Stand 8.11.2026. Vorschlag von Claude als Architekt, **Entscheid offen** (Alban). Das ist kein Teil der App, sondern das Grundgerüst, mit dem du und Claude an Rettich und später an anderem arbeiten: Du schreibst eine Idee hinein, ein Dirigent zerlegt sie nach Kompetenz und verteilt sie an ansteckbare Fach-Agenten, die nach Fahrplan arbeiten, ohne sich gegenseitig zu überschreiben.

**Wie dieser Vorschlag entstand:** vier Recherche-Agenten (Claude-Code-Stack, externe Frameworks, Repo-Stand, Nebenläufigkeit und Kosten), drei konkurrierende Architektur-Entwürfe, drei Juroren, 13 Skeptiker, die jede Produkt-Behauptung gegen die Doku prüften. Alle drei Juroren wählten den Stufen-Entwurf. Zwei Prüfungen haben den Plan verändert: Fable ist **kein** separater Gratis-Topf, und `main` ist heute **ungeschützt**. Die Recherche selbst hat dein 5-Stunden-Fenster erreicht (26 Agenten, rund 4,2 Mio. Tokens), siehe L-20 im [Lernbuch](../swelp/lernbuch.md).

## Was du willst, sortiert

| Dein Wort | Was es heisst | Begriff hier |
| --- | --- | --- |
| «Schaltzentrale», «Trichter», «Catchup-Staubsauger» | Ein Ort, an dem du frei schreibst; alles wird aufgesaugt und sortiert | **Trichter** |
| «Er moderiert und bricht es an Marketing, CEO usw.» | Ein Dirigent zerlegt nach Kompetenz und delegiert | **Dispatcher** |
| «Telefonistinnen stecken die Leitungen zusammen» | Fach-Agenten kommen und gehen nach Bedarf | **Stecker** |
| «Mo–Fr 8–17 Uhr auf Knopfdruck», «8–9 planen, 9–10 umsetzen, 10–11 optimieren» | Zeitlich getrennte Phasen ohne dich | **Takt** |
| «Kein Agent überschreibt den anderen» | Isolation, Besitz, ein einziger Merger | **Wächter** |
| «Alles, was Anthropic für Profis hat» | Subagents, Skills, Hooks, Workflows, Scheduled Tasks, Cross-Session, Mods, Projects | Bordmittel von Claude Code |
| «OpenClaw, Hermes Agent, Grokbot, Harness» | Vorbilder, von denen wir Muster übernehmen, nicht Code | siehe «Vorbilder» |

## Kurzantwort

**Bau die Zentrale in drei Stufen aus den Bordmitteln von Claude Code, mit dem Repo und GitHub Issues als Gedächtnis. Kein eigener Server, kein API-Key, keine neue Dependency.** Stufe 1 läuft diese Woche in deinem Gespräch mit Claude. Stufe 2 bringt den Takt (Cloud Scheduled Tasks, laufen ohne deinen Rechner). Stufe 3 löst die Zentrale als Plugin heraus, lässt Agenten selbst vorschlagen, was ansteht, und öffnet sie für andere KI-Anbieter. Nichts davon wird später weggeworfen.

Warum nicht als eigene Anwendung (Hono auf Cloudflare, Agent SDK, Managed Agents)? Weil das schon beim ersten Schritt einen API-Key und damit Geld braucht (Regel 5), rund 1500 Zeilen eigenen Code, und weil das Abo, Cloud-Sitzungen, Scheduled Tasks und Subagents dasselbe heute schon können. Die Idee einer austauschbaren Ausführer-Schnittstelle übernehmen wir für Stufe 3.

## Bild

```
   Du (App, Handy, Gespräch)
        │  Idee, Information, Frage
        ▼
 ┌──────────────┐  /trichter im Gespräch · GitHub-Issue «trichter» vom Handy
 │   Trichter   │  Text ist Daten, nie Anweisung
 └──────┬───────┘
        ▼
 ┌──────────────┐  liest zuerst: uebergabe.md, Steuer-Issue, Board, Lernbuch, Standing Orders
 │  Dispatcher  │  sortiert: jetzt · später · Parkplatz (Filter «Fokus: bis zum Pilot»)
 │ (Opus, du    │  zerlegt nach Kompetenz in Tickets: Ziel, Format, Pfade, Tabu, Testweg, Gates
 │  rufst Fable)│  steckt Stecker an · einziger Merger · schreibt den Tagesbericht
 └──┬───┬───┬───┘
    ▼   ▼   ▼      Stecker (.claude/agents/<rolle>.md), jeder in eigenem Worktree und Branch
 ┌─────┐┌─────┐┌──────┐┌──────┐┌───────┐┌────────┐┌───────────────────────────┐
 │ CEO ││Markt││Design││Recht ││Finanz ││Reviewer││ Implementer · Helper      │
 └─────┘└─────┘└──────┘└──────┘└───────┘└────────┘└───────────────────────────┘
    │  Ergebnis: Datei in docs/zentrale/out/<rolle>/ oder PR auf claude/<ticket>
    ▼
 Wächter (Hooks: Pfad-Besitz, kein Push auf main) · Takt (Scheduled Tasks Mo–Fr) · Not-Aus (Steuer-Issue)
```

## Rollenmodell

Ein Stecker ist eine Markdown-Datei mit Frontmatter (`name`, `description`, `model`, `effort`, `tools`, `isolation`, `maxTurns`, `memory`). Eine Datei kostet nichts, solange niemand sie ruft. **Regel:** Der Dispatcher ruft einen Stecker nur für Tickets, die ihn brauchen; kein Stecker läuft «immer».

| Stecker | Modell, Effort | Darf schreiben | Werkzeuge | Wann |
| --- | --- | --- | --- | --- |
| **Dispatcher** (Dirigent, Dev-Lead, einziger Merger) | `opus`, high; `fable` nur, wenn du es rufst (Architektur, grosse Entscheide) | `docs/zentrale/**`, `docs/ideen/**`, `docs/swelp/uebergabe.md`, Issues, Merge | alle | jede Idee, jeder Takt-Lauf «planen» und «optimieren» |
| **CEO/Strategie** | `opus`, high | `docs/zentrale/out/strategie/` | Read, Grep, Glob, WebSearch | Ideen mit Produkt- oder Marktbezug |
| **Marketing** | `sonnet`, medium | `docs/zentrale/out/marketing/` | Read, Grep, Glob, WebSearch | Texte, Kanäle, Claims (Zahlen markiert: belegt, geschätzt, abgeleitet, L-17) |
| **Design** | `sonnet`, medium | `docs/zentrale/out/design/`, Vorschau-Bilder | Read, Grep, Glob, Bash nur `pnpm preview:shots` | HIG-Kritik (ADR-0021), Sheets für dich |
| **Recht/Datenschutz** | `sonnet`, high | `docs/zentrale/out/recht/` | Read, Grep, Glob, WebSearch | jeder neue Datenfluss, Lizenzen (ADR-0015, ADR-0020) |
| **Finanzen** | `haiku`, low (rechnen); `sonnet` für Bewertung | `docs/zentrale/out/finanzen/` | Read, Grep, Glob | Kosten je Idee, Abo- und CI-Verbrauch |
| **Implementer** (besteht) | `sonnet`, medium, `isolation: worktree`, `maxTurns: 60` | nur Pfade aus dem Ticket | alle | Code-Tickets |
| **Helper** (besteht) | `haiku`, low, `isolation: worktree` | nur Pfade aus dem Ticket | alle | Boilerplate, Tests zu fertiger Logik |
| **Reviewer** (besteht) | `sonnet`, medium | nichts | Read, Grep, Glob, Bash nur Prüfbefehle | jeder PR von `claude/*` |

Lese-Rollen (CEO, Recht, Reviewer) haben im Frontmatter gar keine Schreibwerkzeuge. Das ist die billigste Form von «überschreibt nichts».

## Der Trichter-Fluss an einem Beispiel

Du schreibst: «Wir brauchen eine Landingpage mit Warteliste vor dem Pilot.»

1. **Eingabe:** `/trichter …` im Gespräch, oder vom Handy ein GitHub-Issue mit Label `trichter`. Der Text steht zwischen Markern und gilt als Daten.
2. **Startritual:** Der Dispatcher liest `uebergabe.md`, das Steuer-Issue (Not-Aus?), das Board, `lernbuch.md`, `standing-orders.md`. Höchstens eine Rückfrage, wenn das Ziel unklar ist.
3. **Sortieren:** jetzt / später / Parkplatz, mit dem Filter «Fokus jetzt: bis zum Pilot». Hier: jetzt, aber ohne Bezahlfunktion.
4. **Zerlegen:** Tickets `A-0021` Marketing (Botschaft, Texte), `A-0022` Design (HIG-Layout, Sheet), `A-0023` Recht (Warteliste = neuer Datenfluss E-Mail-Adresse → Gate `new_data_flow`), `A-0024` Implementer (statische Seite mit Mock-Adapter), `A-0025` CEO (passt die Seite zur Blue-Ocean-Strategie?). Jedes Ticket: Ziel, Format, erlaubte Pfade, Tabu, Testweg, Gates, Besitzer.
5. **Anstecken:** Marketing, Design, CEO und Recht laufen parallel (nur lesen oder eigener Ausgabeordner). Der Implementer wartet, bis Recht das Gate beantwortet hat und du Ja gesagt hast.
6. **Landung:** Ergebnisse als Dateien in `docs/zentrale/out/<rolle>/` oder als PR auf `claude/A-0024-landingpage`. Der Reviewer prüft den PR, der Dispatcher merged (ein Push pro PR, L-09).
7. **Nachführen:** Board, Issue-Kommentar, `uebergabe.md`, bei Bedarf Parkplatz oder ADR. Tagesbericht an dich.

## Anstecken und Abstecken

- **Dauerhaft:** Datei `.claude/agents/<rolle>.md` committen. Claude Code lädt sie beim nächsten Start; die `description` («use proactively for marketing copy, channels, positioning») ist das Routing-Signal für den Dispatcher.
- **Kurz anhängen** («ich brauche kurz jemanden für Marketing»): im Gespräch `@marketing` nennen, oder die Datei nur für eine Sitzung mit `claude --agents` mitgeben.
- **Abstecken:** Datei nach `.claude/agents/_parked/` verschieben (wird nicht gelesen) oder löschen. Eine Zeile in `docs/zentrale/ownership.json` sagt, welche Pfade die Rolle schreiben darf; ohne Zeile darf sie nichts schreiben.
- **Patchkabel:** Laufen mehrere Sitzungen parallel (Marketing-Sitzung, Dev-Sitzung), melden sie sich über Cross-Session-Messaging (`ListAgents`, `SendMessage`). Jede Nachricht ist ein Turn mit vollem Kontext, also sparsam.

## Gedächtnis: Repo und GitHub Issues

Jeder Cloud-Lauf klont `main` frisch, ohne Erinnerung an den Lauf eine Stunde vorher. Alles, was nicht gemergt, gepusht oder in einem Issue steht, ist weg. Darum:

| Was | Wo | Wer schreibt |
| --- | --- | --- |
| Lebender Zustand der Tickets (Status, Besitzer, Gates) | GitHub Issues, Label `zentrale`, Status als Labels (`status:ready`, `status:review`, `owner:implementer`, `gate:needs-alban`) | Dispatcher; du antwortest per Kommentar oder Label |
| Steuerung und Not-Aus | ein Issue «Zentrale: Steuerung» mit Labels `takt:on` / `takt:stop` | du, vom Handy |
| Faden für die nächste Sitzung | `docs/swelp/uebergabe.md` (besteht) | Dispatcher am Ende jedes Laufs |
| Maschinenlesbarer Spiegel | `docs/zentrale/board.json`, `docs/zentrale/metrics.json` (pro Lauf: Modell, Turns, Dauer, Dateien) | `takt-report`, nachts, als Doku-PR |
| Regeln | `docs/zentrale/standing-orders.md`, `ownership.json`, Ticket-Schablone | nur du und der Dispatcher in einem reviewten PR |
| Ergebnisse der Fach-Rollen | `docs/zentrale/out/<rolle>/` | die jeweilige Rolle |

Issues und Projects sind im GitHub-Free-Plan auch für private Repos kostenlos. Das Board im Repo ist Spiegel, nicht Wahrheit, sonst sieht der nächste Lauf einen Stand, der noch in einem offenen PR steckt.

## Takt (Stufe 2)

Cloud Scheduled Tasks (unter `claude.ai/code/routines` oder mit `/schedule`) laufen auf Anthropics Rechnern ohne deinen Laptop, Mindestabstand eine Stunde, `CRON_TZ=Europe/Zurich` geht, Läufe starten bis zu rund 30 Minuten verspätet. Darum sind Phasen **Zustände am Ticket**, keine Uhrzeit-Versprechen. Jeder Takt-Lauf ist idempotent: Liegt nichts an, endet er sofort und kostet fast nichts. Die Prompts liegen versioniert in `docs/zentrale/takt/*.md`; der Task sagt nur «lies `docs/zentrale/takt/plan.md` und folge ihm», damit Änderungen über PRs laufen.

| Takt | Cron (Zürich) | Modell | Macht |
| --- | --- | --- | --- |
| `takt-plan` | `7 8 * * 1-5` | opus, high | Steuer-Issue prüfen, Trichter-Issues leeren, Tickets schreiben, genau ein Dev-Ticket auf `ready`, `uebergabe.md` |
| `takt-build` | `7 9 * * 1-5` | sonnet, medium | genau ein `ready`-Ticket im eigenen Worktree umsetzen, lint/typecheck/test, ein Push, Draft-PR, `ready → review` |
| `takt-optimize` | `7 10 * * 1-5` | sonnet, medium + Reviewer | offene `claude/*`-PRs reviewen, höchstens zwei Fix-Pushes pro PR, Schulden abbauen, Merge-Vorschlag |
| `takt-report` | `37 16 * * 1-5` | haiku, low | Tagesbericht `docs/zentrale/berichte/YYYY-MM-DD.md`, `metrics.json`, Totmann-Prüfung: Liefen plan und build heute? |
| Ereignis | PR geöffnet auf `claude/*` | sonnet | Scheduled Task mit GitHub-Trigger `pull_request.opened` startet den Reviewer; CI rot → `/autofix-pr`, gedeckelt |

- **Knopf:** Label `takt:on` am Steuer-Issue. **Not-Aus:** Label `takt:stop`; jeder Lauf prüft das als Erstes und beendet sich.
- **Erst `takt-ping`:** eine Testaufgabe, die nur Zeitzone, Startverzögerung, Berechtigungen und Umgebung (frischer Clone ohne `node_modules` und ohne Playwright-Browser, Setup-Skript nötig) misst, bevor der echte Takt startet.
- **Zeitfenster:** 8 bis 10 Uhr teilen sich das 5-Stunden-Fenster mit deiner eigenen Morgenarbeit. Start mit zwei Läufen pro Tag (plan, report) plus Ereignis-Takt; ausbauen, wenn die Messung es erlaubt.
- **Besser als Uhrzeiten:** Ereignisse (Issue → Plan → PR → Review → Merge). Der Takt bleibt das Rückgrat, die Ereignisse machen die Arbeit; das ist der Hybrid, den alle drei Entwürfe empfahlen.

## Kein Agent überschreibt den anderen: sieben Schichten

1. **Isolation:** Schreibende Stecker tragen `isolation: worktree` (eigener Git-Worktree, eigener Branch); Cloud-Läufe klonen ohnehin in eigene Sandboxen. Claude Code blockt Edits und Git-Befehle in den Haupt-Checkout.
2. **Ein Ticket, ein Besitzer, ein Branch:** `claude/<ticket>-<slug>`, genau ein Push am Ende.
3. **Besitz als Daten:** `ownership.json` (Rolle → erlaubte Pfade) plus Pfade und Tabu im Ticket.
4. **Pfad-Wächter:** PreToolUse-Hook `scripts/zentrale/guard-paths.mjs` liest `agent_type` und Zielpfad aus dem Hook-JSON und bricht mit Exit 2 ab, wenn der Pfad nicht erlaubt ist. `guard-git.mjs` blockt Push auf `main`, Tags und Merge für alle ausser dem Dispatcher. Command-Hooks kosten keine Tokens. Ein Vitest prüft, dass jedes Hook-Skript existiert, ausführbar ist und einen Beispiel-Verstoss mit Exit 2 quittiert (L-15).
5. **Disjunkte Pfade:** Der Dispatcher setzt zwei Tickets mit überlappenden Pfaden nie gleichzeitig auf `ready`.
6. **Ein Merger:** Nur der Dispatcher merged, nach Review, nach grüner CI.
7. **CI-Prüfung:** ein billiger Schritt (etwa eine Minute) stellt den PR rot, wenn geänderte Dateien ausserhalb der Ticket-Pfade liegen.

**Ehrlich:** Hooks schützen vor Fehlern, nicht vor Absicht (ein Agent kann mit `cp` am Pfad-Hook vorbei). Hooks aus `.claude/settings.json` laufen in Cloud-Läufen nur bei Tasks mit einem einzigen Repo. Und **GitHub Free setzt Branch-Schutz und Rulesets in privaten Repos nicht durch**: `main` ist heute ungeschützt, «nur der Dispatcher merged» ist Konvention. Schutz kostet GitHub Pro (USD 4 pro Monat), also deinen Entscheid. Zusätzlich dürfen Stecker nie in `.claude/**`, `ownership.json` oder `standing-orders.md` schreiben; die Regeln ändern nur du und der Dispatcher in einem reviewten PR.

## Mensch im Kreis

- **Gates als Ticket-Felder:** `money`, `new_data_flow`, `product_deviation` → `gate:needs-alban`. Nur der Dispatcher darf ein Gate von `true` auf `false` setzen, und nur nach deinem Kommentar im Issue.
- **Standing Orders** (Muster aus OpenClaw): pro Rolle «darf alleine», «fragt Alban», «Eskalation nach drei Versuchen». Sie trennen die Erlaubnis vom Zeitpunkt; der Takt sagt nur, wann gearbeitet wird.
- **Tagesbericht:** erledigt, offen, wartet auf dich, Zwischenfälle, Verbrauch. Als Datei und als Kommentar am Tages-Issue, damit die GitHub-App auf dem Handy dich benachrichtigt.

## Sicherheit

- **Prompt-Injection:** Trichter-Text vom Handy, aus E-Mails oder API-Payloads ist fremd. Er steht immer in einem markierten Datenblock, und keine Regel wird durch Issue-Text geändert.
- **Geheimnisse:** nie im Prompt, nie im Repo (CLAUDE.md). Der API-Trigger eines Scheduled Task hat einen Bearer-Token (30 Auslösungen pro Stunde); ein Token auf dem Handy ist ein Risiko, darum GitHub-Issues als Eingang.
- **Konnektoren sind stille Datenflüsse:** In Cloud-Sitzungen sind Gmail, Drive, Figma und mehr konfiguriert. Stecker bekommen eine Werkzeug-Allowlist und standardmässig keinen Konnektor.
- **Audit-Spur:** Alle Läufe committen unter deiner GitHub-Identität. Darum Commit-Trailer `Agent: <rolle>` und `Ticket: A-xxxx` und Branch-Präfix `claude/`.
- **Berechtigungen:** Cloud-Läufe arbeiten im Auto-Modus; was Bash und Netz dürfen, bestimmt die Umgebung. Minimal halten, Setup-Skript nur `pnpm install`.

## Kosten und Limits, geprüft

| Fakt | Folge |
| --- | --- |
| Subagents, Workflows, Cloud-Sitzungen, Scheduled Tasks und Cross-Session-Nachrichten ziehen alle vom selben 5-Stunden-Fenster und Wochenlimit | Der Takt kann deine interaktive Arbeit verdrängen. Erst messen, dann ausbauen |
| **Fable zieht aus dem regulären Wochenlimit, verbraucht es schneller und hat zusätzlich eine eigene Obergrenze** («Nur Fable» ist eine Kappe, kein Extra-Topf) | Dispatcher auf Opus. Fable nur auf deinen Zuruf |
| Agent Teams brauchen laut Doku rund das Siebenfache an Tokens; Ultracode-Workflows vervielfachen ebenfalls | Teams nicht im Takt. Workflows nur interaktiv und nur mit Reserve im Wochenbalken |
| Agent SDK (kein Abo-Login), Managed Agents, Batch API, Advisor-Tool: nur mit API-Key | Stufe 3, dein Geld-Entscheid. Listenpreise pro Mio. Tokens: Opus 5.5 4/20 USD, Sonnet 5.5 2/10, Haiku 5.5 0.10/0.50, Fable 5.1 10/50 |
| Usage Credits über das Limit hinaus sind kostenpflichtig | dein Entscheid, nie automatisch |
| Cloud-VM und Scheduler kosten nichts extra; GitHub Issues und Projects sind gratis; 2000 Actions-Minuten pro Monat, danach rund 0.006 USD pro Minute | Der Takt selbst kostet keine CI-Minuten, jeder Push eines PR schon (L-09) |
| Cloud-Läufe zeigen keine Token-Zahlen; `/usage` sieht nur lokale Sitzungen und Prozentbalken | Jeder Lauf schreibt Modell, Turns, Dauer und Dateien in `metrics.json`; du liest `/usage` vor und nach einem Takt-Tag |
| Dollar-Schätzungen pro Zyklus sind Annahmen; die Token-Menge eines Max-Wochenkontingents ist nicht publiziert | Kein Entwurf weist Dollar als Fakt aus. **Budget-Hülle:** du legst fest, wie viel Prozent der Woche die Zentrale höchstens bekommt |
| Der Bau selbst (fünf PRs) kostet mehrere Opus-Sitzungen | in einer frischen Woche bauen, nicht bei 81 % |

## Was geprüft wurde

| Behauptung | Ergebnis | Folge |
| --- | --- | --- |
| Fable zählt nur gegen den Fable-Topf | **widerlegt** | Dispatcher auf Opus |
| Scheduled Tasks mit `CRON_TZ=Europe/Zurich`, Start innert Minuten | teils: Zeitzone ja, Verspätung bis ~30 Min., Obergrenzen pro Stunde | Phasen als Zustände |
| Scheduled-Task-Läufe zählen zum Abo | bestätigt, plus eigene Lauf-Obergrenzen | Budget-Hülle |
| Hooks aus `settings.json` laufen in Cloud-Läufen | teils: nur bei Ein-Repo-Tasks | Wächter zusätzlich in CI und GitHub |
| `agent_type` im Hook-Input erlaubt Besitz-Prüfung pro Rolle | bestätigt, mit Fallback für die Hauptsitzung | `guard-paths.mjs` tragfähig |
| Frontmatter `isolation`, `effort`, `maxTurns`, `memory` | in der CLI-Doku belegt, für deine Version und Web ungeprüft | vor PR 2 mit `claude --version` und `git worktree list` testen |
| API-Trigger mit Bearer-Token und Textnutzlast | bestätigt, 30 Auslösungen pro Stunde pro Task, geteilt mit «Run now» | Issue-Eingang bevorzugen |
| Projects-Beta auf deinem Konto | nicht entscheidbar, rollt gestaffelt aus | Dispatcher nicht darauf bauen |
| PR-Trigger und `/autofix-pr` ohne Actions-Minuten | teils: der Agent-Lauf ja, die CI des PR nein | Fix-Pushes deckeln |
| Rulesets auf privatem Repo in GitHub Free | bestätigt: nicht durchgesetzt | GitHub Pro oder Konvention plus Hooks |
| Cowork-Tasks lesen Gmail und legen Issues an | teils: Cloud ja, Gmail-Lesen und Issue-Anlegen nicht dokumentiert | E-Mail-Eingang nur per stündlichem Polling, später |
| Telegram-Kanal für Pro/Max | bestätigt, braucht aber eine offene lokale Sitzung mit Bun | kein Handy-Eingang ohne laufenden Rechner |

## Vorbilder und was wir übernehmen

| Vorbild | Was es ist | Übernehmen | Nicht übernehmen |
| --- | --- | --- | --- |
| **OpenClaw** (MIT, früher Clawdbot/Moltbot) | Lokaler Gateway mit Kanälen (WhatsApp, Telegram, …), Markdown-Gedächtnis (`MEMORY.md`, Tagesnotizen), Automationen und Heartbeat, `SKILL.md`, Sub-Agents, Bindings Kanal → Agent (die Telefonistin) | Standing Orders, Tagesnotizen, Bindings-Idee, Heartbeat | den Gateway: braucht API-Key oder ein Setup-Token, das abläuft; zwei CVEs 2026 (1-Click-RCE) |
| **Hermes Agent** (MIT, Nous Research) | Gateway für viele Kanäle, kuratiertes Gedächtnis, Cron, isolierte Subagents, modellunabhängig | Cron-Lieferung an einen Kanal, Subagent-Isolation | Laufzeit: Claude nur per API-Key oder Credits |
| **Grok Bot** (xAI, Aug. 2026, ungeprüft, weil x.ai gesperrt war) | Persistente Agenten mit eigenem Cloud-Rechner, die sich gegenseitig Arbeit zuweisen | nächstes Äquivalent bei Anthropic: Cloud-Sitzungen, Cross-Session-Messaging, Projects (Beta) | bitte bestätigen, ob du das meinst |
| **Harness** («Effective harnesses for long-running agents») | Initializer-Agent, Fortschrittsdatei, Feature-Liste, ein Feature pro Sitzung, Commits als Checkpoints, Ende-zu-Ende prüfen | `uebergabe.md` als Fortschrittsdatei, Board als Feature-Liste, ein Ticket pro Lauf, L-10 | |
| **Building effective agents**, **Multi-agent research system**, **Context engineering** | Routing, Orchestrator-Workers, Evaluator-Optimizer; Lead speichert den Plan; Subagents liefern verdichtet; Delegation mit Ziel, Format, Werkzeugen, Grenzen; Kontext ist endlich | Ticket-Schema, Dispatcher als Lead, Skills statt langer CLAUDE.md | |

## Stufenplan

| Stufe | Wann | Was | Erfolg, dann weiter |
| --- | --- | --- | --- |
| **1 Gespräch** | diese Woche | `/trichter`, Stecker-Dateien, Standing Orders, Wächter, Issue-Spiegel, Tagesbericht-Skill; kein Takt | 10 Ideen durch den Trichter, mindestens 8 richtig sortiert, 0 Überschreibungen, 0 Rückfragen, die Standing Orders hätten klären sollen |
| **2 Takt** | nach dem Pilot-Start oder wenn der Wochenbalken zu Wochenbeginn unter 50 % liegt | `takt-ping`, dann plan und report, dann build und optimize, Ereignis-Takt | 5 Arbeitstage ohne Eingriff, jeden Tag ein Bericht, Verbrauch innerhalb der Budget-Hülle |
| **3 Zentrale** | wenn der Nutzen belegt ist | Plugin `zentrale` (Agents, Skills, Hooks, Takt-Prompts, Workflows, Mod-Panel) für andere Repos; `takt-plan` schlägt aus Lernbuch, Schulden und Metriken selbst Tickets vor, du gibst frei; Ausführer-Schnittstelle für andere Anbieter über MCP; optional Agent SDK oder Managed Agents mit API-Key | dein Entscheid über Geld und Datenflüsse |

### Die ersten fünf PRs

1. **Doku** (CI-günstig): ADR-0038 «Zentrale: Trichter, Dispatcher, Stecker, Takt», `docs/zentrale/README.md` (Begriffe, Ticket-Schablone, Status-Lebenszyklus), `standing-orders.md`, `ownership.json`.
2. **Stecker:** `.claude/agents/dispatcher.md`, `ceo-strategy.md`, `marketing.md`, `design.md`, `legal.md`, `finance.md`; `implementer` und `helper` um `isolation: worktree` und `maxTurns`, `reviewer` ohne Schreibwerkzeuge. Ein Vitest prüft Frontmatter gegen `ownership.json`.
3. **Wächter:** `.claude/settings.json` mit Hooks, `scripts/zentrale/guard-paths.mjs`, `guard-git.mjs`, `board-brief.sh` als SessionStart-Hook (druckt Board und `uebergabe.md` ohne Tokens), `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`, Subagent-Cache 1 h.
4. **Skills:** `.claude/skills/trichter/SKILL.md` (Startritual, Sortierung, Zerlegung, Gates, Anstecken, Landung, Nachführen), `tagesbericht`, Issue-Spiegel über `gh`.
5. **Takt vorbereitet:** `docs/zentrale/takt/{plan,build,optimize,report}.md`, Steuer-Issue, `takt-ping`, `metrics.json`; die Tasks selbst entstehen ausserhalb des Repos unter `claude.ai/code/routines`.

## Offene Fragen an dich

1. **Grokbot:** meinst du xAI's Grok Bot (persistente Agenten mit eigenen Rechnern) oder allgemein einen Router über mehrere KI-Anbieter?
2. **Budget-Hülle:** wie viel Prozent der Woche darf die Zentrale höchstens brauchen? Sind Usage Credits je erlaubt (kostenpflichtig)?
3. **GitHub Pro** (USD 4 pro Monat) für echten Branch-Schutz auf dem privaten Repo, ja oder nein?
4. **Takt-Zeiten:** 8 bis 10 Uhr teilt das 5-Stunden-Fenster mit deiner Morgenarbeit. So lassen, oder auf 6 und 7 Uhr verschieben?
5. **Ort:** im Rettich-Repo starten (schnell) und in Stufe 3 als Plugin herauslösen (sauber)? Das ist mein Vorschlag.
6. **Eingang vom Handy:** reicht ein GitHub-Issue (gratis, sicher, benachrichtigt dich)? Telegram braucht einen laufenden Rechner oder einen Server.
7. **Modell:** Dispatcher standardmässig Opus, Fable auf Zuruf. Einverstanden?

## Quellen

Subagents: <https://code.claude.com/docs/en/sub-agents> · Hooks: <https://code.claude.com/docs/en/hooks> · Scheduled Tasks (Cloud): <https://code.claude.com/docs/en/routines> · Sitzungs-Scheduling: <https://code.claude.com/docs/en/scheduled-tasks> · Cloud-Sitzungen: <https://code.claude.com/docs/en/claude-code-on-the-web> · Cross-Session: <https://code.claude.com/docs/en/cross-session-messaging> · Channels: <https://code.claude.com/docs/en/channels> · Workflows: <https://code.claude.com/docs/en/workflows> · Agent Teams: <https://code.claude.com/docs/en/agent-teams> · Projects: <https://code.claude.com/docs/en/claude-projects> · Worktrees: <https://code.claude.com/docs/en/worktrees> · Kosten: <https://code.claude.com/docs/en/costs> · Agent SDK: <https://code.claude.com/docs/en/agent-sdk/overview> · Managed Agents: <https://platform.claude.com/docs/en/managed-agents/overview> · Advisor: <https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool> · Preise: <https://platform.claude.com/docs/en/about-claude/pricing> · Fable im Plan: <https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan> · Pro/Max-Limits: <https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan> · Extra Usage: <https://support.claude.com/en/articles/12429409-extra-usage-for-max-20x-plans> · Cowork-Tasks: <https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork> · GitHub-Pläne und Rulesets: <https://github.com/pricing>, <https://github.com/github/docs/blob/main/data/reusables/gated-features/repo-rules.md> · OpenClaw: <https://github.com/openclaw/openclaw> · Hermes Agent: <https://github.com/NousResearch/hermes-agent> · Anthropic Engineering: <https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents>, <https://www.anthropic.com/engineering/building-effective-agents>, <https://www.anthropic.com/engineering/multi-agent-research-system>, <https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents>
