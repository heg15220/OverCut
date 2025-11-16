from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import uvicorn
import os
from typing import Optional
import pickle
import random
from pathlib import Path
import subprocess
from contextlib import asynccontextmanager

from grand_prix_history_questions import build_game_from_gp, build_game_random_gp,_shuffle_options_in_place
from generate_drivers_connections import generate_game as generate_drivers_game
from generate_drivers_connections import precache_static_categories
from generate_drivers_connections import precache_dynamic_lists
from generate_crossword import main as generate_crossword_main
from validate_crossword_word import validate_word_and_clue
from select_driver_teams import generate_career_path_game
from autocomplete_grid_pilot import autocomplete_pilots
from select_driver_teammates import generate_drivers_link_game
from generate_f1_impostor import generate_f1_impostor_game
from select_wordle_driver import generate_f1_wordle_game
from get_drivers_for_season import get_drivers_for_season
from validate_grid_game import pilot_exists_for_season
from get_pilot_nationality import get_nationality
from autocomplete_grid_pilot import autocomplete_pilots
from generate_top10_game import get_random_race_and_top10
from validate_top10_pilot import validate_pilot_in_top10
from generate_order_drivers import generate_order_game
from generate_order_drivers import load_teams_with_min_wins
from generate_order_drivers import load_teams_with_enough_races_or_wins
from generate_order_drivers import load_valid_circuits
from generate_order_drivers import load_valid_nationalities
from generate_order_drivers import engine
from generate_order_drivers import ensure_order_caches_ready


from select_random_driver import get_random_driver
from validate_guess_driver_question import main as validate_question_main
from get_recommendations import get_recommendations
from recommend_pilots import recommend_pilots
from generate_rondo import generar_rosco
from validate_rondo_answer import validate_answer
from generate_rondo import cargar_cache
from select_team_and_podium_drivers import generate_team_guess_data
from autocomplete_teams import autocomplete_teams
from select_teams_pilot import get_team_pairs_with_common_drivers
from validate_two_teams_driver import validate_driver
from generate_wordsearch import generate_wordsearch_grid
from validate_pilot import validate_pilot
from autocomplete_pilot import buscar_pilotos
from generate_questions import generar_preguntas_desde_main
from regulation_questions import generar_preguntas_reglamento_desde_main
from strategy_questions import generar_preguntas_estrategia_desde_main
from physics_questions import generar_preguntas_fisica_desde_main
from team_radio_questions import generar_preguntas_teamradios
from validate_category_answer import validate_category_answer
from generic_stats_service import load_generic_stats_cache, generate_genericstats_questions
from generic_stats_service import generar_preguntas_genericstats_desde_main
from validate_guess_driver_question import NATIONALITY_TRANSLATIONS_EN, NATIONALITY_TRANSLATIONS
# arriba, junto al resto de imports del módulo GP
from grand_prix_history_questions import _export, _localize_gp_titles, GP_FUNCS

GP_KEYS = tuple(GP_FUNCS.keys())

_RNG = random.Random()

import sys
import io
import json




# === Carga de caché de criterios TikiTaka ===
HERE = Path(__file__).resolve().parent
PROJECT_ROOT = HERE.parents[3]

# que apunte a …\OverCut\src\main donde están tus cachés
CACHE_DIR = HERE.parents[1]
      # sube hasta .../src/main

CACHED_RANGES = [
    (2000, None),
    (1980, None),
    (1980, 1999),
]

CONFIGS_CACHE: dict[tuple[int, Optional[int]], list] = {}

CATEGORY_CACHE: dict[str, dict[str, dict[str, bool]]] = {
    "es": {},
    "en": {}
}

GENERIC_STATS_CACHE = {}
PRECOMPUTED_TOPS = {}
INDEXES = {}

def cache_file_for(since_year: int, end_year: Optional[int]):
    suffix = f"{since_year}_{end_year if end_year is not None else 'plus'}"
    return CACHE_DIR / f"configs_cache_{suffix}.pkl"

def load_criteria_cache():
    for since, end in CACHED_RANGES:
        path = cache_file_for(since, end)
        if not path.exists():
            print(f"[WARN] Falta caché para rango {since}-{end}: {path}")
            continue
        CONFIGS_CACHE[(since, end)] = pickle.loads(path.read_bytes())
    print(f"[startup] Caché de criterios TikiTaka cargado: {list(CONFIGS_CACHE.keys())}")

