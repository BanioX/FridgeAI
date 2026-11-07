# ADR-0031: Tab-Leiste – Start, Vorrat, ＋ Erfassen, Kochen, Mehr

- **Status:** angenommen
- **Datum:** 2026-11-07

## Kontext

Alban (7.11.2026): «Ich brauche eine Super-App-Logik. Die Buttons müssen logisch und ohne viel Erklärung gebaut sein. Die aktuelle Menüführung gefällt mir noch nicht.»

- Statt «Heute» und «Haushalt» will er Menüwörter wie «Start» und «Mehr».
- Scannen und Erfassen gehören in **einen** Menüpunkt mit mehreren Wegen.
- Die Einkaufsliste ist nicht der Fokus der App und braucht keinen eigenen Tab.

Bisher gab es fünf Tabs: Heute, Vorrat, Scannen, Liste, Haushalt.

## Entscheid

Alban hat gewählt:

- **Leiste:** «Start · Vorrat · ＋ · Kochen · Mehr» (Nachtrag unten: zuerst vier Tabs, am selben Tag fünf).
  - Das ＋ steht in der Mitte, heisst «Erfassen» und steht als einziges Symbol in einem gefüllten Kreis: Es ist die Hauptaktion.
  - Hinter ＋ liegen alle Wege, etwas in den Vorrat zu bringen: Bon hochladen, Barcode scannen, von Hand, schnell erfassen, mit eigener KI.
- **«Mehr»** ist ein Menü wie in den iOS-Einstellungen: Bild, Titel, eine Zeile, was dahinter liegt.
  - Drin: Berichte als PDF, Nachkaufen, Daten und Datenschutz, der Hinweis zum Installieren.
  - Später: Hilfe und Konto.
  - Unterseiten haben oben links «‹ Mehr», und der Tab «Mehr» bleibt markiert.
- **Die Einkaufsliste heisst «Nachkaufen»** und liegt unter «Mehr». Ist ein Artikel aufgebraucht, weitergegeben oder weggeworfen, bietet der Hinweis «Nachkaufen» neben «Rückgängig» an.
- **Seitentitel = Tab-Name** (Start, Erfassen, Kochen, Mehr), wie in Apples eigenen Apps.
- **«Schnittstelle» statt «Vertrag»:** Die Liste aller Funktionen mit festen Ein- und Ausgaben (Zod) heisst in Texten und Doku «Schnittstelle». Im Code bleibt `contract`.
- **Alte Adressen leiten weiter:** `/scan` → `/add`, `/household` → `/more`. Lesezeichen und installierte Apps funktionieren weiter.

## Konsequenzen

- Umgesetzt in drei kleinen PRs:
  1. Leiste, «Mehr» und Weiterleitungen (#114). Die Berichte haben dort eine eigene Seite (#113).
  2. Die Seite «Erfassen» mit den Wegen als Menü und den Schnell-Chips darunter (#115).
  3. «Nachkaufen» mit einem Tipp nach dem Abschliessen (#116).
- Die Leiste hat Platz für genau fünf Ziele. Neues kommt unter «Mehr», nicht als sechster Tab.
- Ein Tab mehr Weg zur Liste. Das ist gewollt, weil Kühlschrank und Retten im Fokus stehen. Mit «Nachkaufen?» kommt die Liste dort, wo sie gebraucht wird.

## Nachtrag (7.11.2026): fünf Tabs mit «Kochen»

Alban, nach den Vorschaubildern: «Ich brauche 5 Menüs. ＋ ist in der Mitte, Start ganz links, Mehr ganz rechts, Vorrat 2. von links.»

- Für den fünften Tab standen Kochen, Wirkung, Check und Haushalt zur Wahl. Alban hat **«Kochen»** gewählt.
- **«Kochen»** zeigt unter «Rette heute» bis zu zehn Rezepte, die retten, was in drei Tagen abläuft, das Dringendste zuerst. Läuft nichts ab, sagt die Seite das.
- Rezepte (`/recipes/…`) gehören zum Tab «Kochen» und haben oben «‹ Kochen».
- «Start» behält die drei Rezeptideen als Kurzfassung.
- **«Alle Rezepte»** darunter: die ganze Sammlung, zuerst was mit dem Vorrat geht (am wenigsten fehlt), dann was mehr rettet, dann das Schnellste. Ein Tipp filtert nach Schnell, Vegetarisch, Vegan oder Eiweissreich. Dafür gibt es die Abfrage `recipes.list` in der Schnittstelle.

