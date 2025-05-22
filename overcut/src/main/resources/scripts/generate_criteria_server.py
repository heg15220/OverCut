#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import random
import pickle
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ——————— Configuración de rutas y rangos ———————
HERE = Path(__file__).resolve().parent
PROJECT_ROOT = HERE.parents[3]

# que apunte a …\OverCut\src\main donde están tus cachés
CACHE_DIR = HERE.parents[1]
      # sube hasta .../src/main

def cache_file_for(since_year: int, end_year: Optional[int]):
    suffix = f"{since_year}_{end_year if end_year is not None else 'plus'}"
    return CACHE_DIR / f"configs_cache_{suffix}.pkl"

# Los tres rangos para los que ya hemos generado caché en background
CACHED_RANGES = [
    (2000, None),
    (1980, None),
    (1980, 1999),
]

# ——————— Contenedor en memoria de todos los pickles ———————
CONFIGS_CACHE: dict[tuple[int, Optional[int]], list] = {}

def load_all_caches():
    """
    Carga en memoria, al arranque, los tres pickles ya generados.
    """
    for since, end in CACHED_RANGES:
        path = cache_file_for(since, end)
        if not path.exists():
            raise RuntimeError(f"Falta el cache para rango {since}-{end}: {path}")
        CONFIGS_CACHE[(since, end)] = pickle.loads(path.read_bytes())
    print(f"[startup] Cargados caches para rangos: {list(CONFIGS_CACHE.keys())}")

# ——————— FastAPI setup ———————
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # Sólo carga de pickles; nada de consultas SQL aquí
    load_all_caches()

@app.get("/generate")
def generate(
    sinceYear: int = Query(2000, description="Año mínimo (inclusive)"),
    endYear: Optional[int] = Query(None, description="Año máximo (inclusive)")
):
    """
    Devuelve aleatoriamente una configuración de filas/columnas
    de entre las precalculadas para el rango dado.
    """
    key = (sinceYear, endYear)
    configs = CONFIGS_CACHE.get(key)
    if not configs:
        return {
            "error": f"No hay configuraciones precargadas para rango {sinceYear}-{endYear}"
        }
    return random.choice(configs)

if __name__ == "__main__":
    uvicorn.run("generate_criteria_server:app", host="127.0.0.1", port=8000)
