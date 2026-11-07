# rettich im App Store und bei Google Play

Stand: 7.11.2026. Realistische Einschätzung für Alban. **Kosten und Konten entscheidet Alban** (CLAUDE.md, Freigabe).

## Weg

- **Capacitor** (MIT, gratis) legt eine native Hülle um die bestehende App. Es bleibt eine einzige Codebasis, die PWA läuft weiter.
- **Native Teile** dazu, damit Apple die App nicht als reine Webseite ablehnt (App Review Guidelines 4.2 «Minimum Functionality»):
  - Barcode-Scanner mit der Kamera-Hardware des Handys (schneller und schärfer als im Browser);
  - lokale Erinnerungen «läuft morgen ab», ohne Server;
  - Teilen-Menü für PDF-Berichte;
  - später Widgets und Kurzbefehle.
- **Builds:** Android baut auf jedem Rechner. iOS braucht macOS mit Xcode, also einen macOS-Runner in GitHub Actions oder einen Build-Dienst mit Gratis-Kontingent.

## Was es kostet und braucht

| | Apple App Store | Google Play |
| --- | --- | --- |
| Gebühr | 99 USD pro Jahr (Apple Developer Program) | 25 USD einmalig |
| Konto | Als Person: Verkäufername «Alban Hyseni». Als Firma: D-U-N-S-Nummer nötig | Identitätsprüfung. Firmenkonto: D-U-N-S-Nummer (bis 30 Tage) |
| Test vor dem Start | TestFlight: interne Tester ohne Prüfung, externe nach kurzer Prüfung | **Neue Privatkonten:** geschlossener Test mit mindestens 12 Testpersonen während 14 Tagen am Stück, erst dann die Freigabe für alle |
| Prüfung | meist 1–2 Tage, um Weihnachten langsamer | einige Tage |
| Datenschutz | Datenschutz-Angaben im Store, Link zur Datenschutzerklärung, Kontaktadresse | Formular «Datensicherheit», Link zur Datenschutzerklärung, Kontaktadresse |

rettich hat es dabei leicht: kein Konto, kein Tracking, keine Werbung, Daten bleiben auf dem Gerät.

## Zeitplan (ab heute, wenn Alban die Konten im November eröffnet)

| Wann | Was |
| --- | --- |
| bis ca. 21.11. | Pilot mit der PWA, neue Navigation, Feedback einbauen |
| bis ca. 5.12. | Capacitor-Hülle, nativer Scanner, lokale Erinnerungen, Icons und Startbild, Datenschutzerklärung als Webseite |
| ab ca. 5.12. | iOS: TestFlight für dich und die Testperson. Android: geschlossener Test mit 12 Personen startet (14 Tage) |
| Mitte bis Ende Dezember | **iOS im App Store**, wenn die Prüfung beim ersten Mal durchgeht |
| Anfang Januar 2027 | **Android bei Google Play**, nach 14 Tagen Test und der Freigabe |

**Realistisch mit Puffer** für eine Ablehnung und die Feiertage: **beide Stores bis Mitte Januar 2027.**

## Was Alban tun muss

1. Entscheiden: 99 USD pro Jahr (Apple) und 25 USD (Google).
2. Die Konten auf seinen Namen eröffnen. Das kann Claude nicht.
3. 12 Testpersonen für den Google-Test finden (Pilot, Familie, Freund:innen).
4. Eine Kontaktadresse für die Stores und die Datenschutzerklärung festlegen.

Bis dahin funktioniert rettich schon heute wie eine App: in Safari «Teilen» → «Zum Home-Bildschirm» ([`../pilot.md`](../pilot.md)).

## Quellen

- Apple App Review Guidelines, 4.2 Minimum Functionality: <https://developer.apple.com/app-store/review/guidelines/#minimum-functionality>
- Apple Developer Program (Gebühr): <https://developer.apple.com/programs/>
- Google Play, Testanforderungen für neue Privatkonten: <https://support.google.com/googleplay/android-developer/answer/14151465>
- Google Play Console, Registrierung und Gebühr: <https://support.google.com/googleplay/android-developer/answer/6112435>
