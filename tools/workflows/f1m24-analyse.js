export const meta = {
  name: 'f1m24-gameplay-reverse',
  description: 'Analyse an F1 Manager 24 gameplay video by topic, compare with OverCut Manager and write an implementation spec',
  phases: [
    { title: 'Analyse', detail: 'seven agents, one per topic or time range of the video' },
    { title: 'Gap', detail: 'compare findings with the OverCut Manager code' },
    { title: 'Spec', detail: 'write docs/manager/F1M24-GAMEPLAY.md' },
  ],
}

const S = 'C:/Users/hugoe/AppData/Local/Temp/claude/f96a86a4187a3fa3/ca0f17ed-6bb4-4ef9-b0f3-3638380e9349/scratchpad'
const F = `${S}/f1m`
const FF = `${S}/venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe`
const VIDEO = 'C:/Users/hugoe/Downloads/F1 Manager 24 - Ferrari is Back - Bahrain - Part 1 - 4K 60FPS PC ULTRA - No Commentary.mp4'
const REPO = 'C:/Users/hugoe/Documents/Proyectos/OverCut'
const MOD = `${REPO}/overcut/frontend/src/modules/overcutManager`

const MATERIAL = `
## Material (already prepared; the video is 2 h 04 min, 640x360, 30 fps, Bahrain 2024 weekend, player runs Ferrari)
- Video: "${VIDEO}"
- ffmpeg binary: "${FF}"  (e.g. one frame: "${FF}" -hide_banner -loglevel error -ss 3725.4 -i "<video>" -frames:v 1 out.png ;
  a burst: -ss T -t 4 -vf fps=10 burst_%03d.png ; a crop zoom: -vf "crop=200:120:440:240,scale=800:-1")
- Python with numpy/scipy/pillow: the system "python" (the scratchpad venv is blocked by Windows App Control; do not use it). Run
  your scripts from your own work folder.
- Mosaics: ${F}/mosaic/m_001.jpg … m_094.jpg. Each mosaic is a 4x4 grid read left-to-right, top-to-bottom, one tile every 5 s;
  mosaic k covers t = (k-1)*80 s … k*80 s, tile j (1..16) is at t ≈ (k-1)*80 + (j-1)*5 s.
- Single frames every 5 s: ${F}/frames5/f_00001.jpg … f_01494.jpg (frame n ≈ t = (n-1)*5 s).
- Camera cut times (scene change > 0.30), seconds, one per line: ${F}/cuts.txt
- Audio (mono 22.05 kHz wav): ${F}/audio/mono22k.wav ; per-50-ms features ${F}/audio/audio_frames.csv (t, rms_db, centroid_hz, f0_hz,
  tonality) ; candidate gear-shift events ${F}/audio/shift_events.csv (noisy: 8238 events incl. menu music,
  filter by tonality and by in-session time ranges) ; spectrograms 0-2 kHz, 2 min each:
  ${F}/audio/spectrograms/spec_NNNmin.png
- Rough timeline from a 1-per-minute overview: 0-12 min menus (team pick, car dev, sponsor, design, inbox); 12-35 min practice;
  35-53 min qualifying (Q1-Q3, session options manage/simulate); ~53-55 F1 intro animation; 55-124 min the race (start, battles,
  pit stops, strategy screens).
- The HUD text is small at 360p: zoom crops with ffmpeg (crop + scale) before reading numbers. Say when a value is unreadable.

## Rules
- Purpose: learn the gameplay STRUCTURE and BEHAVIOUR (what happens, when, in what order, how the camera/UI/sound reacts) to design
  our own version. OverCut takes only ideas and structure from F1 Manager 24: never copy its assets, sounds, textures, logos,
  icons or UI text into the repo, and do not transcribe its UI copy for reuse. Describe UI by function and layout, in your words.
- Every observation gets a timestamp (mm:ss or seconds) and a confidence (high / medium / low). Separate what you SAW from what you
  INFER. Numbers read from the screen are "observed in-game"; mark them as reference only — our calibration comes from real data
  (FIA rules, f1db, OpenF1), and note the real-world value next to it when you know it.
- Work only in your own folder ${F}/work/<your-key>/ for scratch files; write your final report as Markdown to
  ${F}/reports/<your-key>.md (Spanish, concise, with tables where useful). Do NOT edit the OverCut repo in this phase.
- Be thorough: sample the mosaics for your whole range, then open single frames / extract bursts at full 30 fps where something
  happens (a pit exit, an overtake, a camera switch, a safety car, a crash). Prefer measuring (frame counts, timestamps) to guessing.
`

