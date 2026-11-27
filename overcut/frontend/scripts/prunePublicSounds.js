#!/usr/bin/env node
/**
 * Public builds never ship a recorded engine bank that is riskRipped or has no declared
 * licence (AUD-C10; F1M24-CHINA §1.4 rule 6; SRS 3.3, 7.3). CRA copies public/ into build/
 * as it is, so a machine that has the banks under public/manager-assets/ would package them:
 * this removes them from the build output.
 *
 *   PUBLIC_BUILD=1 REACT_APP_PUBLIC_BUILD=true npm run build
 *   node scripts/prunePublicSounds.js [buildDir]        (default: build)
 *
 * The rule is the one of three/audio/engineSamples.js `bankLicensed` (riskRipped false and a
 * licence string); engineSamples.test.js checks both give the same list.
 */

const fs = require("fs");
const path = require("path");

const MANIFEST = path.join(__dirname, "../src/modules/overcutManager/data/manager-sounds.json");

const licensed = (bank) => Boolean(bank) && bank.riskRipped === false && typeof bank.license === "string" && bank.license.length > 0;

/** The bank files a public build must not ship, relative to the manifest's baseUrl. */
const excludedFiles = (manifest) => (manifest.banks || []).filter((bank) => !licensed(bank)).map((bank) => bank.file);

/** Remove them from `buildDir`; returns the paths removed (missing files are fine). */
const prune = (buildDir, manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"))) => {
  const base = String(manifest.baseUrl || "/manager-assets/").replace(/^\/+/, "");
  const removed = [];
  excludedFiles(manifest).forEach((file) => {
    const target = path.join(buildDir, base, file);
    if (!path.resolve(target).startsWith(path.resolve(buildDir))) return;
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
      removed.push(target);
    }
  });
  return removed;
};

module.exports = { excludedFiles, prune, licensed };

if (require.main === module) {
  const dir = path.resolve(process.argv[2] || path.join(__dirname, "../build"));
  if (!fs.existsSync(dir)) {
    console.error(`prunePublicSounds: no build directory at ${dir}`);
    process.exit(1);
  }
  const removed = prune(dir);
  console.log(`prunePublicSounds: ${removed.length} recorded bank(s) removed from ${dir}`);
}
