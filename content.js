/*
 * Everything on the site that changes lives in this one file.
 * Edit the text between the quotes, save, and refresh the page.
 * Anything marked PLACEHOLDER still needs a real value.
 */
window.SITE = {
  tagline: "Up-and-coming stand-up. Catch him in a small room before the rooms get big.",

  bio: "PLACEHOLDER: Bill Wernicki is a Connecticut stand-up comedian working clubs, bars and open mics around New England. " +
       "Write two or three sentences here: where he's from, what his comedy is about, and anything he's done that people should know.",

  homeBase: "Connecticut",
  bookingEmail: "booking@billwernickicomedy.com",   // PLACEHOLDER
  contactEmail: "hello@billwernickicomedy.com",     // PLACEHOLDER

  /*
   * Shows. Dates are YYYY-MM-DD. The site sorts them and moves a show to
   * "Past shows" automatically the day after it happens.
   * setMinutes is roughly how long Bill's set is; the Fan Card uses it.
   * Leave ticketUrl empty ("") to show "Tickets soon".
   */
  shows: [
    { date: "2026-11-21", venue: "PLACEHOLDER Comedy Club", city: "City, ST", note: "Showcase", ticketUrl: "", setMinutes: 10 },
    { date: "2026-12-05", venue: "PLACEHOLDER Brewery",     city: "City, ST", note: "Headlining", ticketUrl: "", setMinutes: 30 },
    { date: "2026-12-19", venue: "PLACEHOLDER Theater",     city: "City, ST", note: "Holiday show", ticketUrl: "", setMinutes: 15 },
    { date: "2027-01-16", venue: "PLACEHOLDER Comedy Bar",  city: "City, ST", note: "", ticketUrl: "", setMinutes: 15 },

    // Past shows (fans can mark these "I was there")
    { date: "2026-10-24", venue: "PLACEHOLDER Venue",       city: "City, ST", note: "", setMinutes: 10 },
    { date: "2026-09-24", venue: "Comix Roadhouse",         city: "Uncasville, CT", note: "", setMinutes: 5 },  // from Instagram; set length is a guess
    { date: "2026-09-27", venue: "PLACEHOLDER Open Mic",    city: "City, ST", note: "", setMinutes: 7 },
  ],

  /*
   * Clips. For a YouTube video, paste the ID: the part after "v=" in
   * youtube.com/watch?v=XXXXXXXXXXX (or after youtu.be/ or /shorts/).
   * For an Instagram post or reel, paste its link as instagramUrl instead.
   * Leave both empty to show a "coming soon" tile.
   * minutes is the clip length; the Fan Card counts it when someone plays it.
   */
  clips: [
    { title: "Live at Comix Roadhouse", instagramUrl: "https://www.instagram.com/p/DdseBH1THzq/", thumb: "img/bill-comix.jpg", minutes: 1, featured: true },
    { title: "PLACEHOLDER: Crowd work",      youtubeId: "", minutes: 2 },
    { title: "PLACEHOLDER: Open mic bit",    youtubeId: "", minutes: 4 },
    { title: "PLACEHOLDER: Late show",       youtubeId: "", minutes: 3 },
    { title: "PLACEHOLDER: Road story",      youtubeId: "", minutes: 2 },
  ],

  // Social links. Delete a line to hide it.
  socials: [
    { name: "Instagram", handle: "@billwernickicomedy", url: "https://www.instagram.com/billwernickicomedy/" },
    { name: "TikTok",    handle: "@billwernickicomedy", url: "https://tiktok.com/" },     // PLACEHOLDER
    { name: "YouTube",   handle: "Bill Wernicki", url: "https://youtube.com/" },    // PLACEHOLDER
    { name: "X",         handle: "@billwernickicomedy", url: "https://x.com/" },          // PLACEHOLDER
  ],

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
