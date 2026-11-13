/*
 * Everything on the site that changes lives in this one file.
 * Edit the text between the quotes, save, and refresh the page.
 * Anything marked PLACEHOLDER still needs a real value.
 */
window.SITE = {
  tagline: "Up-and-coming stand-up out of Connecticut.",

  bio: "Bill Wernicki is a stand-up comedian out of Connecticut, working everything from open mics in Colchester " +
       "to the stage at Comix Roadhouse at Mohegan Sun. Follow along on Instagram for new dates and clips.",

  homeBase: "Connecticut",
  // Leave the emails empty ("") until there's a real inbox: the site then sends
  // people to Instagram DMs instead of showing an email form.
  bookingEmail: "booking@billwernickicomedy.com",
  contactEmail: "",
  instagramDm: "https://ig.me/m/billwernickicomedy",

  /*
   * Shows. Dates are YYYY-MM-DD. The site sorts them and moves a show to
   * "Past shows" automatically the day after it happens.
   * setMinutes is roughly how long Bill's set is; My Stats uses it.
   * Leave ticketUrl empty ("") to show "Tickets soon".
   * tickets: false hides the Tickets button (open mics, free shows).
   * Optional: time: "20:00" (24-hour, Eastern) makes the "Remind me" calendar
   * event start then; without it the reminder is an all-day event.
   */
  shows: [
    { date: "2026-11-18", venue: "Toyo Hibachi & Asian Fusion",    city: "Colchester, CT", note: "Open mic", time: "19:00", tickets: false, setMinutes: 7 },
    { date: "2026-11-18", venue: "Koncrete Gardens",               city: "Hartford, CT", note: "Open mic", time: "20:00", tickets: false, setMinutes: 10 },
    { date: "2026-12-03", venue: "Comix Roadhouse at Mohegan Sun", city: "Uncasville, CT", note: "", ticketUrl: "", setMinutes: 10 },

    // Past shows (fans can mark these "I was there")
    { date: "2026-09-24", venue: "Comix Roadhouse",                city: "Uncasville, CT", note: "", setMinutes: 5 },  // from Instagram; set length is a guess
  ],

  /*
   * Clips. For a YouTube video, paste the ID: the part after "v=" in
   * youtube.com/watch?v=XXXXXXXXXXX (or after youtu.be/ or /shorts/).
   * For an Instagram post or reel, paste its link as instagramUrl instead.
   * Leave both empty to show a "coming soon" tile.
   * minutes is the clip length; My Stats counts it when someone plays it.
   */
  clips: [
    // vertical: true marks a YouTube Short (tall 9:16 tile).
    { title: "Live at Comix Roadhouse",             youtubeId: "7me0z_dEd7c", vertical: true },
    { title: "Made Timmy No Brakes laugh",          youtubeId: "ATlGfxXeHLk", vertical: true },
    { title: "Russell Brand and the Minions",       youtubeId: "totqPqhek44", vertical: true },
    { title: "Hey Toyo set, 11/4",                  youtubeId: "5FCxjrDLaAQ", vertical: true },
  ],
  // "More on YouTube" link under the clips. Empty hides it.
  youtubeChannel: "https://www.youtube.com/@yungbill99",

  // Social links. Delete a line to hide it.
  socials: [
    { name: "Instagram", handle: "@billwernickicomedy", url: "https://www.instagram.com/billwernickicomedy/" },
    { name: "YouTube",   handle: "@yungbill99",         url: "https://www.youtube.com/@yungbill99" },
    // Add more when they exist, e.g.:
    // { name: "TikTok",  handle: "@billwernickicomedy", url: "https://www.tiktok.com/@billwernickicomedy" },

  ],

  /*
   * Newsletter ("Join the list"), run by Brevo (free plan). action is the form
   * link from Brevo (your form -> Share; it contains sibforms.com/serve/).
   * Signups land in the BWC list. confirmEmail: set to true once the Brevo form
   * uses "Double confirmation" (its confirm link should redirect to
   * https://billwernickicomedy.com/join/?confirmed=1). While action is empty,
   * the form says the list opens soon.
   */
  newsletter: {
    action: "https://054c5ddd.sibforms.com/serve/MUIFAL5KFD-54bGL-do0PnQ6CANsqKtTme4G2NuQdwYq8Od3LqMV6TnS8rCipIS4C5jemAIR1tdMUEaI3JD3YARdYDhBAA3pNikT-1cJdJQpHybH95sSnN7_7z1wzzglIIbXKOw5jl7H2TvU73bnJOpWysYVpGky1GEgsbuE_5V4hwwyAy5Em4U3Ucai_RKEdZBh_W33kIEt4vXGCg==",
    confirmEmail: true,
  },

  /*
   * Merch. url can point at any store (Shopify, Big Cartel, Fourthwall, etc).
   * Leave url empty to show "Coming soon".
   */
  merch: [
    { name: "Logo Tee",       price: "$30", url: "", art: "logo-tee" },
    { name: "BWC Hoodie",     price: "$55", url: "", art: "hoodie" },
    { name: "BWC Dad Hat",    price: "$28", url: "", art: "hat" },
  ],
};
