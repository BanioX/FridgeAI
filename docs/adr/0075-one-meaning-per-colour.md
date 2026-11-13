# ADR-0075: Eine Bedeutung pro Farbe

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude, auf Albans Wunsch («Premium Design, Simplicity», 13.11.2026)

## Kontext

Die Prüfung aller Bildschirme vom 13.11.2026 fand Farben ohne feste Bedeutung. Jede für sich war schön, zusammen wirkte die App bunter als die drei Markentöne:

- «Verwertet» war im Bilanz-Kreis Onyx (Alban, 8.11.2026), im Journal Smaragd.
- Es gab zwei Rot: `#B3261E` für «Entsorgt» und «Nicht mehr verwenden», `#A63A22` für «heute» und das Journal. Gewählt war «Entsorgt» auf der Artikelseite grün wie «Verwertet».
- Die vier Lagerort-Kacheln auf Start waren Flächen in Smaragd, Eisblau, Weizen und Oliv.
- Jedes Datum trug eine Farbe, auch «in 12 Tagen» (Smaragd) oder «bis März» (Eisblau).
- Initialen von Personen waren pastellfarben, der Haltbarkeits-Ring braun, rot oder grün.

## Entscheid

1. **Smaragd heisst tun und gewählt:** Knöpfe, gewähltes Segment, aktiver Tab, Wischen «Verwertet».
2. **Onyx heisst Ergebnis:** «Verwertet» in Bilanz-Kreis und Journal, der Haltbarkeits-Ring für jede Stufe (die Stufe steht als Wort daneben).
3. **Ein Rot** (`#B3261E`): «Entsorgt» überall, auch als gewähltes Segment und als Knopf «Als entsorgt speichern», dazu «heute» und «Nicht mehr verwenden». Das Token `today` hat jetzt denselben Wert wie `danger`, die helle Fläche bleibt.
4. **Bernstein heisst bald:** «morgen», «in 2 Tagen».
5. **Alles andere ist Silber:** Daten, die nicht fällig sind, Initialen von Personen und die Lagerort-Kacheln auf Start (weiss, Symbol und Zahl in Onyx, nur die rote Zahl für Fälliges). Die Akzentfarben der Lagerorte bleiben im Symbol, zum Beispiel bei «Verschieben nach».

## Folgen

- Farbe sagt auf einen Blick, wo etwas zu tun ist. Die Bedeutung trägt weiter immer ein Wort.
- Personen unterscheiden sich in der Zeile nur noch durch ihre Initialen.
- `docs/design.md` und `docs/marke.md` nennen die Regel; die Werte stehen in `apps/web/src/index.css`.
