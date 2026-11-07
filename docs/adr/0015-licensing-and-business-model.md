# ADR-0015: Lizenz proprietär, Geschäftsmodell offen halten

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban (6.11.2026): «Lizenz aktuell kommerziell / Freemium mit später In-App-Käufen / Abo oder ganz gratis, je nachdem wie wir expandieren, aber nichts verbauen, klar kommerziell ausgerichtet.» Das Repo ist privat, Alban ist der einzige Rechteinhaber. Bisher gab es keine Lizenzdatei.

## Entscheid

1. **Proprietär, alle Rechte vorbehalten** (`LICENSE`, `"license": "UNLICENSED"` in allen `package.json`). Nur so bleiben alle Wege offen:
   - gratis;
   - Freemium mit Abo oder In-App-Käufen;
   - B2B- und White-Label-Lizenzen (Plan Abschnitt 7, Büro-Idee);
   - App Stores;
   - später Teile als Open Source (z. B. der Kern), etwa als «Open Core».

   Umgekehrt ginge das nicht: Eine einmal veröffentlichte Open-Source-Lizenz lässt sich für bereits verteilte Versionen nicht zurücknehmen.
2. **Saubere Rechtekette:** Bleibt Alban alleiniger Rechteinhaber, kann er jederzeit neu lizenzieren. Externe Beiträge (Freelancer:innen, Partner) nur mit schriftlicher Rechteübertragung.
3. **Nur permissive Abhängigkeiten im ausgelieferten Code:** MIT, Apache-2.0, ISC, BSD, 0BSD, BlueOak, CC0, Unlicense, Zlib, OFL-1.1 für Schriften. (Zlib ergänzt am 7.11.2026 für `pako`, das jsPDF für Bilder braucht: Die Lizenz ist so frei wie MIT und verlangt nur, die Herkunft nicht falsch darzustellen und den Hinweis in Quelltexten zu lassen, ADR-0030.) Werkzeuge im Build dürfen schwaches Copyleft enthalten (z. B. MPL-2.0), aber nirgends starkes Copyleft (GPL, AGPL, LGPL, SSPL). `pnpm licenses:check` prüft das in der CI.
4. **Produktdaten von Open Food Facts** stehen unter der **ODbL**:
   - Die Nutzung in einer kommerziellen App ist erlaubt, mit Namensnennung in der App.
   - Bauen wir daraus eine eigene, öffentlich angebotene Produktdatenbank, muss diese Datenbank wieder unter ODbL stehen (Share-Alike, nur die Daten, nicht der App-Code).
   - Darum bleiben eigene Daten (Haushalte, Preise, Händler-Bons) getrennt von übernommenen OFF-Daten.

## Konsequenzen

- Vor dem öffentlichen Release (Schritt 12): eine Seite «Lizenzen von Drittanbietern» in der App erzeugen (Hinweise der MIT/Apache/OFL-Pakete). Die Lizenztexte sollte vor einer kommerziellen Veröffentlichung eine Fachperson prüfen.
- Freemium-Grenzen und Preise entscheidet Alban nach dem Pilot (Plan, Frage 5). Die Mechanik `free | pro` ist im Datenmodell schon angelegt.
