(function () {
  "use strict";

  function setCurrentYear() {
    document.querySelectorAll("[data-current-year]").forEach(function (node) {
      node.textContent = new Date().getFullYear();
    });
  }

  setCurrentYear();
})();
