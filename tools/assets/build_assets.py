"""Pipeline offline de assets de OverCut Manager (ADR-001, SRS 4.3, fase 2).

Uso (desde la raíz del repo OverCut o desde tools/assets):
  python tools/assets/build_assets.py [cars] [heroes] [circuits] [splines] [manifest] [--only <id>] [--jobs 3] [--force]

Sin etapas, ejecuta las tres. Cada paso se salta si su salida ya existe y es más nueva que su entrada
(--force lo repite). Necesita: gh (GitHub CLI), Blender 5.2 (BLENDER_BIN), Node con las dependencias de
tools/assets (npm install) y toktx de KTX-Software (KTX_BIN o tools/assets/.cache/ktx/bin).

Etapas:
  cars      descarga los GLB de las temporadas configuradas, normaliza y genera LOD con Blender, comprime con
            gltf-transform (Meshopt + KTX2) y renderiza la miniatura del showroom.
  circuits  extrae la spline del asfalto, la alinea (sentido f1db, meta, reflexión), prepara el GLB del
            circuito y lo comprime, saca la calle de boxes, mide la anchura y calcula la trazada (racing_line.mjs);
            deja vistas cenitales de revisión en .cache/preview/.
  heroes    solo el nivel hero del showroom (texturas de hasta 2048 px sobre la geometría del LOD0), sin Blender;
            la etapa cars ya lo incluye.
  splines   solo data/splines.json (motor): bucle, calle de boxes y datos de pista (anchura, trazada, curvatura,
            marcas del pit lane; docs/manager/SIM-FISICA.md WP1), sin tocar el manifiesto.
  manifest  escribe manager-assets.json (SRS 4.3) con licencia y autor sacados de cada GLB, el fichero
            compacto de splines que lee el motor y copia las splines completas junto a los GLB.

Los binarios generados van a overcut/frontend/public/manager-assets/ (ignorado por git; se sirven con nginx).
El manifiesto y las splines del motor sí se versionan.
"""

