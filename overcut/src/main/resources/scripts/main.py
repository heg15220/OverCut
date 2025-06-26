from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import uvicorn
import os
from typing import Optional
import pickle
import random
from pathlib import Path
import subprocess


from generate_drivers_connections import generate_game as generate_drivers_game
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


import sys
import io
import json

app = FastAPI()



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

def cache_file_for(since_year: int, end_year: Optional[int]):
    suffix = f"{since_year}_{end_year if end_year is not None else 'plus'}"
    return CACHE_DIR / f"configs_cache_{suffix}.pkl"

@app.on_event("startup")
def load_criteria_cache():
    for since, end in CACHED_RANGES:
        path = cache_file_for(since, end)
        if not path.exists():
            print(f"[WARN] Falta caché para rango {since}-{end}: {path}")
            continue
        CONFIGS_CACHE[(since, end)] = pickle.loads(path.read_bytes())
    print(f"[startup] Caché de criterios TikiTaka cargado: {list(CONFIGS_CACHE.keys())}")

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
        result = generate_drivers_game()
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
        sys.argv = ["validate_guess_driver_question.py", str(driverId), category]
        if value:
            sys.argv.append(value)

        import os
        os.environ["LANG"] = lang

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
    try:
        import os
        os.environ["LANG"] = lang
        result = get_recommendations(category)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


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




# === Main app ===
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
