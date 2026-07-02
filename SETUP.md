# Nordic Info — opsætning

## 1. Supabase (backend)
1. Opret projekt på supabase.com (vælg EU-region af hensyn til GDPR).
2. Kør `supabase-schema.sql` i SQL Editor.
3. Under **Authentication → Providers**: aktiver "Email" med magic link (OTP).
4. Under **Authentication → URL Configuration**: sæt din GitHub Pages-URL som redirect.
5. Kopiér Project URL og anon key ind i `index.html` (`CONFIG.SUPABASE_URL` / `SUPABASE_ANON_KEY`).

## 2. Push-notifikationer (valgfrit, kræver ekstra trin)
Denne fil kan **modtage** push (service worker er klar), men **afsendelse** kræver en
server-nøgle der aldrig må ligge i frontend. Løsning:
1. Generér VAPID-nøglepar (`npx web-push generate-vapid-keys`).
2. Læg den offentlige nøgle i `CONFIG.VAPID_PUBLIC_KEY`.
3. Opret en Supabase Edge Function der læser `push_subscriptions`-tabellen og sender
   via `web-push` med den private nøgle, når et opslag udgives (fx trigger på insert).
   Denne funktion er ikke inkluderet — sig til, så bygger jeg den.

## 3. Ikoner og QR
- Læg `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` i samme mappe (192×192 og 512×512 px, PNG).
- Generér installations-QR på goqr.me, der peger på din live-URL.

## 4. Deploy
- GitHub Pages: push `index.html`, `sw.js`, `manifest.json` + ikoner til repo, aktivér Pages.
- Test **altid** på rigtig mobil/Safari — ikke kun i preview.

## Roller
| Rolle | Kan |
|---|---|
| Bidragyder | Oprette opslag → status "afventer", synlig for redaktør/admin |
| Redaktør | Publicere direkte, godkende/afvise bidrag, redigere/skjule opslag |
| Administrator | Alt ovenstående + tildele roller, se statistik |

## Hvad er reelt funktionelt nu
- Multi-bruger login (magic link), roller, RLS på alle tabeller ✅
- Feed, kategorier, søgning, favoritter, kommentarer (til/fra pr. opslag) ✅
- 3-trins publiceringsflow med billede/video-upload til Supabase Storage ✅
- Admin: godkend/afvis, rolletildeling, statistik ✅
- Offline: udgivne opslag caches i IndexedDB og vises hvis netværket fejler ✅
- Dark/light mode, WCAG-fokusringe, skip-link, aria-roller ✅

## Hvad kræver mere arbejde
- Push-afsendelse (Edge Function, se ovenfor)
- Planlagte opslag (`scheduled_at` findes i skemaet, men der er endnu ingen cron/Edge
  Function der rent faktisk skifter status fra "planlagt" til "udgivet" på tidspunktet)
- Billedkomprimering før upload (uploades i fuld størrelse i dag)
- Ikonfiler (192/512/maskable) — skal laves i klientens eget branding