import concurrent.futures
import hashlib
import json
import os
import shutil
import struct
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
CACHE = HERE / ".cache"
RAW = CACHE / "raw"
OUT = CACHE / "out"
CONFIG = json.loads((HERE / "assets.config.json").read_text(encoding="utf-8"))
CURATED = ROOT / "overcut/frontend/src/modules/overcutManager/data/seasons/curated/car-assets.json"
PUBLIC = ROOT / CONFIG["publicDir"]
BLENDER = os.environ.get("BLENDER_BIN", r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe")
KTX_BIN = os.environ.get("KTX_BIN", str(CACHE / "ktx" / "bin"))
GEO = CACHE / "geo" / "f1-circuits.geojson"
NPX = "npx.cmd" if os.name == "nt" else "npx"
PIPELINE_VERSION = 1


def log(*parts):
    print(time.strftime("%H:%M:%S"), *parts, flush=True)


def newer(target, *sources):
    target = Path(target)
    return target.exists() and all(target.stat().st_mtime >= Path(s).stat().st_mtime for s in sources if Path(s).exists())


def run(cmd, logfile=None):
    env = dict(os.environ)
    env["PATH"] = KTX_BIN + os.pathsep + env.get("PATH", "")
    with open(logfile, "w", encoding="utf-8", errors="replace") if logfile else open(os.devnull, "w") as handle:
        result = subprocess.run(cmd, stdout=handle, stderr=subprocess.STDOUT, env=env, cwd=HERE)
    if result.returncode != 0:
        raise RuntimeError(f"falló ({result.returncode}): {' '.join(map(str, cmd))}" + (f" — ver {logfile}" if logfile else ""))


def blender(script, *args, logfile=None):
    run([BLENDER, "-b", "--python", str(HERE / "blender" / script), "--", *map(str, args)], logfile)


def download(release, file):
    target = RAW / release / file
    if not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        log("descarga", release, file)
        run(["gh", "release", "download", release, "-R", CONFIG["repo"], "-D", str(target.parent), "-p", file, "--skip-existing"])
    return target


def glb_json(path):
    with open(path, "rb") as handle:
        header = handle.read(20)
        magic, _, _, length, _ = struct.unpack("<IIIII", header)
        if magic != 0x46546C67:
            raise ValueError(f"{path} no es GLB")
        return json.loads(handle.read(length))


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def provenance(path):
    """Autor, licencia y fuente: Sketchfab los deja en asset.extras de cada GLB."""
    extras = glb_json(path).get("asset", {}).get("extras", {}) or {}
    license_text = extras.get("license", "")
    spdx = license_text.split(" ")[0] if license_text else None
    author = extras.get("author") or None
    if author and " (http" in author:
        # Sketchfab escribe "Nombre (https://sketchfab.com/usuario)": el enlace ya va en `source`.
        author = author.split(" (http")[0]
    return {
        "author": author,
        "license": spdx,
        "licenseText": license_text or None,
        "source": extras.get("source"),
        "title": extras.get("title"),
    }


def compress(src, dst, texture_size, keep_nodes):
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = [NPX, "gltf-transform", "optimize", str(src), str(dst), "--compress", "meshopt", "--texture-compress", "ktx2",
           "--texture-size", str(texture_size), "--simplify", "false"]
    if keep_nodes:
        # Las ruedas tienen que seguir siendo nodos con nombre.
        cmd += ["--flatten", "false", "--join", "false", "--instance", "false", "--palette", "false"]
    run(cmd, logfile=str(dst) + ".log")


# ---------------------------------------------------------------------- hero

# Nivel "hero" (RF-3D-06, RNF-03): la geometría del LOD0 con texturas de hasta 2048 px. Solo lo carga el showroom
# (un coche en primer plano), así que no pesa en la descarga del GP ni en la memoria de vídeo de los 22 coches de
# la carrera, que siguen con LOD0-2 a 1024/512/256. Escalera de tamaños (color base ETC1S, mapas normales /
# rugosidad / oclusión UASTC): el primero que cabe en el presupuesto; si ninguno mejora el LOD0, no hay hero.
HERO_BUDGET = 8 * 1024 * 1024 - 384 * 1024   # 7,6 MiB: margen bajo el contrato de 8 MiB por fichero
# El color base es lo que se nota de cerca (logos, números, patrocinadores); los mapas normales a 1024 ya dan el relieve.
HERO_LADDER = [(2048, 1024), (1536, 1024)]
# Si el LOD0 ya pesa esto, es la geometría la que llena el presupuesto: no cabe un hero con más textura.
HERO_SKIP_LOD0 = 6.8 * 1024 * 1024
UASTC_SLOTS = "{normalTexture,occlusionTexture,metallicRoughnessTexture}"


def _image_dims(raw):
    if raw[:4] == b"\x89PNG":
        return struct.unpack(">II", raw[16:24])
    i = 2
    while i + 9 < len(raw):
        if raw[i] != 0xFF:
            return None
        marker, size = raw[i + 1], struct.unpack(">H", raw[i + 2:i + 4])[0]
        if 0xC0 <= marker <= 0xC3:
            h, w = struct.unpack(">HH", raw[i + 5:i + 9])
            return w, h
        i += 2 + size
    return None


def glb_texture_sizes(path):
    """Lado mayor de las texturas de un GLB sin comprimir, por grupo: {"base": px, "data": px} (PNG/JPEG)."""
    with open(path, "rb") as handle:
        blob = handle.read()
    length = struct.unpack_from("<I", blob, 12)[0]
    doc = json.loads(blob[20:20 + length])
    binary = blob[20 + length + 8:]

    def side(tex_index):
        image = doc["images"][doc["textures"][tex_index]["source"]]
        if "bufferView" not in image:
            return 0
        view = doc["bufferViews"][image["bufferView"]]
        start = view.get("byteOffset", 0)
        found = _image_dims(binary[start:start + view["byteLength"]])
        return max(found) if found else 0

    out = {"base": 0, "data": 0}
    for material in doc.get("materials", []):
        pbr = material.get("pbrMetallicRoughness", {})
        for group, ref in (("base", pbr.get("baseColorTexture")), ("base", material.get("emissiveTexture")),
                           ("data", pbr.get("metallicRoughnessTexture")), ("data", material.get("normalTexture")),
                           ("data", material.get("occlusionTexture"))):
            if ref and "index" in ref:
                out[group] = max(out[group], side(ref["index"]))
    return out


def compress_hero(src, dst, lod0_size):
    """Comprime el hero; devuelve (base, data) en px o None si no cabe o no mejora el LOD0."""
    sizes = glb_texture_sizes(src)
    work = OUT / "cars" / (dst.stem + ".tmp")
    work.mkdir(parents=True, exist_ok=True)
    keep = ["--flatten", "false", "--join", "false", "--instance", "false", "--palette", "false"]
    try:
        for base, data in HERO_LADDER:
            base_px, data_px = min(base, sizes["base"]), min(data, sizes["data"])
            if base_px <= lod0_size and data_px <= lod0_size:
                break  # el original no tiene más detalle que el LOD0
            a, b, c = work / "a.glb", work / "b.glb", work / "c.glb"
            log_path = str(OUT / "cars" / dst.name) + ".log"
            run([NPX, "gltf-transform", "optimize", str(src), str(a), "--compress", "false", "--texture-compress", "false",
                 "--simplify", "false", *keep], logfile=log_path)
            run([NPX, "gltf-transform", "uastc", str(a), str(b), "--slots", UASTC_SLOTS, "--resize", str(data),
                 "--level", "2", "--rdo", "--rdo-lambda", "4", "--zstd", "18"], logfile=log_path + ".uastc")
            run([NPX, "gltf-transform", "etc1s", str(b), str(c), "--resize", str(base), "--quality", "255"],
                logfile=log_path + ".etc1s")
            run([NPX, "gltf-transform", "meshopt", str(c), str(dst)], logfile=log_path + ".meshopt")
            if dst.stat().st_size <= HERO_BUDGET:
                return base_px, data_px
            log("hero grande", dst.name, f"{dst.stat().st_size / 1048576:.2f} MiB con {base}/{data}")
        dst.unlink(missing_ok=True)
        return None
    finally:
        shutil.rmtree(work, ignore_errors=True)


def build_hero(job, force):
    """Hero de un coche ya normalizado (sin Blender). Deja <id>.hero.json con lo que se hizo."""
    work = OUT / "cars"
    src = work / f"{job['id']}.lod0.glb"
    if not src.exists():
        raise RuntimeError(f"falta {src}: ejecutar antes la etapa cars")
    dst = PUBLIC / "cars" / str(job["season"]) / f"{job['id']}.hero.glb"
    stamp = work / f"{job['id']}.hero.json"
    if not force and newer(stamp, src):
        return job["id"]
    override = CONFIG["cars"].get("overrides", {}).get(job["id"], {})
    lod0_size = override.get("textureSize", CONFIG["cars"]["textureSize"])[0]
    lod0 = PUBLIC / "cars" / str(job["season"]) / f"{job['id']}.lod0.glb"
    if lod0.exists() and lod0.stat().st_size > HERO_SKIP_LOD0:
        dst.unlink(missing_ok=True)
        stamp.write_text(json.dumps({"hero": False, "textureSize": None, "reason": "lod0 heavy"}) + "\n", encoding="utf-8")
        return job["id"]
    log("hero", job["id"])
    dst.parent.mkdir(parents=True, exist_ok=True)
    used = compress_hero(src, dst, lod0_size)
    stamp.write_text(json.dumps({"hero": bool(used), "textureSize": list(used) if used else None}) + "\n", encoding="utf-8")
    return job["id"]


def stage_heroes(only, jobs_n, force):
    jobs = car_jobs(only)
    log(f"heroes: {len(jobs)}")
    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=jobs_n) as pool:
        futures = {pool.submit(build_hero, job, force): job for job in jobs}
        for future in concurrent.futures.as_completed(futures):
            job = futures[future]
            try:
                log("listo hero", future.result())
            except Exception as error:
                failures.append((job["id"], str(error)))
                log("ERROR hero", job["id"], error)
    return failures


