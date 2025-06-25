from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import uvicorn

from generate_drivers_connections import generate_game as generate_drivers_game
from generate_crossword import main as generate_crossword_main
from validate_crossword_word import validate_word_and_clue

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

# === Main app ===
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
