export const meta = {
  name: 'f1m24-implement-waves',
  description: 'Implement the F1M24-GAMEPLAY work packages wave by wave (one worktree per package), merge and test each wave',
  phases: [
    { title: 'Wave 1' }, { title: 'Wave 2' }, { title: 'Wave 3' }, { title: 'Wave 4' },
    { title: 'Wave 5' }, { title: 'Wave 6' }, { title: 'Wave 7' }, { title: 'Wave 8' },
    { title: 'Verify', detail: 'independent end-to-end check of the integrated branch' },
  ],
}

const REPO = 'C:/Users/hugoe/Documents/Proyectos/OverCut'
const FRONT = `${REPO}/overcut/frontend`
const SPEC = 'docs/manager/F1M24-GAMEPLAY.md'
const ATTR = 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'

const WAVES = [
  ['SIM-1', 'PIT-1', 'SES-1', 'PT-1', 'AUD-1', 'CAM-1', 'HUD-1', 'WKD-1'],
  ['SIM-2', 'PIT-2', 'SES-2', 'PT-2', 'AUD-2', 'CAM-2', 'HUD-2', 'WKD-2'],
  ['SIM-3', 'SES-3', 'PT-3', 'AUD-3', 'CAM-3', 'HUD-3'],
  ['SIM-4', 'SES-4', 'AUD-4', 'CAM-4', 'HUD-4'],
  ['SIM-5', 'AUD-5', 'CAM-5', 'HUD-5'],
  ['SIM-6', 'HUD-6', 'WKD-6'],
  ['SIM-7', 'HUD-7'],
  ['SIM-8', 'SES-8'],
]

const RESULT = {
  type: 'object',
  properties: {
    branch: { type: 'string' },
    commit: { type: 'string', description: 'sha of your last commit, or empty if nothing committed' },
    status: { type: 'string', enum: ['done', 'partial', 'blocked'] },
    summary: { type: 'string', description: 'Spanish, what was built' },
    files: { type: 'array', items: { type: 'string' } },
    tests: { type: 'string', description: 'which tests ran and their result (counts)' },
    pending: { type: 'array', items: { type: 'string' }, description: 'what is left, values marked pending, deviations from the spec' },
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
    notes: { type: 'string' },
  },
  required: ['merged', 'reverted_or_skipped', 'head', 'tests', 'notes'],
}

// Wave-1 packages that already ran keep their original first step so the resume cache still matches.
const RAN = ['SIM-1', 'PIT-1', 'SES-1', 'PT-1', 'AUD-1']
const startStep = (wp) =>
  RAN.includes(wp)
    ? `1. First command: \`git checkout -b wp/${wp}\` (if the branch exists, \`git checkout wp/${wp}\` and continue from it).`
    : `1. First make sure you start from the integrated branch: if \`git branch --list wp/${wp}\` exists, \`git checkout wp/${wp}\` and
   continue from it; otherwise run \`git checkout -B wp/${wp} feature/overcut-manager\` (the worktree may have been created from
   an old commit — always branch from feature/overcut-manager). Check with \`git log --oneline -3\` that you see the merges of the
   previous waves.`

const packagePrompt = (wp, wave) => `You implement work package ${wp} (wave ${wave + 1}) of OverCut Manager's ${SPEC}.

You are in your own git worktree of the OverCut repo (a copy of branch feature/overcut-manager). Steps:
${startStep(wp)}
2. Tests need node_modules: create a junction from your worktree's overcut/frontend to the main one, e.g. in PowerShell
   \`New-Item -ItemType Junction -Path overcut\\frontend\\node_modules -Target "${FRONT}/node_modules"\` (never commit it;
   it is git-ignored). Same for nothing else.
3. Read in ${SPEC}: §1.4 (rules), §1.5 (unification decisions), §1.6 (what not to copy), §1.7 (snapshot and event contracts),
   the §2 areas of your backlog ids, the §3.1 rows of your ids, §3.2 (file ownership — your lane may write ONLY its files,
   plus new files your package creates) and your row in §3.3. The source reports are in docs/manager/f1m24-analysis/.
   Read the existing code you touch before changing it; extend, do not rewrite.
4. Implement the package fully: code, data in data/balance/*.json with JSON schema (no balance values in code — RNF-07),
   era coherence (SRS §6: nothing outside its era), determinism by seed (RF-SIM-15/RNF-05), texts in ES and EN with t().
   Calibrate from real sources named in the spec (FIA regulations, f1db in overcut/src/main/resources/scripts/, OpenF1 public
   API api.openf1.org — no personal data in requests). Values you cannot source go in as "pending" with a note, never invented
   as fact. From F1 Manager 24 only ideas and structure: no assets, sounds, UI text or tuning values copied.
   Contracts in §1.7 that other lanes produce later: code against them defensively (absent → current behaviour).
5. Tests: add the tests your §3.3 row asks for, then run the Manager suite from overcut/frontend:
   \`CI=true npx react-scripts test --watchAll=false --maxWorkers=2 --testPathPattern overcutManager\`.
   Do not loosen existing tolerances (equivalence SRS §4.2, golden files) — if a golden must change on purpose, say why.
   All green before you commit; if something outside your package was already red, say so.
6. Commit on wp/${wp} (one or a few commits). Message in Spanish: what and why, the SRS ids, and end with the line
   "${ATTR}". Do not push, do not merge, do not touch feature/overcut-manager.
Return the result object.`

