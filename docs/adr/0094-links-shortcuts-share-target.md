# ADR-0094: Link zur Einkaufsliste, Verknüpfungen am App-Symbol und «Teilen an Rettich»

- **Status:** angenommen
- **Datum:** 2026-11-14
- **Entscheid von:** Claude (Alban, 14.11.2026: «Kannst du Rettich für Web, iPhone und iPad optimieren», danach die Frage nach Sprachassistenten)

## Kontext

Rettich läuft ohne Server und ohne Konto, alles liegt auf dem Gerät (ADR-0020). Andere Apps und das Betriebssystem erreichen Rettich deshalb nur über Adressen der App selbst. Drei Wege brauchen keinen Server:

1. **Ein Link** mit Text, der in der App landet.
2. **Verknüpfungen am App-Symbol** (`shortcuts` im Web-App-Manifest): lange drücken auf Android, Rechtsklick im Dock oder in der Taskleiste am Computer.
3. **«Teilen an Rettich»** (`share_target`): Android zeigt eine installierte Web-App im Teilen-Menü.

## Entscheid

- **`/shopping?add=…`** füllt das Feld «Was brauchst du?» mit dem Text. Rettich fügt nichts von selbst hinzu: Ein Tipp auf «Auf die Liste» übernimmt ihn, wie beim Tippen. Ein fremder Link kann die Liste so nie verändern. Danach entfernt Rettich den Text aus der Adresse, damit ein Neuladen das Feld nicht nochmals füllt. Der Text wird auf 500 Zeichen gekürzt, wie im Feld.
- **Teilen:** `share_target` schickt `title`, `text` und `url` per GET an `/shopping`. Rettich nimmt den Text, sonst den Titel. Ein geteilter Link ist nichts zum Kaufen und bleibt weg. Dateien (Quittungs-PDFs) kommen später: Sie bräuchten POST und einen eigenen Teil im Service Worker.
- **Vier Verknüpfungen:** «Auf die Einkaufsliste», «Quittung erfassen», «Etwas erfassen», «Kühlschrank-Check». Sie öffnen Seiten, nie direkt die Kamera: Die Kamera startet erst nach einem Tipp (Harte Regel).
- **Kein Leitfaden für Kurzbefehle auf dem iPhone, vorerst.** iOS öffnet Links aus Kurzbefehlen in Safari, nicht in der installierten Web-App, und beide haben getrennte Speicher. Ein Kurzbefehl würde die Einkaufsliste in Safari füllen, nicht die in der App auf dem Home-Bildschirm. Wer Rettich in Safari nutzt, kann den Link trotzdem in einem Kurzbefehl verwenden.

## Folgen

- `incoming-text.ts` liest den Text, `home-screen-shortcuts.spec.ts` prüft Link, Teilen, das Aufräumen der Adresse und dass jede Verknüpfung eine echte Seite öffnet.
- iOS ignoriert `shortcuts` und `share_target`. Dort bleibt der Weg über die App selbst.
- Eine neue Verknüpfung braucht eine Seite, die ohne vorherige Eingabe Sinn ergibt, und eine Zeile im Test.
