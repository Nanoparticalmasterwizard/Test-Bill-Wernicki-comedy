/*
 * Everything on the site that changes lives in this one file.
 * Edit the text between the quotes, save, and refresh the page.
 * Anything marked PLACEHOLDER still needs a real value.
 */
window.SITE = {
  tagline: "Up-and-coming stand-up. Catch him in a small room before the rooms get big.",

  bio: "Bill Wernicki is a stand-up comedian out of Connecticut, working everything from open mics in Colchester " +
       "to the stage at Comix Roadhouse at Mohegan Sun. Catch him now, while the rooms are still small.",

  homeBase: "Connecticut",
  // Leave the emails empty ("") until there's a real inbox: the site then sends
  // people to Instagram DMs instead of showing an email form.
  bookingEmail: "",   // e.g. "booking@billwernickicomedy.com"
  contactEmail: "",
  instagramDm: "https://ig.me/m/billwernickicomedy",

  /*
   * Shows. Dates are YYYY-MM-DD. The site sorts them and moves a show to
   * "Past shows" automatically the day after it happens.
   * setMinutes is roughly how long Bill's set is; My Stats uses it.
   * Leave ticketUrl empty ("") to show "Tickets soon".
   * Optional: time: "20:00" (24-hour, Eastern) makes the "Remind me" calendar
   * event start then; without it the reminder is an all-day event.
   */
  shows: [
    { date: "2026-11-21", venue: "Comix Roadhouse at Mohegan Sun", city: "Uncasville, CT", note: "", ticketUrl: "", setMinutes: 10 },  // date PLACEHOLDER
    { date: "2026-12-05", venue: "Toyo Open Mic",                  city: "Colchester, CT", note: "Open mic", ticketUrl: "", setMinutes: 7 },  // date PLACEHOLDER
    { date: "2026-12-19", venue: "Concrete Gardens",               city: "Hartford, CT", note: "", ticketUrl: "", setMinutes: 10 },  // date PLACEHOLDER
    { date: "2027-01-16", venue: "Madison Square Garden",          city: "New York, NY", note: "Someday", ticketUrl: "", setMinutes: 60 },

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
    { title: "Live at Comix Roadhouse", instagramUrl: "https://www.instagram.com/p/DdseBH1THzq/", thumb: "img/bill-comix.jpg", minutes: 1, featured: true },
    { title: "Crowd work",      youtubeId: "", minutes: 2 },
    { title: "Open mic bit",    youtubeId: "", minutes: 4 },
    { title: "Late show",       youtubeId: "", minutes: 3 },
    { title: "Road story",      youtubeId: "", minutes: 2 },
  ],

  // Social links. Delete a line to hide it.
  socials: [
    { name: "Instagram", handle: "@billwernickicomedy", url: "https://www.instagram.com/billwernickicomedy/" },
    // Add more when they exist, e.g.:
    // { name: "TikTok",  handle: "@billwernickicomedy", url: "https://www.tiktok.com/@billwernickicomedy" },
    // { name: "YouTube", handle: "Bill Wernicki",       url: "https://www.youtube.com/@..." },
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
    confirmEmail: false,
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