def load_category_letter_cache():
    script_dir = Path(__file__).resolve().parent / "resources" / "scripts"

    for lang in ["es", "en"]:
        file = script_dir / f"category_letter_cache{'_en' if lang == 'en' else ''}.json"
        if not file.exists():
            print(f"[WARN] No se encontró el archivo de caché de letras: {file}")
            continue
        try:
            with file.open(encoding="utf-8") as f:
                CATEGORY_CACHE[lang] = json.load(f)
            print(f"[startup] Caché de letras cargada para {lang.upper()}")
        except Exception as e:
            print(f"[ERROR] Cargando caché {lang}: {e}")

def precache_order_teams():
    global ORDER_TEAM_CACHE_MIN_WINS, ORDER_TEAM_CACHE_LONG_CAREER
    with engine.connect() as conn:
        ORDER_TEAM_CACHE_MIN_WINS = load_teams_with_min_wins(conn)
        ORDER_TEAM_CACHE_LONG_CAREER = load_teams_with_enough_races_or_wins(conn)
    print(f"[startup] Teams with wins >=5: {len(ORDER_TEAM_CACHE_MIN_WINS)}")
    print(f"[startup] Teams with 100 races or >=5 wins: {len(ORDER_TEAM_CACHE_LONG_CAREER)}")

def precache_order_circuits():
    global ORDER_CIRCUIT_CACHE
    with engine.connect() as conn:
        ORDER_CIRCUIT_CACHE = load_valid_circuits(conn)
    print(f"[startup] Circuits with >=5 distinct drivers: {len(ORDER_CIRCUIT_CACHE)}")

def precache_order_nationalities():
    global ORDER_NATIONALITY_CACHE
    with engine.connect() as conn:
        ORDER_NATIONALITY_CACHE = load_valid_nationalities(conn)
    print(f"[startup] Nationalities with >=5 winning drivers: {len(ORDER_NATIONALITY_CACHE)}")



@asynccontextmanager
async def lifespan(app: FastAPI):
    global GENERIC_STATS_CACHE
    load_criteria_cache()
    load_category_letter_cache()
    precache_static_categories()
    precache_dynamic_lists()
    precache_order_teams()
    precache_order_circuits()
    precache_order_nationalities()
    load_generic_stats_cache("generic_stats_data.json")
    for gp in GP_FUNCS.keys():
            _ = _get_prebuilt(gp, "es")
            _ = _get_prebuilt(gp, "en")
            _ = _get_game(gp, "es")
            _ = _get_game(gp, "en")
    yield



from functools import lru_cache

app = FastAPI(lifespan=lifespan, default_response_class=JSONResponse)


def _build_exported_questions(gp_name: str, lang: str) -> list[dict]:
    fn = GP_FUNCS.get(gp_name)
    if not fn:
        raise ValueError(f"GP no encontrado: {gp_name}")
    items = fn()
    return _export(items, lang)  # usa tu export tal cual

def _get_titles(gp_name: str) -> dict:
    if gp_name not in _TITLES:
        _TITLES[gp_name] = _localize_gp_titles(gp_name)
    return _TITLES[gp_name]

def _ensure_cache_ready():
    if _PREBUILT:
        return
    for gp in GP_FUNCS.keys():
        for lang in ("es","en"):
            try:
                _PREBUILT[(gp, lang)] = _build_exported_questions(gp, lang)
                _ = _get_titles(gp)
            except Exception:
                pass




# === Nuevo endpoint ===
@app.get("/generate-tikitaka-criteria")
def generate_tikitaka_criteria(
    sinceYear: int = Query(2000),
    endYear: Optional[int] = Query(None)
):
    key = (sinceYear, endYear)
    configs = CONFIGS_CACHE.get(key)
    if not configs:
        return JSONResponse(
            content={"error": f"No hay configuraciones precargadas para rango {sinceYear}-{endYear}"},
            status_code=400
        )
    return JSONResponse(content=random.choice(configs))


# === OverCutGames ===
@app.get("/generate")
def generate_drivers_connections(lang: str = Query("es", enum=["es", "en"])):
    try:
        global LANG
        LANG = lang
        result = generate_drivers_game(lang)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# === /generate-crossword ===