const FINDINGS = {
  type: 'object',
  properties: {
    report_path: { type: 'string' },
    summary: { type: 'string', description: '5-10 lines, Spanish' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          area: { type: 'string' },
          observation: { type: 'string' },
          timestamps: { type: 'array', items: { type: 'string' } },
          measured: { type: 'string', description: 'numbers observed or measured, with units, or empty' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          implementation_hint: { type: 'string' },
        },
        required: ['area', 'observation', 'timestamps', 'confidence', 'implementation_hint'],
      },
    },
    not_seen: { type: 'array', items: { type: 'string' }, description: 'requested topics that never appear in your range' },
  },
  required: ['report_path', 'summary', 'findings', 'not_seen'],
}

const TOPICS = [
  {
    key: 'ui-menus',
    label: 'UI · menus and pre-weekend',
    prompt: `Your key: ui-menus. Range 00:00-13:00, plus every pre-session or post-session screen anywhere in the video (session briefing,
pit options/car setup, run plan, qualifying preparation, race strategy screen before the start, results screens, standings).
Map the interface: every screen, its layout (zones, panels, lists, tabs), the buttons and controls and what each does, navigation
between screens, confirmation flows, how numbers are shown (bars, stars, deltas), notifications. Produce a screen inventory table
(screen, when, purpose, main controls, layout sketch in ASCII) and the navigation graph.`,
  },
  {
    key: 'practice-quali',
    label: 'Practice and qualifying gameplay',
    prompt: `Your key: practice-quali. Range 12:00-55:00. The live session view and its HUD: timing tower modes, driver panels, run plans,
sending a car out, the garage-to-pit-lane exit sequence (camera, how long from "go" to pit exit, pit-lane speed and limiter, the
merge onto track), out lap / push lap / in lap behaviour, setup feedback and confidence, tyre sets, session clock and how time
compression is used, session options (manage vs simulate), Q1/Q2/Q3 knockout handling and track evolution. Measure pit-lane
traversal times (frames between pit entry and box, box to pit exit) and lap times you can read.`,
  },
  {
    key: 'race-1',
    label: 'Race part 1 (start to mid)',
    prompt: `Your key: race-1. Range 53:00-90:00. The race: intro and formation lap, grid, start lights and launch, first-lap behaviour,
racing line, cornering (how cars slow for corners, braking points, apex, exits), battles: overtakes and defences (how a pass
unfolds over time, side-by-side, DRS, slipstream, switchback), cars never overlapping each other (do they detect and avoid each
other? lateral moves?), mistakes (lock-ups, off-tracks), damage, retirements, flags, safety car / VSC if any (speed, bunching,
restart), the race HUD (tower modes, driver panels: pace, fuel, ERS, tyres, temperatures, delta), and the player's commands and
their visible effects. Also note ERS/battery, fuel and tyre management as shown in the panels.`,
  },
  {
    key: 'race-2',
    label: 'Race part 2 (mid to flag)',
    prompt: `Your key: race-2. Range 90:00-124:32. Same as the first half of the race: battles, overtakes, defences, mistakes, damage,
safety car / VSC (and speed under them, delta, bunching, pit under SC), but focus also on pit stops end to end (call, pit entry,
limiter, lane speed, box, crew stages and stationary time, release, exit and merge), strategy changes, tyre wear and fuel and ERS
management over the stint, the finish (chequered flag, cool-down lap, results). Measure stop and lane times by frame counting.`,
  },
  {
    key: 'cameras',
    label: 'Cameras and TV director',
    prompt: `Your key: cameras. Whole video, race 55:00-124:32 in depth. Use ${F}/cuts.txt: compute shot-length statistics per session,
classify every race shot by camera type (onboard T-cam, onboard cockpit/halo, rear onboard, chase, trackside TV fixed/pan,
helicopter/high, pit lane, garage, map/3D overview…) by opening the frame just after each cut, and work out the director's rules:
what triggers a cut (a battle, an overtake, a pit stop, the player's car, a corner), how long each type is held, whether trackside
cameras pan to follow a car and from where they hand over to the next camera, camera placement around the lap. Describe onboard
camera geometry (height, offset, field of view feel, how much of the car is visible). Output a table of shot types with median and
range of durations and a state machine for the director.`,
  },
  {
    key: 'audio',
    label: 'Sound: engines, shifts, ambience',
    prompt: `Your key: audio. Whole video, race in depth. Use the audio features, shift events and spectrograms (look at them as images), and
compute more with numpy where useful (e.g. per-shot f0 traces, shift intervals, rpm-shaped sweeps, doppler on fly-bys, pit-lane
limiter tone, ambience layers: crowd, wind, tyres, pit guns, radio beeps, menu music vs in-session). For each camera type (onboard
vs trackside) describe the mix. Report: engine fundamental range in race (Hz) and what rpm that implies for a 6-cylinder 4-stroke
(f = rpm/60*3), shift spacing on a straight, upshift drop ratio per gear, downshift blips, limiter, how the sound changes in the
pit lane and under safety car, layering and spatialisation. Mark clearly which measurements are reliable. Never export audio
clips to the repo.`,
  },
  {
    key: 'dynamics',
    label: 'Car dynamics, speeds, SC/VSC',
    prompt: `Your key: dynamics. Whole race 55:00-124:32 plus practice pit exits. Estimate speeds quantitatively: use on-screen readouts
(onboard steering-wheel display, any speed or delta shown; zoom crops), timing between two cuts of the same car, lap times from the
tower, and known Bahrain geometry (5.412 km; main straight ~1.1 km; pit lane limit 80 km/h in 2024). Describe corner speeds by
corner (T1, T4, T10 slow hairpins vs fast T5-T7, T12), braking zones, the racing line used (kerb use, apex), how cars position
when two are close (gap kept, never overlapping, lateral offset when alongside), behaviour under safety car or VSC if present
(speed, gaps, delta), and errors/damage visuals. Give a table of corner: entry/min/exit speed estimates with method and
confidence.`,
  },
]

