import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDirectory, "..");
const defaultInputDirectory = resolve(root, "assets/images/shac");
const defaultOutputDirectory = defaultInputDirectory;
const inputDirectory = resolve(process.argv[2] ?? defaultInputDirectory);
const outputDirectory = resolve(process.argv[3] ?? defaultOutputDirectory);
const widths = [1920, 900];

if (!existsSync(inputDirectory)) {
  throw new Error(`Input directory does not exist: ${inputDirectory}`);
}

const sources = readdirSync(inputDirectory)
  .filter((name) => extname(name).toLowerCase() === ".png")
  .sort();

if (!sources.length) {
  throw new Error(`No PNG source images found in ${inputDirectory}`);
}

for (const sourceName of sources) {
  const sourcePath = resolve(inputDirectory, sourceName);
  const outputBase = basename(sourceName, extname(sourceName));

  for (const width of widths) {
    const suffix = width === 1920 ? "" : `-${width}`;
    const outputPath = resolve(outputDirectory, `${outputBase}${suffix}.webp`);
    const result = spawnSync(
      "convert",
      [sourcePath, "-resize", `${width}x${width}>`, "-strip", "-quality", "82", outputPath],
      { stdio: "inherit" }
    );

    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`Image conversion failed for ${sourceName} at ${width}px.`);
    }
  }
}

console.log(`Generated ${sources.length * widths.length} SHAC WebP images in ${outputDirectory}.`);
