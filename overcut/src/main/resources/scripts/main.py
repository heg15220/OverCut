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






from generate_top10quali_game import get_random_race_and_top10quali
from validate_top10quali_pilot import validate_pilot_in_top10quali
from generate_driver_season_game import get_driver_season_game


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
    yield


app = FastAPI(lifespan=lifespan)



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


@app.get("/generate-top10quali-game")
def generate_top10quali_game(lang: str = Query("es", enum=["es", "en"])):
    try:
        result = get_random_race_and_top10quali(lang)  # ✅ PASAMOS lang
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/validate-top10quali-pilot")
def validate_top10quali_pilot(pilot: str, raceId: int):
    try:
        result = validate_pilot_in_top10quali(pilot, raceId)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/generate-driver-season-game")
def generate_driver_season_game(lang: str = Query("es", enum=["es", "en"])):
    try:
        global LANG
        LANG = lang
        os.environ["LANG"] = lang  # ✅ importante para consistencia
        result = get_driver_season_game()
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


# === Main app ===
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