phase('Analyse')
const analyses = await parallel(
  TOPICS.map((topic) => () =>
    agent(`${topic.prompt}\n${MATERIAL}\nReturn the findings object; the Markdown report goes to ${F}/reports/${topic.key}.md.`, {
      label: topic.label,
      phase: 'Analyse',
      schema: FINDINGS,
    }).then((result) => (result ? { key: topic.key, ...result } : null)),
  ),
)
const done = analyses.filter(Boolean)
const missing = TOPICS.filter((topic) => !done.find((item) => item.key === topic.key)).map((topic) => topic.key)
if (missing.length) log(`Analysis missing for: ${missing.join(', ')}`)
log(`${done.reduce((n, item) => n + item.findings.length, 0)} findings from ${done.length} analysts`)

const reportList = done.map((item) => `- ${item.key}: ${item.report_path}`).join('\n')
const digest = JSON.stringify(done.map((item) => ({ key: item.key, summary: item.summary, findings: item.findings, not_seen: item.not_seen })))

const GAP = {
  type: 'object',
  properties: {
    report_path: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'short slug' },
          area: { type: 'string' },
          observed: { type: 'string', description: 'what the reference game does (with timestamps)' },
          ours_now: { type: 'string', description: 'what OverCut does today, with file:line' },
          proposal: { type: 'string', description: 'what to build, how, where' },
          requirements: { type: 'array', items: { type: 'string' }, description: 'SRS ids (RF-xxx-nn, RNF-nn) touched' },
          files: { type: 'array', items: { type: 'string' } },
          data_source: { type: 'string', description: 'real-world source for calibration (FIA, f1db, OpenF1…) or "behaviour only"' },
          effort: { type: 'string', enum: ['S', 'M', 'L', 'XL'] },
          priority: { type: 'string', enum: ['P1', 'P2', 'P3'] },
        },
        required: ['id', 'area', 'observed', 'ours_now', 'proposal', 'requirements', 'files', 'data_source', 'effort', 'priority'],
      },
    },
  },
  required: ['report_path', 'items'],
}