def hero_entry(job):
    """{"hero": {...}} si el coche tiene nivel hero (solo showroom); {} si no."""
    hero = PUBLIC / "cars" / str(job["season"]) / f"{job['id']}.hero.glb"
    stamp = OUT / "cars" / f"{job['id']}.hero.json"
    if not hero.exists() or not stamp.exists():
        return {}
    meta = json.loads(stamp.read_text(encoding="utf-8"))
    if not meta.get("hero"):
        return {}
    info = json.loads((OUT / "cars" / f"{job['id']}.json").read_text(encoding="utf-8"))
    return {"hero": {"file": f"cars/{job['season']}/{hero.name}", "bytes": hero.stat().st_size, "sha256": sha256(hero)[:16],
                     "triangles": info["lods"][0]["triangles"], "textureSize": meta["textureSize"]}}


# ---------------------------------------------------------------------- cars

def car_jobs(only):
    curated = json.loads(CURATED.read_text(encoding="utf-8"))
    jobs = []
    for season in CONFIG["cars"]["seasons"]:
        for team_ref, entry in curated.get(str(season), {}).items():
            ident = f"{season}-{team_ref}"
            if only and only not in (ident, team_ref, str(season)):
                continue
            jobs.append({"id": ident, "season": season, "teamRef": team_ref, **entry})
    return jobs


import threading

_split_locks = {}
_split_guard = threading.Lock()


