import sys
import random
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración base de datos (ajusta a tus credenciales reales)
DB_URL = 'mysql+pymysql://root:root@localhost/f1db'
engine = create_engine(DB_URL, pool_size=25, max_overflow=20, future=True)
Session = sessionmaker(bind=engine)

# === FUNCIONES DE PISTAS SOFISTICADAS ===

def pista_piloto(session, piloto, lang):
    q_titles = text("""
        SELECT COUNT(*) AS titles FROM driverstandings
        WHERE driverId = :driverId AND position = 1
    """)
    titles = session.execute(q_titles, {"driverId": piloto["driverId"]}).mappings().fetchone()["titles"]
    q_victories = text("""
        SELECT COUNT(*) AS victories FROM results
        WHERE driverId = :driverId AND positionOrder = 1
    """)
    victories = session.execute(q_victories, {"driverId": piloto["driverId"]}).mappings().fetchone()["victories"]

    if lang == "es":
        clue = f"Piloto de F1"
        if titles > 0:
            clue += f", campeón del mundo {titles} vez/veces"
        if victories > 0:
            clue += f", ganador de {victories} carreras"
        clue += f". Nacionalidad: {piloto['nationality']}."
    else:
        clue = f"F1 driver"
        if titles > 0:
            clue += f", world champion {titles} time(s)"
        if victories > 0:
            clue += f", {victories} Grand Prix wins"
        clue += f". Nationality: {piloto['nationality']}."
    return clue

def pista_equipo(session, equipo, lang):
    q_titles = text("""
        SELECT COUNT(*) AS titles FROM constructorstandings
        WHERE constructorId = :constructorId AND position = 1
    """)
    titles = session.execute(q_titles, {"constructorId": equipo["constructorId"]}).mappings().fetchone()["titles"]

    if lang == "es":
        clue = f"Escudería de F1"
        if titles > 0:
            clue += f", campeona del mundo {titles} vez/veces"
        clue += f". Nacionalidad: {equipo['nationality']}."
    else:
        clue = f"F1 team"
        if titles > 0:
            clue += f", world champion {titles} time(s)"
        clue += f". Nationality: {equipo['nationality']}."
    return clue

def pista_circuito(session, circuito, lang):
    q_races = text("""
        SELECT COUNT(*) AS n FROM races WHERE circuitId = :circuitId
    """)
    races = session.execute(q_races, {"circuitId": circuito["circuitId"]}).mappings().fetchone()["n"]
    if lang == "es":
        clue = f"Circuito de F1 en {circuito['country']}."
        clue += f" Ha acogido {races} carreras."
    else:
        clue = f"F1 circuit in {circuito['country']}."
        clue += f" Hosted {races} Grands Prix."
    return clue

# === SELECCIÓN DE PALABRAS CON DATOS Y PISTAS ===

def obtener_pilotos(session, n, lang):
    q = text("SELECT driverId, forename, surname, nationality FROM drivers ORDER BY RAND() LIMIT :n")
    result = session.execute(q, {"n": n}).mappings()
    words = []
    for r in result:
        palabra = (r["forename"] + r["surname"]).replace(" ", "").replace("-", "").upper()
        if len(palabra) < 3:
            continue
        clue = pista_piloto(session, r, lang)
        words.append({"word": palabra, "clue": clue, "type": "driver"})
    return words

def obtener_equipos(session, n, lang):
    q = text("SELECT constructorId, name, nationality FROM constructors ORDER BY RAND() LIMIT :n")
    result = session.execute(q, {"n": n}).mappings()
    words = []
    for r in result:
        palabra = r["name"].replace(" ", "").replace("-", "").upper()
        if len(palabra) < 3:
            continue
        clue = pista_equipo(session, r, lang)
        words.append({"word": palabra, "clue": clue, "type": "team"})
    return words

def obtener_circuitos(session, n, lang):
    q = text("SELECT circuitId, circuitRef, country FROM circuits ORDER BY RAND() LIMIT :n")
    result = session.execute(q, {"n": n}).mappings()
    words = []
    for r in result:
        palabra = r["circuitRef"].replace(" ", "").replace("-", "").upper()
        if len(palabra) < 3:
            continue
        clue = pista_circuito(session, r, lang)
        words.append({"word": palabra, "clue": clue, "type": "circuit"})
    return words