const GAPS = [
  {
    key: 'gap-sim',
    label: 'Gap · simulation and race control',
    scope: `simulation and race logic: pit lane (entry, limiter, lane speed, box, stages, release, merge), speeds on track and in corners,
racing line, overtakes/defences/duels, mutual detection and no overlap, battery/ERS, tyres, fuel, driving style, mistakes, damage,
safety car and VSC (speeds, deltas, bunching, restarts), session flow (practice run plans, qualifying knockout), race start.
Code: ${MOD}/engine/ (sim/, race.js, rules.js, sessionSim/, incidents.js, energy.js, weather/, drivers/) and ${MOD}/data/balance/,
plus docs/manager/SIM-FISICA.md.`,
  },
  {
    key: 'gap-view',
    label: 'Gap · cameras, sound and interface',
    scope: `presentation: TV director and camera types/angles/hand-overs, onboard geometry, engine and gearshift sound, ambience and mix,
pit lane and SC sound, the live HUD (tower, driver panels, buttons, playback), pre/post-session screens and menus.
Code: ${MOD}/three/ (cameras.js, Race3D.js, audio/), ${MOD}/components/ (LiveRace.js, SessionLive.js, Broadcast.js, Weekend.js,
styles/weekend.css, Hub.js…), data/balance/audio.json, docs/manager/DESIGN.md.`,
  },
]

phase('Gap')
const gaps = (
  await parallel(
    GAPS.map((gap) => () =>
      agent(
        `Your key: ${gap.key}. Compare what the reference game does (from the analysts' reports below) with what OverCut Manager does
today, for: ${gap.scope}

Read every analyst report in full:
${reportList}
Their structured findings (JSON): ${digest}

Then read the OverCut code for your scope and list, item by item, what is missing or different, and a concrete proposal to build it
our way (file names, data in data/balance/ with schema, never balance values in code — RNF-07; historical coherence per era — SRS §6;
from F1 Manager 24 only ideas and structure). Cite the SRS requirement ids each item touches. Prioritise: P1 = the user sees it in
every live session (sound, cameras, pit exit, overtakes, SC/VSC, no overlap, HUD), P2 = depth, P3 = polish. Do not edit the repo.
Write a Markdown report (Spanish) to ${F}/reports/${gap.key}.md and return the items.`,
        { label: gap.label, phase: 'Gap', schema: GAP },
      ).then((result) => (result ? { key: gap.key, ...result } : null)),
    ),
  )
).filter(Boolean)
log(`${gaps.reduce((n, gap) => n + gap.items.length, 0)} backlog items`)

phase('Spec')
const spec = await agent(
  `Write the implementation specification for OverCut Manager from this analysis of an F1 Manager 24 gameplay video, in Spanish, at
${REPO}/docs/manager/F1M24-GAMEPLAY.md (create it; this is the only repo file you may write).

Inputs — read all of them in full:
${reportList}
${gaps.map((gap) => `- ${gap.key}: ${gap.report_path}`).join('\n')}
Backlog items (JSON): ${JSON.stringify(gaps.flatMap((gap) => gap.items))}

Structure:
1. Alcance y método (vídeo analizado, material extraído, límites: 360p, qué no aparece; regla: solo ideas y estructura, ningún
   asset, sonido, texto ni valor de ajuste copiado; los números vistos en el juego son referencia y la calibración sale de FIA,
   f1db, OpenF1).
2. Una sección por área (sonido ambiente; salida y velocidad del pit lane; velocidad en pista y paso por curva; motor, marchas y
   su sonido; cámaras onboard y TV y el director; trazada ideal; adelantamientos y defensas; batería, neumáticos, combustible,
   pilotaje; detección mutua y no solapamiento; daños y errores; safety car y VSC con sus velocidades; interfaces y botones):
   lo observado (con marcas de tiempo y confianza), lo medido, lo que hace OverCut hoy, la propuesta.
3. Backlog priorizado (tabla: id, prioridad, esfuerzo, requisitos SRS, ficheros, fuente de calibración), agrupado en paquetes de
   trabajo que se puedan implementar en paralelo sin tocar los mismos ficheros.
4. Enmiendas propuestas al SRS si algo lo contradice (no las apliques).
Keep it dense and useful for implementation. Return a 10-line summary in Spanish and the list of work packages.`,
  { label: 'Spec · F1M24-GAMEPLAY.md', phase: 'Spec' },
)

return { analysts: done.map((item) => ({ key: item.key, report: item.report_path, findings: item.findings.length, not_seen: item.not_seen })), missing, gaps: gaps.map((gap) => ({ key: gap.key, report: gap.report_path, items: gap.items.length })), spec }