def split_source(job, pack):
    """Coche de un pack de varios (2010, 2013, 2014): blender/split_pack.py lo separa una vez por pack."""
    season = job["season"]
    out = CACHE / "split" / str(season)
    prefix = f"{season}-pack"
    with _split_guard:
        lock = _split_locks.setdefault(str(pack), threading.Lock())
    with lock:
        if not newer(out / f"{prefix}.split.json", pack):
            expect = sum(1 for e in json.loads(CURATED.read_text(encoding="utf-8")).get(str(season), {}).values() if e.get("split"))
            log("separa pack", pack.name, f"({expect} coches)")
            out.mkdir(parents=True, exist_ok=True)
            # split.args: opciones extra de split_pack.py para ese pack (p. ej. --min-aspect en los coches de los 80).
            blender("split_pack.py", pack, out, prefix, "--expect", expect, *job["split"].get("args", []), logfile=CACHE / f"split-{season}.log")
    return out / f"{prefix}-{job['split']['index']}.glb"


def build_car(job, force):
    source = download(job["release"], job["file"])
    if job.get("split"):
        source = split_source(job, source)
    work = OUT / "cars"
    work.mkdir(parents=True, exist_ok=True)
    info_path = work / f"{job['id']}.json"
    # cars.overrides.<id>: LOD y texturas propios para coches muy pesados (RNF-03: <= 8 MB por LOD).
    override = CONFIG["cars"].get("overrides", {}).get(job["id"], {})
    if force or not newer(info_path, source):
        log("normaliza", job["id"])
        length = CONFIG["cars"]["lengthBySeason"].get(str(job["season"]))
        lods = override.get("lods", CONFIG["cars"]["lods"])
        extra = ["--force-length"] if override.get("forceLength") else []
        blender("normalize_car.py", source, work, job["id"], "--length", length, "--lods", ",".join(map(str, lods)), *extra,
                logfile=work / f"{job['id']}.blender.log")
    info = json.loads(info_path.read_text(encoding="utf-8"))
    dest = PUBLIC / "cars" / str(job["season"])
    for lod, size in zip(info["lods"], override.get("textureSize", CONFIG["cars"]["textureSize"])):
        src = work / lod["file"]
        dst = dest / lod["file"]
        if force or not newer(dst, src):
            log("comprime", lod["file"])
            compress(src, dst, size, keep_nodes=True)
    thumb = PUBLIC / "thumbs" / f"{job['id']}.png"
    if force or not newer(thumb, work / info["lods"][0]["file"]):
        thumb.parent.mkdir(parents=True, exist_ok=True)
        blender("thumbnails.py", work / info["lods"][0]["file"], thumb, "--size", "640x360", logfile=work / f"{job['id']}.thumb.log")
    build_hero(job, force)
    return job["id"]


def stage_cars(only, jobs_n, force):
    jobs = car_jobs(only)
    log(f"coches: {len(jobs)}")
    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=jobs_n) as pool:
        futures = {pool.submit(build_car, job, force): job for job in jobs}
        for future in concurrent.futures.as_completed(futures):
            job = futures[future]
            try:
                log("listo", future.result())
            except Exception as error:  # se informa y se sigue con el resto
                failures.append((job["id"], str(error)))
                log("ERROR", job["id"], error)
    return failures


# ------------------------------------------------------------------ circuits

