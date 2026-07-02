/* ============================================================
   NORDIC MEDIA ENGINE — konfigurationsfil
   Kopiér denne fil pr. kunde. Alt visuelt og indholdsmæssigt
   der adskiller én kundes app fra en anden, styres herfra.
   Selve app-motoren (index.html) rører du normalt ikke.
   ============================================================ */
window.NORDIC_CONFIG = {

  // ---------- IDENTITET ----------
  brand: {
    name: "Nordic Media",
    tagline: "Nyt der betyder noget",
    logoText: "N",              // bruges hvis logoImage er tom
    logoImage: "",              // fx "logo.svg" — overskriver logoText hvis udfyldt
    footerCredit: "Bygget af Nordic Operations · nordicoperations.dk"
  },

  // ---------- FARVER (sættes som CSS custom properties ved opstart) ----------
  colors: {
    primary:      "#2B4EFF",   // dyb blå — knapper, links, aktiv tilstand
    primaryDeep:  "#0F1B3D",   // mørk navy — hero-gradients, mørk baggrund
    secondary:    "#FFFFFF",   // hvid — kortflader
    accent:       "#17B26A",   // grøn — succes/primær kategori-accent
    accent2:      "#8B5CF6",   // violet — kategori-accent
    accent3:      "#F5487F",   // rosa — kategori-accent
    accent4:      "#F5A524",   // amber — kategori-accent
    mist:         "#F3F5FA"    // lys grå — baggrund
  },

  // ---------- NAVIGATION (bottom nav, i rækkefølge) ----------
  nav: [
    { id: "home",     label: "Hjem",     icon: "home" },
    { id: "nyt",      label: "Nyt",      icon: "doc" },
    { id: "kalender", label: "Kalender", icon: "calendar" },
    { id: "video",    label: "Video",    icon: "play" },
    { id: "mere",     label: "Mere",     icon: "menu" }
  ],

  // ---------- KONTAKT / OM (vises under "Mere") ----------
  contact: {
    email: "info@eksempel.dk",
    phone: "",
    about: "Nordic Media er en informationsplatform bygget på Nordic Operations' app-motor."
  },

  // ---------- FUNKTIONER (slå til/fra uden kodeændringer) ----------
  features: {
    comments: true,
    favorites: true,
    push: true,
    search: true,
    darkMode: true,
    realtime: true
  },

  // ---------- SUPABASE ----------
  supabase: {
    url: "https://DIT-PROJEKT.supabase.co",
    anonKey: "DIN-ANON-KEY",
    vapidPublicKey: "" // udfyldes ved push-opsætning, se SETUP.md
  }
};