const mergePrompt = (wave, results) => `You integrate wave ${wave + 1} of the F1M24-GAMEPLAY plan into the main OverCut repo at ${REPO} on branch
feature/overcut-manager (it is checked out there; the user's dev server watches it, that is fine).

Package results (JSON): ${JSON.stringify(results)}

1. \`git status\`: leave untracked/unrelated changes alone (pycache deletions, overcutPredictions/*, .claude/ are not ours).
2. Merge each package branch with commits (\`git merge --no-ff wp/<id> -m "merge: <id> …"\` + the line "${ATTR}"). Lanes own
   disjoint files (${SPEC} §3.2), so conflicts should be rare; resolve them by keeping both intents. Skip packages with no commit.
3. Run the full Manager suite from overcut/frontend:
   \`CI=true npx react-scripts test --watchAll=false --testPathPattern overcutManager\`. If something fails, find which package caused
   it and fix it minimally in a follow-up commit (Spanish message, SRS ids, attribution line). If a package cannot be fixed in
   reasonable time, revert its merge (\`git revert -m 1 <merge>\`) and report it. Do not loosen tolerances.
4. Also run \`npx eslint src/modules/overcutManager --max-warnings=9999\` and fix errors (not warnings) you introduced.
5. Remove the wave's worktrees that are merged (\`git worktree list\`; \`git worktree remove --force <path>\` only for wp/* worktrees
   of this wave), keep the branches.
Return the merge object (head = sha after your last commit).`

// A worktree can fail to be created when several start at once: retry, one at a time.
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
for (let wave = 0; wave < WAVES.length; wave++) {
  const title = `Wave ${wave + 1}`
  phase(title)
  const first = await parallel(WAVES[wave].map((wp) => () => runPackage(wp, wave, title)))
  const results = []
  for (let i = 0; i < WAVES[wave].length; i++) {
    // Belt and braces: anything parallel() dropped runs again on its own.
    results.push(first[i] || (await runPackage(WAVES[wave][i], wave, title)))
  }
  const blocked = results.filter((r) => r.status !== 'done').map((r) => `${r.wp}:${r.status}`)
  if (blocked.length) log(`${title}: not fully done → ${blocked.join(', ')}`)
  const merge = await agent(mergePrompt(wave, results), { label: `${title} · merge + tests`, phase: title, schema: MERGE })
  log(`${title}: merged ${merge ? merge.merged.length : 0}, skipped ${merge ? merge.reverted_or_skipped.join(', ') || 'none' : '?'}`)
  all.push({ wave: wave + 1, results, merge })
}

phase('Verify')
const verify = await agent(
  `Independent check of the integrated branch feature/overcut-manager in ${REPO} after the F1M24-GAMEPLAY plan (${SPEC}).
Do not trust the implementers. 1) Run the full Manager suite and \`npm run build\` in overcut/frontend. 2) Run the season validation
\`node scripts/validateSeasons.js\` (see its header for a quick option; compare with docs/manager/validation/: 35/38, Spearman 0.93)
and the equivalence test. 3) For each backlog id in §3.1 check that it is really implemented (read the code), list the ones that
are missing, partial or contradict the spec, and anything that breaks SRS §6 (rule outside its era) or RNF-07 (balance value in code).
4) Fix small breakages you find (commit with SRS ids and "${ATTR}"); list the rest. 5) Update the status section of ${SPEC}
(add "§5 Estado" with per-package status) and add one line to CLAUDE.md under the Manager bullets describing this work; commit.
Return a Spanish report: tests, build, validation numbers, per-package status, open issues.`,
  { label: 'Verify · end to end', phase: 'Verify' },
)

return { waves: all.map((w) => ({ wave: w.wave, packages: w.results.map((r) => ({ wp: r.wp, status: r.status, pending: r.pending })), merge: w.merge })), verify }
