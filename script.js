(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var esc = function (v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /* ---------- Simple text bindings ---------- */
  document.querySelectorAll("[data-bind]").forEach(function (el) {
    var v = S[el.getAttribute("data-bind")];
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll("[data-bind-href]").forEach(function (el) {
    // "mailto:key" builds a mailto link; a bare "key" uses the value as the URL.
    var spec = el.getAttribute("data-bind-href").split(":");
    var key = spec.length > 1 ? spec[1] : spec[0];
    var v = S[key];
    if (v) el.setAttribute("href", spec.length > 1 ? spec[0] + ":" + v : v);
  });

  /* ---------- Contact: no real inbox yet means Instagram DMs ---------- */
  if (!S.bookingEmail) {
    $("#row-booking").hidden = true;
    $("#contact-form").hidden = true;
    if (S.instagramDm) { $("#row-dm").hidden = false; $("#contact-dm").hidden = false; }
  }
  if (!S.contactEmail) $("#row-contact").hidden = true;
  $("#year").textContent = new Date().getFullYear();

  /* ---------- My Stats storage (this browser only) ---------- */
  var KEY = "bw-fancard-v1";
  var store = { attended: [], watched: {} };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      store.attended = Array.isArray(parsed.attended) ? parsed.attended : [];
      store.watched = parsed.watched && typeof parsed.watched === "object" ? parsed.watched : {};
    }
  } catch (e) { /* private mode or blocked storage: card still works for this visit */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }

  /* ---------- Shows ---------- */
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function parseDate(s) { var p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function showId(s) { return s.date + "|" + s.venue; }

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var shows = (S.shows || []).map(function (s) { return Object.assign({ d: parseDate(s.date) }, s); });
  var upcoming = shows.filter(function (s) { return s.d >= today; }).sort(function (a, b) { return a.d - b.d; });
  var past = shows.filter(function (s) { return s.d < today; }).sort(function (a, b) { return b.d - a.d; });

  function dateBlock(s) {
    return '<div class="show__date"><span class="show__mon">' + MON[s.d.getMonth()] + '</span>' +
      '<span class="show__day">' + s.d.getDate() + '</span>' +
      '<span class="show__dow">' + DOW[s.d.getDay()] + " " + s.d.getFullYear() + '</span></div>';
  }
  function info(s) {
    return '<div><div class="show__venue">' + esc(s.venue) +
      (s.note ? '<span class="show__note">' + esc(s.note) + '</span>' : "") + '</div>' +
      '<div class="show__meta">' + esc(s.city) + '</div></div>';
  }

  /* ---------- "Remind me": one tap adds the show to the fan's calendar ---------- */
  // iPhone, iPad and Mac open a calendar file (from cal/) straight into Calendar; everyone else gets Google Calendar.
  var isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); }
  function eventTimes(s) {
    var start = new Date(s.d), end;
    if (s.time) {
      var t = s.time.split(":");
      start.setHours(+t[0], +(t[1] || 0), 0, 0);
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000);   // assume a 2-hour show
      var stamp = function (d) { return ymd(d) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00"; };
      return { allDay: false, start: stamp(start), end: stamp(end) };
    }
    end = new Date(start); end.setDate(end.getDate() + 1);
    return { allDay: true, start: ymd(start), end: ymd(end) };
  }
  function calendarHref(s) {
    var t = eventTimes(s);
    var title = "Bill Wernicki Comedy at " + s.venue;
    var where = s.venue + ", " + s.city;
    var site = location.href.split("#")[0];
    var details = (s.ticketUrl ? "Tickets: " + s.ticketUrl + "\n" : "") + "More: " + site;
    if (!isApple) {
      return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        "&text=" + encodeURIComponent(title) + "&dates=" + t.start + "/" + t.end +
        "&location=" + encodeURIComponent(where) + "&details=" + encodeURIComponent(details) +
        (t.allDay ? "" : "&ctz=America/New_York");
    }
    // iPhones won't open a calendar built inside the page, so link to a real file.
    // tools/build-calendar.js writes these files into cal/ from content.js.
    return "cal/" + s.date + "-" + s.venue.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".ics";
  }

  var list = $("#shows-list");
  if (!upcoming.length) {
    list.innerHTML = '<li class="shows__empty">New dates coming soon. Follow on Instagram to hear first, or <a href="#contact">book Bill</a>.</li>';
  } else {
    list.innerHTML = upcoming.map(function (s) {
      var cta = s.tickets === false ? ""
        : s.ticketUrl
        ? '<a class="btn btn--primary btn--sm" href="' + esc(s.ticketUrl) + '" target="_blank" rel="noopener">Tickets</a>'
        : '<span class="btn btn--ghost btn--sm" aria-disabled="true">Tickets soon</span>';
      var remind = '<a class="btn btn--ghost btn--sm btn--remind" href="' + esc(calendarHref(s)) + '"' +
        (isApple ? "" : ' target="_blank" rel="noopener"') + ' aria-label="Add ' + esc(s.venue) + ' to your calendar">Remind me</a>';
      return '<li class="show reveal">' + dateBlock(s) + info(s) + '<div class="show__cta">' + cta + remind + '</div></li>';
    }).join("");

    var n = upcoming[0];
    var next = $("#hero-next");
    next.hidden = false;
    $(".hero__next-body", next).textContent = MON[n.d.getMonth()] + " " + n.d.getDate() + " · " + n.city;
  }

  var pastList = $("#past-list");
  if (!past.length) {
    $("#past-wrap").hidden = true;
  } else {
    pastList.innerHTML = past.map(function (s) {
      var id = showId(s);
      var on = store.attended.indexOf(id) > -1;
      return '<li class="show">' + dateBlock(s) + info(s) +
        '<div class="show__cta"><button class="btn btn--ghost btn--sm btn--attend" aria-pressed="' + on + '" data-id="' + esc(id) + '">' +
        (on ? "✓ I was there" : "I was there") + '</button></div></li>';
    }).join("");
    pastList.addEventListener("click", function (e) {
      var b = e.target.closest(".btn--attend");
      if (!b) return;
      var id = b.getAttribute("data-id");
      var i = store.attended.indexOf(id);
      if (i > -1) store.attended.splice(i, 1); else store.attended.push(id);
      var on = i === -1;
      b.setAttribute("aria-pressed", on);
      b.textContent = on ? "✓ I was there" : "I was there";
      save(); renderCard();
    });
  }

  /* ---------- Scrolling dates ---------- */
  var words = upcoming.slice(0, 6).map(function (s) { return MON[s.d.getMonth()] + " " + s.d.getDate() + " · " + s.venue; });
  if (!words.length) words = ["New dates soon", "Book Bill"];
  words.push("Bill Wernicki Comedy");
  // Each group must be wider than the screen so the loop never shows a gap.
  while (words.length < 10) words = words.concat(words);
  var group = '<div class="marquee__group">' + words.map(function (w) { return "<span>" + esc(w) + "</span>"; }).join("") + "</div>";
  // Two identical groups: the track slides left by exactly one group, then loops.
  $("#marquee").innerHTML = group + group;

  /* ---------- Clips ---------- */
  var PH = ["img/billy-stage-bar2.jpg", "img/billy-stage-wide.jpg", "img/billy-stage-bar.jpg", "img/billy-stage-smile.jpg"];
  function igId(url) { var m = /instagram\.com\/(?:[^\/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/.exec(url || ""); return m && m[1]; }
  function clipKey(c) { return c.youtubeId || igId(c.instagramUrl) || ""; }
  var clipsEl = $("#clips");
  clipsEl.innerHTML = (S.clips || []).map(function (c, i) {
    var ig = igId(c.instagramUrl);
    var playable = !!(c.youtubeId || ig);
    var thumb = c.thumb ? c.thumb : c.youtubeId ? "https://i.ytimg.com/vi/" + encodeURIComponent(c.youtubeId) + "/hqdefault.jpg" : PH[i % PH.length];
    var len = playable && c.minutes ? c.minutes + " min" : "";
    var badge = playable ? '<span class="clip__play"></span>' + (ig ? '<span class="clip__soon">Instagram</span>' : "") : '<span class="clip__soon">Coming soon</span>';
    return '<figure class="clip reveal' + (c.featured ? " clip--featured" : "") + (ig ? " clip--ig" : "") + '">' +
      '<button class="clip__frame" type="button" data-i="' + i + '" aria-label="Play ' + esc(c.title) + '"' + (playable ? "" : " disabled") + '>' +
      '<img src="' + thumb + '" alt="" loading="lazy" style="object-position:50% 35%">' + badge +
      '</button><figcaption><span class="clip__title">' + esc(c.title) + '</span><span class="clip__len">' + len + '</span></figcaption></figure>';
  }).join("");
  clipsEl.addEventListener("click", function (e) {
    var b = e.target.closest(".clip__frame");
    if (!b || b.disabled) return;
    var c = S.clips[+b.dataset.i];
    var ig = igId(c.instagramUrl);
    var src = ig
      ? "https://www.instagram.com/p/" + encodeURIComponent(ig) + "/embed/"
      : "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(c.youtubeId) + "?autoplay=1&rel=0";
    // Swap the button for a plain box: an iframe can't live inside a <button>.
    var box = document.createElement("div");
    box.className = "clip__frame clip__frame--playing";
    box.innerHTML = '<iframe src="' + src + '" title="' + esc(c.title) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    b.replaceWith(box);
    // Count the clip toward watch time once per clip.
    store.watched[clipKey(c)] = c.minutes || 0;
    save(); renderCard();
  });

  /* ---------- Socials ---------- */
  $("#socials").innerHTML = (S.socials || []).map(function (s) {
    return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener"><b>' + esc(s.name) +
      '</b><span class="socials__label">' + esc(s.handle) + '</span></a></li>';
  }).join("");

  /* ---------- Merch ---------- */
  var ART = {
    "logo-tee": '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M60 30l-40 22 14 34 18-8v92h96V78l18 8 14-34-40-22c-6 14-18 22-40 22S66 44 60 30z" fill="#111113" stroke="#3a3a40" stroke-width="2"/><image href="img/bill-wernicki-logo.png" x="72" y="76" width="56" height="56"/></svg>',
    tee: '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M60 30l-40 22 14 34 18-8v92h96V78l18 8 14-34-40-22c-6 14-18 22-40 22S66 44 60 30z" fill="#efeae0"/><text x="100" y="118" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="26" fill="#111">BILL</text><text x="100" y="142" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="16" style="fill:var(--accent)" stroke="#111" stroke-width=".6">WERNICKI</text></svg>',
    hoodie: '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M70 28c8-8 52-8 60 0l10 14 40 20-12 52-16-4v78H48v-78l-16 4-12-52 40-20z" fill="#1c1c20" stroke="#3a3a40" stroke-width="2"/><path d="M80 30c4 22 36 22 40 0" fill="none" stroke="#3a3a40" stroke-width="3"/><path d="M92 50v24M108 50v24" stroke="#efeae0" stroke-width="2"/><text x="100" y="124" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="22" style="fill:var(--accent)">BWC</text></svg>',
    hat: '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M40 120c0-44 28-66 60-66s60 22 60 66z" fill="#3b3a2c"/><path d="M30 120h150c10 0 14 14 0 18-30 8-120 8-150 0-8-4-8-18 0-18z" fill="#2c2b20"/><circle cx="100" cy="56" r="5" fill="#2c2b20"/><text x="100" y="106" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="22" fill="#efeae0">BWC</text></svg>'
  };
  $("#merch-list").innerHTML = (S.merch || []).map(function (m) {
    var cta = m.url
      ? '<a class="btn btn--primary btn--sm" href="' + esc(m.url) + '" target="_blank" rel="noopener">Shop</a>'
      : '<span class="btn btn--ghost btn--sm" aria-disabled="true">Soon</span>';
    return '<article class="product reveal"><div class="product__art">' + (ART[m.art] || ART.tee) + '</div>' +
      '<div class="product__body"><div><div class="product__name">' + esc(m.name) + '</div><div class="product__price">' + esc(m.price) + '</div></div>' + cta + '</div></article>';
  }).join("");

  /* ---------- My Stats ---------- */
  function stats() {
    var mine = shows.filter(function (s) { return s.d < today && store.attended.indexOf(showId(s)) > -1; });
    var live = mine.reduce(function (t, s) { return t + (s.setMinutes || 0); }, 0);
    var watched = Object.keys(store.watched).reduce(function (t, k) { return t + (+store.watched[k] || 0); }, 0);
    var cities = {};
    mine.forEach(function (s) { cities[s.city] = 1; });
    var first = mine.slice().sort(function (a, b) { return a.d - b.d; })[0];
    return { count: mine.length, live: live, watched: watched, cities: Object.keys(cities).length, first: first };
  }
  function renderCard() {
    var st = stats();
    $("#fc-shows").textContent = st.count;
    $("#fc-live").textContent = st.live;
    $("#fc-watched").textContent = st.watched;
    $("#fc-cities").textContent = st.cities;
    $("#fc-first").textContent = st.first
      ? "First show: " + st.first.venue + ", " + MON[st.first.d.getMonth()] + " " + st.first.d.getDate() + " " + st.first.d.getFullYear()
      : "No shows logged yet. Find one you went to under Past shows.";
  }
  renderCard();

  var msg = $("#fc-msg");
  $("#fc-share").addEventListener("click", function () {
    var st = stats();
    var text = "My Bill Wernicki stats: " + st.count + " show" + (st.count === 1 ? "" : "s") + ", " +
      st.live + " minutes live, " + st.watched + " minutes of clips.";
    var url = location.href.split("#")[0] + "#my-stats";
    if (navigator.share) {
      navigator.share({ title: "My Bill Wernicki stats", text: text, url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text + " " + url).then(function () { msg.textContent = "Copied. Paste it anywhere."; },
        function () { msg.textContent = text; });
    } else { msg.textContent = text; }
  });
  $("#fc-reset").addEventListener("click", function () {
    if (!confirm("Clear your stats on this device?")) return;
    store = { attended: [], watched: {} };
    save(); renderCard();
    document.querySelectorAll(".btn--attend").forEach(function (b) { b.setAttribute("aria-pressed", "false"); b.textContent = "I was there"; });
    msg.textContent = "Stats cleared.";
  });

  /* ---------- Contact form (opens the visitor's email app) ---------- */
  $("#contact-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target.elements;
    var subject = f.type.value + " - from " + f.name.value;
    var body = f.message.value + "\n\n" + f.name.value + "\n" + f.email.value;
    location.href = "mailto:" + (S.bookingEmail || "") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });

  /* ---------- Nav ---------- */
  var nav = $(".nav"), toggle = $(".nav__toggle"), links = $("#nav-links");
  function onScroll() { nav.classList.toggle("is-solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", open);
    links.classList.toggle("is-open", open);
  });
  links.addEventListener("click", function (e) {
    if (e.target.closest("a")) { toggle.setAttribute("aria-expanded", "false"); links.classList.remove("is-open"); }
  });

  if ("IntersectionObserver" in window) {
    var secs = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.querySelectorAll("a").forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach(function (s) { spy.observe(s); });

    var rev = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); rev.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { rev.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }
})();