# === ALGORITMO DE GENERACIÓN DE CRUCIGRAMA ===

def crea_grid(rows, cols):
    return [["" for _ in range(cols)] for _ in range(rows)]

def puede_colocar(palabra, grid, row, col, direction):
    l = len(palabra)
    rows = len(grid)
    cols = len(grid[0])
    if direction == "HORIZONTAL":
        if col + l > cols:
            return False
        for i in range(l):
            c = grid[row][col + i]
            if c != "" and c != palabra[i]:
                return False
        return True
    else:
        if row + l > rows:
            return False
        for i in range(l):
            c = grid[row + i][col]
            if c != "" and c != palabra[i]:
                return False
        return True

def coloca_en_grid(palabra, grid, row, col, direction):
    l = len(palabra)
    if direction == "HORIZONTAL":
        for i in range(l):
            grid[row][col + i] = palabra[i]
    else:
        for i in range(l):
            grid[row + i][col] = palabra[i]

def buscar_cruce(word, grid, direction):
    rows, cols = len(grid), len(grid[0])
    l = len(word)
    for r in range(rows):
        for c in range(cols):
            for i, letter in enumerate(word):
                if direction == "HORIZONTAL":
                    if grid[r][c] == letter:
                        col_start = c - i
                        if 0 <= col_start and col_start + l <= cols:
                            if puede_colocar(word, grid, r, col_start, direction):
                                return (r, col_start)
                else:
                    if grid[r][c] == letter:
                        row_start = r - i
                        if 0 <= row_start and row_start + l <= rows:
                            if puede_colocar(word, grid, row_start, c, direction):
                                return (row_start, c)
    return None

def coloca_palabras_en_grid(palabras, rows, cols):
    grid = crea_grid(rows, cols)
    posiciones = []
    # ¡Filtra primero!
    palabras = [p for p in palabras if len(p["word"]) <= cols and len(p["word"]) <= rows]
    if not palabras:
        raise Exception("No hay palabras válidas que quepan en el grid.")
    # Colocar la primera palabra en el centro
    pw = palabras[0]["word"]
    start_row = rows // 2
    start_col = max(0, (cols - len(pw)) // 2)
    coloca_en_grid(pw, grid, start_row, start_col, "HORIZONTAL")
    posiciones.append({
        "word": pw,
        "clue": palabras[0]["clue"],
        "row": start_row,
        "col": start_col,
        "direction": "HORIZONTAL",
        "type": palabras[0]["type"]
    })
    for idx in range(1, len(palabras)):
        palabra = palabras[idx]["word"]
        clue = palabras[idx]["clue"]
        tipo = palabras[idx]["type"]
        direction = "VERTICAL" if idx % 2 else "HORIZONTAL"
        pos = buscar_cruce(palabra, grid, direction)
        placed = False
        if pos:
            row, col = pos
            coloca_en_grid(palabra, grid, row, col, direction)
            posiciones.append({
                "word": palabra,
                "clue": clue,
                "row": row,
                "col": col,
                "direction": direction,
                "type": tipo
            })
            placed = True
        else:
            for r in range(rows):
                for c in range(cols):
                    if puede_colocar(palabra, grid, r, c, direction):
                        coloca_en_grid(palabra, grid, r, c, direction)
                        posiciones.append({
                            "word": palabra,
                            "clue": clue,
                            "row": r,
                            "col": c,
                            "direction": direction,
                            "type": tipo
                        })
                        placed = True
                        break
                if placed:
                    break
    return posiciones

def main():
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Se requieren argumentos: filas columnas idioma"}))
        sys.exit(1)
    rows = int(sys.argv[1])
    cols = int(sys.argv[2])
    lang = sys.argv[3]

    try:
        with Session() as session:
            total_words = min((rows + cols) // 2, 10)
            num_pilotos = total_words // 3
            num_equipos = total_words // 3
            num_circuitos = total_words - num_pilotos - num_equipos

            palabras = []
            palabras.extend(obtener_pilotos(session, num_pilotos, lang))
            palabras.extend(obtener_equipos(session, num_equipos, lang))
            palabras.extend(obtener_circuitos(session, num_circuitos, lang))
            random.shuffle(palabras)

            palabras_grid = coloca_palabras_en_grid(palabras, rows, cols)
            print(json.dumps({"words": palabras_grid}, ensure_ascii=False))
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
