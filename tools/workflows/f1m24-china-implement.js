export const meta = {
  name: 'f1m24-china-implement-w3',
  description: 'Implement the F1M24-CHINA work packages wave by wave (one worktree per package), merge, test and validate 7.2 each wave',
  phases: [
    { title: 'Wave 3' }, { title: 'Wave 4' }, { title: 'Wave 5' },
    { title: 'Verify', detail: 'independent end-to-end check of the integrated branch' },
  ],
}

const REPO = 'C:/Users/hugoe/Documents/Proyectos/OverCut'
const FRONT = `${REPO}/overcut/frontend`
const SPEC = 'docs/manager/F1M24-CHINA.md'
const PREV = 'docs/manager/F1M24-GAMEPLAY.md'
const ATTR = 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'

const WAVES = [
  ['SIM-C3', 'WX-C3', 'AUD-C-3', 'CAM-C3', 'LOOK-C3'],
  ['SIM-C4', 'AUD-C-4', 'LOOK-C4'],
  ['CAM-C4', 'HUD-C3'],
]
// Waves that touch the engine must pass validation 7.2 (spec §1.4 rule 8).
// Waves 1 and 2 are merged (wave 2 merged and its suite fixed on 2026-11-28). Wave index 2 = Wave 3.
const OFFSET = 2
const ENGINE_WAVES = [2, 3]

// Open items from wave 2 handed to the lane that owns the file in the next waves.
const NOTES = {
  'SIM-C3': 'Also (handed over from PIT-C2, wave 2): engine/sim/pitLane.js and pitStop.js already compute pitStage {name, t} and the pitExitLine moment, but engine/sim/stepRace.js does not publish them: put pitStage in each car pose of the snapshot and emit the pitExitLine event (§3.3 PIT-C2 row, prerequisite of AUD-C7). Also check duelGeometry.test.js "passes per lap within ±10 % of the step mode without it" still passes (straightPass.chanceScale was recalibrated after the wave-2 merge).',
  'SIM-C4': 'Also (handed over from PIT-C2, wave 2): engine/race.js should use the box queue of pitLane.js (queue only with the box occupied, GS-09) if it does not already; check with grep boxQueue.',
  'AUD-C-3': 'pitStage / pitExitLine may only appear once SIM-C3 (same wave) publishes them: code against them defensively and test with synthetic snapshots.',
}

const RESULT = {
  type: 'object',
  properties: {
    branch: { type: 'string' },
    commit: { type: 'string', description: 'sha of your last commit, or empty if nothing committed' },
    status: { type: 'string', enum: ['done', 'partial', 'blocked'] },
    summary: { type: 'string', description: 'Spanish, what was built' },
    files: { type: 'array', items: { type: 'string' } },
    tests: { type: 'string', description: 'which tests ran and their result (counts)' },
    pending: { type: 'array', items: { type: 'string' }, description: 'what is left, values marked pending, deviations from the spec, acceptance checks not run (e.g. Playwright)' },
  },
  required: ['branch', 'commit', 'status', 'summary', 'files', 'tests', 'pending'],
}

const MERGE = {
  type: 'object',
  properties: {
    merged: { type: 'array', items: { type: 'string' } },
    reverted_or_skipped: { type: 'array', items: { type: 'string' } },
    head: { type: 'string' },
    tests: { type: 'string' },
    validation: { type: 'string', description: 'validation 7.2 numbers (champions x/38, Spearman) or "not run"' },
    notes: { type: 'string' },
  },
  required: ['merged', 'reverted_or_skipped', 'head', 'tests', 'validation', 'notes'],
}