def build_circuit(item, force):
    sid = item["splineId"]
    source = download(item["release"], item["file"])
    work = CACHE / "splines"
    work.mkdir(parents=True, exist_ok=True)
    raw = work / f"{sid}.raw.json"
    if force or not newer(raw, source):
        log("spline", sid)
        geo = ["--geo", GEO, "--geo-id", item["geoId"]] if item.get("geoId") and GEO.exists() else []
        method = ["--method", item["method"]] if item.get("method") else []
        method += ["--group", item["group"]] if item.get("group") else []
        blender("extract_spline.py", source, raw, "--km", item["km"], *geo, *method, logfile=work / f"{sid}.log")
    review = item.get("review", {})
    aligned = work / f"{sid}.json"
    cmd = ["node", str(HERE / "align_spline.mjs"), str(raw), str(aligned), item["layoutRef"], str(item["validFrom"]), item["direction"]]
    if item.get("geoId") and GEO.exists():
        cmd += ["--geo", str(GEO), "--geo-id", item["geoId"]]
    if "mirror" in review:
        cmd += ["--force-mirror", "true" if review["mirror"] else "false"]
    if review.get("startNear"):
        cmd += ["--start-near", ",".join(str(v) for v in review["startNear"])]
    if review.get("startShiftM"):
        cmd += ["--start-shift", str(review["startShiftM"])]
    if review.get("startReviewed"):
        cmd += ["--start-reviewed"]
    run(cmd, logfile=work / f"{sid}.align.log")
    data = json.loads(aligned.read_text(encoding="utf-8"))
    preview = CACHE / "preview" / f"{sid}.png"
    preview.parent.mkdir(parents=True, exist_ok=True)
    prepared = OUT / "circuits" / f"{sid}.glb"
    prepared.parent.mkdir(parents=True, exist_ok=True)
    mirror_flag = ["--mirror"] if data.get("mirroredFromSource") else []
    stamp = OUT / "circuits" / f"{sid}.mirror-{bool(mirror_flag)}"
    if force or not newer(prepared, source) or not stamp.exists():
        log("prepara", sid, "(reflejado)" if mirror_flag else "")
        for old in (OUT / "circuits").glob(f"{sid}.mirror-*"):
            old.unlink()
        blender("prepare_circuit.py", source, prepared, *mirror_flag, logfile=OUT / "circuits" / f"{sid}.blender.log")
        stamp.write_text("")
    blender("preview_spline.py", prepared, aligned, preview, "--size", "1200", logfile=work / f"{sid}.preview.log")
    dst = PUBLIC / "circuits" / f"{sid}.glb"
    if force or not newer(dst, prepared):
        log("comprime", sid)
        compress(prepared, dst, 2048, keep_nodes=False)
    # Calle de boxes real, sacada de la malla (garajes y carril paralelo a la recta de meta).
    pitlane = work / f"{sid}.pitlane.json"
    if force or not newer(pitlane, prepared, aligned):
        log("boxes", sid)
        blender("extract_pitlane.py", prepared, aligned, pitlane, "--preview", CACHE / "preview" / f"{sid}.pit.png",
                logfile=work / f"{sid}.pitlane.log")
    # Datos de pista (docs/manager/SIM-FISICA.md §3.1 y §3.8, WP1): anchura medida en la malla, trazada de
    # curvatura mínima, curvatura y marcas del pit lane; vistas de revisión en .cache/preview/<id>.track*.png.
    widths = work / f"{sid}.widths.json"
    background = work / f"{sid}.bg.png"
    if force or not newer(widths, prepared, aligned) or not background.exists():
        log("anchura", sid)
        painted = painted_names(sid, item)
        blender("extract_spline.py", prepared, widths, "--widths", aligned,
                *(["--group", item["group"]] if item.get("group") else []),
                *(["--painted", ",".join(painted)] if painted else []),
                "--preview-bg", background, logfile=work / f"{sid}.widths.log")
    log("trazada", sid)
    run(["node", str(HERE / "racing_line.mjs"), sid, "--spline", str(aligned), "--widths", str(widths),
         "--pit", str(pitlane), "--out", str(work / f"{sid}.track.json"), "--preview", str(CACHE / "preview")],
        logfile=work / f"{sid}.track.log")
    return sid


def painted_names(sid, item):
    """Mallas (o materiales) de las líneas pintadas de los bordes, las mismas que eligió extract_spline.py:
    de la spline bruta si las guarda, o de su registro (las anteriores a paintedObjects). Si el registro es de
    otra ejecución, se aplica la misma regla de forma a sus líneas «esqueleto L m, ancho W m»."""
    work = CACHE / "splines"
    raw = json.loads((work / f"{sid}.raw.json").read_text(encoding="utf-8"))
    if raw.get("paintedObjects") is not None:
        return raw["paintedObjects"]
    logfile = work / f"{sid}.log"
    if not logfile.exists():
        return []
    text = logfile.read_text(encoding="utf-8", errors="replace")
    import ast
    import re
    found = re.findall(r"líneas pintadas (\[.*?\]): ambos bordes", text)
    if found:
        return ast.literal_eval(found[-1])
    target = float(item["km"]) * 1000.0
    return [name for name, length, width in re.findall(r"\]\s{3}(\S.*?): esqueleto (\d+) m, ancho ([\d.]+) m", text)
            if 0.4 <= float(width) <= 2.5 and float(length) >= 1.3 * target]


def stage_circuits(only, force):
    failures = []
    for item in CONFIG["circuits"]:
        if only and only != item["splineId"]:
            continue
        try:
            log("listo", build_circuit(item, force))
        except Exception as error:
            failures.append((item["splineId"], str(error)))
            log("ERROR", item["splineId"], error)
    return failures


# ------------------------------------------------------------------ manifest