@app.get("/generate-crossword")
def generate_crossword(rows: int = 10, cols: int = 10, lang: str = Query("es", enum=["es", "en"])):
    try:
        # Simula ejecución como si fuera main() con argumentos
        sys.argv = ["generate_crossword.py", str(rows), str(cols), lang]
        sys_stdout = io.StringIO()
        sys.stderr = io.StringIO()
        sys.stdout = sys_stdout

        generate_crossword_main()

        sys.stdout = sys.__stdout__
        output = sys_stdout.getvalue()

        return JSONResponse(content=json.loads(output))
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# === /validate-crossword-word ===
@app.get("/validate-crossword-word")
def validate_crossword_word(word: str, clue: str, lang: str = Query("es", enum=["es", "en"])):
    try:
        result = validate_word_and_clue(word, clue, lang)
        return result
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/generate-career-path")
def generate_career_path():
    try:
        result = generate_career_path_game()
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/autocomplete-career-pilot")
def autocomplete_career_pilot(partial: str):
    try:
        suggestions = autocomplete_pilots(partial)
        return JSONResponse(content=suggestions)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)



@app.get("/generate-drivers-link")
def generate_drivers_link():
    try:
        result = generate_drivers_link_game()
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/generate-f1-impostor")
def generate_f1_impostor(lang: str = Query("es", enum=["es", "en"])):
    try:
        result = generate_f1_impostor_game(lang)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/generate-f1-wordle")
def generate_f1_wordle():
    try:
        result = generate_f1_wordle_game()
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/get-drivers-for-season")
def get_drivers(season: int):
    try:
        result = get_drivers_for_season(season)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/validate-grid-pilot")
def validate_grid_pilot(pilot: str, season: int):
    try:
        valid = pilot_exists_for_season(pilot, season)
        return JSONResponse(content={"valid": valid})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/get-pilot-nationality")
def get_pilot_nationality(pilot: str, season: int):
    try:
        nationality = get_nationality(pilot, season)
        return JSONResponse(content={"nationality": nationality})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/autocomplete-grid-pilot")
def autocomplete_grid_pilot(partial: str):
    try:
        result = autocomplete_pilots(partial)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/generate-top10-game")
def generate_top10_game(lang: str = Query("es", enum=["es", "en"])):
    try:
        global LANG
        LANG = lang
        result = get_random_race_and_top10()
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/validate-top10-pilot")
def validate_top10_pilot(pilot: str, raceId: int):
    try:
        result = validate_pilot_in_top10(pilot, raceId)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/generate-order-game")
def generate_order_game_endpoint(lang: str = Query("es", enum=["es", "en"])):
    try:
        ensure_order_caches_ready()
        result = generate_order_game(lang)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)



@app.get("/generate-guess-driver")
def generate_guess_driver():
    try:
        result = get_random_driver()
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/validate-guess-question")
def validate_guess_question(driverId: int, category: str, value: str = None, lang: str = Query("es", enum=["es", "en"])):
    try:
        # Simula llamada por línea de comandos
        import sys, io
        import os
        os.environ["LANG"] = lang
        sys.argv = ["validate_guess_driver_question.py", str(driverId), category]
        if value:
            sys.argv.append(value)


        stdout_backup = sys.stdout
        sys.stdout = io.StringIO()

        validate_question_main()

        sys.stdout.seek(0)
        output = sys.stdout.read()
        sys.stdout = stdout_backup

        return JSONResponse(content=json.loads(output))
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/recommend-guess-values")
def recommend_guess_values(category: str, lang: str = Query("es", enum=["es", "en"])):
    import os
    os.environ["LANG"] = lang
    result = get_recommendations(category)

    if category == "nationality":
        if lang == "en":
            # Convertir nacionalidades en español ➜ inglés
            result = [NATIONALITY_TRANSLATIONS_EN.get(n, n) for n in result]
        elif lang == "es":
            # Asegurar traducción al español
            result = [NATIONALITY_TRANSLATIONS.get(n, n) for n in result]

    return JSONResponse(content=result)


@app.get("/autocomplete-pilot")
def autocomplete_pilot(partial: str):
    try:
        result = recommend_pilots(partial)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/generate-rondo")
def generate_rondo(lang: str = Query("es", enum=["es", "en"])):
    try:
        rosco = generar_rosco(lang)
        return JSONResponse(content=rosco)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/validate-rondo-answer")
def validate_rondo_answer(letter: str, question: str, answer: str):
    try:
        valid = validate_answer(letter, question, answer)
        return {"valid": valid}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/generate-team-guess")
def generate_team_guess():
    try:
        result = generate_team_guess_data()
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/autocomplete-team")
def autocomplete_team(partial: str):
    try:
        result = autocomplete_teams(partial)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/generate-two-teams-one-driver")