const packagePrompt = (wp, wave) => `You implement work package ${wp} (wave ${wave + 1}) of OverCut Manager's ${SPEC}.

You are in your own git worktree of the OverCut repo. Steps:
1. Start from the integrated branch: if \`git branch --list wp/${wp}\` exists, \`git checkout wp/${wp}\` and continue from it;
   otherwise \`git checkout -B wp/${wp} feature/overcut-manager\` (the worktree may come from an old commit — always branch from
   feature/overcut-manager). Check with \`git log --oneline -3\` that you see the merges of the previous waves (waves 1 and 2 are merged: look for "merge: LOOK-C2").
2. Tests need node_modules: create a junction from your worktree's overcut/frontend to the main one, in PowerShell
   \`New-Item -ItemType Junction -Path overcut\\frontend\\node_modules -Target "${FRONT}/node_modules"\` (never commit it).
3. Read in ${SPEC}: §1.3 (measurement limits), §1.4 (rules, incl. the five inherited from ${PREV} §1.4), §1.5 (unification
   decisions — single source of each key), §1.6 (what NOT to copy from the game), the §2 areas of your backlog ids, the §3.1
   rows of your ids (acceptance tests), §3.2 (lanes: you may write ONLY your lane's files and the files your §3.3 row lists,
   plus new files your package creates; read the "puntos de contención" and "contratos que fija la ola 1") and your row in §3.3.
   Also ${PREV} §1.7 for the existing snapshot/event contracts. The scratchpad reports cited as cn/ no longer exist; the spec
   is the record. Read the existing code you touch before changing it; extend, do not rewrite.
4. Implement the package fully: code, data in data/balance/*.json with JSON schema (no balance values in code — RNF-07), era
   coherence (SRS §6: nothing outside its era), determinism by seed (RF-SIM-15/RNF-05; in the view use seedOf and the race
   clock, never Math.random or wall clock), texts ES and EN via the existing i18n. Calibrate from real sources the spec names
   (FIA regulations, f1db in overcut/src/main/resources/scripts/, the public OpenF1 API api.openf1.org — no personal data in
   requests — Pirelli, NOAA solar formulas). Values you cannot source go in with status "pending" and a note, never invented
   as fact. From F1 Manager 24 only ideas and structure: no assets, sounds, UI text or tuning values copied. Sound banks with
   riskRipped or license null never default on. Contracts that other lanes produce later: code against them defensively
   (absent → current behaviour). If a change would contradict the SRS, keep to the spec's proposed amendments (§4) and say so.
5. Tests: add the unit tests your §3.1/§3.3 acceptance rows ask for. Playwright acceptance checks are optional: write them if
   cheap, but do not block on running a browser — list them in pending. Run the Manager suite from overcut/frontend:
   \`CI=true npx react-scripts test --watchAll=false --maxWorkers=2 --testPathPattern overcutManager\`.
   Do not loosen existing tolerances (equivalence SRS §4.2 in engine/sim/equivalence.test.js, golden files) — if a golden must
   change on purpose, regenerate it and justify it in the commit. All green before you commit; if something outside your
   package was already red, say so. If your package changes engine behaviour (SIM/PIT/PT/WX lanes), run a quick validation
   \`node scripts/validateSeasons.js --runs 150 --out <a scratch dir outside the repo>\` and report the numbers (target: no
   drop vs 34/38 champions, Spearman 0.918; the merge step runs --full).
6. Commit on wp/${wp} (one or a few commits). Commit as soon as your package tests pass, BEFORE the long full-suite run, and
   amend/add commits after; never return with uncommitted work (an earlier package lost its merge that way). Message in Spanish: what and why, the SRS ids (RF-…, RNF-…, criterio 7.2) and the
   backlog ids, ending with the line "${ATTR}". Do not push, do not merge, NEVER merge into or commit on feature/overcut-manager yourself (a wave-2 package did and broke the protocol): the merge step does it.
${NOTES[wp] ? `
Extra for this package: ${NOTES[wp]}
` : ''}Return the result object.`

const mergePrompt = (wave, results, validate) => `You integrate wave ${wave + 1} of the F1M24-CHINA plan (${SPEC} §3.3) into the main
OverCut repo at ${REPO} on branch feature/overcut-manager (it is checked out there; a dev server may watch it, that is fine).

Package results (JSON): ${JSON.stringify(results)}

1. \`git status\`: leave untracked/unrelated changes alone (pycache deletions, overcutPredictions/*, .claude/ are not ours).
2. Merge each package branch (\`git merge --no-ff wp/<id> -m "merge: <id> …"\` + a blank line + "${ATTR}"). Lanes own disjoint
   files (§3.2), so conflicts should be rare; resolve keeping both intents. Before skipping a package with no commit, check its worktree
   (\`git worktree list\`, then \`git -C <path> status\`): if it has uncommitted work, run its tests there and commit it on its branch
   (Spanish message with its ids and the attribution line), then merge it.
3. Run the full Manager suite from overcut/frontend:
   \`CI=true npx react-scripts test --watchAll=false --testPathPattern overcutManager\`. If something fails, find the package and
   fix it minimally in a follow-up commit (Spanish message, SRS ids, attribution line). If it cannot be fixed in reasonable
   time, revert its merge (\`git revert -m 1 <merge>\`) and report it. Do not loosen tolerances (equivalence §4.2, goldens).
4. \`npx eslint src/modules/overcutManager --max-warnings=9999\`: fix errors (not warnings) introduced by this wave.
${validate ? `5. This wave touches the engine: run \`node scripts/validateSeasons.js --full --out <scratch dir outside the repo>\` from
   overcut/frontend (~30 min; run it in the background and wait). Gate (spec §1.4 rule 8): ≥ 34/38 champions and Spearman ≥ 0.918${wave === 2 ? '; this wave (SIM-C3) TARGETS ≥ 35/38 and ≥ 0.92 — if below target but above the gate, try a calibration fix inside the SIM data files and re-run, and report honestly' : ''}.
   If it falls below the gate, find the responsible package (revert candidates one by one on a scratch branch and re-run with
   --runs 200 to bisect), fix the calibration or revert that merge, and re-run --full until the gate passes. This full run also covers waves 1 and 2. When it passes,
   copy report.json/report.md into docs/manager/validation/ only if it is at least as good as the one there, and commit.` : '5. (No engine change in this wave: no validation run needed.)'}
