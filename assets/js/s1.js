(function () {
  "use strict";

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const columns = {
    choice:
      "Cheney Field and the Martin St field are owned by APS and are therefore publicly owned land. If given the choice, what is your vision for these lots?",
    writeIn: "What would you like to see?",
    comments: "Any Additional Comments?",
    trackSupport: "Something Else - Supports Track",
    duplicate: "Duplicate",
  };
  const choices = {
    greenSpace: "Green space",
    track: "ATC Indoor Track Proposal",
    somethingElse: "Something else (write in)",
    noPreference: "No preference",
  };
  const themes = {
    parking: {
      label: "Parking",
      pattern: /\bparking\b|\bparking lots?\b|\bparking decks?\b|\bsurface lots?\b/i,
    },
    greenSpace: {
      label: "Green Space",
      pattern: /green\s*space|\bparks?\b|\bfields?\b/i,
    },
    communityAccess: {
      label: "Community Access",
      pattern:
        /\baccess(?:ible|ibility)?\b|\bpublic use\b|\bcommunity use\b|\bmemberships?\b|\bavailable (?:to|for) (?:the )?(?:community|neighbors?|residents?)\b|\b(?:community|neighbors?|residents?) (?:can|could|will) (?:access|use)\b|\bgated\b/i,
    },
    traffic: {
      label: "Traffic & Streets",
      pattern:
        /\btraffic\b|\bcongestion\b|\bstreet parking\b|\bstreets?\b|\bAmi\b|\bConnally\b|\bLittle (?:St(?:reet)?\.?)\b|\broads?\b|\bstreet closure\b/i,
    },
    environment: {
      label: "Trees & Environment",
      pattern:
        /\btrees?\b|\btree canopy\b|\bwildlife\b|\bclimate\b|\btemperatures?\b|\bflood(?:ing)?\b|\bstorm\s*water\b|\bwatershed\b|\bwater runoff\b|\benvironment(?:al)?\b|\bnature trees?\b/i,
    },
  };

  function parseCsv(source) {
    const text = source.replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    function finishField() {
      row.push(field);
      field = "";
    }

    function finishRow() {
      finishField();
      rows.push(row);
      row = [];
    }

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];

      if (inQuotes) {
        if (character === '"') {
          if (text[index + 1] === '"') {
            field += '"';
            index += 1;
          } else {
            inQuotes = false;
          }
        } else {
          field += character;
        }
        continue;
      }

      if (character === '"') {
        if (field) throw new Error("Unexpected quote in an unquoted CSV field.");
        inQuotes = true;
      } else if (character === ",") {
        finishField();
      } else if (character === "\n" || character === "\r") {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        finishRow();
      } else {
        field += character;
      }
    }

    if (inQuotes) throw new Error("Unterminated quoted CSV field.");
    if (field || row.length) finishRow();

    const [headers, ...values] = rows;
    if (!headers) throw new Error("The survey CSV is empty.");
    const records = values.map((fields, rowIndex) => {
      if (fields.length !== headers.length) {
        throw new Error(
          `Survey CSV row ${rowIndex + 2} has ${fields.length} fields; expected ${headers.length}.`
        );
      }
      return Object.fromEntries(headers.map((header, index) => [header, fields[index]]));
    });
    return { headers, records };
  }

  function validateColumns(headers) {
    Object.values(columns).forEach(function (header) {
      if (!headers.includes(header)) throw new Error(`The survey CSV is missing “${header}”.`);
    });
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (node) {
      node.textContent = value;
    });
  }

  function createSvgElement(name, attributes) {
    const element = document.createElementNS(SVG_NAMESPACE, name);
    Object.entries(attributes || {}).forEach(function ([key, value]) {
      element.setAttribute(key, value);
    });
    return element;
  }

  function pointOnCircle(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  function piePath(centerX, centerY, radius, startAngle, endAngle) {
    const start = pointOnCircle(centerX, centerY, radius, startAngle);
    const end = pointOnCircle(centerX, centerY, radius, endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return [
      `M ${centerX} ${centerY}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      "Z",
    ].join(" ");
  }

  function addSvgAccessibility(svg, titleText, descriptionText, idPrefix) {
    const title = createSvgElement("title", { id: `${idPrefix}-title` });
    const description = createSvgElement("desc", { id: `${idPrefix}-description` });
    title.textContent = titleText;
    description.textContent = descriptionText;
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-labelledby", `${title.id} ${description.id}`);
    svg.append(title, description);
  }

  function renderLegend(container, data, includePercentages) {
    const list = document.createElement("ul");
    list.className = "survey-chart-legend";
    data.forEach(function (item) {
      const entry = document.createElement("li");
      const swatch = document.createElement("span");
      const label = document.createElement("span");
      const value = document.createElement("strong");
      swatch.className = `survey-chart-swatch ${item.className}`;
      swatch.setAttribute("aria-hidden", "true");
      label.textContent = item.label;
      value.textContent = includePercentages
        ? `${item.count} · ${item.percentage.toFixed(1)}%`
        : String(item.count);
      entry.append(swatch, label, value);
      list.appendChild(entry);
    });
    container.appendChild(list);
  }

  function renderPieChart(container, data) {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    const svg = createSvgElement("svg", {
      class: "survey-chart-svg survey-pie-svg",
      viewBox: "0 0 430 360",
    });
    addSvgAccessibility(
      svg,
      "Survey preference percentages",
      data
        .map((item) => `${item.label}: ${item.count}, ${item.percentage.toFixed(1)} percent`)
        .join("; "),
      "survey-pie"
    );

    const centerX = 215;
    const centerY = 178;
    const radius = 132;
    const greenSpace = data.find((item) => item.label === "Green Space");
    let startAngle = -90 + (greenSpace.count / total) * 360;

    data.forEach(function (item) {
      const sliceAngle = total ? (item.count / total) * 360 : 0;
      const endAngle = startAngle + sliceAngle;
      const path = createSvgElement("path", {
        class: `survey-pie-slice ${item.className}`,
        d: piePath(centerX, centerY, radius, startAngle, endAngle),
      });
      const segmentTitle = createSvgElement("title");
      segmentTitle.textContent = `${item.label}: ${item.count} (${item.percentage.toFixed(1)}%)`;
      path.appendChild(segmentTitle);
      svg.appendChild(path);

      const midpoint = startAngle + sliceAngle / 2;
      const isSmallSlice = item.percentage < 6;
      const labelPoint = pointOnCircle(
        centerX,
        centerY,
        isSmallSlice ? radius + 34 : radius * 0.62,
        midpoint
      );

      if (isSmallSlice) {
        const lineStart = pointOnCircle(centerX, centerY, radius * 0.88, midpoint);
        const lineEnd = pointOnCircle(centerX, centerY, radius + 22, midpoint);
        svg.appendChild(
          createSvgElement("line", {
            class: "survey-pie-callout",
            x1: lineStart.x,
            y1: lineStart.y,
            x2: lineEnd.x,
            y2: lineEnd.y,
          })
        );
      }

      const text = createSvgElement("text", {
        class: `survey-pie-label ${isSmallSlice ? "survey-pie-label-outside" : item.textClass}`,
        x: labelPoint.x,
        y: labelPoint.y,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
      });
      text.textContent = `${item.percentage.toFixed(1)}%`;
      svg.appendChild(text);
      startAngle = endAngle;
    });

    container.replaceChildren(svg);
    const legendData = [...data].sort((first, second) => first.legendOrder - second.legendOrder);
    renderLegend(container, legendData, true);
  }

  function renderBarChart(container, data) {
    const svg = createSvgElement("svg", {
      class: "survey-chart-svg survey-bar-svg",
      viewBox: "0 0 610 360",
    });
    addSvgAccessibility(
      svg,
      "Survey response counts",
      data.map((item) => `${item.label}: ${item.count}`).join("; "),
      "survey-bars"
    );

    const maximum = Math.max(...data.map((item) => item.count), 1);
    const labelX = 178;
    const barX = 198;
    const chartWidth = 340;
    [0, 20, 40, 60].forEach(function (tick) {
      const x = barX + (tick / maximum) * chartWidth;
      svg.appendChild(
        createSvgElement("line", {
          class: "survey-bar-gridline",
          x1: x,
          y1: 20,
          x2: x,
          y2: 300,
        })
      );
      const tickLabel = createSvgElement("text", {
        class: "survey-bar-tick",
        x,
        y: 330,
        "text-anchor": "middle",
      });
      tickLabel.textContent = String(tick);
      svg.appendChild(tickLabel);
    });

    data.forEach(function (item, index) {
      const y = 30 + index * 72;
      const width = (item.count / maximum) * chartWidth;
      const label = createSvgElement("text", {
        class: "survey-bar-label",
        x: labelX,
        y: y + 27,
        "text-anchor": "end",
      });
      label.textContent = item.shortLabel;
      const bar = createSvgElement("rect", {
        class: `survey-bar ${item.className}`,
        x: barX,
        y,
        width,
        height: 42,
        rx: 3,
      });
      const value = createSvgElement("text", {
        class: "survey-bar-value",
        x: Math.min(barX + width + 12, 585),
        y: y + 28,
      });
      value.textContent = String(item.count);
      svg.append(label, bar, value);
    });

    container.replaceChildren(svg);
    renderLegend(container, data, false);
  }

  function appendCell(row, value, label) {
    const cell = document.createElement("td");
    cell.dataset.label = label;
    cell.textContent = value.trim() || "—";
    row.appendChild(cell);
  }

  function renderWriteIns(records) {
    const writeIns = records.filter((record) => record[columns.choice] === choices.somethingElse);
    const body = document.querySelector("#something-else-responses");
    const fragment = document.createDocumentFragment();
    writeIns.forEach(function (record) {
      const row = document.createElement("tr");
      appendCell(row, record[columns.writeIn], "What would you like to see?");
      appendCell(row, record[columns.comments], "Additional comments");
      const stanceCell = document.createElement("td");
      const stance = document.createElement("span");
      stance.className = `survey-track-stance survey-track-stance-${record[
        columns.trackSupport
      ].toLowerCase()}`;
      stance.textContent = record[columns.trackSupport] === "Yes" ? "Track" : "Green Space";
      stanceCell.className = "survey-track-stance-cell";
      stanceCell.appendChild(stance);
      row.appendChild(stanceCell);
      fragment.appendChild(row);
    });
    body.replaceChildren(fragment);
    setText("[data-write-in-count]", writeIns.length);
  }

  function renderComments(records) {
    const comments = records
      .map((record) => ({
        text: record[columns.comments].trim(),
        choice: record[columns.choice],
        writeIn: record[columns.writeIn].trim(),
      }))
      .filter((comment) => comment.text);
    const container = document.querySelector("#survey-comments");
    const fragment = document.createDocumentFragment();

    comments.forEach(function (comment, index) {
      const card = document.createElement("article");
      const heading = document.createElement("h3");
      const choiceLabel = document.createElement("p");
      const preview = document.createElement("div");
      const button = document.createElement("button");
      const choicePresentation = {
        [choices.greenSpace]: ["Green Space", "survey-comment-green"],
        [choices.track]: ["ATC Indoor Track", "survey-comment-atc"],
        [choices.somethingElse]: ["Something Else", "survey-comment-something-else"],
        [choices.noPreference]: ["No Preference", "survey-comment-no-preference"],
      }[comment.choice] || [comment.choice, "survey-comment-no-preference"];
      const previewId = `survey-comment-copy-${index + 1}`;

      card.className = `survey-comment ${choicePresentation[1]}`;
      card.dataset.comment = comment.text;
      heading.className = "visually-hidden";
      heading.textContent = `Survey comment ${index + 1}`;
      choiceLabel.className = "survey-comment-choice";
      choiceLabel.textContent = choicePresentation[0];
      preview.className = "survey-comment-preview is-collapsed";
      preview.id = previewId;

      if (comment.choice === choices.somethingElse) {
        const requestedUse = document.createElement("div");
        const requestedUseLabel = document.createElement("p");
        const requestedUseText = document.createElement("p");
        const additionalComment = document.createElement("div");
        const additionalCommentLabel = document.createElement("p");
        const additionalCommentText = document.createElement("p");
        requestedUse.className = "survey-comment-field";
        requestedUseLabel.className = "survey-comment-field-label";
        requestedUseLabel.textContent = "What they would like to see";
        requestedUseText.textContent = comment.writeIn || "—";
        additionalComment.className = "survey-comment-field survey-comment-field-additional";
        additionalCommentLabel.className = "survey-comment-field-label";
        additionalCommentLabel.textContent = "Additional comment";
        additionalCommentText.textContent = comment.text;
        requestedUse.append(requestedUseLabel, requestedUseText);
        additionalComment.append(additionalCommentLabel, additionalCommentText);
        preview.append(requestedUse, additionalComment);
      } else {
        const text = document.createElement("p");
        text.textContent = comment.text;
        preview.appendChild(text);
      }
      button.className = "survey-comment-toggle";
      button.type = "button";
      button.textContent = "See more";
      button.hidden = true;
      button.setAttribute("aria-controls", previewId);
      button.setAttribute("aria-expanded", "false");
      card.append(heading, choiceLabel, preview, button);
      fragment.appendChild(card);
    });
    container.replaceChildren(fragment);

    const buttons = Array.from(document.querySelectorAll("[data-comment-filter]"));
    const status = document.querySelector("#comment-filter-status");

    function applyFilter(filter) {
      const theme = themes[filter];
      let visibleCount = 0;
      container.querySelectorAll(".survey-comment").forEach(function (card) {
        const matches = !theme || theme.pattern.test(card.dataset.comment);
        card.hidden = !matches;
        if (matches) visibleCount += 1;
      });
      buttons.forEach(function (button) {
        const active = button.dataset.commentFilter === filter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      status.textContent = theme
        ? `Showing ${visibleCount} of ${comments.length} comments about ${theme.label}.`
        : `Showing all ${comments.length} comments.`;
    }

    buttons.forEach(function (button) {
      const filter = button.dataset.commentFilter;
      const theme = themes[filter];
      const count = theme
        ? comments.filter((comment) => theme.pattern.test(comment.text)).length
        : comments.length;
      button.querySelector("[data-filter-count]").textContent = count;
      button.addEventListener("click", function () {
        applyFilter(filter);
      });
    });
    setText("[data-comment-count]", comments.length);
    applyFilter("all");
  }

  function initializeCommentExpansion() {
    document.querySelectorAll(".survey-comment").forEach(function (card) {
      const preview = card.querySelector(".survey-comment-preview");
      const button = card.querySelector(".survey-comment-toggle");
      const isOverflowing = preview.scrollHeight > preview.clientHeight + 1;

      card.classList.toggle("is-collapsible", isOverflowing);
      button.hidden = !isOverflowing;
      if (!isOverflowing) preview.classList.remove("is-collapsed");

      button.addEventListener("click", function () {
        const isExpanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!isExpanded));
        button.textContent = isExpanded ? "See more" : "Show less";
        preview.classList.toggle("is-collapsed", isExpanded);
      });
    });
  }

  function renderSurvey(records) {
    const uniqueRecords = records.filter((record) => record[columns.duplicate] === "No");
    const duplicates = records.length - uniqueRecords.length;
    const noPreferenceCount = uniqueRecords.filter(
      (record) => record[columns.choice] === choices.noPreference
    ).length;
    const countChoice = (choice) =>
      uniqueRecords.filter((record) => record[columns.choice] === choice).length;
    const countWriteInStance = (stance) =>
      uniqueRecords.filter(
        (record) =>
          record[columns.choice] === choices.somethingElse &&
          record[columns.trackSupport] === stance
      ).length;

    const pieData = [
      { label: "ATC Indoor Track Proposal", count: countChoice(choices.track), className: "survey-fill-atc", textClass: "survey-label-light", legendOrder: 1 },
      { label: "Green Space", count: countChoice(choices.greenSpace), className: "survey-fill-green", textClass: "survey-label-light", legendOrder: 0 },
      { label: "Something Else — Green Space", count: countWriteInStance("No"), className: "survey-fill-light-green", textClass: "survey-label-dark", legendOrder: 2 },
      { label: "Something Else — Track", count: countWriteInStance("Yes"), className: "survey-fill-light-red", textClass: "survey-label-light", legendOrder: 3 },
    ];
    const classifiedTotal = pieData.reduce((sum, item) => sum + item.count, 0);
    pieData.forEach(function (item) {
      item.percentage = classifiedTotal ? (item.count / classifiedTotal) * 100 : 0;
    });

    const barData = [
      { label: "Green Space", shortLabel: "Green Space", count: countChoice(choices.greenSpace), className: "survey-fill-green" },
      { label: "ATC Indoor Track Proposal", shortLabel: "ATC Track", count: countChoice(choices.track), className: "survey-fill-atc" },
      { label: "Something Else", shortLabel: "Something Else", count: countChoice(choices.somethingElse), className: "survey-fill-gold" },
      { label: "No Preference", shortLabel: "No Preference", count: noPreferenceCount, className: "survey-fill-gray" },
    ];

    setText("[data-submission-count]", records.length);
    setText("[data-unique-count]", uniqueRecords.length);
    setText("[data-duplicate-count]", duplicates);
    setText("[data-classified-count]", classifiedTotal);
    setText("[data-no-preference-count]", noPreferenceCount);
    renderPieChart(document.querySelector("#survey-pie-chart"), pieData);
    renderBarChart(document.querySelector("#survey-bar-chart"), barData);
    renderWriteIns(uniqueRecords);
    renderComments(uniqueRecords);
    document.querySelector("#survey-results-content").hidden = false;
    document.querySelector("#survey-loading").hidden = true;
    initializeCommentExpansion();
  }

  async function initializeSurvey() {
    try {
      const response = await fetch("../assets/docs/s1.csv");
      if (!response.ok) throw new Error(`Survey data request failed with status ${response.status}.`);
      const parsed = parseCsv(await response.text());
      validateColumns(parsed.headers);
      renderSurvey(parsed.records);
    } catch (error) {
      console.error(error);
      document.querySelector("#survey-loading").hidden = true;
      document.querySelector("#survey-error").hidden = false;
    }
  }

  initializeSurvey();
})();