def generate_two_teams_one_driver():
    try:
        result = get_team_pairs_with_common_drivers()
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/validate-two-teams-driver")
def validate_two_teams_driver(driver: str, teamA: str, teamB: str):
    try:
        valid = validate_driver(driver, teamA, teamB)
        return JSONResponse(content={"valid": valid})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/generate-wordsearch")
def generate_wordsearch():
    try:
        result = generate_wordsearch_grid()
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/validate-tikitaka-pilot")
def validate_tikitaka_pilot(
    row: str = Query(...),
    col: str = Query(...),
    piloto: str = Query(...),
    sinceYear: Optional[int] = Query(None),
    endYear: Optional[int] = Query(None)
):
    try:
        result = validate_pilot(
            row_criteria_code=row,
            column_criteria_code=col,
            piloto=piloto,
            since_year=sinceYear,
            end_year=endYear
        )
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"is_valid": False, "reason": str(e)}
        )

@app.get("/autocomplete-pilot-tictactoe")
def autocomplete_pilot(partial: str):
    try:
        results = buscar_pilotos(partial)
        return JSONResponse(content=results)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


# === Quiz ===

@app.get("/generate-quiz-questions")
def generate_quiz_questions(
    lang: str = Query("es", enum=["es", "en"]),
    category: Optional[str] = Query(None)
):
    try:
        questions = generar_preguntas_desde_main(lang=lang, categoria=category)
        return JSONResponse(content=questions)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/generate-quiz-regulation")
def generate_quiz_regulation(lang: str = Query("es"), category: Optional[str] = Query(None)):
    try:
        preguntas = generar_preguntas_reglamento_desde_main(lang=lang, category=category)
        return JSONResponse(content=preguntas)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/generate-quiz-strategy")
def generate_quiz_strategy(lang: str = Query("es"), category: Optional[str] = Query(None)):
    try:
        preguntas = generar_preguntas_estrategia_desde_main(lang=lang, category=category)
        return JSONResponse(content=preguntas)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/generate-quiz-physics")
def generate_quiz_physics(lang: str = Query("es"), category: Optional[str] = Query(None)):
    try:
        preguntas = generar_preguntas_fisica_desde_main(lang=lang, category=category)
        return JSONResponse(content=preguntas)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/generate-quiz-teamradios")
def generate_quiz_teamradios(lang: str = Query("es")):
    try:
        preguntas = generar_preguntas_teamradios(lang=lang)
        return JSONResponse(content=preguntas)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

####New Quiz Races GP#####

from threading import RLock

_PREBUILT: dict[tuple[str,str], list] = {}
_TITLES: dict[str, dict] = {}
_PREBUILT_LOCK = RLock()

def _get_titles(gp_name: str) -> dict:
    t = _TITLES.get(gp_name)
    if t is None:
        t = _localize_gp_titles(gp_name)
        _TITLES[gp_name] = t
    return t

def _get_prebuilt(gp_name: str, lang: str) -> list[dict]:
    key = (gp_name, lang)
    qlist = _PREBUILT.get(key)
    if qlist is not None:
        return qlist
    with _PREBUILT_LOCK:
        qlist = _PREBUILT.get(key)
        if qlist is None:
            fn = GP_FUNCS.get(gp_name)
            if not fn:
                raise ValueError(f"GP no encontrado: {gp_name}")
            items = fn()
            try:
                qlist = _export(items, lang, source=f"GP:{gp_name}")
            except Exception as e:
                # Evita crash en startup y deja rastro claro
                print(f"[WARN] export falló para '{gp_name}' ({lang}): {e}")
                qlist = []
            _PREBUILT[key] = qlist
    return qlist


def _pick_10(exported: list[dict], rng: random.Random) -> list[dict]:
    if not exported:
        return []
    chosen = [exported[0]] + (rng.sample(exported[1:], 9) if len(exported) > 10 else list(exported[1:]))
    out = []
    for q in chosen:
        q2 = dict(q)
        key_options = "options" if "options" in q2 else ("choices" if "choices" in q2 else "answers")
        opts = list(q2.get(key_options, []))
        rng.shuffle(opts)
        q2[key_options] = opts
        out.append(q2)
    return out


def build_game_from_gp_fast(gp_name: str, lang: str, rng: random.Random) -> dict:
    exported = _get_prebuilt(gp_name, lang)      # <- usa el caché lazy
    questions = _pick_10(exported, rng)
    titles = _get_titles(gp_name)
    return {
        "gp": gp_name,
        "gp_en": titles["en"],
        "gp_es": titles["es"],
        "lang": lang,
        "count": len(questions),
        "questions": questions
    }

