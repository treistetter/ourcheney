import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDirectory, "..");
const inputPath = resolve(root, "ignored/s1.csv");
const outputPath = resolve(root, "assets/docs/s1.csv");

const columns = {
  submissionId: "Submission ID",
  respondentId: "Respondent ID",
  submittedAt: "Submitted at",
  address: "Street Address or Nearest Intersection",
  choice:
    "Cheney Field and the Martin St field are owned by APS and are therefore publicly owned land. If given the choice, what is your vision for these lots?",
  writeIn: "What would you like to see?",
  comments: "Any Additional Comments?",
  trackSupport: "Something Else - Supports Track",
  duplicate: "Duplicate",
};

const writeInClassifications = new Map([
  ["gbgealN", "No"],
  ["PR4LEyx", "Yes"],
  ["1WOzEL1", "No"],
  ["vXgVOgX", "No"],
  ["NqExVab", "No"],
  ["BE6ooO5", "No"],
  ["PR4ZVb1", "No"],
  ["rDgMjMM", "No"],
  ["OQrMlJY", "No"],
  ["q5g1lK7", "No"],
  ["BE6WNVe", "No"],
  ["BE6RQ6R", "No"],
  ["o9gjke5", "No"],
  ["pe52MQP", "No"],
  ["o9gjNVX", "No"],
  ["1WOaevM", "No"],
  ["lagG45B", "No"],
  ["NqEjQEB", "No"],
  ["zEgkXNg", "No"],
  ["yXgB958", "No"],
  ["BE6r6ZR", "No"],
  ["q5g9pX2", "Yes"],
  ["VpqKADE", "No"],
  ["PR47Zoe", "No"],
  ["kbg2oZ1", "Yes"],
  ["0VGNX49", "Yes"],
]);

function parseCsv(source) {
  const text = source.replace(/^\uFEFF/, "");
  const records = [];
  let record = [];
  let field = "";
  let inQuotes = false;

  function finishField() {
    record.push(field);
    field = "";
  }

  function finishRecord() {
    finishField();
    records.push(record);
    record = [];
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
      finishRecord();
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error("Unterminated quoted CSV field.");
  if (field || record.length) finishRecord();

  const [headers, ...values] = records;
  if (!headers) throw new Error("The source CSV is empty.");

  return values.map((fields, rowIndex) => {
    if (fields.length !== headers.length) {
      throw new Error(
        `CSV row ${rowIndex + 2} has ${fields.length} fields; expected ${headers.length}.`
      );
    }

    return Object.fromEntries(headers.map((header, index) => [header, fields[index]]));
  });
}

function stringifyCsv(headers, records) {
  const escapeField = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const lines = [headers, ...records.map((record) => headers.map((header) => record[header]))];
  return `${lines.map((line) => line.map(escapeField).join(",")).join("\r\n")}\r\n`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(inputPath, "utf8");
const records = parseCsv(source);
const requiredHeaders = [
  columns.submissionId,
  columns.respondentId,
  columns.submittedAt,
  columns.address,
  columns.choice,
  columns.writeIn,
  columns.comments,
];

for (const header of requiredHeaders) {
  assert(Object.hasOwn(records[0] ?? {}, header), `Missing required header: ${header}`);
}

const latestByRespondent = new Map();
records.forEach((record, index) => {
  const respondentId = record[columns.respondentId].trim();
  const submittedAt = record[columns.submittedAt].trim();
  assert(respondentId, `Missing respondent ID on CSV row ${index + 2}.`);
  assert(
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(submittedAt),
    `Invalid submission timestamp on CSV row ${index + 2}: ${submittedAt}`
  );

  const current = latestByRespondent.get(respondentId);
  if (!current || submittedAt >= current.submittedAt) {
    latestByRespondent.set(respondentId, { index, submittedAt });
  }
});

const somethingElse = "Something else (write in)";
const outputRecords = records.map((record, index) => {
  const submissionId = record[columns.submissionId].trim();
  const isWriteIn = record[columns.choice] === somethingElse;
  const trackSupport = isWriteIn ? writeInClassifications.get(submissionId) : "";

  if (isWriteIn) {
    assert(trackSupport, `Missing write-in classification for submission ${submissionId}.`);
  }

  const latest = latestByRespondent.get(record[columns.respondentId].trim());
  const duplicate = latest.index === index ? "No" : "Yes";

  return {
    [columns.submissionId]: record[columns.submissionId],
    [columns.respondentId]: record[columns.respondentId],
    [columns.submittedAt]: record[columns.submittedAt],
    [columns.choice]: record[columns.choice],
    [columns.writeIn]: record[columns.writeIn],
    [columns.comments]: record[columns.comments],
    [columns.trackSupport]: trackSupport,
    [columns.duplicate]: duplicate,
  };
});

for (const submissionId of writeInClassifications.keys()) {
  assert(
    outputRecords.some((record) => record[columns.submissionId] === submissionId),
    `Classification references missing submission ${submissionId}.`
  );
}

const outputHeaders = [
  columns.submissionId,
  columns.respondentId,
  columns.submittedAt,
  columns.choice,
  columns.writeIn,
  columns.comments,
  columns.trackSupport,
  columns.duplicate,
];
const uniqueRecords = outputRecords.filter((record) => record[columns.duplicate] === "No");
const uniqueWriteIns = uniqueRecords.filter((record) => record[columns.choice] === somethingElse);

assert(
  uniqueRecords.length === latestByRespondent.size,
  "The number of retained records does not match the number of respondent IDs."
);
assert(
  outputRecords.filter((record) => record[columns.duplicate] === "Yes").length ===
    outputRecords.length - latestByRespondent.size,
  "The duplicate count does not match the respondent groups."
);
assert(
  uniqueWriteIns.every((record) => ["Yes", "No"].includes(record[columns.trackSupport])),
  "Every retained write-in must have a Yes or No track classification."
);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, stringifyCsv(outputHeaders, outputRecords), "utf8");
console.log(
  `Wrote ${outputRecords.length} submissions to ${outputPath}; ${uniqueRecords.length} are unique and ${outputRecords.length - uniqueRecords.length} are duplicates.`
);
