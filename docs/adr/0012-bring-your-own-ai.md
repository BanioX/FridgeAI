# ADR-0012: KI-Erkennung über die KI der Nutzer:innen («Bring your own AI»)

- **Status:** angenommen
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

### Stufe 3 – eigene KI nur gegen Bezahlung (optional, später)

Eine in die App eingebaute KI-Erkennung gibt es nur, wenn sie über ein Pro-Abo finanziert ist (Kosten pro Auswertung gedeckt).

## Konsequenzen

- **Vorschläge** werden ein allgemeines Konzept (Posteingang): KI-Import, MCP, Bon-Scan, Händler-Bons und Partner liefern alle Vorschläge, die dieselbe Review-Oberfläche bestätigt.
- Kosten für FridgeAI: Stufe 1 null, Stufe 2 nur Serveraufrufe (wenige Rappen pro Tausend), KI-Kosten trägt das Abo der Nutzer:innen.
- Datenschutz: Das Foto geht an die KI, die die Person selbst gewählt hat (deren Bedingungen gelten); FridgeAI erhält nur die erkannte Liste. Darauf weist die App beim ersten Mal hin.
- Ersetzt den bisherigen Plan einer Server-KI auf FridgeAI-Kosten (`architecture.md` 5.1, Frage 4).
