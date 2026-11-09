# Scan und Produktdaten: wie schnell und vollständig wie Yazio?

Frage Alban: «Woher bezieht Yazio die Daten? Muss ich für mehr Automatisierung etwas machen? Ich bin ja kommerzieller Player.»

## Woher Yazio die Daten hat (öffentliche Angaben, nicht offiziell bestätigt)

- **Allgemeine Lebensmittel** (Apfel, Brot): aus dem lizenzierten Bundeslebensmittelschlüssel (BLS) des Max Rubner-Instituts (Deutschland). Laut einem Konkurrenzvergleich ([Nutrola](https://nutrola.app/en/blog/can-i-trust-calorie-counts-on-yazio)).
- **Barcodes:** Herstellerangaben und **Einträge der Nutzenden**, die nach leichter Prüfung für alle sichtbar werden. Doppelte Einträge werden laut [Yazio-Hilfe](https://help.yazio.com/hc/ru/articles/4576053290001-How-can-I-edit-public-foods) nach und nach bereinigt.
- **Grösse:** über 4 Millionen Einträge, stark in Deutschland, Österreich und der Schweiz ([App Store](https://apps.apple.com/gb/app/id946099227), [Review](https://calorie-trackers.com/reviews/yazio/)).
- **Kamera:** Yazio ist eine **native App**. Sie nutzt Apples Vision bzw. Googles ML Kit mit voller Kontrolle über Objektiv, Fokus und Makro. Daher kommt die Geschwindigkeit.

## Was Rettich heute hat

- Open Food Facts (ODbL, kostenlos, auch kommerziell nutzbar), 30 Tage Cache auf dem Gerät (ADR-0016).
- Jeder Scan im Haushalt wird gemerkt: Der zweite Scan desselben Produkts geht offline.
- Web-Kamera mit Hauptobjektiv, 1920×1080, Zoom und Autofokus, wo der Browser es erlaubt (ADR-0014). Das ist besser als vorher, aber nicht ganz auf nativem Niveau.

## Optionen, nach Aufwand und Kosten

| Option | Bringt | Kosten | Was Alban tun müsste |
| --- | --- | --- | --- |
| **Produktbild von Open Food Facts** | Foto der Packung im Vorrat | gratis | nichts (wird gebaut) |
| **Open Food Repo** (EPFL, Schweizer Produkte, inkl. Bilder, CC BY 4.0, [Quelle](https://github.com/salathegroup/openfood_api/)) | bessere Abdeckung in der Schweiz | gratis, API-Schlüssel | Konto bei foodrepo.org anlegen; den Schlüssel gebe ich nie in die App, er braucht einen kleinen Server (Worker) |
| **Eigene Produktdatenbank aus den Haushalten** (wie Yazio) | wächst mit jeder Erfassung | gratis | Einwilligung der Nutzenden; braucht Konten (Schritt 7) |
| **Beiträge an Open Food Facts** (unbekannte Produkte mit Foto hochladen, nur mit Einwilligung) | alle profitieren, auch wir | gratis | Entscheid «Daten verlassen das Gerät» |
| **Suche ohne Netz:** Auszug der Schweizer Produkte von Open Food Facts, selbst gehostet (Name, Marke, Grösse, Barcode) | Treffer beim Tippen sofort und offline, keine Wörter verlassen das Gerät, keine Grenze von 10 Suchen pro Minute | gratis; einige MB Download; der Auszug steht unter ODbL (Namensnennung, Weitergabe unter gleicher Lizenz), das ist eine Datenbank-, keine Code-Lizenz | Lizenzfrage mit dir klären (ADR-0015 regelt nur Code) |
| **Kommerzielle APIs** (z. B. FatSecret, Edamam, Nutritionix) | mehr Treffer, vor allem USA | Gratis-Stufen mit Limits, sonst Abo | Konto und Vertrag, Preisentscheid |
| **Herstellerdaten über GS1 Schweiz** | offizielle Stammdaten mit Bildern | kostenpflichtig | Mitgliedschaft oder Vertrag |
| **Native Hülle** (Capacitor: dieselbe App, im App Store) | Scan so schnell wie Yazio (Vision, ML Kit), echte Push-Mitteilungen auch ohne Installation | Apple 99 USD pro Jahr, Google 25 USD einmalig | Entwickler-Konten bei Apple und Google |

## Empfehlung

1. **Jetzt (gratis):** Produktbild von OFF, bessere Web-Kamera (erledigt), Lerneffekt im Haushalt (erledigt).
2. **Für den Pilot:** reicht so. Unbekannte Produkte gibst du einmal ein, danach kennt Rettich sie.
3. **Nach dem Pilot, wenn es zieht:**
   - native Hülle mit Capacitor: der grösste Sprung beim Scan;
   - Open Food Repo über einen kleinen Server;
   - eigene, geteilte Produktdatenbank mit Einwilligung.
   - Damit sind wir bei der Datenqualität nah an Yazio, ohne Lizenzkosten am Anfang.
