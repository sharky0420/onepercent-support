import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { PNG } from "pngjs";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const docsDirectory = path.join(projectRoot, "docs");
const officialLogoPath = path.join(
  projectRoot,
  "assets",
  "branding",
  "onepercent_logo.png",
);
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
    assert.match(
      html,
      /<img class="brand-logo" src="[^"]*onepercent-logo\.png" width="34" height="34" alt="">/i,
    );
    assert.equal(
      html.match(/class="brand-logo"/g)?.length,
      2,
      `${page.file}: header and footer must use the official logo.`,
    );
    assert.doesNotMatch(
      html,
      /codex-preview|react-loading-skeleton|vinext-starter|Fokuspfad|QuietTurn|ReRoute/i,
    );
    assert.doesNotMatch(
      html,
      /brand-arc|brand-pause|pause-bars/i,
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
  assert.match(home, /Für iPhone &amp; Android/);
  assert.match(home, /Fokus und Lernen/);
  assert.match(home, /ohne Tracking/);
  assert.match(home, /Deutsch und Englisch verfügbar/);
  assert.match(home, /Dein persönliches 1%/);

  assert.match(support, /TestFlight/);
  assert.match(support, /geschlossenen Google-Play-Test/);
  assert.match(support, /e\.lanez2004@gmail\.com/);
  assert.match(support, /Android-Version liest keine Liste installierter Apps/);
  assert.match(support, /Android benötigt Version 7\.0 oder neuer/);
  assert.match(support, /iOS 16 oder neuer/);
  assert.match(support, /Whitelist-Fokus/);
  assert.match(support, /Ocean und Ember/);
  assert.match(support, /Ab 500 Punkten kannst du 30 Tage Pro aktivieren/);
  assert.match(support, /kein Schul-Backend/);
  assert.match(support, /sichere Serverprüfung nötig/);

  assert.match(privacy, /2\. September 2026/);
  assert.match(privacy, /keine Analyse-SDKs/);
  assert.match(privacy, /Android-Version liest weder installierte Apps/);
  assert.match(privacy, /Neustart-Berechtigung/);
  assert.match(privacy, /Screen-Time- und Device-Activity-Komponenten/);
  assert.match(privacy, /lokal und deterministisch/);
  assert.match(privacy, /keine Anfrage an einen externen KI-Dienst/);
  assert.match(privacy, /keine ausschließlich automatisierten Entscheidungen/);
  assert.match(privacy, /vor einem produktiven Bezahlbetrieb/);
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

test("metadata, official brand assets and GitHub Pages files are complete", async () => {
  const [
    home,
    notFound,
    robots,
    sitemap,
    stylesheet,
    officialLogo,
    publishedLogo,
  ] =
    await Promise.all([
      readOutput("index.html"),
      readOutput("404.html"),
      readOutput("robots.txt"),
      readOutput("sitemap.xml"),
      readOutput("assets/site.css"),
      readFile(officialLogoPath),
      readFile(path.join(docsDirectory, "assets", "onepercent-logo.png")),
      access(path.join(docsDirectory, ".nojekyll")),
      access(path.join(docsDirectory, "favicon.png")),
      access(path.join(docsDirectory, "og.png")),
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

  assert.deepEqual(
    publishedLogo,
    officialLogo,
    "The website logo must stay byte-identical to the official app logo.",
  );

  const [faviconData, ogData] = await Promise.all([
    readFile(path.join(docsDirectory, "favicon.png")),
    readFile(path.join(docsDirectory, "og.png")),
  ]);
  const official = PNG.sync.read(officialLogo);
  const favicon = PNG.sync.read(faviconData);
  const ogImage = PNG.sync.read(ogData);
  assert.equal(favicon.width, 64);
  assert.equal(favicon.height, 64);
  assert.equal(ogImage.width, 1200);
  assert.equal(ogImage.height, 630);

  for (const [x, y] of [
    [0, 0],
    [16, 16],
    [31, 31],
    [47, 47],
    [63, 63],
  ]) {
    for (let channel = 0; channel < 4; channel += 1) {
      let total = 0;
      for (let sourceY = y * 8; sourceY < (y + 1) * 8; sourceY += 1) {
        for (let sourceX = x * 8; sourceX < (x + 1) * 8; sourceX += 1) {
          total +=
            official.data[(sourceY * official.width + sourceX) * 4 + channel];
        }
      }
      assert.equal(
        favicon.data[(y * favicon.width + x) * 4 + channel],
        Math.round(total / 64),
        `Favicon sample ${x},${y} is not derived from the official logo.`,
      );
    }
  }

  const logoLeft = (ogImage.width - official.width) / 2;
  const logoTop = (ogImage.height - official.height) / 2;
  for (let y = 0; y < official.height; y += 1) {
    const officialRow = official.data.subarray(
      y * official.width * 4,
      (y + 1) * official.width * 4,
    );
    const ogRow = ogImage.data.subarray(
      ((logoTop + y) * ogImage.width + logoLeft) * 4,
      ((logoTop + y) * ogImage.width + logoLeft + official.width) * 4,
    );
    assert.ok(
      Buffer.compare(officialRow, ogRow) === 0,
      `Open-Graph logo row ${y} differs from the official source.`,
    );
  }
});
