import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const docsDirectory = path.join(projectRoot, "docs");
const sourceDirectory = path.join(projectRoot, "src");
const publicDirectory = path.join(projectRoot, "public");

const supportEmail = "e.lanez2004@gmail.com";
// Keep the deployed repository slug until GitHub Pages is moved. Page copy,
// metadata and package identity are fully branded onepercent.
const defaultSiteUrl = "https://sharky0420.github.io/onepercent-support";
const siteUrl = normalizeSiteUrl(
  process.env.ONEPERCENT_SITE_URL ?? defaultSiteUrl,
);
const sitePath = `${new URL(siteUrl).pathname.replace(/\/$/, "")}/`;

function normalizeSiteUrl(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:") {
    throw new Error("ONEPERCENT_SITE_URL must use HTTPS.");
  }
  parsed.hash = "";
  parsed.search = "";
  return parsed.href.replace(/\/$/, "");
}

function pageLinks(depth, useSitePath = false) {
  const prefix = useSitePath ? sitePath : depth === 0 ? "./" : "../";
  return {
    home: prefix,
    support: `${prefix}support/`,
    privacy: `${prefix}privacy/`,
    stylesheet: `${prefix}assets/site.css`,
    logo: `${prefix}assets/onepercent-logo.png`,
    favicon: `${prefix}favicon.png`,
    ogImage: `${siteUrl}/og.png`,
  };
}

function brandMark(links) {
  return `<img class="brand-logo" src="${links.logo}" width="34" height="34" alt="">`;
}

function header(links, currentPage) {
  const current = (page) =>
    currentPage === page ? ' aria-current="page"' : "";

  return `
  <header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="${links.home}" aria-label="onepercent Startseite"${current("home")}>
        ${brandMark(links)}
        <span>onepercent</span>
      </a>
      <nav aria-label="Hauptnavigation">
        <a href="${links.support}"${current("support")}>Hilfe</a>
        <a href="${links.privacy}"${current("privacy")}>Datenschutz</a>
        <a class="nav-contact" href="mailto:${supportEmail}">Kontakt</a>
      </nav>
    </div>
  </header>`;
}

function footer(links) {
  return `
  <footer class="site-footer">
    <div class="shell footer-inner">
      <div>
        <a class="brand footer-brand" href="${links.home}" aria-label="onepercent Startseite">
          ${brandMark(links)}
          <span>onepercent</span>
        </a>
        <p>Pause the impulse.</p>
      </div>
      <div class="footer-links">
        <a href="${links.support}">Hilfe</a>
        <a href="${links.privacy}">Datenschutz</a>
        <a href="mailto:${supportEmail}">Kontakt</a>
      </div>
      <p class="copyright">© 2026 onepercent · iOS &amp; Android</p>
    </div>
  </footer>`;
}

function pageIntro(eyebrow, title, copy) {
  return `
    <section class="page-intro shell">
      <p class="eyebrow"><span></span>${eyebrow}</p>
      <h1>${title}</h1>
      <p>${copy}</p>
    </section>`;
}