6. Remove this wave's wp/* worktrees that are merged (\`git worktree list\`; \`git worktree remove --force <path>\` only for those),
   keep the branches. Do not push.
Return the merge object (head = sha after your last commit).`

const runPackage = async (wp, wave, title) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await agent(packagePrompt(wp, wave), { label: attempt === 1 ? wp : `${wp} (retry ${attempt})`, phase: title, schema: RESULT, isolation: 'worktree' })
      if (r) return { wp, ...r }
    } catch (error) {
      log(`${wp}: spawn failed (attempt ${attempt}): ${String(error && error.message ? error.message : error).slice(0, 160)}`)
    }
  }
  return { wp, branch: `wp/${wp}`, status: 'blocked', commit: '', summary: 'agent could not start after 3 attempts', files: [], tests: '', pending: [] }
}

const all = []
for (let i = 0; i < WAVES.length; i++) {
  const w = i + OFFSET
  const title = `Wave ${w + 1}`
  phase(title)
  const first = await parallel(WAVES[i].map((wp) => () => runPackage(wp, w, title)))
  const results = []
  for (let k = 0; k < WAVES[i].length; k++) results.push(first[k] || (await runPackage(WAVES[i][k], w, title)))
  const blocked = results.filter((r) => r.status !== 'done').map((r) => `${r.wp}:${r.status}`)
  if (blocked.length) log(`${title}: not fully done → ${blocked.join(', ')}`)
  const merge = await agent(mergePrompt(w, results, ENGINE_WAVES.includes(w)), { label: `${title} · merge + tests + 7.2`, phase: title, schema: MERGE })
  log(`${title}: merged ${merge ? merge.merged.length : 0}, skipped ${merge ? merge.reverted_or_skipped.join(', ') || 'none' : '?'}; 7.2: ${merge ? merge.validation : '?'}`)
  all.push({ wave: w + 1, results, merge })
}

phase('Verify')
const verify = await agent(
  `Independent check of the integrated branch feature/overcut-manager in ${REPO} after the F1M24-CHINA plan (${SPEC}).
Do not trust the implementers. Wave results: ${JSON.stringify(all.map((w) => ({ wave: w.wave, merge: w.merge, packages: w.results.map((r) => ({ wp: r.wp, status: r.status, pending: r.pending })) })))}
1) Run the full Manager suite and \`npm run build\` in overcut/frontend. 2) Check the last validation report numbers (docs/manager/validation/
and the wave merges) and run the equivalence test. 3) For each backlog id in §3.1 (GS-01..15, VIEW-01..18, AUD-C1..C12) check it is
really implemented (read the code) and whether its unit acceptance test exists; list missing, partial or contradicting items, and
anything that breaks SRS §6 (rule outside its era), RNF-07 (balance value in code) or RNF-05 (Math.random/wall clock in the view).
4) Fix small breakages you find (commit with SRS ids and "${ATTR}"); list the rest. 5) Add a "§5 Estado" section to ${SPEC} with
per-package status, open items and acceptance checks not yet run (Playwright), and add one line to CLAUDE.md under the Manager
bullets summarising this work (date 2026-11-28, validation numbers); commit. Do not push.
Return a Spanish report: tests, build, validation numbers, per-package status, open issues.`,
  { label: 'Verify · end to end', phase: 'Verify' },
)

return { waves: all.map((w) => ({ wave: w.wave, packages: w.results.map((r) => ({ wp: r.wp, status: r.status, pending: r.pending })), merge: w.merge })), verify }
