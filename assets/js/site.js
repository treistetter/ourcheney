(function () {
  "use strict";

  function setCurrentYear() {
    document.querySelectorAll("[data-current-year]").forEach(function (node) {
      node.textContent = new Date().getFullYear();
    });
  }

  function initializeFeedbackCards() {
    const cards = Array.from(document.querySelectorAll(".feedback-card"));

    if (!cards.length) return;

    cards.forEach(function (card, index) {
      const quote = card.querySelector("blockquote");

      if (!quote) return;

      const preview = document.createElement("div");
      const actions = document.createElement("div");
      const button = document.createElement("button");

      preview.className = "feedback-quote-preview";
      preview.id = `feedback-comment-${index + 1}`;
      quote.parentNode.insertBefore(preview, quote);
      preview.appendChild(quote);

      actions.className = "feedback-card-actions";
      actions.hidden = true;

      button.className = "feedback-read-more";
      button.type = "button";
      button.textContent = "Read more";
      button.setAttribute("aria-controls", preview.id);
      button.setAttribute("aria-expanded", "false");
      actions.appendChild(button);
      card.appendChild(actions);

      button.addEventListener("click", function () {
        const isExpanded = button.getAttribute("aria-expanded") === "true";

        button.setAttribute("aria-expanded", String(!isExpanded));
        button.textContent = isExpanded ? "Read more" : "Show less";
        card.classList.toggle("is-collapsed", isExpanded);
        card.classList.toggle("is-expanded", !isExpanded);
      });
    });

    function refreshCard(card) {
      const preview = card.querySelector(".feedback-quote-preview");
      const quote = card.querySelector("blockquote");
      const actions = card.querySelector(".feedback-card-actions");
      const button = card.querySelector(".feedback-read-more");

      if (!preview || !quote || !actions || !button) return;

      const wasExpanded = button.getAttribute("aria-expanded") === "true";

      card.classList.remove("is-expanded");
      card.classList.add("is-collapsed");

      const isOverflowing =
        quote.getBoundingClientRect().height >
        preview.getBoundingClientRect().height + 1;

      card.classList.toggle("feedback-card-collapsible", isOverflowing);
      actions.hidden = !isOverflowing;

      if (!isOverflowing) {
        card.classList.remove("is-collapsed");
        button.setAttribute("aria-expanded", "false");
        button.textContent = "Read more";
        return;
      }

      if (wasExpanded) {
        card.classList.remove("is-collapsed");
        card.classList.add("is-expanded");
      }
    }

    function refreshCards() {
      cards.forEach(refreshCard);
    }

    let resizeFrame;

    window.addEventListener("resize", function () {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(refreshCards);
    });

    refreshCards();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refreshCards);
    }
  }

  setCurrentYear();
  initializeFeedbackCards();
})();