from itertools import cycle

_PREBUILT_GAMES: dict[tuple[str,str], cycle] = {}

def _to_payload_items(exported: list[dict], lang: str, rng: random.Random) -> list[dict]:
    """
    Convierte la lista exportada (question/answers/correctAnswer/knowledgeLevel)
    en el payload final del endpoint, barajando las respuestas.
    """
    out = []
    for q in exported:
        question = q.get("question")
        answers  = list(q.get("answers") or [])
        correct  = q.get("correctAnswer")

        if not question or not answers:
            continue

        # garantiza que la correcta esté incluida
        if correct and correct not in answers:
            answers.append(correct)

        rng.shuffle(answers)

        out.append({
            "question": question,
            "answers": answers,
            "correctAnswer": correct if isinstance(correct, str) else None,
            "knowledgeLevel": q.get("knowledgeLevel", q.get("level", q.get("lvl", 2))),
            "category": q.get("category", "F1GrandPrix"),
            "language": lang,
        })
    return out


def _pick_k(items: list[dict], k: int, rng: random.Random) -> list[dict]:
    """Primera fija + resto aleatorio, si hay más de k."""
    if not items:
        return []
    if len(items) <= k:
        # primera fija + resto barajado
        first = items[0]
        tail = items[1:]
        rng.shuffle(tail)
        return [first] + tail
    # >= k: primera fija + (k-1) aleatorias del resto
    first = items[0]
    tail = items[1:]
    picked = rng.sample(tail, k=k-1)
    return [first] + picked


def _prebuild_games(gp_name: str, lang: str, k: int = 8):
    exported = _get_prebuilt(gp_name, lang)
    titles = _get_titles(gp_name)
    rng = random.Random(hash((gp_name, lang)) & 0xffffffff)

    # Si no hay preguntas exportables, prepara ciclo con juego vacío
    if not exported:
        empty = [{
            "gp": gp_name,
            "gp_en": titles["en"],
            "gp_es": titles["es"],
            "lang": lang,
            "count": 0,
            "questions": []
        }]
        return cycle(empty)

    # 1) payload base (ya con answers barajadas)
    payload_all = _to_payload_items(exported, lang, rng)
    # 2) pre-construye K juegos rotativos
    games = []
    for _ in range(k):
        picked = _pick_k(payload_all, k=10, rng=rng)  # 10 preguntas o menos si no alcanza
        games.append({
            "gp": gp_name,
            "gp_en": titles["en"],
            "gp_es": titles["es"],
            "lang": lang,
            "count": len(picked),
            "questions": picked,   # <- YA EN FORMATO FINAL
        })
    return cycle(games)



def _get_game(gp_name: str, lang: str):
    key = (gp_name, lang)
    with _PREBUILT_LOCK:
        cyc = _PREBUILT_GAMES.get(key)
        if cyc is None:
            _PREBUILT_GAMES[key] = _prebuild_games(gp_name, lang, k=8)
            cyc = _PREBUILT_GAMES[key]
        return next(cyc)



# --- NUEVO: preguntas tipo "Race Review" por GP ---
from typing import Optional
@app.get("/generate-quiz-gp")
def generate_quiz_gp(lang: str = Query("es", enum=["es","en"]), gp: Optional[str] = Query(None)):
    try:
        gp_name = gp or GP_KEYS[random.randrange(len(GP_KEYS))]
        game = _get_game(gp_name, lang)  # <- ya viene listo para enviar
        return {
            "gp_es": game.get("gp_es", game.get("gp")),
            "gp_en": game.get("gp_en", game.get("gp")),
            "questions": game["questions"]
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)





@app.get("/validate-category")
def validate_category_endpoint(
    category: str = Query(...),
    answer: str = Query(...),
    letter: str = Query(...),
    lang: str = Query("es", enum=["es", "en"])
):
    try:
        result = validate_category_answer(category, answer, letter, lang)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"valid": False, "error": str(e)}, status_code=500)

@app.get("/category-letter-cache")
def get_category_letter_cache(lang: str = Query("es", enum=["es", "en"])):
    return JSONResponse(content=CATEGORY_CACHE.get(lang, {}))


@app.get("/generate-quiz-genericstats")
def generate_quiz_genericstats(lang: str = Query("es", enum=["es", "en"])):
    preguntas = generar_preguntas_genericstats_desde_main(lang=lang)
    return JSONResponse(content=preguntas)


# === Main app ===
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
