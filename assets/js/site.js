(function () {
  "use strict";

  var config = window.OUR_CHENEY_CONFIG || {};

  function mountTallyForms() {
    var mounts = document.querySelectorAll("[data-tally-mount]");
    var formMounted = false;

    mounts.forEach(function (mount) {
      var configKey = mount.getAttribute("data-tally-config") || "tallyFormId";
      var formId = config[configKey];
      if (!formId) return;

      var frame = document.createElement("iframe");
      frame.className = "tally-frame";
      frame.title = mount.getAttribute("data-tally-title") || "Our Cheney form";
      frame.loading = "lazy";
      frame.src =
        "https://tally.so/embed/" +
        encodeURIComponent(formId) +
        "?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";

      mount.replaceChildren(frame);
      formMounted = true;
    });

    if (!formMounted) return;

    var embedScript = document.createElement("script");
    embedScript.src = "https://tally.so/widgets/embed.js";
    embedScript.async = true;
    document.body.appendChild(embedScript);
  }

  function setCurrentYear() {
    document.querySelectorAll("[data-current-year]").forEach(function (node) {
      node.textContent = new Date().getFullYear();
    });
  }

  mountTallyForms();
  setCurrentYear();
})();