def compact_spline(data, step=6.0):
    """Lo que necesita el motor: el bucle en el plano (x, z) cada `step` m, en decímetros enteros."""
    pts = data["points"]
    stride = max(1, int(round(step / data.get("stepM", 2.0))))
    flat = []
    for x, _, z in pts[::stride]:
        flat += [int(round(x * 10)), int(round(z * 10))]
    return flat


def chassis_names():
    """Nombre del chasis por temporada y equipo, de los packs de temporada (fuente: f1db)."""
    names = {}
    seasons = ROOT / "overcut/frontend/src/modules/overcutManager/data/seasons"
    for season in CONFIG["cars"]["seasons"]:
        pack = seasons / f"{season}.json"
        if pack.exists():
            for team in json.loads(pack.read_text(encoding="utf-8"))["teams"]:
                names[(season, team["id"])] = " / ".join(c["name"] for c in team.get("chassis", [])) or None
    return names


def copy_transcoder():
    """KTX2Loader necesita el transcodificador Basis servido junto a los assets."""
    source = ROOT / "overcut/frontend/node_modules/three/examples/jsm/libs/basis"
    target = PUBLIC / "basis"
    target.mkdir(parents=True, exist_ok=True)
    for name in ("basis_transcoder.js", "basis_transcoder.wasm"):
        if (source / name).exists():
            shutil.copy2(source / name, target / name)


def load_provenance():
    """riskRipped verificado por asset (tools/assets/provenance.json, SRS 3.3 y 7.3). Sin fichero: null."""
    path = HERE / "provenance.json"
    cars, circuits = {}, {}
    if path.exists():
        for row in json.loads(path.read_text(encoding="utf-8")).get("assets", []):
            info = {"riskRipped": row.get("riskRipped"), "provenanceConfidence": row.get("confidence"),
                    "provenanceEvidence": (row.get("evidence") or [])[:3]}
            if row.get("kind") == "car" and row.get("season") is not None:
                cars[(int(row["season"]), row.get("teamRef"))] = info
            elif row.get("kind") == "circuit":
                circuits[row.get("splineId") or row.get("release")] = info
    return cars, circuits


def compact_pit(pitlane_path, step=6.0):
    """Calle de boxes para el motor (engine/trackGeometry.js buildCircuitFromPath path.pit), o None."""
    if not pitlane_path.exists():
        return None
    pit = json.loads(pitlane_path.read_text(encoding="utf-8"))
    if not pit.get("found") or pit.get("lineShare") is None:
        return None
    pts = pit["points"]
    stride = max(1, int(round(step / pit.get("stepM", 2.0))))
    picked = pts[::stride]
    if picked[-1] is not pts[-1]:
        picked.append(pts[-1])
    flat = []
    for x, _, z in picked:
        flat += [int(round(x * 10)), int(round(z * 10))]
    return {
        "points": flat, "entryShare": pit["entry"]["share"], "exitShare": pit["exit"]["share"],
        "lineShare": pit["lineShare"], "boxFrom": pit["box"]["fromShare"], "boxTo": pit["box"]["toShare"],
        "side": pit["side"], "confidence": pit["quality"]["confidence"], "source": pit.get("generator"),
    }


def engine_spline(item, data):
    """Entrada de splines.json para el motor (RF-3D-03): bucle, calle de boxes y datos de pista (WP1)."""
    sid = item["splineId"]
    entry = {
        "circuitRef": item["circuitId"], "layoutRef": item["layoutRef"], "layoutId": item["layoutId"],
        "validFrom": item["validFrom"], "validTo": item["validTo"], "km": item["km"],
        "direction": item["direction"], "lengthM": data["lengthM"], "stepM": 6,
        "startConfidence": (data.get("start") or {}).get("confidence"),
        "points": compact_spline(data),
    }
    pit = compact_pit(CACHE / "splines" / f"{sid}.pitlane.json")
    # Datos de pista de racing_line.mjs (docs/manager/SIM-FISICA.md §3.1 y §3.8): campos nuevos; los de antes no
    # cambian (engine/trackGeometry.js, venue.circuitFor y three/racingLine.js no leen los nuevos).
    track_path = CACHE / "splines" / f"{sid}.track.json"
    if track_path.exists():
        track = json.loads(track_path.read_text(encoding="utf-8"))
        if track["count"] * 2 != len(entry["points"]):
            raise RuntimeError(f"{sid}: {sid}.track.json tiene {track['count']} puntos y la spline {len(entry['points']) // 2}")
        entry.update({"trackMarginM": track["trackMarginM"], "wl": track["wl"], "wr": track["wr"],
                      "line": track["line"], "kappa": track["kappa"]})
        marks = track.get("pit")
        if pit and marks:
            pit.update({k: marks[k] for k in ("entryLine", "limitFrom", "limitTo", "exitBlend", "marksSource")})
    if pit:
        entry["pit"] = pit
    return entry


