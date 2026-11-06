# ADR-0018: Zahlen mit Dezimalpunkt, wie bei Franken

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Beträge zeigt die App als «CHF 5.05» (ADR-0004). Mengen erschienen bisher mit Komma («0,5 Stk.», «1,5»). Auf einem Bildschirm standen dann beide Schreibweisen nebeneinander, etwa auf der Wirkungs-Karte: «CHF 5.05 · 1,2 kg». Im Schweizer Alltag ist der Punkt verbreitet: auf Kassenbons, Preisschildern und vielen Packungen. CLDR nennt für `de-CH` ebenfalls den Punkt.

## Entscheid

- **Anzeige:** Zahlen erscheinen überall mit Dezimalpunkt und mit ’ zwischen den Tausendern, z. B. «0.5 Stk.», «1.2 kg» oder «1’250 g». Gerundet wird auf höchstens zwei Stellen, ohne Nullen am Ende.
- **Umsetzung:**
  - `formatDecimal` im Core erzeugt die Darstellung.
  - Die Funktion arbeitet deterministisch und hängt nicht von den Intl-Daten des Browsers ab, wie `formatChf`.
- **Eingabe:** Komma und Punkt bleiben beide erlaubt («1,5» und «1.5»). Vorbelegte Felder zeigen den Punkt und keine Tausender-Trennung, damit sie sich wieder einlesen lassen.

## Konsequenzen

- Beträge und Mengen sehen in der ganzen App gleich aus.
- Tests prüfen die Darstellung, damit kein Komma zurückkommt.
