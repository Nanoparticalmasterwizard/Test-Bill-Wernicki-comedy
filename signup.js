/*
 * "Join the list" forms: any <form data-signup> on the page.
 * Signups go to Brevo (form address in SITE.newsletter.action in content.js).
 * The visitor never leaves the page; Brevo emails them a confirm link, which
 * sends them back to /join/?confirmed=1.
 */
(function () {
  "use strict";
  var cfg = (window.SITE && window.SITE.newsletter) || {};
  var ig = (window.SITE && window.SITE.instagramDm) || "https://www.instagram.com/billwernickicomedy/";

  // Post to Brevo in the background. Read its answer when the browser allows it;
  // otherwise send it blind and assume it went through.
  // city is optional and lands in Brevo's CITY contact attribute. If Brevo
  // turns it down (attribute or form field missing), retry with email only.
  function post(email, city) {
    if (city) return send(email, city).then(function (res) { return res === "error" ? send(email) : res; });
    return send(email);
  }
  function send(email, city) {
    var body = new FormData();
    body.append("EMAIL", email);
    if (city) body.append("CITY", city);
    body.append("email_address_check", "");
    body.append("locale", "en");
    var url = cfg.action + (cfg.action.indexOf("?") < 0 ? "?" : "&") + "isAjax=1";
    return fetch(url, { method: "POST", body: body })
      .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
      .then(function (j) { return j && j.success === false ? "error" : "sent"; })
      .catch(function () {
        return fetch(url, { method: "POST", mode: "no-cors", body: body }).then(function () { return "sent"; });
      });
  }

  document.querySelectorAll("form[data-signup]").forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var cityInput = form.querySelector(".signup__city");
    var btn = form.querySelector('button[type="submit"]');
    var msg = form.querySelector(".signup__msg");
    function say(text, kind) { msg.textContent = text; msg.className = "signup__msg" + (kind ? " is-" + kind : ""); }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (input.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        say("That email doesn't look right. Try again?", "err");
        input.focus();
        return;
      }
      if (!cfg.action) {
        msg.innerHTML = "";
        msg.className = "signup__msg is-ok";
        msg.append("The list opens soon. For now, follow ");
        var a = document.createElement("a");
        a.href = ig; a.target = "_blank"; a.rel = "noopener"; a.textContent = "@billwernickicomedy";
        msg.append(a, " for new dates.");
        return;
      }
      btn.disabled = true;
      say("Adding you...", "");
      post(email, cityInput ? cityInput.value.trim().slice(0, 80) : "")
        .then(function (res) {
          if (res === "error") return say("That didn't go through. Check the email and try again?", "err");
          say(cfg.confirmEmail ? "Almost done. Check your inbox and tap the link to confirm."
                               : "You're in. We'll email you when Bill books a show.", "ok");
          form.reset();
        })
        .catch(function () { say("Something went wrong. Try again in a minute?", "err"); })
        .then(function () { btn.disabled = false; });
    });
  });

  /* ---------- City suggestions ("City, ST") ----------
   * Free and offline: data/cities.json is a list of US towns built from Census
   * population estimates, Connecticut first, then the Northeast, then big
   * cities. Loaded the first time someone taps the City box. Typing anything
   * else is fine too; suggestions are only a shortcut. */
  var base = (document.currentScript && document.currentScript.src) || location.href;
  var citiesUrl = new URL("data/cities.json", base).href;
  var cities = null, loading = null;
  function loadCities() {
    if (!loading) loading = fetch(citiesUrl).then(function (r) { return r.json(); })
      .then(function (list) { cities = list.map(function (c) { return [c, c.toLowerCase()]; }); })
      .catch(function () { cities = []; });
    return loading;
  }
  function match(q) {
    q = q.toLowerCase().replace(/\s+/g, " ").trim();
    if (!q || !cities) return [];
    var starts = [], words = [];
    for (var i = 0; i < cities.length && starts.length < 6; i++) {
      var lc = cities[i][1];
      if (lc.indexOf(q) === 0) starts.push(cities[i][0]);
      else if (words.length < 6 && lc.indexOf(" " + q) > -1) words.push(cities[i][0]);
    }
    return starts.concat(words).slice(0, 6);
  }

  document.querySelectorAll(".signup__city").forEach(function (input) {
    var wrap = document.createElement("div");
    wrap.className = "citybox";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    var list = document.createElement("ul");
    list.className = "citybox__list";
    list.id = input.id + "-list";
    list.setAttribute("role", "listbox");
    list.hidden = true;
    wrap.appendChild(list);
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", list.id);
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("autocomplete", "off");
    var items = [], active = -1;

    function close() { list.hidden = true; input.setAttribute("aria-expanded", "false"); active = -1; }
    function render() {
      items = match(input.value);
      if (!items.length) return close();
      list.innerHTML = "";
      items.forEach(function (c, i) {
        var li = document.createElement("li");
        li.id = list.id + "-" + i;
        li.setAttribute("role", "option");
        var cut = c.lastIndexOf(", ");
        li.innerHTML = "";
        li.append(c.slice(0, cut));
        var st = document.createElement("span"); st.textContent = c.slice(cut + 2);
        li.append(st);
        li.addEventListener("pointerdown", function (e) { e.preventDefault(); pick(i); });
        list.appendChild(li);
      });
      active = -1;
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }
    function highlight(i) {
      active = i;
      Array.prototype.forEach.call(list.children, function (li, j) { li.classList.toggle("is-active", j === i); li.setAttribute("aria-selected", j === i); });
      if (i > -1) input.setAttribute("aria-activedescendant", list.children[i].id); else input.removeAttribute("aria-activedescendant");
    }
    function pick(i) { input.value = items[i]; close(); }

    input.addEventListener("focus", loadCities);
    input.addEventListener("input", function () { loadCities().then(render); });
    input.addEventListener("blur", function () { setTimeout(close, 120); });
    input.addEventListener("keydown", function (e) {
      if (list.hidden) return;
      if (e.key === "ArrowDown") { e.preventDefault(); highlight(Math.min(active + 1, items.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); highlight(Math.max(active - 1, -1)); }
      else if (e.key === "Enter" && active > -1) { e.preventDefault(); pick(active); }
      else if (e.key === "Escape") { close(); }
    });
  });

  // Brevo sends people here after they tap the link in the confirm email.
  var box = document.querySelector("[data-confirm]");
  if (box && new URLSearchParams(location.search).has("confirmed")) {
    box.querySelector("h1").innerHTML = "You're<br><span>on the list</span>";
    box.querySelector("p").textContent = "You'll get an email when Bill books a new show. See you there.";
    var f = box.querySelector("form[data-signup]");
    if (f) f.style.display = "none";
  }
})();