def write_engine_splines(engine):
    td = CONFIG["trackData"]
    defaults = {
        "$comment": "Circuitos sin malla (trazado procedural de engine/layouts.js): engine/trackData.js usa esta anchura y resuelve la trazada con el mismo código (engine/racingLineSolver.js). Sale de tools/assets/assets.config.json trackData.",
        "halfWidthM": td["procedural"]["halfWidthM"], "halfWidthSource": td["procedural"]["source"],
        "marginM": round(td["carHalfWidthM"] + td["clearanceM"], 2), "curvatureSpan": td["curvatureSpan"],
        "solver": td["solver"],
    }
    splines = {
        "$comment": "GENERADO por tools/assets/build_assets.py desde las splines calibradas (RF-3D-03). Puntos (x, z) glTF en decímetros, cada 6 m, empezando en la meta y en el sentido de carrera. Por punto (docs/manager/SIM-FISICA.md §3.1, tools/assets/racing_line.mjs): wl/wr media anchura a izquierda/derecha del sentido de carrera (dm), line trazada de curvatura mínima como desplazamiento lateral (dm, + = derecha, el sentido de three/racingLine.js), kappa curvatura de la trazada (1e-4/m, + = hacia la derecha). pit.entryLine/limitFrom/limitTo/exitBlend: fracciones de la calle de boxes, como boxFrom/boxTo.",
        "defaults": defaults,
        "splines": engine,
    }
    (ROOT / CONFIG["engineSplines"]).write_text(json.dumps(splines, separators=(",", ":")) + "\n", encoding="utf-8")
    log(f"splines del motor: {len(engine)}")


def stage_splines():
    """Solo data/splines.json (motor), sin tocar el manifiesto: mismas reglas de aprobación que stage_manifest."""
    engine = {}
    for item in CONFIG["circuits"]:
        sid = item["splineId"]
        aligned = CACHE / "splines" / f"{sid}.json"
        if not aligned.exists() or not (PUBLIC / "circuits" / f"{sid}.glb").exists():
            continue
        data = json.loads(aligned.read_text(encoding="utf-8"))
        usable = (data["deviation"]["maxM"] <= 2.0 and data["deviation"]["measuredShare"] >= 0.6) or item.get("review", {}).get("approved")
        if usable:
            engine[sid] = engine_spline(item, data)
    write_engine_splines(engine)


