# Sicherheit

Hast du ein Sicherheitsproblem in Rettich gefunden? Danke, dass du es meldest.

## So meldest du es

Öffne auf GitHub im Repository den Reiter «Security» und wähle «Report a vulnerability» (direkt: <https://github.com/BanioX/FridgeAI/security/advisories/new>). Beschreibe, was du gesehen hast und wie man es nachstellt. Bitte schreib keine Einzelheiten einer Lücke in ein öffentliches Issue. Gibt es die Schaltfläche nicht, eröffne ein Issue mit dem Satz «Ich möchte ein Sicherheitsproblem melden», ohne Einzelheiten, dann ergibt sich ein privater Weg. Schreib auf Deutsch oder Englisch.

Der gleiche Weg steht in `security.txt` (unter `/.well-known/`, RFC 9116).

## Was dazugehört

- die App selbst (Code in diesem Repository),
- ihre Antwort-Header (Content Security Policy, `X-Robots-Tag` und weitere),
- die Daten auf dem Gerät: Speicherung, Export und Import, auch die Sicherung mit Passwort.

Nicht dazu gehören Lücken in Diensten Dritter (zum Beispiel Open Food Facts oder der Hosting-Anbieter) und Hinweise, die nur auf fehlenden Konten oder Servern beruhen: Rettich hat bewusst beides nicht.

## Was du erwarten darfst

Rettich ist ein Einzelprojekt ohne feste Reaktionszeit. Eine Meldung wird gelesen, eingeschätzt und, wenn sie stimmt, so bald wie möglich behoben. Bitte greif keine Daten anderer Personen an und prüfe nur auf deinem eigenen Gerät.

Die Adresse der App steht absichtlich nicht in diesem öffentlichen Repository (ADR-0049).
