import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDirectory, "..");
const ignoredDirectories = new Set([".git", ".agents", ".codex", "prompts"]);
const htmlFiles = [];
const errors = [];

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith(".html")) htmlFiles.push(path);
  }
}

function checkFile(path) {
  const source = readFileSync(path, "utf8");
  const relativePath = path.slice(root.length + 1);
  const ids = [...source.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const headings = source.match(/<h1(?:\s|>)/g) || [];
  const images = [...source.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
  const newWindowLinks = [...source.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map(
    (match) => match[0]
  );
  const attributes = [...source.matchAll(/\s(?:href|src)="([^"]+)"/g)].map(
    (match) => match[1]
  );

  if (headings.length !== 1) {
    errors.push(`${relativePath}: expected one h1, found ${headings.length}`);
  }

  if (duplicateIds.length) {
    errors.push(
      `${relativePath}: duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}`
    );
  }

  for (const image of images) {
    if (!/\salt="[^"]*"/.test(image)) {
      errors.push(`${relativePath}: image without alt text`);
    }
    if (!/\swidth="\d+"/.test(image) || !/\sheight="\d+"/.test(image)) {
      errors.push(`${relativePath}: image without intrinsic width and height`);
    }
  }

  for (const link of newWindowLinks) {
    if (!/\srel="[^"]*noopener[^"]*"/.test(link)) {
      errors.push(`${relativePath}: target="_blank" link without rel="noopener"`);
    }
  }

  for (const value of attributes) {
    if (
      value.startsWith("http") ||
      value.startsWith("//") ||
      value.startsWith("mailto:") ||
      value.startsWith("data:") ||
      value.startsWith("#")
    ) {
      if (value.startsWith("#") && !ids.includes(value.slice(1))) {
        errors.push(`${relativePath}: missing same-page target ${value}`);
      }
      continue;
    }

    if (value.startsWith("/")) {
      errors.push(
        `${relativePath}: root-relative URL ${value} will not work from a GitHub Pages project path`
      );
      continue;
    }

    const [urlWithQuery, fragment] = value.split("#");
    const urlPath = urlWithQuery.split("?")[0];
    const target = resolve(dirname(path), urlPath);

    if (!existsSync(target)) {
      errors.push(`${relativePath}: missing local target ${value}`);
      continue;
    }

    if (fragment && target.endsWith(".html")) {
      const targetSource = readFileSync(target, "utf8");
      if (!targetSource.includes(`id="${fragment}"`)) {
        errors.push(`${relativePath}: missing fragment target ${value}`);
      }
    }
  }
}

walk(root);
htmlFiles.forEach(checkFile);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Checked ${htmlFiles.length} HTML files: links, fragments, IDs, headings, image metadata, and safe new-window links pass.`
);
