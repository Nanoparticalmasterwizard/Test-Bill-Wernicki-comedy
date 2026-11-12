/* "Join the list" forms: any <form data-signup> on the page. */
(function () {
  "use strict";
  var cfg = (window.SITE && window.SITE.newsletter) || {};
  var ig = (window.SITE && window.SITE.instagramDm) || "https://www.instagram.com/billwernickicomedy/";

  document.querySelectorAll("form[data-signup]").forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var msg = form.querySelector(".signup__msg");
    function say(text, kind) { msg.textContent = text; msg.className = "signup__msg" + (kind ? " is-" + kind : ""); }

    if (cfg.action) {
      // Hand the signup to the email service (opens its confirmation in a new tab).
      form.action = cfg.action;
      form.method = "post";
      form.target = "_blank";
      input.name = cfg.emailField || "email";
    }

    form.addEventListener("submit", function (e) {
      var email = (input.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        e.preventDefault();
        say("That email doesn't look right. Try again?", "err");
        input.focus();
        return;
      }
      if (!cfg.action) {
        e.preventDefault();
        msg.innerHTML = "";
        msg.className = "signup__msg is-ok";
        msg.append("The list opens soon. For now, follow ");
        var a = document.createElement("a");
        a.href = ig; a.target = "_blank"; a.rel = "noopener"; a.textContent = "@billwernickicomedy";
        msg.append(a, " for new dates.");
        return;
      }
      say("You're in. Check your inbox to confirm.", "ok");
      setTimeout(function () { form.reset(); }, 300);
    });
  });
})();
