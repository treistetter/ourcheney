(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const path = params.get("image") || "";
  const status = document.getElementById("image-status");
  const image = new Image();
  image.id = "full-size-image";
  const viewport = document.getElementById("image-viewport");
  const button = document.getElementById("zoom-toggle");
  const backLink = document.getElementById("back-link");

  // Only load renderings from the compromise asset directories.
  if (!/^(atc|aps|none)\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.webp$/.test(path)) {
    status.textContent = "Choose an image from a compromise page to view it here.";
    return;
  }

  backLink.href = `../${path.split("/")[0]}/`;
  backLink.textContent = "Back to page";
  image.alt = params.get("description") || "Conceptual rendering";

  image.addEventListener("load", function () {
    status.hidden = true;
    image.width = image.naturalWidth;
    image.height = image.naturalHeight;
    viewport.appendChild(image);
    button.disabled = false;
  });

  image.addEventListener("error", function () {
    status.textContent = "This image could not be loaded. Return to the page and try again.";
  });

  function toggleZoom() {
    const actualSize = viewport.classList.toggle("actual-size");
    button.setAttribute("aria-pressed", String(actualSize));
    button.textContent = actualSize ? "Fit to screen" : "Actual size";
  }

  button.addEventListener("click", toggleZoom);
  image.addEventListener("click", toggleZoom);
  image.src = `../../assets/images/comp/${path}`;
})();
