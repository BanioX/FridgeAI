# ADR-0086: Optionale App-Sperre mit Face ID, nur auf dem Gerät

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude (kostenlos, nichts verlässt das Gerät; Freigabe für Kostenloses, Alban 6.11.2026)

## Kontext

Rettich liegt offen auf dem Handy: Wer ein entsperrtes Handy in der Hand hält, sieht Vorrat, Quittungen und Ausgaben. Gewünscht ist eine freiwillige Sperre mit Face ID, ohne Konto und ohne Server (ADR-0003, ADR-0020).

## Entscheid

1. **WebAuthn mit dem Plattform-Authenticator** (iPhone: Face ID, Touch ID oder Gerätecode; sonst die Entsperrung des Geräts). Einschalten erzeugt einen Zugangsschlüssel (`userVerification: 'required'`, `residentKey: 'discouraged'`, `attestation: 'none'`), Entsperren fragt ihn mit `navigator.credentials.get` ab. Es gibt keinen Server und keine Prüfung einer Signatur: Erfolg heisst «die Person hat dieses Gerät eben entsperrt». Das ist eine lokale Sichtschutz-Sperre, kein Zugriffsschutz auf Serverdaten.
2. **Einstellungen nur im localStorage** (`fridgeai:app-lock`: Kennung des Schlüssels, «Sperren nach» Sofort, 1 Minute, 5 Minuten; Standard 1 Minute), bewusst nicht in Dexie und nicht in Export und Import. Ein Import auf einem anderen Gerät darf niemanden aussperren, dort kennt der Schlüssel die Daten nicht.
3. **Gesperrt** ist Rettich beim Start und wenn die App nach mindestens der gewählten Zeit im Hintergrund wieder sichtbar wird. Die Sperre sitzt über Daten und Router und zeigt eine eigene Ansicht. Beim Start ist die App vor dem ersten Entsperren gar nicht im DOM. Sperrt Rettich später nach Zeit im Hintergrund, bleibt die App geladen, ist aber `hidden` und `inert` (nicht zu sehen, nicht vorgelesen, nicht erreichbar): So ist eine halb geprüfte Quittung nach dem Entsperren noch da, etwa nach einem Abstecher in die App des Händlers.
4. **Kein Aussperren:** «Sperre neu einrichten» auf der Sperransicht erzeugt einen neuen Schlüssel (das beweist die Person am Gerät), ersetzt die Kennung und entsperrt. Ausschalten verlangt zuerst eine erfolgreiche Entsperrung.
5. **Hinter einer Schnittstelle:** `DeviceUnlock` (`apps/web/src/app/lock/`) mit Browser-Umsetzung und einer Attrappe für Tests; `packages/core` bleibt ohne Browser.
6. **Header:** `Permissions-Policy` erlaubt `publickey-credentials-create` und `-get` für die eigene Herkunft.

## Folgen

- **Keine Verschlüsselung:** Die Daten liegen unverschlüsselt in IndexedDB. Wer das Gerät entsperrt hat und Browser-Werkzeuge nutzt, kommt daran. Die Sperre schützt vor dem Blick, nicht vor einem Angriff auf das Gerät. Das steht im Text der Einstellung.
- **Kein Server, keine Wiederherstellung:** Wer die Website-Daten löscht, verliert Schlüssel und Einstellung (und die Daten ohnehin, siehe Export).
- **Synchronisierter Schlüssel:** Der Zugangsschlüssel kann im iCloud-Schlüsselbund auf andere Geräte der Person wandern, Daten von Rettich nie. Auf einem anderen Gerät ist die Sperre erst mit eigener Einrichtung an.
- **Face ID bleibt beim iPhone:** Rettich erhält nur «ja» oder «nein» vom Gerät, nie biometrische Daten.
- Fällt die Entsperrung des Geräts weg (Gerätecode entfernt), schlägt auch «Sperre neu einrichten» fehl; dann hilft nur das Löschen der Website-Daten. Selten genug, um es nicht zu umgehen.
- Neuer Speicher-Schlüssel und neue Geräte-Funktion stehen in `docs/swelp/nebenwirkungen.md` (SE-28, SE-29).
