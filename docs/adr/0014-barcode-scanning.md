# ADR-0014: Barcode- und QR-Scan im Browser (ZXing als WebAssembly, selbst gehostet)

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban will Barcode, QR-Code und Kamera «asap» testen (Schritt 10a). Die App läuft als PWA vor allem auf dem iPhone. Safari hat **keinen** nativen `BarcodeDetector`, Chrome auf Android schon. Der Plan sah `@zxing/browser` vor; diese JavaScript-Portierung wird kaum noch gepflegt und liest GS1 DataMatrix (Codes mit Ablaufdatum) schwächer als die C++-Bibliothek.

## Entscheid

- **`barcode-detector`** (MIT) als Ponyfill der Barcode Detection API, darunter **`zxing-wasm`** (MIT, ZXing-C++ als WebAssembly). Formate: EAN-13/8, UPC-A/E, QR, DataMatrix. Gleiches Verhalten auf iPhone und Android.
- **Selbst gehostet:** Die `.wasm`-Datei (rund 950 KB) kommt aus unserem eigenen Build (`prepareZXingModule` mit `locateFile`). Kein CDN, gemäss CLAUDE.md. Sie wird erst beim ersten Scan geladen und vom Service Worker für offline vorgehalten.
- **CSP:** `script-src` erhält `'wasm-unsafe-eval'`, das nur das Kompilieren von WebAssembly erlaubt, kein `eval` für JavaScript.
- **Ablauf:** Die Kamera startet erst nach einem Tipp (`getUserMedia`, Rückkamera). Gelesen wird alle 250 ms. Ein Treffer stoppt die Kamera. Fallbacks sind immer da: Foto wählen (wird nur im Speicher gelesen, nie gespeichert) und Nummer eintippen. Für eine blockierte und eine fehlende Kamera gibt es je einen eigenen Hinweis.
- **Scharfes Bild aus der Nähe** (Nachtrag, Rückmeldung Alban: «Kamera ist unscharf»):
  - Die App wünscht 1920×1080, weil Browser sonst oft mit 640×480 starten.
  - Sie wählt das Hauptobjektiv statt Ultraweitwinkel, Tele oder der virtuellen «Dual»- und «Triple»-Kamera. Auf iPhone-Pro-Modellen stellt die Standardwahl auf 10 cm nicht scharf. Safari bietet keine Fokus-Steuerung.
  - Wo der Browser es anbietet (Chrome, Android), setzt sie Dauer-Autofokus und 2× Zoom. Das Handy kann dann auf rund 20 cm bleiben, wo es scharf stellt.
  - Dazu kommen ein Zielrahmen, der Hinweis «etwa 20 cm, bei Unschärfe etwas weiter weg», Licht (wo verfügbar) und ein kurzes Vibrieren bei Treffern (Android).
- **Foto aus der Galerie:** Das Dateifeld hat kein `capture` mehr. Telefone bieten dann Kamera und Fotomediathek an, also auch Screenshots und alte Fotos.
- **Auswertung im Kern:** `parseScannedCode` liest GTIN, GS1-Element-Strings und Digital Links (ADR-0006). Ein Datum aus dem Code wird übernommen (`expirySource: gs1_code`, mit Art MHD oder Verbrauchsdatum), solange die Person es nicht ändert.

## Konsequenzen

- Beide Pakete sind **exakt gepinnt**: `barcode-detector` verlangt genau eine `zxing-wasm`-Version, und unsere selbst gehostete `.wasm`-Datei muss dazu passen. Ein Update betrifft immer beide zusammen.
- Zwei kleine Laufzeit-Dependencies statt `@zxing/browser` (Plan, Frage 6 aktualisiert). Beide sind kostenlos und Open Source (Freigabe Alban, 6.11.2026).
- E2E-Tests lesen einen echten EAN-13 aus einem gezeichneten Foto, prüfen die CSP und testen Kamera erlaubt und blockiert (Chromium mit Fake-Kamera).
- Offen (Schritt 10b): Produktnamen zum Barcode. Lokal bekannte Produkte gehen ohne Rückfrage; die Suche bei Open Food Facts erst nach Albans Entscheid, weil dabei die Nummer das Gerät verlässt.
- Später (10c): Scan-Modi «Schnell» und «Gründlich».
- Grenze des Webs: Native Apps (z. B. Yazio) nutzen Apples Vision bzw. Googles ML Kit mit voller Fokus- und Objektivsteuerung. Die gleiche Geschwindigkeit erreicht nur eine native Hülle (z. B. Capacitor). Siehe `docs/ideen/`. Das kostet Gebühren für die App-Stores, deshalb entscheidet Alban.
