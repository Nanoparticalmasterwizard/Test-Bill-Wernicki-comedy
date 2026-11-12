#!/usr/bin/env node
/*
 * Writes one calendar file per upcoming show into cal/, from content.js.
 * iPhones won't open a calendar built inside the page, so "Remind me" links
 * to these real files instead. Run after editing shows:  node tools/build-calendar.js
 * (A GitHub Action also runs it on every push to main.)
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), sandbox);
const SITE = sandbox.window.SITE;
const site = "https://billwernickicomedy.com/";

const pad = (n) => String(n).padStart(2, "0");
const slug = (s) => s.date + "-" + s.venue.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const esc = (v) => String(v).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");

function times(s) {
  const [y, m, d] = s.date.split("-").map(Number);
  if (s.time) {
    const [hh, mm = 0] = s.time.split(":").map(Number);
    const start = new Date(Date.UTC(y, m - 1, d, hh, mm));
    const end = new Date(start.getTime() + 2 * 3600 * 1000); // assume a 2-hour show
    const st = (t) => t.getUTCFullYear() + pad(t.getUTCMonth() + 1) + pad(t.getUTCDate()) + "T" + pad(t.getUTCHours()) + pad(t.getUTCMinutes()) + "00";
    return { allDay: false, start: st(start), end: st(end) };
  }
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return { allDay: true, start: s.date.replace(/-/g, ""), end: next.getUTCFullYear() + pad(next.getUTCMonth() + 1) + pad(next.getUTCDate()) };
}

function ics(s) {
  const t = times(s);
  const title = "Bill Wernicki Comedy at " + s.venue;
  const details = (s.ticketUrl ? "Tickets: " + s.ticketUrl + "\n" : "") + "More: " + site;
  const dt = (k, v) => (t.allDay ? k + ";VALUE=DATE:" + v : k + ";TZID=America/New_York:" + v);
  const alarm = (trigger) => ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + esc(title), "TRIGGER:" + trigger, "END:VALARM"];
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bill Wernicki Comedy//Shows//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:" + slug(s) + "@billwernickicomedy.com",
    "DTSTAMP:" + s.date.replace(/-/g, "") + "T000000Z",
    dt("DTSTART", t.start), dt("DTEND", t.end),
    "SUMMARY:" + esc(title), "LOCATION:" + esc(s.venue + ", " + s.city), "DESCRIPTION:" + esc(details), "URL:" + site,
    // Nudge the day before (9am for all-day events), and again 3 hours before a timed show.
    ...alarm(t.allDay ? "-PT15H" : "-P1D"),
    ...(t.allDay ? [] : alarm("-PT3H")),
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

const dir = path.join(root, "cal");
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir);
for (const s of SITE.shows) fs.writeFileSync(path.join(dir, slug(s) + ".ics"), ics(s));
console.log("Wrote " + SITE.shows.length + " calendar files to cal/");
