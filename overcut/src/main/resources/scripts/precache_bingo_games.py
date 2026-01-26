# precache_bingo_games.py
# -*- coding: utf-8 -*-

import argparse
import json
import os
import gzip
import time
import random
from datetime import datetime, timezone

# Tu generador actual
from generate_bingo import (
    generate_bingo_game,
    load_driver_pool
)

# Si tus cachés (TEAM_CACHE, etc.) se “precalientan” en generate_drivers_connections:
from generate_drivers_connections import (
    precache_static_categories,
    precache_dynamic_lists,
)

CACHE_VERSION = 1


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def atomic_write_bytes(path: str, data: bytes):
    tmp = f"{path}.tmp"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def compact_game(game: dict) -> dict:
    """
    Reduce MUCHO el tamaño:
    - validPilots => validPilotIds (solo ids)
    - driversQueue => ids y names (se mantiene name porque lo usa el UI normalmente)
    """
    compact_cells = []
    for c in game["cells"]:
        pilots = c.get("validPilots", [])
        compact_cells.append({
            "code": c.get("code"),
            "description": c.get("description"),
            "image": c.get("image"),
            "meta": c.get("meta"),
            "validPilotIds": [p["driverId"] for p in pilots]
        })

    return {
        "cells": compact_cells,
        "driversQueue": game.get("driversQueue", [])
    }


def generate_many(lang: str, count: int, compact: bool, unique_by_codes: bool, max_tries: int):
    games = []
    seen = set()

    tries = 0
    while len(games) < count and tries < max_tries:
        tries += 1
        g = generate_bingo_game(lang)

        if compact:
            g_out = compact_game(g)
        else:
            g_out = g

        if unique_by_codes:
            codes = tuple(sorted([c["code"] for c in g_out["cells"]]))
            if codes in seen:
                continue
            seen.add(codes)

        games.append(g_out)

        # mini-log cada 50
        if len(games) % 50 == 0:
            print(f"[{lang}] generated {len(games)}/{count} (tries={tries})")

    if len(games) < count:
        print(f"⚠️ [{lang}] Only generated {len(games)}/{count} within max_tries={max_tries}")

    return games


def write_cache(out_path: str, payload: dict, gzip_enabled: bool):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    if gzip_enabled:
        gz_path = out_path if out_path.endswith(".gz") else out_path + ".gz"
        compressed = gzip.compress(data, compresslevel=6)
        atomic_write_bytes(gz_path, compressed)
        print(f"✅ wrote {gz_path} ({len(compressed)/1024:.1f} KB gz)")
    else:
        atomic_write_bytes(out_path, data)
        print(f"✅ wrote {out_path} ({len(data)/1024:.1f} KB)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=600, help="Games per language")
    ap.add_argument("--lang", type=str, default="both", choices=["es", "en", "both"])
    ap.add_argument("--outdir", type=str, default="cache", help="Output folder")
    ap.add_argument("--compact", action="store_true", help="Store only validPilotIds instead of validPilots")
    ap.add_argument("--unique", action="store_true", help="Avoid repeating same set of cell codes")
    ap.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    ap.add_argument("--gzip", action="store_true", help="Write .json.gz instead of .json")
    ap.add_argument("--max-tries", type=int, default=50000, help="Hard cap to avoid infinite loops")
    args = ap.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    os.makedirs(args.outdir, exist_ok=True)

    # ✅ precaches
    t0 = time.time()
    print("[startup] precache_static_categories()")
    precache_static_categories()
    print("[startup] precache_dynamic_lists()")
    precache_dynamic_lists()
    print("[startup] load_driver_pool()")
    load_driver_pool()
    print(f"[startup] ready in {time.time()-t0:.2f}s")

    langs = ["es", "en"] if args.lang == "both" else [args.lang]

    for lang in langs:
        print(f"\n=== Generating Bingo cache for lang={lang} count={args.count} compact={args.compact} unique={args.unique} ===")
        games = generate_many(
            lang=lang,
            count=args.count,
            compact=args.compact,
            unique_by_codes=args.unique,
            max_tries=args.max_tries
        )

        payload = {
            "version": CACHE_VERSION,
            "generatedAt": utc_now_iso(),
            "lang": lang,
            "count": len(games),
            "compact": bool(args.compact),
            "games": games
        }

        out_path = os.path.join(args.outdir, f"bingo_cache_{lang}.json")
        write_cache(out_path, payload, gzip_enabled=args.gzip)


if __name__ == "__main__":
    main()
