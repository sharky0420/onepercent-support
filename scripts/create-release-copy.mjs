import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cacheRoot = "/Users/eliaslanez/Library/Caches";
const releaseRoot = path.resolve(
  process.env.ONEPERCENT_RELEASE_DIR ??
    path.join(cacheRoot, "onepercent-support-release"),
);
const stagingRoot = `${releaseRoot}.staging`;

if (!releaseRoot.startsWith(`${cacheRoot}${path.sep}`)) {
  throw new Error(`Release directory must stay inside ${cacheRoot}.`);
}

const releaseEntries = [
  ".gitignore",
  "README.md",
  "docs",
  "eslint.config.mjs",
  "package-lock.json",
  "package.json",
  "public",
  "scripts",
  "src",
  "tests",
];

async function collectFiles(directory, relativeDirectory = "") {
  const entries = await readdir(path.join(directory, relativeDirectory), {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "node_modules" || entry.name === "SHA256SUMS") continue;
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(directory, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

async function sha256(filename) {
  const contents = await readFile(filename);
  return createHash("sha256").update(contents).digest("hex");
}

async function createReleaseCopy() {
  await rm(stagingRoot, { recursive: true, force: true });
  await mkdir(stagingRoot, { recursive: true });

  for (const entry of releaseEntries) {
    await cp(path.join(projectRoot, entry), path.join(stagingRoot, entry), {
      recursive: true,
      force: true,
    });
  }

  const releaseFiles = await collectFiles(stagingRoot);
  const manifestLines = [];
  for (const relativePath of releaseFiles) {
    const digest = await sha256(path.join(stagingRoot, relativePath));
    manifestLines.push(`${digest}  ${relativePath.split(path.sep).join("/")}`);
  }
  await writeFile(
    path.join(stagingRoot, "SHA256SUMS"),
    `${manifestLines.join("\n")}\n`,
    "utf8",
  );

  await rm(releaseRoot, { recursive: true, force: true });
  await rename(stagingRoot, releaseRoot);

  console.log(`Release copy: ${releaseRoot}`);
  console.log(`Files hashed: ${releaseFiles.length}`);
}

await createReleaseCopy();