function layout({
  title,
  description,
  route,
  depth,
  currentPage,
  content,
  noIndex = false,
  useSitePath = false,
}) {
  const links = pageLinks(depth, useSitePath);
  const canonicalUrl = route
    ? `${siteUrl}/${route.replace(/^\//, "")}`
    : `${siteUrl}/`;

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark light">
  <meta name="theme-color" content="#080a14">
  <meta name="robots" content="${noIndex ? "noindex, follow" : "index, follow"}">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" href="${links.favicon}" type="image/png" sizes="64x64">
  <link rel="stylesheet" href="${links.stylesheet}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="de_DE">
  <meta property="og:site_name" content="onepercent">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${links.ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Offizielles onepercent 1%-Logo">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${links.ogImage}">
</head>
<body>
${header(links, currentPage)}
  <main>
${content(links)}
  </main>
${footer(links)}
</body>
</html>
`;
}

const homePage = layout({
  title: "onepercent – Pause the impulse.",
  description:
    "onepercent verbindet tägliche 1%-Schritte, Fokus und Lernen – privat, lokal und ohne Tracking.",
  route: "",
  depth: 0,
  currentPage: "home",
  content: (links) => `
    <section class="hero shell" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow"><span></span>Für iPhone &amp; Android</p>
        <h1 id="hero-title">Pause the impulse.<br><span>Choose your next move.</span></h1>
        <p class="hero-intro">onepercent macht aus Autopilot einen bewussten Moment – mit persönlichen 1%-Impulsen, Fokus-Sessions, kurzen Lernmomenten und ohne Tracking. Die App ist auf Deutsch und Englisch verfügbar.</p>
        <div class="actions">
          <a class="button button-primary" href="${links.support}">Hilfe öffnen <span aria-hidden="true">↗</span></a>
          <a class="button button-secondary" href="${links.privacy}">Datenschutz</a>
        </div>
        <p class="availability"><span class="status-dot" aria-hidden="true"></span>Veröffentlichung in App Store und Google Play wird vorbereitet</p>
      </div>

      <div class="hero-visual" aria-label="onepercent – ein ruhiger Moment vor der nächsten Entscheidung">
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <div class="hero-brand"><img src="${links.logo}" width="126" height="126" alt=""></div>
        <div class="orbit-label label-pause">Pause</div>
        <div class="orbit-label label-choose">Choose</div>
        <p>Ein Moment<br>gehört wieder dir.</p>
      </div>
    </section>

    <section class="principles shell" aria-labelledby="principles-title">
      <div class="section-heading">
        <p class="eyebrow"><span></span>So funktioniert onepercent</p>
        <h2 id="principles-title">Weniger Autopilot.<br>Mehr Absicht.</h2>
      </div>
      <div class="feature-grid">
        <article class="feature-card"><span class="feature-number">01</span><h3>Dein persönliches 1%</h3><p>Ein lokales Profil und nachvollziehbare Empfehlungen machen aus deinem Ziel einen kleinen Schritt für heute.</p></article>
        <article class="feature-card"><span class="feature-number">02</span><h3>Fokus und Lernen</h3><p>Fokus-Sessions, kurze Lektionen und Denkspiele helfen dir, deine nächste bewusste Entscheidung direkt umzusetzen.</p></article>
        <article class="feature-card"><span class="feature-number">03</span><h3>Privat auf dem Gerät</h3><p>Profil, Fortschritt, Streaks und Einstellungen bleiben lokal. Es gibt kein onepercent-Konto, keine Werbung und kein Tracking.</p></article>
      </div>
    </section>

    <section class="privacy-promise shell" aria-labelledby="privacy-title">
      <div><p class="eyebrow"><span></span>Privacy by design</p><h2 id="privacy-title">Deine Nutzung bleibt auf deinem Gerät.</h2></div>
      <div class="promise-copy">
        <p>Kein Konto. Kein Werbeprofil. Keine Analyse-SDKs. Keine Übertragung deiner Profil- oder Fortschrittsdaten an onepercent-Server.</p>
        <a href="${links.privacy}">Datenschutz im Detail <span aria-hidden="true">→</span></a>
      </div>
    </section>

    <section class="support-cta shell" aria-labelledby="support-title">
      <p class="eyebrow light"><span></span>Wir helfen dir</p>
      <h2 id="support-title">Eine Frage zu onepercent?</h2>
      <p>Die häufigsten Antworten findest du in der Hilfe. Persönlich erreichst du uns per E-Mail.</p>
      <div class="actions centered">
        <a class="button button-light" href="${links.support}">Zur Hilfe</a>
        <a class="button button-outline-light" href="mailto:${supportEmail}">E-Mail schreiben</a>
      </div>
    </section>`,
});

const supportPage = layout({
  title: "Hilfe | onepercent",
  description:
    "Hilfe zu Einrichtung, Fokus, Fortschritt und Plattformfunktionen von onepercent.",
  route: "support/",
  depth: 1,
  currentPage: "support",
  content: () => `
${pageIntro("onepercent Hilfe", "Schnell wieder im Fokus.", "Hier findest du die wichtigsten Schritte zur Einrichtung und Antworten auf häufige Fragen.")}

    <section class="content-section shell" aria-labelledby="setup-title">
      <div class="content-heading"><span class="content-index">01</span><div><p class="kicker">Einrichtung</p><h2 id="setup-title">Schnell startklar</h2></div></div>
      <ol class="step-list">
        <li><span>01</span><div><h3>Profil und Ziel wählen</h3><p>Beantworte beim ersten Start ein paar kurze Fragen. Deine Angaben werden nur auf deinem Gerät gespeichert und bestimmen deine täglichen Empfehlungen.</p></div></li>
        <li><span>02</span><div><h3>Dein tägliches 1% starten</h3><p>Öffne „Heute“, wähle eine passende Aktivität und schließe deinen ersten bewussten Schritt ab.</p></div></li>
        <li><span>03</span><div><h3>Fokus oder Lernmoment nutzen</h3><p>Starte eine Fokus-Session, eine kurze Lektion oder eines der Denkspiele. Fortschritt, Streak und Punkte werden lokal gespeichert.</p></div></li>
        <li><span>04</span><div><h3>Optionale Erinnerungen erlauben</h3><p>Wenn du lokale Erinnerungen möchtest, bestätige die Systemabfrage. Du kannst die Berechtigung jederzeit in iOS oder Android widerrufen.</p></div></li>
      </ol>
    </section>

    <section class="content-section shell" aria-labelledby="faq-title">
      <div class="content-heading"><span class="content-index">02</span><div><p class="kicker">FAQ</p><h2 id="faq-title">Häufige Fragen</h2></div></div>
      <div class="faq-list">
        <details open><summary>Welche Funktionen gibt es auf Android?</summary><p>Auf Android funktionieren persönlicher Tagescoach, Fokus-Sessions, Lernmomente, Denkspiele, Streaks, Punkte, Fortschritt und lokale Erinnerungen. Apples Bildschirmzeitbericht, FamilyActivityPicker und das systemweite Schützen ausgewählter Apps sind ausschließlich auf unterstützten iPhones und iPads verfügbar.</p></details>
        <details><summary>Speichert onepercent meine App-Nutzung?</summary><p>Die Android-Version liest keine Liste installierter Apps und keine Bildschirmzeit aus. Auf iOS werden Bildschirmzeitwerte nur innerhalb Apples geschützter Berichtserweiterung ausgewertet und nicht an einen onepercent-Server übertragen. Profil, Einstellungen und Fortschritt bleiben lokal.</p></details>
        <details><summary>Was ist in FREE und PRO enthalten?</summary><p>FREE umfasst eine aktive persönliche Regel und eine Basis-Historie der letzten sieben Tage. PRO bietet unbegrenzte persönliche Regeln, Deep Focus, einen Whitelist-Fokus für einzeln gewählte Apps und Webdomains, eine zehnsekündige Freigabeverzögerung, eine unbegrenzte detaillierte Historie sowie die Farbstile Ocean und Ember. Das offizielle 1%-App-Icon bleibt fest; auswählbare Launcher-Icon-Varianten gibt es derzeit nicht.</p></details>
        <details><summary>Wie funktionieren Punkte und der Pro-Pass?</summary><p>Jeder eindeutig gespeicherte Abschluss bringt einmalig 10 Punkte. Ein 14-Tage-Streak bringt einmalig 100 Bonuspunkte. Ab 500 Punkten kannst du 30 Tage Pro aktivieren. Doppelte Callbacks buchen keine doppelten Punkte.</p></details>
        <details><summary>Ist onepercent auch auf Englisch verfügbar?</summary><p>Ja. Du kannst in der App Deutsch, Englisch oder die Systemsprache wählen. Onboarding, Hauptansichten, Spiele, native Bildschirmzeitberichte und System-Shields folgen dieser Einstellung.</p></details>
        <details><summary>Warum öffnet eine Sperre onepercent nicht automatisch?</summary><p>Der Sperrbildschirm wird von iOS dargestellt. Apple erlaubt diesem Systembildschirm nicht, automatisch eine andere App oder Lernaktivität zu öffnen. Tippe auf die onepercent-Mitteilung oder öffne die App manuell; dort startet die zur Regel passende Aktivität. Wenn Mitteilungen deaktiviert oder durch einen Fokus zurückgehalten werden, bleibt der manuelle Weg.</p></details>
        <details><summary>Kann eine Schule onepercent zentral erzwingen?</summary><p>Die App enthält ein lokales Schulzeit-Preset und eine technische Grundlage für signierte, schreibgeschützte Schulrichtlinien. Im aktuellen Release sind jedoch kein Schul-Backend, kein Signaturschlüssel und kein MDM-Deployment konfiguriert. Auf privaten iPhones kann der Besitzer die Bildschirmzeitfreigabe widerrufen; verbindliche zentrale Durchsetzung setzt verwaltete Schulgeräte und MDM voraus.</p></details>
        <details><summary>Wie verlässlich ist ein Pro-Kauf?</summary><p>App Store und Google Play liefern Produkt, Preis und Kaufbeleg. Der aktuelle Build wertet den Beleg auf dem Gerät vorläufig aus. Für einen produktiven Bezahlbetrieb ist zusätzlich eine sichere Serverprüfung nötig, damit Verlängerungen, Erstattungen und Widerrufe autoritativ berücksichtigt werden.</p></details>
        <details><summary>Wie kann ich onepercent herunterladen?</summary><p>Vor der öffentlichen Veröffentlichung erhalten Tester eine Einladung über Apple TestFlight oder den geschlossenen Google-Play-Test. Nach der Freigabe erscheint onepercent im App Store und bei Google Play.</p></details>
        <details><summary>Welche Systemversion wird benötigt?</summary><p>Android benötigt Version 7.0 oder neuer. Die Apple-Bildschirmzeitfunktionen benötigen ein kompatibles iPhone oder iPad mit iOS 16 oder neuer.</p></details>
      </div>
    </section>

    <section class="contact-panel shell" aria-labelledby="contact-title">
      <div><p class="eyebrow light"><span></span>Persönlicher Support</p><h2 id="contact-title">Noch nicht gelöst?</h2></div>
      <div><p>Schreib uns, was passiert ist, welches Gerät und welche Systemversion du nutzt. Bitte sende keine vertraulichen Bildschirmzeitdetails.</p><a class="button button-light" href="mailto:${supportEmail}?subject=onepercent%20Support">${supportEmail}</a></div>
    </section>`,
});

const privacyPage = layout({
  title: "Datenschutz | onepercent",
  description: "Datenschutzhinweise für die iOS- und Android-App onepercent und diese Website.",
  route: "privacy/",
  depth: 1,
  currentPage: "privacy",
  content: () => `
${pageIntro("Datenschutz", "Deine Daten gehören dir.", "onepercent wurde so gebaut, dass deine Daten auf deinem Gerät bleiben. Stand dieser Hinweise: 2. September 2026.")}

    <article class="legal shell">
      <section><span class="content-index">01</span><div><h2>Verantwortlicher und Kontakt</h2><p>Verantwortlich für onepercent ist Elias Lanez. Datenschutz- und Supportanfragen kannst du an <a href="mailto:${supportEmail}">${supportEmail}</a> richten.</p></div></section>
      <section><span class="content-index">02</span><div><h2>Datenverarbeitung in der App</h2><p>onepercent benötigt kein Benutzerkonto und betreibt keinen eigenen Backend-Dienst für deine App-Nutzung. Profilangaben, Ziele, Regeln, Zeitpläne, Spracheinstellungen, Streaks, Punkte und Lernfortschritt werden lokal auf deinem Gerät gespeichert. Persönliche Tipps werden lokal und deterministisch aus deinen Onboarding-Antworten und Fortschrittsdaten abgeleitet; dafür findet keine Anfrage an einen externen KI-Dienst statt. Beim Zurücksetzen der App-Daten oder beim Deinstallieren entfernt das Betriebssystem diese lokalen Daten nach seinen Regeln.</p><p>Die Android-Version liest weder installierte Apps noch Bildschirmzeit- oder Nutzungsverläufe aus. Auf iOS werden die von Apple bereitgestellten Bildschirmzeitdaten und der Sieben-Tage-Bericht ausschließlich innerhalb der geschützten Screen-Time- und Device-Activity-Komponenten auf deinem Gerät verarbeitet. Die Auswahl von Apps und Kategorien erfolgt dort über Apples FamilyActivityPicker und undurchsichtige System-Tokens. Elias Lanez erhält weder rohe Bildschirmzeitdaten noch App-Namen oder Nutzungsverläufe.</p></div></section>
      <section><span class="content-index">03</span><div><h2>Keine Werbung und kein Tracking in der App</h2><p>onepercent enthält keine Werbung, keine Analyse-SDKs und keine Tracking-Technologien. Es werden keine rohen Bildschirmzeitdaten an onepercent-Server gesendet, verkauft oder zu Werbeprofilen zusammengeführt.</p></div></section>
      <section><span class="content-index">04</span><div><h2>Berechtigungen</h2><p>Auf Android kann onepercent die Benachrichtigungsberechtigung anfragen, um von dir aktivierte lokale Erinnerungen anzuzeigen. Die App nutzt außerdem die Neustart-Berechtigung, damit geplante lokale Erinnerungen nach einem Gerätestart wiederhergestellt werden können.</p><p>Auf iOS wird die optionale Bildschirmzeit-Freigabe ausschließlich verwendet, um deine geschützte Auswahl zu verwalten, Regeln auf dem Gerät auszuführen und den Apple-Bericht anzuzeigen. Du kannst Berechtigungen jederzeit in den Systemeinstellungen widerrufen. Die Verarbeitung erfolgt lokal und überträgt keine Fortschrittsdaten an einen onepercent-Server.</p></div></section>
      <section><span class="content-index">05</span><div><h2>Support per E-Mail</h2><p>Wenn du uns schreibst, verarbeiten wir Absendername, E-Mail-Adresse, Nachrichteninhalt, Anhänge und technische Nachrichtenmetadaten, um dein Anliegen zu beantworten, Fehler zu untersuchen und Missbrauch abzuwehren. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO bei nutzungsbezogenen Supportanfragen, ansonsten unser berechtigtes Interesse an der Bearbeitung von Anfragen nach Art. 6 Abs. 1 lit. f DSGVO.</p><p>Für die E-Mail-Infrastruktur wird bei einem im EWR geführten Verbraucherkonto Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland, eingesetzt. Google kann Daten nach seinen Datenschutzbedingungen auch außerhalb des EWR verarbeiten. Nachrichten werden nur so lange aufbewahrt, wie dies für Bearbeitung und gegebenenfalls Nachweis erforderlich ist, und anschließend gelöscht, soweit keine gesetzlichen Pflichten entgegenstehen. Eine Nutzung für Werbung findet nicht statt.</p></div></section>
      <section><span class="content-index">06</span><div><h2>Käufe und Teilen</h2><p>Optionale Pro-Käufe werden über den App Store beziehungsweise Google Play abgewickelt. onepercent fragt Produktinformationen und Kaufstatus beim Geräte-Store ab. Der aktuelle Build übermittelt keinen Kaufbeleg an einen onepercent-Server und erhebt selbst keine Zahlungsdaten. Die lokale Belegauswertung ist vorläufig; vor einem produktiven Bezahlbetrieb ist eine sichere Serverprüfung erforderlich, um insbesondere Verlängerungen, Erstattungen und Widerrufe autoritativ zu berücksichtigen.</p><p>Die Teilen-Funktion öffnet nur nach deiner bewussten Aktion das System-Share-Sheet. Der vorgeschlagene Text enthält Streak und Punkte, aber keine App-Namen oder rohen Bildschirmzeitdaten. Eine Übermittlung erfolgt erst, wenn du einen Ziel-Dienst auswählst; dessen Datenschutzbestimmungen gelten für die weitere Verarbeitung.</p></div></section>
      <section><span class="content-index">07</span><div><h2>Hosting dieser Website über GitHub Pages</h2><p>Diese Website wird als statische Projektseite über den Dienst GitHub Pages bereitgestellt. GitHub nennt in seiner Datenschutzerklärung GitHub, Inc., 88 Colin P. Kelly Jr. St., San Francisco, CA 94107, USA, und GitHub B.V., Prins Bernhardplein 200, 1097 JB Amsterdam, Niederlande, als mögliche verantwortliche Gesellschaften – abhängig vom jeweiligen Verarbeitungskontext.</p><p>Der von onepercent bereitgestellte Seitencode setzt keine Cookies, lädt keine Werbe- oder Analyse-SDKs und erstellt keine eigenen Zugriffsprotokolle. Laut GitHub wird beim Besuch einer GitHub-Pages-Website die IP-Adresse unabhängig von einer Anmeldung zu Sicherheitszwecken protokolliert und gespeichert. GitHub kann weitere technisch notwendige Verbindungs- und Nutzungsdaten nach seinen Bedingungen verarbeiten. Eine Verarbeitung in den USA und anderen Ländern ist möglich.</p><p>GitHub veröffentlicht keine einheitliche feste Aufbewahrungsfrist für alle dabei anfallenden Daten. Die Dauer richtet sich laut GitHub nach dem Verarbeitungszweck sowie vertraglichen und gesetzlichen Anforderungen. Weitere Einzelheiten findest du in den <a href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection">Hinweisen zur Datenerhebung bei GitHub Pages</a> und in der <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">Datenschutzerklärung von GitHub</a>.</p><p>Rechtsgrundlage für die Bereitstellung dieser Support- und Datenschutzinformationen ist unser berechtigtes Interesse an einem sicheren und zuverlässigen Informationsangebot nach Art. 6 Abs. 1 lit. f DSGVO.</p></div></section>
      <section><span class="content-index">08</span><div><h2>Deine Rechte</h2><p>Nach den anwendbaren Datenschutzgesetzen kannst du insbesondere Auskunft, Berichtigung, Löschung, Einschränkung und Datenübertragbarkeit verlangen sowie einer Verarbeitung widersprechen. Du kannst dich außerdem bei einer zuständigen Datenschutzaufsichtsbehörde beschweren.</p></div></section>
      <section><span class="content-index">09</span><div><h2>Weitere Angaben und Änderungen</h2><p>Die lokale Personalisierung ordnet dir Tipps zu, trifft aber keine ausschließlich automatisierten Entscheidungen mit rechtlicher oder ähnlich erheblicher Wirkung. Du bist nicht verpflichtet, Supportdaten bereitzustellen; ohne eine Nachricht können wir lediglich kein individuelles Anliegen beantworten.</p><p>Wir aktualisieren diese Hinweise, wenn sich Funktionen, Hosting oder rechtliche Anforderungen ändern. Die jeweils aktuelle Fassung wird auf dieser Seite veröffentlicht.</p></div></section>
    </article>`,
});

const notFoundPage = layout({
  title: "Seite nicht gefunden | onepercent",
  description: "Die angeforderte onepercent-Seite wurde nicht gefunden.",
  route: "404.html",
  depth: 0,
  currentPage: "",
  noIndex: true,
  useSitePath: true,
  content: (links) => `
${pageIntro("Fehler 404", "Diese Seite macht gerade Pause.", "Der aufgerufene Link existiert nicht oder wurde verschoben.")}
    <section class="support-cta shell" aria-labelledby="not-found-title">
      <p class="eyebrow light"><span></span>Zurück zu onepercent</p>
      <h2 id="not-found-title">Hier geht es weiter.</h2>
      <div class="actions centered">
        <a class="button button-light" href="${links.home}">Zur Startseite</a>
        <a class="button button-outline-light" href="${links.support}">Hilfe öffnen</a>
      </div>
    </section>`,
});

async function writePage(relativePath, html) {
  const outputPath = path.join(docsDirectory, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
}

async function build() {
  await rm(docsDirectory, { recursive: true, force: true });
  await mkdir(path.join(docsDirectory, "assets"), { recursive: true });

  await Promise.all([
    copyFile(path.join(sourceDirectory, "site.css"), path.join(docsDirectory, "assets", "site.css")),
    copyFile(path.join(publicDirectory, "onepercent-logo.png"), path.join(docsDirectory, "assets", "onepercent-logo.png")),
    copyFile(path.join(publicDirectory, "favicon.png"), path.join(docsDirectory, "favicon.png")),
    copyFile(path.join(publicDirectory, "og.png"), path.join(docsDirectory, "og.png")),
    writePage("index.html", homePage),
    writePage("support/index.html", supportPage),
    writePage("privacy/index.html", privacyPage),
    writePage("404.html", notFoundPage),
    writeFile(path.join(docsDirectory, ".nojekyll"), "", "utf8"),
    writeFile(
      path.join(docsDirectory, "robots.txt"),
      `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
      "utf8",
    ),
    writeFile(
      path.join(docsDirectory, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n  <url><loc>${siteUrl}/support/</loc></url>\n  <url><loc>${siteUrl}/privacy/</loc></url>\n</urlset>\n`,
      "utf8",
    ),
  ]);
}

await build();
