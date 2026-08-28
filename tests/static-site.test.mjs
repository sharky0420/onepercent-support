import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const docsDirectory = path.join(projectRoot, "docs");
const configuredSiteUrl =
  process.env.ONEPERCENT_SITE_URL ??
  "https://sharky0420.github.io/onepercent-support";
const deployedRoot = new URL(`${configuredSiteUrl.replace(/\/$/, "")}/`);

const pages = [
  { file: "index.html", url: deployedRoot.href },
  { file: "support/index.html", url: new URL("support/", deployedRoot).href },
  { file: "privacy/index.html", url: new URL("privacy/", deployedRoot).href },
  {
    file: "404.html",
    url: new URL("missing/nested/page", deployedRoot).href,
  },
];

async function readOutput(relativePath) {
  return readFile(path.join(docsDirectory, relativePath), "utf8");
}

function attributeValues(html, name) {
  return [...html.matchAll(new RegExp(`\\b${name}="([^"]+)"`, "gi"))].map(
    (match) => match[1],
  );
}

function assertBalancedHtml(html, filename) {
  const voidElements = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);
  const stack = [];
  const tags = html.matchAll(/<\/?([a-z][a-z0-9-]*)(?:\s[^<>]*?)?>/gi);

  for (const match of tags) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    if (voidElements.has(tagName)) continue;

    if (fullTag.startsWith("</")) {
      assert.equal(
        stack.pop(),
        tagName,
        `${filename}: closing </${tagName}> is out of order`,
      );
    } else {
      stack.push(tagName);
    }
  }

  assert.deepEqual(stack, [], `${filename}: unclosed HTML elements`);
}

function outputPathForUrl(url) {
  const rootPath = deployedRoot.pathname;
  assert.ok(
    url.pathname.startsWith(rootPath),
    `Internal URL escaped the GitHub Pages project path: ${url.href}`,
  );

  const relativePath = decodeURIComponent(url.pathname.slice(rootPath.length));
  if (!relativePath || relativePath.endsWith("/")) {
    return path.join(docsDirectory, relativePath, "index.html");
  }
  return path.join(docsDirectory, relativePath);
}

test("all static pages are well-formed, branded HTML", async () => {
  for (const page of pages) {
    const html = await readOutput(page.file);
    assert.match(html, /^<!doctype html>/i);
    assert.match(html, /<html lang="de">/i);
    assert.match(html, /<meta name="viewport"/i);
    assert.match(html, /<header class="site-header">/i);
    assert.match(html, /<main>/i);
    assert.match(html, /<footer class="site-footer">/i);
    assert.match(html, /onepercent/);
    assert.doesNotMatch(
      html,
      /codex-preview|react-loading-skeleton|vinext-starter|Fokuspfad|QuietTurn|ReRoute/i,
    );
    assert.doesNotMatch(html, />\s*Sharky\s*</i);
    assert.doesNotMatch(html, /<script\b/i);
    assertBalancedHtml(html, page.file);

    const ids = attributeValues(html, "id");
    assert.equal(new Set(ids).size, ids.length, `${page.file}: duplicate IDs`);
    for (const labelledBy of attributeValues(html, "aria-labelledby")) {
      assert.ok(ids.includes(labelledBy), `${page.file}: missing #${labelledBy}`);
    }
  }
});

test("all internal links and shared assets resolve inside the Pages project", async () => {
  for (const page of pages) {
    const html = await readOutput(page.file);
    const references = [
      ...attributeValues(html, "href"),
      ...attributeValues(html, "src"),
    ];

    for (const reference of references) {
      if (
        reference.startsWith("mailto:") ||
        reference.startsWith("#") ||
        reference.startsWith("data:")
      ) {
        continue;
      }

      const resolved = new URL(reference, page.url);
      if (resolved.origin !== deployedRoot.origin) continue;
      await access(outputPathForUrl(resolved));
    }
  }
});

test("landing, support and privacy content contains release-critical details", async () => {
  const [home, support, privacy] = await Promise.all([
    readOutput("index.html"),
    readOutput("support/index.html"),
    readOutput("privacy/index.html"),
  ]);

  assert.match(home, /<title>onepercent – Pause the impulse\.<\/title>/i);
  assert.match(home, /Echte Bildschirmzeit/);
  assert.match(home, /ohne Tracking/);

  assert.match(support, /TestFlight/);
  assert.match(support, /e\.lanez2004@gmail\.com/);
  assert.match(support, /App Store ID 6801456354/);
  assert.match(support, /letzten sieben Tage einschließlich heute/);
  assert.match(support, /iOS 16 oder neuer/);

  assert.match(privacy, /14\. August 2026/);
  assert.match(privacy, /keine Analyse-SDKs/);
  assert.match(privacy, /Screen-Time- und Device-Activity-Komponenten/);
  assert.match(privacy, /Hosting dieser Website über GitHub Pages/);
  assert.match(privacy, /GitHub, Inc\./);
  assert.match(privacy, /GitHub B\.V\./);
  assert.match(privacy, /keine einheitliche feste Aufbewahrungsfrist/);
  assert.match(
    privacy,
    /https:\/\/docs\.github\.com\/en\/pages\/getting-started-with-github-pages\/what-is-github-pages#data-collection/,
  );
  assert.match(
    privacy,
    /https:\/\/docs\.github\.com\/en\/site-policy\/privacy-policies\/github-general-privacy-statement/,
  );
});

test("metadata, fallback and GitHub Pages control files are complete", async () => {
  const [home, notFound, robots, sitemap, stylesheet, ogImage] =
    await Promise.all([
      readOutput("index.html"),
      readOutput("404.html"),
      readOutput("robots.txt"),
      readOutput("sitemap.xml"),
      readOutput("assets/site.css"),
      readFile(path.join(docsDirectory, "og.png")),
      access(path.join(docsDirectory, ".nojekyll")),
      access(path.join(docsDirectory, "favicon.svg")),
    ]);

  assert.ok(
    home.includes(`<link rel="canonical" href="${deployedRoot.href}">`),
  );
  assert.ok(
    home.includes(
      `<meta property="og:image" content="${new URL("og.png", deployedRoot).href}">`,
    ),
  );
  assert.match(notFound, /<meta name="robots" content="noindex, follow">/);
  assert.ok(
    notFound.includes(
      `href="${deployedRoot.pathname}assets/site.css"`,
    ),
  );
  assert.ok(
    robots.includes(`Sitemap: ${new URL("sitemap.xml", deployedRoot).href}`),
  );
  assert.ok(
    sitemap.includes(`<loc>${new URL("privacy/", deployedRoot).href}</loc>`),
  );
  assert.match(stylesheet, /a:focus-visible/);
  assert.match(stylesheet, /prefers-reduced-motion/);
  assert.match(stylesheet, /@media \(max-width: 620px\)/);

  assert.equal(ogImage.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(ogImage.readUInt32BE(16), 1200);
  assert.equal(ogImage.readUInt32BE(20), 630);
});
