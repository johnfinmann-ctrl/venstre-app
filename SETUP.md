# Nordic Media Engine — opsætning

## 1. Supabase (backend)
1. Opret projekt på supabase.com (EU-region).
2. Kør `supabase-schema.sql` i SQL Editor.
3. **Authentication → Providers**: aktiver "Email" (magic link / OTP).
4. **Authentication → URL Configuration**: sæt din live-URL som redirect.
5. **Database → Replication**: bekræft at `posts` er tilføjet til `supabase_realtime`
   (skemaet gør det automatisk, men tjek at "Enable Realtime" er slået til på tabellen).
6. Kopiér Project URL og anon key ind i `config.js` (`supabase.url` / `supabase.anonKey`).

## 2. White-label — sådan genbruges motoren til en ny kunde
Alt der adskiller kunder, ligger i **config.js**. `index.html`, `sw.js` og
`supabase-schema.sql` rører du normalt ikke.

1. Kopiér `config.js` til den nye kundemappe.
2. Ret `brand.name`, `brand.tagline`, `brand.logoText` eller `brand.logoImage`.
3. Ret `colors` (primary/primaryDeep/accent/accent2/accent3/accent4/mist) —
   sættes automatisk som CSS-variabler ved opstart, ingen kodeændring nødvendig.
4. Ret `nav` hvis menupunkterne skal hedde noget andet eller have andre ikoner
   (ikonnavne matcher `<symbol id="i-...">` i `index.html` — home, doc, calendar, play, menu m.fl.).
5. Ret `contact` og slå funktioner til/fra i `features`.
6. Opret et **nyt, separat Supabase-projekt** pr. kunde (kør skemaet igen) —
   data må ikke deles på tværs af kunder.
7. Byt ikonfiler (icon-192.png osv.) og `manifest.json`-farver til kundens brand.

## 3. Push-notifikationer (valgfrit)
Denne fil kan **modtage** push (service worker klar), men **afsendelse** kræver en
server-nøgle der aldrig må ligge i frontend:
1. `npx web-push generate-vapid-keys`
2. Læg den offentlige nøgle i `config.js` → `supabase.vapidPublicKey`.
3. Byg en Supabase Edge Function der læser `push_subscriptions` og sender via
   `web-push` med den private nøgle, fx trigget når et opslag skifter til "udgivet".
   Ikke inkluderet — sig til, så bygger jeg den.

## 4. Ikoner og QR
Læg `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (PNG) i samme mappe.
Generér installations-QR på goqr.me, der peger på live-URL'en.

## 5. Deploy
GitHub Pages: push alle filer til repo, aktivér Pages. Test altid på rigtig
mobil/Safari — ikke kun i preview.

## Roller
| Rolle | Kan |
|---|---|
| Bidragyder | Oprette opslag → status "afventer" |
| Redaktør | Publicere direkte, godkende/afvise, redigere/skjule |
| Administrator | Alt ovenstående + tildele roller, se statistik |

## Hvad er reelt funktionelt nu
- Multi-bruger login, roller, RLS på alle tabeller ✅
- Realtime feed — nye/redigerede opslag opdaterer automatisk uden refresh ✅
- Hero-karrusel, "Det sker"-kort, video-univers, kalenderkort ✅
- 3-trins publiceringsflow med upload til Supabase Storage ✅
- Admin: godkend/afvis, rolletildeling, statistik ✅
- Offline: udgivne opslag caches i IndexedDB ✅
- Dark/light mode, glassmorphism, outline-ikoner (ingen emoji) ✅
- White-label via config.js — farver, navn, logo, nav, kategorier ✅
- WCAG: fokusringe, aria-labels/roller, skip-link, kontrastsikre farver ✅

## Hvad kræver mere arbejde
- Push-afsendelse (Edge Function, se ovenfor)
- Planlagte opslag: `scheduled_at`/status "planlagt" findes i skemaet, men
  ingen cron/Edge Function skifter status automatisk ved tidspunktet endnu
- Billedkomprimering før upload
- Reelt Lighthouse 100/100 kræver egne optimerede ikon-/billedfiler
  (skabelonen bruger placeholder-billeder fra kundens egne uploads)
- Ikonfiler (192/512/maskable) — laves i klientens eget branding
