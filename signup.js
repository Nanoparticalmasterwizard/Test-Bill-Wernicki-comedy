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

  // Brevo sends people here after they tap the link in the confirm email.
  var box = document.querySelector("[data-confirm]");
  if (box && new URLSearchParams(location.search).has("confirmed")) {
    box.querySelector("h1").innerHTML = "You're<br><span>on the list</span>";
    box.querySelector("p").textContent = "You'll get an email when Bill books a new show. See you there.";
    var f = box.querySelector("form[data-signup]");
    if (f) f.style.display = "none";
  }
})();
