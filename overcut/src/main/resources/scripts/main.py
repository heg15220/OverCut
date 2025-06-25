from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import uvicorn

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


import sys
import io
import json

app = FastAPI()

# === /generate ===
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

# === Main app ===
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
