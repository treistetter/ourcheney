(function () {
  "use strict";

  var config = window.OUR_CHENEY_CONFIG || {};

  function mountTallyForm() {
    var mount = document.querySelector("[data-tally-mount]");
    if (!mount || !config.tallyFormId) return;

    var frame = document.createElement("iframe");
    frame.className = "tally-frame";
    frame.title = "Add Your Voice campaign form";
    frame.loading = "lazy";
    frame.src =
      "https://tally.so/embed/" +
      encodeURIComponent(config.tallyFormId) +
      "?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";

    mount.replaceChildren(frame);

    var embedScript = document.createElement("script");
    embedScript.src = "https://tally.so/widgets/embed.js";
    embedScript.async = true;
    document.body.appendChild(embedScript);
  }

  function configureStoryLinks() {
    var links = document.querySelectorAll("[data-story-link]");
    if (!links.length) return;

    var email = config.storyEmail || "stories@yourdomain.org";
    var href =
      "mailto:" +
      email +
      "?subject=" +
      encodeURIComponent("My Phoenix Park Story");

    links.forEach(function (link) {
      link.href = href;
    });

    document.querySelectorAll("[data-story-email]").forEach(function (node) {
      node.textContent = email;
    });
  }

  function setCurrentYear() {
    document.querySelectorAll("[data-current-year]").forEach(function (node) {
      node.textContent = new Date().getFullYear();
    });
  }

  mountTallyForm();
  configureStoryLinks();
  setCurrentYear();
})();