def stage_manifest():
    copy_transcoder()
    car_risk, circuit_risk = load_provenance()
    chassis = chassis_names()
    curated = json.loads(CURATED.read_text(encoding="utf-8"))
    cars, circuits, engine = [], [], {}
    for job in car_jobs(None):
        info_path = OUT / "cars" / f"{job['id']}.json"
        lods = [PUBLIC / "cars" / str(job["season"]) / f"{job['id']}.lod{k}.glb" for k in range(len(CONFIG["cars"]["lods"]))]
        if not info_path.exists() or not all(p.exists() for p in lods):
            continue
        info = json.loads(info_path.read_text(encoding="utf-8"))
        prov = provenance(RAW / job["release"] / job["file"])
        allow = prov["license"] in ("CC-BY-4.0", "CC-BY-SA-4.0", "CC0-1.0", "CC-BY-3.0")
        entry = curated[str(job["season"])][job["teamRef"]]
        cars.append({
            "season": job["season"], "teamRef": job["teamRef"], "chassis": chassis.get((job["season"], job["teamRef"])),
            "release": job["release"], "sourceFile": job["file"], "status": entry.get("status", "ok"), "note": entry.get("note"),
            "scale": 1.0, "forwardAxis": "-Z", "origin": "rear-axle-ground",
            # Ruedas soldadas a la suspensión en el modelo: sin nodos de giro (metrics.wheels = "static").
            "wheelNodes": [] if info.get("wheels") == "static" else ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"],
            "lods": [{"file": f"cars/{job['season']}/{p.name}", "bytes": p.stat().st_size, "sha256": sha256(p)[:16],
                      "triangles": lod["triangles"]} for p, lod in zip(lods, info["lods"])],
            **hero_entry(job),
            "thumb": f"thumbs/{job['id']}.png" if (PUBLIC / "thumbs" / f"{job['id']}.png").exists() else None,
            "metrics": {k: info[k] for k in ("lengthM", "widthM", "heightM", "wheelbaseM", "trackFrontM", "trackRearM", "wheelRadiusM", "wheelHubs", "noseZ", "tailZ", "scaleApplied", "wheels") if k in info},
            **prov, "allowRecolor": allow and "ND" not in (prov["license"] or ""),
            # Sin verificación en provenance.json queda null y las builds públicas lo excluyen.
            "riskRipped": None,
            **car_risk.get((job["season"], job["teamRef"]), {}),
        })
    for item in CONFIG["circuits"]:
        sid = item["splineId"]
        aligned = CACHE / "splines" / f"{sid}.json"
        glb = PUBLIC / "circuits" / f"{sid}.glb"
        if not aligned.exists() or not glb.exists():
            continue
        data = json.loads(aligned.read_text(encoding="utf-8"))
        usable = (data["deviation"]["maxM"] <= 2.0 and data["deviation"]["measuredShare"] >= 0.6) or item.get("review", {}).get("approved")
        if not usable:
            log("spline sin aprobar (fuera del manifiesto y del motor):", sid)
            continue
        prov = provenance(RAW / item["release"] / item["file"])
        public_spline = PUBLIC / "splines" / f"{sid}.json"
        public_spline.parent.mkdir(parents=True, exist_ok=True)
        slim = {k: data[k] for k in ("points", "widths", "stepM", "lengthM", "direction", "frame")}
        public_spline.write_text(json.dumps(slim, separators=(",", ":")) + "\n", encoding="utf-8")
        circuits.append({
            "circuitRef": item["circuitId"], "layoutId": item["layoutId"], "layoutRef": item["layoutRef"],
            "validFrom": item["validFrom"], "validTo": item["validTo"],
            "release": item["release"], "sourceFile": item["file"], "file": f"circuits/{sid}.glb",
            "bytes": glb.stat().st_size, "sha256": sha256(glb)[:16],
            "splineId": sid, "spline": f"splines/{sid}.json",
            "lengthM": data["lengthM"], "realKm": item["km"], "lengthError": data["lengthError"],
            "deviation": data["deviation"], "mirroredFromSource": data.get("mirroredFromSource", False),
            # Criterio 7.2: desviación <= 2 m medida en la mayor parte de la vuelta. Si no se puede medir (escapatorias
            # de asfalto), solo una revisión manual (assets.config.json review.approved) la deja entrar en el motor.
            "meetsCriterion": data["deviation"]["maxM"] <= 2.0 and data["deviation"]["measuredShare"] >= 0.6,
            "reviewApproved": bool(item.get("review", {}).get("approved")),
            "edgeReference": data.get("edgeReference"), "geoFit": data.get("geoFit"),
            "start": data.get("start"), "geoCheck": data.get("geoCheck"),
            **prov, "allowRecolor": False,
            "riskRipped": None,
            **(circuit_risk.get(sid) or circuit_risk.get(item["release"]) or {}),
        })
        engine[sid] = engine_spline(item, data)
    digest = hashlib.sha256(json.dumps([cars, circuits], sort_keys=True).encode()).hexdigest()[:16]
    manifest = {
        "$comment": "GENERADO por tools/assets/build_assets.py: no editar a mano (SRS 4.3, RF-3D-01). Las rutas son relativas a /manager-assets/.",
        "version": PIPELINE_VERSION, "hash": digest, "baseUrl": "/manager-assets/",
        "cars": sorted(cars, key=lambda c: (c["season"], c["teamRef"])),
        "circuits": sorted(circuits, key=lambda c: (c["circuitRef"], c["validFrom"])),
    }
    (ROOT / CONFIG["manifest"]).write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    write_engine_splines(engine)
    log(f"manifiesto: {len(cars)} coches, {len(circuits)} circuitos, hash {digest}")


def main():
    args = sys.argv[1:]
    stages = [a for a in args if a in ("cars", "heroes", "circuits", "splines", "manifest")] or ["cars", "circuits", "manifest"]
    only = args[args.index("--only") + 1] if "--only" in args else None
    jobs_n = int(args[args.index("--jobs") + 1]) if "--jobs" in args else 3
    force = "--force" in args
    failures = []
    if "circuits" in stages:
        failures += stage_circuits(only, force)
    if "cars" in stages:
        failures += stage_cars(only, jobs_n, force)
    elif "heroes" in stages:
        failures += stage_heroes(only, jobs_n, force)
    if "manifest" in stages:
        stage_manifest()
    elif "splines" in stages:
        stage_splines()
    if failures:
        log("FALLOS:")
        for ident, error in failures:
            log("  ", ident, error)
        sys.exit(1)


if __name__ == "__main__":
    main()
