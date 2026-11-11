# ADR-0049: Öffentliches Repo, App nicht in Suchmaschinen

- **Status:** angenommen
- **Datum:** 2026-11-11
- **Entscheid:** Alban (öffentlich, nicht über Google findbar), Claude (Umsetzung)

## Kontext

Alban hat das Repo `BanioX/FridgeAI` am 11.11.2026 öffentlich gemacht: «Ist jetzt public, weiter mit CI/CD, und keine Website im Repo (für Google nicht findbar).» Die GitHub-Actions-Minuten des privaten Repos waren aufgebraucht; für öffentliche Repos sind die Standard-Runner von GitHub gratis.

## Entscheid

1. **CI läuft wieder für jeden PR,** gemergt wird nur bei grüner CI. Lokal wird trotzdem vor jedem Push alles geprüft (CLAUDE.md, Regel 8).
2. **Die Adresse der App steht nicht im Repo.** README, Pilot-Anleitung und ADRs nennen nur das Muster `fridgeai.<konto>.workers.dev`. Der Crawler nennt im User-Agent das Repo statt der App (ADR-0045).
3. **Die App sagt Suchmaschinen «noindex, nofollow»**, als Kopfzeile `X-Robots-Tag` für jede Antwort (auch Vorschau-Links) und als `meta robots` im HTML. Eine `robots.txt` mit `Disallow` gibt es bewusst nicht: Sie würde Google das Lesen von «noindex» verbieten.
4. **Die Lizenz bleibt proprietär.** Öffentlich einsehbar heisst nicht frei verwendbar (`LICENSE`, ADR-0015).

## Folgen

- Das Repo selbst kann Google finden, darauf hat ein Repo keinen Einfluss. Wer die App nicht finden soll, findet über das Repo nur das Muster der Adresse, nicht die Adresse.
- Im öffentlichen Repo liegen der Produktkatalog (Open Food Facts unter ODbL, Händlerseiten nach ADR-0045) und die Doku. Vor dem öffentlichen Start prüft eine Fachperson, ob das so bleiben kann (Parkplatz P24, `docs/ideen/schutz.md`).
- Die Kommentare von Cloudflare in PRs nennen weiterhin Vorschau-Links. Sie sind wegen «noindex» nicht in Suchmaschinen.
