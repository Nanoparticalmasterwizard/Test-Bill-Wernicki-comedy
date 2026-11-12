# Bill Wernicki Comedy website

A one-page site: hero, Shows, Watch (clips), More (about + socials), Merch, Fan Card, and Booking/Contact.
Plain HTML/CSS/JS with no build step, so it can be hosted anywhere (GitHub Pages, Netlify, Cloudflare Pages).

## Updating it

Almost everything lives in **`content.js`**: tour dates, clips, socials, merch, emails, bio.
Anything marked `PLACEHOLDER` still needs a real value.

- **Shows**: add `{ date: "YYYY-MM-DD", venue, city, note, ticketUrl, setMinutes }`. Past dates move to "Past shows" on their own.
- **Clips**: use `youtubeId` for YouTube or `instagramUrl` for an Instagram post/reel.
- **Photos**: drop them in `img/` and point to them from `index.html`.

## Preview locally

```
cd billy-wernicki-comedy
python3 -m http.server 8000
# open http://localhost:8000
```

## My Stats

A lightweight take on the fan stats on Billy Strings' site. That feature is BillyBase (billybase.net),
a fan-run setlist archive now run by Songfish; it's a full setlist-tracking platform with accounts, not
something you can drop into another site. Here, fans tap "I was there" on past shows and every clip they
play on the site adds to their watch time. Stats are saved in the visitor's browser (no accounts, no server),
so they don't follow someone to another device.

## Contact form

There's no backend: "Send" opens the visitor's email app addressed to `bookingEmail`.
To receive messages without that step, plug in a form service such as Formspree.

## After editing

Bump the `?v=` number on the CSS/JS links in `index.html` so phones load the new files instead of a cached copy.

## Join the list

The "Join the list" section is at the bottom of the home page (`#join`), and `join/` is a one-page signup you can link from YouTube or Instagram bios.

Signups go to a Brevo subscription form (free plan) into the BWC list. Visitors stay on the site;
once double confirmation is on in Brevo (set `confirmEmail: true`), the confirm link should redirect to `https://billwernickicomedy.com/join/?confirmed=1`.
Paste the form link (contains `sibforms.com/serve/`) into `newsletter.action` in `content.js`.
To move elsewhere later, export the contact list from Brevo as CSV.
