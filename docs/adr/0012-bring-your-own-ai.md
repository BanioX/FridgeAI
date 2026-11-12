# ADR-0012: KI-Erkennung über die KI der Nutzer:innen («Bring your own AI»)

- **Status:** teilweise abgelöst: Stufe 1 entfernt (Nachtrag 7.11.2026), Stufen 2 und 3 offen
- **Datum:** 2026-11-06

## Kontext

Alban (6.11.2026): Jetzt zählt ein funktionaler, manueller Prototyp. Kosten für KI-Auswertungen (pro Foto) will FridgeAI als Anbieter nicht tragen. Idee: Foto in ChatGPT, Claude, Gemini o. ä. machen, die KI erkennt den Inhalt, ein Vorschlag erscheint in FridgeAI und ist übernehmbar – mit Absprung in die App. FridgeAI soll als MCP in ChatGPT oder Claude integrierbar sein.

## Entscheid

FridgeAI betreibt **keine eigene Bilderkennung auf eigene Kosten**. Die Erkennung passiert in der KI, die die Person ohnehin nutzt. FridgeAI nimmt das Ergebnis als **Vorschlag** entgegen, die Person bestätigt in der App.

### Stufe 1 – «KI-Import» (ohne Server, ohne Kosten, Teil des Prototyps)

1. In FridgeAI: «Mit eigener KI erfassen» zeigt einen fertigen Auftrag (Prompt) zum Kopieren, mit genauem Antwortformat.
2. In ChatGPT/Claude/Gemini: Foto vom Kühlschrank, Einkauf oder Bon machen, Auftrag einfügen.
3. Die KI antwortet im FridgeAI-Format (eine Zeile pro Artikel: Name; Menge; Lagerort; Ablaufdatum – oder JSON).
4. Antwort kopieren → in FridgeAI «Einfügen» → **Review-Liste** (wie beim Bon) → übernehmen.

Die App prüft die eingefügten Daten streng (Zod) und speichert nichts ohne Bestätigung. Es verlässt nichts das Gerät Richtung FridgeAI.

### Stufe 2 – MCP-Connector (mit Backend, v1)

- FridgeAI stellt einen **MCP-Server** bereit (OAuth, Einwilligung pro Haushalt über `Grant`). Claude und ChatGPT können ihn als Connector einbinden.
- Werkzeug `propose_items`: Die KI legt erkannte Artikel als **Vorschlag in den Posteingang** des Haushalts – sie kann den Vorrat nie direkt ändern (eigener, enger Scope `inventory:propose`).
- Die Antwort der KI enthält einen Link «In FridgeAI öffnen» (**App-Absprung**), dazu kommt optional eine Push-Nachricht; die App zeigt den Vorschlag zur Bestätigung.
- Weitere Werkzeuge aus der Schnittstelle: «Was läuft bald ab?», «Rezeptideen», «Auf die Einkaufsliste».

## Konsequenzen

- **Vorschläge** werden ein allgemeines Konzept (Posteingang): KI-Import, MCP, Bon-Scan und Händler-Bons liefern alle Vorschläge, die dieselbe Review-Oberfläche bestätigt.
- Kosten für FridgeAI: Stufe 1 null, Stufe 2 nur Serveraufrufe (wenige Rappen pro Tausend), KI-Kosten trägt das Abo der Nutzer:innen.
- Datenschutz: Das Foto geht an die KI, die die Person selbst gewählt hat (deren Bedingungen gelten); FridgeAI erhält nur die erkannte Liste. Darauf weist die App beim ersten Mal hin.
- Ersetzt den bisherigen Plan einer Server-KI auf FridgeAI-Kosten.

## Nachtrag 7.11.2026: Stufe 1 aus der App entfernt

Alban: «Braucht es das mit eigener KI erfassen noch? Das KI-Auslesen an die eigene KI senden und zurück würden die wenigsten machen.»

- **Entfernt:** der Eintrag «Mit eigener KI» unter Erfassen, die Seite `/add/ai` und ihr E2E-Test. Alte Links führen auf «Erfassen».
- **Ersatz:** «Erfassen» gibt bei leerem Vorrat einen Hinweis für die erste Bestandesaufnahme mit den Bons der letzten Tage.
- **Bleibt:** Der Parser in `packages/core/src/import/ai-import.ts` bleibt mit seinen Tests. Eine spätere eigene Bestandesaufnahme, etwa ein Foto des Kühlschranks, kann ihn nutzen.
- **Weiter offen:** Stufe 2 (MCP-Connector).

