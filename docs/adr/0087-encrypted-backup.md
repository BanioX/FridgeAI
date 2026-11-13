# ADR-0087: Sicherung mit Passwort verschlüsseln; security.txt

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude (Freigabe für Kostenloses, Alban 6.11.2026; Sicherung gehört zu ADR-0020)

## Kontext

Der Gesamt-Export («Alles exportieren (JSON)») enthält Einkäufe, Preise und die Namen der Personen im Haushalt als Klartext. Die Datei liegt danach in Downloads, in der Cloud-Ablage oder in einer Mail. Wer sie findet, kann alles lesen. Rettich hat kein Konto und keinen Server, also gibt es auch niemanden, der ein vergessenes Passwort zurücksetzen könnte.

## Entscheid

1. **Optional:** «Mit Passwort schützen» beim Export. Ohne Haken bleibt alles wie bisher. Mindestens 8 Zeichen, ein Feld mit Anzeigen-Knopf, dazu der Hinweis, dass die Sicherung ohne Passwort nicht mehr zu öffnen ist.
2. **WebCrypto auf dem Gerät**, keine neue Abhängigkeit: PBKDF2 mit SHA-256, 600000 Runden (Richtwert von OWASP für PBKDF2-HMAC-SHA-256) und einem zufälligen Salz von 16 Bytes erzeugt einen AES-GCM-Schlüssel mit 256 Bit. Jede Datei bekommt einen neuen zufälligen IV von 12 Bytes. AES-GCM prüft zugleich die Echtheit: Eine veränderte Datei lässt sich nicht öffnen.
3. **Umschlag** als JSON: `{"format":"rettich-encrypted","version":1,"kdf":{…,"salt"},"cipher":{…,"iv"},"data"}` mit Base64. Parameter stehen in der Datei, so kann eine spätere Version sie anheben und alte Dateien bleiben lesbar. Beim Lesen sind Runden über 5 Millionen abgewiesen, damit eine fremde Datei den Tab nicht einfriert.
4. **Dateiname** mit Zusatz: `rettich-2026-11-13-geschuetzt.json`.
5. **Import:** Die App erkennt den Umschlag, fragt das Passwort ab und gibt den entschlüsselten Text unverändert an den bisherigen Weg (`HouseholdExportSchema`, Rückfrage, `household.import`). Ein falsches Passwort zeigt «Das Passwort passt nicht zu dieser Sicherung.» und lässt es nochmals zu. Das Passwort wird als Unicode NFC normalisiert, damit es auf jedem Gerät gleich ankommt.
6. **Ort im Code:** `apps/web/src/app/backup-crypto.ts`, weil WebCrypto eine Laufzeit-Schnittstelle ist (`packages/core` bleibt rein). Nicht in `src/data/`: Die UI darf diese Schicht nur über den Vertrag erreichen (ADR-0034, Lint-Regel), und die Verschlüsselung ist kein Speicher.
7. **security.txt** (RFC 9116) unter `/.well-known/security.txt` mit Kontakt auf die GitHub-Meldung, Ablaufdatum 13.11.2027 und Sprachen. **Ohne `Canonical`**: Die Adresse der App darf nicht ins Repo (ADR-0049). Der Service Worker leitet `/.well-known/` nicht auf `index.html` um (`navigateFallbackDenylist`), `_headers` setzt `text/plain`. `SECURITY.md` beschreibt den Meldeweg. Das Ablaufdatum muss vor dem Termin erneuert werden; ein Test schlägt sonst fehl.

## Folgen

- **Passwort weg heisst Sicherung weg.** Es gibt keine Wiederherstellung, keinen Hintertürschlüssel, keinen Server. Die App sagt das beim Export.
- Die Sicherung ist nur so stark wie das Passwort; 8 Zeichen sind das Minimum, nicht die Empfehlung.
- Der Schlüssel entsteht in etwa einer Sekunde Rechenzeit auf dem Handy, beim Export und beim Öffnen.
- Ungeschützte Sicherungen und alle bisherigen Dateien laden wie zuvor.
- Offen: Die private Meldung von Sicherheitslücken muss in den GitHub-Einstellungen des Repos aktiviert sein, damit der Kontakt in `security.txt` greift.
