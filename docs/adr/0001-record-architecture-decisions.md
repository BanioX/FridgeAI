# ADR-0001: Architekturentscheide festhalten

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext
FridgeAI wird in vielen kleinen PRs gebaut, teils von Subagents. Entscheide müssen später nachvollziehbar sein, auch für Alban und neue Mitwirkende.

## Entscheid
Wir halten Architektur- und Produktentscheide als kurze ADRs in `docs/adr/NNNN-titel.md` fest (fortlaufend nummeriert, Kebab-Case). Vorlage:

```
# ADR-NNNN: Titel
- Status: vorgeschlagen | angenommen | ersetzt durch ADR-XXXX
- Datum: YYYY-MM-DD
## Kontext
## Entscheid
## Konsequenzen
```

Kleine Entscheide trifft Opus selbst und dokumentiert sie. Grosse Entscheide (Kosten, Datenflüsse, Produkt) werden zuerst mit Alban geklärt; das ADR verweist auf seine Antwort.

## Konsequenzen
- Ein ADR wird nie nachträglich umgeschrieben, sondern durch ein neues ersetzt.
- Jeder PR, der einen Entscheid trifft, enthält das zugehörige ADR.
